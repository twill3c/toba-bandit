// バンディット本体(F-02 / F-03 / F-04)。すべて純関数・rng は状態で持ち回る。

import type { StratKind, StratState } from "./types";
import { randInt, rngInit, rngNext } from "./prng";

export const K = 5;
const REGRET_CAP = 512;
const RECENT_CAP = 1000;

/** 台の生成: [0.15, 0.85]・相互 ≥0.05 差(棄却・予算付き)・決定的 */
export function makeArms(seed: number): number[] {
  let state = rngInit(seed);
  const arms: number[] = [];
  for (let guard = 0; arms.length < K && guard < 10000; guard++) {
    const r = rngNext(state);
    state = r.state;
    const p = 0.15 + r.value * 0.7;
    if (arms.every((q) => Math.abs(q - p) >= 0.05)) arms.push(p);
  }
  return arms;
}

export function bestArm(arms: number[]): number {
  let best = 0;
  for (let i = 1; i < arms.length; i++) if (arms[i] > arms[best]) best = i;
  return best;
}

/** ベルヌーイ報酬(G-01) */
export function pull(
  p: number,
  rngState: number,
): { reward: 0 | 1; state: number } {
  const r = rngNext(rngState);
  return { reward: r.value < p ? 1 : 0, state: r.state };
}

/** 標準正規(Box-Muller)。Marsaglia-Tsang 用 */
function normalSample(rngState: number): { value: number; state: number } {
  const u1 = rngNext(rngState);
  const u2 = rngNext(u1.state);
  const v = Math.sqrt(-2 * Math.log(Math.max(u1.value, 1e-12)));
  return { value: v * Math.cos(2 * Math.PI * u2.value), state: u2.state };
}

/** ガンマ分布(shape ≥ 1・scale 1)。Marsaglia-Tsang 法(棄却・予算付き) */
function gammaSample(
  shape: number,
  rngState: number,
): { value: number; state: number } {
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  let state = rngState;
  for (let guard = 0; guard < 100; guard++) {
    const n = normalSample(state);
    state = n.state;
    const v = (1 + c * n.value) ** 3;
    if (v <= 0) continue;
    const u = rngNext(state);
    state = u.state;
    if (
      Math.log(Math.max(u.value, 1e-12)) <
      0.5 * n.value * n.value + d - d * v + d * Math.log(v)
    ) {
      return { value: d * v, state };
    }
  }
  // 予算切れ(実際にはまず起きない)は期待値で代用
  return { value: shape, state };
}

/** Beta(a, b) 標本(Thompson 用・a, b ≥ 1) */
export function betaSample(
  a: number,
  b: number,
  rngState: number,
): { value: number; state: number } {
  const ga = gammaSample(a, rngState);
  const gb = gammaSample(b, ga.state);
  return { value: ga.value / (ga.value + gb.value), state: gb.state };
}

export function newStrat(seed: number): StratState {
  return {
    counts: new Array(K).fill(0),
    wins: new Array(K).fill(0),
    t: 0,
    rngState: rngInit(seed),
    cumRegret: 0,
    regretHistory: [],
    recentArms: [],
    totalReward: 0,
    lastArm: null,
  };
}

function argmax(vals: number[]): number {
  let best = 0;
  for (let i = 1; i < vals.length; i++) if (vals[i] > vals[best]) best = i;
  return best;
}

/**
 * 腕の選択(F-03)。全戦略とも未試行腕を最小 index から優先(縁の仕様化・N-05)。
 * 乱数消費は戦略ごとに定義どおり(決定論)
 */
export function selectArm(
  kind: StratKind,
  s: StratState,
  epsilon: number,
): { arm: number; rngState: number } {
  const untried = s.counts.findIndex((n) => n === 0);
  if (untried !== -1) return { arm: untried, rngState: s.rngState };

  if (kind === "egreedy") {
    const roll = rngNext(s.rngState);
    if (roll.value < epsilon) {
      const ri = randInt(roll.state, 0, K - 1);
      return { arm: ri.value, rngState: ri.state };
    }
    return {
      arm: argmax(s.counts.map((n, i) => s.wins[i] / n)),
      rngState: roll.state,
    };
  }

  if (kind === "ucb") {
    const ucb = s.counts.map(
      (n, i) => s.wins[i] / n + Math.sqrt((2 * Math.log(s.t)) / n),
    );
    return { arm: argmax(ucb), rngState: s.rngState };
  }

  // thompson
  let state = s.rngState;
  const samples: number[] = [];
  for (let i = 0; i < K; i++) {
    const b = betaSample(s.wins[i] + 1, s.counts[i] - s.wins[i] + 1, state);
    state = b.state;
    samples.push(b.value);
  }
  return { arm: argmax(samples), rngState: state };
}

function pushCapped(xs: number[], v: number, cap: number): number[] {
  const next = xs.length >= cap ? xs.filter((_, i) => i % 2 === 0) : [...xs];
  next.push(v);
  return next;
}

/** 1 プレイ(純関数): 選択 → 報酬 → 統計と擬似後悔の更新 */
export function stepStrat(
  kind: StratKind,
  s: StratState,
  arms: number[],
  epsilon: number,
): StratState {
  const sel = selectArm(kind, s, epsilon);
  const res = pull(arms[sel.arm], sel.rngState);
  const counts = [...s.counts];
  const wins = [...s.wins];
  counts[sel.arm]++;
  wins[sel.arm] += res.reward;
  const cumRegret = s.cumRegret + (arms[bestArm(arms)] - arms[sel.arm]);
  const recentArms =
    s.recentArms.length >= RECENT_CAP
      ? [...s.recentArms.slice(1), sel.arm]
      : [...s.recentArms, sel.arm];
  return {
    counts,
    wins,
    t: s.t + 1,
    rngState: res.state,
    cumRegret,
    regretHistory: pushCapped(s.regretHistory, cumRegret, REGRET_CAP),
    recentArms,
    totalReward: s.totalReward + res.reward,
    lastArm: sel.arm,
  };
}

import { describe, expect, it } from "vitest";
import { bestArm, makeArms, newStrat, stepStrat } from "@/core/bandit";
import type { StratKind, StratState } from "@/core/types";

// T-100 / T-101 / T-102(G-03 / G-04 / G-05)
// 閾値・予算は較正実験の証拠つきで確定する(TEST_SPEC 実行規約)

const ARMS = makeArms(1);
const BEST = bestArm(ARMS);

function run(
  kind: StratKind,
  seed: number,
  n: number,
  epsilon: number,
): { state: StratState; snapshots: Map<number, number> } {
  let s = newStrat(seed);
  const snapshots = new Map<number, number>();
  for (let i = 1; i <= n; i++) {
    s = stepStrat(kind, s, ARMS, epsilon);
    if (i === 500 || i === n) snapshots.set(i, s.cumRegret / i);
  }
  return { state: s, snapshots };
}

describe("数理ゲート", () => {
  // T-100 / G-03: 学習する戦略の平均後悔減衰 + 最良腕率
  it("G-03: UCB/Thompson は平均後悔が減衰し、最終 1,000 プレイの最良腕率 ≥ 80%", () => {
    for (const kind of ["ucb", "thompson"] as const) {
      const { state, snapshots } = run(kind, 1, 5000, 0);
      expect(snapshots.get(5000)!).toBeLessThan(snapshots.get(500)!);
      const recent = state.recentArms;
      expect(recent.length).toBe(1000);
      const rate = recent.filter((a) => a === BEST).length / recent.length;
      expect(rate).toBeGreaterThanOrEqual(0.8);
    }
  });

  // T-101 / G-04: 固定 ε の下げ止まり
  it("G-04: ε=0.2 の ε-greedy の平均後悔が UCB の 2 倍超に残る", () => {
    const eg = run("egreedy", 1, 5000, 0.2).snapshots.get(5000)!;
    const ucb = run("ucb", 1, 5000, 0).snapshots.get(5000)!;
    expect(eg).toBeGreaterThan(ucb * 2);
  });

  // T-102 / G-05: 決定論
  it("G-05: 同一シードの 2 回の実行が全履歴で深い等値", () => {
    for (const kind of ["egreedy", "ucb", "thompson"] as const) {
      const a = run(kind, 3, 300, 0.1).state;
      const b = run(kind, 3, 300, 0.1).state;
      expect(a).toEqual(b);
    }
  });
});

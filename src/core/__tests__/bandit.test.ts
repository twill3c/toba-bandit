import { describe, expect, it } from "vitest";
import {
  bestArm,
  betaSample,
  makeArms,
  newStrat,
  pull,
  selectArm,
  stepStrat,
} from "@/core/bandit";
import { rngInit } from "@/core/prng";

// T-010 / T-020〜T-023 / T-030 / T-040

describe("台の生成(F-02)", () => {
  // T-010
  it("5 腕・[0.15,0.85]・相互 ≥0.05 差・最良腕一意・決定的", () => {
    const arms = makeArms(1);
    expect(arms.length).toBe(5);
    expect(arms).toEqual(makeArms(1));
    expect(arms).not.toEqual(makeArms(2));
    for (const p of arms) {
      expect(p).toBeGreaterThanOrEqual(0.15);
      expect(p).toBeLessThanOrEqual(0.85);
    }
    for (let i = 0; i < arms.length; i++) {
      for (let j = i + 1; j < arms.length; j++) {
        expect(Math.abs(arms[i] - arms[j])).toBeGreaterThanOrEqual(0.05);
      }
    }
    const best = bestArm(arms);
    expect(arms.filter((p) => p === arms[best]).length).toBe(1);
  });
});

describe("選択則(F-03 / G-02)", () => {
  // T-020: 未試行優先(全戦略)
  it("未試行腕があれば最小 index の未試行腕を選ぶ", () => {
    for (const kind of ["egreedy", "ucb", "thompson"] as const) {
      let s = newStrat(1);
      // 腕 0 だけ試行済みにする
      s = { ...s, counts: [3, 0, 0, 0, 0], wins: [2, 0, 0, 0, 0], t: 3 };
      expect(selectArm(kind, s, 0).arm).toBe(1);
    }
  });

  // T-021: ε=0 の貪欲(タイ最小 index)
  it("ε=0 で平均最大の腕・タイは最小 index", () => {
    let s = newStrat(1);
    s = {
      ...s,
      counts: [4, 4, 4, 4, 4],
      wins: [1, 3, 3, 2, 0], // 平均: .25 .75 .75 .5 0 → タイ(1,2)は 1
      t: 20,
    };
    expect(selectArm("egreedy", s, 0).arm).toBe(1);
  });

  // T-022: UCB1 指数の手計算一致
  it("UCB1 は 平均 + √(2ln t / n) の argmax を選ぶ", () => {
    let s = newStrat(1);
    // n = [10, 2, 5, 5, 5], 平均 = [0.6, 0.5, 0.4, 0.4, 0.4], t = 27
    s = {
      ...s,
      counts: [10, 2, 5, 5, 5],
      wins: [6, 1, 2, 2, 2],
      t: 27,
    };
    // テスト内独立計算
    const ucb = s.counts.map(
      (n, i) => s.wins[i] / n + Math.sqrt((2 * Math.log(s.t)) / n),
    );
    const expected = ucb.indexOf(Math.max(...ucb));
    expect(selectArm("ucb", s, 0).arm).toBe(expected);
    // 探索項が効いて試行の少ない腕 1 が選ばれるはず(前提の確認)
    expect(expected).toBe(1);
  });

  // T-023: Thompson の Beta 標本の性質
  it("Beta 標本は [0,1]・決定論・成功続きの腕が高く出る傾向", () => {
    let state = rngInit(7);
    let hiSum = 0;
    let loSum = 0;
    for (let i = 0; i < 200; i++) {
      const hi = betaSample(20, 2, state); // 成功 19 / 失敗 1
      state = hi.state;
      const lo = betaSample(2, 20, state);
      state = lo.state;
      expect(hi.value).toBeGreaterThanOrEqual(0);
      expect(hi.value).toBeLessThanOrEqual(1);
      hiSum += hi.value;
      loSum += lo.value;
    }
    expect(hiSum / 200).toBeGreaterThan(0.8);
    expect(loSum / 200).toBeLessThan(0.2);
    // 決定論
    const a = betaSample(5, 3, rngInit(9));
    const b = betaSample(5, 3, rngInit(9));
    expect(a).toEqual(b);
  });
});

describe("報酬と後悔(G-01 / F-04)", () => {
  // T-030: ベルヌーイ pull の標本平均
  it("2,000 回の pull の標本平均が p±0.05・決定論", () => {
    for (const p of [0.2, 0.5, 0.8]) {
      let state = rngInit(11);
      let sum = 0;
      for (let i = 0; i < 2000; i++) {
        const r = pull(p, state);
        state = r.state;
        expect([0, 1]).toContain(r.reward);
        sum += r.reward;
      }
      expect(Math.abs(sum / 2000 - p)).toBeLessThan(0.05);
    }
    const a = pull(0.5, rngInit(3));
    expect(a).toEqual(pull(0.5, rngInit(3)));
  });

  // T-040: 擬似後悔の加算
  it("最良腕なら後悔 +0・劣後腕なら +(p*−p)", () => {
    const arms = makeArms(1);
    const best = bestArm(arms);
    // ε=0 で全腕試行済み・最良腕の平均を最大にして「最良腕を選ばせる」
    let s = newStrat(1);
    s = {
      ...s,
      counts: [1, 1, 1, 1, 1],
      wins: arms.map((_, i) => (i === best ? 1 : 0)),
      t: 5,
    };
    const after = stepStrat("egreedy", s, arms, 0);
    expect(after.cumRegret).toBeCloseTo(s.cumRegret, 12);
    // 劣後腕を選ばせる(最良腕以外の平均を最大に)
    const worse = (best + 1) % arms.length;
    let s2 = newStrat(1);
    s2 = {
      ...s2,
      counts: [1, 1, 1, 1, 1],
      wins: arms.map((_, i) => (i === worse ? 1 : 0)),
      t: 5,
    };
    const after2 = stepStrat("egreedy", s2, arms, 0);
    expect(after2.cumRegret).toBeCloseTo(arms[best] - arms[worse], 12);
  });
});

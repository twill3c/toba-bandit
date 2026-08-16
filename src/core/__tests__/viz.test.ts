import { describe, expect, it } from "vitest";
import { STRAT_COLORS, regretCurvePoints } from "@/core/viz";

// T-050(F-05): 累積後悔カーブ(線形軸)

describe("viz", () => {
  it("regretCurvePoints は非負のみ受理し 0..max へ線形写像する", () => {
    expect(regretCurvePoints([], 100, 50)).toBe("");
    const pts = regretCurvePoints([0, 5, 10], 100, 50)
      .split(" ")
      .map((p) => p.split(",").map(Number));
    expect(pts.map((p) => p[0])).toEqual([0, 50, 100]);
    // 0 → 下端(y=50)、max → 上端(y=0)
    expect(pts[0][1]).toBeCloseTo(50, 6);
    expect(pts[1][1]).toBeCloseTo(25, 6);
    expect(pts[2][1]).toBeCloseTo(0, 6);
    // 全ゼロ列は下端の水平線
    const flat = regretCurvePoints([0, 0], 100, 50)
      .split(" ")
      .map((p) => Number(p.split(",")[1]));
    for (const y of flat) expect(y).toBeCloseTo(50, 6);
    expect(() => regretCurvePoints([1, -1], 100, 50)).toThrow();
  });

  it("STRAT_COLORS は 3 戦略の #rrggbb", () => {
    expect(Object.keys(STRAT_COLORS).sort()).toEqual([
      "egreedy",
      "thompson",
      "ucb",
    ]);
    for (const c of Object.values(STRAT_COLORS)) {
      expect(c).toMatch(/^#[0-9a-f]{6}$/);
    }
  });
});

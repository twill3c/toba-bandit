// 可視化用の純関数(F-05)。

import type { StratKind } from "./types";

export const STRAT_COLORS: Record<StratKind, string> = {
  egreedy: "#3987e5",
  ucb: "#d95926",
  thompson: "#199e70",
};

export const STRAT_NAMES: Record<StratKind, string> = {
  egreedy: "ε-greedy",
  ucb: "UCB1",
  thompson: "Thompson",
};

/**
 * 累積後悔カーブの SVG points(T-050)。線形軸・0..max へ正規化(0 = 下端)。
 * 後悔は非負なので負値は契約違反として例外にする
 */
export function regretCurvePoints(
  vals: number[],
  width: number,
  height: number,
): string {
  if (vals.length === 0) return "";
  for (const v of vals) {
    if (v < 0) throw new Error(`regretCurvePoints: 負値 ${v}`);
  }
  const max = Math.max(...vals);
  const dx = vals.length > 1 ? width / (vals.length - 1) : 0;
  return vals
    .map((v, i) => {
      const t = max === 0 ? 0 : v / max;
      return `${i * dx},${(1 - t) * height}`;
    })
    .join(" ");
}

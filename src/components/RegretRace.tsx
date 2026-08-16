"use client";

// 累積後悔レース(F-05)。3 系列を共通の線形スケールで描き、直ラベルで識別。

import type { StratKind, StratState } from "@/core/types";
import { STRAT_COLORS, STRAT_NAMES } from "@/core/viz";
import { STRATS } from "@/lib/useCasino";

const W = 320;
const H = 120;

export function RegretRace({
  states,
}: {
  states: Record<StratKind, StratState>;
}) {
  const empty = STRATS.every((k) => states[k].regretHistory.length === 0);
  const max = Math.max(
    1e-9,
    ...STRATS.flatMap((k) => states[k].regretHistory),
  );

  const pointsOf = (xs: number[]): string => {
    if (xs.length === 0) return "";
    const dx = xs.length > 1 ? W / (xs.length - 1) : 0;
    return xs.map((v, i) => `${i * dx},${(1 - v / max) * H}`).join(" ");
  };

  const series = STRATS.map((k) => {
    const pts = pointsOf(states[k].regretHistory);
    const lastY =
      pts === "" ? H / 2 : Number(pts.split(" ").pop()!.split(",")[1]);
    return { k, pts, lastY: Math.min(Math.max(lastY, 8), H - 2) };
  }).filter((s) => s.pts !== "");
  const sorted = [...series].sort((a, b) => a.lastY - b.lastY);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].lastY - sorted[i - 1].lastY < 12) {
      sorted[i].lastY = sorted[i - 1].lastY + 12;
    }
  }

  return (
    <figure className="curve">
      <figcaption>累積後悔レース — 低いほど賢い(線形軸)</figcaption>
      <svg
        viewBox={`0 0 ${W + 84} ${H + 8}`}
        role="img"
        aria-label="3 戦略の累積後悔の推移。傾きが寝ていくのが学習の証拠"
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        <line x1={0} y1={H} x2={W} y2={H} stroke="#3a2f36" strokeWidth={1} />
        {empty ? (
          <text x={W / 2} y={H / 2} textAnchor="middle" fontSize={12} fill="#97858f">
            開帳を待機中
          </text>
        ) : (
          series.map((s) => (
            <g key={s.k}>
              <polyline
                points={s.pts}
                fill="none"
                stroke={STRAT_COLORS[s.k]}
                strokeWidth={2}
                strokeLinejoin="round"
              />
              <text x={W + 6} y={s.lastY} fontSize={11} fill={STRAT_COLORS[s.k]}>
                {STRAT_NAMES[s.k]}
              </text>
            </g>
          ))
        )}
      </svg>
    </figure>
  );
}

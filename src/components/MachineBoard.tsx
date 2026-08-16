"use client";

// 台パネル(F-06)。台ごとに戦略別の推定平均バーと試行数、真の確率マーカーを描く。

import type { StratKind, StratState } from "@/core/types";
import { bestArm } from "@/core/bandit";
import { STRAT_COLORS, STRAT_NAMES } from "@/core/viz";
import { STRATS } from "@/lib/useCasino";

export function MachineBoard({
  arms,
  states,
  showTruth,
}: {
  arms: number[];
  states: Record<StratKind, StratState>;
  showTruth: boolean;
}) {
  const best = bestArm(arms);

  return (
    <div className="machines" role="group" aria-label="スロット台の状況">
      {arms.map((p, i) => (
        <div className="machine" key={i}>
          <div className="machine-head">
            <span className="machine-name">
              🎰 台{i + 1}
              {showTruth && i === best && (
                <strong style={{ color: "var(--accent)" }}> ★最良</strong>
              )}
            </span>
            {showTruth && (
              <span className="machine-truth">p = {p.toFixed(2)}</span>
            )}
          </div>
          {STRATS.map((k) => {
            const s = states[k];
            const n = s.counts[i];
            const mean = n > 0 ? s.wins[i] / n : 0;
            return (
              <div className="est-row" key={k}>
                <span
                  className="est-label"
                  style={{ color: STRAT_COLORS[k] }}
                  title={STRAT_NAMES[k]}
                >
                  {STRAT_NAMES[k].slice(0, 2)}
                </span>
                <span className="est-bar">
                  <span
                    className="est-fill"
                    style={{
                      width: `${mean * 100}%`,
                      background: STRAT_COLORS[k],
                      opacity: s.lastArm === i ? 1 : 0.55,
                    }}
                  />
                  {showTruth && (
                    <span
                      className="truth-tick"
                      style={{ left: `${p * 100}%` }}
                    />
                  )}
                </span>
                <span className="est-count">{n}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

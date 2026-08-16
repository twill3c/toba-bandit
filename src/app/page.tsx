"use client";

import { useMemo, useState } from "react";
import { MachineBoard } from "@/components/MachineBoard";
import { RegretRace } from "@/components/RegretRace";
import { bestArm, makeArms } from "@/core/bandit";
import type { Speed } from "@/core/schedule";
import { SPEEDS } from "@/core/schedule";
import { STRAT_COLORS, STRAT_NAMES } from "@/core/viz";
import { STRATS, useCasino } from "@/lib/useCasino";

export default function Home() {
  const [armsSeed, setArmsSeed] = useState(1);
  const [epsilon, setEpsilon] = useState(0.1);
  const [showTruth, setShowTruth] = useState(false);

  const arms = useMemo(() => makeArms(armsSeed), [armsSeed]);

  return (
    <main className="app">
      <header className="header">
        <h1>toba-bandit</h1>
        <p className="subtitle">
          当たり確率は伏せられている — 3 つの戦略が同じ賭場で打ち続ける
        </p>
      </header>

      {/* key で remount して台の配置替え時に全戦略を作り直す */}
      <Floor
        key={armsSeed}
        arms={arms}
        armsSeed={armsSeed}
        epsilon={epsilon}
        onEpsilonChange={setEpsilon}
        showTruth={showTruth}
        onToggleTruth={() => setShowTruth((v) => !v)}
        onReshuffle={() => setArmsSeed((s) => s + 1)}
      />
    </main>
  );
}

function Floor({
  arms,
  armsSeed,
  epsilon,
  onEpsilonChange,
  showTruth,
  onToggleTruth,
  onReshuffle,
}: {
  arms: number[];
  armsSeed: number;
  epsilon: number;
  onEpsilonChange: (v: number) => void;
  showTruth: boolean;
  onToggleTruth: () => void;
  onReshuffle: () => void;
}) {
  const casino = useCasino(arms, armsSeed, epsilon);
  const { states } = casino;
  const best = bestArm(arms);

  return (
    <div className="layout">
      <section className="board">
        <RegretRace states={states} />
        <MachineBoard arms={arms} states={states} showTruth={showTruth} />
        <div className="controls" aria-label="実行制御">
          <div className="control-row">
            {casino.playing ? (
              <button type="button" onClick={casino.pause}>
                ⏸ 一時停止
              </button>
            ) : (
              <button type="button" onClick={casino.play}>
                ▶ 開帳
              </button>
            )}
            <button type="button" onClick={casino.stepOnce}>
              1 プレイ
            </button>
            <button type="button" onClick={casino.reset}>
              リセット
            </button>
            <button type="button" onClick={onReshuffle}>
              台の配置替え
            </button>
          </div>
          <div className="control-row" role="group" aria-label="速度">
            {SPEEDS.map((s: Speed) => (
              <button
                type="button"
                key={s}
                className={casino.speed === s ? "active" : ""}
                onClick={() => casino.setSpeed(s)}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </section>

      <aside className="panel">
        <label className="param">
          <span className="param-label">
            ε 探索率(ε-greedy のみ)
            <span className="param-value">{epsilon.toFixed(2)}</span>
          </span>
          <input
            type="range"
            min={0}
            max={0.5}
            step={0.01}
            value={epsilon}
            onChange={(e) => onEpsilonChange(Number(e.target.value))}
          />
        </label>

        <button
          type="button"
          className={showTruth ? "active" : ""}
          onClick={onToggleTruth}
          aria-pressed={showTruth}
        >
          真の当たり確率を表示 {showTruth ? "ON" : "OFF"}
        </button>

        <div className="racers">
          {STRATS.map((k) => {
            const s = states[k];
            const rate =
              s.recentArms.length > 0
                ? s.recentArms.filter((a) => a === best).length /
                  s.recentArms.length
                : 0;
            return (
              <div className="racer" key={k}>
                <span
                  className="racer-dot"
                  style={{ background: STRAT_COLORS[k] }}
                />
                <span className="racer-name">{STRAT_NAMES[k]}</span>
                <span className="racer-stat">
                  当たり {s.totalReward}
                </span>
                <span className="racer-stat">
                  後悔 {s.cumRegret.toFixed(1)}
                </span>
                <span className="racer-stat">
                  最良腕率 {(rate * 100).toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>

        <dl className="stats">
          <div>
            <dt>プレイ数</dt>
            <dd>{states.egreedy.t}</dd>
          </div>
          <div>
            <dt>台シード</dt>
            <dd>{armsSeed}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}

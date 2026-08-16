"use client";

// 賭場フック(F-07 / N-03)。3 戦略を同じフレームで 1 プレイずつ進める。
// rAF は描画のリズム、プレイは batchSize(speed) で上限(N-03)。
//
// 制約: 台(arms)変更時は呼び出し側が key で remount すること(フリート共通)。

import { useCallback, useEffect, useRef, useState } from "react";
import type { StratKind, StratState } from "@/core/types";
import { newStrat, stepStrat } from "@/core/bandit";
import type { Speed } from "@/core/schedule";
import { batchSize } from "@/core/schedule";

export const STRATS: readonly StratKind[] = ["egreedy", "ucb", "thompson"];

type States = Record<StratKind, StratState>;

function fresh(seed: number): States {
  // 戦略ごとに独立の rng 列(シードをずらす)
  return {
    egreedy: newStrat(seed),
    ucb: newStrat(seed + 101),
    thompson: newStrat(seed + 202),
  };
}

export interface Casino {
  states: States;
  playing: boolean;
  speed: Speed;
  play: () => void;
  pause: () => void;
  stepOnce: () => void;
  reset: () => void;
  setSpeed: (s: Speed) => void;
}

export function useCasino(
  arms: number[],
  seed: number,
  epsilon: number,
): Casino {
  const [states, setStates] = useState<States>(() => fresh(seed));
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>(10);

  const epsRef = useRef(epsilon);
  epsRef.current = epsilon;
  const speedRef = useRef(speed);
  speedRef.current = speed;

  const advance = useCallback(
    (n: number) => {
      setStates((cur) => {
        let eg = cur.egreedy;
        let ucb = cur.ucb;
        let th = cur.thompson;
        for (let i = 0; i < n; i++) {
          eg = stepStrat("egreedy", eg, arms, epsRef.current);
          ucb = stepStrat("ucb", ucb, arms, 0);
          th = stepStrat("thompson", th, arms, 0);
        }
        return { egreedy: eg, ucb, thompson: th };
      });
    },
    [arms],
  );

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      advance(batchSize(speedRef.current));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, advance]);

  const play = useCallback(() => setPlaying(true), []);
  const pause = useCallback(() => setPlaying(false), []);
  const stepOnce = useCallback(() => {
    setPlaying(false);
    advance(1);
  }, [advance]);
  const reset = useCallback(() => {
    setPlaying(false);
    setStates(fresh(seed));
  }, [seed]);

  return { states, playing, speed, play, pause, stepOnce, reset, setSpeed };
}

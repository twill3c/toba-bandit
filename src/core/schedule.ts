// 描画と学習の分離(N-03)。1 フレームに実行する学習ステップ数の上限。

export const SPEEDS = [1, 10, 100] as const;
export type Speed = (typeof SPEEDS)[number];

/** 1 フレームの学習バッチ上限(バンディット 1 プレイは軽いので広めに) */
export const MAX_STEPS_PER_FRAME = 100;

export function batchSize(speed: Speed): number {
  return Math.min(speed, MAX_STEPS_PER_FRAME);
}

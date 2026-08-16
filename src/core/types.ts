// toba-bandit コア型定義。src/core は純関数のみ(AGENTS.md §4)

export type StratKind = "egreedy" | "ucb" | "thompson";

/** 戦略の状態(F-03 / F-04)。stepStrat で 1 プレイずつ進む */
export interface StratState {
  /** 腕ごとの試行数 */
  counts: number[];
  /** 腕ごとの当たり数 */
  wins: number[];
  /** 総プレイ数 */
  t: number;
  rngState: number;
  /** 擬似後悔 Σ(p* − p_選択腕) の累積 */
  cumRegret: number;
  /** 累積後悔の履歴(cap 512・半減圧縮) */
  regretHistory: number[];
  /** 直近 1,000 プレイで選んだ腕(最良腕率の窓) */
  recentArms: number[];
  totalReward: number;
  lastArm: number | null;
}

import { describe, expect, it } from "vitest";
import { MAX_STEPS_PER_FRAME, SPEEDS, batchSize } from "@/core/schedule";

// T-060(N-03)

describe("schedule", () => {
  it("全速度で 1 フレームのバッチが上限以下・1x は 1", () => {
    expect(SPEEDS).toEqual([1, 10, 100]);
    for (const s of SPEEDS) {
      expect(batchSize(s)).toBeGreaterThanOrEqual(1);
      expect(batchSize(s)).toBeLessThanOrEqual(MAX_STEPS_PER_FRAME);
    }
    expect(batchSize(1)).toBe(1);
  });
});

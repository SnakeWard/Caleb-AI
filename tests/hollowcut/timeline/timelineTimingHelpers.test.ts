import { describe, expect, it } from "vitest";

import {
  calculateExpectedEndMs,
  getMaxTimelineItemEndMs,
  getTimelineDurationMismatch,
  isFiniteNonNegativeNumber,
  isFinitePositiveNumber,
  isTimelineItemTimingValid,
  normalizeTimelineItemTiming,
  timelineEndMatchesDuration
} from "../../../src/hollowcut/timeline/index.js";
import type { TimelineItemTiming } from "../../../src/hollowcut/timeline/index.js";

const validItem: TimelineItemTiming = {
  item_id: "item_1",
  track_id: "track_1",
  item_type: "visual",
  start_ms: 0,
  duration_ms: 1000,
  end_ms: 1000,
  enabled: true,
  layer: 0
};

describe("timeline timing helpers", () => {
  it("accepts finite non-negative numbers", () => {
    expect(isFiniteNonNegativeNumber(0)).toBe(true);
    expect(isFiniteNonNegativeNumber(1)).toBe(true);
  });

  it("rejects NaN/Infinity", () => {
    expect(isFiniteNonNegativeNumber(Number.NaN)).toBe(false);
    expect(isFiniteNonNegativeNumber(Infinity)).toBe(false);
  });

  it("rejects negative numbers", () => {
    expect(isFiniteNonNegativeNumber(-1)).toBe(false);
  });

  it("accepts finite positive numbers", () => {
    expect(isFinitePositiveNumber(1)).toBe(true);
  });

  it("rejects zero for positive helper", () => {
    expect(isFinitePositiveNumber(0)).toBe(false);
  });

  it("calculates expected end", () => {
    expect(calculateExpectedEndMs(250, 750)).toBe(1000);
  });

  it("checks matching end", () => {
    expect(timelineEndMatchesDuration(250, 750, 1000)).toBe(true);
  });

  it("detects mismatch", () => {
    expect(timelineEndMatchesDuration(250, 750, 999)).toBe(false);
  });

  it("gets max item end", () => {
    expect(getMaxTimelineItemEndMs([validItem, { ...validItem, item_id: "item_2", start_ms: 1000, end_ms: 2000 }])).toBe(
      2000
    );
  });

  it("returns null max end for empty items", () => {
    expect(getMaxTimelineItemEndMs([])).toBeNull();
  });

  it("calculates timeline duration mismatch", () => {
    expect(getTimelineDurationMismatch(1200, 1000)).toBe(200);
  });

  it("validates good item timing", () => {
    expect(isTimelineItemTimingValid(validItem)).toBe(true);
  });

  it("rejects negative start", () => {
    expect(isTimelineItemTimingValid({ ...validItem, start_ms: -1, end_ms: 999 })).toBe(false);
  });

  it("rejects zero/negative duration", () => {
    expect(isTimelineItemTimingValid({ ...validItem, duration_ms: 0, end_ms: 0 })).toBe(false);
    expect(isTimelineItemTimingValid({ ...validItem, duration_ms: -1 })).toBe(false);
  });

  it("rejects end mismatch if policy helper requires exact match", () => {
    expect(isTimelineItemTimingValid({ ...validItem, end_ms: 1001 })).toBe(false);
  });

  it("normalizes valid timing candidate", () => {
    expect(normalizeTimelineItemTiming(validItem)).toEqual(validItem);
  });

  it("returns null for invalid timing candidate", () => {
    expect(normalizeTimelineItemTiming({ ...validItem, duration_ms: 0 })).toBeNull();
  });

  it("does not mutate input", () => {
    const candidate = { ...validItem };
    const before = JSON.stringify(candidate);

    normalizeTimelineItemTiming(candidate);

    expect(JSON.stringify(candidate)).toBe(before);
  });
});

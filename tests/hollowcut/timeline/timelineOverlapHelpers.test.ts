import { describe, expect, it } from "vitest";

import {
  calculateOverlapRange,
  findTimelineOverlaps,
  getDefaultOverlapPolicyForTrackType,
  intervalsOverlap
} from "../../../src/hollowcut/timeline/index.js";
import type { TimelineItemTiming } from "../../../src/hollowcut/timeline/index.js";

const firstVisual: TimelineItemTiming = {
  item_id: "item_1",
  track_id: "track_visual",
  item_type: "visual",
  start_ms: 0,
  duration_ms: 1000,
  end_ms: 1000,
  enabled: true,
  layer: 0
};

const secondVisual: TimelineItemTiming = {
  item_id: "item_2",
  track_id: "track_visual",
  item_type: "visual",
  start_ms: 500,
  duration_ms: 1000,
  end_ms: 1500,
  enabled: true,
  layer: 0
};

describe("timeline overlap helpers", () => {
  it("detects overlapping intervals", () => {
    expect(intervalsOverlap(0, 1000, 500, 1500)).toBe(true);
  });

  it("treats touching intervals as non-overlap", () => {
    expect(intervalsOverlap(0, 1000, 1000, 2000)).toBe(false);
  });

  it("calculates overlap range", () => {
    expect(calculateOverlapRange(0, 1000, 500, 1500)).toEqual({
      overlap_start_ms: 500,
      overlap_end_ms: 1000,
      overlap_duration_ms: 500
    });
  });

  it("finds same-track visual overlap", () => {
    expect(findTimelineOverlaps([firstVisual, secondVisual])).toEqual([
      {
        first_item_id: "item_1",
        second_item_id: "item_2",
        track_id: "track_visual",
        overlap_start_ms: 500,
        overlap_end_ms: 1000,
        overlap_duration_ms: 500,
        policy: "error"
      }
    ]);
  });

  it("ignores cross-track overlaps by default", () => {
    const crossTrack = { ...secondVisual, track_id: "track_visual_2" };

    expect(findTimelineOverlaps([firstVisual, crossTrack])).toEqual([]);
  });

  it("ignores disabled items by default", () => {
    expect(findTimelineOverlaps([firstVisual, { ...secondVisual, enabled: false }])).toEqual([]);
  });

  it("returns no overlaps for sequential items", () => {
    expect(findTimelineOverlaps([firstVisual, { ...secondVisual, start_ms: 1000, end_ms: 2000 }])).toEqual([]);
  });

  it("default visual policy is error", () => {
    expect(getDefaultOverlapPolicyForTrackType("visual")).toBe("error");
  });

  it("default caption policy is error", () => {
    expect(getDefaultOverlapPolicyForTrackType("caption")).toBe("error");
  });

  it("default narration policy is warning", () => {
    expect(getDefaultOverlapPolicyForTrackType("narration")).toBe("warn");
  });

  it("default audio policy is allow", () => {
    expect(getDefaultOverlapPolicyForTrackType("audio")).toBe("allow");
  });

  it("does not mutate input items", () => {
    const items = [firstVisual, secondVisual];
    const before = JSON.stringify(items);

    findTimelineOverlaps(items);

    expect(JSON.stringify(items)).toBe(before);
  });
});

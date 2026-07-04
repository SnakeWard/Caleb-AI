import { describe, expect, it } from "vitest";

import type {
  TimelineItemTiming,
  TimelineOverlap,
  TimelineValidationCheck,
  TimelineValidationIssue,
  TimelineValidationResult,
  TimelineValidationSummary
} from "../../../src/hollowcut/timeline/index.js";

describe("timeline validation types", () => {
  it("constructs TimelineValidationIssue", () => {
    const issue: TimelineValidationIssue = {
      path: "timeline.items[0]",
      severity: "error",
      code: "timeline_item_invalid",
      message: "Timeline item is invalid.",
      item_ids: ["item_1"]
    };

    expect(issue.code).toBe("timeline_item_invalid");
  });

  it("constructs TimelineValidationCheck", () => {
    const check: TimelineValidationCheck = {
      check_id: "timeline_schema",
      status: "pass",
      message: "Timeline schema is valid.",
      issue_codes: []
    };

    expect(check.status).toBe("pass");
  });

  it("constructs TimelineValidationSummary", () => {
    const summary: TimelineValidationSummary = {
      timeline_id: "timeline_1",
      item_count: 1,
      track_count: 1,
      marker_count: 0,
      duration_ms: 1000,
      max_item_end_ms: 1000,
      visual_item_count: 1,
      audio_item_count: 0,
      caption_item_count: 0,
      disabled_item_count: 0,
      warning_count: 0,
      error_count: 0
    };

    expect(summary.timeline_id).toBe("timeline_1");
  });

  it("constructs TimelineValidationResult", () => {
    const result: TimelineValidationResult = {
      valid: true,
      status: "valid",
      warning_count: 0,
      error_count: 0,
      checks: [],
      issues: [],
      summary: {
        timeline_id: null,
        item_count: 0,
        track_count: 0,
        marker_count: 0,
        duration_ms: null,
        max_item_end_ms: null,
        visual_item_count: 0,
        audio_item_count: 0,
        caption_item_count: 0,
        disabled_item_count: 0,
        warning_count: 0,
        error_count: 0
      }
    };

    expect(result.valid).toBe(true);
  });

  it("constructs TimelineItemTiming", () => {
    const item: TimelineItemTiming = {
      item_id: "item_1",
      track_id: "track_1",
      item_type: "visual",
      start_ms: 0,
      duration_ms: 1000,
      end_ms: 1000,
      enabled: true,
      layer: 0
    };

    expect(item.item_type).toBe("visual");
  });

  it("constructs TimelineOverlap", () => {
    const overlap: TimelineOverlap = {
      first_item_id: "item_1",
      second_item_id: "item_2",
      track_id: "track_1",
      overlap_start_ms: 500,
      overlap_end_ms: 1000,
      overlap_duration_ms: 500,
      policy: "error"
    };

    expect(overlap.overlap_duration_ms).toBe(500);
  });

  it("type fixtures compile and include required fields", () => {
    const item: TimelineItemTiming = {
      item_id: "item_required",
      track_id: "track_required",
      item_type: "caption",
      start_ms: 100,
      duration_ms: 900,
      end_ms: 1000,
      enabled: false,
      layer: 1
    };

    expect(Object.keys(item).sort()).toEqual([
      "duration_ms",
      "enabled",
      "end_ms",
      "item_id",
      "item_type",
      "layer",
      "start_ms",
      "track_id"
    ]);
  });
});

import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { isV1SafeHollowManifest, validateHollowManifest } from "../../../src/hollows/manifestValidation.js";
import {
  timelineSchemaCheckImplementation,
  timelineSchemaCheckManifest,
  validateTimelineSchemaCheckInput
} from "../../../src/hollows/categories/timeline/index.js";
import type { HollowImplementationInput } from "../../../src/hollows/runnerTypes.js";

describe("Timeline Schema Check Hollow", () => {
  it("timelineSchemaCheckManifest validates", () => {
    expect(validateHollowManifest(timelineSchemaCheckManifest).valid).toBe(true);
  });

  it("timelineSchemaCheckManifest is V1-safe", () => {
    expect(isV1SafeHollowManifest(timelineSchemaCheckManifest)).toBe(true);
  });

  it("valid simple slideshow timeline returns warnings-only", async () => {
    const result = validateTimelineSchemaCheckInput(await loadFixtureInput("simple-slideshow-timeline.json"));

    expect(result.valid).toBe(true);
    expect(result.error_count).toBe(0);
  });

  it("layered narration timeline returns warnings-only", async () => {
    const result = validateTimelineSchemaCheckInput(await loadFixtureInput("layered-narration-timeline.json"));

    expect(result.valid).toBe(true);
    expect(result.error_count).toBe(0);
  });

  it("missing timeline returns invalid result with error", () => {
    const result = validateTimelineSchemaCheckInput({ assets: [], tracks: [] });

    expect(result.valid).toBe(false);
    expect(issueCodes(result)).toContain("timeline_missing");
  });

  it("invalid timeline_id returns error", () => {
    const result = validateTimelineSchemaCheckInput(baseInput({ timeline_id: "" }));

    expect(issueCodes(result)).toContain("timeline_id_invalid");
  });

  it("invalid duration_ms returns error", () => {
    const result = validateTimelineSchemaCheckInput(baseInput({ duration_ms: Number.NaN }));

    expect(issueCodes(result)).toContain("timeline_duration_invalid");
  });

  it("invalid fps returns error", () => {
    const result = validateTimelineSchemaCheckInput(baseInput({ fps: 0 }));

    expect(issueCodes(result)).toContain("timeline_fps_invalid");
  });

  it("invalid width and height return errors", () => {
    const result = validateTimelineSchemaCheckInput(baseInput({ width: -1, height: Number.POSITIVE_INFINITY }));

    expect(issueCodes(result)).toContain("timeline_width_invalid");
    expect(issueCodes(result)).toContain("timeline_height_invalid");
  });

  it("items not array returns error", () => {
    const result = validateTimelineSchemaCheckInput(baseInput({ items: "bad" }));

    expect(issueCodes(result)).toContain("timeline_items_invalid");
  });

  it("duplicate item_id returns error", () => {
    const input = baseInput({
      items: [timelineItem("item_a"), timelineItem("item_a")]
    });
    const result = validateTimelineSchemaCheckInput(input);

    expect(issueCodes(result)).toContain("duplicate_item_id");
  });

  it("duplicate track_id returns error", () => {
    const input = baseInput({}, { tracks: [track("track_a"), track("track_a")] });
    const result = validateTimelineSchemaCheckInput(input);

    expect(issueCodes(result)).toContain("duplicate_track_id");
  });

  it("duplicate asset_id returns error", () => {
    const input = baseInput({}, { assets: [asset("asset_a"), asset("asset_a")] });
    const result = validateTimelineSchemaCheckInput(input);

    expect(issueCodes(result)).toContain("duplicate_asset_id");
  });

  it("missing asset reference returns error", () => {
    const result = validateTimelineSchemaCheckInput(baseInput({}, { assets: [] }));

    expect(issueCodes(result)).toContain("missing_asset_reference");
  });

  it("missing track reference returns error", () => {
    const result = validateTimelineSchemaCheckInput(baseInput({}, { tracks: [] }));

    expect(issueCodes(result)).toContain("missing_track_reference");
  });

  it("negative item start_ms returns error", () => {
    const result = validateTimelineSchemaCheckInput(baseInput({ items: [timelineItem("item_a", { start_ms: -1 })] }));

    expect(issueCodes(result)).toContain("item_start_ms_invalid");
  });

  it("negative item duration_ms returns error", () => {
    const result = validateTimelineSchemaCheckInput(baseInput({ items: [timelineItem("item_a", { duration_ms: -1 })] }));

    expect(issueCodes(result)).toContain("item_duration_ms_invalid");
  });

  it("zero duration item is rejected by default", () => {
    const result = validateTimelineSchemaCheckInput(baseInput({ items: [timelineItem("item_a", { duration_ms: 0, end_ms: 0 })] }));

    expect(issueCodes(result)).toContain("item_duration_ms_invalid");
  });

  it("zero duration item is allowed when validation_policy.allow_zero_duration_items is true", () => {
    const result = validateTimelineSchemaCheckInput({
      ...baseInput({ items: [timelineItem("item_a", { duration_ms: 0, end_ms: 0 })] }),
      validation_policy: { allow_zero_duration_items: true }
    });

    expect(issueCodes(result)).not.toContain("item_duration_ms_invalid");
  });

  it("end_ms mismatch produces warning or error according to policy", () => {
    const warningResult = validateTimelineSchemaCheckInput(baseInput({ items: [timelineItem("item_a", { end_ms: 900 })] }));
    const errorResult = validateTimelineSchemaCheckInput({
      ...baseInput({ items: [timelineItem("item_a", { end_ms: 900 })] }),
      validation_policy: { end_mismatch_severity: "error" }
    });

    expect(warningResult.issues.find((issue) => issue.code === "item_end_ms_mismatch")?.severity).toBe("warning");
    expect(errorResult.issues.find((issue) => issue.code === "item_end_ms_mismatch")?.severity).toBe("error");
  });

  it("timeline duration shorter than max item end produces warning", () => {
    const result = validateTimelineSchemaCheckInput(baseInput({ duration_ms: 500 }));

    expect(issueCodes(result)).toContain("timeline_duration_shorter_than_items");
  });

  it("metadata_hint without evidence_refs produces warning", () => {
    const result = validateTimelineSchemaCheckInput(baseInput());

    expect(result.issues.find((issue) => issue.code === "metadata_hint_without_evidence")?.severity).toBe("warning");
  });

  it("unknown item_type produces warning", () => {
    const result = validateTimelineSchemaCheckInput(baseInput({ items: [timelineItem("item_a", { item_type: "unknown" })] }));

    expect(issueCodes(result)).toContain("item_type_unknown");
  });

  it("captions array is lightly checked", () => {
    const result = validateTimelineSchemaCheckInput({
      ...baseInput(),
      captions: [{ caption_id: "caption_a", start_ms: 0, end_ms: 1000, reading_speed_wpm: null }]
    });

    expect(issueCodes(result)).toContain("caption_reading_speed_missing");
  });

  it("markers array is lightly checked", () => {
    const result = validateTimelineSchemaCheckInput(baseInput({ markers: [{ time_ms: 0 }] }));

    expect(issueCodes(result)).toContain("marker_id_missing");
  });

  it("result summary counts items, tracks, and markers", () => {
    const result = validateTimelineSchemaCheckInput(baseInput());

    expect(result.summary.item_count).toBe(1);
    expect(result.summary.track_count).toBe(1);
    expect(result.summary.marker_count).toBe(1);
  });

  it("implementation returns result_units timeline_schema", async () => {
    const result = await timelineSchemaCheckImplementation(createImplementationInput(baseInput()));

    expect(result.result_units).toBe("timeline_schema");
  });

  it("implementation does not mutate input object", async () => {
    const input = baseInput();
    const before = JSON.stringify(input);

    await timelineSchemaCheckImplementation(createImplementationInput(input));

    expect(JSON.stringify(input)).toBe(before);
  });
});

async function loadFixtureInput(name: string): Promise<HollowImplementationInput["input_payload"]> {
  const fixture = JSON.parse(
    await readFile(`examples/hollowcut-timeline-demo/${name}`, "utf8")
  ) as Record<string, unknown>;
  return ({
    timeline: fixture.timeline,
    assets: fixture.assets,
    tracks: fixture.tracks,
    captions: fixture.captions ?? []
  } as unknown) as HollowImplementationInput["input_payload"];
}

function baseInput(timelineOverrides: Record<string, unknown> = {}, inputOverrides: Record<string, unknown> = {}) {
  return {
    timeline: {
      timeline_id: "timeline_a",
      duration_ms: 1000,
      fps: 30,
      width: 1920,
      height: 1080,
      aspect_ratio: "16:9",
      items: [timelineItem("item_a")],
      markers: [{ marker_id: "marker_a", time_ms: 0, label: "Start", marker_type: "note" }],
      warnings: [],
      ...timelineOverrides
    },
    assets: [asset("asset_a")],
    tracks: [track("track_a")],
    captions: [],
    ...inputOverrides
  };
}

function timelineItem(itemId: string, overrides: Record<string, unknown> = {}) {
  return {
    item_id: itemId,
    asset_id: "asset_a",
    track_id: "track_a",
    item_type: "visual",
    start_ms: 0,
    duration_ms: 1000,
    end_ms: 1000,
    layer: 0,
    enabled: true,
    transition_in: null,
    transition_out: null,
    effects: [],
    metadata: {},
    warnings: [],
    ...overrides
  };
}

function asset(assetId: string) {
  return {
    asset_id: assetId,
    metadata_hint: { width: 1920, height: 1080 },
    evidence_refs: []
  };
}

function track(trackId: string) {
  return { track_id: trackId, items: ["item_a"] };
}

function issueCodes(result: { issues: readonly { code: string }[] }) {
  return result.issues.map((issue) => issue.code);
}

function createImplementationInput(input_payload: unknown): HollowImplementationInput {
  return {
    input_payload: input_payload as HollowImplementationInput["input_payload"],
    input_digest: "sha256:test",
    context: {
      invocation_id: "invocation_test",
      task_id: "task_test",
      run_id: "run_test",
      trace_id: "trace_test",
      hollow_id: timelineSchemaCheckManifest.hollow_id,
      hollow_version: timelineSchemaCheckManifest.hollow_version,
      started_at: "2026-06-07T00:00:00.000Z",
      caller: "test",
      requested_by: "test",
      approved_by: null,
      permissions: timelineSchemaCheckManifest.permissions_required,
      execution_mode: timelineSchemaCheckManifest.execution_mode
    }
  };
}

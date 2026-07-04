import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { isV1SafeHollowManifest, validateHollowManifest } from "../../../src/hollows/manifestValidation.js";
import {
  timelineTrackReferenceCheckImplementation,
  timelineTrackReferenceCheckManifest,
  validateTimelineTrackReferenceInput
} from "../../../src/hollows/categories/timeline/index.js";
import type { HollowImplementationInput } from "../../../src/hollows/runnerTypes.js";

describe("Timeline Track Reference Check Hollow", () => {
  it("timelineTrackReferenceCheckManifest validates", () => {
    expect(validateHollowManifest(timelineTrackReferenceCheckManifest).valid).toBe(true);
  });

  it("timelineTrackReferenceCheckManifest is V1-safe", () => {
    expect(isV1SafeHollowManifest(timelineTrackReferenceCheckManifest)).toBe(true);
  });

  it("valid simple slideshow fixture returns warnings-only", async () => {
    const result = validateTimelineTrackReferenceInput(await loadFixtureInput("simple-slideshow-timeline.json"));

    expect(result.valid).toBe(true);
    expect(result.error_count).toBe(0);
  });

  it("detects duplicate track_id", () => {
    expect(codes(validateTimelineTrackReferenceInput(baseInput([track("track_a"), track("track_a")])))).toContain(
      "duplicate_track_id"
    );
  });

  it("detects missing item track_id", () => {
    expect(codes(validateTimelineTrackReferenceInput(baseInput([track("track_a")], [item({ track_id: "" })])))).toContain(
      "item_track_id_missing"
    );
  });

  it("detects item track_id referencing missing track", () => {
    expect(codes(validateTimelineTrackReferenceInput(baseInput([])))).toContain("item_track_ref_missing");
  });

  it("detects track item ref missing from timeline items", () => {
    expect(codes(validateTimelineTrackReferenceInput(baseInput([track("track_a", ["item_a", "missing_item"])])))).toContain(
      "track_item_ref_missing"
    );
  });

  it("detects timeline item missing from track item list", () => {
    expect(codes(validateTimelineTrackReferenceInput(baseInput([track("track_a", [])])))).toContain(
      "track_item_list_mismatch"
    );
  });

  it("detects unused track warning", () => {
    expect(codes(validateTimelineTrackReferenceInput(baseInput([track("track_a"), track("track_unused", [])])))).toContain(
      "unused_track"
    );
  });

  it("handles tracks omitted by defaulting to [] and reporting missing refs", () => {
    expect(codes(validateTimelineTrackReferenceInput({ timeline: baseTimeline() }))).toContain("item_track_ref_missing");
  });

  it("does not perform overlap validation", () => {
    const result = validateTimelineTrackReferenceInput(baseInput([track("track_a", ["item_a", "item_b"])], [
      item(),
      item({ item_id: "item_b", start_ms: 500, end_ms: 1500 })
    ]));

    expect(codes(result).some((code) => code.includes("overlap"))).toBe(false);
  });

  it("returns structured TimelineValidationResult", () => {
    const result = validateTimelineTrackReferenceInput(baseInput());

    expect(result).toHaveProperty("valid");
    expect(result).toHaveProperty("issues");
    expect(result).toHaveProperty("summary");
  });

  it("returns result_units timeline_track_refs", async () => {
    const result = await timelineTrackReferenceCheckImplementation(createImplementationInput(baseInput()));

    expect(result.result_units).toBe("timeline_track_refs");
  });

  it("does not mutate input", async () => {
    const input = baseInput();
    const before = JSON.stringify(input);

    await timelineTrackReferenceCheckImplementation(createImplementationInput(input));

    expect(JSON.stringify(input)).toBe(before);
  });
});

async function loadFixtureInput(name: string): Promise<HollowImplementationInput["input_payload"]> {
  const fixture = JSON.parse(await readFile(`examples/hollowcut-timeline-demo/${name}`, "utf8")) as Record<string, unknown>;
  return ({ timeline: fixture.timeline, tracks: fixture.tracks } as unknown) as HollowImplementationInput["input_payload"];
}

function baseInput(tracks = [track("track_a")], items = [item()]) {
  return { timeline: baseTimeline(items), tracks };
}

function baseTimeline(items = [item()]) {
  return { timeline_id: "timeline_a", items };
}

function item(overrides: Record<string, unknown> = {}) {
  return { item_id: "item_a", track_id: "track_a", start_ms: 0, duration_ms: 1000, end_ms: 1000, ...overrides };
}

function track(track_id: string, items = ["item_a"]) {
  return { track_id, items };
}

function codes(result: { issues: readonly { code: string }[] }) {
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
      hollow_id: timelineTrackReferenceCheckManifest.hollow_id,
      hollow_version: timelineTrackReferenceCheckManifest.hollow_version,
      started_at: "2026-06-07T00:00:00.000Z",
      caller: "test",
      requested_by: "test",
      approved_by: null,
      permissions: timelineTrackReferenceCheckManifest.permissions_required,
      execution_mode: timelineTrackReferenceCheckManifest.execution_mode
    }
  };
}

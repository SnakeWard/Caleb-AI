import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { isV1SafeHollowManifest, validateHollowManifest } from "../../../src/hollows/manifestValidation.js";
import {
  timelineDurationConsistencyImplementation,
  timelineDurationConsistencyManifest,
  validateTimelineDurationConsistencyInput
} from "../../../src/hollows/categories/timeline/index.js";
import type { HollowImplementationInput } from "../../../src/hollows/runnerTypes.js";

describe("Timeline Duration Consistency Hollow", () => {
  it("timelineDurationConsistencyManifest validates", () => {
    expect(validateHollowManifest(timelineDurationConsistencyManifest).valid).toBe(true);
  });

  it("timelineDurationConsistencyManifest is V1-safe", () => {
    expect(isV1SafeHollowManifest(timelineDurationConsistencyManifest)).toBe(true);
  });

  it("valid simple slideshow fixture returns warnings-only", async () => {
    const result = validateTimelineDurationConsistencyInput(await loadFixtureInput("simple-slideshow-timeline.json"));

    expect(result.valid).toBe(true);
    expect(result.error_count).toBe(0);
  });

  it("detects timeline duration shorter than max item end", () => {
    expect(codes(validateTimelineDurationConsistencyInput(baseInput({ duration_ms: 500 })))).toContain(
      "timeline_duration_shorter_than_content"
    );
  });

  it("detects long tail when timeline duration much longer than content", () => {
    expect(codes(validateTimelineDurationConsistencyInput(baseInput({ duration_ms: 10000 })))).toContain(
      "timeline_duration_long_tail"
    );
  });

  it("detects invalid timeline duration", () => {
    expect(codes(validateTimelineDurationConsistencyInput(baseInput({ duration_ms: Number.NaN })))).toContain(
      "timeline_duration_invalid"
    );
  });

  it("detects item end_ms mismatch", () => {
    expect(codes(validateTimelineDurationConsistencyInput(baseInput({}, [item({ end_ms: 900 })])))).toContain(
      "item_end_mismatch"
    );
  });

  it("detects invalid item timing", () => {
    expect(codes(validateTimelineDurationConsistencyInput(baseInput({}, [item({ start_ms: -1 })])))).toContain(
      "item_timing_invalid"
    );
  });

  it("detects negative item duration", () => {
    expect(codes(validateTimelineDurationConsistencyInput(baseInput({}, [item({ duration_ms: -1 })])))).toContain(
      "item_timing_invalid"
    );
  });

  it("detects zero duration item by default", () => {
    expect(codes(validateTimelineDurationConsistencyInput(baseInput({}, [item({ duration_ms: 0, end_ms: 0 })])))).toContain(
      "item_duration_zero"
    );
  });

  it("allows zero duration item when policy allows it", () => {
    const result = validateTimelineDurationConsistencyInput({
      ...baseInput({}, [item({ duration_ms: 0, end_ms: 0 })]),
      validation_policy: { allow_zero_duration_items: true }
    });

    expect(codes(result)).not.toContain("item_duration_zero");
  });

  it("computes max item end", () => {
    const result = validateTimelineDurationConsistencyInput(baseInput({}, [item({ end_ms: 1000 }), item({ item_id: "item_b", start_ms: 1000, duration_ms: 2000, end_ms: 3000 })]));

    expect(result.summary.max_item_end_ms).toBe(3000);
  });

  it("counts disabled items", () => {
    const result = validateTimelineDurationConsistencyInput(baseInput({}, [item({ enabled: false })]));

    expect(result.summary.disabled_item_count).toBe(1);
    expect(result.summary.max_item_end_ms).toBeNull();
  });

  it("returns structured TimelineValidationResult", () => {
    const result = validateTimelineDurationConsistencyInput(baseInput());

    expect(result).toHaveProperty("valid");
    expect(result).toHaveProperty("issues");
    expect(result).toHaveProperty("summary");
  });

  it("returns result_units timeline_duration", async () => {
    const result = await timelineDurationConsistencyImplementation(createImplementationInput(baseInput()));

    expect(result.result_units).toBe("timeline_duration");
  });

  it("does not mutate input", async () => {
    const input = baseInput();
    const before = JSON.stringify(input);

    await timelineDurationConsistencyImplementation(createImplementationInput(input));

    expect(JSON.stringify(input)).toBe(before);
  });
});

async function loadFixtureInput(name: string): Promise<HollowImplementationInput["input_payload"]> {
  const fixture = JSON.parse(await readFile(`examples/hollowcut-timeline-demo/${name}`, "utf8")) as Record<string, unknown>;
  return ({ timeline: fixture.timeline } as unknown) as HollowImplementationInput["input_payload"];
}

function baseInput(timelineOverrides: Record<string, unknown> = {}, items = [item()]) {
  return {
    timeline: {
      timeline_id: "timeline_a",
      duration_ms: 1000,
      items,
      ...timelineOverrides
    }
  };
}

function item(overrides: Record<string, unknown> = {}) {
  return {
    item_id: "item_a",
    track_id: "track_a",
    item_type: "visual",
    start_ms: 0,
    duration_ms: 1000,
    end_ms: 1000,
    enabled: true,
    layer: 0,
    ...overrides
  };
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
      hollow_id: timelineDurationConsistencyManifest.hollow_id,
      hollow_version: timelineDurationConsistencyManifest.hollow_version,
      started_at: "2026-06-07T00:00:00.000Z",
      caller: "test",
      requested_by: "test",
      approved_by: null,
      permissions: timelineDurationConsistencyManifest.permissions_required,
      execution_mode: timelineDurationConsistencyManifest.execution_mode
    }
  };
}

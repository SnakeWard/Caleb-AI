import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { isV1SafeHollowManifest, validateHollowManifest } from "../../../src/hollows/manifestValidation.js";
import {
  timelineAssetReferenceCheckImplementation,
  timelineAssetReferenceCheckManifest,
  validateTimelineAssetReferenceInput
} from "../../../src/hollows/categories/timeline/index.js";
import type { HollowImplementationInput } from "../../../src/hollows/runnerTypes.js";

describe("Timeline Asset Reference Check Hollow", () => {
  it("timelineAssetReferenceCheckManifest validates", () => {
    expect(validateHollowManifest(timelineAssetReferenceCheckManifest).valid).toBe(true);
  });

  it("timelineAssetReferenceCheckManifest is V1-safe", () => {
    expect(isV1SafeHollowManifest(timelineAssetReferenceCheckManifest)).toBe(true);
  });

  it("valid simple slideshow fixture returns warnings-only", async () => {
    const result = validateTimelineAssetReferenceInput(await loadFixtureInput("simple-slideshow-timeline.json"));

    expect(result.valid).toBe(true);
    expect(result.error_count).toBe(0);
  });

  it("detects duplicate asset_id", () => {
    expect(codes(validateTimelineAssetReferenceInput(baseInput([asset("asset_a"), asset("asset_a")])))).toContain(
      "duplicate_asset_id"
    );
  });

  it("detects missing item asset_id", () => {
    expect(codes(validateTimelineAssetReferenceInput(baseInput([asset("asset_a")], [item({ asset_id: "" })])))).toContain(
      "item_asset_id_missing"
    );
  });

  it("detects item asset_id referencing missing asset", () => {
    expect(codes(validateTimelineAssetReferenceInput(baseInput([])))).toContain("item_asset_ref_missing");
  });

  it("detects unused asset warning", () => {
    expect(codes(validateTimelineAssetReferenceInput(baseInput([asset("asset_a"), asset("asset_unused")])))).toContain(
      "unused_asset"
    );
  });

  it("detects metadata_hint without evidence_refs warning", () => {
    expect(codes(validateTimelineAssetReferenceInput(baseInput([asset("asset_a")])))).toContain(
      "metadata_hint_without_evidence"
    );
  });

  it("detects verified_metadata without evidence_refs warning", () => {
    expect(codes(validateTimelineAssetReferenceInput(baseInput([asset("asset_a", { verified_metadata: { width: 1 } })])))).toContain(
      "verified_metadata_without_evidence"
    );
  });

  it("handles assets omitted by defaulting to [] and reporting missing refs", () => {
    expect(codes(validateTimelineAssetReferenceInput({ timeline: baseTimeline() }))).toContain("item_asset_ref_missing");
  });

  it("detects unsafe asset relative_path without reading files", () => {
    expect(codes(validateTimelineAssetReferenceInput(baseInput([asset("asset_a", { relative_path: "../outside.png" })])))).toContain(
      "asset_relative_path_unsafe"
    );
  });

  it("returns structured TimelineValidationResult", () => {
    const result = validateTimelineAssetReferenceInput(baseInput());

    expect(result).toHaveProperty("valid");
    expect(result).toHaveProperty("issues");
    expect(result).toHaveProperty("summary");
  });

  it("returns result_units timeline_asset_refs", async () => {
    const result = await timelineAssetReferenceCheckImplementation(createImplementationInput(baseInput()));

    expect(result.result_units).toBe("timeline_asset_refs");
  });

  it("does not mutate input", async () => {
    const input = baseInput();
    const before = JSON.stringify(input);

    await timelineAssetReferenceCheckImplementation(createImplementationInput(input));

    expect(JSON.stringify(input)).toBe(before);
  });
});

async function loadFixtureInput(name: string): Promise<HollowImplementationInput["input_payload"]> {
  const fixture = JSON.parse(await readFile(`examples/hollowcut-timeline-demo/${name}`, "utf8")) as Record<string, unknown>;
  return ({ timeline: fixture.timeline, assets: fixture.assets } as unknown) as HollowImplementationInput["input_payload"];
}

function baseInput(assets = [asset("asset_a")], items = [item()]) {
  return { timeline: baseTimeline(items), assets };
}

function baseTimeline(items = [item()]) {
  return { timeline_id: "timeline_a", items };
}

function item(overrides: Record<string, unknown> = {}) {
  return { item_id: "item_a", asset_id: "asset_a", ...overrides };
}

function asset(asset_id: string, overrides: Record<string, unknown> = {}) {
  return {
    asset_id,
    relative_path: `assets/${asset_id}.png`,
    metadata_hint: { width: 1920 },
    evidence_refs: [],
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
      hollow_id: timelineAssetReferenceCheckManifest.hollow_id,
      hollow_version: timelineAssetReferenceCheckManifest.hollow_version,
      started_at: "2026-06-07T00:00:00.000Z",
      caller: "test",
      requested_by: "test",
      approved_by: null,
      permissions: timelineAssetReferenceCheckManifest.permissions_required,
      execution_mode: timelineAssetReferenceCheckManifest.execution_mode
    }
  };
}

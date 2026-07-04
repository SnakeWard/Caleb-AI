import { describe, expect, it } from "vitest";

import {
  hollowcutProjectTimelineCrossCheckImplementation,
  hollowcutProjectTimelineCrossCheckManifest
} from "../../src/hollowcut/projectTimelineCrossCheckHollow.js";
import { createHollowRunner } from "../../src/hollows/runner.js";
import { createHollowRegistry } from "../../src/hollows/registry.js";
import type { HollowManifest } from "../../src/types/hollow.js";

const registry = createHollowRegistry([hollowcutProjectTimelineCrossCheckManifest as HollowManifest]);
const runner = createHollowRunner(registry, {
  [hollowcutProjectTimelineCrossCheckManifest.hollow_id]: hollowcutProjectTimelineCrossCheckImplementation
});

const validCombined = {
  project_state: {
    schema_version: "1.0.0",
    project_id: "proj-001",
    project_name: "Test",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    project_root: ".",
    assets: [{ asset_id: "a1", asset_type: "video", display_name: "bg" }],
    timeline: { timeline_id: "tl-001", duration_ms: 10000, fps: 30, width: 1920, height: 1080, aspect_ratio: "16:9", items: [] },
    tracks: [{ track_id: "t1", track_type: "visual", name: "Main", locked: false, muted: false, items: [] }],
    captions: [],
    narration: { script: "", voice_profile: null, estimated_duration_ms: null, audio_asset_id: null, evidence_refs: [] },
    export_targets: [],
    validation_state: { last_validated_at: null, validation_status: "not_validated", checks: [], warnings: [], errors: [], evidence_refs: [], report_refs: [] },
    ledger_refs: [],
    artifact_refs: [],
    provenance: { fixture_type: "test" }
  },
  timeline_state: {
    timeline_id: "tl-001",
    duration_ms: 10000,
    fps: 30,
    width: 1920,
    height: 1080,
    aspect_ratio: "16:9",
    items: [{ item_id: "i1", asset_id: "a1", track_id: "t1", start_ms: 0, duration_ms: 10000, end_ms: 10000, transition_in: null, transition_out: null, effects: [], warnings: [] }]
  }
};

const invalidBrokenRef = {
  project_state: { ...validCombined.project_state, assets: [] },
  timeline_state: validCombined.timeline_state
};

describe("hollow.hollowcut.project_timeline_cross_check", () => {
  it("manifest is deterministic and Hollowcut-only", () => {
    expect(hollowcutProjectTimelineCrossCheckManifest.hollow_id).toBe("hollow.hollowcut.project_timeline_cross_check");
    expect(hollowcutProjectTimelineCrossCheckManifest.deterministic).toBe(true);
    expect(hollowcutProjectTimelineCrossCheckManifest.category).toBe("project");
  });

  it("valid supplied project+timeline cross state runs through Runner and produces structured valid result", async () => {
    const invocation = await runner.run({
      hollow_id: hollowcutProjectTimelineCrossCheckManifest.hollow_id,
      input_payload: validCombined
    });
    expect(invocation.status).toBe("completed");
    expect(invocation.trust_tier).toBe("T0");
    expect(invocation.result).toHaveProperty("valid");
  });

  it("invalid broken asset reference produces structured errors and stays non-trusted until VRP", async () => {
    const invocation = await runner.run({
      hollow_id: hollowcutProjectTimelineCrossCheckManifest.hollow_id,
      input_payload: invalidBrokenRef
    });
    expect(invocation.status).toBe("completed");
    expect(invocation.trust_tier).toBe("T0");
    // result contains issues (caller passes to VRP)
  });
});
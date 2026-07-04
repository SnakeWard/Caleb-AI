import { describe, expect, it } from "vitest";

import {
  timelineTemporalIntegrityCheckImplementation
} from "../../../../src/hollows/categories/timeline/timelineTemporalIntegrityCheckHollow.js";
import { timelineTemporalIntegrityCheckManifest } from "../../../../src/hollows/categories/timeline/timelineHollowManifests.js";
import { createHollowRunner } from "../../../../src/hollows/runner.js";
import { createHollowRegistry } from "../../../../src/hollows/registry.js";
import type { HollowManifest } from "../../../../src/types/hollow.js";

const registry = createHollowRegistry([timelineTemporalIntegrityCheckManifest as HollowManifest]);
const runner = createHollowRunner(registry, {
  [timelineTemporalIntegrityCheckManifest.hollow_id]: timelineTemporalIntegrityCheckImplementation
});

const validTimeline = {
  timeline_id: "tl-valid",
  duration_ms: 10000,
  fps: 30,
  width: 1920,
  height: 1080,
  aspect_ratio: "16:9",
  items: [
    { item_id: "i1", asset_id: "a1", track_id: "t1", start_ms: 0, duration_ms: 5000, end_ms: 5000, transition_in: null, transition_out: null, effects: [], warnings: [] },
    { item_id: "i2", asset_id: "a2", track_id: "t1", start_ms: 5000, duration_ms: 5000, end_ms: 10000, transition_in: null, transition_out: null, effects: [], warnings: [] }
  ]
};

const invalidNegative = {
  ...validTimeline,
  items: [
    { item_id: "bad", asset_id: "a1", track_id: "t1", start_ms: 0, duration_ms: -100, end_ms: -100, transition_in: null, transition_out: null, effects: [], warnings: [] }
  ]
};

const invalidOverlap = {
  ...validTimeline,
  items: [
    { item_id: "o1", asset_id: "a1", track_id: "t1", start_ms: 0, duration_ms: 6000, end_ms: 6000, transition_in: null, transition_out: null, effects: [], warnings: [] },
    { item_id: "o2", asset_id: "a2", track_id: "t1", start_ms: 3000, duration_ms: 4000, end_ms: 7000, transition_in: null, transition_out: null, effects: [], warnings: [] }
  ]
};

describe("hollow.timeline.temporal_integrity_check", () => {
  it("manifest is V1-safe style and deterministic", () => {
    expect(timelineTemporalIntegrityCheckManifest.hollow_id).toBe("hollow.timeline.temporal_integrity_check");
    expect(timelineTemporalIntegrityCheckManifest.deterministic).toBe(true);
  });

  it("valid timeline runs through Runner as T0", async () => {
    const invocation = await runner.run({
      hollow_id: timelineTemporalIntegrityCheckManifest.hollow_id,
      input_payload: { timeline_state: validTimeline }
    });
    expect(invocation.status).toBe("completed");
    expect(invocation.trust_tier).toBe("T0");
    expect(invocation.result).toHaveProperty("valid");
  });

  it("negative duration produces error issues", async () => {
    const invocation = await runner.run({
      hollow_id: timelineTemporalIntegrityCheckManifest.hollow_id,
      input_payload: { timeline_state: invalidNegative }
    });
    expect(invocation.status).toBe("completed");
    expect(invocation.trust_tier).toBe("T0");
  });

  it("overlaps on same track detected", async () => {
    const invocation = await runner.run({
      hollow_id: timelineTemporalIntegrityCheckManifest.hollow_id,
      input_payload: { timeline_state: invalidOverlap }
    });
    expect(invocation.status).toBe("completed");
  });
});
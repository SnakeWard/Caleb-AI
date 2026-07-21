import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import type { JsonValue } from "../../../src/types/common.js";
import {
  HollowRegistry,
  HollowRunner,
  MEDIA_HOLLOW_MANIFESTS,
  V1_HOLLOW_MANIFESTS,
  timelineAssetReferenceCheckImplementation,
  timelineAssetReferenceCheckManifest,
  timelineDurationConsistencyImplementation,
  timelineDurationConsistencyManifest,
  timelineHollowManifests,
  timelineSchemaCheckImplementation,
  timelineSchemaCheckManifest,
  timelineTrackReferenceCheckImplementation,
  timelineTrackReferenceCheckManifest
} from "../../../src/hollows/index.js";
import { createLedgerEntryFromEvidence } from "../../../src/ledger/index.js";
import { VerifiedReturnPath } from "../../../src/verification/index.js";

describe("Timeline Hollow integration", () => {
  it("builds HollowRegistry and registers all timelineHollowManifests", () => {
    const registry = new HollowRegistry(timelineHollowManifests);

    expect(registry.count()).toBe(5);
    expect(registry.get(timelineSchemaCheckManifest.hollow_id).hollow_id).toBe(timelineSchemaCheckManifest.hollow_id);
    expect(registry.get(timelineDurationConsistencyManifest.hollow_id).hollow_id).toBe(timelineDurationConsistencyManifest.hollow_id);
    expect(registry.get(timelineAssetReferenceCheckManifest.hollow_id).hollow_id).toBe(timelineAssetReferenceCheckManifest.hollow_id);
    expect(registry.get(timelineTrackReferenceCheckManifest.hollow_id).hollow_id).toBe(timelineTrackReferenceCheckManifest.hollow_id);
  });

  it("builds HollowRunner with all timeline implementations", () => {
    const runner = createTimelineRunner();

    expect(runner.hasImplementation(timelineSchemaCheckManifest.hollow_id)).toBe(true);
    expect(runner.hasImplementation(timelineDurationConsistencyManifest.hollow_id)).toBe(true);
    expect(runner.hasImplementation(timelineAssetReferenceCheckManifest.hollow_id)).toBe(true);
    expect(runner.hasImplementation(timelineTrackReferenceCheckManifest.hollow_id)).toBe(true);
  });

  it("runs timeline schema Hollow with simple slideshow fixture input", async () => {
    const record = await createTimelineRunner().run({
      hollow_id: timelineSchemaCheckManifest.hollow_id,
      input_payload: await loadFixtureInput("simple-slideshow-timeline.json")
    });

    expect(record.status).toBe("completed");
    expect(record.result_units).toBe("timeline_schema");
  });

  it("runner output starts T0/unverified", async () => {
    const record = await createTimelineRunner().run({
      hollow_id: timelineSchemaCheckManifest.hollow_id,
      input_payload: await loadFixtureInput("simple-slideshow-timeline.json")
    });

    expect(record.trust_tier).toBe("T0");
    expect(record.verification_status).toBe("unverified");
  });

  it("runs duration consistency Hollow with simple slideshow fixture", async () => {
    const record = await createTimelineRunner().run({
      hollow_id: timelineDurationConsistencyManifest.hollow_id,
      input_payload: await loadFixtureInput("simple-slideshow-timeline.json")
    });

    expect(record.status).toBe("completed");
    expect(record.result_units).toBe("timeline_duration");
  });

  it("runs asset reference check Hollow with simple slideshow fixture", async () => {
    const record = await createTimelineRunner().run({
      hollow_id: timelineAssetReferenceCheckManifest.hollow_id,
      input_payload: await loadFixtureInput("simple-slideshow-timeline.json")
    });

    expect(record.status).toBe("completed");
    expect(record.result_units).toBe("timeline_asset_refs");
  });

  it("runs track reference check Hollow with simple slideshow fixture", async () => {
    const record = await createTimelineRunner().run({
      hollow_id: timelineTrackReferenceCheckManifest.hollow_id,
      input_payload: await loadFixtureInput("simple-slideshow-timeline.json")
    });

    expect(record.status).toBe("completed");
    expect(record.result_units).toBe("timeline_track_refs");
  });

  it("runner output for each new timeline Hollow starts T0/unverified", async () => {
    for (const manifest of [
      timelineDurationConsistencyManifest,
      timelineAssetReferenceCheckManifest,
      timelineTrackReferenceCheckManifest
    ]) {
      const record = await createTimelineRunner().run({
        hollow_id: manifest.hollow_id,
        input_payload: await loadFixtureInput("simple-slideshow-timeline.json")
      });

      expect(record.trust_tier).toBe("T0");
      expect(record.verification_status).toBe("unverified");
    }
  });

  it("Verified Return Path promotes completed deterministic timeline schema output to T2", async () => {
    const record = await createTimelineRunner().run({
      hollow_id: timelineSchemaCheckManifest.hollow_id,
      input_payload: await loadFixtureInput("simple-slideshow-timeline.json")
    });
    const result = new VerifiedReturnPath().verifyInvocation(record);

    expect(result.decision).toBe("accepted");
    expect(result.evidence_packet?.trust_tier).toBe("T2");
  });

  it("Verified Return Path promotes completed deterministic duration output to T2", async () => {
    const record = await createTimelineRunner().run({
      hollow_id: timelineDurationConsistencyManifest.hollow_id,
      input_payload: await loadFixtureInput("simple-slideshow-timeline.json")
    });

    expect(new VerifiedReturnPath().verifyInvocation(record).evidence_packet?.trust_tier).toBe("T2");
  });

  it("Verified Return Path promotes completed deterministic asset reference output to T2", async () => {
    const record = await createTimelineRunner().run({
      hollow_id: timelineAssetReferenceCheckManifest.hollow_id,
      input_payload: await loadFixtureInput("simple-slideshow-timeline.json")
    });

    expect(new VerifiedReturnPath().verifyInvocation(record).evidence_packet?.trust_tier).toBe("T2");
  });

  it("Verified Return Path promotes completed deterministic track reference output to T2", async () => {
    const record = await createTimelineRunner().run({
      hollow_id: timelineTrackReferenceCheckManifest.hollow_id,
      input_payload: await loadFixtureInput("simple-slideshow-timeline.json")
    });

    expect(new VerifiedReturnPath().verifyInvocation(record).evidence_packet?.trust_tier).toBe("T2");
  });

  it("EvidencePacket can become LedgerEntry through createLedgerEntryFromEvidence", async () => {
    const record = await createTimelineRunner().run({
      hollow_id: timelineSchemaCheckManifest.hollow_id,
      input_payload: await loadFixtureInput("simple-slideshow-timeline.json"),
      task_id: "task_timeline_schema_check",
      run_id: "run_timeline_schema_check",
      trace_id: "trace_timeline_schema_check"
    });
    const result = new VerifiedReturnPath().verifyInvocation(record);
    const entry = createLedgerEntryFromEvidence(result.evidence_packet!);

    expect(entry.hollow_id).toBe(timelineSchemaCheckManifest.hollow_id);
    expect(entry.trust_tier).toBe("T2");
  });

  it("EvidencePacket can become LedgerEntry for each new timeline Hollow", async () => {
    for (const manifest of [
      timelineDurationConsistencyManifest,
      timelineAssetReferenceCheckManifest,
      timelineTrackReferenceCheckManifest
    ]) {
      const record = await createTimelineRunner().run({
        hollow_id: manifest.hollow_id,
        input_payload: await loadFixtureInput("simple-slideshow-timeline.json"),
        task_id: `task_${manifest.hollow_id.replaceAll(".", "_")}`,
        run_id: `run_${manifest.hollow_id.replaceAll(".", "_")}`,
        trace_id: `trace_${manifest.hollow_id.replaceAll(".", "_")}`
      });
      const result = new VerifiedReturnPath().verifyInvocation(record);
      const entry = createLedgerEntryFromEvidence(result.evidence_packet!);

      expect(entry.hollow_id).toBe(manifest.hollow_id);
      expect(entry.trust_tier).toBe("T2");
    }
  });

  it("warnings survive runner output", async () => {
    const record = await createTimelineRunner().run({
      hollow_id: timelineSchemaCheckManifest.hollow_id,
      input_payload: await loadFixtureInput("simple-slideshow-timeline.json")
    });

    expect(record.warnings.map((warning) => warning.warning_id)).toContain("metadata_hint_without_evidence");
  });

  it("new timeline Hollow warnings survive runner output", async () => {
    const record = await createTimelineRunner().run({
      hollow_id: timelineDurationConsistencyManifest.hollow_id,
      input_payload: { timeline: { timeline_id: "timeline_a", duration_ms: 10000, items: [{ item_id: "item_a", start_ms: 0, duration_ms: 1000, end_ms: 1000, enabled: true }] } }
    });

    expect(record.warnings.map((warning) => warning.warning_id)).toContain("timeline_duration_long_tail");
  });

  it("Verified Return Path preserves timeline warnings", async () => {
    const record = await createTimelineRunner().run({
      hollow_id: timelineSchemaCheckManifest.hollow_id,
      input_payload: await loadFixtureInput("simple-slideshow-timeline.json")
    });
    const result = new VerifiedReturnPath().verifyInvocation(record);

    expect(result.evidence_packet?.warnings.map((warning) => warning.warning_id)).toContain(
      "metadata_hint_without_evidence"
    );
  });

  it("Verified Return Path preserves new timeline warnings", async () => {
    const record = await createTimelineRunner().run({
      hollow_id: timelineAssetReferenceCheckManifest.hollow_id,
      input_payload: await loadFixtureInput("simple-slideshow-timeline.json")
    });
    const result = new VerifiedReturnPath().verifyInvocation(record);

    expect(result.evidence_packet?.warnings.map((warning) => warning.warning_id)).toContain(
      "metadata_hint_without_evidence"
    );
  });

  it("invalid timeline still completes as a validation result", async () => {
    const record = await createTimelineRunner().run({
      hollow_id: timelineSchemaCheckManifest.hollow_id,
      input_payload: { timeline: null }
    });

    expect(record.status).toBe("completed");
    expect(record.result).toMatchObject({ valid: false, status: "invalid" });
  });

  it("timeline Hollow requests no network, shell_command, workspace_write, or external_side_effect permissions", () => {
    for (const manifest of timelineHollowManifests) {
      expect(manifest.network_access).toBe(false);
      expect(manifest.permissions).not.toContain("network");
      expect(manifest.permissions).not.toContain("shell_command");
      expect(manifest.permissions).not.toContain("workspace_write");
      expect(manifest.permissions).not.toContain("external_side_effect");
    }
  });

  it("V1_HOLLOW_MANIFESTS remains exactly 14", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(14);
  });

  it("V1 catalog contains no hollow.timeline IDs", () => {
    for (const manifest of V1_HOLLOW_MANIFESTS) {
      expect(manifest.hollow_id.startsWith("hollow.timeline.")).toBe(false);
    }
  });

  it("Media catalog remains exactly 4", () => {
    expect(MEDIA_HOLLOW_MANIFESTS).toHaveLength(4);
  });

  it("Media catalog contains no hollow.timeline IDs", () => {
    for (const manifest of MEDIA_HOLLOW_MANIFESTS) {
      expect(manifest.hollow_id.startsWith("hollow.timeline.")).toBe(false);
    }
  });
});

function createTimelineRunner(): HollowRunner {
  return new HollowRunner(new HollowRegistry(timelineHollowManifests), {
    [timelineSchemaCheckManifest.hollow_id]: timelineSchemaCheckImplementation,
    [timelineDurationConsistencyManifest.hollow_id]: timelineDurationConsistencyImplementation,
    [timelineAssetReferenceCheckManifest.hollow_id]: timelineAssetReferenceCheckImplementation,
    [timelineTrackReferenceCheckManifest.hollow_id]: timelineTrackReferenceCheckImplementation
  });
}

async function loadFixtureInput(name: string): Promise<JsonValue> {
  const fixture = JSON.parse(
    await readFile(`examples/hollowcut-timeline-demo/${name}`, "utf8")
  ) as Record<string, unknown>;
  return ({
    timeline: fixture.timeline,
    assets: fixture.assets,
    tracks: fixture.tracks,
    captions: fixture.captions ?? []
  } as unknown) as JsonValue;
}

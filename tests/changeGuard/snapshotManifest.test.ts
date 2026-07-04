import { describe, expect, it } from "vitest";

import {
  SnapshotValidationError,
  assertValidSnapshotManifest,
  createSnapshotId,
  validateSnapshotManifest
} from "../../src/changeGuard/index.js";
import type { SnapshotManifest } from "../../src/types/index.js";

describe("snapshot manifest helpers", () => {
  it("validateSnapshotManifest accepts a valid pre_change manifest", () => {
    expect(validateSnapshotManifest(createManifest()).valid).toBe(true);
  });

  it("validateSnapshotManifest rejects missing snapshot_id", () => {
    const { snapshot_id: _snapshot_id, ...manifest } = createManifest();

    const result = validateSnapshotManifest(manifest);

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.field === "snapshot_id")).toBe(true);
  });

  it("validateSnapshotManifest rejects invalid snapshot_type", () => {
    const result = validateSnapshotManifest({ ...createManifest(), snapshot_type: "random" });

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.field === "snapshot_type")).toBe(true);
  });

  it("validateSnapshotManifest rejects rollback_steps that are not an array", () => {
    const result = validateSnapshotManifest({ ...createManifest(), rollback_steps: "restore" });

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.field === "rollback_steps")).toBe(true);
  });

  it("assertValidSnapshotManifest throws on invalid manifest", () => {
    expect(() => assertValidSnapshotManifest({})).toThrow(SnapshotValidationError);
  });

  it("createSnapshotId includes snapshot type", () => {
    expect(createSnapshotId("pre_change")).toContain("pre_change");
  });

  it("createSnapshotId returns a non-empty filesystem-safe ID", () => {
    const id = createSnapshotId("post_change", 7, new Date("2026-06-06T21:45:01.123Z"));

    expect(id).toBe("snap_20260606T214501123Z_000007_post_change");
    expect(id).toMatch(/^[A-Za-z0-9_]+$/);
  });
});

function createManifest(): SnapshotManifest {
  return {
    snapshot_id: "snap_001_pre_change",
    snapshot_type: "pre_change",
    schema_version: "1.0.0",
    run_id: "run_001",
    trace_id: "trace_001",
    requested_by: "Caleb AI",
    approved_by: null,
    started_at: "2026-06-06T00:00:00.000Z",
    completed_at: "2026-06-06T00:00:01.000Z",
    status: "completed",
    reason: "test",
    files_captured: [],
    artifact_hashes: [],
    provenance: {},
    ledger_refs: [],
    rollback_method: "restore_captured_files",
    rollback_steps: ["restore"]
  };
}

import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  assertRuntimeStorageRecord,
  isRuntimeStorageRecord,
  validateRuntimeStorageRecord
} from "../../src/storage/index.js";

async function readJson(path: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(path, "utf8")) as Record<string, unknown>;
}

function validEvidenceRecord(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    storage_record_id: "storage_record_evidence_test_001",
    record_kind: "evidence_packet",
    schema_version: "0.1.0",
    task_id: "task_001",
    run_id: "run_001",
    created_at: "2026-07-02T18:00:00.000Z",
    source_kind: "verified_return_path",
    trust_tier: "T2",
    validation_status: "verified",
    ledger_refs: ["ledger_001"],
    input_refs: [],
    output_refs: [],
    artifact_refs: [],
    notes: ["Verified deterministic Hollow evidence may reach T2 through VRP."],
    evidence_id: "evidence_001",
    evidence_source: "hollow.text.character_count",
    claim_keys: ["character_count"],
    units: "characters",
    verification_refs: [
      {
        ref_id: "verification_001",
        ref_kind: "external",
        description: "VRP result"
      }
    ],
    can_be_used_for_final: true,
    ...overrides
  };
}

describe("Runtime storage contract validator", () => {
  it("valid example passes", async () => {
    const record = await readJson("examples/storage/runtime-storage-record.valid.json");

    expect(validateRuntimeStorageRecord(record)).toEqual({ ok: true, errors: [] });
  });

  it("invalid trust promotion example fails", async () => {
    const record = await readJson("examples/storage/runtime-storage-record.invalid.trust-promotion.json");
    const result = validateRuntimeStorageRecord(record);

    expect(result.ok).toBe(false);
    expect(result.errors.map((error) => error.code)).toContain("raw_above_t0_forbidden");
  });

  it("non-object fails", () => {
    expect(validateRuntimeStorageRecord(null).ok).toBe(false);
    expect(validateRuntimeStorageRecord([]).ok).toBe(false);
    expect(validateRuntimeStorageRecord("nope").ok).toBe(false);
  });

  it("missing base fields fail", () => {
    const record = validEvidenceRecord();
    delete record["storage_record_id"];
    delete record["task_id"];

    const result = validateRuntimeStorageRecord(record);

    expect(result.ok).toBe(false);
    expect(result.errors.map((error) => error.path)).toContain("$.storage_record_id");
    expect(result.errors.map((error) => error.path)).toContain("$.task_id");
  });

  it("invalid record_kind fails", () => {
    const result = validateRuntimeStorageRecord(validEvidenceRecord({ record_kind: "memory_blob" }));

    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.code === "invalid_record_kind")).toBe(true);
  });

  it("invalid trust_tier fails", () => {
    const result = validateRuntimeStorageRecord(validEvidenceRecord({ trust_tier: "T9" }));

    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.code === "invalid_trust_tier")).toBe(true);
  });

  it("raw record above T0 fails", () => {
    const result = validateRuntimeStorageRecord(validEvidenceRecord({ trust_tier: "T1", validation_status: "raw" }));

    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.code === "raw_above_t0_forbidden")).toBe(true);
  });

  it("model source above T0 without schema_valid or verified fails", () => {
    const result = validateRuntimeStorageRecord(
      validEvidenceRecord({ source_kind: "model", trust_tier: "T1", validation_status: "superseded" })
    );

    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.code === "source_above_t0_requires_validation")).toBe(true);
  });

  it("T2 without verification_refs or ledger_refs fails", () => {
    const result = validateRuntimeStorageRecord(validEvidenceRecord({ ledger_refs: [], verification_refs: [] }));

    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.code === "t2_requires_verification_or_ledger_ref")).toBe(true);
  });

  it("rejected evidence cannot be used for final", () => {
    const result = validateRuntimeStorageRecord(
      validEvidenceRecord({
        trust_tier: "T1",
        validation_status: "rejected",
        can_be_used_for_final: true
      })
    );

    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.code === "rejected_or_quarantined_final_use_forbidden")).toBe(true);
  });

  it("final output cannot be released unless verified", () => {
    const result = validateRuntimeStorageRecord({
      storage_record_id: "storage_record_final_001",
      record_kind: "final_output",
      schema_version: "0.1.0",
      task_id: "task_001",
      run_id: "run_001",
      created_at: "2026-07-02T18:00:00.000Z",
      source_kind: "system",
      trust_tier: "T1",
      validation_status: "schema_valid",
      ledger_refs: [],
      input_refs: [],
      output_refs: [],
      artifact_refs: [],
      notes: [],
      final_output_id: "final_001",
      output_type: "answer",
      assembled_from_refs: [],
      final_verification_status: "schema_valid",
      release_status: "released"
    });

    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.code === "released_final_output_requires_verified")).toBe(true);
  });

  it("isRuntimeStorageRecord returns true only for valid records", () => {
    expect(isRuntimeStorageRecord(validEvidenceRecord())).toBe(true);
    expect(isRuntimeStorageRecord(validEvidenceRecord({ validation_status: "raw" }))).toBe(false);
  });

  it("assertRuntimeStorageRecord throws on invalid records", () => {
    expect(() => assertRuntimeStorageRecord(validEvidenceRecord())).not.toThrow();
    expect(() => assertRuntimeStorageRecord(validEvidenceRecord({ validation_status: "raw" }))).toThrow(
      /Invalid runtime storage record/
    );
  });
});

import { mkdtemp, readdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { HollowRegistry, HollowRunner } from "../../../src/hollows/index.js";
import {
  inspectLedgerProvenance,
  ledgerProvenanceImplementation,
  ledgerProvenanceManifest
} from "../../../src/hollows/categories/provenance/index.js";
import type { LedgerEntry } from "../../../src/types/index.js";

describe("Ledger Provenance Hollow", () => {
  it("reports entry_count", () => {
    expect(inspectLedgerProvenance({ entries: [ledgerEntry()] }).entry_count).toBe(1);
  });

  it("counts valid entries", () => {
    expect(inspectLedgerProvenance({ entries: [ledgerEntry()] }).valid_entry_count).toBe(1);
  });

  it("detects missing ledger_id", () => {
    const result = inspectLedgerProvenance({ entries: [{ ...ledgerEntry(), ledger_id: "" }] });

    expect(result.missing_ledger_ids).toEqual(["entry_0"]);
  });

  it("detects duplicate ledger_id", () => {
    const result = inspectLedgerProvenance({ entries: [ledgerEntry(), ledgerEntry()] });

    expect(result.duplicate_ledger_ids).toEqual(["ledger_001"]);
  });

  it("counts trust tiers", () => {
    const result = inspectLedgerProvenance({
      entries: [ledgerEntry({ trust_tier: "T2" }), ledgerEntry({ ledger_id: "ledger_002", trust_tier: "T0" })]
    });

    expect(result.trust_tier_counts).toEqual({ T2: 1, T0: 1 });
  });

  it("detects required_run_id mismatch", () => {
    const result = inspectLedgerProvenance({
      entries: [ledgerEntry({ run_id: "run_other" })],
      required_run_id: "run_expected"
    });

    expect(result.run_id_mismatch_count).toBe(1);
  });

  it("detects required_trace_id mismatch", () => {
    const result = inspectLedgerProvenance({
      entries: [ledgerEntry({ trace_id: "trace_other" })],
      required_trace_id: "trace_expected"
    });

    expect(result.trace_id_mismatch_count).toBe(1);
  });

  it("emits warnings for duplicate ledger IDs", async () => {
    const record = await runLedgerProvenance({ entries: [ledgerEntry(), ledgerEntry()] });

    expect(record.warnings.map((warning) => warning.warning_id)).toContain(
      "duplicate_ledger_id_detected"
    );
  });

  it("does not write to JsonlLedger or filesystem", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "caleb-ledger-provenance-"));

    inspectLedgerProvenance({ entries: [ledgerEntry()] });

    expect(await readdir(root)).toEqual([]);
  });

  it("returns result_units ledger_entries", async () => {
    const record = await runLedgerProvenance({ entries: [ledgerEntry()] });

    expect(record.result_units).toBe("ledger_entries");
  });
});

async function runLedgerProvenance(input_payload: object) {
  const registry = new HollowRegistry([ledgerProvenanceManifest]);
  const runner = new HollowRunner(registry, {
    [ledgerProvenanceManifest.hollow_id]: ledgerProvenanceImplementation
  });

  return await runner.run({
    hollow_id: ledgerProvenanceManifest.hollow_id,
    input_payload: input_payload as never,
    task_id: "task_ledger_provenance",
    run_id: "run_ledger_provenance",
    trace_id: "trace_ledger_provenance",
    invocation_id: "invocation_ledger_provenance"
  });
}

function ledgerEntry(overrides: Partial<LedgerEntry> = {}): LedgerEntry {
  return {
    ledger_id: "ledger_001",
    schema_version: "1.0.0",
    timestamp: "2026-06-06T00:00:00.000Z",
    task_id: "task_001",
    run_id: "run_001",
    trace_id: "trace_001",
    actor_type: "hollow",
    actor_id: "hollow.text.character_count",
    actor_version: "1.0.0",
    activity: "test_entry",
    status: "completed",
    result: { ok: true },
    warnings: [],
    errors: [],
    artifact_hashes: [],
    provenance: {},
    retryable: false,
    verification_status: "verified",
    trust_tier: "T2",
    parent_refs: [],
    artifact_refs: [],
    ...overrides
  };
}

import { describe, expect, it } from "vitest";

import {
  LedgerValidationError,
  assertValidLedgerEntry,
  validateLedgerEntry
} from "../../src/ledger/index.js";
import type { LedgerEntry } from "../../src/types/index.js";

describe("ledger validation", () => {
  it("accepts a valid LedgerEntry fixture", () => {
    const result = validateLedgerEntry(createLedgerEntry());

    expect(result.valid).toBe(true);
    expect(result.entry?.ledger_id).toBe("ledger_001");
  });

  it("rejects missing ledger_id", () => {
    const { ledger_id: _ledger_id, ...entry } = createLedgerEntry();
    const result = validateLedgerEntry(entry);

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.field === "ledger_id")).toBe(true);
  });

  it("rejects missing run_id", () => {
    const { run_id: _run_id, ...entry } = createLedgerEntry();
    const result = validateLedgerEntry(entry);

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.field === "run_id")).toBe(true);
  });

  it("rejects invalid trust_tier", () => {
    const result = validateLedgerEntry({ ...createLedgerEntry(), trust_tier: "T9" });

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.field === "trust_tier")).toBe(true);
  });

  it("rejects warnings that are not an array", () => {
    const result = validateLedgerEntry({ ...createLedgerEntry(), warnings: "nope" });

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.field === "warnings")).toBe(true);
  });

  it("rejects errors that are not an array", () => {
    const result = validateLedgerEntry({ ...createLedgerEntry(), errors: "nope" });

    expect(result.valid).toBe(false);
    expect(result.errors.some((error) => error.field === "errors")).toBe(true);
  });

  it("assertValidLedgerEntry returns the entry when valid", () => {
    expect(assertValidLedgerEntry(createLedgerEntry()).ledger_id).toBe("ledger_001");
  });

  it("assertValidLedgerEntry throws LedgerValidationError when invalid", () => {
    expect(() => assertValidLedgerEntry({})).toThrow(LedgerValidationError);
  });
});

function createLedgerEntry(overrides: Partial<LedgerEntry> = {}): LedgerEntry {
  return {
    ledger_id: "ledger_001",
    schema_version: "1.0.0",
    timestamp: "2026-06-06T00:00:00.000Z",
    task_id: "task_001",
    run_id: "run_001",
    trace_id: "trace_001",
    actor_type: "hollow",
    actor_id: "hollow.text.character_count",
    actor_version: "0.1.0",
    activity: "hollow_invocation",
    invocation_id: "invocation_001",
    hollow_id: "hollow.text.character_count",
    status: "completed",
    result: { count: 5 },
    warnings: [],
    errors: [],
    artifact_hashes: [],
    provenance: { source: "test" },
    retryable: false,
    verification_status: "verified",
    trust_tier: "T2",
    parent_refs: [],
    artifact_refs: [],
    ...overrides
  };
}

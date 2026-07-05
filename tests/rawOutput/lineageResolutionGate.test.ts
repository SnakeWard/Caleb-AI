import { describe, expect, it } from "vitest";

import { resolveLineageReferences } from "../../src/rawOutput/index.js";
import type { LedgerEntry } from "../../src/types/index.js";

const ledgerEntry = (ledger_id: string): LedgerEntry => ({
  ledger_id,
  schema_version: "1.0.0",
  timestamp: "2026-07-05T00:00:00.000Z",
  task_id: "task",
  run_id: "run",
  trace_id: "trace",
  actor_type: "model",
  actor_id: "provider",
  actor_version: "1.0.0",
  activity: "raw_output_artifact_recorded",
  status: "completed",
  result: { digest: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
  warnings: [],
  errors: [],
  artifact_hashes: [],
  provenance: {},
  retryable: false,
  verification_status: "schema_valid",
  trust_tier: "T1",
  parent_refs: [],
  artifact_refs: ["raw-output:sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"]
});

describe("lineage resolution gate", () => {
  it("resolves post-H4 UUID-style ledger IDs", () => {
    const id = "ledger_123e4567-e89b-12d3-a456-426614174000";
    const result = resolveLineageReferences([id], [ledgerEntry(id)]);

    expect(result.ok).toBe(true);
    expect(result.resolved_refs).toEqual([id]);
  });

  it("rejects fabricated and counter-era lineage refs", () => {
    const valid = "ledger_123e4567-e89b-12d3-a456-426614174000";
    const result = resolveLineageReferences(
      ["ledger_1", "ledger_123e4567-e89b-12d3-a456-426614174999", "not-a-ledger-id"],
      [ledgerEntry(valid)]
    );

    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain("counter_era_ledger_id");
    expect(result.issues.map((issue) => issue.code)).toContain("unresolved_lineage_ref");
    expect(result.issues.map((issue) => issue.code)).toContain("invalid_ledger_id_format");
  });
});

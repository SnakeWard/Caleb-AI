import { describe, expect, it } from "vitest";

import {
  createInMemoryRawOutputStore,
  resolveLineageReferences,
  resolveRawOutputDigestReferences
} from "../../src/rawOutput/index.js";
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

  it("walks canonical-artifact derived_from digests to intact T0 M3 evidence", async () => {
    const store = createInMemoryRawOutputStore();
    const stored = await store.store({
      output_text: "{\"summary\":\"model semantic payload\"}",
      provider_id: "anthropic",
      model_id: "claude-haiku-4-5",
      created_at: "2026-07-19T00:00:00.000Z"
    });
    expect(stored.record).toBeDefined();
    const digest = stored.record!.digest;
    const result = await resolveRawOutputDigestReferences([digest], store);
    expect(result).toEqual({ ok: true, resolved_refs: [digest], issues: [] });
  });

  it("rejects malformed, duplicate, missing, or non-T0 raw digest lineage", async () => {
    const store = createInMemoryRawOutputStore();
    const stored = await store.store({
      output_text: "bounded",
      provider_id: "anthropic",
      model_id: "claude-haiku-4-5",
      created_at: "2026-07-19T00:00:00.000Z"
    });
    const digest = stored.record!.digest;
    const missing = `sha256:${"f".repeat(64)}`;
    const result = await resolveRawOutputDigestReferences(["bad", digest, digest, missing], store);
    expect(result.issues.map(({ code }) => code)).toEqual(expect.arrayContaining([
      "invalid_raw_output_digest",
      "duplicate_raw_output_digest",
      "unresolved_raw_output_digest"
    ]));
  });
});

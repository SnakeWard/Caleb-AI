import { describe, expect, it } from "vitest";

import {
  createLedgerEntryFromEvidence,
  createLedgerEntryFromInvocation,
  createLedgerId
} from "../../src/ledger/index.js";
import type { EvidencePacket, HollowInvocationRecord } from "../../src/types/index.js";

describe("ledger entry factory", () => {
  it("createLedgerEntryFromInvocation preserves run_id, trace_id, task_id, invocation_id, hollow_id", () => {
    const entry = createLedgerEntryFromInvocation(createInvocation(), {
      ledger_id: "ledger_invocation",
      timestamp: "2026-06-06T00:00:01.000Z"
    });

    expect(entry.run_id).toBe("run_001");
    expect(entry.trace_id).toBe("trace_001");
    expect(entry.task_id).toBe("task_001");
    expect(entry.invocation_id).toBe("invocation_001");
    expect(entry.hollow_id).toBe("hollow.text.character_count");
  });

  it("createLedgerEntryFromInvocation sets actor_type hollow", () => {
    expect(createLedgerEntryFromInvocation(createInvocation()).actor_type).toBe("hollow");
  });

  it("createLedgerEntryFromInvocation preserves trust_tier and verification_status", () => {
    const entry = createLedgerEntryFromInvocation(
      createInvocation({ trust_tier: "T0", verification_status: "unverified" })
    );

    expect(entry.trust_tier).toBe("T0");
    expect(entry.verification_status).toBe("unverified");
  });

  it("createLedgerEntryFromInvocation does not promote trust tier", () => {
    const entry = createLedgerEntryFromInvocation(createInvocation({ trust_tier: "T0" }));

    expect(entry.trust_tier).toBe("T0");
  });

  it("createLedgerEntryFromEvidence sets actor_type verified_return_path", () => {
    expect(createLedgerEntryFromEvidence(createEvidence()).actor_type).toBe(
      "verified_return_path"
    );
  });

  it("createLedgerEntryFromEvidence preserves EvidencePacket trust_tier", () => {
    expect(createLedgerEntryFromEvidence(createEvidence({ trust_tier: "T1" })).trust_tier).toBe(
      "T1"
    );
  });

  it("createLedgerEntryFromEvidence preserves warnings/errors/artifact_hashes", () => {
    const entry = createLedgerEntryFromEvidence(
      createEvidence({
        warnings: [{ warning_id: "warning_001", message: "Careful.", severity: "warning" }],
        errors: [{ error_id: "error_001", message: "Nope.", severity: "error", retryable: false }],
        artifact_hashes: [{ artifact_id: "artifact_001", hash: "sha256:abc", algorithm: "sha256" }]
      })
    );

    expect(entry.warnings[0]?.warning_id).toBe("warning_001");
    expect(entry.errors[0]?.error_id).toBe("error_001");
    expect(entry.artifact_hashes[0]?.artifact_id).toBe("artifact_001");
  });

  it("createLedgerId creates non-empty IDs with expected prefix", () => {
    const id = createLedgerId("testledger");

    expect(id.startsWith("testledger_")).toBe(true);
    expect(id.length).toBeGreaterThan("testledger_".length);
  });
});

function createInvocation(
  overrides: Partial<HollowInvocationRecord> = {}
): HollowInvocationRecord {
  return {
    hollow_id: "hollow.text.character_count",
    hollow_name: "Character Count Hollow",
    hollow_version: "0.1.0",
    schema_version: "1.0.0",
    invocation_id: "invocation_001",
    task_id: "task_001",
    run_id: "run_001",
    trace_id: "trace_001",
    caller: "HollowRunner",
    requested_by: "Caleb AI",
    approved_by: null,
    input_type: "text",
    input_digest: "sha256:input",
    input_payload: { text: "Caleb" },
    permissions: ["none"],
    execution_mode: "local_deterministic",
    deterministic: true,
    started_at: "2026-06-06T00:00:00.000Z",
    completed_at: "2026-06-06T00:00:00.001Z",
    status: "completed",
    result: { count: 5 },
    result_units: "characters",
    checks: [],
    warnings: [],
    errors: [],
    artifact_hashes: [],
    provenance: { runner: "HollowRunner" },
    ledger_refs: [],
    retryable: false,
    confidence_level: "unverified_local_execution",
    verification_status: "verified",
    trust_tier: "T2",
    ...overrides
  };
}

function createEvidence(overrides: Partial<EvidencePacket> = {}): EvidencePacket {
  return {
    invocation_id: "invocation_001",
    task_id: "task_001",
    run_id: "run_001",
    trace_id: "trace_001",
    hollow_id: "hollow.text.character_count",
    hollow_version: "0.1.0",
    result: { count: 5 },
    result_units: "characters",
    checks: [],
    warnings: [],
    errors: [],
    artifact_hashes: [],
    provenance: { verified_return_path: true },
    ledger_refs: ["ledger_parent"],
    confidence_level: "verified",
    verification_status: "verified",
    trust_tier: "T2",
    can_model_consume: true,
    can_persist_as_truth: false,
    can_trigger_side_effect: false,
    ...overrides
  };
}

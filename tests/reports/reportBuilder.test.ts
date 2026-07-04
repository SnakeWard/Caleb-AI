import { describe, expect, it } from "vitest";

import { buildCalebReport } from "../../src/reports/index.js";
import type {
  EvidencePacket,
  HollowInvocationRecord,
  LedgerEntry
} from "../../src/types/index.js";

describe("report builder", () => {
  it("buildCalebReport creates report_id and generated_at", () => {
    const report = buildCalebReport({});

    expect(report.report_id).toMatch(/^report_/u);
    expect(Date.parse(report.generated_at)).not.toBeNaN();
  });

  it("buildCalebReport preserves explicit run_id, trace_id, and task_id", () => {
    const report = buildCalebReport({
      run_id: "run_explicit",
      trace_id: "trace_explicit",
      task_id: "task_explicit"
    });

    expect(report.run_id).toBe("run_explicit");
    expect(report.trace_id).toBe("trace_explicit");
    expect(report.task_id).toBe("task_explicit");
  });

  it("buildCalebReport infers run_id/trace_id/task_id when unambiguous", () => {
    const report = buildCalebReport({
      invocations: [createInvocation()],
      evidence_packets: [createEvidence()],
      ledger_entries: [createLedgerEntry()]
    });

    expect(report.run_id).toBe("run_001");
    expect(report.trace_id).toBe("trace_001");
    expect(report.task_id).toBe("task_001");
  });

  it("buildCalebReport does not silently choose one run_id when multiple are present", () => {
    const report = buildCalebReport({
      invocations: [createInvocation({ run_id: "run_001" })],
      ledger_entries: [createLedgerEntry({ run_id: "run_002" })]
    });

    expect("run_id" in report).toBe(false);
    expect(report.warnings.map((warning) => warning.id)).toContain("multiple_run_ids");
  });

  it("buildCalebReport counts invocations", () => {
    const report = buildCalebReport({
      invocations: [createInvocation(), createInvocation({ invocation_id: "invocation_002" })]
    });

    expect(report.stats.invocation_count).toBe(2);
  });

  it("buildCalebReport counts evidence packets", () => {
    const report = buildCalebReport({
      evidence_packets: [createEvidence(), createEvidence({ invocation_id: "invocation_002" })]
    });

    expect(report.stats.evidence_packet_count).toBe(2);
  });

  it("buildCalebReport counts ledger entries", () => {
    const report = buildCalebReport({
      ledger_entries: [createLedgerEntry(), createLedgerEntry({ ledger_id: "ledger_002" })]
    });

    expect(report.stats.ledger_entry_count).toBe(2);
  });

  it("buildCalebReport counts warnings and errors", () => {
    const report = buildCalebReport({
      invocations: [
        createInvocation({
          warnings: [{ warning_id: "warning_001", message: "Careful.", severity: "warning" }],
          errors: [{ error_id: "error_001", message: "Nope.", severity: "error", retryable: false }]
        })
      ]
    });

    expect(report.stats.warning_count).toBe(1);
    expect(report.stats.error_count).toBe(1);
  });

  it("buildCalebReport counts trust tiers", () => {
    const report = buildCalebReport({
      evidence_packets: [createEvidence({ trust_tier: "T1" })],
      ledger_entries: [createLedgerEntry({ trust_tier: "T3" })]
    });

    expect(report.stats.trust_tier_counts.T1).toBe(1);
    expect(report.stats.trust_tier_counts.T3).toBe(1);
  });

  it("buildCalebReport identifies highest trust tier seen", () => {
    const report = buildCalebReport({
      evidence_packets: [createEvidence({ trust_tier: "T2" })],
      ledger_entries: [createLedgerEntry({ trust_tier: "T4" })]
    });

    expect(report.stats.highest_trust_tier).toBe("T4");
    expect(report.summary).toContain("highest trust tier seen: T4");
  });

  it("buildCalebReport collects ledger_refs", () => {
    const report = buildCalebReport({
      evidence_packets: [createEvidence({ ledger_refs: ["ledger_parent"] })],
      ledger_entries: [createLedgerEntry({ ledger_id: "ledger_entry", parent_refs: ["ledger_parent"] })]
    });

    expect(report.ledger_refs).toEqual(["ledger_parent", "ledger_entry"]);
  });

  it("buildCalebReport collects artifact refs/hashes", () => {
    const report = buildCalebReport({
      evidence_packets: [
        createEvidence({
          artifact_hashes: [{ artifact_id: "artifact_001", hash: "sha256:abc", algorithm: "sha256" }]
        })
      ],
      ledger_entries: [createLedgerEntry({ artifact_refs: ["artifact_ref_001"] })]
    });

    expect(report.artifact_refs).toContain("artifact_001");
    expect(report.artifact_refs).toContain("artifact_ref_001");
  });

  it("buildCalebReport does not mutate input records", () => {
    const invocation = createInvocation();
    const before = JSON.stringify(invocation);

    buildCalebReport({ invocations: [invocation] });

    expect(JSON.stringify(invocation)).toBe(before);
  });
});

export function createInvocation(
  overrides: Partial<HollowInvocationRecord> = {}
): HollowInvocationRecord {
  return {
    hollow_id: "hollow.text.character_count",
    hollow_name: "Character Count Hollow",
    hollow_version: "1.0.0",
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
    result: { character_count: 5 },
    result_units: "characters",
    checks: [],
    warnings: [],
    errors: [],
    artifact_hashes: [],
    provenance: { runner: "HollowRunner" },
    ledger_refs: [],
    retryable: false,
    confidence_level: "unverified_local_execution",
    verification_status: "unverified",
    trust_tier: "T0",
    ...overrides
  };
}

export function createEvidence(overrides: Partial<EvidencePacket> = {}): EvidencePacket {
  return {
    invocation_id: "invocation_001",
    task_id: "task_001",
    run_id: "run_001",
    trace_id: "trace_001",
    hollow_id: "hollow.text.character_count",
    hollow_version: "1.0.0",
    result: { character_count: 5 },
    result_units: "characters",
    checks: [],
    warnings: [],
    errors: [],
    artifact_hashes: [],
    provenance: { verified_return_path: true },
    ledger_refs: [],
    confidence_level: "verified",
    verification_status: "verified",
    trust_tier: "T2",
    can_model_consume: true,
    can_persist_as_truth: false,
    can_trigger_side_effect: false,
    ...overrides
  };
}

export function createLedgerEntry(overrides: Partial<LedgerEntry> = {}): LedgerEntry {
  return {
    ledger_id: "ledger_001",
    schema_version: "1.0.0",
    timestamp: "2026-06-06T00:00:01.000Z",
    task_id: "task_001",
    run_id: "run_001",
    trace_id: "trace_001",
    actor_type: "verified_return_path",
    actor_id: "verified_return_path",
    actor_version: "1.0.0",
    activity: "evidence_packet_created",
    invocation_id: "invocation_001",
    hollow_id: "hollow.text.character_count",
    started_at: "2026-06-06T00:00:00.000Z",
    completed_at: "2026-06-06T00:00:00.001Z",
    status: "completed",
    result: { character_count: 5 },
    warnings: [],
    errors: [],
    artifact_hashes: [],
    provenance: { source: "EvidencePacket" },
    retryable: false,
    verification_status: "verified",
    trust_tier: "T2",
    parent_refs: [],
    artifact_refs: [],
    ...overrides
  };
}

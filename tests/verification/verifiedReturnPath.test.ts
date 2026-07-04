import { describe, expect, it } from "vitest";

import { VerifiedReturnPath } from "../../src/verification/index.js";
import type { HollowInvocationRecord } from "../../src/types/index.js";

const fixedNow = () => new Date("2026-06-06T00:00:10.000Z");

describe("VerifiedReturnPath", () => {
  it("can verify a completed deterministic safe invocation", () => {
    const result = createVerifier().verifyInvocation(createInvocation());

    expect(result.evidence_packet?.hollow_id).toBe("hollow.text.character_count");
  });

  it("accepted deterministic invocation returns decision accepted", () => {
    const result = createVerifier().verifyInvocation(createInvocation());

    expect(result.decision).toBe("accepted");
  });

  it("accepted deterministic invocation produces EvidencePacket with trust_tier T2", () => {
    const result = createVerifier().verifyInvocation(createInvocation());

    expect(result.evidence_packet?.trust_tier).toBe("T2");
  });

  it("EvidencePacket has verification_status verified", () => {
    const result = createVerifier().verifyInvocation(createInvocation());

    expect(result.evidence_packet?.verification_status).toBe("verified");
  });

  it("EvidencePacket can_model_consume true", () => {
    const result = createVerifier().verifyInvocation(createInvocation());

    expect(result.evidence_packet?.can_model_consume).toBe(true);
  });

  it("EvidencePacket can_persist_as_truth false until Ledger exists", () => {
    const result = createVerifier().verifyInvocation(createInvocation());

    expect(result.evidence_packet?.can_persist_as_truth).toBe(false);
  });

  it("EvidencePacket can_trigger_side_effect false", () => {
    const result = createVerifier().verifyInvocation(createInvocation());

    expect(result.evidence_packet?.can_trigger_side_effect).toBe(false);
  });

  it("failed invocation returns decision rejected and T0", () => {
    const result = createVerifier().verifyInvocation(createInvocation({ status: "failed" }));

    expect(result.decision).toBe("rejected");
    expect(result.trust_tier).toBe("T0");
  });

  it("blocked invocation returns decision blocked and T0", () => {
    const result = createVerifier().verifyInvocation(createInvocation({ status: "blocked" }));

    expect(result.decision).toBe("blocked");
    expect(result.trust_tier).toBe("T0");
  });

  it("missing required field returns rejected result and structured error", () => {
    const { invocation_id: _invocation_id, ...invocation } = createInvocation();

    const result = createVerifier().verifyInvocation(invocation as HollowInvocationRecord);

    expect(result.decision).toBe("rejected");
    expect(result.trust_tier).toBe("T0");
    expect(result.errors[0]).toMatchObject({
      code: "missing_required_field",
      field: "invocation_id"
    });
  });

  it("network permission blocks return path", () => {
    const result = createVerifier().verifyInvocation(createInvocation({ permissions: ["network"] }));

    expect(result.decision).toBe("blocked");
    expect(result.trust_tier).toBe("T0");
  });

  it("shell command permission blocks return path", () => {
    const result = createVerifier().verifyInvocation(
      createInvocation({ permissions: ["shell_command"] })
    );

    expect(result.decision).toBe("blocked");
    expect(result.trust_tier).toBe("T0");
  });

  it("non-deterministic completed invocation becomes T1, not T2", () => {
    const result = createVerifier().verifyInvocation(createInvocation({ deterministic: false }));

    expect(result.decision).toBe("accepted");
    expect(result.trust_tier).toBe("T1");
    expect(result.evidence_packet?.trust_tier).toBe("T1");
  });

  it("warnings are preserved", () => {
    const result = createVerifier().verifyInvocation(
      createInvocation({
        warnings: [
          {
            warning_id: "warning.low",
            message: "Non-blocking warning.",
            severity: "warning"
          }
        ]
      })
    );

    expect(result.decision).toBe("accepted");
    expect(result.evidence_packet?.warnings[0]?.warning_id).toBe("warning.low");
  });

  it("critical warning rejects according to V1 policy", () => {
    const result = createVerifier().verifyInvocation(
      createInvocation({
        warnings: [
          {
            warning_id: "warning.critical",
            message: "Blocking warning.",
            severity: "critical"
          }
        ]
      })
    );

    expect(result.decision).toBe("rejected");
    expect(result.trust_tier).toBe("T0");
  });

  it("artifact hashes are preserved", () => {
    const result = createVerifier().verifyInvocation(
      createInvocation({
        artifact_hashes: [
          {
            artifact_id: "artifact_001",
            hash: "sha256:artifact",
            algorithm: "sha256"
          }
        ]
      })
    );

    expect(result.evidence_packet?.artifact_hashes[0]?.artifact_id).toBe("artifact_001");
  });

  it("original invocation record is not mutated", () => {
    const invocation = createInvocation({
      provenance: { runner: "HollowRunner" },
      ledger_refs: ["ledger_existing"]
    });
    const before = JSON.stringify(invocation);

    createVerifier().verifyInvocation(invocation);

    expect(JSON.stringify(invocation)).toBe(before);
  });

  it("no Ledger refs are invented by the Verified Return Path", () => {
    const noLedger = createVerifier().verifyInvocation(createInvocation());
    const existingLedger = createVerifier().verifyInvocation(
      createInvocation({ ledger_refs: ["ledger_existing"] })
    );

    expect(noLedger.evidence_packet?.ledger_refs).toEqual([]);
    expect(existingLedger.evidence_packet?.ledger_refs).toEqual(["ledger_existing"]);
  });
});

function createVerifier(): VerifiedReturnPath {
  return new VerifiedReturnPath({ now: fixedNow });
}

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
    verification_status: "unverified",
    trust_tier: "T0",
    ...overrides
  };
}

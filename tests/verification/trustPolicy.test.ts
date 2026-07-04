import { describe, expect, it } from "vitest";

import {
  assignV1TrustTier,
  evaluateInvocationStructure
} from "../../src/verification/index.js";
import type { HollowInvocationRecord } from "../../src/types/index.js";

describe("trust policy", () => {
  it("evaluateInvocationStructure accepts a complete valid invocation fixture", () => {
    const result = evaluateInvocationStructure(createInvocation());

    expect(result.valid).toBe(true);
    expect(result.missing_fields).toEqual([]);
  });

  it("evaluateInvocationStructure rejects missing invocation_id", () => {
    const { invocation_id: _invocation_id, ...invocation } = createInvocation();

    const result = evaluateInvocationStructure(invocation);

    expect(result.valid).toBe(false);
    expect(result.missing_fields).toContain("invocation_id");
  });

  it("evaluateInvocationStructure lists missing required fields", () => {
    const result = evaluateInvocationStructure({});

    expect(result.valid).toBe(false);
    expect(result.missing_fields).toContain("invocation_id");
    expect(result.missing_fields).toContain("task_id");
    expect(result.missing_fields).toContain("trace_id");
  });

  it("assignV1TrustTier returns T2 for completed deterministic safe invocation with no errors", () => {
    expect(assignV1TrustTier(createInvocation())).toBe("T2");
  });

  it("assignV1TrustTier returns T1 for completed non-deterministic invocation", () => {
    expect(assignV1TrustTier(createInvocation({ deterministic: false }))).toBe("T1");
  });

  it("assignV1TrustTier returns T0 for failed invocation", () => {
    expect(assignV1TrustTier(createInvocation({ status: "failed" }))).toBe("T0");
  });

  it("assignV1TrustTier returns T0 for network permission", () => {
    expect(assignV1TrustTier(createInvocation({ permissions: ["network"] }))).toBe("T0");
  });

  it("assignV1TrustTier returns T0 for shell_command permission", () => {
    expect(assignV1TrustTier(createInvocation({ permissions: ["shell_command"] }))).toBe("T0");
  });

  it("assignV1TrustTier returns T0 for external_side_effect permission", () => {
    expect(assignV1TrustTier(createInvocation({ permissions: ["external_side_effect"] }))).toBe(
      "T0"
    );
  });

  it("assignV1TrustTier does not return T3 or T4 in Pass 04", () => {
    const assigned = [
      assignV1TrustTier(createInvocation()),
      assignV1TrustTier(createInvocation({ deterministic: false })),
      assignV1TrustTier(createInvocation({ status: "failed" }))
    ];

    expect(assigned).not.toContain("T3");
    expect(assigned).not.toContain("T4");
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
    verification_status: "unverified",
    trust_tier: "T0",
    ...overrides
  };
}

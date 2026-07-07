import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";
import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";
import { validateRoleArtifactBundleConsistencyReport } from "../../src/roles/index.js";

function validReport(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schema_version: "0.1.0",
    report_id: "report_001",
    bundle_id: "bundle_001",
    task_id: "task_001",
    run_id: "run_001",
    trace_id: "trace_001",
    context_id: "context_001",
    report_status: "clean",
    bundle_status: "complete",
    validation_status: "valid",
    artifact_ref_summary: {
      total_artifact_refs: 2,
      by_role: [{ role_id: "planner", count: 1 }],
      by_artifact_type: [{ artifact_type: "plan", count: 1 }],
      by_acceptance_status: [{ acceptance_status: "accepted", count: 2 }]
    },
    handoff_gate_summary: {
      total_handoff_gate_refs: 1,
      allowed_count: 1,
      blocked_count: 0,
      invalid_count: 0,
      by_status: [{ status: "allowed", count: 1 }]
    },
    consistency_checks: [
      {
        check_id: "shape_valid",
        status: "pass",
        summary: "Shape is valid.",
        related_roles: ["planner"],
        related_artifact_ids: ["artifact_001"],
        related_handoff_refs: ["planner->implementer:artifact_001"]
      }
    ],
    findings: [
      {
        finding_id: "clean",
        severity: "info",
        code: "clean",
        summary: "Clean summary.",
        related_roles: ["planner"],
        related_artifact_ids: ["artifact_001"]
      }
    ],
    warnings: [],
    created_at: "2026-06-13T00:00:00.000Z",
    ...overrides
  };
}

function expectInvalid(code: string, report: unknown): void {
  const result = validateRoleArtifactBundleConsistencyReport(report);

  expect(result.ok).toBe(false);
  expect(result.errors.some((error) => error.code === code)).toBe(true);
}

describe("validateRoleArtifactBundleConsistencyReport", () => {
  it("accepts a minimal valid consistency report", () => {
    expect(validateRoleArtifactBundleConsistencyReport(validReport())).toEqual({ ok: true, errors: [] });
  });

  it("rejects null/array/non-object root", () => {
    expectInvalid("invalid_root", null);
    expectInvalid("invalid_root", []);
    expectInvalid("invalid_root", "nope");
  });

  it("rejects invalid schema_version", () => {
    expectInvalid("invalid_schema_version", validReport({ schema_version: "9.9.9" }));
  });

  it("rejects missing report_id", () => {
    const report = validReport();
    delete report["report_id"];
    expectInvalid("missing_required_field", report);
  });

  it("rejects missing bundle_id", () => {
    const report = validReport();
    delete report["bundle_id"];
    expectInvalid("missing_required_field", report);
  });

  it("rejects missing task_id/run_id/trace_id/context_id", () => {
    for (const field of ["task_id", "run_id", "trace_id", "context_id"]) {
      const report = validReport();
      delete report[field];
      expectInvalid("missing_required_field", report);
    }
  });

  it("rejects invalid report_status", () => {
    expectInvalid("invalid_report_status", validReport({ report_status: "maybe" }));
  });

  it("rejects invalid validation_status", () => {
    expectInvalid("invalid_validation_status", validReport({ validation_status: "maybe" }));
  });

  it("rejects invalid bundle_status", () => {
    expectInvalid("invalid_bundle_status", validReport({ bundle_status: "maybe" }));
  });

  it("rejects invalid artifact_ref_summary shape", () => {
    expectInvalid("invalid_artifact_ref_summary", validReport({ artifact_ref_summary: [] }));
  });

  it("rejects negative artifact summary counts", () => {
    expectInvalid(
      "invalid_count",
      validReport({ artifact_ref_summary: { ...artifactSummary(), total_artifact_refs: -1 } })
    );
  });

  it("rejects invalid role_id in artifact_ref_summary.by_role", () => {
    expectInvalid(
      "unknown_role_id",
      validReport({ artifact_ref_summary: { ...artifactSummary(), by_role: [{ role_id: "oracle", count: 1 }] } })
    );
  });

  it("rejects invalid artifact_type in artifact_ref_summary.by_artifact_type", () => {
    expectInvalid(
      "invalid_artifact_type",
      validReport({ artifact_ref_summary: { ...artifactSummary(), by_artifact_type: [{ artifact_type: "dream", count: 1 }] } })
    );
  });

  it("rejects invalid acceptance_status in artifact_ref_summary.by_acceptance_status", () => {
    expectInvalid(
      "invalid_acceptance_status",
      validReport({
        artifact_ref_summary: { ...artifactSummary(), by_acceptance_status: [{ acceptance_status: "maybe", count: 1 }] }
      })
    );
  });

  it("rejects invalid handoff_gate_summary shape", () => {
    expectInvalid("invalid_handoff_gate_summary", validReport({ handoff_gate_summary: [] }));
  });

  it("rejects negative handoff summary counts", () => {
    expectInvalid(
      "invalid_count",
      validReport({ handoff_gate_summary: { ...handoffSummary(), allowed_count: -1 } })
    );
  });

  it("rejects invalid RoleHandoffGateStatus in handoff_gate_summary.by_status", () => {
    expectInvalid(
      "invalid_handoff_gate_status",
      validReport({ handoff_gate_summary: { ...handoffSummary(), by_status: [{ status: "maybe", count: 1 }] } })
    );
  });

  it("rejects invalid consistency check status", () => {
    expectInvalid("invalid_consistency_check_status", validReport({ consistency_checks: [{ check_id: "c1", status: "maybe", summary: "x" }] }));
  });

  it("rejects missing consistency check check_id", () => {
    expectInvalid("missing_required_field", validReport({ consistency_checks: [{ status: "pass", summary: "x" }] }));
  });

  it("rejects missing consistency check summary", () => {
    expectInvalid("missing_required_field", validReport({ consistency_checks: [{ check_id: "c1", status: "pass" }] }));
  });

  it("rejects invalid finding severity", () => {
    expectInvalid("invalid_finding_severity", validReport({ findings: [{ finding_id: "f1", severity: "maybe", code: "x", summary: "x" }] }));
  });

  it("rejects missing finding_id", () => {
    expectInvalid("missing_required_field", validReport({ findings: [{ severity: "info", code: "x", summary: "x" }] }));
  });

  it("rejects missing finding code", () => {
    expectInvalid("missing_required_field", validReport({ findings: [{ finding_id: "f1", severity: "info", summary: "x" }] }));
  });

  it("rejects missing finding summary", () => {
    expectInvalid("missing_required_field", validReport({ findings: [{ finding_id: "f1", severity: "info", code: "x" }] }));
  });

  it("rejects embedded full RoleArtifactReferenceBundle object", () => {
    expectInvalid("forbidden_key", validReport({ bundle: { bundle_id: "bundle_001", artifact_refs: [] } }));
  });

  it("rejects embedded full RoleArtifact object", () => {
    expectInvalid("forbidden_key", validReport({ artifact: { artifact_id: "a1", claims: [], summary: "x" } }));
  });

  it("rejects embedded RoleHandoffEnvelope object", () => {
    expectInvalid("forbidden_key", validReport({ handoff: { source_role: "planner", handoff_status: "ready" } }));
  });

  it("rejects embedded RoleHandoffGateResult object", () => {
    expectInvalid("forbidden_key", validReport({ handoff_result: { allowed: true, status: "allowed", errors: [] } }));
  });

  it("rejects telemetry_trace", () => {
    expectInvalid("forbidden_key", validReport({ telemetry_trace: { trace_id: "trace_001" } }));
  });

  it("rejects telemetry_trace.events", () => {
    expectInvalid("forbidden_key", validReport({ telemetry_trace: { events: [] } }));
  });

  it("rejects execution_context", () => {
    expectInvalid("forbidden_key", validReport({ execution_context: { context_id: "context_001" } }));
  });

  it("rejects hollow_input", () => {
    expectInvalid("forbidden_key", validReport({ hollow_input: { text: "raw" } }));
  });

  it("rejects input_payload", () => {
    expectInvalid("forbidden_key", validReport({ input_payload: { text: "raw" } }));
  });

  it("rejects chain_of_thought", () => {
    expectInvalid("forbidden_key", validReport({ chain_of_thought: "private" }));
  });

  it("rejects chainOfThought", () => {
    expectInvalid("forbidden_key", validReport({ chainOfThought: "private" }));
  });

  it("rejects scratchpad", () => {
    expectInvalid("forbidden_key", validReport({ scratchpad: "private" }));
  });

  it("rejects privateReasoning", () => {
    expectInvalid("forbidden_key", validReport({ privateReasoning: "private" }));
  });

  it("validates valid report fixture", async () => {
    const fixture = JSON.parse(
      await readFile("examples/roles/reports/role-artifact-bundle-consistency-report.valid.json", "utf8")
    );

    expect(validateRoleArtifactBundleConsistencyReport(fixture)).toEqual({ ok: true, errors: [] });
  });

  it("validates that fixture is summary-only", async () => {
    const fixture = JSON.parse(
      await readFile("examples/roles/reports/role-artifact-bundle-consistency-report.valid.json", "utf8")
    );

    expect(hasKey(fixture, "artifact_refs")).toBe(false);
    expect(hasKey(fixture, "handoff_gate_refs")).toBe(false);
    expect(hasKey(fixture, "claims")).toBe(false);
    expect(hasKey(fixture, "artifact")).toBe(false);
    expect(hasKey(fixture, "bundle")).toBe(false);
    expect(hasKey(fixture, "handoff")).toBe(false);
  });
});

describe("role artifact bundle report validator isolation locks", () => {
  it("does not import reportBuilder", async () => {
    const source = await readFile("src/roles/roleArtifactBundleReportValidator.ts", "utf8");
    expect(source).not.toContain("reportBuilder");
  });

  it("does not import src/reports", async () => {
    const source = await readFile("src/roles/roleArtifactBundleReportValidator.ts", "utf8");
    expect(source).not.toMatch(/from\s+["'][^"']*reports/i);
  });

  it("does not import executeWorkGraphLite", async () => {
    const source = await readFile("src/roles/roleArtifactBundleReportValidator.ts", "utf8");
    expect(source).not.toContain("executeWorkGraphLite");
  });

  it("does not import dispatchHollow", async () => {
    const source = await readFile("src/roles/roleArtifactBundleReportValidator.ts", "utf8");
    expect(source).not.toContain("dispatchHollow");
  });

  it("does not import HollowRunner", async () => {
    const source = await readFile("src/roles/roleArtifactBundleReportValidator.ts", "utf8");
    expect(source).not.toContain("HollowRunner");
  });

  it("does not import model/API/provider modules", async () => {
    const source = await readFile("src/roles/roleArtifactBundleReportValidator.ts", "utf8");
    expect(source).not.toMatch(/from\s+["'][^"']*(model|provider|api|openai|anthropic)[^"']*["']/i);
  });

  it("does not add role CLI flags", async () => {
    const source = await readFile("src/cli/commandParser.ts", "utf8");

    expect(source).not.toContain("--role");
    expect(source).not.toContain("--role-artifact");
    expect(source).not.toContain("--role-contract");
    expect(source).not.toContain("--role-handoff");
    expect(source).not.toContain("--role-bundle");
    expect(source).not.toContain("--role-report");
  });

  it("keeps V1 catalog count locked", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(13);
  });

  it("keeps Hollowcut catalog count locked", () => {
    expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9);
  });
});

function artifactSummary(): Record<string, unknown> {
  return {
    total_artifact_refs: 2,
    by_role: [{ role_id: "planner", count: 1 }],
    by_artifact_type: [{ artifact_type: "plan", count: 1 }],
    by_acceptance_status: [{ acceptance_status: "accepted", count: 2 }]
  };
}

function handoffSummary(): Record<string, unknown> {
  return {
    total_handoff_gate_refs: 1,
    allowed_count: 1,
    blocked_count: 0,
    invalid_count: 0,
    by_status: [{ status: "allowed", count: 1 }]
  };
}

function hasKey(value: unknown, key: string): boolean {
  if (Array.isArray(value)) {
    return value.some((entry) => hasKey(entry, key));
  }
  if (typeof value !== "object" || value === null) {
    return false;
  }
  if (Object.prototype.hasOwnProperty.call(value, key)) {
    return true;
  }
  return Object.values(value as Record<string, unknown>).some((entry) => hasKey(entry, key));
}

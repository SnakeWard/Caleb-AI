import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";
import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";
import {
  validateRoleArtifact,
  validateRoleContract,
  validateRoleHandoffEnvelope
} from "../../src/roles/index.js";

function validRoleArtifact(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schema_version: "0.1.0",
    artifact_id: "role_artifact_001",
    artifact_type: "plan",
    role_id: "planner",
    task_id: "task_001",
    run_id: "run_001",
    trace_id: "trace_001",
    context_id: "context_001",
    summary: "Plan the next bounded step.",
    claims: [
      {
        claim_id: "claim_001",
        text: "The task can proceed through a contract-only role artifact pass.",
        evidence_ref_ids: ["evidence_001"]
      }
    ],
    assumptions: ["Logic Engine V0 remains locked."],
    constraints: ["No role execution."],
    open_questions: [],
    recommendations: ["Keep R1 to types and validation only."],
    evidence_refs: [
      {
        ref_id: "evidence_001",
        ref_type: "context",
        description: "Logic Engine V0 acceptance report."
      }
    ],
    confidence: 0.9,
    handoff_notes: ["No runtime handoff is executed in R1."],
    required_next_role: "verifier",
    acceptance_status: "accepted",
    created_at: "2026-06-13T00:00:00.000Z",
    ...overrides
  };
}

describe("Role Artifact Contract Layer R1 validators", () => {
  it("accepts a minimal valid RoleArtifact", () => {
    expect(validateRoleArtifact(validRoleArtifact())).toEqual({ ok: true, errors: [] });
  });

  it("rejects null/array/non-object root", () => {
    expect(validateRoleArtifact(null).ok).toBe(false);
    expect(validateRoleArtifact([]).ok).toBe(false);
    expect(validateRoleArtifact("nope").ok).toBe(false);
  });

  it("rejects missing required IDs", () => {
    const artifact = validRoleArtifact();
    delete artifact["task_id"];
    delete artifact["run_id"];

    const result = validateRoleArtifact(artifact);
    expect(result.ok).toBe(false);
    expect(result.errors.map((e) => e.path)).toContain("$.task_id");
    expect(result.errors.map((e) => e.path)).toContain("$.run_id");
  });

  it("rejects empty required strings", () => {
    const result = validateRoleArtifact(validRoleArtifact({ artifact_id: "   " }));
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === "invalid_required_string")).toBe(true);
  });

  it("rejects unknown role_id", () => {
    const result = validateRoleArtifact(validRoleArtifact({ role_id: "oracle" }));
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === "invalid_role_id")).toBe(true);
  });

  it("rejects invalid schema_version", () => {
    const result = validateRoleArtifact(validRoleArtifact({ schema_version: "9.9.9" }));
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === "invalid_schema_version")).toBe(true);
  });

  it("rejects invalid artifact_type", () => {
    const result = validateRoleArtifact(validRoleArtifact({ artifact_type: "dream" }));
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === "invalid_artifact_type")).toBe(true);
  });

  it("rejects invalid acceptance_status", () => {
    const result = validateRoleArtifact(validRoleArtifact({ acceptance_status: "maybe" }));
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === "invalid_acceptance_status")).toBe(true);
  });

  it("rejects confidence below 0", () => {
    const result = validateRoleArtifact(validRoleArtifact({ confidence: -0.01 }));
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === "invalid_confidence")).toBe(true);
  });

  it("rejects confidence above 1", () => {
    const result = validateRoleArtifact(validRoleArtifact({ confidence: 1.01 }));
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === "invalid_confidence")).toBe(true);
  });

  it("rejects forbidden field at root", () => {
    const result = validateRoleArtifact(validRoleArtifact({ scratchpad: "private" }));
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.path === "$.scratchpad")).toBe(true);
  });

  it("rejects forbidden field nested inside claims", () => {
    const result = validateRoleArtifact(
      validRoleArtifact({
        claims: [{ claim_id: "c1", text: "x", evidence_ref_ids: [], thought_log: "private" }]
      })
    );
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.path.includes("thought_log"))).toBe(true);
  });

  it("rejects forbidden field nested inside evidence_refs", () => {
    const result = validateRoleArtifact(
      validRoleArtifact({
        evidence_refs: [{ ref_id: "e1", ref_type: "context", description: "x", credentials: "secret" }]
      })
    );
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.path.includes("credentials"))).toBe(true);
  });

  it("rejects chainOfThought camelCase", () => {
    const result = validateRoleArtifact(validRoleArtifact({ chainOfThought: "private" }));
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.path === "$.chainOfThought")).toBe(true);
  });

  it("rejects privateReasoning camelCase", () => {
    const result = validateRoleArtifact(validRoleArtifact({ privateReasoning: "private" }));
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.path === "$.privateReasoning")).toBe(true);
  });

  it("rejects hollow_input", () => {
    const result = validateRoleArtifact(validRoleArtifact({ hollow_input: { text: "raw" } }));
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.path === "$.hollow_input")).toBe(true);
  });

  it("rejects input_payload", () => {
    const result = validateRoleArtifact(validRoleArtifact({ input_payload: { text: "raw" } }));
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.path === "$.input_payload")).toBe(true);
  });

  it("rejects embedded telemetry_trace.events", () => {
    const result = validateRoleArtifact(
      validRoleArtifact({
        telemetry_trace: {
          trace_id: "trace_001",
          context_id: "context_001",
          events: []
        }
      })
    );
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === "embedded_telemetry_events_forbidden")).toBe(true);
  });

  it("accepts telemetry_trace_ref by ID", () => {
    const result = validateRoleArtifact(
      validRoleArtifact({
        telemetry_trace_ref: { trace_id: "trace_001", context_id: "context_001" }
      })
    );
    expect(result.ok).toBe(true);
  });

  it("accepts execution_context_ref by ID", () => {
    const result = validateRoleArtifact(
      validRoleArtifact({
        execution_context_ref: { context_id: "context_001" }
      })
    );
    expect(result.ok).toBe(true);
  });

  it("accepts required_next_role null", () => {
    const result = validateRoleArtifact(validRoleArtifact({ required_next_role: null }));
    expect(result.ok).toBe(true);
  });

  it("accepts required_next_role when allowed RoleId", () => {
    const result = validateRoleArtifact(validRoleArtifact({ required_next_role: "critic" }));
    expect(result.ok).toBe(true);
  });

  it("rejects required_next_role when unknown", () => {
    const result = validateRoleArtifact(validRoleArtifact({ required_next_role: "oracle" }));
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === "invalid_required_next_role")).toBe(true);
  });

  it("validates RoleContract with allowed role/artifact/status values", () => {
    const result = validateRoleContract({
      schema_version: "0.1.0",
      role_id: "critic",
      allowed_artifact_types: ["critique"],
      allowed_acceptance_statuses: ["accepted", "needs_revision", "blocked", "rejected"]
    });
    expect(result.ok).toBe(true);
  });

  it("rejects RoleContract with unknown role_id", () => {
    const result = validateRoleContract({
      schema_version: "0.1.0",
      role_id: "oracle",
      allowed_artifact_types: ["critique"],
      allowed_acceptance_statuses: ["accepted"]
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === "invalid_role_id")).toBe(true);
  });

  it("validates RoleHandoffEnvelope shape", () => {
    const result = validateRoleHandoffEnvelope({
      schema_version: "0.1.0",
      source_role: "planner",
      target_role: "verifier",
      artifact_id: "role_artifact_001",
      handoff_status: "ready",
      task_id: "task_001",
      run_id: "run_001",
      trace_id: "trace_001",
      context_id: "context_001"
    });
    expect(result.ok).toBe(true);
  });

  it("rejects RoleHandoffEnvelope with unknown target_role", () => {
    const result = validateRoleHandoffEnvelope({
      schema_version: "0.1.0",
      source_role: "planner",
      target_role: "oracle",
      artifact_id: "role_artifact_001",
      handoff_status: "ready",
      task_id: "task_001",
      run_id: "run_001",
      trace_id: "trace_001",
      context_id: "context_001"
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.code === "invalid_target_role")).toBe(true);
  });

  it("verifies validators do not import or call executeWorkGraphLite", async () => {
    const source = await readFile("src/roles/roleArtifactValidator.ts", "utf8");
    expect(source).not.toContain("executeWorkGraphLite");
  });

  it("verifies validators do not import or call dispatchHollow", async () => {
    const source = await readFile("src/roles/roleArtifactValidator.ts", "utf8");
    expect(source).not.toContain("dispatchHollow");
  });

  it("verifies no model/API/provider imports", async () => {
    const source = await readFile("src/roles/roleArtifactValidator.ts", "utf8");
    expect(source).not.toMatch(/from .*model/i);
    expect(source).not.toMatch(/from .*provider/i);
    expect(source).not.toMatch(/from .*api/i);
  });

  it("V1 catalog remains exactly 12", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(12);
  });

  it("Hollowcut catalog remains exactly 9", () => {
    expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9);
  });
});

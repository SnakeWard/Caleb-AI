import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";
import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";
import {
  getRoleContract,
  listRoleContracts,
  ROLE_HANDOFF_CONSUMPTION_MATRIX,
  validateRoleHandoffGate,
  type RegisteredRoleContract
} from "../../src/roles/index.js";

function validArtifact(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schema_version: "0.1.0",
    artifact_id: "role_artifact_001",
    artifact_type: "plan",
    role_id: "planner",
    task_id: "task_001",
    run_id: "run_001",
    trace_id: "trace_001",
    context_id: "context_001",
    summary: "Static planner artifact.",
    claims: [
      {
        claim_id: "claim_001",
        text: "Planner can hand off to implementer.",
        evidence_ref_ids: ["evidence_001"]
      }
    ],
    assumptions: [],
    constraints: ["Contract validation only."],
    open_questions: [],
    recommendations: ["Proceed to implementer."],
    evidence_refs: [
      {
        ref_id: "evidence_001",
        ref_type: "context",
        description: "Static test evidence."
      }
    ],
    confidence: 0.9,
    handoff_notes: ["No runtime handoff execution."],
    required_next_role: "implementer",
    acceptance_status: "accepted",
    created_at: "2026-06-13T00:00:00.000Z",
    ...overrides
  };
}

function validHandoff(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schema_version: "0.1.0",
    source_role: "planner",
    target_role: "implementer",
    artifact_id: "role_artifact_001",
    handoff_status: "ready",
    task_id: "task_001",
    run_id: "run_001",
    trace_id: "trace_001",
    context_id: "context_001",
    created_at: "2026-06-13T00:00:00.000Z",
    ...overrides
  };
}

function expectBlockedWith(code: string, handoff = validHandoff(), artifact = validArtifact()): void {
  const result = validateRoleHandoffGate({ handoff, source_artifact: artifact });
  expect(result.allowed).toBe(false);
  expect(result.status).toBe("blocked");
  expect(result.errors.some((error) => error.code === code)).toBe(true);
}

function expectInvalidWith(
  code: string,
  handoff = validHandoff(),
  artifact = validArtifact(),
  registry?: readonly RegisteredRoleContract[]
): void {
  const result = validateRoleHandoffGate({
    handoff,
    source_artifact: artifact,
    ...(registry === undefined ? {} : { registry })
  });
  expect(result.allowed).toBe(false);
  expect(result.status).toBe("invalid");
  expect(result.errors.some((error) => error.code === code)).toBe(true);
}

describe("validateRoleHandoffGate", () => {
  it("allows valid planner -> implementer handoff if registry permits it", () => {
    expect(validateRoleHandoffGate({ handoff: validHandoff(), source_artifact: validArtifact() })).toEqual({
      allowed: true,
      status: "allowed",
      errors: []
    });
  });

  it("allows valid implementer -> verifier handoff if registry permits it", () => {
    const handoff = validHandoff({
      source_role: "implementer",
      target_role: "verifier",
      artifact_id: "role_artifact_implementer_001"
    });
    const artifact = validArtifact({
      artifact_id: "role_artifact_implementer_001",
      artifact_type: "implementation_notes",
      role_id: "implementer",
      required_next_role: "verifier"
    });

    expect(validateRoleHandoffGate({ handoff, source_artifact: artifact }).status).toBe("allowed");
  });

  it("rejects unknown source_role from registry override", () => {
    const registry = listRoleContracts().filter((entry) => entry.contract.role_id !== "planner");
    expectInvalidWith("unknown_source_role", validHandoff(), validArtifact(), registry);
  });

  it("rejects unknown target_role from registry override", () => {
    const registry = listRoleContracts().filter((entry) => entry.contract.role_id !== "implementer");
    expectInvalidWith("unknown_target_role", validHandoff(), validArtifact(), registry);
  });

  it("rejects disallowed target_role", () => {
    expectBlockedWith(
      "disallowed_target_role",
      validHandoff({ target_role: "reporter" }),
      validArtifact({ required_next_role: null })
    );
  });

  it("rejects invalid handoff envelope", () => {
    expectInvalidWith("invalid_handoff_envelope", validHandoff({ artifact_id: undefined, artifact_refs: [] }));
  });

  it("rejects invalid source artifact", () => {
    expectInvalidWith("invalid_source_artifact", validHandoff(), validArtifact({ summary: "" }));
  });

  it("rejects artifact.role_id mismatch with source_role", () => {
    expectBlockedWith(
      "artifact_role_mismatch",
      validHandoff(),
      validArtifact({ role_id: "implementer", artifact_type: "implementation_notes", required_next_role: "implementer" })
    );
  });

  it("rejects handoff that does not reference source_artifact.artifact_id", () => {
    expectInvalidWith("handoff_artifact_ref_mismatch", validHandoff({ artifact_id: "other_artifact" }));
  });

  it("rejects required_next_role mismatch with target_role", () => {
    expectBlockedWith("required_next_role_mismatch", validHandoff(), validArtifact({ required_next_role: "verifier" }));
  });

  it("rejects blocked artifact status", () => {
    expectBlockedWith("acceptance_status_not_consumable", validHandoff(), validArtifact({ acceptance_status: "blocked" }));
  });

  it("rejects rejected artifact status", () => {
    expectBlockedWith("acceptance_status_not_consumable", validHandoff(), validArtifact({ acceptance_status: "rejected" }));
  });

  it("pending handoff returns blocked and allowed false", () => {
    expectBlockedWith("handoff_status_blocks_handoff", validHandoff({ handoff_status: "pending" }));
  });

  it("completed handoff returns blocked and allowed false", () => {
    expectBlockedWith("handoff_status_blocks_handoff", validHandoff({ handoff_status: "completed" }));
  });

  it("needs_revision to recovery is allowed if registry permits it", () => {
    const handoff = validHandoff({
      source_role: "critic",
      target_role: "recovery",
      artifact_id: "role_artifact_critic_001"
    });
    const artifact = validArtifact({
      artifact_id: "role_artifact_critic_001",
      artifact_type: "critique",
      role_id: "critic",
      required_next_role: "recovery",
      acceptance_status: "needs_revision"
    });

    expect(validateRoleHandoffGate({ handoff, source_artifact: artifact }).status).toBe("allowed");
  });

  it("needs_revision to human_operator is allowed if registry permits it", () => {
    const handoff = validHandoff({
      target_role: "human_operator"
    });
    const artifact = validArtifact({
      required_next_role: "human_operator",
      acceptance_status: "needs_revision"
    });

    expect(validateRoleHandoffGate({ handoff, source_artifact: artifact }).status).toBe("allowed");
  });

  it("needs_revision to non-recovery/non-human target is blocked", () => {
    expectBlockedWith(
      "acceptance_status_not_consumable",
      validHandoff(),
      validArtifact({ acceptance_status: "needs_revision" })
    );
  });

  it("allows needs_revision Planner output to be consumed by Critic as T1 context", () => {
    const result = validateRoleHandoffGate({
      handoff: validHandoff({ target_role: "critic" }),
      source_artifact: validArtifact({
        required_next_role: "critic",
        acceptance_status: "needs_revision"
      })
    });

    expect(result).toEqual({ allowed: true, status: "allowed", errors: [] });
  });

  it("emits only the closed structured check-11 issue for an unconsumable status", () => {
    const result = validateRoleHandoffGate({
      handoff: validHandoff({ target_role: "critic" }),
      source_artifact: validArtifact({
        required_next_role: "critic",
        acceptance_status: "blocked"
      })
    });

    expect(result.errors).toEqual([
      {
        code: "acceptance_status_not_consumable",
        check_index: 11,
        path: "$.source_artifact.acceptance_status",
        expected: ["accepted", "needs_revision"],
        actual: "blocked",
        transition: { source_role: "planner", target_role: "critic" }
      }
    ]);
    expect(JSON.stringify(result.errors)).not.toContain("message");
  });

  it("keeps the check-11 matrix closed and default-deny", () => {
    // RA-X-2: 33 pre-existing + 6 Analyst transitions = 39.
    expect(Object.keys(ROLE_HANDOFF_CONSUMPTION_MATRIX)).toHaveLength(39);
    const result = validateRoleHandoffGate({
      handoff: validHandoff({ target_role: "reporter" }),
      source_artifact: validArtifact({
        required_next_role: "reporter",
        acceptance_status: "needs_revision"
      })
    });
    expect(result.errors).toContainEqual({
      code: "acceptance_status_not_consumable",
      check_index: 11,
      path: "$.source_artifact.acceptance_status",
      expected: [],
      actual: "needs_revision",
      transition: { source_role: "planner", target_role: "reporter" }
    });
  });

  it("rejects identity mismatch across task_id", () => {
    expectBlockedWith("identity_mismatch", validHandoff({ task_id: "other_task" }));
  });

  it("rejects identity mismatch across run_id", () => {
    expectBlockedWith("identity_mismatch", validHandoff({ run_id: "other_run" }));
  });

  it("rejects identity mismatch across trace_id", () => {
    expectBlockedWith("identity_mismatch", validHandoff({ trace_id: "other_trace" }));
  });

  it("rejects identity mismatch across context_id", () => {
    expectBlockedWith("identity_mismatch", validHandoff({ context_id: "other_context" }));
  });

  it("rejects embedded telemetry_trace.events", () => {
    expectBlockedWith(
      "embedded_trace_not_allowed",
      validHandoff({ telemetry_trace: { trace_id: "trace_001", context_id: "context_001", events: [] } })
    );
  });

  it("rejects embedded execution_context object", () => {
    expectBlockedWith("embedded_context_not_allowed", validHandoff({ execution_context: { context_id: "context_001" } }));
  });

  it("rejects forbidden fields such as chain_of_thought", () => {
    expectBlockedWith("forbidden_content_detected", validHandoff(), validArtifact({ chain_of_thought: "private" }));
  });

  it("rejects forbidden raw-input fields in the handoff envelope", () => {
    expectBlockedWith(
      "forbidden_content_detected",
      validHandoff({ input_payload: { sentinel: true } }),
      validArtifact()
    );
  });

  it("preserves underlying validator paths enough to debug", () => {
    const result = validateRoleHandoffGate({
      handoff: validHandoff({ handoff_status: "later" }),
      source_artifact: validArtifact({ summary: "" })
    });

    expect(result.status).toBe("invalid");
    expect(result.errors.some((error) => error.path === "$.handoff_status")).toBe(true);
    expect(result.errors.some((error) => error.path === "$.summary")).toBe(true);
  });

  it("treats invalid registry override entries as invalid", () => {
    const planner = getRoleContract("planner");
    expect(planner).toBeDefined();
    const badRegistry = [
      {
        ...(planner as RegisteredRoleContract),
        contract: {
          ...(planner as RegisteredRoleContract).contract,
          allowed_artifact_types: ["not_real"]
        }
      }
    ] as unknown as readonly RegisteredRoleContract[];

    expectInvalidWith("invalid_handoff_envelope", validHandoff(), validArtifact(), badRegistry);
  });
});

describe("role handoff gate isolation locks", () => {
  it("does not execute handoff or store artifacts", async () => {
    const source = await readFile("src/roles/roleHandoffGate.ts", "utf8");

    expect(source).not.toMatch(/executeHandoff|runHandoff|dispatchHandoff/i);
    expect(source).not.toMatch(/writeFile|appendFile|createWriteStream|artifactStore|storeArtifact/i);
  });

  it("does not call models", async () => {
    const source = await readFile("src/roles/roleHandoffGate.ts", "utf8");

    expect(source).not.toMatch(/openai|anthropic|gemini|grok|model\.|completion|chat/i);
  });

  it("does not import executeWorkGraphLite", async () => {
    const source = await readFile("src/roles/roleHandoffGate.ts", "utf8");
    expect(source).not.toContain("executeWorkGraphLite");
  });

  it("does not import dispatchHollow", async () => {
    const source = await readFile("src/roles/roleHandoffGate.ts", "utf8");
    expect(source).not.toContain("dispatchHollow");
  });

  it("does not import HollowRunner", async () => {
    const source = await readFile("src/roles/roleHandoffGate.ts", "utf8");
    expect(source).not.toContain("HollowRunner");
  });

  it("does not import model/API/provider modules", async () => {
    const source = await readFile("src/roles/roleHandoffGate.ts", "utf8");
    expect(source).not.toMatch(/from\s+["'][^"']*(model|provider|api|openai|anthropic)[^"']*["']/i);
  });

  it("does not add role CLI flags", async () => {
    const source = await readFile("src/cli/commandParser.ts", "utf8");

    expect(source).not.toContain("--role");
    expect(source).not.toContain("--role-artifact");
    expect(source).not.toContain("--role-contract");
    expect(source).not.toContain("--role-handoff");
  });

  it("keeps V1 catalog count locked", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(14);
  });

  it("keeps Hollowcut catalog count locked", () => {
    expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9);
  });
});

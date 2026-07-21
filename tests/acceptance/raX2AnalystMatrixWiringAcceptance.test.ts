import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  ROLE_HANDOFF_CONSUMPTION_MATRIX,
  getRoleContract,
  validateRoleHandoffGate,
  type RoleAcceptanceStatus,
  type RoleId
} from "../../src/roles/index.js";
import {
  bridgeRuntimeRotationPlan,
  type RotationPlanBridgeAdapterBinding
} from "../../src/logicEngine/rotationPlanBridge.js";
import type { ContractValidatedTaskFrameRouteInput } from "../../src/logicEngine/types/routeInput.js";
import type { RuntimeRotationPlanRole } from "../../src/roles/types/runtimeRotationPlan.js";

const PRE_RA_X_2_TRANSITIONS = [
  "critic->human_operator",
  "critic->implementer",
  "critic->planner",
  "critic->recovery",
  "critic->synthesizer",
  "critic->verifier",
  "human_operator->critic",
  "human_operator->implementer",
  "human_operator->planner",
  "human_operator->recovery",
  "human_operator->reporter",
  "human_operator->synthesizer",
  "human_operator->verifier",
  "implementer->critic",
  "implementer->human_operator",
  "implementer->synthesizer",
  "implementer->verifier",
  "planner->critic",
  "planner->human_operator",
  "planner->implementer",
  "planner->verifier",
  "recovery->human_operator",
  "recovery->implementer",
  "recovery->planner",
  "recovery->verifier",
  "reporter->human_operator",
  "synthesizer->human_operator",
  "synthesizer->reporter",
  "synthesizer->verifier",
  "verifier->critic",
  "verifier->human_operator",
  "verifier->reporter",
  "verifier->synthesizer"
] as const;

const ANALYST_TRANSITIONS = [
  "planner->analyst",
  "analyst->critic",
  "analyst->synthesizer",
  "analyst->planner",
  "analyst->human_operator",
  "analyst->recovery"
] as const;

const ANALYST_ENUMS: Record<(typeof ANALYST_TRANSITIONS)[number], readonly RoleAcceptanceStatus[]> = {
  "planner->analyst": ["accepted", "needs_revision"],
  "analyst->critic": ["accepted"],
  "analyst->synthesizer": ["accepted"],
  "analyst->planner": ["accepted", "needs_revision"],
  "analyst->human_operator": ["accepted", "needs_revision"],
  "analyst->recovery": ["accepted", "needs_revision"]
};

function plannerArtifact(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schema_version: "0.1.0",
    artifact_id: "role_artifact_planner_rax2",
    artifact_type: "plan",
    role_id: "planner",
    task_id: "task_rax2",
    run_id: "run_rax2",
    trace_id: "trace_rax2",
    context_id: "context_rax2",
    summary: "Planner mock for Analyst matrix wiring.",
    claims: [{ claim_id: "c1", text: "Plan is bounded.", evidence_ref_ids: ["e1"] }],
    assumptions: [],
    constraints: [],
    open_questions: [],
    recommendations: [],
    evidence_refs: [{ ref_id: "e1", ref_type: "context", description: "Static." }],
    confidence: 0.9,
    handoff_notes: [],
    required_next_role: "analyst",
    acceptance_status: "accepted",
    created_at: "2026-07-21T00:00:00.000Z",
    ...overrides
  };
}

function analystArtifact(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schema_version: "0.1.0",
    artifact_id: "role_artifact_analyst_rax2",
    artifact_type: "analysis",
    role_id: "analyst",
    task_id: "task_rax2",
    run_id: "run_rax2",
    trace_id: "trace_rax2",
    context_id: "context_rax2",
    summary: "Analyst mock for matrix wiring.",
    claims: [{ claim_id: "c1", text: "Evidence marshaled.", evidence_ref_ids: ["e1"] }],
    assumptions: [],
    constraints: [],
    open_questions: [],
    recommendations: [],
    evidence_refs: [{ ref_id: "e1", ref_type: "context", description: "Static." }],
    confidence: 0.85,
    handoff_notes: [],
    required_next_role: "critic",
    acceptance_status: "accepted",
    created_at: "2026-07-21T00:00:00.000Z",
    ...overrides
  };
}

function handoff(
  source: RoleId,
  target: RoleId,
  artifactId: string,
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    schema_version: "0.1.0",
    source_role: source,
    target_role: target,
    artifact_id: artifactId,
    handoff_status: "ready",
    task_id: "task_rax2",
    run_id: "run_rax2",
    trace_id: "trace_rax2",
    context_id: "context_rax2",
    created_at: "2026-07-21T00:00:00.000Z",
    ...overrides
  };
}

function matrixStatuses(key: string): readonly RoleAcceptanceStatus[] {
  const matrix = ROLE_HANDOFF_CONSUMPTION_MATRIX as Record<string, readonly RoleAcceptanceStatus[]>;
  return matrix[key] ?? [];
}

async function carrierFor(plan: Record<string, any>): Promise<ContractValidatedTaskFrameRouteInput> {
  return {
    record_kind: "contract_validated_task_frame",
    record_id: "route_input.rax2",
    source: "logic_engine",
    validated_at: "2026-07-21T00:00:00.000Z",
    lineage_refs: [plan.runtime_rotation_plan_id as string],
    task_frame: {
      task_id: plan.task_id,
      run_id: plan.run_id,
      trace_id: "trace_rax2_bridge",
      task_type: "planning",
      description: "RA-X-2 bridge legality fixture",
      input_summary: "Bounded Analyst route",
      requested_by: "Pat",
      requires_code_mutation: false,
      created_at: "2026-07-21T00:00:00.000Z"
    },
    validation: { validator: "validateTaskFrameInput", valid: true }
  };
}

describe("RA-X-2 Analyst consumption-matrix wiring", () => {
  it("T1: each of six transitions passes for declared statuses", () => {
    for (const status of ["accepted", "needs_revision"] as const) {
      const result = validateRoleHandoffGate({
        handoff: handoff("planner", "analyst", "role_artifact_planner_rax2"),
        source_artifact: plannerArtifact({ acceptance_status: status })
      });
      expect(result.allowed, `planner->analyst ${status}`).toBe(true);
    }
    for (const target of ["critic", "synthesizer"] as const) {
      const result = validateRoleHandoffGate({
        handoff: handoff("analyst", target, "role_artifact_analyst_rax2"),
        source_artifact: analystArtifact({
          required_next_role: target,
          acceptance_status: "accepted"
        })
      });
      expect(result.allowed, `analyst->${target} accepted`).toBe(true);
    }
    for (const target of ["planner", "human_operator", "recovery"] as const) {
      for (const status of ["accepted", "needs_revision"] as const) {
        const result = validateRoleHandoffGate({
          handoff: handoff("analyst", target, "role_artifact_analyst_rax2"),
          source_artifact: analystArtifact({
            required_next_role: target,
            acceptance_status: status
          })
        });
        expect(result.allowed, `analyst->${target} ${status}`).toBe(true);
      }
    }
  });

  it("T2: each transition refuses blocked/rejected with F7 structured issue", () => {
    for (const transition of ANALYST_TRANSITIONS) {
      const [source, target] = transition.split("->") as [RoleId, RoleId];
      const expected = ANALYST_ENUMS[transition];
      const artifact =
        source === "planner"
          ? plannerArtifact({
              required_next_role: target,
              acceptance_status: "blocked"
            })
          : analystArtifact({
              required_next_role: target,
              acceptance_status: "blocked"
            });
      const result = validateRoleHandoffGate({
        handoff: handoff(source, target, artifact.artifact_id as string),
        source_artifact: artifact
      });
      expect(result.allowed, transition).toBe(false);
      expect(result.errors).toContainEqual({
        code: "acceptance_status_not_consumable",
        check_index: 11,
        path: "$.source_artifact.acceptance_status",
        expected: [...expected],
        actual: "blocked",
        transition: { source_role: source, target_role: target }
      });
      expect(JSON.stringify(result.errors)).not.toContain("\"message\"");
    }
  });

  it("T3: undeclared Analyst transitions default-deny", () => {
    const illegal: Array<[RoleId, RoleId]> = [
      ["analyst", "reporter"],
      ["critic", "analyst"],
      ["analyst", "implementer"],
      ["synthesizer", "analyst"]
    ];
    for (const [source, target] of illegal) {
      const artifact =
        source === "analyst"
          ? analystArtifact({ required_next_role: target, acceptance_status: "accepted" })
          : plannerArtifact({
              role_id: source,
              artifact_type:
                source === "critic"
                  ? "critique"
                  : source === "synthesizer"
                    ? "synthesis"
                    : "plan",
              required_next_role: target,
              acceptance_status: "accepted"
            });
      // Registry may also disallowed_target_role; matrix empty expected list is the F7 shape.
      const result = validateRoleHandoffGate({
        handoff: handoff(source, target, artifact.artifact_id as string),
        source_artifact: artifact
      });
      expect(result.allowed, `${source}->${target}`).toBe(false);
      const key = `${source}->${target}`;
      expect(matrixStatuses(key)).toEqual([]);
    }
  });

  it("T4: hollow_evidence_request is not a matrix transition", () => {
    const keys = Object.keys(ROLE_HANDOFF_CONSUMPTION_MATRIX);
    expect(keys.some((key) => key.includes("hollow"))).toBe(false);
    expect(keys.some((key) => key.includes("orchestrator"))).toBe(false);
    expect(keys).not.toContain("analyst->hollow");
    expect(keys.filter((key) => key.startsWith("analyst->")).sort()).toEqual([
      "analyst->critic",
      "analyst->human_operator",
      "analyst->planner",
      "analyst->recovery",
      "analyst->synthesizer"
    ]);
    // Schema still request-only (RA-X-1).
    const hollow = JSON.parse(
      readFileSync("examples/roles/analyst.valid-hollow_evidence_request.json", "utf8")
    ) as Record<string, unknown>;
    expect(hollow).not.toHaveProperty("result");
    expect(hollow).not.toHaveProperty("execution_result");
  });

  it("T5: matrix is exactly 39; pre-RA-X-2 33 rows retain identical enums", () => {
    const keys = Object.keys(ROLE_HANDOFF_CONSUMPTION_MATRIX);
    expect(keys).toHaveLength(39);
    for (const transition of PRE_RA_X_2_TRANSITIONS) {
      expect(keys).toContain(transition);
    }
    for (const transition of ANALYST_TRANSITIONS) {
      expect(keys).toContain(transition);
      expect([...matrixStatuses(transition)].sort()).toEqual([...ANALYST_ENUMS[transition]].sort());
    }
    // Spot-check pre-existing enum sets unchanged.
    expect([...matrixStatuses("planner->critic")].sort()).toEqual(["accepted", "needs_revision"]);
    expect([...matrixStatuses("planner->implementer")]).toEqual(["accepted"]);
    expect([...matrixStatuses("critic->recovery")].sort()).toEqual(["accepted", "needs_revision"]);
    expect([...matrixStatuses("reporter->human_operator")].sort()).toEqual([
      "accepted",
      "needs_revision"
    ]);
  });

  it("T6: LE-2 bridge accepts legal Analyst route and rejects illegal Analyst route", async () => {
    // planner_analyst_synthesizer: adjacency planner→analyst, analyst→synthesizer (both in the six).
    const legalPlan = JSON.parse(
      await readFile("examples/roles/runtime-rotation-plan.valid.minimal.json", "utf8")
    ) as Record<string, any>;
    legalPlan.route_mode = "planner_analyst_synthesizer";
    legalPlan.roles_required = ["planner", "analyst", "synthesizer"];
    legalPlan.max_cycles = 1;
    legalPlan.authored_by = "human";
    legalPlan.side_effect_policy = "none";
    legalPlan.code_mutation_policy = "none";
    legalPlan.snapshot_requirement = false;
    legalPlan.gates_required = ["role_handoff_gate", "final_verification_gate"];
    legalPlan.hollows_required = [];

    const legalBindings: RotationPlanBridgeAdapterBinding[] = (
      legalPlan.roles_required as RuntimeRotationPlanRole[]
    ).map((role) => ({
      role_id: role,
      adapter_id: `mock.role_runtime.${role}`,
      adapter_kind: "mock"
    }));
    const legal = await bridgeRuntimeRotationPlan({
      carrier: await carrierFor(legalPlan),
      runtime_rotation_plan: legalPlan,
      adapter_bindings: legalBindings,
      append_ledger_entry: async () => true,
      decided_at: "2026-07-21T00:00:00.000Z"
    });
    expect(legal.ok).toBe(true);

    // full_rotation set with adjacency critic→analyst (not in the six).
    const illegalPlan = {
      ...legalPlan,
      route_mode: "full_rotation",
      roles_required: ["planner", "critic", "analyst", "synthesizer"] as RuntimeRotationPlanRole[]
    };
    const illegalBindings: RotationPlanBridgeAdapterBinding[] = illegalPlan.roles_required.map(
      (role) => ({
        role_id: role,
        adapter_id: `mock.role_runtime.${role}`,
        adapter_kind: "mock"
      })
    );
    const illegal = await bridgeRuntimeRotationPlan({
      carrier: await carrierFor(illegalPlan),
      runtime_rotation_plan: illegalPlan,
      adapter_bindings: illegalBindings,
      append_ledger_entry: async () => true,
      decided_at: "2026-07-21T00:00:00.000Z"
    });
    expect(illegal.ok).toBe(false);
    if (!illegal.ok) {
      expect(illegal.rejection_code).toBe("bridge_rejected_forbidden_transition");
    }
  }, 30_000);

  it("T7: Analyst handoff consumption does not promote trust", () => {
    const result = validateRoleHandoffGate({
      handoff: handoff("analyst", "critic", "role_artifact_analyst_rax2"),
      source_artifact: analystArtifact({ required_next_role: "critic" })
    });
    expect(result.allowed).toBe(true);
    expect(result).not.toHaveProperty("trust_tier");
    expect(result).not.toHaveProperty("promoted_trust_tier");
    const serialized = JSON.stringify(result);
    expect(serialized).not.toMatch(/trust_tier|promotes_trust|T2|T3|T4/);
    // Registry still request_only — non-promoter doctrine.
    expect(getRoleContract("analyst")?.execution_authority).toBe("request_only");
  });

  it("registry allowed_next_roles matches the six matrix transitions", () => {
    expect(getRoleContract("planner")?.allowed_next_roles).toContain("analyst");
    expect([...(getRoleContract("analyst")?.allowed_next_roles ?? [])].sort()).toEqual([
      "critic",
      "human_operator",
      "planner",
      "recovery",
      "synthesizer"
    ]);
  });
});

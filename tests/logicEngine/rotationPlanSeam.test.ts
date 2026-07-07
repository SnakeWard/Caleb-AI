import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { classifyRotationPlanAtSeam } from "../../src/logicEngine/rotationPlanSeam.js";
import type { ContractValidatedTaskFrameRouteInput } from "../../src/logicEngine/types/routeInput.js";

const NOW = "2026-07-07T12:00:00.000Z";

function makeCarrier(
  planId: string,
  overrides: Partial<ContractValidatedTaskFrameRouteInput> = {}
): ContractValidatedTaskFrameRouteInput {
  return {
    record_kind: "contract_validated_task_frame",
    record_id: "route_input.le1_carrier",
    source: "logic_engine",
    validated_at: NOW,
    lineage_refs: [planId],
    task_frame: {
      task_id: "task_123e4567-e89b-12d3-a456-426614174001",
      run_id: "run_123e4567-e89b-12d3-a456-426614174002",
      trace_id: "trace_le1",
      task_type: "planning",
      description: "LE-1 rotation plan consumption seam task",
      input_summary: "bounded planning carrier",
      requested_by: "logic_engine_test",
      requires_code_mutation: false,
      created_at: NOW
    },
    validation: {
      validator: "validateTaskFrameInput",
      valid: true
    },
    ...overrides
  };
}

describe("rotationPlanSeam", () => {
  it("classifies valid rotation plan as valid_rotation_plan", async () => {
    const plan = JSON.parse(
      await readFile("examples/roles/runtime-rotation-plan.valid.json", "utf8")
    );
    const result = classifyRotationPlanAtSeam({
      carrier: makeCarrier(plan.runtime_rotation_plan_id),
      rotation_plan: plan,
      decided_at: NOW
    });

    expect(result.artifact.classification).toBe("valid_rotation_plan");
    expect(result.artifact.trust_tier).toBe("T2");
    expect(result.artifact.verification_status).toBe("verified");
    expect(result.artifact.plan_ref).toBe(plan.runtime_rotation_plan_id);
    expect(result.artifact.carrier_record_kind).toBe("contract_validated_task_frame");
  });

  it("classifies missing required field as invalid_schema", () => {
    const planId = "rrp_123e4567-e89b-12d3-a456-426614174000";
    const plan = {
      runtime_rotation_plan_id: planId,
      schema_version: "1.0.0"
    };
    const result = classifyRotationPlanAtSeam({
      carrier: makeCarrier(planId),
      rotation_plan: plan,
      decided_at: NOW
    });

    expect(result.artifact.classification).toBe("invalid_schema");
    expect(result.artifact.structural_inputs.some((code) => code.startsWith("RRP_"))).toBe(true);
  });

  it("rejects model-authored plan as rejected_authorship", async () => {
    const plan = JSON.parse(
      await readFile("examples/roles/runtime-rotation-plan.invalid.model-authored.json", "utf8")
    );
    const result = classifyRotationPlanAtSeam({
      carrier: makeCarrier(plan.runtime_rotation_plan_id),
      rotation_plan: plan,
      decided_at: NOW
    });

    expect(result.artifact.classification).toBe("rejected_authorship");
    expect(result.artifact.structural_inputs).toContain("RRP_MODEL_AUTHORED_FORBIDDEN");
  });

  it("rejects counter-era ID format as rejected_reference_format", () => {
    const planId = "rrp_1234567890abcdef1234567890abcdef";
    const plan = {
      runtime_rotation_plan_id: planId,
      schema_version: "1.0.0",
      task_id: "task_123e4567-e89b-12d3-a456-426614174001",
      run_id: "run_123e4567-e89b-12d3-a456-426614174002",
      authored_by: "human",
      route_mode: "planner_synthesizer",
      roles_required: ["planner", "synthesizer"],
      hollows_required: [],
      gates_required: ["role_handoff_gate", "final_verification_gate"],
      max_cycles: 1,
      stop_criteria: ["sequence_exhausted"],
      side_effect_policy: "none",
      code_mutation_policy: "none",
      snapshot_requirement: false,
      ledger_policy: "record_all_passes",
      created_at: NOW
    };

    const result = classifyRotationPlanAtSeam({
      carrier: makeCarrier(planId),
      rotation_plan: plan,
      decided_at: NOW
    });

    expect(result.artifact.classification).toBe("rejected_reference_format");
    expect(result.artifact.structural_inputs).toContain("counter_era_id_format");
  });

  it("rejects missing carrier lineage ref as rejected_reference_format", async () => {
    const plan = JSON.parse(
      await readFile("examples/roles/runtime-rotation-plan.valid.json", "utf8")
    );
    const result = classifyRotationPlanAtSeam({
      carrier: makeCarrier("rrp_missing_from_lineage", { lineage_refs: [] }),
      rotation_plan: plan,
      decided_at: NOW
    });

    expect(result.artifact.classification).toBe("rejected_reference_format");
    expect(result.artifact.structural_inputs).toContain("carrier_lineage_missing_plan_ref");
  });

  it("classifies non-object rotation plan as unknown", () => {
    const result = classifyRotationPlanAtSeam({
      carrier: makeCarrier("rrp_123e4567-e89b-12d3-a456-426614174000"),
      rotation_plan: "not-an-object",
      decided_at: NOW
    });

    expect(result.artifact.classification).toBe("unknown");
    expect(result.artifact.structural_inputs).toContain("rotation_plan_not_object");
  });
});
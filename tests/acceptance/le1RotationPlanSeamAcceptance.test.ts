import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";
import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";
import { classifyRotationPlanAtSeam } from "../../src/logicEngine/rotationPlanSeam.js";
import {
  isAllowedRouteInputKind,
  selectRouteFromRouteInputs
} from "../../src/logicEngine/routeInputGate.js";
import { classifySignals } from "../../src/logicEngine/signalClassifier.js";
import type { ContractValidatedTaskFrameRouteInput } from "../../src/logicEngine/types/routeInput.js";
import type { TaskFrame } from "../../src/logicEngine/types/taskFrame.js";

const LOCKED_ALLOWLIST = [
  "contract_validated_task_frame",
  "verified_signal_frame",
  "engine_internal_state",
  "deterministic_hollow_signal",
  "accepted_gate_policy_result",
  "human_pat_approval_record",
  "snapshot_change_guard_state",
  "lineage_resolved_decision_facing_record"
] as const;

const NOW = "2026-07-07T12:00:00.000Z";
const EXECUTOR_PATH = "src/roleRuntime/roleRuntimeExecutor.ts";
const SEAM_TYPES_PATH = "src/logicEngine/rotationPlanSeam.ts";

function makeFrame(overrides: Partial<TaskFrame> = {}): TaskFrame {
  return {
    task_id: "task_l1",
    run_id: "run_l1",
    trace_id: "trace_l1",
    task_type: "hollow_execution",
    description: "LE-1 read-only routing proof task",
    input_summary: "bounded input summary",
    requested_by: "logic_engine_test",
    requires_code_mutation: false,
    signal_hints: { deterministic_only: 2, requires_judgment: 0 },
    created_at: NOW,
    ...overrides
  };
}

function taskFrameInput(frame = makeFrame()): ContractValidatedTaskFrameRouteInput {
  return {
    record_kind: "contract_validated_task_frame",
    record_id: "route_input.task_frame",
    source: "logic_engine",
    validated_at: NOW,
    lineage_refs: [],
    task_frame: frame,
    validation: {
      validator: "validateTaskFrameInput",
      valid: true
    }
  };
}

describe("LE-1 rotation plan seam acceptance", () => {
  it("L1 allowlist remains eight entries verbatim (RA-X-3)", () => {
    for (const kind of LOCKED_ALLOWLIST) {
      expect(isAllowedRouteInputKind(kind)).toBe(true);
    }
    expect(LOCKED_ALLOWLIST).toHaveLength(8);
    expect(isAllowedRouteInputKind("runtime_rotation_plan")).toBe(false);
  });

  it("rejects model-authored plan at seam", async () => {
    const plan = JSON.parse(
      await readFile("examples/roles/runtime-rotation-plan.invalid.model-authored.json", "utf8")
    );
    const result = classifyRotationPlanAtSeam({
      carrier: {
        record_kind: "contract_validated_task_frame",
        record_id: "route_input.le1",
        source: "logic_engine",
        validated_at: NOW,
        lineage_refs: [plan.runtime_rotation_plan_id],
        task_frame: {
          task_id: plan.task_id,
          run_id: plan.run_id,
          trace_id: "trace_le1",
          task_type: "planning",
          description: "planning carrier",
          input_summary: "bounded",
          requested_by: "test",
          requires_code_mutation: false,
          created_at: NOW
        },
        validation: { validator: "validateTaskFrameInput", valid: true }
      },
      rotation_plan: plan,
      decided_at: NOW
    });

    expect(result.artifact.classification).toBe("rejected_authorship");
    expect(result.artifact.trust_tier).toBe("T2");
    expect(result.artifact.verification_status).toBe("verified");
  });

  it("classifies missing required field as invalid_schema", () => {
    const planId = "rrp_123e4567-e89b-12d3-a456-426614174000";
    const result = classifyRotationPlanAtSeam({
      carrier: {
        record_kind: "contract_validated_task_frame",
        record_id: "route_input.le1",
        source: "logic_engine",
        validated_at: NOW,
        lineage_refs: [planId],
        task_frame: makeFrame({ task_type: "planning" }),
        validation: { validator: "validateTaskFrameInput", valid: true }
      },
      rotation_plan: { runtime_rotation_plan_id: planId, schema_version: "1.0.0" },
      decided_at: NOW
    });

    expect(result.artifact.classification).toBe("invalid_schema");
  });

  it("rejects pre-H4 ID references as rejected_reference_format", () => {
    const planId = "rrp_1234567890abcdef1234567890abcdef";
    const result = classifyRotationPlanAtSeam({
      carrier: {
        record_kind: "contract_validated_task_frame",
        record_id: "route_input.le1",
        source: "logic_engine",
        validated_at: NOW,
        lineage_refs: [planId],
        task_frame: makeFrame({ task_type: "planning" }),
        validation: { validator: "validateTaskFrameInput", valid: true }
      },
      rotation_plan: {
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
      },
      decided_at: NOW
    });

    expect(result.artifact.classification).toBe("rejected_reference_format");
  });

  it("route decision artifact has no execution consumer", async () => {
    const [executorSource, seamSource] = await Promise.all([
      readFile(EXECUTOR_PATH, "utf8"),
      readFile(SEAM_TYPES_PATH, "utf8")
    ]);

    expect(executorSource).not.toContain("RotationPlanRouteDecisionArtifact");
    expect(executorSource).not.toContain("classifyRotationPlanAtSeam");
    expect(seamSource).not.toContain("executeStaticRotation");
    expect(seamSource).not.toContain("roleRuntimeExecutor");
  });

  it("existing route selection outputs remain unchanged with seam module present", () => {
    const frame = makeFrame();
    const inputs = [
      taskFrameInput(frame),
      {
        record_kind: "verified_signal_frame" as const,
        record_id: "route_input.signal_frame",
        source: "logic_engine" as const,
        validated_at: NOW,
        lineage_refs: ["route_input.task_frame"],
        signal_frame: classifySignals(frame),
        derived_from_task_frame_record_id: "route_input.task_frame"
      }
    ];

    const result = selectRouteFromRouteInputs(inputs);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.decision.route_mode).toBe("hollow_only");
    expect(result.decision.task_id).toBe("task_l1");
    expect(result.decision.run_id).toBe("run_l1");
  });

  it("valid plan produces T2 verified artifact without prose fields", async () => {
    const plan = JSON.parse(
      await readFile("examples/roles/runtime-rotation-plan.valid.json", "utf8")
    );
    const result = classifyRotationPlanAtSeam({
      carrier: {
        record_kind: "contract_validated_task_frame",
        record_id: "route_input.le1",
        source: "logic_engine",
        validated_at: NOW,
        lineage_refs: [plan.runtime_rotation_plan_id],
        task_frame: makeFrame({ task_type: "planning", task_id: plan.task_id, run_id: plan.run_id }),
        validation: { validator: "validateTaskFrameInput", valid: true }
      },
      rotation_plan: plan,
      decided_at: NOW
    });

    expect(result.artifact.classification).toBe("valid_rotation_plan");
    expect(result.artifact.trust_tier).toBe("T2");
    expect(result.artifact.verification_status).toBe("verified");
    expect(result.artifact).not.toHaveProperty("summary");
    expect(result.artifact).not.toHaveProperty("description");
    expect(result.artifact.plan_digest).toMatch(/^sha256:/);
    expect(result.artifact.artifact_id).toMatch(/^rpd_/);
  });

  it("V1 catalog remains exactly 14 and Hollowcut exactly 9", () => {
    expect(V1_HOLLOW_MANIFESTS.length).toBe(14);
    expect(HOLLOWCUT_HOLLOW_MANIFESTS.length).toBe(9);
  });
});
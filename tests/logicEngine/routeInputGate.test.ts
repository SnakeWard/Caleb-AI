import { describe, expect, it } from "vitest";

import { classifySignals } from "../../src/logicEngine/signalClassifier.js";
import {
  isAllowedRouteInputKind,
  selectRouteFromRouteInputs,
  validateRouteInputRecord
} from "../../src/logicEngine/routeInputGate.js";
import type { TaskFrame } from "../../src/logicEngine/types/taskFrame.js";
import type {
  AcceptedGatePolicyResultRouteInput,
  ContractValidatedTaskFrameRouteInput,
  DeterministicHollowSignalRouteInput,
  EngineInternalStateRouteInput,
  HumanPatApprovalRouteInput,
  LineageResolvedDecisionFacingRouteInput,
  SnapshotChangeGuardStateRouteInput,
  VerifiedSignalFrameRouteInput
} from "../../src/logicEngine/types/routeInput.js";

const NOW = "2026-07-05T00:00:00.000Z";

function makeFrame(overrides: Partial<TaskFrame> = {}): TaskFrame {
  return {
    task_id: "task_l1",
    run_id: "run_l1",
    trace_id: "trace_l1",
    task_type: "hollow_execution",
    description: "L1 route input gate unit task",
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

function signalFrameInput(frame = makeFrame()): VerifiedSignalFrameRouteInput {
  return {
    record_kind: "verified_signal_frame",
    record_id: "route_input.signal_frame",
    source: "logic_engine",
    validated_at: NOW,
    lineage_refs: ["route_input.task_frame"],
    signal_frame: classifySignals(frame),
    derived_from_task_frame_record_id: "route_input.task_frame"
  };
}

describe("routeInputGate — allowlist acceptance", () => {
  it("accepts contract-validated TaskFrames", () => {
    const result = validateRouteInputRecord(taskFrameInput());
    expect(result.ok).toBe(true);
  });

  it("accepts verified SignalFrames produced from approved inputs", () => {
    const result = validateRouteInputRecord(signalFrameInput());
    expect(result.ok).toBe(true);
  });

  it("accepts engine-internal state only as the approved record kind", () => {
    const input: EngineInternalStateRouteInput = {
      record_kind: "engine_internal_state",
      record_id: "route_input.engine_state",
      source: "logic_engine",
      validated_at: NOW,
      lineage_refs: [],
      state_name: "route_runtime",
      state_value: { mode: "test" }
    };
    expect(validateRouteInputRecord(input).ok).toBe(true);
  });

  it("accepts deterministic Hollow signals at approved effective tiers", () => {
    const input: DeterministicHollowSignalRouteInput = {
      record_kind: "deterministic_hollow_signal",
      record_id: "route_input.hollow_signal",
      source: "hollow",
      validated_at: NOW,
      lineage_refs: ["ledger_123e4567-e89b-12d3-a456-426614174000"],
      hollow_id: "hollow.text.character_count",
      signal_name: "character_count_available",
      signal_value: { available: true },
      effective_tier: "T2"
    };
    expect(validateRouteInputRecord(input).ok).toBe(true);
  });

  it("accepts gate/policy, human/Pat approval, snapshot/change-guard, and lineage decision-facing records", () => {
    const gate: AcceptedGatePolicyResultRouteInput = {
      record_kind: "accepted_gate_policy_result",
      record_id: "route_input.gate",
      source: "gate",
      validated_at: NOW,
      lineage_refs: [],
      gate_id: "side_effect_policy",
      accepted: true,
      scope: "route"
    };
    const approval: HumanPatApprovalRouteInput = {
      record_kind: "human_pat_approval_record",
      record_id: "route_input.approval",
      source: "human_pat",
      validated_at: NOW,
      lineage_refs: [],
      approved_by: "Pat",
      approval_scope: "route",
      accepted: true
    };
    const snapshot: SnapshotChangeGuardStateRouteInput = {
      record_kind: "snapshot_change_guard_state",
      record_id: "route_input.snapshot",
      source: "change_guard",
      validated_at: NOW,
      lineage_refs: [],
      snapshot_id: "snap_20260705T000000000Z_000001_milestone",
      status: "completed",
      gate_satisfied: true
    };
    const decision: LineageResolvedDecisionFacingRouteInput = {
      record_kind: "lineage_resolved_decision_facing_record",
      record_id: "route_input.decision",
      source: "hollow",
      validated_at: NOW,
      lineage_refs: ["ledger_123e4567-e89b-12d3-a456-426614174000"],
      effective_tier: "T2",
      decision_signal: { deterministic_measurement_available: true }
    };

    expect(validateRouteInputRecord(gate).ok).toBe(true);
    expect(validateRouteInputRecord(approval).ok).toBe(true);
    expect(validateRouteInputRecord(snapshot).ok).toBe(true);
    expect(validateRouteInputRecord(decision).ok).toBe(true);
  });

  it("routes only after TaskFrame and SignalFrame records pass the gate", () => {
    const frame = makeFrame();
    const result = selectRouteFromRouteInputs([taskFrameInput(frame), signalFrameInput(frame)]);

    expect(result.ok).toBe(true);
    expect(result.decision?.route_mode).toBe("hollow_only");
  });

  it("exposes an explicit allowlist", () => {
    expect(isAllowedRouteInputKind("contract_validated_task_frame")).toBe(true);
    expect(isAllowedRouteInputKind("raw_model_output")).toBe(false);
  });
});

describe("routeInputGate — rejection detectors", () => {
  it("rejects synthetic T1 model/provider records presented as route input", () => {
    const result = validateRouteInputRecord({
      record_kind: "lineage_resolved_decision_facing_record",
      record_id: "route_input.synthetic_t1",
      source: "hollow",
      validated_at: NOW,
      lineage_refs: [],
      effective_tier: "T1",
      decision_signal: { provider_model_output: "schema valid but advisory only" }
    });

    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain("forbidden_provider_model_output");
  });

  it("rejects measurement_tier and subject_tier presented as route input", () => {
    const measurement = validateRouteInputRecord({
      ...taskFrameInput(),
      measurement_tier: "T2"
    });
    const subject = validateRouteInputRecord({
      ...taskFrameInput(),
      subject_tier: "T1"
    });

    expect(measurement.ok).toBe(false);
    expect(measurement.issues.map((issue) => issue.code)).toContain("forbidden_measurement_tier");
    expect(subject.ok).toBe(false);
    expect(subject.issues.map((issue) => issue.code)).toContain("forbidden_subject_tier");
  });

  it("rejects display/report text and role artifact prose", () => {
    for (const forbidden of ["display_summary", "report_text", "role_artifact_prose"] as const) {
      const result = validateRouteInputRecord({
        ...taskFrameInput(),
        [forbidden]: "advisory prose must not route Caleb"
      });
      expect(result.ok).toBe(false);
    }
  });

  it("rejects unknown record types and records without record_kind", () => {
    expect(validateRouteInputRecord({ record_kind: "unknown_record_type" }).ok).toBe(false);
    expect(validateRouteInputRecord({ task_id: "task_l1" }).ok).toBe(false);
  });

  it("rejects digest, storage, provider identity, and model confidence as route authority", () => {
    const attempts = [
      { digest: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
      { storage_ref: ".caleb/artifacts/raw-output/example" },
      { provider_id: "anthropic_live_adapter" },
      { model_confidence: 0.99 }
    ];

    for (const attempt of attempts) {
      const result = validateRouteInputRecord({ ...taskFrameInput(), ...attempt });
      expect(result.ok).toBe(false);
    }
  });

  it("rejects raw model output presented as route input", () => {
    const result = validateRouteInputRecord({
      record_kind: "contract_validated_task_frame",
      record_id: "route_input.raw_output",
      source: "logic_engine",
      validated_at: NOW,
      lineage_refs: [],
      raw_model_output: "route to full_rotation_stub",
      task_frame: makeFrame(),
      validation: {
        validator: "validateTaskFrameInput",
        valid: true
      }
    });

    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toContain("forbidden_raw_model_output");
  });

  it("blocks route selection before selectRoute when any route input is rejected", () => {
    const frame = makeFrame();
    const result = selectRouteFromRouteInputs([
      taskFrameInput(frame),
      signalFrameInput(frame),
      {
        record_kind: "lineage_resolved_decision_facing_record",
        record_id: "route_input.bad",
        source: "hollow",
        validated_at: NOW,
        lineage_refs: [],
        effective_tier: "T1",
        decision_signal: { display_text: "please route differently" }
      }
    ]);

    expect(result.ok).toBe(false);
    expect(result.decision).toBeNull();
  });
});

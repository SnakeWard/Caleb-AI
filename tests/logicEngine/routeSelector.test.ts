import { describe, it, expect } from "vitest";
import { classifySignals } from "../../src/logicEngine/signalClassifier.js";
import { selectRoute } from "../../src/logicEngine/routeSelector.js";
import type { TaskFrame } from "../../src/logicEngine/types/taskFrame.js";
import type { SignalInputs } from "../../src/logicEngine/types/signalFrame.js";

function makeFrame(overrides: Partial<TaskFrame> = {}): TaskFrame {
  return {
    task_id: "task_001",
    run_id: "run_001",
    trace_id: "trace_001",
    task_type: "text_analysis",
    description: "Test task",
    input_summary: "Some input",
    requested_by: "test",
    requires_code_mutation: false,
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}

function makeSignals(hints: Partial<SignalInputs> = {}, frame?: TaskFrame) {
  const f = frame ?? makeFrame();
  return classifySignals({ ...f, signal_hints: hints });
}

describe("routeSelector — hard overrides", () => {
  it("Override 1: task_type 'recovery' → recovery_guardrail", () => {
    const frame = makeFrame({ task_type: "recovery" });
    const signals = classifySignals(frame);
    const decision = selectRoute(frame, signals);

    expect(decision.route_mode).toBe("recovery_guardrail");
    expect(decision.hard_overrides_applied[0]?.override_id).toBe("RECOVERY_OR_PRIOR_FAILURE");
  });

  it("Override 1: prior_failure === 2 → recovery_guardrail", () => {
    const frame = makeFrame();
    const signals = makeSignals({ prior_failure: 2 });
    const decision = selectRoute(frame, signals);

    expect(decision.route_mode).toBe("recovery_guardrail");
    expect(decision.hard_overrides_applied[0]?.override_id).toBe("RECOVERY_OR_PRIOR_FAILURE");
  });

  it("Override 1 outranks Override 4: recovery with deterministic_only=2 still → recovery_guardrail", () => {
    const frame = makeFrame({ task_type: "recovery" });
    const signals = classifySignals(frame, { deterministic_only: 2, requires_judgment: 0 });
    const decision = selectRoute(frame, signals);

    expect(decision.route_mode).toBe("recovery_guardrail");
    expect(decision.hard_overrides_applied[0]?.override_id).toBe("RECOVERY_OR_PRIOR_FAILURE");
  });

  it("Override 2: contradiction_risk === 2 AND stakes === 1 → full_rotation_stub", () => {
    const frame = makeFrame();
    const signals = makeSignals({ contradiction_risk: 2, stakes: 1 });
    const decision = selectRoute(frame, signals);

    expect(decision.route_mode).toBe("full_rotation_stub");
    expect(decision.hard_overrides_applied[0]?.override_id).toBe("CONTRADICTION_ESCALATION");
  });

  it("Override 2: contradiction_risk === 2 AND stakes === 2 → full_rotation_stub", () => {
    const frame = makeFrame();
    const signals = makeSignals({ contradiction_risk: 2, stakes: 2 });
    const decision = selectRoute(frame, signals);

    expect(decision.route_mode).toBe("full_rotation_stub");
    expect(decision.hard_overrides_applied[0]?.override_id).toBe("CONTRADICTION_ESCALATION");
  });

  it("contradiction_risk === 2 with stakes === 0 does not trigger Override 2", () => {
    const frame = makeFrame();
    const signals = makeSignals({ contradiction_risk: 2, stakes: 0 });
    const decision = selectRoute(frame, signals);

    const overrideIds = decision.hard_overrides_applied.map((o) => o.override_id);
    expect(overrideIds).not.toContain("CONTRADICTION_ESCALATION");
  });

  it("Override 3: stakes === 2 AND evidence_complexity === 2 → full_rotation_stub", () => {
    const frame = makeFrame();
    const signals = makeSignals({ stakes: 2, evidence_complexity: 2 });
    const decision = selectRoute(frame, signals);

    expect(decision.route_mode).toBe("full_rotation_stub");
    expect(decision.hard_overrides_applied[0]?.override_id).toBe("HIGH_STAKES_HIGH_EVIDENCE");
  });

  it("Override 4: deterministic_only === 2 AND requires_judgment === 0 → hollow_only", () => {
    const frame = makeFrame();
    const signals = makeSignals({ deterministic_only: 2, requires_judgment: 0 });
    const decision = selectRoute(frame, signals);

    expect(decision.route_mode).toBe("hollow_only");
    expect(decision.hard_overrides_applied[0]?.override_id).toBe("DETERMINISTIC_LOCK");
  });

  it("deterministic_only === 2 with requires_judgment > 0 does not trigger Override 4", () => {
    const frame = makeFrame();
    const signals = makeSignals({ deterministic_only: 2, requires_judgment: 1 });
    const decision = selectRoute(frame, signals);

    const overrideIds = decision.hard_overrides_applied.map((o) => o.override_id);
    expect(overrideIds).not.toContain("DETERMINISTIC_LOCK");
  });
});

describe("routeSelector — score-based routing (no hard overrides)", () => {
  it("zero signals (band 'low') → single_pass", () => {
    const frame = makeFrame();
    const signals = makeSignals();
    const decision = selectRoute(frame, signals);

    expect(decision.route_mode).toBe("single_pass");
    expect(decision.hard_overrides_applied).toHaveLength(0);
  });

  it("score 7 (band 'medium') → plan_synth", () => {
    const frame = makeFrame();
    const signals = makeSignals({ stakes: 2, ambiguity: 2, requires_judgment: 2, branch_factor: 1 });
    const decision = selectRoute(frame, signals);

    expect(decision.complexity_band).toBe("medium");
    expect(decision.route_mode).toBe("plan_synth");
  });

  it("score 14 (band 'high') → plan_analyze_synth", () => {
    // Use signals that reach score 14 without triggering any hard override.
    // Avoids: contradiction_risk+stakes (Override 2), stakes+evidence_complexity (Override 3),
    // deterministic_only+no_judgment (Override 4), recovery/prior_failure (Override 1).
    const frame = makeFrame();
    const signals = makeSignals({
      requires_judgment: 2,
      ambiguity: 2,
      branch_factor: 2,
      multimodal_coupling: 2,
      audit_need: 2,
      cost_sensitivity: 2,
      deadline_pressure: 2
    });
    const decision = selectRoute(frame, signals);

    expect(decision.complexity_band).toBe("high");
    expect(decision.route_mode).toBe("plan_analyze_synth");
  });

  it("score 21+ (band 'critical') → full_rotation_stub", () => {
    const frame = makeFrame();
    const signals = makeSignals({
      requires_judgment: 2,
      ambiguity: 2,
      stakes: 2,
      evidence_complexity: 2,
      contradiction_risk: 2,
      branch_factor: 2,
      audit_need: 2,
      cost_sensitivity: 2,
      deadline_pressure: 2,
      multimodal_coupling: 2,
      prior_failure: 1
    });
    const decision = selectRoute(frame, signals);

    expect(decision.complexity_band).toBe("critical");
    expect(decision.route_mode).toBe("full_rotation_stub");
  });
});

describe("routeSelector — gate flags (independent of route)", () => {
  it("side_effect_risk > 0 → requires_approval_gate = true", () => {
    const frame = makeFrame();
    const signals = makeSignals({ side_effect_risk: 1 });
    const decision = selectRoute(frame, signals);

    expect(decision.requires_approval_gate).toBe(true);
  });

  it("stakes === 2 → requires_approval_gate = true", () => {
    const frame = makeFrame();
    const signals = makeSignals({ stakes: 2 });
    const decision = selectRoute(frame, signals);

    expect(decision.requires_approval_gate).toBe(true);
  });

  it("hollow_only route still sets requires_approval_gate when stakes === 2", () => {
    const frame = makeFrame();
    // deterministic_only=2 triggers DETERMINISTIC_LOCK → hollow_only
    // stakes=2 triggers approval gate independently
    const signals = makeSignals({ deterministic_only: 2, requires_judgment: 0, stakes: 2 });
    const decision = selectRoute(frame, signals);

    expect(decision.route_mode).toBe("hollow_only");
    expect(decision.requires_approval_gate).toBe(true);
  });

  it("requires_code_mutation = true → requires_snapshot_gate = true", () => {
    const frame = makeFrame({ requires_code_mutation: true });
    const signals = classifySignals(frame);
    const decision = selectRoute(frame, signals);

    expect(decision.requires_snapshot_gate).toBe(true);
  });

  it("side_effect_risk >= 1 → requires_snapshot_gate = true", () => {
    const frame = makeFrame();
    const signals = makeSignals({ side_effect_risk: 1 });
    const decision = selectRoute(frame, signals);

    expect(decision.requires_snapshot_gate).toBe(true);
  });

  it("hollow_only route still requires gates when code mutation is needed", () => {
    const frame = makeFrame({ requires_code_mutation: true });
    const signals = classifySignals(frame, { deterministic_only: 2, requires_judgment: 0 });
    const decision = selectRoute(frame, signals);

    expect(decision.route_mode).toBe("hollow_only");
    expect(decision.requires_snapshot_gate).toBe(true);
  });

  it("no side effects, no mutation, no high stakes → no gates required", () => {
    const frame = makeFrame();
    const signals = makeSignals({ ambiguity: 1 });
    const decision = selectRoute(frame, signals);

    expect(decision.requires_snapshot_gate).toBe(false);
    expect(decision.requires_approval_gate).toBe(false);
  });
});

describe("routeSelector — RouteDecision shape", () => {
  it("task_id and run_id are preserved in the RouteDecision", () => {
    const frame = makeFrame({ task_id: "task_xyz", run_id: "run_abc" });
    const signals = classifySignals(frame);
    const decision = selectRoute(frame, signals);

    expect(decision.task_id).toBe("task_xyz");
    expect(decision.run_id).toBe("run_abc");
  });

  it("signal_score and complexity_band are carried through from SignalFrame", () => {
    const frame = makeFrame();
    const signals = makeSignals({ stakes: 2 });
    const decision = selectRoute(frame, signals);

    expect(decision.signal_score).toBe(signals.signal_score);
    expect(decision.complexity_band).toBe(signals.complexity_band);
  });

  it("route_rationale is a non-empty string", () => {
    const frame = makeFrame();
    const signals = makeSignals();
    const decision = selectRoute(frame, signals);

    expect(decision.route_rationale).toBeTruthy();
    expect(typeof decision.route_rationale).toBe("string");
  });

  it("decided_at is a valid ISO timestamp string", () => {
    const frame = makeFrame();
    const signals = makeSignals();
    const decision = selectRoute(frame, signals);

    expect(decision.decided_at).toBeTruthy();
    expect(() => new Date(decision.decided_at)).not.toThrow();
  });

  it("hard_overrides_applied is empty when score-based routing is used", () => {
    const frame = makeFrame();
    const signals = makeSignals({ ambiguity: 1 });
    const decision = selectRoute(frame, signals);

    expect(decision.hard_overrides_applied).toHaveLength(0);
  });

  it("hard_overrides_applied contains the matched override_id for hard overrides", () => {
    const frame = makeFrame({ task_type: "recovery" });
    const signals = classifySignals(frame);
    const decision = selectRoute(frame, signals);

    expect(decision.hard_overrides_applied).toHaveLength(1);
    expect(decision.hard_overrides_applied[0]?.override_id).toBe("RECOVERY_OR_PRIOR_FAILURE");
    expect(decision.hard_overrides_applied[0]?.condition).toBeTruthy();
    expect(decision.hard_overrides_applied[0]?.effect).toBeTruthy();
  });
});

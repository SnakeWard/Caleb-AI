import { describe, it, expect } from "vitest";
import { classifySignals } from "../../src/logicEngine/signalClassifier.js";
import type { TaskFrame } from "../../src/logicEngine/types/taskFrame.js";

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

describe("signalClassifier", () => {
  it("defaults all signal fields to 0 when no hints provided", () => {
    const frame = makeFrame();
    const result = classifySignals(frame);

    expect(result.signals.deterministic_only).toBe(0);
    expect(result.signals.requires_judgment).toBe(0);
    expect(result.signals.ambiguity).toBe(0);
    expect(result.signals.stakes).toBe(0);
    expect(result.signals.evidence_complexity).toBe(0);
    expect(result.signals.contradiction_risk).toBe(0);
    expect(result.signals.branch_factor).toBe(0);
    expect(result.signals.multimodal_coupling).toBe(0);
    expect(result.signals.side_effect_risk).toBe(0);
    expect(result.signals.audit_need).toBe(0);
    expect(result.signals.prior_failure).toBe(0);
    expect(result.signals.cost_sensitivity).toBe(0);
    expect(result.signals.deadline_pressure).toBe(0);
  });

  it("preserves task_id and run_id in the output SignalFrame", () => {
    const frame = makeFrame({ task_id: "task_abc", run_id: "run_xyz" });
    const result = classifySignals(frame);

    expect(result.task_id).toBe("task_abc");
    expect(result.run_id).toBe("run_xyz");
  });

  it("incorporates signal_hints from the TaskFrame", () => {
    const frame = makeFrame({
      signal_hints: { stakes: 2, ambiguity: 1 }
    });
    const result = classifySignals(frame);

    expect(result.signals.stakes).toBe(2);
    expect(result.signals.ambiguity).toBe(1);
    expect(result.signals.deterministic_only).toBe(0);
  });

  it("overrides take precedence over signal_hints", () => {
    const frame = makeFrame({
      signal_hints: { stakes: 1 }
    });
    const result = classifySignals(frame, { stakes: 2 });

    expect(result.signals.stakes).toBe(2);
  });

  it("overrides take precedence over defaults when no hints are set", () => {
    const frame = makeFrame();
    const result = classifySignals(frame, { ambiguity: 2 });

    expect(result.signals.ambiguity).toBe(2);
  });

  it("sets side_effect_risk to at least 1 when requires_code_mutation is true", () => {
    const frame = makeFrame({ requires_code_mutation: true });
    const result = classifySignals(frame);

    expect(result.signals.side_effect_risk).toBeGreaterThanOrEqual(1);
  });

  it("does not lower side_effect_risk when requires_code_mutation and hint is already 2", () => {
    const frame = makeFrame({
      requires_code_mutation: true,
      signal_hints: { side_effect_risk: 2 }
    });
    const result = classifySignals(frame);

    expect(result.signals.side_effect_risk).toBe(2);
  });

  it("sets prior_failure to 2 when task_type is 'recovery'", () => {
    const frame = makeFrame({ task_type: "recovery" });
    const result = classifySignals(frame);

    expect(result.signals.prior_failure).toBe(2);
  });

  it("does not override prior_failure for non-recovery task types", () => {
    const frame = makeFrame({ task_type: "code_analysis" });
    const result = classifySignals(frame);

    expect(result.signals.prior_failure).toBe(0);
  });

  it("computes signal_score as the sum of all 13 signal fields", () => {
    const frame = makeFrame({
      signal_hints: {
        deterministic_only: 1,
        requires_judgment: 1,
        ambiguity: 2,
        stakes: 0,
        evidence_complexity: 1,
        contradiction_risk: 0,
        branch_factor: 1,
        multimodal_coupling: 0,
        side_effect_risk: 0,
        audit_need: 1,
        prior_failure: 0,
        cost_sensitivity: 1,
        deadline_pressure: 2
      }
    });
    const result = classifySignals(frame);

    expect(result.signal_score).toBe(10);
  });

  it("assigns complexity_band 'low' for score 0–6", () => {
    const frame = makeFrame({ signal_hints: { stakes: 2, ambiguity: 1 } });
    const result = classifySignals(frame);

    expect(result.signal_score).toBe(3);
    expect(result.complexity_band).toBe("low");
  });

  it("assigns complexity_band 'medium' for score 7–13", () => {
    const frame = makeFrame({
      signal_hints: {
        stakes: 2,
        ambiguity: 2,
        requires_judgment: 2,
        branch_factor: 1
      }
    });
    const result = classifySignals(frame);

    expect(result.signal_score).toBe(7);
    expect(result.complexity_band).toBe("medium");
  });

  it("assigns complexity_band 'high' for score 14–20", () => {
    const frame = makeFrame({
      signal_hints: {
        deterministic_only: 0,
        requires_judgment: 2,
        ambiguity: 2,
        stakes: 2,
        evidence_complexity: 2,
        contradiction_risk: 2,
        branch_factor: 2,
        multimodal_coupling: 0,
        side_effect_risk: 0,
        audit_need: 2,
        prior_failure: 0,
        cost_sensitivity: 0,
        deadline_pressure: 0
      }
    });
    const result = classifySignals(frame);

    expect(result.signal_score).toBe(14);
    expect(result.complexity_band).toBe("high");
  });

  it("assigns complexity_band 'critical' for score 21–26", () => {
    const frame = makeFrame({
      signal_hints: {
        deterministic_only: 2,
        requires_judgment: 2,
        ambiguity: 2,
        stakes: 2,
        evidence_complexity: 2,
        contradiction_risk: 2,
        branch_factor: 2,
        multimodal_coupling: 1,
        side_effect_risk: 2,
        audit_need: 2,
        prior_failure: 2,
        cost_sensitivity: 2,
        deadline_pressure: 2
      }
    });
    const result = classifySignals(frame);

    expect(result.signal_score).toBe(25);
    expect(result.complexity_band).toBe("critical");
  });

  it("is deterministic: same frame always produces same output", () => {
    const frame = makeFrame({
      signal_hints: { stakes: 1, ambiguity: 2, prior_failure: 1 }
    });
    const a = classifySignals(frame);
    const b = classifySignals(frame);

    expect(a.signals).toEqual(b.signals);
    expect(a.signal_score).toBe(b.signal_score);
    expect(a.complexity_band).toBe(b.complexity_band);
  });

  it("classified_at is a non-empty ISO string", () => {
    const frame = makeFrame();
    const result = classifySignals(frame);

    expect(result.classified_at).toBeTruthy();
    expect(() => new Date(result.classified_at)).not.toThrow();
  });

  it("maximum possible score is 26 (13 signals × 2)", () => {
    const allMax = {
      deterministic_only: 2 as const,
      requires_judgment: 2 as const,
      ambiguity: 2 as const,
      stakes: 2 as const,
      evidence_complexity: 2 as const,
      contradiction_risk: 2 as const,
      branch_factor: 2 as const,
      multimodal_coupling: 2 as const,
      side_effect_risk: 2 as const,
      audit_need: 2 as const,
      prior_failure: 2 as const,
      cost_sensitivity: 2 as const,
      deadline_pressure: 2 as const
    };
    const frame = makeFrame({ signal_hints: allMax });
    const result = classifySignals(frame);

    expect(result.signal_score).toBe(26);
    expect(result.complexity_band).toBe("critical");
  });
});

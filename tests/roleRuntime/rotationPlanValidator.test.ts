import { describe, expect, it } from "vitest";

import { validateStaticRotationPlan } from "../../src/roleRuntime/rotationPlanValidator.js";

function validPlan(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    schema_version: "ra-r1.0.0",
    plan_id: "plan_001",
    task_id: "task_001",
    run_id: "run_001",
    trace_id: "trace_001",
    context_id: "context_001",
    authored_by: "fixture",
    sequence: [
      {
        step_index: 0,
        role_id: "planner",
        adapter_id: "mock.planner",
        adapter_kind: "mock"
      }
    ],
    stop_conditions: {
      max_invocations: 1,
      halt_on_first_failure: true
    },
    created_at: "2026-07-06T00:00:00.000Z",
    ...overrides
  };
}

describe("validateStaticRotationPlan", () => {
  it("accepts a valid fixture-authored plan", () => {
    const result = validateStaticRotationPlan(validPlan());
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects authored_by model", () => {
    const result = validateStaticRotationPlan(validPlan({ authored_by: "model" }));
    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.code === "model_authored_plan_rejected")).toBe(true);
  });

  it("rejects empty sequence", () => {
    const result = validateStaticRotationPlan(validPlan({ sequence: [] }));
    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.code === "empty_sequence")).toBe(true);
  });

  it("rejects duplicate step_index", () => {
    const result = validateStaticRotationPlan(
      validPlan({
        sequence: [
          { step_index: 0, role_id: "planner", adapter_id: "a", adapter_kind: "mock" },
          { step_index: 0, role_id: "critic", adapter_id: "b", adapter_kind: "mock" }
        ],
        stop_conditions: { max_invocations: 2, halt_on_first_failure: true }
      })
    );
    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.code === "duplicate_step_index")).toBe(true);
  });
});
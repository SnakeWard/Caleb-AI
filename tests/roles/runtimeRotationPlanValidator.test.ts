import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { validateRuntimeRotationPlan } from "../../src/roles/runtimeRotationPlanValidator.js";

function validPlan(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    runtime_rotation_plan_id: "rrp_123e4567-e89b-12d3-a456-426614174000",
    schema_version: "1.0.0",
    task_id: "task_123e4567-e89b-12d3-a456-426614174001",
    run_id: "run_123e4567-e89b-12d3-a456-426614174002",
    authored_by: "orchestration_core",
    route_mode: "full_rotation",
    roles_required: ["planner", "analyst", "critic", "synthesizer"],
    hollows_required: ["hollow.text.character_count"],
    gates_required: [
      "role_handoff_gate",
      "approval_gate",
      "snapshot_gate",
      "final_verification_gate"
    ],
    max_cycles: 3,
    stop_criteria: ["halt_on_gate_blocked"],
    side_effect_policy: "requires_approval",
    code_mutation_policy: "requires_snapshot",
    snapshot_requirement: true,
    ledger_policy: "record_all_passes",
    created_at: "2026-07-07T00:00:00.000Z",
    ...overrides
  };
}

function expectCode(code: string, input: unknown): void {
  const result = validateRuntimeRotationPlan(input);
  expect(result.ok).toBe(false);
  expect(result.errors.some((error) => error.code === code)).toBe(true);
}

describe("validateRuntimeRotationPlan", () => {
  it("accepts the full valid fixture", async () => {
    const fixture = JSON.parse(
      await readFile("examples/roles/runtime-rotation-plan.valid.json", "utf8")
    );
    expect(validateRuntimeRotationPlan(fixture)).toEqual({ ok: true, errors: [] });
  });

  it("accepts the minimal valid fixture", async () => {
    const fixture = JSON.parse(
      await readFile("examples/roles/runtime-rotation-plan.valid.minimal.json", "utf8")
    );
    expect(validateRuntimeRotationPlan(fixture)).toEqual({ ok: true, errors: [] });
  });

  it("accepts the Amendment A registry-compatible success-route fixtures", async () => {
    const [plannerCritic, plannerCriticSynthesizer] = await Promise.all([
      readFile("examples/roles/runtime-rotation-plan.valid.planner-critic.json", "utf8"),
      readFile(
        "examples/roles/runtime-rotation-plan.valid.planner-critic-synthesizer.json",
        "utf8"
      )
    ]);

    expect(validateRuntimeRotationPlan(JSON.parse(plannerCritic))).toEqual({ ok: true, errors: [] });
    expect(validateRuntimeRotationPlan(JSON.parse(plannerCriticSynthesizer))).toEqual({
      ok: true,
      errors: []
    });
  });

  it("accepts fixture authorship for protocol-governed test plans", () => {
    expect(validateRuntimeRotationPlan(validPlan({ authored_by: "fixture" }))).toEqual({
      ok: true,
      errors: []
    });
  });

  it("rejects missing or wrong schema_version", () => {
    const missing = validPlan();
    delete missing["schema_version"];
    expectCode("RRP_MISSING_FIELD", missing);
    expectCode("RRP_INVALID_SCHEMA_VERSION", validPlan({ schema_version: "0.9.0" }));
  });

  it("rejects model authorship with RRP_MODEL_AUTHORED_FORBIDDEN", async () => {
    const fixture = JSON.parse(
      await readFile("examples/roles/runtime-rotation-plan.invalid.model-authored.json", "utf8")
    );
    const result = validateRuntimeRotationPlan(fixture);
    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.code === "RRP_MODEL_AUTHORED_FORBIDDEN")).toBe(true);
  });

  it("rejects arbitrary authored_by strings with RRP_INVALID_AUTHOR", () => {
    expectCode("RRP_INVALID_AUTHOR", validPlan({ authored_by: "oracle" }));
  });

  it("enforces max_cycles boundaries", () => {
    expectCode("RRP_MAX_CYCLES_OUT_OF_BOUNDS", validPlan({ max_cycles: 0 }));
    expectCode("RRP_MAX_CYCLES_OUT_OF_BOUNDS", validPlan({ max_cycles: 4 }));
    expectCode("RRP_MAX_CYCLES_OUT_OF_BOUNDS", validPlan({ max_cycles: 2.5 }));
    expect(validateRuntimeRotationPlan(validPlan({ max_cycles: 1 })).ok).toBe(true);
    expect(validateRuntimeRotationPlan(validPlan({ max_cycles: 3 })).ok).toBe(true);
  });

  it("rejects empty or whitespace-only stop_criteria", () => {
    expectCode("RRP_EMPTY_STOP_CRITERIA", validPlan({ stop_criteria: [] }));
    expectCode("RRP_EMPTY_STOP_CRITERIA", validPlan({ stop_criteria: ["   "] }));
  });

  it("rejects requires_approval without approval_gate", () => {
    expectCode(
      "RRP_SIDE_EFFECT_WITHOUT_APPROVAL_GATE",
      validPlan({
        side_effect_policy: "requires_approval",
        gates_required: ["role_handoff_gate", "snapshot_gate", "final_verification_gate"]
      })
    );
  });

  it("rejects requires_snapshot without snapshot_gate", () => {
    expectCode(
      "RRP_CODE_MUTATION_WITHOUT_SNAPSHOT_GATE",
      validPlan({
        code_mutation_policy: "requires_snapshot",
        gates_required: ["role_handoff_gate", "approval_gate", "final_verification_gate"]
      })
    );
  });

  it("rejects requires_snapshot when snapshot_requirement is false", () => {
    expectCode(
      "RRP_SNAPSHOT_REQUIREMENT_INCONSISTENT",
      validPlan({
        code_mutation_policy: "requires_snapshot",
        snapshot_requirement: false
      })
    );
  });

  it("rejects unknown role, duplicate role, and roles/route_mode mismatch", () => {
    expectCode("RRP_UNKNOWN_ROLE", validPlan({ roles_required: ["planner", "oracle"] }));
    expectCode(
      "RRP_DUPLICATE_ROLE",
      validPlan({ roles_required: ["planner", "planner", "analyst", "critic", "synthesizer"] })
    );
    expectCode(
      "RRP_ROLES_ROUTE_MODE_MISMATCH",
      validPlan({
        route_mode: "planner_synthesizer",
        roles_required: ["planner", "analyst", "synthesizer"]
      })
    );
  });

  it("rejects missing mandatory gate", async () => {
    const fixture = JSON.parse(
      await readFile("examples/roles/runtime-rotation-plan.invalid.missing-gates.json", "utf8")
    );
    const result = validateRuntimeRotationPlan(fixture);
    expect(result.ok).toBe(false);
    expect(result.errors.some((error) => error.code === "RRP_SIDE_EFFECT_WITHOUT_APPROVAL_GATE")).toBe(
      true
    );
    expect(result.errors.some((error) => error.code === "RRP_CODE_MUTATION_WITHOUT_SNAPSHOT_GATE")).toBe(
      true
    );
  });

  it("rejects invalid hollow IDs", () => {
    expectCode("RRP_INVALID_HOLLOW_ID", validPlan({ hollows_required: ["not-a-hollow"] }));
    expectCode(
      "RRP_INVALID_HOLLOW_ID",
      validPlan({ hollows_required: ["hollow.text.character_count", "hollow.text.character_count"] })
    );
  });

  it("rejects unknown extra fields", () => {
    expectCode("RRP_UNKNOWN_FIELD", validPlan({ surprise_field: true }));
  });

  it("rejects bad ID formats", () => {
    expectCode("RRP_INVALID_ID_FORMAT", validPlan({ runtime_rotation_plan_id: "rrp_bad" }));
    expectCode("RRP_INVALID_ID_FORMAT", validPlan({ task_id: "task_001" }));
    expectCode("RRP_INVALID_ID_FORMAT", validPlan({ run_id: "run_legacy" }));
  });

  it("rejects invalid created_at", () => {
    expectCode("RRP_INVALID_CREATED_AT", validPlan({ created_at: "not-a-date" }));
  });

  it("rejects unbounded max_cycles fixture", async () => {
    const fixture = JSON.parse(
      await readFile("examples/roles/runtime-rotation-plan.invalid.unbounded-cycles.json", "utf8")
    );
    expectCode("RRP_MAX_CYCLES_OUT_OF_BOUNDS", fixture);
  });

  it("accumulates all applicable codes for a multi-defect plan", () => {
    const result = validateRuntimeRotationPlan({
      runtime_rotation_plan_id: "bad",
      schema_version: "9.9.9",
      task_id: "task_bad",
      run_id: "run_bad",
      authored_by: "model",
      route_mode: "unknown_mode",
      roles_required: ["planner", "planner"],
      hollows_required: ["bad hollow"],
      gates_required: ["approval_gate"],
      max_cycles: 9,
      stop_criteria: [],
      side_effect_policy: "requires_approval",
      code_mutation_policy: "requires_snapshot",
      snapshot_requirement: false,
      ledger_policy: "write_once",
      created_at: "invalid",
      extra: true
    });

    expect(result.ok).toBe(false);
    const codes = new Set(result.errors.map((error) => error.code));
    expect(codes.has("RRP_INVALID_SCHEMA_VERSION")).toBe(true);
    expect(codes.has("RRP_INVALID_ID_FORMAT")).toBe(true);
    expect(codes.has("RRP_MODEL_AUTHORED_FORBIDDEN")).toBe(true);
    expect(codes.has("RRP_UNKNOWN_ROUTE_MODE")).toBe(true);
    expect(codes.has("RRP_DUPLICATE_ROLE")).toBe(true);
    expect(codes.has("RRP_INVALID_HOLLOW_ID")).toBe(true);
    expect(codes.has("RRP_MISSING_MANDATORY_GATE")).toBe(true);
    expect(codes.has("RRP_MAX_CYCLES_OUT_OF_BOUNDS")).toBe(true);
    expect(codes.has("RRP_EMPTY_STOP_CRITERIA")).toBe(true);
    expect(codes.has("RRP_CODE_MUTATION_WITHOUT_SNAPSHOT_GATE")).toBe(true);
    expect(codes.has("RRP_MISSING_MANDATORY_GATE")).toBe(true);
    expect(codes.has("RRP_SNAPSHOT_REQUIREMENT_INCONSISTENT")).toBe(true);
    expect(codes.has("RRP_INVALID_LEDGER_POLICY")).toBe(true);
    expect(codes.has("RRP_INVALID_CREATED_AT")).toBe(true);
    expect(codes.has("RRP_UNKNOWN_FIELD")).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import { validateTaskFrameInput } from "../../src/logicEngine/taskFrameValidator.js";
import { VALID_TASK_TYPES } from "../../src/logicEngine/types/taskFrame.js";
import { SIGNAL_FIELD_NAMES } from "../../src/logicEngine/types/signalFrame.js";

function validBase(): Record<string, unknown> {
  return {
    task_id: "task_001",
    run_id: "run_001",
    trace_id: "trace_001",
    task_type: "text_analysis",
    description: "A test task",
    input_summary: "Some input",
    requested_by: "test_runner",
    requires_code_mutation: false,
    created_at: "2026-01-01T00:00:00.000Z"
  };
}

function errorCodes(result: ReturnType<typeof validateTaskFrameInput>): string[] {
  return result.errors.map((e) => e.code);
}

function errorFields(result: ReturnType<typeof validateTaskFrameInput>): string[] {
  return result.errors.map((e) => e.field);
}

describe("validateTaskFrameInput — happy path", () => {
  it("returns valid: true for a complete, well-formed TaskFrame", () => {
    const result = validateTaskFrameInput(validBase());
    expect(result.valid).toBe(true);
  });

  it("returns the constructed frame when valid", () => {
    const result = validateTaskFrameInput(validBase());
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.frame.task_id).toBe("task_001");
      expect(result.frame.task_type).toBe("text_analysis");
    }
  });

  it("returns an empty errors array when valid", () => {
    const result = validateTaskFrameInput(validBase());
    expect(result.errors).toHaveLength(0);
  });

  it("accepts all allowed task_types without error", () => {
    for (const taskType of VALID_TASK_TYPES) {
      const input = { ...validBase(), task_type: taskType };
      const result = validateTaskFrameInput(input);
      expect(result.valid, `Expected valid for task_type '${taskType}'`).toBe(true);
    }
  });

  it("accepts signal_hints with all valid signal scores (0, 1, 2)", () => {
    const input = {
      ...validBase(),
      signal_hints: {
        stakes: 2,
        ambiguity: 1,
        deterministic_only: 0
      }
    };
    const result = validateTaskFrameInput(input);
    expect(result.valid).toBe(true);
  });

  it("accepts TaskFrame with no signal_hints present", () => {
    const { signal_hints: _removed, ...base } = { ...validBase(), signal_hints: undefined };
    void _removed;
    const input = { ...validBase() };
    delete input["signal_hints"];
    const result = validateTaskFrameInput(input);
    expect(result.valid).toBe(true);
  });

  it("defaults requires_code_mutation to false when absent", () => {
    const input = { ...validBase() };
    delete input["requires_code_mutation"];
    const result = validateTaskFrameInput(input);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.frame.requires_code_mutation).toBe(false);
    }
  });

  it("sets requires_code_mutation: true when provided as true", () => {
    const input = { ...validBase(), requires_code_mutation: true };
    const result = validateTaskFrameInput(input);
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.frame.requires_code_mutation).toBe(true);
    }
  });
});

describe("validateTaskFrameInput — root type rejection", () => {
  it("rejects a string input", () => {
    const result = validateTaskFrameInput("not an object");
    expect(result.valid).toBe(false);
    expect(errorCodes(result)).toContain("invalid_type");
  });

  it("rejects null", () => {
    const result = validateTaskFrameInput(null);
    expect(result.valid).toBe(false);
    expect(errorCodes(result)).toContain("invalid_type");
  });

  it("rejects an array", () => {
    const result = validateTaskFrameInput([]);
    expect(result.valid).toBe(false);
    expect(errorCodes(result)).toContain("invalid_type");
  });

  it("rejects a number", () => {
    const result = validateTaskFrameInput(42);
    expect(result.valid).toBe(false);
    expect(errorCodes(result)).toContain("invalid_type");
  });
});

describe("validateTaskFrameInput — missing required fields", () => {
  const requiredFields = [
    "task_id",
    "run_id",
    "trace_id",
    "task_type",
    "description",
    "input_summary",
    "requested_by",
    "created_at"
  ] as const;

  for (const field of requiredFields) {
    it(`rejects when '${field}' is missing`, () => {
      const input = { ...validBase() };
      delete input[field];
      const result = validateTaskFrameInput(input);
      expect(result.valid).toBe(false);
      expect(errorFields(result)).toContain(field);
      expect(errorCodes(result)).toContain("missing_required_field");
    });
  }

  it("collects multiple missing field errors at once (not fail-fast)", () => {
    const result = validateTaskFrameInput({});
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(1);
  });
});

describe("validateTaskFrameInput — task_type validation", () => {
  it("rejects an unknown task_type string", () => {
    const input = { ...validBase(), task_type: "do_the_thing" };
    const result = validateTaskFrameInput(input);
    expect(result.valid).toBe(false);
    expect(errorCodes(result)).toContain("invalid_task_type");
    expect(errorFields(result)).toContain("task_type");
  });

  it("rejects empty string task_type", () => {
    const input = { ...validBase(), task_type: "" };
    const result = validateTaskFrameInput(input);
    expect(result.valid).toBe(false);
  });

  it("rejects task_type that is a valid prefix but not the full value", () => {
    const input = { ...validBase(), task_type: "hollow" };
    const result = validateTaskFrameInput(input);
    expect(result.valid).toBe(false);
    expect(errorCodes(result)).toContain("invalid_task_type");
  });

  it("is case-sensitive: 'Text_Analysis' is rejected", () => {
    const input = { ...validBase(), task_type: "Text_Analysis" };
    const result = validateTaskFrameInput(input);
    expect(result.valid).toBe(false);
    expect(errorCodes(result)).toContain("invalid_task_type");
  });

  it("VALID_TASK_TYPES contains all 10 expected types", () => {
    expect(VALID_TASK_TYPES).toHaveLength(10);
  });
});

describe("validateTaskFrameInput — signal_hints value validation", () => {
  it("rejects signal_hints value of 3 (out of range)", () => {
    const input = { ...validBase(), signal_hints: { stakes: 3 } };
    const result = validateTaskFrameInput(input);
    expect(result.valid).toBe(false);
    expect(errorCodes(result)).toContain("invalid_signal_score_out_of_range");
    expect(errorFields(result)).toContain("signal_hints.stakes");
  });

  it("rejects signal_hints value of -1 (negative out of range)", () => {
    const input = { ...validBase(), signal_hints: { ambiguity: -1 } };
    const result = validateTaskFrameInput(input);
    expect(result.valid).toBe(false);
    expect(errorCodes(result)).toContain("invalid_signal_score_out_of_range");
  });

  it("rejects signal_hints value of 10 (out of range)", () => {
    const input = { ...validBase(), signal_hints: { deterministic_only: 10 } };
    const result = validateTaskFrameInput(input);
    expect(result.valid).toBe(false);
    expect(errorCodes(result)).toContain("invalid_signal_score_out_of_range");
  });

  it("rejects signal_hints value that is a string", () => {
    const input = { ...validBase(), signal_hints: { stakes: "high" } };
    const result = validateTaskFrameInput(input);
    expect(result.valid).toBe(false);
    expect(errorCodes(result)).toContain("invalid_signal_score_type");
    expect(errorFields(result)).toContain("signal_hints.stakes");
  });

  it("rejects signal_hints value that is a boolean", () => {
    const input = { ...validBase(), signal_hints: { stakes: true } };
    const result = validateTaskFrameInput(input);
    expect(result.valid).toBe(false);
    expect(errorCodes(result)).toContain("invalid_signal_score_type");
  });

  it("rejects signal_hints value that is a non-integer float (1.5)", () => {
    const input = { ...validBase(), signal_hints: { stakes: 1.5 } };
    const result = validateTaskFrameInput(input);
    expect(result.valid).toBe(false);
    expect(errorCodes(result)).toContain("invalid_signal_score_not_integer");
  });

  it("rejects signal_hints value that is a non-integer float (0.1)", () => {
    const input = { ...validBase(), signal_hints: { prior_failure: 0.1 } };
    const result = validateTaskFrameInput(input);
    expect(result.valid).toBe(false);
    expect(errorCodes(result)).toContain("invalid_signal_score_not_integer");
  });

  it("rejects signal_hints value that is null", () => {
    const input = { ...validBase(), signal_hints: { stakes: null } };
    const result = validateTaskFrameInput(input);
    expect(result.valid).toBe(false);
    expect(errorCodes(result)).toContain("invalid_signal_score_type");
  });

  it("rejects an unknown signal field name", () => {
    const input = { ...validBase(), signal_hints: { unknown_field: 1 } };
    const result = validateTaskFrameInput(input);
    expect(result.valid).toBe(false);
    expect(errorCodes(result)).toContain("unknown_signal_field");
    expect(errorFields(result)).toContain("signal_hints.unknown_field");
  });

  it("rejects signal_hints that is not an object (string)", () => {
    const input = { ...validBase(), signal_hints: "high stakes" };
    const result = validateTaskFrameInput(input);
    expect(result.valid).toBe(false);
    expect(errorCodes(result)).toContain("invalid_signal_hints_type");
  });

  it("rejects signal_hints that is an array", () => {
    const input = { ...validBase(), signal_hints: [1, 2, 3] };
    const result = validateTaskFrameInput(input);
    expect(result.valid).toBe(false);
    expect(errorCodes(result)).toContain("invalid_signal_hints_type");
  });

  it("collects errors for multiple invalid signal fields at once", () => {
    const input = { ...validBase(), signal_hints: { stakes: 3, ambiguity: -1 } };
    const result = validateTaskFrameInput(input);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it("SIGNAL_FIELD_NAMES contains exactly 13 fields", () => {
    expect(SIGNAL_FIELD_NAMES).toHaveLength(13);
  });
});

describe("validateTaskFrameInput — existing example fixtures still pass", () => {
  it("simple-task fixture (hollow_execution, deterministic) is valid", () => {
    const fixture = {
      task_id: "task_demo_001",
      run_id: "run_demo_001",
      trace_id: "trace_demo_001",
      task_type: "hollow_execution",
      description: "Count characters in a supplied text string.",
      input_summary: "Short text string, deterministic Hollow operation only.",
      requested_by: "cli-demo",
      requires_code_mutation: false,
      signal_hints: {
        deterministic_only: 2,
        requires_judgment: 0,
        ambiguity: 0,
        stakes: 0,
        side_effect_risk: 0,
        prior_failure: 0
      },
      created_at: "2026-06-12T00:00:00.000Z"
    };
    const result = validateTaskFrameInput(fixture);
    expect(result.valid).toBe(true);
  });

  it("recovery-task fixture (recovery, prior_failure hints) is valid", () => {
    const fixture = {
      task_id: "task_demo_003",
      run_id: "run_demo_003",
      trace_id: "trace_demo_003",
      task_type: "recovery",
      description: "Recover from a failed synthesis pass.",
      input_summary: "Prior run failed verification.",
      requested_by: "cli-demo",
      requires_code_mutation: false,
      signal_hints: {
        prior_failure: 2,
        contradiction_risk: 1,
        audit_need: 2
      },
      created_at: "2026-06-12T00:00:00.000Z"
    };
    const result = validateTaskFrameInput(fixture);
    expect(result.valid).toBe(true);
  });

  it("high-stakes-task fixture (synthesis, mixed signals) is valid", () => {
    const fixture = {
      task_id: "task_demo_002",
      run_id: "run_demo_002",
      trace_id: "trace_demo_002",
      task_type: "synthesis",
      description: "Synthesize a production deployment recommendation.",
      input_summary: "Multiple analyst reports with contradictory findings.",
      requested_by: "cli-demo",
      requires_code_mutation: false,
      signal_hints: {
        deterministic_only: 0,
        requires_judgment: 2,
        ambiguity: 1,
        stakes: 2,
        evidence_complexity: 2,
        contradiction_risk: 1,
        branch_factor: 1,
        audit_need: 2,
        prior_failure: 0,
        cost_sensitivity: 1
      },
      created_at: "2026-06-12T00:00:00.000Z"
    };
    const result = validateTaskFrameInput(fixture);
    expect(result.valid).toBe(true);
  });
});

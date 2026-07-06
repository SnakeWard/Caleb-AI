import { VALID_ROLE_IDS, type RoleId } from "../roles/types/roleArtifact.js";
import type { RoleArtifactValidationError } from "../roles/types/roleArtifact.js";
import {
  ROTATION_PLAN_SCHEMA_VERSION,
  type RotationPlanAdapterKind,
  type RotationPlanAuthoredBy,
  type StaticRotationPlan
} from "./types/staticRotationPlan.js";

export interface RotationPlanValidationResult {
  readonly ok: boolean;
  readonly plan: StaticRotationPlan | null;
  readonly errors: readonly RoleArtifactValidationError[];
}

const VALID_AUTHORED_BY: readonly RotationPlanAuthoredBy[] = ["human", "fixture"] as const;
const VALID_ADAPTER_KINDS: readonly RotationPlanAdapterKind[] = ["mock", "live"] as const;

export function validateStaticRotationPlan(input: unknown): RotationPlanValidationResult {
  const errors: RoleArtifactValidationError[] = [];
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return fail([error("invalid_root", "$", "Rotation plan must be a JSON object.")]);
  }

  const obj = input as Record<string, unknown>;

  if (obj["schema_version"] !== ROTATION_PLAN_SCHEMA_VERSION) {
    errors.push(
      error(
        "invalid_schema_version",
        "$.schema_version",
        `schema_version must be '${ROTATION_PLAN_SCHEMA_VERSION}'.`
      )
    );
  }

  requireString(obj, "plan_id", errors);
  requireString(obj, "task_id", errors);
  requireString(obj, "run_id", errors);
  requireString(obj, "trace_id", errors);
  requireString(obj, "context_id", errors);
  requireString(obj, "created_at", errors);

  const authoredBy = obj["authored_by"];
  if (authoredBy === "model") {
    errors.push(
      error(
        "model_authored_plan_rejected",
        "$.authored_by",
        "Rotation plans authored_by 'model' are forbidden."
      )
    );
  } else if (typeof authoredBy !== "string" || !VALID_AUTHORED_BY.includes(authoredBy as RotationPlanAuthoredBy)) {
    errors.push(
      error(
        "invalid_authored_by",
        "$.authored_by",
        "authored_by must be 'human' or 'fixture'."
      )
    );
  }

  const stopConditions = validateStopConditions(obj["stop_conditions"], errors);
  const sequence = validateSequence(obj["sequence"], errors);

  if (errors.length > 0) {
    return fail(errors);
  }

  return {
    ok: true,
    plan: {
      schema_version: ROTATION_PLAN_SCHEMA_VERSION,
      plan_id: obj["plan_id"] as string,
      task_id: obj["task_id"] as string,
      run_id: obj["run_id"] as string,
      trace_id: obj["trace_id"] as string,
      context_id: obj["context_id"] as string,
      authored_by: authoredBy as RotationPlanAuthoredBy,
      sequence,
      stop_conditions: stopConditions,
      created_at: obj["created_at"] as string
    },
    errors: []
  };
}

function validateStopConditions(
  value: unknown,
  errors: RoleArtifactValidationError[]
): StaticRotationPlan["stop_conditions"] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    errors.push(error("invalid_stop_conditions", "$.stop_conditions", "stop_conditions must be an object."));
    return { max_invocations: 0, halt_on_first_failure: true };
  }
  const obj = value as Record<string, unknown>;
  if (typeof obj["max_invocations"] !== "number" || !Number.isInteger(obj["max_invocations"]) || obj["max_invocations"] < 1) {
    errors.push(
      error("invalid_max_invocations", "$.stop_conditions.max_invocations", "max_invocations must be a positive integer.")
    );
  }
  if (obj["halt_on_first_failure"] !== true) {
    errors.push(
      error(
        "invalid_halt_on_first_failure",
        "$.stop_conditions.halt_on_first_failure",
        "halt_on_first_failure must be true in V1."
      )
    );
  }
  return {
    max_invocations: typeof obj["max_invocations"] === "number" ? obj["max_invocations"] : 0,
    halt_on_first_failure: true
  };
}

function validateSequence(
  value: unknown,
  errors: RoleArtifactValidationError[]
): StaticRotationPlan["sequence"] {
  if (!Array.isArray(value)) {
    errors.push(error("invalid_sequence", "$.sequence", "sequence must be an array."));
    return [];
  }
  if (value.length === 0) {
    errors.push(error("empty_sequence", "$.sequence", "sequence must not be empty."));
    return [];
  }

  const steps: StaticRotationPlan["sequence"][number][] = [];
  const seenIndexes = new Set<number>();

  value.forEach((entry, index) => {
    const path = `$.sequence[${index}]`;
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      errors.push(error("invalid_sequence_step", path, "sequence entries must be objects."));
      return;
    }
    const step = entry as Record<string, unknown>;
    if (typeof step["step_index"] !== "number" || !Number.isInteger(step["step_index"]) || step["step_index"] < 0) {
      errors.push(error("invalid_step_index", `${path}.step_index`, "step_index must be a non-negative integer."));
      return;
    }
    const stepIndex = step["step_index"];
    if (seenIndexes.has(stepIndex)) {
      errors.push(error("duplicate_step_index", `${path}.step_index`, `Duplicate step_index '${stepIndex}'.`));
    }
    seenIndexes.add(stepIndex);
    if (stepIndex !== index) {
      errors.push(
        error(
          "sequence_index_gap",
          `${path}.step_index`,
          `step_index must match array position; expected ${index}, found ${stepIndex}.`
        )
      );
    }

    const roleId = step["role_id"];
    if (typeof roleId !== "string" || !VALID_ROLE_IDS.includes(roleId as RoleId)) {
      errors.push(error("invalid_role_id", `${path}.role_id`, "role_id must be a registered RoleId."));
    }

    if (typeof step["adapter_id"] !== "string" || step["adapter_id"].trim().length === 0) {
      errors.push(error("invalid_adapter_id", `${path}.adapter_id`, "adapter_id must be a non-empty string."));
    }

    const adapterKind = step["adapter_kind"];
    if (typeof adapterKind !== "string" || !VALID_ADAPTER_KINDS.includes(adapterKind as RotationPlanAdapterKind)) {
      errors.push(error("invalid_adapter_kind", `${path}.adapter_kind`, "adapter_kind must be 'mock' or 'live'."));
    }

    steps.push({
      step_index: stepIndex,
      role_id: roleId as RoleId,
      adapter_id: step["adapter_id"] as string,
      adapter_kind: adapterKind as RotationPlanAdapterKind
    });
  });

  return steps;
}

function requireString(obj: Record<string, unknown>, field: string, errors: RoleArtifactValidationError[]): void {
  const value = obj[field];
  if (typeof value !== "string" || value.trim().length === 0) {
    errors.push(error("invalid_required_string", `$.${field}`, `${field} must be a non-empty string.`));
  }
}

function error(code: string, path: string, message: string): RoleArtifactValidationError {
  return { code, path, message };
}

function fail(errors: readonly RoleArtifactValidationError[]): RotationPlanValidationResult {
  return { ok: false, plan: null, errors };
}
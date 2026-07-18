import type { RoleArtifactValidationError, RoleArtifactValidationResult } from "./types/roleArtifact.js";
import {
  MANDATORY_RUNTIME_ROTATION_PLAN_GATES,
  RUNTIME_ROTATION_PLAN_SCHEMA_VERSION,
  VALID_RUNTIME_ROTATION_LEDGER_POLICIES,
  VALID_RUNTIME_ROTATION_PLAN_AUTHORS,
  VALID_RUNTIME_ROTATION_PLAN_GATES,
  VALID_RUNTIME_ROTATION_PLAN_ROLES,
  VALID_RUNTIME_ROTATION_ROUTE_MODES,
  type RuntimeRotationPlanRole,
  type RuntimeRotationRouteMode
} from "./types/runtimeRotationPlan.js";

const RRP_ID_FORMAT = /^rrp_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const TASK_ID_FORMAT = /^task_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const RUN_ID_FORMAT = /^run_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const HOLLOW_ID_FORMAT = /^hollow\.[a-z0-9_]+(\.[a-z0-9_]+)*$/;

const REQUIRED_FIELDS = [
  "runtime_rotation_plan_id",
  "schema_version",
  "task_id",
  "run_id",
  "authored_by",
  "route_mode",
  "roles_required",
  "hollows_required",
  "gates_required",
  "max_cycles",
  "stop_criteria",
  "side_effect_policy",
  "code_mutation_policy",
  "snapshot_requirement",
  "ledger_policy",
  "created_at"
] as const;

const ALLOWED_FIELDS = new Set<string>(REQUIRED_FIELDS);

const ROUTE_MODE_ROLES: Record<RuntimeRotationRouteMode, readonly RuntimeRotationPlanRole[]> = {
  planner_critic: ["planner", "critic"],
  planner_critic_synthesizer: ["planner", "critic", "synthesizer"],
  planner_synthesizer: ["planner", "synthesizer"],
  planner_analyst_synthesizer: ["planner", "analyst", "synthesizer"],
  full_rotation: ["planner", "analyst", "critic", "synthesizer"]
};

export function validateRuntimeRotationPlan(input: unknown): RoleArtifactValidationResult {
  const errors: RoleArtifactValidationError[] = [];
  const obj = validateObjectRoot(input, errors);
  if (obj === null) {
    return result(errors);
  }

  rejectUnknownFields(obj, errors);
  requireFields(obj, errors);
  validateSchemaVersion(obj, errors);
  validateIdFormat(obj["runtime_rotation_plan_id"], "$.runtime_rotation_plan_id", RRP_ID_FORMAT, errors);
  validateIdFormat(obj["task_id"], "$.task_id", TASK_ID_FORMAT, errors);
  validateIdFormat(obj["run_id"], "$.run_id", RUN_ID_FORMAT, errors);
  validateAuthoredBy(obj["authored_by"], errors);
  validateRouteMode(obj["route_mode"], errors);
  validateRolesRequired(obj["roles_required"], obj["route_mode"], errors);
  validateHollowsRequired(obj["hollows_required"], errors);
  validateGatesRequired(obj["gates_required"], errors);
  validateMaxCycles(obj["max_cycles"], errors);
  validateStopCriteria(obj["stop_criteria"], errors);
  validateSideEffectPolicy(obj["side_effect_policy"], obj["gates_required"], errors);
  validateCodeMutationPolicy(
    obj["code_mutation_policy"],
    obj["gates_required"],
    obj["snapshot_requirement"],
    errors
  );
  validateSnapshotRequirementType(obj["snapshot_requirement"], errors);
  validateLedgerPolicy(obj["ledger_policy"], errors);
  validateCreatedAt(obj["created_at"], errors);

  return result(errors);
}

function validateObjectRoot(
  input: unknown,
  errors: RoleArtifactValidationError[]
): Record<string, unknown> | null {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    errors.push({
      code: "RRP_INVALID_ROOT",
      path: "$",
      message: "Input must be a JSON object."
    });
    return null;
  }

  return input as Record<string, unknown>;
}

function rejectUnknownFields(obj: Record<string, unknown>, errors: RoleArtifactValidationError[]): void {
  for (const key of Object.keys(obj)) {
    if (!ALLOWED_FIELDS.has(key)) {
      errors.push({
        code: "RRP_UNKNOWN_FIELD",
        path: `$.${key}`,
        message: `Unknown field '${key}' is not allowed in RuntimeRotationPlan.`
      });
    }
  }
}

function requireFields(obj: Record<string, unknown>, errors: RoleArtifactValidationError[]): void {
  for (const field of REQUIRED_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(obj, field)) {
      errors.push({
        code: "RRP_MISSING_FIELD",
        path: `$.${field}`,
        message: `${field} is required.`
      });
    }
  }
}

function validateSchemaVersion(obj: Record<string, unknown>, errors: RoleArtifactValidationError[]): void {
  if (obj["schema_version"] !== RUNTIME_ROTATION_PLAN_SCHEMA_VERSION) {
    errors.push({
      code: "RRP_INVALID_SCHEMA_VERSION",
      path: "$.schema_version",
      message: `schema_version must be '${RUNTIME_ROTATION_PLAN_SCHEMA_VERSION}'.`
    });
  }
}

function validateIdFormat(
  value: unknown,
  path: string,
  pattern: RegExp,
  errors: RoleArtifactValidationError[]
): void {
  if (typeof value !== "string" || !pattern.test(value)) {
    errors.push({
      code: "RRP_INVALID_ID_FORMAT",
      path,
      message: `${path} must match the required prefix_uuid format.`
    });
  }
}

function validateAuthoredBy(value: unknown, errors: RoleArtifactValidationError[]): void {
  if (typeof value !== "string") {
    errors.push({
      code: "RRP_INVALID_AUTHOR",
      path: "$.authored_by",
      message: "authored_by must be a string."
    });
    return;
  }

  if (value === "model") {
    errors.push({
      code: "RRP_MODEL_AUTHORED_FORBIDDEN",
      path: "$.authored_by",
      message: "authored_by 'model' is forbidden for RuntimeRotationPlan."
    });
    return;
  }

  if (!VALID_RUNTIME_ROTATION_PLAN_AUTHORS.includes(value as (typeof VALID_RUNTIME_ROTATION_PLAN_AUTHORS)[number])) {
    errors.push({
      code: "RRP_INVALID_AUTHOR",
      path: "$.authored_by",
      message: "authored_by must be orchestration_core, logic_engine, human, or fixture."
    });
  }
}

function validateRouteMode(value: unknown, errors: RoleArtifactValidationError[]): void {
  if (
    typeof value !== "string" ||
    !VALID_RUNTIME_ROTATION_ROUTE_MODES.includes(value as (typeof VALID_RUNTIME_ROTATION_ROUTE_MODES)[number])
  ) {
    errors.push({
      code: "RRP_UNKNOWN_ROUTE_MODE",
      path: "$.route_mode",
      message: "route_mode must be an allowed RuntimeRotationRouteMode."
    });
  }
}

function validateRolesRequired(
  value: unknown,
  routeModeValue: unknown,
  errors: RoleArtifactValidationError[]
): void {
  if (!Array.isArray(value)) {
    errors.push({
      code: "RRP_UNKNOWN_ROLE",
      path: "$.roles_required",
      message: "roles_required must be a non-empty array."
    });
    return;
  }

  if (value.length === 0) {
    errors.push({
      code: "RRP_UNKNOWN_ROLE",
      path: "$.roles_required",
      message: "roles_required must be non-empty."
    });
    return;
  }

  const seen = new Set<string>();
  for (let index = 0; index < value.length; index += 1) {
    const entry = value[index];
    const path = `$.roles_required[${index}]`;
    if (typeof entry !== "string") {
      errors.push({
        code: "RRP_UNKNOWN_ROLE",
        path,
        message: "roles_required entries must be strings."
      });
      continue;
    }

    if (!VALID_RUNTIME_ROTATION_PLAN_ROLES.includes(entry as RuntimeRotationPlanRole)) {
      errors.push({
        code: "RRP_UNKNOWN_ROLE",
        path,
        message: `${entry} is not an allowed rotation plan role.`
      });
    }

    if (seen.has(entry)) {
      errors.push({
        code: "RRP_DUPLICATE_ROLE",
        path,
        message: `Duplicate role '${entry}' in roles_required.`
      });
    }
    seen.add(entry);
  }

  if (
    typeof routeModeValue === "string" &&
    VALID_RUNTIME_ROTATION_ROUTE_MODES.includes(routeModeValue as RuntimeRotationRouteMode)
  ) {
    const expected = new Set(ROUTE_MODE_ROLES[routeModeValue as RuntimeRotationRouteMode]);
    const actual = new Set(
      value.filter(
        (entry): entry is RuntimeRotationPlanRole =>
          typeof entry === "string" &&
          VALID_RUNTIME_ROTATION_PLAN_ROLES.includes(entry as RuntimeRotationPlanRole)
      )
    );

    if (expected.size !== actual.size || [...expected].some((role) => !actual.has(role))) {
      errors.push({
        code: "RRP_ROLES_ROUTE_MODE_MISMATCH",
        path: "$.roles_required",
        message: "roles_required must exactly match the roles implied by route_mode."
      });
    }
  }
}

function validateHollowsRequired(value: unknown, errors: RoleArtifactValidationError[]): void {
  if (!Array.isArray(value)) {
    errors.push({
      code: "RRP_INVALID_HOLLOW_ID",
      path: "$.hollows_required",
      message: "hollows_required must be an array."
    });
    return;
  }

  const seen = new Set<string>();
  value.forEach((entry, index) => {
    const path = `$.hollows_required[${index}]`;
    if (typeof entry !== "string" || !HOLLOW_ID_FORMAT.test(entry)) {
      errors.push({
        code: "RRP_INVALID_HOLLOW_ID",
        path,
        message: "hollows_required entries must match hollow.<segment> format."
      });
      return;
    }

    if (seen.has(entry)) {
      errors.push({
        code: "RRP_INVALID_HOLLOW_ID",
        path,
        message: `Duplicate hollow id '${entry}' in hollows_required.`
      });
    }
    seen.add(entry);
  });
}

function validateGatesRequired(value: unknown, errors: RoleArtifactValidationError[]): void {
  if (!Array.isArray(value)) {
    errors.push({
      code: "RRP_UNKNOWN_GATE",
      path: "$.gates_required",
      message: "gates_required must be an array."
    });
    return;
  }

  const seen = new Set<string>();
  for (let index = 0; index < value.length; index += 1) {
    const entry = value[index];
    const path = `$.gates_required[${index}]`;
    if (typeof entry !== "string") {
      errors.push({
        code: "RRP_UNKNOWN_GATE",
        path,
        message: "gates_required entries must be strings."
      });
      continue;
    }

    if (!VALID_RUNTIME_ROTATION_PLAN_GATES.includes(entry as (typeof VALID_RUNTIME_ROTATION_PLAN_GATES)[number])) {
      errors.push({
        code: "RRP_UNKNOWN_GATE",
        path,
        message: `${entry} is not an allowed rotation plan gate.`
      });
      continue;
    }

    if (seen.has(entry)) {
      errors.push({
        code: "RRP_UNKNOWN_GATE",
        path,
        message: `Duplicate gate '${entry}' in gates_required.`
      });
    }
    seen.add(entry);
  }

  for (const mandatory of MANDATORY_RUNTIME_ROTATION_PLAN_GATES) {
    if (!seen.has(mandatory)) {
      errors.push({
        code: "RRP_MISSING_MANDATORY_GATE",
        path: "$.gates_required",
        message: `gates_required must include mandatory gate '${mandatory}'.`
      });
    }
  }
}

function validateMaxCycles(value: unknown, errors: RoleArtifactValidationError[]): void {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 3) {
    errors.push({
      code: "RRP_MAX_CYCLES_OUT_OF_BOUNDS",
      path: "$.max_cycles",
      message: "max_cycles must be an integer from 1 through 3 inclusive."
    });
  }
}

function validateStopCriteria(value: unknown, errors: RoleArtifactValidationError[]): void {
  if (!Array.isArray(value)) {
    errors.push({
      code: "RRP_EMPTY_STOP_CRITERIA",
      path: "$.stop_criteria",
      message: "stop_criteria must be a non-empty array."
    });
    return;
  }

  if (value.length === 0) {
    errors.push({
      code: "RRP_EMPTY_STOP_CRITERIA",
      path: "$.stop_criteria",
      message: "stop_criteria must be non-empty."
    });
    return;
  }

  value.forEach((entry, index) => {
    if (typeof entry !== "string" || entry.trim().length === 0) {
      errors.push({
        code: "RRP_EMPTY_STOP_CRITERIA",
        path: `$.stop_criteria[${index}]`,
        message: "stop_criteria entries must be non-empty strings after trim."
      });
    }
  });
}

function validateSideEffectPolicy(
  value: unknown,
  gatesValue: unknown,
  errors: RoleArtifactValidationError[]
): void {
  if (value !== "none" && value !== "requires_approval") {
    errors.push({
      code: "RRP_SIDE_EFFECT_WITHOUT_APPROVAL_GATE",
      path: "$.side_effect_policy",
      message: "side_effect_policy must be 'none' or 'requires_approval'."
    });
    return;
  }

  if (value === "requires_approval" && !gatePresent(gatesValue, "approval_gate")) {
    errors.push({
      code: "RRP_SIDE_EFFECT_WITHOUT_APPROVAL_GATE",
      path: "$.gates_required",
      message: "side_effect_policy 'requires_approval' requires approval_gate in gates_required."
    });
  }
}

function validateCodeMutationPolicy(
  value: unknown,
  gatesValue: unknown,
  snapshotRequirementValue: unknown,
  errors: RoleArtifactValidationError[]
): void {
  if (value !== "none" && value !== "requires_snapshot") {
    errors.push({
      code: "RRP_CODE_MUTATION_WITHOUT_SNAPSHOT_GATE",
      path: "$.code_mutation_policy",
      message: "code_mutation_policy must be 'none' or 'requires_snapshot'."
    });
    return;
  }

  if (value === "requires_snapshot") {
    if (!gatePresent(gatesValue, "snapshot_gate")) {
      errors.push({
        code: "RRP_CODE_MUTATION_WITHOUT_SNAPSHOT_GATE",
        path: "$.gates_required",
        message: "code_mutation_policy 'requires_snapshot' requires snapshot_gate in gates_required."
      });
    }
    if (snapshotRequirementValue !== true) {
      errors.push({
        code: "RRP_SNAPSHOT_REQUIREMENT_INCONSISTENT",
        path: "$.snapshot_requirement",
        message: "code_mutation_policy 'requires_snapshot' requires snapshot_requirement true."
      });
    }
  }
}

function validateSnapshotRequirementType(value: unknown, errors: RoleArtifactValidationError[]): void {
  if (typeof value !== "boolean") {
    errors.push({
      code: "RRP_SNAPSHOT_REQUIREMENT_INCONSISTENT",
      path: "$.snapshot_requirement",
      message: "snapshot_requirement must be a boolean."
    });
  }
}

function validateLedgerPolicy(value: unknown, errors: RoleArtifactValidationError[]): void {
  if (
    typeof value !== "string" ||
    !VALID_RUNTIME_ROTATION_LEDGER_POLICIES.includes(value as (typeof VALID_RUNTIME_ROTATION_LEDGER_POLICIES)[number])
  ) {
    errors.push({
      code: "RRP_INVALID_LEDGER_POLICY",
      path: "$.ledger_policy",
      message: "ledger_policy must be 'record_all_passes' for schema 1.0.0."
    });
  }
}

function validateCreatedAt(value: unknown, errors: RoleArtifactValidationError[]): void {
  if (typeof value !== "string" || value.trim().length === 0 || Number.isNaN(Date.parse(value))) {
    errors.push({
      code: "RRP_INVALID_CREATED_AT",
      path: "$.created_at",
      message: "created_at must be a valid ISO 8601 datetime string."
    });
  }
}

function gatePresent(gatesValue: unknown, gate: string): boolean {
  return Array.isArray(gatesValue) && gatesValue.some((entry) => entry === gate);
}

function result(errors: readonly RoleArtifactValidationError[]): RoleArtifactValidationResult {
  return { ok: errors.length === 0, errors };
}

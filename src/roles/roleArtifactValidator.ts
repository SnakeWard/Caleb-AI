import {
  ROLE_ARTIFACT_SCHEMA_VERSION,
  VALID_ROLE_ACCEPTANCE_STATUSES,
  VALID_ROLE_ARTIFACT_TYPES,
  VALID_ROLE_IDS
} from "./types/roleArtifact.js";
import { VALID_ROLE_HANDOFF_STATUSES } from "./types/roleHandoff.js";
import type {
  RoleAcceptanceStatus,
  RoleArtifactType,
  RoleArtifactValidationError,
  RoleArtifactValidationResult,
  RoleId
} from "./types/roleArtifact.js";
import type { RoleHandoffStatus } from "./types/roleHandoff.js";

const MAX_STRING_LENGTH = 4000;
const MAX_ARRAY_LENGTH = 50;

const FORBIDDEN_KEYS = new Set([
  "chain_of_thought",
  "chainOfThought",
  "hidden_chain_of_thought",
  "hiddenChainOfThought",
  "private_reasoning",
  "privateReasoning",
  "reasoning_transcript",
  "reasoningTranscript",
  "scratchpad",
  "raw_scratchpad",
  "rawScratchpad",
  "thought_log",
  "thoughtLog",
  "secrets",
  "credentials",
  "raw_file_contents",
  "rawFileContents",
  "hollow_input",
  "hollowInput",
  "input_payload",
  "inputPayload"
]);

const ROLE_ARTIFACT_REQUIRED_FIELDS = [
  "schema_version",
  "artifact_id",
  "artifact_type",
  "role_id",
  "task_id",
  "run_id",
  "trace_id",
  "context_id",
  "summary",
  "claims",
  "assumptions",
  "constraints",
  "open_questions",
  "recommendations",
  "evidence_refs",
  "confidence",
  "handoff_notes",
  "required_next_role",
  "acceptance_status",
  "created_at"
] as const;

const ROLE_ARTIFACT_REQUIRED_STRINGS = [
  "schema_version",
  "artifact_id",
  "artifact_type",
  "role_id",
  "task_id",
  "run_id",
  "trace_id",
  "context_id",
  "summary",
  "acceptance_status",
  "created_at"
] as const;

const ROLE_ARTIFACT_REQUIRED_ARRAYS = [
  "claims",
  "assumptions",
  "constraints",
  "open_questions",
  "recommendations",
  "evidence_refs",
  "handoff_notes"
] as const;

export function validateRoleArtifact(input: unknown): RoleArtifactValidationResult {
  const errors: RoleArtifactValidationError[] = [];
  const obj = validateObjectRoot(input, errors);
  if (obj === null) {
    return result(errors);
  }

  scanForbiddenKeys(input, "$", errors);
  validateSchemaVersion(obj, "$.schema_version", errors);
  requireFields(obj, ROLE_ARTIFACT_REQUIRED_FIELDS, errors);
  requireNonEmptyStrings(obj, ROLE_ARTIFACT_REQUIRED_STRINGS, errors);
  requireArrays(obj, ROLE_ARTIFACT_REQUIRED_ARRAYS, errors);
  validateOptionalArray(obj, "source_artifact_ids", errors);
  validateOptionalArray(obj, "warnings", errors);
  validateEnum(obj["role_id"], VALID_ROLE_IDS, "$.role_id", "invalid_role_id", "role_id must be an allowed RoleId.", errors);
  validateEnum(
    obj["artifact_type"],
    VALID_ROLE_ARTIFACT_TYPES,
    "$.artifact_type",
    "invalid_artifact_type",
    "artifact_type must be an allowed RoleArtifactType.",
    errors
  );
  validateEnum(
    obj["acceptance_status"],
    VALID_ROLE_ACCEPTANCE_STATUSES,
    "$.acceptance_status",
    "invalid_acceptance_status",
    "acceptance_status must be an allowed RoleAcceptanceStatus.",
    errors
  );
  validateConfidence(obj["confidence"], errors);
  validateRequiredNextRole(obj["required_next_role"], errors);
  validateIsoLikeString(obj["created_at"], "$.created_at", errors);
  validateTelemetryTraceRef(obj["telemetry_trace_ref"], "$.telemetry_trace_ref", errors);
  validateExecutionContextRef(obj["execution_context_ref"], "$.execution_context_ref", errors);
  validateAllStringAndArrayBounds(input, "$", errors);

  return result(errors);
}

export function validateRoleContract(input: unknown): RoleArtifactValidationResult {
  const errors: RoleArtifactValidationError[] = [];
  const obj = validateObjectRoot(input, errors);
  if (obj === null) {
    return result(errors);
  }

  scanForbiddenKeys(input, "$", errors);
  validateSchemaVersion(obj, "$.schema_version", errors);
  requireFields(obj, ["schema_version", "role_id", "allowed_artifact_types", "allowed_acceptance_statuses"], errors);
  validateEnum(obj["role_id"], VALID_ROLE_IDS, "$.role_id", "invalid_role_id", "role_id must be an allowed RoleId.", errors);
  validateEnumArray(
    obj["allowed_artifact_types"],
    VALID_ROLE_ARTIFACT_TYPES,
    "$.allowed_artifact_types",
    "invalid_allowed_artifact_type",
    errors
  );
  validateEnumArray(
    obj["allowed_acceptance_statuses"],
    VALID_ROLE_ACCEPTANCE_STATUSES,
    "$.allowed_acceptance_statuses",
    "invalid_allowed_acceptance_status",
    errors
  );
  validateAllStringAndArrayBounds(input, "$", errors);

  return result(errors);
}

export function validateRoleHandoffEnvelope(input: unknown): RoleArtifactValidationResult {
  const errors: RoleArtifactValidationError[] = [];
  const obj = validateObjectRoot(input, errors);
  if (obj === null) {
    return result(errors);
  }

  scanForbiddenKeys(input, "$", errors);
  validateSchemaVersion(obj, "$.schema_version", errors);
  requireFields(
    obj,
    ["schema_version", "source_role", "target_role", "task_id", "run_id", "trace_id", "context_id", "handoff_status"],
    errors
  );
  requireNonEmptyStrings(
    obj,
    ["schema_version", "source_role", "target_role", "task_id", "run_id", "trace_id", "context_id", "handoff_status"],
    errors
  );
  validateEnum(
    obj["source_role"],
    VALID_ROLE_IDS,
    "$.source_role",
    "invalid_source_role",
    "source_role must be an allowed RoleId.",
    errors
  );
  validateEnum(
    obj["target_role"],
    VALID_ROLE_IDS,
    "$.target_role",
    "invalid_target_role",
    "target_role must be an allowed RoleId.",
    errors
  );
  validateEnum(
    obj["handoff_status"],
    VALID_ROLE_HANDOFF_STATUSES,
    "$.handoff_status",
    "invalid_handoff_status",
    "handoff_status must be an allowed RoleHandoffStatus.",
    errors
  );
  validateArtifactReferencePresence(obj, errors);
  validateOptionalArray(obj, "artifact_refs", errors);
  if (obj["created_at"] !== undefined) {
    validateIsoLikeString(obj["created_at"], "$.created_at", errors);
  }
  validateAllStringAndArrayBounds(input, "$", errors);

  return result(errors);
}

function validateObjectRoot(
  input: unknown,
  errors: RoleArtifactValidationError[]
): Record<string, unknown> | null {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    errors.push({
      code: "invalid_root",
      path: "$",
      message: "Input must be a JSON object."
    });
    return null;
  }

  return input as Record<string, unknown>;
}

function validateSchemaVersion(
  obj: Record<string, unknown>,
  path: string,
  errors: RoleArtifactValidationError[]
): void {
  if (obj["schema_version"] !== ROLE_ARTIFACT_SCHEMA_VERSION) {
    errors.push({
      code: "invalid_schema_version",
      path,
      message: `schema_version must be '${ROLE_ARTIFACT_SCHEMA_VERSION}'.`
    });
  }
}

function requireFields(
  obj: Record<string, unknown>,
  fields: readonly string[],
  errors: RoleArtifactValidationError[]
): void {
  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(obj, field)) {
      errors.push({
        code: "missing_required_field",
        path: `$.${field}`,
        message: `${field} is required.`
      });
    }
  }
}

function requireNonEmptyStrings(
  obj: Record<string, unknown>,
  fields: readonly string[],
  errors: RoleArtifactValidationError[]
): void {
  for (const field of fields) {
    const value = obj[field];
    if (typeof value !== "string" || value.trim().length === 0) {
      errors.push({
        code: "invalid_required_string",
        path: `$.${field}`,
        message: `${field} must be a non-empty string.`
      });
    }
  }
}

function requireArrays(
  obj: Record<string, unknown>,
  fields: readonly string[],
  errors: RoleArtifactValidationError[]
): void {
  for (const field of fields) {
    if (!Array.isArray(obj[field])) {
      errors.push({
        code: "invalid_array",
        path: `$.${field}`,
        message: `${field} must be an array.`
      });
    }
  }
}

function validateOptionalArray(
  obj: Record<string, unknown>,
  field: string,
  errors: RoleArtifactValidationError[]
): void {
  if (obj[field] !== undefined && !Array.isArray(obj[field])) {
    errors.push({
      code: "invalid_array",
      path: `$.${field}`,
      message: `${field} must be an array when present.`
    });
  }
}

function validateEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  path: string,
  code: string,
  message: string,
  errors: RoleArtifactValidationError[]
): void {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    errors.push({ code, path, message });
  }
}

function validateEnumArray<T extends RoleArtifactType | RoleAcceptanceStatus>(
  value: unknown,
  allowed: readonly T[],
  path: string,
  code: string,
  errors: RoleArtifactValidationError[]
): void {
  if (!Array.isArray(value)) {
    errors.push({
      code: "invalid_array",
      path,
      message: `${path} must be an array.`
    });
    return;
  }

  value.forEach((entry, index) => {
    if (typeof entry !== "string" || !allowed.includes(entry as T)) {
      errors.push({
        code,
        path: `${path}[${index}]`,
        message: `${path}[${index}] must be an allowed value.`
      });
    }
  });
}

function validateConfidence(value: unknown, errors: RoleArtifactValidationError[]): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 1) {
    errors.push({
      code: "invalid_confidence",
      path: "$.confidence",
      message: "confidence must be a finite number from 0 through 1."
    });
  }
}

function validateRequiredNextRole(value: unknown, errors: RoleArtifactValidationError[]): void {
  if (value === null) {
    return;
  }
  validateEnum(
    value,
    VALID_ROLE_IDS,
    "$.required_next_role",
    "invalid_required_next_role",
    "required_next_role must be null or an allowed RoleId.",
    errors
  );
}

function validateIsoLikeString(value: unknown, path: string, errors: RoleArtifactValidationError[]): void {
  if (typeof value !== "string" || value.trim().length === 0 || Number.isNaN(Date.parse(value))) {
    errors.push({
      code: "invalid_iso_datetime",
      path,
      message: `${path} must be a non-empty ISO-like datetime string.`
    });
  }
}

function validateTelemetryTraceRef(value: unknown, path: string, errors: RoleArtifactValidationError[]): void {
  if (value === undefined) {
    return;
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    errors.push({ code: "invalid_telemetry_trace_ref", path, message: "telemetry_trace_ref must be an object." });
    return;
  }
  const ref = value as Record<string, unknown>;
  requireNonEmptyStrings(ref, ["trace_id", "context_id"], errorsForPath(path, errors));
}

function validateExecutionContextRef(value: unknown, path: string, errors: RoleArtifactValidationError[]): void {
  if (value === undefined) {
    return;
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    errors.push({ code: "invalid_execution_context_ref", path, message: "execution_context_ref must be an object." });
    return;
  }
  const ref = value as Record<string, unknown>;
  requireNonEmptyStrings(ref, ["context_id"], errorsForPath(path, errors));
}

function errorsForPath(prefix: string, errors: RoleArtifactValidationError[]): RoleArtifactValidationError[] {
  return new Proxy(errors, {
    get(target, prop, receiver) {
      if (prop !== "push") {
        return Reflect.get(target, prop, receiver);
      }
      return (error: RoleArtifactValidationError): number =>
        target.push({
          ...error,
          path: error.path.replace(/^\$/, prefix)
        });
    }
  });
}

function validateArtifactReferencePresence(
  obj: Record<string, unknown>,
  errors: RoleArtifactValidationError[]
): void {
  const artifactId = obj["artifact_id"];
  const artifactRefs = obj["artifact_refs"];
  const hasArtifactId = typeof artifactId === "string" && artifactId.trim().length > 0;
  const hasArtifactRefs = Array.isArray(artifactRefs) && artifactRefs.length > 0;
  if (!hasArtifactId && !hasArtifactRefs) {
    errors.push({
      code: "missing_artifact_reference",
      path: "$.artifact_id",
      message: "RoleHandoffEnvelope requires artifact_id or non-empty artifact_refs."
    });
  }
}

function scanForbiddenKeys(
  value: unknown,
  path: string,
  errors: RoleArtifactValidationError[],
  parentKey?: string
): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => scanForbiddenKeys(entry, `${path}[${index}]`, errors, parentKey));
    return;
  }

  if (typeof value !== "object" || value === null) {
    return;
  }

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const childPath = `${path}.${key}`;
    if (FORBIDDEN_KEYS.has(key)) {
      errors.push({
        code: "forbidden_key",
        path: childPath,
        message: `Forbidden key '${key}' is not allowed in role artifacts or handoff contracts.`
      });
    }
    if ((parentKey === "telemetry_trace" || parentKey === "telemetryTrace") && key === "events") {
      errors.push({
        code: "embedded_telemetry_events_forbidden",
        path: childPath,
        message: "Embedded telemetry event arrays are forbidden; reference trace/context IDs only."
      });
    }
    scanForbiddenKeys(child, childPath, errors, key);
  }
}

function validateAllStringAndArrayBounds(
  value: unknown,
  path: string,
  errors: RoleArtifactValidationError[]
): void {
  if (typeof value === "string") {
    if (value.length > MAX_STRING_LENGTH) {
      errors.push({
        code: "string_too_long",
        path,
        message: `String exceeds maximum length of ${MAX_STRING_LENGTH}.`
      });
    }
    return;
  }

  if (Array.isArray(value)) {
    if (value.length > MAX_ARRAY_LENGTH) {
      errors.push({
        code: "array_too_long",
        path,
        message: `Array exceeds maximum length of ${MAX_ARRAY_LENGTH}.`
      });
    }
    value.forEach((entry, index) => validateAllStringAndArrayBounds(entry, `${path}[${index}]`, errors));
    return;
  }

  if (typeof value === "object" && value !== null) {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      validateAllStringAndArrayBounds(child, `${path}.${key}`, errors);
    }
  }
}

function result(errors: readonly RoleArtifactValidationError[]): RoleArtifactValidationResult {
  return { ok: errors.length === 0, errors };
}

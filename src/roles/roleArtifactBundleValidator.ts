import {
  ROLE_ARTIFACT_SCHEMA_VERSION,
  VALID_ROLE_ACCEPTANCE_STATUSES,
  VALID_ROLE_ARTIFACT_TYPES
} from "./types/roleArtifact.js";
import { VALID_ROLE_ARTIFACT_REFERENCE_BUNDLE_STATUSES } from "./types/roleArtifactBundle.js";
import { listRoleContracts } from "./roleContractRegistry.js";
import type {
  RoleArtifactValidationError,
  RoleArtifactValidationResult,
  RoleId
} from "./types/roleArtifact.js";
import type { RoleHandoffGateStatus } from "./roleHandoffGate.js";

const VALID_HANDOFF_GATE_STATUSES: readonly RoleHandoffGateStatus[] = [
  "allowed",
  "blocked",
  "invalid"
] as const;

const FORBIDDEN_KEYS = new Set([
  "telemetry_trace",
  "telemetryTrace",
  "execution_context",
  "executionContext",
  "hollow_input",
  "input_payload",
  "chain_of_thought",
  "chainOfThought",
  "scratchpad",
  "privateReasoning",
  "artifact",
  "source_artifact",
  "handoff",
  "claims",
  "summary",
  "evidence_refs",
  "handoff_status"
]);

const REQUIRED_STRING_FIELDS = [
  "schema_version",
  "bundle_id",
  "task_id",
  "run_id",
  "trace_id",
  "context_id",
  "bundle_status",
  "created_at"
] as const;

export function validateRoleArtifactReferenceBundle(input: unknown): RoleArtifactValidationResult {
  const errors: RoleArtifactValidationError[] = [];
  const obj = validateObjectRoot(input, errors);
  if (obj === null) {
    return result(errors);
  }

  scanForbiddenKeys(input, "$", errors);
  validateSchemaVersion(obj, errors);
  requireFields(obj, [...REQUIRED_STRING_FIELDS, "artifact_refs", "handoff_gate_refs"], errors);
  requireNonEmptyStrings(obj, REQUIRED_STRING_FIELDS, errors);
  validateIsoLikeString(obj["created_at"], "$.created_at", errors);
  validateEnum(
    obj["bundle_status"],
    VALID_ROLE_ARTIFACT_REFERENCE_BUNDLE_STATUSES,
    "$.bundle_status",
    "invalid_bundle_status",
    "bundle_status must be an allowed RoleArtifactReferenceBundleStatus.",
    errors
  );
  validateOptionalArray(obj, "warnings", errors);

  const knownRoles = new Set<RoleId>(listRoleContracts().map((entry) => entry.contract.role_id));
  const artifactIds = validateArtifactRefs(obj["artifact_refs"], knownRoles, errors);
  validateHandoffGateRefs(obj["handoff_gate_refs"], knownRoles, artifactIds, errors);

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

function validateSchemaVersion(obj: Record<string, unknown>, errors: RoleArtifactValidationError[]): void {
  if (obj["schema_version"] !== ROLE_ARTIFACT_SCHEMA_VERSION) {
    errors.push({
      code: "invalid_schema_version",
      path: "$.schema_version",
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

function validateArtifactRefs(
  value: unknown,
  knownRoles: ReadonlySet<RoleId>,
  errors: RoleArtifactValidationError[]
): Set<string> {
  const artifactIds = new Set<string>();
  if (!Array.isArray(value)) {
    errors.push({
      code: "invalid_array",
      path: "$.artifact_refs",
      message: "artifact_refs must be a non-empty array."
    });
    return artifactIds;
  }
  if (value.length === 0) {
    errors.push({
      code: "empty_artifact_refs",
      path: "$.artifact_refs",
      message: "artifact_refs must contain at least one artifact reference."
    });
  }

  value.forEach((entry, index) => {
    const path = `$.artifact_refs[${index}]`;
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      errors.push({ code: "invalid_artifact_ref", path, message: "artifact_refs entries must be objects." });
      return;
    }
    const ref = entry as Record<string, unknown>;
    requireFields(ref, ["artifact_id", "role_id", "artifact_type", "acceptance_status"], errorsForPath(path, errors));
    requireNonEmptyStrings(ref, ["artifact_id", "role_id", "artifact_type", "acceptance_status"], errorsForPath(path, errors));
    const artifactId = ref["artifact_id"];
    if (typeof artifactId === "string" && artifactId.trim().length > 0) {
      if (artifactIds.has(artifactId)) {
        errors.push({
          code: "duplicate_artifact_id",
          path: `${path}.artifact_id`,
          message: `Duplicate artifact_id '${artifactId}'.`
        });
      }
      artifactIds.add(artifactId);
    }
    validateRole(ref["role_id"], knownRoles, `${path}.role_id`, errors);
    validateEnum(
      ref["artifact_type"],
      VALID_ROLE_ARTIFACT_TYPES,
      `${path}.artifact_type`,
      "invalid_artifact_type",
      "artifact_type must be an allowed RoleArtifactType.",
      errors
    );
    validateEnum(
      ref["acceptance_status"],
      VALID_ROLE_ACCEPTANCE_STATUSES,
      `${path}.acceptance_status`,
      "invalid_acceptance_status",
      "acceptance_status must be an allowed RoleAcceptanceStatus.",
      errors
    );
  });

  return artifactIds;
}

function validateHandoffGateRefs(
  value: unknown,
  knownRoles: ReadonlySet<RoleId>,
  artifactIds: ReadonlySet<string>,
  errors: RoleArtifactValidationError[]
): void {
  if (!Array.isArray(value)) {
    errors.push({
      code: "invalid_array",
      path: "$.handoff_gate_refs",
      message: "handoff_gate_refs must be an array."
    });
    return;
  }

  const seen = new Set<string>();
  value.forEach((entry, index) => {
    const path = `$.handoff_gate_refs[${index}]`;
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      errors.push({ code: "invalid_handoff_gate_ref", path, message: "handoff_gate_refs entries must be objects." });
      return;
    }
    const ref = entry as Record<string, unknown>;
    requireFields(
      ref,
      ["source_role", "target_role", "source_artifact_id", "allowed", "status", "error_codes"],
      errorsForPath(path, errors)
    );
    requireNonEmptyStrings(ref, ["source_role", "target_role", "source_artifact_id", "status"], errorsForPath(path, errors));
    validateRole(ref["source_role"], knownRoles, `${path}.source_role`, errors);
    validateRole(ref["target_role"], knownRoles, `${path}.target_role`, errors);
    validateSourceArtifactId(ref["source_artifact_id"], artifactIds, `${path}.source_artifact_id`, errors);
    validateAllowedStatusConsistency(ref, path, errors);
    validateDuplicateHandoffGateRef(ref, seen, path, errors);
  });
}

function validateRole(
  value: unknown,
  knownRoles: ReadonlySet<RoleId>,
  path: string,
  errors: RoleArtifactValidationError[]
): void {
  if (typeof value !== "string" || !knownRoles.has(value as RoleId)) {
    errors.push({
      code: "unknown_role_id",
      path,
      message: `${path} must be a known registered RoleId.`
    });
  }
}

function validateSourceArtifactId(
  value: unknown,
  artifactIds: ReadonlySet<string>,
  path: string,
  errors: RoleArtifactValidationError[]
): void {
  if (typeof value !== "string" || value.trim().length === 0 || !artifactIds.has(value)) {
    errors.push({
      code: "unknown_source_artifact_id",
      path,
      message: "source_artifact_id must reference an artifact_refs artifact_id."
    });
  }
}

function validateAllowedStatusConsistency(
  ref: Record<string, unknown>,
  path: string,
  errors: RoleArtifactValidationError[]
): void {
  if (typeof ref["allowed"] !== "boolean") {
    errors.push({
      code: "invalid_allowed",
      path: `${path}.allowed`,
      message: "allowed must be a boolean."
    });
  }
  validateEnum(
    ref["status"],
    VALID_HANDOFF_GATE_STATUSES,
    `${path}.status`,
    "invalid_handoff_gate_status",
    "status must be allowed, blocked, or invalid.",
    errors
  );
  if (!Array.isArray(ref["error_codes"])) {
    errors.push({
      code: "invalid_array",
      path: `${path}.error_codes`,
      message: "error_codes must be an array."
    });
    return;
  }
  if (ref["allowed"] === true && ref["status"] !== "allowed") {
    errors.push({
      code: "allowed_status_mismatch",
      path: `${path}.status`,
      message: "allowed true requires status 'allowed'."
    });
  }
  if (ref["status"] === "allowed" && ref["allowed"] !== true) {
    errors.push({
      code: "allowed_status_mismatch",
      path: `${path}.allowed`,
      message: "status 'allowed' requires allowed true."
    });
  }
  if ((ref["status"] === "blocked" || ref["status"] === "invalid") && ref["error_codes"].length === 0) {
    errors.push({
      code: "missing_error_codes",
      path: `${path}.error_codes`,
      message: "blocked or invalid handoff gate refs require at least one error code."
    });
  }
}

function validateDuplicateHandoffGateRef(
  ref: Record<string, unknown>,
  seen: Set<string>,
  path: string,
  errors: RoleArtifactValidationError[]
): void {
  const sourceRole = ref["source_role"];
  const targetRole = ref["target_role"];
  const sourceArtifactId = ref["source_artifact_id"];
  if (typeof sourceRole !== "string" || typeof targetRole !== "string" || typeof sourceArtifactId !== "string") {
    return;
  }
  const key = `${sourceRole}->${targetRole}:${sourceArtifactId}`;
  if (seen.has(key)) {
    errors.push({
      code: "duplicate_handoff_gate_ref",
      path,
      message: "Duplicate handoff_gate_ref for source_role, target_role, and source_artifact_id."
    });
  }
  seen.add(key);
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

function validateIsoLikeString(value: unknown, path: string, errors: RoleArtifactValidationError[]): void {
  if (typeof value !== "string" || value.trim().length === 0 || Number.isNaN(Date.parse(value))) {
    errors.push({
      code: "invalid_iso_datetime",
      path,
      message: `${path} must be a non-empty ISO-like datetime string.`
    });
  }
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
        message: `Forbidden key '${key}' is not allowed in role artifact reference bundles.`
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

function result(errors: readonly RoleArtifactValidationError[]): RoleArtifactValidationResult {
  return { ok: errors.length === 0, errors };
}

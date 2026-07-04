import {
  ROLE_ARTIFACT_SCHEMA_VERSION,
  VALID_ROLE_ACCEPTANCE_STATUSES,
  VALID_ROLE_ARTIFACT_TYPES
} from "./types/roleArtifact.js";
import { VALID_ROLE_ARTIFACT_REFERENCE_BUNDLE_STATUSES } from "./types/roleArtifactBundle.js";
import {
  VALID_ROLE_ARTIFACT_BUNDLE_CONSISTENCY_CHECK_STATUSES,
  VALID_ROLE_ARTIFACT_BUNDLE_CONSISTENCY_REPORT_STATUSES,
  VALID_ROLE_ARTIFACT_BUNDLE_FINDING_SEVERITIES,
  VALID_ROLE_ARTIFACT_BUNDLE_VALIDATION_STATUSES
} from "./types/roleArtifactBundleReport.js";
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
  "bundle",
  "artifact",
  "source_artifact",
  "handoff",
  "handoff_result",
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
  "artifact_refs",
  "handoff_gate_refs",
  "claims",
  "evidence_refs",
  "handoff_status"
]);

const REQUIRED_STRING_FIELDS = [
  "schema_version",
  "report_id",
  "bundle_id",
  "task_id",
  "run_id",
  "trace_id",
  "context_id",
  "report_status",
  "bundle_status",
  "validation_status",
  "created_at"
] as const;

export function validateRoleArtifactBundleConsistencyReport(input: unknown): RoleArtifactValidationResult {
  const errors: RoleArtifactValidationError[] = [];
  const obj = validateObjectRoot(input, errors);
  if (obj === null) {
    return result(errors);
  }

  scanForbiddenKeys(input, "$", errors);
  validateSchemaVersion(obj, errors);
  requireFields(
    obj,
    [
      ...REQUIRED_STRING_FIELDS,
      "artifact_ref_summary",
      "handoff_gate_summary",
      "consistency_checks",
      "findings"
    ],
    errors
  );
  requireNonEmptyStrings(obj, REQUIRED_STRING_FIELDS, errors);
  validateIsoLikeString(obj["created_at"], "$.created_at", errors);
  validateEnum(
    obj["report_status"],
    VALID_ROLE_ARTIFACT_BUNDLE_CONSISTENCY_REPORT_STATUSES,
    "$.report_status",
    "invalid_report_status",
    "report_status must be an allowed RoleArtifactBundleConsistencyReportStatus.",
    errors
  );
  validateEnum(
    obj["validation_status"],
    VALID_ROLE_ARTIFACT_BUNDLE_VALIDATION_STATUSES,
    "$.validation_status",
    "invalid_validation_status",
    "validation_status must be valid, invalid, or not_evaluated.",
    errors
  );
  validateEnum(
    obj["bundle_status"],
    VALID_ROLE_ARTIFACT_REFERENCE_BUNDLE_STATUSES,
    "$.bundle_status",
    "invalid_bundle_status",
    "bundle_status must be an allowed RoleArtifactReferenceBundleStatus.",
    errors
  );
  validateOptionalStringArray(obj, "warnings", "$.warnings", errors);

  const knownRoles = new Set<RoleId>(listRoleContracts().map((entry) => entry.contract.role_id));
  validateArtifactRefSummary(obj["artifact_ref_summary"], knownRoles, errors);
  validateHandoffGateSummary(obj["handoff_gate_summary"], errors);
  validateConsistencyChecks(obj["consistency_checks"], knownRoles, errors);
  validateFindings(obj["findings"], knownRoles, errors);

  return result(errors);
}

function validateObjectRoot(
  input: unknown,
  errors: RoleArtifactValidationError[]
): Record<string, unknown> | null {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    errors.push({ code: "invalid_root", path: "$", message: "Input must be a JSON object." });
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

function validateArtifactRefSummary(
  value: unknown,
  knownRoles: ReadonlySet<RoleId>,
  errors: RoleArtifactValidationError[]
): void {
  const obj = validateNestedObject(value, "$.artifact_ref_summary", "invalid_artifact_ref_summary", errors);
  if (obj === null) return;
  validateNonNegativeNumber(obj["total_artifact_refs"], "$.artifact_ref_summary.total_artifact_refs", errors);
  validateCountArray(obj["by_role"], "$.artifact_ref_summary.by_role", errors, (entry, path) => {
    validateRole(entry["role_id"], knownRoles, `${path}.role_id`, errors);
  });
  validateCountArray(obj["by_artifact_type"], "$.artifact_ref_summary.by_artifact_type", errors, (entry, path) => {
    validateEnum(
      entry["artifact_type"],
      VALID_ROLE_ARTIFACT_TYPES,
      `${path}.artifact_type`,
      "invalid_artifact_type",
      "artifact_type must be an allowed RoleArtifactType.",
      errors
    );
  });
  validateCountArray(obj["by_acceptance_status"], "$.artifact_ref_summary.by_acceptance_status", errors, (entry, path) => {
    validateEnum(
      entry["acceptance_status"],
      VALID_ROLE_ACCEPTANCE_STATUSES,
      `${path}.acceptance_status`,
      "invalid_acceptance_status",
      "acceptance_status must be an allowed RoleAcceptanceStatus.",
      errors
    );
  });
}

function validateHandoffGateSummary(value: unknown, errors: RoleArtifactValidationError[]): void {
  const obj = validateNestedObject(value, "$.handoff_gate_summary", "invalid_handoff_gate_summary", errors);
  if (obj === null) return;
  for (const field of ["total_handoff_gate_refs", "allowed_count", "blocked_count", "invalid_count"] as const) {
    validateNonNegativeNumber(obj[field], `$.handoff_gate_summary.${field}`, errors);
  }
  validateCountArray(obj["by_status"], "$.handoff_gate_summary.by_status", errors, (entry, path) => {
    validateEnum(
      entry["status"],
      VALID_HANDOFF_GATE_STATUSES,
      `${path}.status`,
      "invalid_handoff_gate_status",
      "status must be allowed, blocked, or invalid.",
      errors
    );
  });
}

function validateConsistencyChecks(
  value: unknown,
  knownRoles: ReadonlySet<RoleId>,
  errors: RoleArtifactValidationError[]
): void {
  if (!Array.isArray(value)) {
    errors.push({ code: "invalid_array", path: "$.consistency_checks", message: "consistency_checks must be an array." });
    return;
  }
  value.forEach((entry, index) => {
    const path = `$.consistency_checks[${index}]`;
    const obj = validateNestedObject(entry, path, "invalid_consistency_check", errors);
    if (obj === null) return;
    requireFields(obj, ["check_id", "status", "summary"], errorsForPath(path, errors));
    requireNonEmptyStrings(obj, ["check_id", "status", "summary"], errorsForPath(path, errors));
    validateEnum(
      obj["status"],
      VALID_ROLE_ARTIFACT_BUNDLE_CONSISTENCY_CHECK_STATUSES,
      `${path}.status`,
      "invalid_consistency_check_status",
      "status must be pass, warn, fail, or not_applicable.",
      errors
    );
    validateOptionalStringArray(obj, "related_artifact_ids", `${path}.related_artifact_ids`, errors);
    validateOptionalStringArray(obj, "related_handoff_refs", `${path}.related_handoff_refs`, errors);
    validateOptionalRoleArray(obj, "related_roles", `${path}.related_roles`, knownRoles, errors);
  });
}

function validateFindings(
  value: unknown,
  knownRoles: ReadonlySet<RoleId>,
  errors: RoleArtifactValidationError[]
): void {
  if (!Array.isArray(value)) {
    errors.push({ code: "invalid_array", path: "$.findings", message: "findings must be an array." });
    return;
  }
  value.forEach((entry, index) => {
    const path = `$.findings[${index}]`;
    const obj = validateNestedObject(entry, path, "invalid_finding", errors);
    if (obj === null) return;
    requireFields(obj, ["finding_id", "severity", "code", "summary"], errorsForPath(path, errors));
    requireNonEmptyStrings(obj, ["finding_id", "severity", "code", "summary"], errorsForPath(path, errors));
    validateEnum(
      obj["severity"],
      VALID_ROLE_ARTIFACT_BUNDLE_FINDING_SEVERITIES,
      `${path}.severity`,
      "invalid_finding_severity",
      "severity must be info, warning, error, or critical.",
      errors
    );
    validateOptionalStringArray(obj, "related_artifact_ids", `${path}.related_artifact_ids`, errors);
    validateOptionalRoleArray(obj, "related_roles", `${path}.related_roles`, knownRoles, errors);
  });
}

function validateCountArray(
  value: unknown,
  path: string,
  errors: RoleArtifactValidationError[],
  validateEntry: (entry: Record<string, unknown>, path: string) => void
): void {
  if (!Array.isArray(value)) {
    errors.push({ code: "invalid_array", path, message: `${path} must be an array.` });
    return;
  }
  value.forEach((entry, index) => {
    const entryPath = `${path}[${index}]`;
    const obj = validateNestedObject(entry, entryPath, "invalid_summary_entry", errors);
    if (obj === null) return;
    validateNonNegativeNumber(obj["count"], `${entryPath}.count`, errors);
    validateEntry(obj, entryPath);
  });
}

function validateNestedObject(
  value: unknown,
  path: string,
  code: string,
  errors: RoleArtifactValidationError[]
): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    errors.push({ code, path, message: `${path} must be an object.` });
    return null;
  }
  return value as Record<string, unknown>;
}

function requireFields(
  obj: Record<string, unknown>,
  fields: readonly string[],
  errors: RoleArtifactValidationError[]
): void {
  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(obj, field)) {
      errors.push({ code: "missing_required_field", path: `$.${field}`, message: `${field} is required.` });
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
      errors.push({ code: "invalid_required_string", path: `$.${field}`, message: `${field} must be a non-empty string.` });
    }
  }
}

function validateNonNegativeNumber(value: unknown, path: string, errors: RoleArtifactValidationError[]): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    errors.push({ code: "invalid_count", path, message: `${path} must be a non-negative finite number.` });
  }
}

function validateOptionalStringArray(
  obj: Record<string, unknown>,
  field: string,
  path: string,
  errors: RoleArtifactValidationError[]
): void {
  if (obj[field] === undefined) return;
  if (!Array.isArray(obj[field]) || !(obj[field] as unknown[]).every((entry) => typeof entry === "string")) {
    errors.push({ code: "invalid_array", path, message: `${path} must be an array of strings when present.` });
  }
}

function validateOptionalRoleArray(
  obj: Record<string, unknown>,
  field: string,
  path: string,
  knownRoles: ReadonlySet<RoleId>,
  errors: RoleArtifactValidationError[]
): void {
  if (obj[field] === undefined) return;
  if (!Array.isArray(obj[field])) {
    errors.push({ code: "invalid_array", path, message: `${path} must be an array when present.` });
    return;
  }
  (obj[field] as unknown[]).forEach((entry, index) => validateRole(entry, knownRoles, `${path}[${index}]`, errors));
}

function validateRole(
  value: unknown,
  knownRoles: ReadonlySet<RoleId>,
  path: string,
  errors: RoleArtifactValidationError[]
): void {
  if (typeof value !== "string" || !knownRoles.has(value as RoleId)) {
    errors.push({ code: "unknown_role_id", path, message: `${path} must be a known registered RoleId.` });
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

function validateIsoLikeString(value: unknown, path: string, errors: RoleArtifactValidationError[]): void {
  if (typeof value !== "string" || value.trim().length === 0 || Number.isNaN(Date.parse(value))) {
    errors.push({ code: "invalid_iso_datetime", path, message: `${path} must be a non-empty ISO-like datetime string.` });
  }
}

function errorsForPath(prefix: string, errors: RoleArtifactValidationError[]): RoleArtifactValidationError[] {
  return new Proxy(errors, {
    get(target, prop, receiver) {
      if (prop !== "push") {
        return Reflect.get(target, prop, receiver);
      }
      return (error: RoleArtifactValidationError): number =>
        target.push({ ...error, path: error.path.replace(/^\$/, prefix) });
    }
  });
}

function scanForbiddenKeys(value: unknown, path: string, errors: RoleArtifactValidationError[], parentKey?: string): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => scanForbiddenKeys(entry, `${path}[${index}]`, errors, parentKey));
    return;
  }
  if (typeof value !== "object" || value === null) return;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const childPath = `${path}.${key}`;
    if (FORBIDDEN_KEYS.has(key)) {
      errors.push({
        code: "forbidden_key",
        path: childPath,
        message: `Forbidden key '${key}' is not allowed in role artifact bundle consistency reports.`
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

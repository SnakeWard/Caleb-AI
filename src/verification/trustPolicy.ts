import type { CalebWarning, HollowInvocationRecord } from "../types/invocation.js";
import type { SideEffectClass } from "../types/permissions.js";
import type { TrustTier } from "../types/trust.js";
import type { VerificationIssue } from "./verificationTypes.js";

export const REQUIRED_INVOCATION_FIELDS = [
  "invocation_id",
  "task_id",
  "run_id",
  "trace_id",
  "hollow_id",
  "hollow_version",
  "schema_version",
  "status",
  "result",
  "checks",
  "warnings",
  "errors",
  "artifact_hashes",
  "provenance",
  "verification_status",
  "trust_tier"
] as const;

export interface InvocationStructureEvaluation {
  readonly valid: boolean;
  readonly missing_fields: readonly string[];
  readonly errors: readonly VerificationIssue[];
}

export interface InvocationSafetyEvaluation {
  readonly safe: boolean;
  readonly errors: readonly VerificationIssue[];
}

const FORBIDDEN_V1_PERMISSIONS = new Set<SideEffectClass>([
  "network",
  "shell_command",
  "external_side_effect",
  "workspace_write"
]);

export function evaluateInvocationStructure(record: unknown): InvocationStructureEvaluation {
  if (!isRecord(record)) {
    return {
      valid: false,
      missing_fields: [...REQUIRED_INVOCATION_FIELDS],
      errors: [
        {
          code: "malformed_result",
          message: "HollowInvocationRecord must be an object."
        }
      ]
    };
  }

  const missingFields = REQUIRED_INVOCATION_FIELDS.filter((field) => !(field in record));
  const errors: VerificationIssue[] = missingFields.map((field) => ({
    code: "missing_required_field",
    field,
    message: `Missing required invocation field "${field}".`
  }));

  if ("checks" in record && !Array.isArray(record.checks)) {
    errors.push({
      code: "malformed_result",
      field: "checks",
      message: "checks must be an array."
    });
  }

  if ("warnings" in record && !Array.isArray(record.warnings)) {
    errors.push({
      code: "malformed_result",
      field: "warnings",
      message: "warnings must be an array."
    });
  }

  if ("errors" in record && !Array.isArray(record.errors)) {
    errors.push({
      code: "malformed_result",
      field: "errors",
      message: "errors must be an array."
    });
  }

  if ("artifact_hashes" in record && !Array.isArray(record.artifact_hashes)) {
    errors.push({
      code: "malformed_result",
      field: "artifact_hashes",
      message: "artifact_hashes must be an array."
    });
  }

  if ("provenance" in record && !isRecord(record.provenance)) {
    errors.push({
      code: "malformed_result",
      field: "provenance",
      message: "provenance must be an object."
    });
  }

  return {
    valid: errors.length === 0,
    missing_fields: missingFields,
    errors
  };
}

export function evaluateV1SafetyForInvocation(
  record: HollowInvocationRecord
): InvocationSafetyEvaluation {
  const errors: VerificationIssue[] = [];

  for (const permission of record.permissions) {
    if (FORBIDDEN_V1_PERMISSIONS.has(permission)) {
      errors.push({
        code: "unsafe_permission",
        field: "permissions",
        message: `Permission "${permission}" is not allowed through the V1 Verified Return Path.`
      });
    }
  }

  if (record.execution_mode === "approved_side_effect") {
    errors.push({
      code: "unsafe_execution_mode",
      field: "execution_mode",
      message: "approved_side_effect execution mode is blocked in V1."
    });
  }

  return {
    safe: errors.length === 0,
    errors
  };
}

export function assignV1TrustTier(record: HollowInvocationRecord): TrustTier {
  const structure = evaluateInvocationStructure(record);
  if (!structure.valid) {
    return "T0";
  }

  const safety = evaluateV1SafetyForInvocation(record);
  if (!safety.safe) {
    return "T0";
  }

  if (record.status === "failed" || record.status === "rejected" || record.status === "blocked") {
    return "T0";
  }

  if (record.status !== "completed") {
    return "T0";
  }

  if (record.errors.length > 0 || hasCriticalWarning(record.warnings)) {
    return "T0";
  }

  if (!record.deterministic) {
    return "T1";
  }

  return "T2";
}

export function hasCriticalWarning(warnings: readonly CalebWarning[]): boolean {
  return warnings.some((warning) => warning.severity === "critical");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

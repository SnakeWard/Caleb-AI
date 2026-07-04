import type {
  ModelInvocationRecord,
  ModelInvocationValidationIssue,
  ModelInvocationValidationResult
} from "./types/modelInvocationRecordTypes.js";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

function issue(code: string, path: string, message: string): ModelInvocationValidationIssue {
  return { code, path, message };
}

function validateString(record: Record<string, unknown>, errors: ModelInvocationValidationIssue[], field: string): void {
  if (!isNonEmptyString(record[field])) {
    errors.push(issue("invalid_required_string", `$.${field}`, `${field} must be a non-empty string.`));
  }
}

function validateArray(record: Record<string, unknown>, errors: ModelInvocationValidationIssue[], field: string): void {
  if (!isArray(record[field])) {
    errors.push(issue("invalid_array", `$.${field}`, `${field} must be an array.`));
  }
}

function validateTrustSummary(record: Record<string, unknown>, errors: ModelInvocationValidationIssue[]): void {
  const summary = record["trust_summary"];
  if (!isObject(summary)) {
    errors.push(issue("invalid_object", "$.trust_summary", "trust_summary must be an object."));
    return;
  }

  if (summary["raw_output_trust_tier"] !== "T0") {
    errors.push(issue("invalid_raw_output_trust_tier", "$.trust_summary.raw_output_trust_tier", "raw_output_trust_tier must be T0."));
  }
  if (summary["validated_output_trust_tier"] !== "T1") {
    errors.push(
      issue("invalid_validated_output_trust_tier", "$.trust_summary.validated_output_trust_tier", "validated_output_trust_tier must be T1.")
    );
  }
  if (summary["max_allowed_trust_tier"] !== "T1") {
    errors.push(issue("invalid_max_allowed_trust_tier", "$.trust_summary.max_allowed_trust_tier", "max_allowed_trust_tier must be T1."));
  }
  if (summary["model_output_is_deterministic_evidence"] !== false) {
    errors.push(
      issue(
        "model_output_deterministic_evidence_forbidden",
        "$.trust_summary.model_output_is_deterministic_evidence",
        "model_output_is_deterministic_evidence must be false."
      )
    );
  }
  if (summary["trust_promotion_blocked"] !== true) {
    errors.push(issue("trust_promotion_must_be_blocked", "$.trust_summary.trust_promotion_blocked", "trust_promotion_blocked must be true."));
  }
  if (summary["ledger_presence_promotes_trust"] !== false) {
    errors.push(
      issue(
        "ledger_presence_trust_promotion_forbidden",
        "$.trust_summary.ledger_presence_promotes_trust",
        "ledger_presence_promotes_trust must be false."
      )
    );
  }
  if (!isArray(summary["notes"])) {
    errors.push(issue("invalid_array", "$.trust_summary.notes", "trust_summary.notes must be an array."));
  }
}

function validateLedgerIntent(record: Record<string, unknown>, errors: ModelInvocationValidationIssue[]): void {
  const intent = record["ledger_intent"];
  if (!isObject(intent)) {
    errors.push(issue("invalid_object", "$.ledger_intent", "ledger_intent must be an object."));
    return;
  }

  for (const field of ["intended_activity", "actor_id", "trust_effect"]) {
    validateString(intent, errors, field);
  }

  if (intent["actor_type"] !== "model_boundary" && intent["actor_type"] !== "model_adapter") {
    errors.push(issue("invalid_actor_type", "$.ledger_intent.actor_type", "actor_type must be model_boundary or model_adapter."));
  }
  if (intent["writes_in_this_pass"] !== false) {
    errors.push(issue("ledger_write_forbidden", "$.ledger_intent.writes_in_this_pass", "writes_in_this_pass must be false in R12."));
  }
  if (intent["trust_effect"] !== "none") {
    errors.push(issue("ledger_trust_effect_forbidden", "$.ledger_intent.trust_effect", "ledger_intent.trust_effect must be none."));
  }
  if (!isArray(intent["notes"])) {
    errors.push(issue("invalid_array", "$.ledger_intent.notes", "ledger_intent.notes must be an array."));
  }
}

export function validateModelInvocationRecord(input: unknown): ModelInvocationValidationResult {
  const errors: ModelInvocationValidationIssue[] = [];
  if (!isObject(input)) {
    return { ok: false, errors: [issue("invalid_root", "$", "ModelInvocationRecord must be an object.")] };
  }

  for (const field of [
    "schema_version",
    "record_id",
    "task_id",
    "run_id",
    "request_id",
    "response_id",
    "boundary_id",
    "adapter_id",
    "invocation_status",
    "created_at",
    "completed_at",
    "prompt_digest",
    "request_digest",
    "response_digest",
    "raw_response_record_id",
    "validated_response_record_id"
  ]) {
    validateString(input, errors, field);
  }

  if (input["record_kind"] !== "mocked_single_pass_invocation") {
    errors.push(issue("invalid_record_kind", "$.record_kind", "record_kind must be mocked_single_pass_invocation."));
  }
  if (input["route_mode"] !== "single_pass") {
    errors.push(issue("invalid_route_mode", "$.route_mode", "route_mode must be single_pass."));
  }
  if (input["adapter_kind"] !== "mock") {
    errors.push(issue("invalid_adapter_kind", "$.adapter_kind", "adapter_kind must be mock."));
  }

  for (const field of ["supplied_evidence_refs", "supplied_context_refs", "warnings", "issues", "notes"]) {
    validateArray(input, errors, field);
  }

  if (!isObject(input["storage_refs"])) {
    errors.push(issue("invalid_object", "$.storage_refs", "storage_refs must be an object."));
  }

  validateTrustSummary(input, errors);
  validateLedgerIntent(input, errors);

  return { ok: errors.length === 0, errors };
}

export function isModelInvocationRecord(input: unknown): input is ModelInvocationRecord {
  return validateModelInvocationRecord(input).ok;
}

export function assertModelInvocationRecord(input: unknown): ModelInvocationRecord {
  const result = validateModelInvocationRecord(input);
  if (!result.ok) {
    throw new Error(`Invalid ModelInvocationRecord: ${result.errors.map((error) => `${error.path} ${error.code}`).join("; ")}`);
  }

  return input as ModelInvocationRecord;
}

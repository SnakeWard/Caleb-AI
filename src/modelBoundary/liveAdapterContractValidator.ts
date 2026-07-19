import type {
  LiveAdapterFailure,
  LiveAdapterRequest,
  LiveAdapterResponse,
  LiveAdapterValidationIssue,
  LiveAdapterValidationResult
} from "./types/liveAdapterTypes.js";

const providerKinds = new Set(["openai_compatible", "anthropic_compatible", "google_compatible", "xai_compatible", "local_compatible", "custom_compatible"]);
const failureKinds = new Set(["adapter_unavailable", "missing_api_key", "invalid_request", "provider_timeout", "provider_rate_limited", "provider_auth_failed", "provider_rejected_request", "provider_malformed_response", "response_validation_failed", "safety_profile_blocked", "network_failure", "observer_failure", "unknown_provider_error"]);
const failureStatuses = new Set(["failed", "rejected", "timeout", "rate_limited", "auth_failed", "safety_blocked", "validation_failed", "adapter_unavailable"]);
const blockedFields = new Set(["raw_prompt_text", "prompt_text", "raw_output_text", "output_text", "api_key", "secret", "env", "environment"]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function issue(code: string, path: string, message: string): LiveAdapterValidationIssue {
  return { code, path, message, severity: "error" };
}

function rejectUnexpectedFields(
  input: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  errors: LiveAdapterValidationIssue[]
): void {
  const allowedSet = new Set(allowed);
  for (const field of Object.keys(input)) {
    if (!allowedSet.has(field)) {
      errors.push(issue("unexpected_field", `${path}.${field}`, `${field} is not allowed in ${path}.`));
    }
  }
}

function rejectBlockedTopLevel(input: Record<string, unknown>, errors: LiveAdapterValidationIssue[]): void {
  for (const field of Object.keys(input)) {
    if (blockedFields.has(field.toLowerCase())) {
      errors.push(issue("blocked_top_level_field", `$.${field}`, `${field} is blocked from R18 live adapter contracts.`));
    }
  }
}

function requireStrings(input: Record<string, unknown>, fields: readonly string[], errors: LiveAdapterValidationIssue[], prefix = "$"): void {
  for (const field of fields) {
    if (!isNonEmptyString(input[field])) {
      errors.push(issue("invalid_required_string", `${prefix}.${field}`, `${field} must be a non-empty string.`));
    }
  }
}

function requireFalse(value: unknown, path: string, code: string, errors: LiveAdapterValidationIssue[]): void {
  if (value !== false) errors.push(issue(code, path, `${path} must be false.`));
}

function requireTrue(value: unknown, path: string, code: string, errors: LiveAdapterValidationIssue[]): void {
  if (value !== true) errors.push(issue(code, path, `${path} must be true.`));
}

function validateProviderShell(input: Record<string, unknown>, errors: LiveAdapterValidationIssue[]): void {
  if (input["route_mode"] !== "single_pass") errors.push(issue("invalid_route_mode", "$.route_mode", "route_mode must be single_pass for R18."));
  if (!providerKinds.has(String(input["provider_kind"]))) errors.push(issue("invalid_provider_kind", "$.provider_kind", "provider_kind is not supported by the R18 neutral contract."));
}

function validateLimits(value: unknown, errors: LiveAdapterValidationIssue[]): void {
  if (!isObject(value)) { errors.push(issue("invalid_object", "$.limits", "limits must be an object.")); return; }
  if (typeof value["timeout_ms"] !== "number" || value["timeout_ms"] <= 0) errors.push(issue("invalid_timeout_ms", "$.limits.timeout_ms", "timeout_ms must be positive."));
  if (typeof value["max_output_tokens"] !== "number" || value["max_output_tokens"] <= 0) errors.push(issue("invalid_max_output_tokens", "$.limits.max_output_tokens", "max_output_tokens must be positive."));
  if (typeof value["retry_count"] !== "number" || value["retry_count"] < 0) errors.push(issue("invalid_retry_count", "$.limits.retry_count", "retry_count must be zero or positive."));
  if (typeof value["temperature_allowed"] !== "boolean") errors.push(issue("invalid_boolean", "$.limits.temperature_allowed", "temperature_allowed must be boolean."));
  if (typeof value["streaming_allowed"] !== "boolean") errors.push(issue("invalid_boolean", "$.limits.streaming_allowed", "streaming_allowed must be boolean."));
}

function validateSafetyProfile(value: unknown, errors: LiveAdapterValidationIssue[]): void {
  if (!isObject(value)) { errors.push(issue("invalid_object", "$.safety_profile", "safety_profile must be an object.")); return; }
  requireStrings(value, ["safety_profile_id"], errors, "$.safety_profile");
  if (typeof value["redaction_required"] !== "boolean") errors.push(issue("invalid_boolean", "$.safety_profile.redaction_required", "redaction_required must be boolean."));
  if (typeof value["raw_transcript_storage_allowed"] !== "boolean") errors.push(issue("invalid_boolean", "$.safety_profile.raw_transcript_storage_allowed", "raw_transcript_storage_allowed must be boolean."));
  requireFalse(value["ledger_raw_prompt_allowed"], "$.safety_profile.ledger_raw_prompt_allowed", "ledger_raw_prompt_blocked", errors);
  requireFalse(value["ledger_raw_output_allowed"], "$.safety_profile.ledger_raw_output_allowed", "ledger_raw_output_blocked", errors);
}

function validatePromptRef(value: unknown, errors: LiveAdapterValidationIssue[]): void {
  if (!isObject(value)) { errors.push(issue("invalid_object", "$.prompt_ref", "prompt_ref must be an object.")); return; }
  requireStrings(value, ["prompt_ref_id", "prompt_digest"], errors, "$.prompt_ref");
  if (!["ref_only", "digest_only", "future_approved_storage"].includes(String(value["prompt_storage_kind"]))) errors.push(issue("invalid_prompt_storage_kind", "$.prompt_ref.prompt_storage_kind", "prompt_storage_kind must be neutral."));
  requireFalse(value["raw_prompt_included"], "$.prompt_ref.raw_prompt_included", "raw_prompt_blocked", errors);
}

function validateOutputRef(value: unknown, errors: LiveAdapterValidationIssue[]): void {
  if (!isObject(value)) { errors.push(issue("invalid_object", "$.output_ref", "output_ref must be an object.")); return; }
  requireStrings(value, ["output_ref_id", "output_digest"], errors, "$.output_ref");
  if (!["ref_only", "digest_only", "future_approved_storage"].includes(String(value["output_storage_kind"]))) errors.push(issue("invalid_output_storage_kind", "$.output_ref.output_storage_kind", "output_storage_kind must be neutral."));
  requireFalse(value["raw_output_included"], "$.output_ref.raw_output_included", "raw_output_blocked", errors);
}

function validateTrust(value: unknown, validationStatus: unknown, errors: LiveAdapterValidationIssue[]): void {
  if (!isObject(value)) { errors.push(issue("invalid_object", "$.trust_summary", "trust_summary must be an object.")); return; }
  if (value["raw_provider_output_trust_tier"] !== "T0") errors.push(issue("invalid_raw_trust", "$.trust_summary.raw_provider_output_trust_tier", "raw provider output must be T0."));
  if (validationStatus === "schema_valid" && value["schema_valid_provider_output_trust_tier"] !== "T1") errors.push(issue("invalid_schema_valid_trust", "$.trust_summary.schema_valid_provider_output_trust_tier", "schema-valid provider output must be T1."));
  if (!["T0", "T1"].includes(String(value["schema_valid_provider_output_trust_tier"]))) errors.push(issue("schema_trust_above_t1", "$.trust_summary.schema_valid_provider_output_trust_tier", "schema-valid trust must be T1 or lower."));
  if (value["max_allowed_trust_tier"] !== "T1") errors.push(issue("max_trust_above_t1", "$.trust_summary.max_allowed_trust_tier", "max_allowed_trust_tier must be T1."));
  for (const field of ["provider_identity_promotes_trust", "successful_response_promotes_trust", "provider_output_is_deterministic_evidence", "storage_promotes_trust", "retrieval_promotes_trust", "ledger_presence_promotes_trust", "verified_final_truth_claimed"]) {
    requireFalse(value[field], `$.trust_summary.${field}`, "trust_promotion_not_allowed", errors);
  }
  requireTrue(value["requires_hollow_verification_for_t2"], "$.trust_summary.requires_hollow_verification_for_t2", "hollow_verification_required", errors);
  if (!Array.isArray(value["notes"])) errors.push(issue("invalid_array", "$.trust_summary.notes", "notes must be an array."));
}

function validateUsage(value: unknown, errors: LiveAdapterValidationIssue[], path = "$.token_usage"): void {
  if (!isObject(value)) { errors.push(issue("invalid_object", path, "token_usage must be an object.")); return; }
  for (const field of ["input_tokens", "output_tokens", "total_tokens"]) {
    if (typeof value[field] !== "number" || value[field] < 0) errors.push(issue("invalid_token_count", `${path}.${field}`, `${field} must be >= 0.`));
  }
  if (typeof value["usage_available"] !== "boolean") errors.push(issue("invalid_boolean", `${path}.usage_available`, "usage_available must be boolean."));
}

function validateTiming(value: unknown, errors: LiveAdapterValidationIssue[], path = "$.timing"): void {
  if (!isObject(value)) { errors.push(issue("invalid_object", path, "timing must be an object.")); return; }
  requireStrings(value, ["started_at", "completed_at"], errors, path);
  if (typeof value["latency_ms"] !== "number" || value["latency_ms"] < 0) errors.push(issue("invalid_latency", `${path}.latency_ms`, "latency_ms must be >= 0."));
  if (typeof value["timed_out"] !== "boolean") errors.push(issue("invalid_boolean", `${path}.timed_out`, "timed_out must be boolean."));
}

function validateFailureResponseTelemetry(
  value: unknown,
  errors: LiveAdapterValidationIssue[]
): void {
  if (value === undefined) return;
  if (!isObject(value)) {
    errors.push(issue("invalid_object", "$.response_telemetry", "response_telemetry must be an object."));
    return;
  }
  rejectUnexpectedFields(
    value,
    ["provider_response_id", "output_digest", "finish_reason", "token_usage", "timing"],
    "$.response_telemetry",
    errors
  );
  if (value["provider_response_id"] !== null && !isNonEmptyString(value["provider_response_id"])) {
    errors.push(issue(
      "invalid_provider_response_id",
      "$.response_telemetry.provider_response_id",
      "provider_response_id must be null or a non-empty string."
    ));
  }
  if (
    typeof value["output_digest"] !== "string" ||
    !/^sha256:[a-f0-9]{64}$/.test(value["output_digest"])
  ) {
    errors.push(issue(
      "invalid_output_digest",
      "$.response_telemetry.output_digest",
      "output_digest must be a SHA-256 digest."
    ));
  }
  if (!isNonEmptyString(value["finish_reason"])) {
    errors.push(issue(
      "invalid_finish_reason",
      "$.response_telemetry.finish_reason",
      "finish_reason must be a non-empty string."
    ));
  }
  if (isObject(value["token_usage"])) {
    rejectUnexpectedFields(
      value["token_usage"],
      ["input_tokens", "output_tokens", "total_tokens", "usage_available"],
      "$.response_telemetry.token_usage",
      errors
    );
  }
  if (isObject(value["timing"])) {
    rejectUnexpectedFields(
      value["timing"],
      ["started_at", "completed_at", "latency_ms", "timed_out"],
      "$.response_telemetry.timing",
      errors
    );
  }
  validateUsage(value["token_usage"], errors, "$.response_telemetry.token_usage");
  validateTiming(value["timing"], errors, "$.response_telemetry.timing");
}

function validateRetry(value: unknown, path: string, errors: LiveAdapterValidationIssue[]): void {
  if (!isObject(value)) { errors.push(issue("invalid_object", path, `${path} must be an object.`)); return; }
  for (const field of ["attempts", "max_attempts"]) {
    if (typeof value[field] !== "number" || value[field] < 0) errors.push(issue("invalid_retry_count", `${path}.${field}`, `${field} must be >= 0.`));
  }
  if (typeof value["retryable"] !== "boolean") errors.push(issue("invalid_boolean", `${path}.retryable`, "retryable must be boolean."));
  if (!Array.isArray(value["retry_notes"])) errors.push(issue("invalid_array", `${path}.retry_notes`, "retry_notes must be an array."));
}

function validateRedaction(value: unknown, errors: LiveAdapterValidationIssue[]): void {
  if (!isObject(value)) { errors.push(issue("invalid_object", "$.redaction_summary", "redaction_summary must be an object.")); return; }
  for (const field of ["input_redacted", "output_redacted", "raw_prompt_removed", "raw_output_removed", "sensitive_fields_removed"]) {
    if (typeof value[field] !== "boolean") errors.push(issue("invalid_boolean", `$.redaction_summary.${field}`, `${field} must be boolean.`));
  }
  requireStrings(value, ["redaction_profile_id"], errors, "$.redaction_summary");
  requireTrue(value["raw_prompt_removed"], "$.redaction_summary.raw_prompt_removed", "raw_prompt_removal_required", errors);
  requireTrue(value["raw_output_removed"], "$.redaction_summary.raw_output_removed", "raw_output_removal_required", errors);
  if (!Array.isArray(value["redaction_notes"])) errors.push(issue("invalid_array", "$.redaction_summary.redaction_notes", "redaction_notes must be an array."));
}

export function validateLiveAdapterRequest(input: unknown): LiveAdapterValidationResult {
  const errors: LiveAdapterValidationIssue[] = [];
  if (!isObject(input)) return { ok: false, errors: [issue("invalid_root", "$", "LiveAdapterRequest must be an object.")] };
  rejectBlockedTopLevel(input, errors);
  requireStrings(input, ["schema_version", "task_id", "run_id", "request_id", "provider_id", "adapter_id", "adapter_version", "redacted_prompt_digest", "created_at"], errors);
  validateProviderShell(input, errors);
  if (!Array.isArray(input["context_refs"])) errors.push(issue("invalid_array", "$.context_refs", "context_refs must be an array."));
  if (!Array.isArray(input["evidence_refs"])) errors.push(issue("invalid_array", "$.evidence_refs", "evidence_refs must be an array."));
  if (!isObject(input["constraints"])) errors.push(issue("invalid_object", "$.constraints", "constraints must be an object."));
  validatePromptRef(input["prompt_ref"], errors);
  validateLimits(input["limits"], errors);
  validateSafetyProfile(input["safety_profile"], errors);
  return { ok: errors.length === 0, errors };
}

export function validateLiveAdapterResponse(input: unknown): LiveAdapterValidationResult {
  const errors: LiveAdapterValidationIssue[] = [];
  if (!isObject(input)) return { ok: false, errors: [issue("invalid_root", "$", "LiveAdapterResponse must be an object.")] };
  rejectBlockedTopLevel(input, errors);
  requireStrings(input, ["schema_version", "task_id", "run_id", "request_id", "response_id", "provider_id", "adapter_id", "adapter_version", "redacted_output_digest", "finish_reason", "created_at"], errors);
  validateProviderShell(input, errors);
  if (!["raw", "schema_valid"].includes(String(input["validation_status"]))) errors.push(issue("invalid_validation_status", "$.validation_status", "validation_status must be raw or schema_valid."));
  validateOutputRef(input["output_ref"], errors);
  validateUsage(input["token_usage"], errors);
  validateTiming(input["timing"], errors);
  validateRetry(input["retry_summary"], "$.retry_summary", errors);
  validateRedaction(input["redaction_summary"], errors);
  if (!Array.isArray(input["warnings"])) errors.push(issue("invalid_array", "$.warnings", "warnings must be an array."));
  if (!Array.isArray(input["errors"])) errors.push(issue("invalid_array", "$.errors", "errors must be an array."));
  validateTrust(input["trust_summary"], input["validation_status"], errors);
  return { ok: errors.length === 0, errors };
}

export function validateLiveAdapterFailure(input: unknown): LiveAdapterValidationResult {
  const errors: LiveAdapterValidationIssue[] = [];
  if (!isObject(input)) return { ok: false, errors: [issue("invalid_root", "$", "LiveAdapterFailure must be an object.")] };
  rejectBlockedTopLevel(input, errors);
  requireStrings(input, ["schema_version", "task_id", "run_id", "request_id", "provider_id", "adapter_id", "adapter_version", "created_at"], errors);
  validateProviderShell(input, errors);
  if (!failureKinds.has(String(input["failure_kind"]))) errors.push(issue("invalid_failure_kind", "$.failure_kind", "failure_kind is not in the R18 taxonomy."));
  if (!failureStatuses.has(String(input["status"]))) errors.push(issue("invalid_result_status", "$.status", "status is not a failure status."));
  if (typeof input["retryable"] !== "boolean") errors.push(issue("invalid_boolean", "$.retryable", "retryable must be boolean."));
  if (!Array.isArray(input["warnings"])) errors.push(issue("invalid_array", "$.warnings", "warnings must be an array."));
  if (!Array.isArray(input["errors"])) errors.push(issue("invalid_array", "$.errors", "errors must be an array."));
  validateFailureResponseTelemetry(input["response_telemetry"], errors);
  validateTrust(input["trust_summary"], "raw", errors);
  if (isObject(input["trust_summary"]) && input["trust_summary"]["schema_valid_provider_output_trust_tier"] !== "T0") {
    errors.push(issue("failure_trust_above_t0", "$.trust_summary.schema_valid_provider_output_trust_tier", "failed provider output must remain T0."));
  }
  return { ok: errors.length === 0, errors };
}

export function isLiveAdapterRequest(input: unknown): input is LiveAdapterRequest { return validateLiveAdapterRequest(input).ok; }
export function isLiveAdapterResponse(input: unknown): input is LiveAdapterResponse { return validateLiveAdapterResponse(input).ok; }
export function isLiveAdapterFailure(input: unknown): input is LiveAdapterFailure { return validateLiveAdapterFailure(input).ok; }

export function assertLiveAdapterRequest(input: unknown): LiveAdapterRequest {
  const validation = validateLiveAdapterRequest(input);
  if (!validation.ok) throw new Error(`Invalid LiveAdapterRequest: ${validation.errors.map((error) => `${error.path} ${error.code}`).join("; ")}`);
  return input as LiveAdapterRequest;
}

export function assertLiveAdapterResponse(input: unknown): LiveAdapterResponse {
  const validation = validateLiveAdapterResponse(input);
  if (!validation.ok) throw new Error(`Invalid LiveAdapterResponse: ${validation.errors.map((error) => `${error.path} ${error.code}`).join("; ")}`);
  return input as LiveAdapterResponse;
}

export function assertLiveAdapterFailure(input: unknown): LiveAdapterFailure {
  const validation = validateLiveAdapterFailure(input);
  if (!validation.ok) throw new Error(`Invalid LiveAdapterFailure: ${validation.errors.map((error) => `${error.path} ${error.code}`).join("; ")}`);
  return input as LiveAdapterFailure;
}

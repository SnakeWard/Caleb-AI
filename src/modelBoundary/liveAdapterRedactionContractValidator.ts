import type {
  LiveAdapterRedactionManifest,
  LiveAdapterRedactionPolicy,
  LiveAdapterRedactionResult,
  LiveAdapterRedactionValidationIssue,
  LiveAdapterRedactionValidationResult
} from "./types/liveAdapterRedactionTypes.js";

const scopes = new Set(["live_adapter_request", "live_adapter_response", "live_adapter_failure", "ledger_event", "runtime_storage_record", "final_output_record"]);
const sensitiveCategories = new Set(["api_key", "secret", "env_value", "credential", "auth_token", "private_key", "password", "raw_prompt_text", "raw_model_output_text", "unredacted_user_content", "unredacted_provider_response", "unknown_sensitive_content"]);
const redactionActions = new Set(["block", "remove", "replace_with_digest", "replace_with_ref", "summarize_only", "future_policy_required"]);
const resultStatuses = new Set(["redacted", "rejected", "blocked", "validation_failed", "policy_incompatible"]);
const blockedFields = new Set(["raw_prompt_text", "prompt_text", "raw_output_text", "output_text", "api_key", "secret", "env", "environment", "credential", "auth_token", "private_key"]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function issue(code: string, path: string, message: string): LiveAdapterRedactionValidationIssue {
  return { code, path, message, severity: "error" };
}

function rejectBlockedTopLevel(input: Record<string, unknown>, errors: LiveAdapterRedactionValidationIssue[]): void {
  for (const field of Object.keys(input)) {
    if (blockedFields.has(field.toLowerCase())) errors.push(issue("blocked_top_level_field", `$.${field}`, `${field} is blocked from R19 redaction contracts.`));
  }
}

function requireStrings(input: Record<string, unknown>, fields: readonly string[], errors: LiveAdapterRedactionValidationIssue[], prefix = "$"): void {
  for (const field of fields) {
    if (!isNonEmptyString(input[field])) errors.push(issue("invalid_required_string", `${prefix}.${field}`, `${field} must be a non-empty string.`));
  }
}

function requireArray(value: unknown, path: string, errors: LiveAdapterRedactionValidationIssue[]): value is unknown[] {
  if (!Array.isArray(value)) {
    errors.push(issue("invalid_array", path, `${path} must be an array.`));
    return false;
  }
  return true;
}

function requireBoolean(value: unknown, path: string, errors: LiveAdapterRedactionValidationIssue[]): void {
  if (typeof value !== "boolean") errors.push(issue("invalid_boolean", path, `${path} must be boolean.`));
}

function requireTrue(value: unknown, path: string, code: string, errors: LiveAdapterRedactionValidationIssue[]): void {
  if (value !== true) errors.push(issue(code, path, `${path} must be true.`));
}

function requireFalse(value: unknown, path: string, code: string, errors: LiveAdapterRedactionValidationIssue[]): void {
  if (value !== false) errors.push(issue(code, path, `${path} must be false.`));
}

function normalizedScopes(value: unknown, path: string, errors: LiveAdapterRedactionValidationIssue[]): string[] {
  const values = Array.isArray(value) ? value : [value];
  if (Array.isArray(value) && value.length === 0) errors.push(issue("empty_scope", path, "scope must not be empty."));
  for (const [index, item] of values.entries()) {
    if (!scopes.has(String(item))) errors.push(issue("invalid_scope", Array.isArray(value) ? `${path}.${index}` : path, "scope is not valid for R19."));
  }
  return values.map(String);
}

function validateSensitiveCategoryArray(value: unknown, path: string, errors: LiveAdapterRedactionValidationIssue[]): void {
  if (!requireArray(value, path, errors)) return;
  for (const [index, item] of value.entries()) {
    if (!sensitiveCategories.has(String(item))) errors.push(issue("invalid_sensitive_category", `${path}.${index}`, "sensitive category is not supported by R19."));
  }
}

function validateStringArray(value: unknown, path: string, errors: LiveAdapterRedactionValidationIssue[]): void {
  if (!requireArray(value, path, errors)) return;
  for (const [index, item] of value.entries()) {
    if (typeof item !== "string") errors.push(issue("invalid_string_array_item", `${path}.${index}`, "array item must be a string."));
  }
}

function validateAllowedContent(value: unknown, errors: LiveAdapterRedactionValidationIssue[]): void {
  if (!isObject(value)) { errors.push(issue("invalid_object", "$.allowed_content", "allowed_content must be an object.")); return; }
  for (const field of ["ids_allowed", "refs_allowed", "digests_allowed", "statuses_allowed", "trust_summaries_allowed", "usage_summaries_allowed", "timing_summaries_allowed", "warning_summaries_allowed", "error_summaries_allowed", "raw_text_allowed"]) {
    requireBoolean(value[field], `$.allowed_content.${field}`, errors);
  }
  requireFalse(value["raw_text_allowed"], "$.allowed_content.raw_text_allowed", "raw_text_not_allowed", errors);
}

function validateBlockedContent(value: unknown, errors: LiveAdapterRedactionValidationIssue[]): void {
  if (!isObject(value)) { errors.push(issue("invalid_object", "$.blocked_content", "blocked_content must be an object.")); return; }
  for (const field of ["raw_prompt_text_blocked", "raw_model_output_text_blocked", "api_keys_blocked", "secrets_blocked", "env_values_blocked", "credentials_blocked", "auth_tokens_blocked", "private_keys_blocked", "unredacted_user_content_blocked", "unredacted_provider_response_blocked"]) {
    requireTrue(value[field], `$.blocked_content.${field}`, "blocked_content_required", errors);
  }
}

function validateDigestRef(value: unknown, path: string, errors: LiveAdapterRedactionValidationIssue[]): void {
  if (!isObject(value)) { errors.push(issue("invalid_object", path, `${path} must be an object.`)); return; }
  rejectBlockedTopLevel(value, errors);
  requireStrings(value, ["digest_id", "digest_algorithm", "digest_value", "source_kind"], errors, path);
  requireFalse(value["raw_content_retained"], `${path}.raw_content_retained`, "raw_content_retention_blocked", errors);
}

function validateDigestRefs(value: unknown, path: string, errors: LiveAdapterRedactionValidationIssue[]): void {
  if (!requireArray(value, path, errors)) return;
  value.forEach((item, index) => validateDigestRef(item, `${path}.${index}`, errors));
}

function validateAuditSummary(value: unknown, status: unknown, errors: LiveAdapterRedactionValidationIssue[]): void {
  if (!isObject(value)) { errors.push(issue("invalid_object", "$.audit_summary", "audit_summary must be an object.")); return; }
  requireStrings(value, ["redaction_policy_id", "redaction_manifest_id"], errors, "$.audit_summary");
  for (const field of ["redaction_applied", "sensitive_content_detected", "sensitive_content_removed", "raw_prompt_removed", "raw_output_removed", "api_keys_removed", "secrets_removed", "env_values_removed", "remaining_sensitive_content_allowed"]) {
    requireBoolean(value[field], `$.audit_summary.${field}`, errors);
  }
  if (status === "redacted") requireTrue(value["redaction_applied"], "$.audit_summary.redaction_applied", "redaction_required_for_redacted_result", errors);
  if (value["sensitive_content_detected"] === true) requireTrue(value["sensitive_content_removed"], "$.audit_summary.sensitive_content_removed", "sensitive_content_removal_required", errors);
  requireTrue(value["raw_prompt_removed"], "$.audit_summary.raw_prompt_removed", "raw_prompt_removal_required", errors);
  requireTrue(value["raw_output_removed"], "$.audit_summary.raw_output_removed", "raw_output_removal_required", errors);
  requireTrue(value["api_keys_removed"], "$.audit_summary.api_keys_removed", "api_key_removal_required", errors);
  requireTrue(value["secrets_removed"], "$.audit_summary.secrets_removed", "secret_removal_required", errors);
  requireTrue(value["env_values_removed"], "$.audit_summary.env_values_removed", "env_value_removal_required", errors);
  requireFalse(value["remaining_sensitive_content_allowed"], "$.audit_summary.remaining_sensitive_content_allowed", "remaining_sensitive_content_blocked", errors);
  validateStringArray(value["audit_notes"], "$.audit_summary.audit_notes", errors);
}

function validateSafetyCompatibility(value: unknown, errors: LiveAdapterRedactionValidationIssue[]): void {
  if (!isObject(value)) { errors.push(issue("invalid_object", "$.safety_profile_compatibility", "safety_profile_compatibility must be an object.")); return; }
  requireStrings(value, ["safety_profile_id", "redaction_policy_id"], errors, "$.safety_profile_compatibility");
  requireBoolean(value["compatible"], "$.safety_profile_compatibility.compatible", errors);
  validateStringArray(value["incompatibility_reasons"], "$.safety_profile_compatibility.incompatibility_reasons", errors);
  requireFalse(value["raw_transcript_storage_allowed"], "$.safety_profile_compatibility.raw_transcript_storage_allowed", "raw_transcript_storage_blocked", errors);
  requireFalse(value["ledger_raw_prompt_allowed"], "$.safety_profile_compatibility.ledger_raw_prompt_allowed", "ledger_raw_prompt_blocked", errors);
  requireFalse(value["ledger_raw_output_allowed"], "$.safety_profile_compatibility.ledger_raw_output_allowed", "ledger_raw_output_blocked", errors);
  requireBoolean(value["live_provider_allowed_after_redaction"], "$.safety_profile_compatibility.live_provider_allowed_after_redaction", errors);
  if (value["compatible"] !== true && value["live_provider_allowed_after_redaction"] === true) {
    errors.push(issue("provider_allowed_with_incompatible_policy", "$.safety_profile_compatibility.live_provider_allowed_after_redaction", "live provider may be allowed only after compatible redaction policy."));
  }
}

function validateTrustSummary(value: unknown, errors: LiveAdapterRedactionValidationIssue[]): void {
  if (!isObject(value)) { errors.push(issue("invalid_object", "$.trust_summary", "trust_summary must be an object.")); return; }
  for (const field of ["redaction_promotes_trust", "redaction_metadata_promotes_trust", "provider_identity_promotes_trust", "successful_provider_response_promotes_trust", "ledger_presence_promotes_trust", "storage_promotes_trust", "retrieval_promotes_trust", "redacted_output_is_verified_truth", "redacted_output_is_deterministic_evidence"]) {
    requireFalse(value[field], `$.trust_summary.${field}`, "trust_promotion_not_allowed", errors);
  }
  if (value["live_provider_output_max_trust_tier"] !== "T1") {
    errors.push(issue("live_provider_output_trust_above_t1", "$.trust_summary.live_provider_output_max_trust_tier", "live provider output max trust tier must be T1."));
  }
  requireTrue(value["requires_hollow_verification_for_t2"], "$.trust_summary.requires_hollow_verification_for_t2", "hollow_verification_required", errors);
  validateStringArray(value["notes"], "$.trust_summary.notes", errors);
}

export function validateLiveAdapterRedactionPolicy(input: unknown): LiveAdapterRedactionValidationResult {
  const errors: LiveAdapterRedactionValidationIssue[] = [];
  if (!isObject(input)) return { ok: false, errors: [issue("invalid_root", "$", "LiveAdapterRedactionPolicy must be an object.")] };
  rejectBlockedTopLevel(input, errors);
  requireStrings(input, ["schema_version", "policy_id", "policy_version", "safety_profile_id", "created_at"], errors);
  normalizedScopes(input["scope"], "$.scope", errors);
  requireTrue(input["redaction_required"], "$.redaction_required", "redaction_required", errors);
  requireFalse(input["raw_prompt_allowed"], "$.raw_prompt_allowed", "raw_prompt_blocked", errors);
  requireFalse(input["raw_output_allowed"], "$.raw_output_allowed", "raw_output_blocked", errors);
  requireFalse(input["ledger_raw_prompt_allowed"], "$.ledger_raw_prompt_allowed", "ledger_raw_prompt_blocked", errors);
  requireFalse(input["ledger_raw_output_allowed"], "$.ledger_raw_output_allowed", "ledger_raw_output_blocked", errors);
  requireFalse(input["runtime_storage_raw_prompt_allowed"], "$.runtime_storage_raw_prompt_allowed", "runtime_storage_raw_prompt_blocked", errors);
  requireFalse(input["runtime_storage_raw_output_allowed"], "$.runtime_storage_raw_output_allowed", "runtime_storage_raw_output_blocked", errors);
  validateAllowedContent(input["allowed_content"], errors);
  validateBlockedContent(input["blocked_content"], errors);
  validateSensitiveCategoryArray(input["sensitive_categories"], "$.sensitive_categories", errors);
  if (!redactionActions.has(String(input["default_action"]))) errors.push(issue("invalid_redaction_action", "$.default_action", "default_action is not supported by R19."));
  validateStringArray(input["notes"], "$.notes", errors);
  return { ok: errors.length === 0, errors };
}

export function validateLiveAdapterRedactionManifest(input: unknown): LiveAdapterRedactionValidationResult {
  const errors: LiveAdapterRedactionValidationIssue[] = [];
  if (!isObject(input)) return { ok: false, errors: [issue("invalid_root", "$", "LiveAdapterRedactionManifest must be an object.")] };
  rejectBlockedTopLevel(input, errors);
  requireStrings(input, ["schema_version", "manifest_id", "policy_id", "task_id", "run_id", "request_id", "created_at"], errors);
  const scopeValues = normalizedScopes(input["scope"], "$.scope", errors);
  validateDigestRefs(input["input_digest_refs"], "$.input_digest_refs", errors);
  validateDigestRefs(input["output_digest_refs"], "$.output_digest_refs", errors);
  validateStringArray(input["redacted_fields"], "$.redacted_fields", errors);
  validateStringArray(input["blocked_fields"], "$.blocked_fields", errors);
  validateStringArray(input["allowed_fields"], "$.allowed_fields", errors);
  validateSensitiveCategoryArray(input["sensitive_categories_detected"], "$.sensitive_categories_detected", errors);
  requireTrue(input["raw_prompt_removed"], "$.raw_prompt_removed", "raw_prompt_removal_required", errors);
  if (scopeValues.includes("live_adapter_response")) requireTrue(input["raw_output_removed"], "$.raw_output_removed", "raw_output_removal_required", errors);
  requireTrue(input["api_keys_removed"], "$.api_keys_removed", "api_key_removal_required", errors);
  requireTrue(input["secrets_removed"], "$.secrets_removed", "secret_removal_required", errors);
  requireTrue(input["env_values_removed"], "$.env_values_removed", "env_value_removal_required", errors);
  validateStringArray(input["notes"], "$.notes", errors);
  return { ok: errors.length === 0, errors };
}

export function validateLiveAdapterRedactionResult(input: unknown): LiveAdapterRedactionValidationResult {
  const errors: LiveAdapterRedactionValidationIssue[] = [];
  if (!isObject(input)) return { ok: false, errors: [issue("invalid_root", "$", "LiveAdapterRedactionResult must be an object.")] };
  rejectBlockedTopLevel(input, errors);
  requireStrings(input, ["schema_version", "result_id", "policy_id", "manifest_id", "task_id", "run_id", "request_id", "created_at"], errors);
  normalizedScopes(input["scope"], "$.scope", errors);
  if (!resultStatuses.has(String(input["status"]))) errors.push(issue("invalid_result_status", "$.status", "status is not supported by R19."));
  validateDigestRefs(input["digest_refs"], "$.digest_refs", errors);
  validateAuditSummary(input["audit_summary"], input["status"], errors);
  validateSafetyCompatibility(input["safety_profile_compatibility"], errors);
  validateTrustSummary(input["trust_summary"], errors);
  validateStringArray(input["warnings"], "$.warnings", errors);
  validateStringArray(input["errors"], "$.errors", errors);
  validateStringArray(input["notes"], "$.notes", errors);
  return { ok: errors.length === 0, errors };
}

export function isLiveAdapterRedactionPolicy(input: unknown): input is LiveAdapterRedactionPolicy { return validateLiveAdapterRedactionPolicy(input).ok; }
export function isLiveAdapterRedactionManifest(input: unknown): input is LiveAdapterRedactionManifest { return validateLiveAdapterRedactionManifest(input).ok; }
export function isLiveAdapterRedactionResult(input: unknown): input is LiveAdapterRedactionResult { return validateLiveAdapterRedactionResult(input).ok; }

export function assertLiveAdapterRedactionPolicy(input: unknown): LiveAdapterRedactionPolicy {
  const validation = validateLiveAdapterRedactionPolicy(input);
  if (!validation.ok) throw new Error(`Invalid LiveAdapterRedactionPolicy: ${validation.errors.map((error) => `${error.path} ${error.code}`).join("; ")}`);
  return input as LiveAdapterRedactionPolicy;
}

export function assertLiveAdapterRedactionManifest(input: unknown): LiveAdapterRedactionManifest {
  const validation = validateLiveAdapterRedactionManifest(input);
  if (!validation.ok) throw new Error(`Invalid LiveAdapterRedactionManifest: ${validation.errors.map((error) => `${error.path} ${error.code}`).join("; ")}`);
  return input as LiveAdapterRedactionManifest;
}

export function assertLiveAdapterRedactionResult(input: unknown): LiveAdapterRedactionResult {
  const validation = validateLiveAdapterRedactionResult(input);
  if (!validation.ok) throw new Error(`Invalid LiveAdapterRedactionResult: ${validation.errors.map((error) => `${error.path} ${error.code}`).join("; ")}`);
  return input as LiveAdapterRedactionResult;
}

import type {
  LiveAdapterInterfaceCapabilities,
  LiveAdapterInterfaceValidationIssue,
  LiveAdapterInterfaceValidationResult,
  LiveAdapterInvocationContext,
  LiveAdapterInvocationResult
} from "./types/liveAdapterInterfaceTypes.js";

const healthStatuses = new Set(["available_mock_only", "unavailable", "disabled", "future_live_not_enabled"]);
const resultStatuses = new Set(["mock_interface_ready", "unavailable", "rejected", "validation_failed", "future_live_not_enabled"]);
const unavailableStatuses = new Set(["unavailable", "disabled", "future_live_not_enabled"]);
const failureKinds = new Set(["adapter_unavailable", "missing_api_key", "invalid_request", "provider_timeout", "provider_rate_limited", "provider_auth_failed", "provider_rejected_request", "provider_malformed_response", "response_validation_failed", "safety_profile_blocked", "network_failure", "unknown_provider_error"]);
const blockedFields = new Set(["raw_prompt_text", "prompt_text", "raw_output_text", "output_text", "api_key", "secret", "env", "environment", "credential", "auth_token", "private_key"]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function issue(code: string, path: string, message: string): LiveAdapterInterfaceValidationIssue {
  return { code, path, message, severity: "error" };
}

function rejectBlockedTopLevel(input: Record<string, unknown>, errors: LiveAdapterInterfaceValidationIssue[]): void {
  for (const field of Object.keys(input)) {
    if (blockedFields.has(field.toLowerCase())) errors.push(issue("blocked_top_level_field", `$.${field}`, `${field} is blocked from R20 interface contracts.`));
  }
}

function requireStrings(input: Record<string, unknown>, fields: readonly string[], errors: LiveAdapterInterfaceValidationIssue[], prefix = "$"): void {
  for (const field of fields) {
    if (!isNonEmptyString(input[field])) errors.push(issue("invalid_required_string", `${prefix}.${field}`, `${field} must be a non-empty string.`));
  }
}

function requireArray(value: unknown, path: string, errors: LiveAdapterInterfaceValidationIssue[]): value is unknown[] {
  if (!Array.isArray(value)) {
    errors.push(issue("invalid_array", path, `${path} must be an array.`));
    return false;
  }
  return true;
}

function requireBoolean(value: unknown, path: string, errors: LiveAdapterInterfaceValidationIssue[]): void {
  if (typeof value !== "boolean") errors.push(issue("invalid_boolean", path, `${path} must be boolean.`));
}

function requireTrue(value: unknown, path: string, code: string, errors: LiveAdapterInterfaceValidationIssue[]): void {
  if (value !== true) errors.push(issue(code, path, `${path} must be true.`));
}

function requireFalse(value: unknown, path: string, code: string, errors: LiveAdapterInterfaceValidationIssue[]): void {
  if (value !== false) errors.push(issue(code, path, `${path} must be false.`));
}

function validateStringArray(value: unknown, path: string, errors: LiveAdapterInterfaceValidationIssue[]): void {
  if (!requireArray(value, path, errors)) return;
  for (const [index, item] of value.entries()) {
    if (typeof item !== "string") errors.push(issue("invalid_string_array_item", `${path}.${index}`, "array item must be a string."));
  }
}

function validateRefArray(value: unknown, path: string, errors: LiveAdapterInterfaceValidationIssue[]): void {
  requireArray(value, path, errors);
}

function validateRequiredTrueFlags(value: unknown, path: string, fields: readonly string[], errors: LiveAdapterInterfaceValidationIssue[]): void {
  if (!isObject(value)) { errors.push(issue("invalid_object", path, `${path} must be an object.`)); return; }
  rejectBlockedTopLevel(value, errors);
  for (const field of fields) requireTrue(value[field], `${path}.${field}`, "required_flag_false", errors);
  validateStringArray(value["notes"], `${path}.notes`, errors);
}

function validateTrustCap(value: unknown, path: string, errors: LiveAdapterInterfaceValidationIssue[]): void {
  if (!isObject(value)) { errors.push(issue("invalid_object", path, `${path} must be an object.`)); return; }
  rejectBlockedTopLevel(value, errors);
  if (value["raw_provider_output_trust_tier"] !== "T0") errors.push(issue("raw_provider_trust_not_t0", `${path}.raw_provider_output_trust_tier`, "raw provider output trust tier must be T0."));
  if (value["schema_valid_provider_output_trust_tier"] !== "T1") errors.push(issue("schema_valid_trust_not_t1", `${path}.schema_valid_provider_output_trust_tier`, "schema-valid provider output trust tier must be T1."));
  if (value["max_allowed_output_trust_tier"] !== "T1") errors.push(issue("max_output_trust_above_t1", `${path}.max_allowed_output_trust_tier`, "max allowed output trust tier must be T1."));
  for (const field of ["interface_validation_promotes_trust", "adapter_availability_promotes_trust", "mock_compatibility_promotes_trust", "provider_identity_promotes_trust", "successful_provider_response_promotes_trust", "provider_output_is_deterministic_evidence"]) {
    requireFalse(value[field], `${path}.${field}`, "trust_promotion_not_allowed", errors);
  }
  requireTrue(value["requires_hollow_verification_for_t2"], `${path}.requires_hollow_verification_for_t2`, "hollow_verification_required", errors);
  validateStringArray(value["notes"], `${path}.notes`, errors);
}

function validateHealthStatus(value: unknown, path: string, errors: LiveAdapterInterfaceValidationIssue[]): void {
  if (!isObject(value)) { errors.push(issue("invalid_object", path, `${path} must be an object.`)); return; }
  rejectBlockedTopLevel(value, errors);
  requireStrings(value, ["schema_version", "interface_id", "adapter_id", "checked_at"], errors, path);
  if (!healthStatuses.has(String(value["status"]))) errors.push(issue("invalid_health_status", `${path}.status`, "health status is not supported by R20."));
  requireFalse(value["live_network_available"], `${path}.live_network_available`, "live_network_unavailable_for_r20", errors);
  requireFalse(value["api_key_available"], `${path}.api_key_available`, "api_key_unavailable_for_r20", errors);
  requireFalse(value["provider_sdk_available"], `${path}.provider_sdk_available`, "provider_sdk_unavailable_for_r20", errors);
  if (value["status"] === "available_mock_only") requireTrue(value["mock_invocation_available"], `${path}.mock_invocation_available`, "mock_invocation_required", errors);
  else requireBoolean(value["mock_invocation_available"], `${path}.mock_invocation_available`, errors);
  validateStringArray(value["warnings"], `${path}.warnings`, errors);
  validateStringArray(value["errors"], `${path}.errors`, errors);
}

function validateContextObject(value: unknown, path: string, errors: LiveAdapterInterfaceValidationIssue[]): void {
  if (!isObject(value)) { errors.push(issue("invalid_object", path, `${path} must be an object.`)); return; }
  rejectBlockedTopLevel(value, errors);
  requireStrings(value, ["schema_version", "task_id", "run_id", "request_id", "interface_id", "adapter_id", "safety_profile_id", "redaction_policy_id", "redaction_manifest_id", "created_at"], errors, path);
  if (value["route_mode"] !== "single_pass") errors.push(issue("invalid_route_mode", `${path}.route_mode`, "route_mode must be single_pass for R20."));
  validateRefArray(value["context_refs"], `${path}.context_refs`, errors);
  validateRefArray(value["evidence_refs"], `${path}.evidence_refs`, errors);
  validateStringArray(value["notes"], `${path}.notes`, errors);
}

export function validateLiveAdapterInterfaceCapabilities(input: unknown): LiveAdapterInterfaceValidationResult {
  const errors: LiveAdapterInterfaceValidationIssue[] = [];
  if (!isObject(input)) return { ok: false, errors: [issue("invalid_root", "$", "LiveAdapterInterfaceCapabilities must be an object.")] };
  rejectBlockedTopLevel(input, errors);
  requireStrings(input, ["schema_version", "interface_id", "adapter_id", "adapter_version", "created_at"], errors);
  if (input["interface_kind"] !== "mock_compatible_live_adapter_interface") errors.push(issue("invalid_interface_kind", "$.interface_kind", "interface_kind must be mock_compatible_live_adapter_interface."));
  if (!Array.isArray(input["supported_route_modes"]) || !input["supported_route_modes"].includes("single_pass")) errors.push(issue("single_pass_not_supported", "$.supported_route_modes", "supported_route_modes must include single_pass."));
  validateStringArray(input["supported_provider_kinds"], "$.supported_provider_kinds", errors);
  requireFalse(input["supports_live_network"], "$.supports_live_network", "live_network_not_supported_r20", errors);
  requireTrue(input["supports_mock_invocation"], "$.supports_mock_invocation", "mock_invocation_required", errors);
  requireFalse(input["requires_api_key"], "$.requires_api_key", "api_key_not_required", errors);
  requireFalse(input["imports_provider_sdk"], "$.imports_provider_sdk", "provider_sdk_import_not_allowed", errors);
  requireFalse(input["performs_network_call"], "$.performs_network_call", "network_call_not_allowed", errors);
  requireFalse(input["stores_raw_prompt"], "$.stores_raw_prompt", "raw_prompt_storage_blocked", errors);
  requireFalse(input["stores_raw_output"], "$.stores_raw_output", "raw_output_storage_blocked", errors);
  requireFalse(input["writes_ledger_directly"], "$.writes_ledger_directly", "direct_ledger_write_blocked", errors);
  if (input["max_output_trust_tier"] !== "T1") errors.push(issue("max_output_trust_above_t1", "$.max_output_trust_tier", "max output trust tier must be T1."));
  validateStringArray(input["notes"], "$.notes", errors);
  return { ok: errors.length === 0, errors };
}

export function validateLiveAdapterInvocationContext(input: unknown): LiveAdapterInterfaceValidationResult {
  const errors: LiveAdapterInterfaceValidationIssue[] = [];
  validateContextObject(input, "$", errors);
  return { ok: errors.length === 0, errors };
}

export function validateLiveAdapterInvocationInput(input: unknown): LiveAdapterInterfaceValidationResult {
  const errors: LiveAdapterInterfaceValidationIssue[] = [];
  if (!isObject(input)) return { ok: false, errors: [issue("invalid_root", "$", "LiveAdapterInvocationInput must be an object.")] };
  rejectBlockedTopLevel(input, errors);
  requireStrings(input, ["schema_version", "invocation_id", "redaction_result_ref", "prompt_digest", "created_at"], errors);
  validateContextObject(input["context"], "$.context", errors);
  if (!isObject(input["live_adapter_request"])) errors.push(issue("invalid_object", "$.live_adapter_request", "live_adapter_request must be an object."));
  requireFalse(input["raw_prompt_included"], "$.raw_prompt_included", "raw_prompt_not_included", errors);
  requireFalse(input["api_key_included"], "$.api_key_included", "api_key_not_included", errors);
  requireFalse(input["network_allowed"], "$.network_allowed", "network_not_allowed_r20", errors);
  return { ok: errors.length === 0, errors };
}

export function validateLiveAdapterInvocationOutput(input: unknown): LiveAdapterInterfaceValidationResult {
  const errors: LiveAdapterInterfaceValidationIssue[] = [];
  if (!isObject(input)) return { ok: false, errors: [issue("invalid_root", "$", "LiveAdapterInvocationOutput must be an object.")] };
  rejectBlockedTopLevel(input, errors);
  requireStrings(input, ["schema_version", "invocation_id", "response_id", "adapter_id", "interface_id", "redaction_result_ref", "output_digest", "created_at"], errors);
  if (!isObject(input["live_adapter_response"])) errors.push(issue("invalid_object", "$.live_adapter_response", "live_adapter_response must be an object."));
  requireFalse(input["raw_output_included"], "$.raw_output_included", "raw_output_not_included", errors);
  requireFalse(input["network_used"], "$.network_used", "network_not_used_r20", errors);
  requireFalse(input["provider_sdk_used"], "$.provider_sdk_used", "provider_sdk_not_used", errors);
  return { ok: errors.length === 0, errors };
}

function validateUnavailableResult(value: unknown, path: string, errors: LiveAdapterInterfaceValidationIssue[]): void {
  if (!isObject(value)) { errors.push(issue("invalid_object", path, `${path} must be an object.`)); return; }
  rejectBlockedTopLevel(value, errors);
  requireStrings(value, ["schema_version", "interface_id", "adapter_id", "reason", "created_at"], errors, path);
  if (!unavailableStatuses.has(String(value["status"]))) errors.push(issue("invalid_unavailable_status", `${path}.status`, "status must be unavailable, disabled, or future_live_not_enabled."));
  if (!failureKinds.has(String(value["failure_kind"]))) errors.push(issue("invalid_failure_kind", `${path}.failure_kind`, "failure_kind is not aligned with R18 taxonomy."));
  requireBoolean(value["retryable"], `${path}.retryable`, errors);
  validateTrustCap(value["trust_summary"], `${path}.trust_summary`, errors);
  validateStringArray(value["warnings"], `${path}.warnings`, errors);
  validateStringArray(value["errors"], `${path}.errors`, errors);
}

export function validateLiveAdapterInvocationResult(input: unknown): LiveAdapterInterfaceValidationResult {
  const errors: LiveAdapterInterfaceValidationIssue[] = [];
  if (!isObject(input)) return { ok: false, errors: [issue("invalid_root", "$", "LiveAdapterInvocationResult must be an object.")] };
  rejectBlockedTopLevel(input, errors);
  requireStrings(input, ["schema_version", "result_id", "invocation_id", "interface_id", "adapter_id", "input_ref", "created_at"], errors);
  requireBoolean(input["ok"], "$.ok", errors);
  if (!resultStatuses.has(String(input["status"]))) errors.push(issue("invalid_result_status", "$.status", "status is not supported by R20."));
  if (input["ok"] === true && input["status"] !== "mock_interface_ready") errors.push(issue("ok_status_mismatch", "$.status", "ok may be true only with mock_interface_ready."));
  validateContextObject(input["context"], "$.context", errors);
  validateHealthStatus(input["health_status"], "$.health_status", errors);
  validateRequiredTrueFlags(input["safety_requirements"], "$.safety_requirements", ["redaction_required", "safety_profile_required", "raw_prompt_forbidden", "raw_output_forbidden", "api_key_forbidden_in_payload", "secrets_forbidden_in_payload", "env_values_forbidden_in_payload", "ledger_raw_prompt_forbidden", "ledger_raw_output_forbidden", "network_disabled_for_r20"], errors);
  validateRequiredTrueFlags(input["redaction_requirements"], "$.redaction_requirements", ["redaction_policy_required", "redaction_manifest_required", "redaction_result_required", "redaction_does_not_verify_truth", "redaction_does_not_promote_trust", "refs_digests_summaries_preferred"], errors);
  validateTrustCap(input["trust_cap_requirements"], "$.trust_cap_requirements", errors);
  validateRequiredTrueFlags(input["test_isolation_requirements"], "$.test_isolation_requirements", ["unit_tests_offline", "unit_tests_no_api_keys", "unit_tests_no_provider_sdk", "unit_tests_no_network", "live_tests_opt_in_only", "live_tests_skipped_by_default", "test_fixtures_no_secrets", "test_fixtures_no_raw_prompt", "test_fixtures_no_raw_output"], errors);
  validateRequiredTrueFlags(input["mock_compatibility"], "$.mock_compatibility", ["compatible_with_mock_boundary", "compatible_with_live_adapter_types", "compatible_with_redaction_contract", "uses_provider_neutral_shape", "no_network_required", "no_api_key_required", "no_provider_sdk_required"], errors);
  validateStringArray(input["warnings"], "$.warnings", errors);
  validateStringArray(input["errors"], "$.errors", errors);
  validateStringArray(input["notes"], "$.notes", errors);
  return { ok: errors.length === 0, errors };
}

export function isLiveAdapterInterfaceCapabilities(input: unknown): input is LiveAdapterInterfaceCapabilities { return validateLiveAdapterInterfaceCapabilities(input).ok; }
export function isLiveAdapterInvocationContext(input: unknown): input is LiveAdapterInvocationContext { return validateLiveAdapterInvocationContext(input).ok; }
export function isLiveAdapterInvocationResult(input: unknown): input is LiveAdapterInvocationResult { return validateLiveAdapterInvocationResult(input).ok; }

export function assertLiveAdapterInterfaceCapabilities(input: unknown): LiveAdapterInterfaceCapabilities {
  const validation = validateLiveAdapterInterfaceCapabilities(input);
  if (!validation.ok) throw new Error(`Invalid LiveAdapterInterfaceCapabilities: ${validation.errors.map((error) => `${error.path} ${error.code}`).join("; ")}`);
  return input as LiveAdapterInterfaceCapabilities;
}

export function assertLiveAdapterInvocationContext(input: unknown): LiveAdapterInvocationContext {
  const validation = validateLiveAdapterInvocationContext(input);
  if (!validation.ok) throw new Error(`Invalid LiveAdapterInvocationContext: ${validation.errors.map((error) => `${error.path} ${error.code}`).join("; ")}`);
  return input as LiveAdapterInvocationContext;
}

export function assertLiveAdapterInvocationResult(input: unknown): LiveAdapterInvocationResult {
  const validation = validateLiveAdapterInvocationResult(input);
  if (!validation.ok) throw new Error(`Invalid LiveAdapterInvocationResult: ${validation.errors.map((error) => `${error.path} ${error.code}`).join("; ")}`);
  return input as LiveAdapterInvocationResult;
}

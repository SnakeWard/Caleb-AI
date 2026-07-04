import type {
  OneProviderAdapterConfig,
  OneProviderAdapterOptInGate,
  OneProviderAdapterValidationIssue,
  OneProviderAdapterValidationResult
} from "./types/oneProviderAdapterTypeExtensionTypes.js";

const blockedFields = new Set(["raw_prompt_text", "prompt_text", "raw_output_text", "output_text", "api_key", "api_key_value", "secret", "env", "environment", "credential", "auth_token", "private_key"]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function issue(code: string, path: string, message: string): OneProviderAdapterValidationIssue {
  return { code, path, message, severity: "error" };
}

function rejectBlockedTopLevel(input: Record<string, unknown>, errors: OneProviderAdapterValidationIssue[], prefix = "$"): void {
  for (const field of Object.keys(input)) {
    if (blockedFields.has(field.toLowerCase())) errors.push(issue("blocked_top_level_field", `${prefix}.${field}`, `${field} is blocked from R23 type-extension contracts.`));
  }
}

function requireStrings(input: Record<string, unknown>, fields: readonly string[], errors: OneProviderAdapterValidationIssue[], prefix = "$"): void {
  for (const field of fields) if (!isNonEmptyString(input[field])) errors.push(issue("invalid_required_string", `${prefix}.${field}`, `${field} must be a non-empty string.`));
}

function requireArray(value: unknown, path: string, errors: OneProviderAdapterValidationIssue[]): value is unknown[] {
  if (!Array.isArray(value)) {
    errors.push(issue("invalid_array", path, `${path} must be an array.`));
    return false;
  }
  return true;
}

function requireTrue(value: unknown, path: string, errors: OneProviderAdapterValidationIssue[]): void {
  if (value !== true) errors.push(issue("required_true", path, `${path} must be true.`));
}

function requireFalse(value: unknown, path: string, errors: OneProviderAdapterValidationIssue[]): void {
  if (value !== false) errors.push(issue("required_false", path, `${path} must be false.`));
}

function requireNumber(value: unknown, path: string, min: number, errors: OneProviderAdapterValidationIssue[]): void {
  if (typeof value !== "number" || value < min) errors.push(issue("invalid_number", path, `${path} must be >= ${min}.`));
}

function validateNotes(value: unknown, path: string, errors: OneProviderAdapterValidationIssue[]): void {
  requireArray(value, path, errors);
}

function obj(value: unknown, path: string, errors: OneProviderAdapterValidationIssue[]): Record<string, unknown> | null {
  if (!isObject(value)) {
    errors.push(issue("invalid_object", path, `${path} must be an object.`));
    return null;
  }
  rejectBlockedTopLevel(value, errors, path);
  return value;
}

function validateProviderSelection(value: unknown, path: string, errors: OneProviderAdapterValidationIssue[]): void {
  const input = obj(value, path, errors); if (!input) return;
  requireStrings(input, ["schema_version", "provider_slot_id", "provider_id", "provider_kind", "created_at"], errors, path);
  if (input["provider_slot_id"] !== "first_provider_slot") errors.push(issue("invalid_provider_slot", `${path}.provider_slot_id`, "provider_slot_id must be first_provider_slot."));
  requireFalse(input["provider_selected"], `${path}.provider_selected`, errors);
  requireFalse(input["provider_selection_authorized"], `${path}.provider_selection_authorized`, errors);
  validateNotes(input["provider_selection_notes"], `${path}.provider_selection_notes`, errors);
}

export function validateOneProviderAdapterOptInGate(input: unknown): OneProviderAdapterValidationResult {
  const errors: OneProviderAdapterValidationIssue[] = [];
  const gate = obj(input, "$", errors);
  if (!gate) return { ok: false, errors };
  requireTrue(gate["opt_in_required"], "$.opt_in_required", errors);
  requireStrings(gate, ["opt_in_env_var_name", "missing_opt_in_failure_kind"], errors);
  if (!["live_provider_not_enabled", "adapter_unavailable"].includes(String(gate["missing_opt_in_failure_kind"]))) errors.push(issue("invalid_missing_opt_in_failure_kind", "$.missing_opt_in_failure_kind", "missing opt-in must map to live_provider_not_enabled or adapter_unavailable."));
  requireTrue(gate["provider_allowlist_required"], "$.provider_allowlist_required", errors);
  requireTrue(gate["adapter_id_required"], "$.adapter_id_required", errors);
  requireTrue(gate["explicit_command_flag_required"], "$.explicit_command_flag_required", errors);
  requireTrue(gate["human_approval_required"], "$.human_approval_required", errors);
  requireFalse(gate["default_runtime_enabled"], "$.default_runtime_enabled", errors);
  requireFalse(gate["fake_success_allowed"], "$.fake_success_allowed", errors);
  validateNotes(gate["notes"], "$.notes", errors);
  return { ok: errors.length === 0, errors };
}

function validateAllowlist(value: unknown, path: string, errors: OneProviderAdapterValidationIssue[]): void {
  const input = obj(value, path, errors); if (!input) return;
  requireTrue(input["allowlist_required"], `${path}.allowlist_required`, errors);
  requireArray(input["allowed_provider_ids"], `${path}.allowed_provider_ids`, errors);
  requireArray(input["allowed_provider_kinds"], `${path}.allowed_provider_kinds`, errors);
  if (input["provider_not_allowlisted_failure_kind"] !== "provider_not_allowlisted") errors.push(issue("invalid_allowlist_failure", `${path}.provider_not_allowlisted_failure_kind`, "must be provider_not_allowlisted."));
  requireFalse(input["allowlist_values_are_secrets"], `${path}.allowlist_values_are_secrets`, errors);
  validateNotes(input["notes"], `${path}.notes`, errors);
}

function validateApiKey(value: unknown, path: string, errors: OneProviderAdapterValidationIssue[]): void {
  const input = obj(value, path, errors); if (!input) return;
  requireTrue(input["api_key_required_for_live"], `${path}.api_key_required_for_live`, errors);
  requireStrings(input, ["api_key_env_var_name", "missing_api_key_failure_kind"], errors, path);
  for (const field of ["api_key_value_present", "api_key_value_stored", "api_key_value_logged", "api_key_value_written_to_ledger", "api_key_value_written_to_storage", "api_key_value_allowed_in_fixtures", "api_key_presence_promotes_trust"]) requireFalse(input[field], `${path}.${field}`, errors);
  if (!["missing_api_key", "adapter_unavailable"].includes(String(input["missing_api_key_failure_kind"]))) errors.push(issue("invalid_missing_api_key_failure", `${path}.missing_api_key_failure_kind`, "must be missing_api_key or adapter_unavailable."));
  validateNotes(input["notes"], `${path}.notes`, errors);
}

function validateNetwork(value: unknown, path: string, errors: OneProviderAdapterValidationIssue[]): void {
  const input = obj(value, path, errors); if (!input) return;
  requireFalse(input["network_calls_allowed_by_default"], `${path}.network_calls_allowed_by_default`, errors);
  for (const field of ["network_calls_require_opt_in", "default_unit_tests_offline", "default_acceptance_tests_offline", "live_tests_opt_in_only", "live_tests_skipped_by_default", "network_failure_normalized", "timeout_required", "retries_bounded", "costs_bounded"]) requireTrue(input[field], `${path}.${field}`, errors);
  requireFalse(input["network_success_promotes_trust"], `${path}.network_success_promotes_trust`, errors);
  validateNotes(input["notes"], `${path}.notes`, errors);
}

function validateTimeoutRetry(value: unknown, path: string, errors: OneProviderAdapterValidationIssue[]): void {
  const input = obj(value, path, errors); if (!input) return;
  requireNumber(input["timeout_ms"], `${path}.timeout_ms`, 1, errors);
  requireNumber(input["retry_count"], `${path}.retry_count`, 0, errors);
  requireStrings(input, ["retry_backoff_strategy"], errors, path);
  requireFalse(input["unbounded_retries_allowed"], `${path}.unbounded_retries_allowed`, errors);
  requireFalse(input["silent_retry_allowed"], `${path}.silent_retry_allowed`, errors);
  requireTrue(input["retry_count_recorded"], `${path}.retry_count_recorded`, errors);
  if (input["provider_timeout_failure_kind"] !== "provider_timeout") errors.push(issue("invalid_timeout_failure", `${path}.provider_timeout_failure_kind`, "must be provider_timeout."));
  validateNotes(input["notes"], `${path}.notes`, errors);
}

function validateCost(value: unknown, path: string, errors: OneProviderAdapterValidationIssue[]): void {
  const input = obj(value, path, errors); if (!input) return;
  requireTrue(input["cost_guard_required"], `${path}.cost_guard_required`, errors);
  requireNumber(input["max_live_requests_per_test"], `${path}.max_live_requests_per_test`, 1, errors);
  requireNumber(input["max_output_tokens"], `${path}.max_output_tokens`, 1, errors);
  requireNumber(input["max_retry_count"], `${path}.max_retry_count`, 0, errors);
  requireFalse(input["background_live_calls_allowed"], `${path}.background_live_calls_allowed`, errors);
  if (input["cost_limit_exceeded_failure_kind"] !== "cost_limit_exceeded") errors.push(issue("invalid_cost_failure", `${path}.cost_limit_exceeded_failure_kind`, "must be cost_limit_exceeded."));
  validateNotes(input["cost_notes"], `${path}.cost_notes`, errors);
}

function validateLiveTests(value: unknown, path: string, errors: OneProviderAdapterValidationIssue[]): void {
  const input = obj(value, path, errors); if (!input) return;
  requireFalse(input["live_tests_allowed_in_default_run"], `${path}.live_tests_allowed_in_default_run`, errors);
  for (const field of ["live_tests_require_opt_in_flag", "live_tests_require_api_key", "live_tests_require_provider_allowlist", "live_tests_skipped_by_default"]) requireTrue(input[field], `${path}.${field}`, errors);
  requireStrings(input, ["live_tests_label"], errors, path);
  requireFalse(input["live_tests_can_run_in_ci_by_default"], `${path}.live_tests_can_run_in_ci_by_default`, errors);
  for (const field of ["test_fixtures_may_contain_secrets", "test_fixtures_may_contain_raw_prompt", "test_fixtures_may_contain_raw_output"]) requireFalse(input[field], `${path}.${field}`, errors);
  validateNotes(input["notes"], `${path}.notes`, errors);
}

function validateRequestMapping(value: unknown, path: string, errors: OneProviderAdapterValidationIssue[]): void {
  const input = obj(value, path, errors); if (!input) return;
  for (const field of ["maps_from_live_adapter_request", "prompt_digest_required", "redaction_result_required", "safety_profile_required", "evidence_refs_supported", "context_refs_supported"]) requireTrue(input[field], `${path}.${field}`, errors);
  for (const field of ["provider_specific_request_shape_defined", "raw_prompt_forwarding_allowed", "secrets_in_payload_allowed"]) requireFalse(input[field], `${path}.${field}`, errors);
  validateNotes(input["notes"], `${path}.notes`, errors);
}

function validateResponseMapping(value: unknown, path: string, errors: OneProviderAdapterValidationIssue[]): void {
  const input = obj(value, path, errors); if (!input) return;
  for (const field of ["maps_to_live_adapter_response", "output_digest_required", "output_ref_required", "token_usage_recorded_if_available", "latency_recorded_if_available", "finish_reason_recorded_if_available"]) requireTrue(input[field], `${path}.${field}`, errors);
  for (const field of ["provider_specific_response_shape_defined", "raw_output_storage_allowed", "successful_response_promotes_trust"]) requireFalse(input[field], `${path}.${field}`, errors);
  validateNotes(input["notes"], `${path}.notes`, errors);
}

function validateFailureMapping(value: unknown, path: string, errors: OneProviderAdapterValidationIssue[]): void {
  const input = obj(value, path, errors); if (!input) return;
  requireArray(input["failure_kinds_supported"], `${path}.failure_kinds_supported`, errors);
  requireStrings(input, ["missing_opt_in_maps_to", "provider_not_allowlisted_maps_to", "missing_api_key_maps_to", "network_disabled_maps_to", "provider_timeout_maps_to", "provider_rate_limited_maps_to", "provider_auth_failed_maps_to", "provider_rejected_request_maps_to", "provider_malformed_response_maps_to", "response_validation_failed_maps_to", "cost_limit_exceeded_maps_to", "unknown_provider_error_maps_to"], errors, path);
  requireFalse(input["failures_claim_verified_truth"], `${path}.failures_claim_verified_truth`, errors);
  requireFalse(input["failures_promote_trust"], `${path}.failures_promote_trust`, errors);
  validateNotes(input["notes"], `${path}.notes`, errors);
}

function validateRedaction(value: unknown, path: string, errors: OneProviderAdapterValidationIssue[]): void {
  const input = obj(value, path, errors); if (!input) return;
  for (const field of ["redaction_policy_required", "redaction_manifest_required", "redaction_result_required"]) requireTrue(input[field], `${path}.${field}`, errors);
  for (const field of ["raw_prompt_allowed", "raw_output_allowed", "raw_transcript_storage_allowed", "redaction_promotes_trust", "redaction_metadata_promotes_trust"]) requireFalse(input[field], `${path}.${field}`, errors);
  validateNotes(input["notes"], `${path}.notes`, errors);
}

function validateLedger(value: unknown, path: string, errors: OneProviderAdapterValidationIssue[]): void {
  const input = obj(value, path, errors); if (!input) return;
  requireTrue(input["ledger_provenance_required"], `${path}.ledger_provenance_required`, errors);
  requireTrue(input["refs_digests_statuses_allowed"], `${path}.refs_digests_statuses_allowed`, errors);
  for (const field of ["raw_prompt_written_to_ledger", "raw_output_written_to_ledger", "api_key_written_to_ledger", "secrets_written_to_ledger", "env_values_written_to_ledger", "ledger_write_promotes_trust", "ledger_presence_promotes_trust"]) requireFalse(input[field], `${path}.${field}`, errors);
  validateNotes(input["notes"], `${path}.notes`, errors);
}

function validateStorage(value: unknown, path: string, errors: OneProviderAdapterValidationIssue[]): void {
  const input = obj(value, path, errors); if (!input) return;
  requireTrue(input["runtime_storage_contract_required"], `${path}.runtime_storage_contract_required`, errors);
  requireFalse(input["persistent_transcript_storage_allowed"], `${path}.persistent_transcript_storage_allowed`, errors);
  if (input["raw_provider_output_storage_tier"] !== "T0") errors.push(issue("invalid_raw_storage_tier", `${path}.raw_provider_output_storage_tier`, "must be T0."));
  if (input["schema_valid_provider_output_storage_tier"] !== "T1") errors.push(issue("invalid_schema_storage_tier", `${path}.schema_valid_provider_output_storage_tier`, "must be T1."));
  for (const field of ["storage_promotes_trust", "retrieval_promotes_trust", "persistence_is_verification"]) requireFalse(input[field], `${path}.${field}`, errors);
  validateNotes(input["notes"], `${path}.notes`, errors);
}

function validateTrust(value: unknown, path: string, errors: OneProviderAdapterValidationIssue[]): void {
  const input = obj(value, path, errors); if (!input) return;
  if (input["raw_provider_output_trust_tier"] !== "T0") errors.push(issue("invalid_raw_trust_tier", `${path}.raw_provider_output_trust_tier`, "must be T0."));
  if (input["schema_valid_provider_output_trust_tier"] !== "T1") errors.push(issue("invalid_schema_trust_tier", `${path}.schema_valid_provider_output_trust_tier`, "must be T1."));
  if (input["max_provider_output_trust_tier"] !== "T1") errors.push(issue("max_trust_above_t1", `${path}.max_provider_output_trust_tier`, "must be T1."));
  for (const field of ["provider_slot_selection_promotes_trust", "explicit_opt_in_promotes_trust", "api_key_presence_promotes_trust", "network_success_promotes_trust", "provider_identity_promotes_trust", "successful_provider_response_promotes_trust", "provider_output_is_deterministic_evidence", "verified_final_truth_claimed"]) requireFalse(input[field], `${path}.${field}`, errors);
  requireTrue(input["requires_hollow_verification_for_t2"], `${path}.requires_hollow_verification_for_t2`, errors);
  validateNotes(input["notes"], `${path}.notes`, errors);
}

function validateRollback(value: unknown, path: string, errors: OneProviderAdapterValidationIssue[]): void {
  const input = obj(value, path, errors); if (!input) return;
  requireStrings(input, ["kill_switch_env_var_name"], errors, path);
  for (const field of ["kill_switch_required", "provider_allowlist_required", "safe_refusal_when_disabled", "safe_refusal_when_not_allowlisted", "safe_refusal_when_api_key_missing", "safe_refusal_when_redaction_missing", "safe_refusal_when_safety_profile_missing", "rollback_instructions_required"]) requireTrue(input[field], `${path}.${field}`, errors);
  requireArray(input["stop_conditions"], `${path}.stop_conditions`, errors);
  validateNotes(input["notes"], `${path}.notes`, errors);
}

export function validateOneProviderAdapterMapping(input: unknown): OneProviderAdapterValidationResult {
  const errors: OneProviderAdapterValidationIssue[] = [];
  const mapping = obj(input, "$", errors);
  if (!mapping) return { ok: false, errors };
  validateRequestMapping(mapping["request_mapping"], "$.request_mapping", errors);
  validateResponseMapping(mapping["response_mapping"], "$.response_mapping", errors);
  validateFailureMapping(mapping["failure_mapping"], "$.failure_mapping", errors);
  validateRedaction(mapping["redaction_compatibility"], "$.redaction_compatibility", errors);
  validateLedger(mapping["ledger_compatibility"], "$.ledger_compatibility", errors);
  validateStorage(mapping["storage_compatibility"], "$.storage_compatibility", errors);
  validateTrust(mapping["trust_cap"], "$.trust_cap", errors);
  return { ok: errors.length === 0, errors };
}

export function validateOneProviderAdapterConfig(input: unknown): OneProviderAdapterValidationResult {
  const errors: OneProviderAdapterValidationIssue[] = [];
  const config = obj(input, "$", errors);
  if (!config) return { ok: false, errors };
  requireStrings(config, ["schema_version", "config_id", "provider_slot_id", "adapter_id", "adapter_version", "created_at"], errors);
  if (config["provider_slot_id"] !== "first_provider_slot") errors.push(issue("invalid_provider_slot", "$.provider_slot_id", "provider_slot_id must be first_provider_slot."));
  validateProviderSelection(config["provider_selection"], "$.provider_selection", errors);
  validateOneProviderAdapterOptInGate(config["opt_in_gate"]).errors.forEach((error) => errors.push({ ...error, path: `$.opt_in_gate${error.path.slice(1)}` }));
  validateAllowlist(config["allowlist"], "$.allowlist", errors);
  validateApiKey(config["api_key_ref"], "$.api_key_ref", errors);
  validateNetwork(config["network_policy"], "$.network_policy", errors);
  validateTimeoutRetry(config["timeout_retry_policy"], "$.timeout_retry_policy", errors);
  validateCost(config["cost_guard"], "$.cost_guard", errors);
  validateLiveTests(config["live_test_gate"], "$.live_test_gate", errors);
  validateRedaction(config["redaction_compatibility"], "$.redaction_compatibility", errors);
  validateLedger(config["ledger_compatibility"], "$.ledger_compatibility", errors);
  validateStorage(config["storage_compatibility"], "$.storage_compatibility", errors);
  validateTrust(config["trust_cap"], "$.trust_cap", errors);
  validateRollback(config["rollback_plan"], "$.rollback_plan", errors);
  validateNotes(config["notes"], "$.notes", errors);
  return { ok: errors.length === 0, errors };
}

export function isOneProviderAdapterConfig(input: unknown): input is OneProviderAdapterConfig { return validateOneProviderAdapterConfig(input).ok; }
export function isOneProviderAdapterOptInGate(input: unknown): input is OneProviderAdapterOptInGate { return validateOneProviderAdapterOptInGate(input).ok; }

export function assertOneProviderAdapterConfig(input: unknown): OneProviderAdapterConfig {
  const validation = validateOneProviderAdapterConfig(input);
  if (!validation.ok) throw new Error(`Invalid OneProviderAdapterConfig: ${validation.errors.map((error) => `${error.path} ${error.code}`).join("; ")}`);
  return input as OneProviderAdapterConfig;
}

export function assertOneProviderAdapterOptInGate(input: unknown): OneProviderAdapterOptInGate {
  const validation = validateOneProviderAdapterOptInGate(input);
  if (!validation.ok) throw new Error(`Invalid OneProviderAdapterOptInGate: ${validation.errors.map((error) => `${error.path} ${error.code}`).join("; ")}`);
  return input as OneProviderAdapterOptInGate;
}

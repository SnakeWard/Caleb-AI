import type {
  OneProviderAdapterConfigDocument,
  OneProviderAdapterConfigRefusal,
  OneProviderAdapterConfigValidationIssue,
  OneProviderAdapterConfigValidationResult
} from "./types/oneProviderAdapterConfigContractTypes.js";

const configStatuses = new Set(["config_valid_disabled", "config_valid_opt_in_required", "config_rejected", "config_invalid", "future_live_not_enabled"]);
const sourceKinds = new Set(["static_fixture", "checked_in_example", "future_external_config", "future_runtime_supplied"]);
const refusalKinds = new Set(["live_provider_not_enabled", "provider_not_allowlisted", "missing_api_key", "redaction_required", "safety_profile_required", "config_invalid", "future_live_not_enabled"]);
const blockedTopLevelFields = new Set(["raw_prompt_text", "prompt_text", "raw_output_text", "output_text", "api_key", "api_key_value", "secret", "env", "env_value", "environment", "environment_value", "credential", "auth_token", "private_key"]);

type Issues = OneProviderAdapterConfigValidationIssue[];
type Shape = Record<string, unknown>;

function isObject(value: unknown): value is Shape {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function add(errors: Issues, code: string, path: string, message: string): void {
  errors.push({ code, path, message, severity: "error" });
}

function objectAt(value: unknown, path: string, errors: Issues): Shape | null {
  if (!isObject(value)) {
    add(errors, "invalid_object", path, `${path} must be an object.`);
    return null;
  }
  return value;
}

function rejectBlockedTopLevel(input: Shape, errors: Issues, path = "$"): void {
  for (const field of Object.keys(input)) {
    if (blockedTopLevelFields.has(field.toLowerCase())) {
      add(errors, "blocked_top_level_field", `${path}.${field}`, `${field} is blocked from R24 config contracts.`);
    }
  }
}

function requireFields(input: Shape, fields: readonly string[], path: string, errors: Issues): void {
  for (const field of fields) {
    if (!(field in input)) add(errors, "missing_required_field", `${path}.${field}`, `${field} is required.`);
  }
}

function requireStrings(input: Shape, fields: readonly string[], path: string, errors: Issues): void {
  requireFields(input, fields, path, errors);
  for (const field of fields) {
    if (field in input && !isNonEmptyString(input[field])) add(errors, "invalid_required_string", `${path}.${field}`, `${field} must be a non-empty string.`);
  }
}

function requireArray(value: unknown, path: string, errors: Issues): void {
  if (!Array.isArray(value)) add(errors, "invalid_array", path, `${path} must be an array.`);
}

function requireTrue(value: unknown, path: string, errors: Issues): void {
  if (value !== true) add(errors, "required_true", path, `${path} must be true.`);
}

function requireFalse(value: unknown, path: string, errors: Issues): void {
  if (value !== false) add(errors, "required_false", path, `${path} must be false.`);
}

function requirePositiveNumber(value: unknown, path: string, errors: Issues): void {
  if (typeof value !== "number" || value <= 0) add(errors, "invalid_positive_number", path, `${path} must be a positive number.`);
}

function requireNonNegativeNumber(value: unknown, path: string, errors: Issues): void {
  if (typeof value !== "number" || value < 0) add(errors, "invalid_non_negative_number", path, `${path} must be zero or greater.`);
}

function requireAllowed(value: unknown, allowed: ReadonlySet<string>, path: string, errors: Issues): void {
  if (typeof value !== "string" || !allowed.has(value)) add(errors, "invalid_enum", path, `${path} has an unsupported value.`);
}

function notes(input: Shape, path: string, errors: Issues): void {
  requireArray(input["notes"], `${path}.notes`, errors);
}

function validateProviderSlot(value: unknown, path: string, errors: Issues): void {
  const input = objectAt(value, path, errors); if (!input) return;
  requireFields(input, ["provider_slot_id", "provider_id", "provider_kind", "provider_selected", "provider_selection_authorized", "real_provider_selected", "provider_specific_behavior_enabled", "provider_slot_selection_promotes_trust", "notes"], path, errors);
  requireStrings(input, ["provider_id", "provider_kind"], path, errors);
  if (input["provider_slot_id"] !== "first_provider_slot") add(errors, "invalid_provider_slot", `${path}.provider_slot_id`, "provider_slot_id must be first_provider_slot.");
  if (!["first_provider_placeholder", "provider_slot_1"].includes(String(input["provider_id"]))) add(errors, "invalid_provider_id", `${path}.provider_id`, "provider_id must be a placeholder provider slot.");
  requireFalse(input["provider_selected"], `${path}.provider_selected`, errors);
  requireFalse(input["provider_selection_authorized"], `${path}.provider_selection_authorized`, errors);
  requireFalse(input["real_provider_selected"], `${path}.real_provider_selected`, errors);
  requireFalse(input["provider_specific_behavior_enabled"], `${path}.provider_specific_behavior_enabled`, errors);
  requireFalse(input["provider_slot_selection_promotes_trust"], `${path}.provider_slot_selection_promotes_trust`, errors);
  notes(input, path, errors);
}

function validateOptIn(value: unknown, path: string, errors: Issues): void {
  const input = objectAt(value, path, errors); if (!input) return;
  requireFields(input, ["explicit_opt_in_required", "opt_in_env_var_name", "opt_in_value_required", "opt_in_value_present", "opt_in_enabled_by_default", "explicit_command_flag_required", "explicit_command_flag_name", "explicit_command_flag_present", "human_approval_required", "human_approval_recorded", "opt_in_promotes_trust", "missing_opt_in_failure_kind", "fake_success_allowed", "notes"], path, errors);
  requireTrue(input["explicit_opt_in_required"], `${path}.explicit_opt_in_required`, errors);
  requireStrings(input, ["opt_in_env_var_name", "explicit_command_flag_name"], path, errors);
  if (input["opt_in_value_required"] !== true && !isNonEmptyString(input["opt_in_value_required"])) add(errors, "invalid_opt_in_value_required", `${path}.opt_in_value_required`, "opt_in_value_required must be true or a documented expected literal.");
  requireFalse(input["opt_in_value_present"], `${path}.opt_in_value_present`, errors);
  requireFalse(input["opt_in_enabled_by_default"], `${path}.opt_in_enabled_by_default`, errors);
  requireTrue(input["explicit_command_flag_required"], `${path}.explicit_command_flag_required`, errors);
  requireFalse(input["explicit_command_flag_present"], `${path}.explicit_command_flag_present`, errors);
  requireTrue(input["human_approval_required"], `${path}.human_approval_required`, errors);
  requireFalse(input["human_approval_recorded"], `${path}.human_approval_recorded`, errors);
  requireFalse(input["opt_in_promotes_trust"], `${path}.opt_in_promotes_trust`, errors);
  if (!["live_provider_not_enabled", "adapter_unavailable"].includes(String(input["missing_opt_in_failure_kind"]))) add(errors, "invalid_missing_opt_in_failure", `${path}.missing_opt_in_failure_kind`, "missing opt-in must normalize to a refusal.");
  requireFalse(input["fake_success_allowed"], `${path}.fake_success_allowed`, errors);
  notes(input, path, errors);
}

function validateAllowlist(value: unknown, path: string, errors: Issues): void {
  const input = objectAt(value, path, errors); if (!input) return;
  requireFields(input, ["provider_allowlist_required", "provider_allowlist_present", "allowed_provider_ids", "allowed_provider_kinds", "provider_not_allowlisted_failure_kind", "allowlist_values_are_secret", "allowlist_promotes_trust", "notes"], path, errors);
  requireTrue(input["provider_allowlist_required"], `${path}.provider_allowlist_required`, errors);
  requireArray(input["allowed_provider_ids"], `${path}.allowed_provider_ids`, errors);
  requireArray(input["allowed_provider_kinds"], `${path}.allowed_provider_kinds`, errors);
  if (input["provider_not_allowlisted_failure_kind"] !== "provider_not_allowlisted") add(errors, "invalid_allowlist_failure", `${path}.provider_not_allowlisted_failure_kind`, "must be provider_not_allowlisted.");
  requireFalse(input["allowlist_values_are_secret"], `${path}.allowlist_values_are_secret`, errors);
  requireFalse(input["allowlist_promotes_trust"], `${path}.allowlist_promotes_trust`, errors);
  notes(input, path, errors);
}

function validateApiKeyRef(value: unknown, path: string, errors: Issues): void {
  const input = objectAt(value, path, errors); if (!input) return;
  requireFields(input, ["api_key_required_for_live", "api_key_env_var_name", "api_key_env_var_name_is_secret", "api_key_value_present", "api_key_value_read", "api_key_value_stored", "api_key_value_logged", "api_key_value_written_to_ledger", "api_key_value_written_to_storage", "api_key_value_allowed_in_fixtures", "api_key_presence_promotes_trust", "missing_api_key_failure_kind", "notes"], path, errors);
  requireStrings(input, ["api_key_env_var_name"], path, errors);
  for (const field of ["api_key_env_var_name_is_secret", "api_key_value_present", "api_key_value_read", "api_key_value_stored", "api_key_value_logged", "api_key_value_written_to_ledger", "api_key_value_written_to_storage", "api_key_value_allowed_in_fixtures", "api_key_presence_promotes_trust"]) requireFalse(input[field], `${path}.${field}`, errors);
  if (!["missing_api_key", "adapter_unavailable"].includes(String(input["missing_api_key_failure_kind"]))) add(errors, "invalid_missing_api_key_failure", `${path}.missing_api_key_failure_kind`, "must be missing_api_key or adapter_unavailable.");
  notes(input, path, errors);
}

function validateNetwork(value: unknown, path: string, errors: Issues): void {
  const input = objectAt(value, path, errors); if (!input) return;
  requireFields(input, ["network_calls_allowed_by_default", "network_calls_require_opt_in", "network_available_in_r24", "network_call_performed_in_r24", "default_unit_tests_offline", "default_acceptance_tests_offline", "live_tests_opt_in_only", "live_tests_skipped_by_default", "network_success_promotes_trust", "network_failure_normalized", "notes"], path, errors);
  for (const field of ["network_calls_allowed_by_default", "network_available_in_r24", "network_call_performed_in_r24", "network_success_promotes_trust"]) requireFalse(input[field], `${path}.${field}`, errors);
  for (const field of ["network_calls_require_opt_in", "default_unit_tests_offline", "default_acceptance_tests_offline", "live_tests_opt_in_only", "live_tests_skipped_by_default", "network_failure_normalized"]) requireTrue(input[field], `${path}.${field}`, errors);
  notes(input, path, errors);
}

function validateTimeoutRetry(value: unknown, path: string, errors: Issues): void {
  const input = objectAt(value, path, errors); if (!input) return;
  requireFields(input, ["timeout_required", "timeout_ms", "retry_count", "max_retry_count", "retry_count_recorded", "unbounded_retries_allowed", "silent_retry_allowed", "timeout_failure_kind", "notes"], path, errors);
  requireTrue(input["timeout_required"], `${path}.timeout_required`, errors);
  requirePositiveNumber(input["timeout_ms"], `${path}.timeout_ms`, errors);
  requireNonNegativeNumber(input["retry_count"], `${path}.retry_count`, errors);
  requireNonNegativeNumber(input["max_retry_count"], `${path}.max_retry_count`, errors);
  if (typeof input["retry_count"] === "number" && typeof input["max_retry_count"] === "number" && input["retry_count"] > input["max_retry_count"]) add(errors, "retry_count_exceeds_max", `${path}.retry_count`, "retry_count must be <= max_retry_count.");
  requireTrue(input["retry_count_recorded"], `${path}.retry_count_recorded`, errors);
  requireFalse(input["unbounded_retries_allowed"], `${path}.unbounded_retries_allowed`, errors);
  requireFalse(input["silent_retry_allowed"], `${path}.silent_retry_allowed`, errors);
  if (input["timeout_failure_kind"] !== "provider_timeout") add(errors, "invalid_timeout_failure", `${path}.timeout_failure_kind`, "must be provider_timeout.");
  notes(input, path, errors);
}

function validateCostGuard(value: unknown, path: string, errors: Issues): void {
  const input = objectAt(value, path, errors); if (!input) return;
  requireFields(input, ["cost_guard_required", "max_live_requests_per_test", "max_output_tokens", "max_cost_units_per_run", "cost_warning_required", "cost_stop_condition_required", "background_live_calls_allowed", "cost_limit_exceeded_failure_kind", "notes"], path, errors);
  requireTrue(input["cost_guard_required"], `${path}.cost_guard_required`, errors);
  for (const field of ["max_live_requests_per_test", "max_output_tokens", "max_cost_units_per_run"]) requirePositiveNumber(input[field], `${path}.${field}`, errors);
  requireTrue(input["cost_warning_required"], `${path}.cost_warning_required`, errors);
  requireTrue(input["cost_stop_condition_required"], `${path}.cost_stop_condition_required`, errors);
  requireFalse(input["background_live_calls_allowed"], `${path}.background_live_calls_allowed`, errors);
  if (input["cost_limit_exceeded_failure_kind"] !== "cost_limit_exceeded") add(errors, "invalid_cost_failure", `${path}.cost_limit_exceeded_failure_kind`, "must be cost_limit_exceeded.");
  notes(input, path, errors);
}

function validateLiveTests(value: unknown, path: string, errors: Issues): void {
  const input = objectAt(value, path, errors); if (!input) return;
  requireFields(input, ["live_tests_created_in_r24", "live_tests_allowed_in_default_run", "live_tests_require_opt_in_flag", "live_tests_require_api_key", "live_tests_require_provider_allowlist", "live_tests_skipped_by_default", "live_tests_can_run_in_ci_by_default", "test_fixtures_may_contain_secrets", "test_fixtures_may_contain_api_keys", "test_fixtures_may_contain_raw_prompt", "test_fixtures_may_contain_raw_output", "notes"], path, errors);
  for (const field of ["live_tests_created_in_r24", "live_tests_allowed_in_default_run", "live_tests_can_run_in_ci_by_default", "test_fixtures_may_contain_secrets", "test_fixtures_may_contain_api_keys", "test_fixtures_may_contain_raw_prompt", "test_fixtures_may_contain_raw_output"]) requireFalse(input[field], `${path}.${field}`, errors);
  for (const field of ["live_tests_require_opt_in_flag", "live_tests_require_provider_allowlist", "live_tests_skipped_by_default"]) requireTrue(input[field], `${path}.${field}`, errors);
  notes(input, path, errors);
}

function validateRedaction(value: unknown, path: string, errors: Issues): void {
  const input = objectAt(value, path, errors); if (!input) return;
  requireFields(input, ["redaction_policy_required", "redaction_manifest_required", "redaction_result_required", "raw_prompt_allowed", "raw_output_allowed", "raw_transcript_storage_allowed", "redaction_promotes_trust", "redaction_metadata_promotes_trust", "notes"], path, errors);
  for (const field of ["redaction_policy_required", "redaction_manifest_required", "redaction_result_required"]) requireTrue(input[field], `${path}.${field}`, errors);
  for (const field of ["raw_prompt_allowed", "raw_output_allowed", "raw_transcript_storage_allowed", "redaction_promotes_trust", "redaction_metadata_promotes_trust"]) requireFalse(input[field], `${path}.${field}`, errors);
  notes(input, path, errors);
}

function validateSafetyProfile(value: unknown, path: string, errors: Issues): void {
  const input = objectAt(value, path, errors); if (!input) return;
  requireFields(input, ["safety_profile_required", "safety_profile_id", "safety_profile_present", "missing_safety_profile_failure_kind", "safety_profile_promotes_trust", "notes"], path, errors);
  requireTrue(input["safety_profile_required"], `${path}.safety_profile_required`, errors);
  requireStrings(input, ["safety_profile_id"], path, errors);
  if (input["missing_safety_profile_failure_kind"] !== "safety_profile_required") add(errors, "invalid_safety_failure", `${path}.missing_safety_profile_failure_kind`, "must be safety_profile_required.");
  requireFalse(input["safety_profile_promotes_trust"], `${path}.safety_profile_promotes_trust`, errors);
  notes(input, path, errors);
}

function validateLedger(value: unknown, path: string, errors: Issues): void {
  const input = objectAt(value, path, errors); if (!input) return;
  requireFields(input, ["ledger_provenance_required", "ledger_write_allowed_in_config_contract", "raw_prompt_written_to_ledger", "raw_output_written_to_ledger", "api_key_written_to_ledger", "secrets_written_to_ledger", "env_values_written_to_ledger", "refs_digests_statuses_allowed", "ledger_write_promotes_trust", "ledger_presence_promotes_trust", "notes"], path, errors);
  requireTrue(input["ledger_provenance_required"], `${path}.ledger_provenance_required`, errors);
  requireTrue(input["refs_digests_statuses_allowed"], `${path}.refs_digests_statuses_allowed`, errors);
  for (const field of ["ledger_write_allowed_in_config_contract", "raw_prompt_written_to_ledger", "raw_output_written_to_ledger", "api_key_written_to_ledger", "secrets_written_to_ledger", "env_values_written_to_ledger", "ledger_write_promotes_trust", "ledger_presence_promotes_trust"]) requireFalse(input[field], `${path}.${field}`, errors);
  notes(input, path, errors);
}

function validateRuntimeStorage(value: unknown, path: string, errors: Issues): void {
  const input = objectAt(value, path, errors); if (!input) return;
  requireFields(input, ["runtime_storage_contract_required", "storage_write_allowed_in_config_contract", "persistent_transcript_storage_allowed", "raw_provider_output_storage_tier", "schema_valid_provider_output_storage_tier", "storage_promotes_trust", "retrieval_promotes_trust", "persistence_is_verification", "notes"], path, errors);
  requireTrue(input["runtime_storage_contract_required"], `${path}.runtime_storage_contract_required`, errors);
  requireFalse(input["storage_write_allowed_in_config_contract"], `${path}.storage_write_allowed_in_config_contract`, errors);
  requireFalse(input["persistent_transcript_storage_allowed"], `${path}.persistent_transcript_storage_allowed`, errors);
  if (input["raw_provider_output_storage_tier"] !== "T0") add(errors, "invalid_raw_storage_tier", `${path}.raw_provider_output_storage_tier`, "must be T0.");
  if (input["schema_valid_provider_output_storage_tier"] !== "T1") add(errors, "invalid_schema_storage_tier", `${path}.schema_valid_provider_output_storage_tier`, "must be T1.");
  for (const field of ["storage_promotes_trust", "retrieval_promotes_trust", "persistence_is_verification"]) requireFalse(input[field], `${path}.${field}`, errors);
  notes(input, path, errors);
}

function validateTrustCap(value: unknown, path: string, errors: Issues): void {
  const input = objectAt(value, path, errors); if (!input) return;
  requireFields(input, ["raw_provider_output_trust_tier", "schema_valid_provider_output_trust_tier", "max_provider_output_trust_tier", "config_validity_promotes_trust", "config_presence_promotes_opt_in", "provider_slot_selection_promotes_trust", "explicit_opt_in_promotes_trust", "api_key_env_var_name_promotes_trust", "api_key_presence_promotes_trust", "network_success_promotes_trust", "provider_identity_promotes_trust", "successful_provider_response_promotes_trust", "provider_output_is_deterministic_evidence", "verified_final_truth_claimed", "requires_hollow_verification_for_t2", "notes"], path, errors);
  if (input["raw_provider_output_trust_tier"] !== "T0") add(errors, "invalid_raw_trust_tier", `${path}.raw_provider_output_trust_tier`, "must be T0.");
  if (input["schema_valid_provider_output_trust_tier"] !== "T1") add(errors, "invalid_schema_trust_tier", `${path}.schema_valid_provider_output_trust_tier`, "must be T1.");
  if (input["max_provider_output_trust_tier"] !== "T1") add(errors, "invalid_max_trust_tier", `${path}.max_provider_output_trust_tier`, "must be T1.");
  for (const field of ["config_validity_promotes_trust", "config_presence_promotes_opt_in", "provider_slot_selection_promotes_trust", "explicit_opt_in_promotes_trust", "api_key_env_var_name_promotes_trust", "api_key_presence_promotes_trust", "network_success_promotes_trust", "provider_identity_promotes_trust", "successful_provider_response_promotes_trust", "provider_output_is_deterministic_evidence", "verified_final_truth_claimed"]) requireFalse(input[field], `${path}.${field}`, errors);
  requireTrue(input["requires_hollow_verification_for_t2"], `${path}.requires_hollow_verification_for_t2`, errors);
  notes(input, path, errors);
}

function validateKillSwitch(value: unknown, path: string, errors: Issues): void {
  const input = objectAt(value, path, errors); if (!input) return;
  requireFields(input, ["kill_switch_required", "kill_switch_env_var_name", "kill_switch_value_required_for_live", "kill_switch_enabled_by_default", "provider_allowlist_required", "safe_refusal_when_disabled", "safe_refusal_when_not_allowlisted", "safe_refusal_when_api_key_missing", "safe_refusal_when_redaction_missing", "safe_refusal_when_safety_profile_missing", "rollback_instructions_required", "notes"], path, errors);
  requireTrue(input["kill_switch_required"], `${path}.kill_switch_required`, errors);
  requireStrings(input, ["kill_switch_env_var_name"], path, errors);
  if (input["kill_switch_value_required_for_live"] !== true && !isNonEmptyString(input["kill_switch_value_required_for_live"])) add(errors, "invalid_kill_switch_value", `${path}.kill_switch_value_required_for_live`, "must be true or a documented literal.");
  requireFalse(input["kill_switch_enabled_by_default"], `${path}.kill_switch_enabled_by_default`, errors);
  for (const field of ["provider_allowlist_required", "safe_refusal_when_disabled", "safe_refusal_when_not_allowlisted", "safe_refusal_when_api_key_missing", "safe_refusal_when_redaction_missing", "safe_refusal_when_safety_profile_missing", "rollback_instructions_required"]) requireTrue(input[field], `${path}.${field}`, errors);
  notes(input, path, errors);
}

export function validateOneProviderAdapterConfigRefusal(input: unknown): OneProviderAdapterConfigValidationResult {
  const errors: Issues = [];
  const refusal = objectAt(input, "$", errors);
  if (!refusal) return { ok: false, errors };
  rejectBlockedTopLevel(refusal, errors);
  requireFields(refusal, ["refusal_id", "config_status", "refusal_kind", "ok", "fake_success_returned", "provider_call_attempted", "network_call_attempted", "api_key_value_read", "trust_promoted", "warnings", "errors", "notes"], "$", errors);
  requireStrings(refusal, ["refusal_id"], "$", errors);
  requireAllowed(refusal["config_status"], configStatuses, "$.config_status", errors);
  requireAllowed(refusal["refusal_kind"], refusalKinds, "$.refusal_kind", errors);
  for (const field of ["ok", "fake_success_returned", "provider_call_attempted", "network_call_attempted", "api_key_value_read", "trust_promoted"]) requireFalse(refusal[field], `$.${field}`, errors);
  requireArray(refusal["warnings"], "$.warnings", errors);
  requireArray(refusal["errors"], "$.errors", errors);
  notes(refusal, "$", errors);
  return { ok: errors.length === 0, errors };
}

function validateNestedRefusal(input: unknown, path: string, errors: Issues): void {
  const result = validateOneProviderAdapterConfigRefusal(input);
  for (const error of result.errors) errors.push({ ...error, path: `${path}${error.path.slice(1)}` });
}

export function validateOneProviderAdapterConfigDocument(input: unknown): OneProviderAdapterConfigValidationResult {
  const errors: Issues = [];
  const config = objectAt(input, "$", errors);
  if (!config) return { ok: false, errors };
  rejectBlockedTopLevel(config, errors);
  requireFields(config, ["schema_version", "config_id", "config_version", "config_status", "config_source_kind", "provider_slot", "opt_in", "allowlist", "api_key_ref", "network", "timeout_retry", "cost_guard", "live_test_gate", "redaction", "safety_profile", "ledger", "runtime_storage", "trust_cap", "kill_switch", "refusal", "created_at", "notes"], "$", errors);
  requireStrings(config, ["config_id", "config_version", "created_at"], "$", errors);
  requireAllowed(config["config_status"], configStatuses, "$.config_status", errors);
  requireAllowed(config["config_source_kind"], sourceKinds, "$.config_source_kind", errors);
  validateProviderSlot(config["provider_slot"], "$.provider_slot", errors);
  validateOptIn(config["opt_in"], "$.opt_in", errors);
  validateAllowlist(config["allowlist"], "$.allowlist", errors);
  validateApiKeyRef(config["api_key_ref"], "$.api_key_ref", errors);
  validateNetwork(config["network"], "$.network", errors);
  validateTimeoutRetry(config["timeout_retry"], "$.timeout_retry", errors);
  validateCostGuard(config["cost_guard"], "$.cost_guard", errors);
  validateLiveTests(config["live_test_gate"], "$.live_test_gate", errors);
  validateRedaction(config["redaction"], "$.redaction", errors);
  validateSafetyProfile(config["safety_profile"], "$.safety_profile", errors);
  validateLedger(config["ledger"], "$.ledger", errors);
  validateRuntimeStorage(config["runtime_storage"], "$.runtime_storage", errors);
  validateTrustCap(config["trust_cap"], "$.trust_cap", errors);
  validateKillSwitch(config["kill_switch"], "$.kill_switch", errors);
  validateNestedRefusal(config["refusal"], "$.refusal", errors);
  notes(config, "$", errors);
  return { ok: errors.length === 0, errors };
}

export function isOneProviderAdapterConfigDocument(input: unknown): input is OneProviderAdapterConfigDocument {
  return validateOneProviderAdapterConfigDocument(input).ok;
}

export function isOneProviderAdapterConfigRefusal(input: unknown): input is OneProviderAdapterConfigRefusal {
  return validateOneProviderAdapterConfigRefusal(input).ok;
}

export function assertOneProviderAdapterConfigDocument(input: unknown): OneProviderAdapterConfigDocument {
  const validation = validateOneProviderAdapterConfigDocument(input);
  if (!validation.ok) throw new Error(`Invalid OneProviderAdapterConfigDocument: ${validation.errors.map((error) => `${error.path} ${error.code}`).join("; ")}`);
  return input as OneProviderAdapterConfigDocument;
}

export function assertOneProviderAdapterConfigRefusal(input: unknown): OneProviderAdapterConfigRefusal {
  const validation = validateOneProviderAdapterConfigRefusal(input);
  if (!validation.ok) throw new Error(`Invalid OneProviderAdapterConfigRefusal: ${validation.errors.map((error) => `${error.path} ${error.code}`).join("; ")}`);
  return input as OneProviderAdapterConfigRefusal;
}

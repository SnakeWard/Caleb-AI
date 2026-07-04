import type {
  OneProviderAdapterHumanApprovalRecord,
  OneProviderAdapterKillSwitchState,
  OneProviderAdapterOptInEvidence,
  OneProviderAdapterOptInHarnessDecision,
  OneProviderAdapterOptInHarnessRefusal,
  OneProviderAdapterOptInHarnessValidationIssue,
  OneProviderAdapterOptInHarnessValidationResult
} from "./types/oneProviderAdapterOptInHarnessContractTypes.js";

const statuses = new Set(["opt_in_ready_but_live_disabled", "opt_in_missing", "kill_switch_disabled", "provider_not_allowlisted", "adapter_id_missing", "command_flag_missing", "human_approval_missing", "api_key_unavailable", "redaction_not_ready", "safety_profile_not_ready", "cost_guard_not_ready", "live_tests_disabled", "harness_invalid", "refused"]);
const decisionKinds = new Set(["refuse_live_execution", "future_live_execution_allowed_by_contract_only", "live_execution_not_enabled_in_r26"]);
const refusalKinds = new Set(["live_execution_not_enabled_in_r26", "missing_opt_in", "kill_switch_disabled", "provider_not_allowlisted", "adapter_id_missing", "command_flag_missing", "human_approval_missing", "missing_api_key", "redaction_required", "safety_profile_required", "cost_guard_required", "live_tests_disabled", "config_invalid", "harness_invalid"]);
const commandFlagSources = new Set(["static_fixture", "future_cli_argument", "future_test_flag", "future_runtime_supplied"]);
const blockedFields = new Set(["raw_prompt_text", "prompt_text", "raw_output_text", "output_text", "api_key", "api_key_value", "secret", "env", "env_value", "environment", "environment_value", "credential", "auth_token", "private_key"]);

type Shape = Record<string, unknown>;
type Issues = OneProviderAdapterOptInHarnessValidationIssue[];

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
  rejectBlockedTopLevel(value, path, errors);
  return value;
}

function rejectBlockedTopLevel(input: Shape, path: string, errors: Issues): void {
  for (const field of Object.keys(input)) {
    if (blockedFields.has(field.toLowerCase())) add(errors, "blocked_top_level_field", `${path}.${field}`, `${field} is blocked from R26 opt-in harness contracts.`);
  }
}

function fields(input: Shape, required: readonly string[], path: string, errors: Issues): void {
  for (const field of required) if (!(field in input)) add(errors, "missing_required_field", `${path}.${field}`, `${field} is required.`);
}

function str(input: Shape, field: string, path: string, errors: Issues, allowEmpty = false): void {
  if (field in input && !allowEmpty && !isNonEmptyString(input[field])) add(errors, "invalid_required_string", `${path}.${field}`, `${field} must be a non-empty string.`);
  if (field in input && allowEmpty && typeof input[field] !== "string") add(errors, "invalid_string", `${path}.${field}`, `${field} must be a string.`);
}

function arr(value: unknown, path: string, errors: Issues): void {
  if (!Array.isArray(value)) add(errors, "invalid_array", path, `${path} must be an array.`);
}

function t(value: unknown, path: string, errors: Issues): void {
  if (value !== true) add(errors, "required_true", path, `${path} must be true.`);
}

function f(value: unknown, path: string, errors: Issues): void {
  if (value !== false) add(errors, "required_false", path, `${path} must be false.`);
}

function positive(value: unknown, path: string, errors: Issues): void {
  if (typeof value !== "number" || value <= 0) add(errors, "invalid_positive_number", path, `${path} must be a positive number.`);
}

function oneOf(value: unknown, allowed: ReadonlySet<string>, path: string, errors: Issues): void {
  if (typeof value !== "string" || !allowed.has(value)) add(errors, "invalid_enum", path, `${path} has an unsupported value.`);
}

function notes(input: Shape, path: string, errors: Issues): void {
  arr(input["notes"], `${path}.notes`, errors);
}

function validateEnvFlag(value: unknown, path: string, errors: Issues): void {
  const input = objectAt(value, path, errors); if (!input) return;
  fields(input, ["env_var_name", "env_var_value_required", "env_var_value_present", "env_var_value_read", "env_var_value_stored", "env_var_value_logged", "env_var_value_written_to_ledger", "env_var_value_written_to_storage", "env_var_name_promotes_trust", "notes"], path, errors);
  str(input, "env_var_name", path, errors);
  if (input["env_var_value_required"] !== true && !isNonEmptyString(input["env_var_value_required"])) add(errors, "invalid_env_value_required", `${path}.env_var_value_required`, "must be true or a documented literal.");
  ["env_var_value_read", "env_var_value_stored", "env_var_value_logged", "env_var_value_written_to_ledger", "env_var_value_written_to_storage", "env_var_name_promotes_trust"].forEach((field) => f(input[field], `${path}.${field}`, errors));
  notes(input, path, errors);
}

function validateCommandFlag(value: unknown, path: string, errors: Issues): void {
  const input = objectAt(value, path, errors); if (!input) return;
  fields(input, ["command_flag_required", "command_flag_name", "command_flag_present", "command_flag_source", "command_flag_promotes_trust", "notes"], path, errors);
  t(input["command_flag_required"], `${path}.command_flag_required`, errors);
  str(input, "command_flag_name", path, errors);
  oneOf(input["command_flag_source"], commandFlagSources, `${path}.command_flag_source`, errors);
  f(input["command_flag_promotes_trust"], `${path}.command_flag_promotes_trust`, errors);
  notes(input, path, errors);
}

function validateAllowlist(value: unknown, path: string, errors: Issues): void {
  const input = objectAt(value, path, errors); if (!input) return;
  fields(input, ["provider_allowlist_required", "provider_id", "provider_kind", "provider_allowlist_present", "provider_allowlisted", "provider_allowlist_source", "provider_allowlist_promotes_trust", "provider_not_allowlisted_failure_kind", "notes"], path, errors);
  t(input["provider_allowlist_required"], `${path}.provider_allowlist_required`, errors);
  str(input, "provider_id", path, errors);
  str(input, "provider_kind", path, errors);
  f(input["provider_allowlist_promotes_trust"], `${path}.provider_allowlist_promotes_trust`, errors);
  if (input["provider_not_allowlisted_failure_kind"] !== "provider_not_allowlisted") add(errors, "invalid_allowlist_failure", `${path}.provider_not_allowlisted_failure_kind`, "must be provider_not_allowlisted.");
  notes(input, path, errors);
}

function validateAdapterId(value: unknown, path: string, errors: Issues): void {
  const input = objectAt(value, path, errors); if (!input) return;
  fields(input, ["adapter_id_required", "adapter_id", "adapter_id_present", "adapter_id_allowed", "adapter_id_promotes_trust", "adapter_id_missing_failure_kind", "notes"], path, errors);
  t(input["adapter_id_required"], `${path}.adapter_id_required`, errors);
  str(input, "adapter_id", path, errors);
  f(input["adapter_id_promotes_trust"], `${path}.adapter_id_promotes_trust`, errors);
  if (input["adapter_id_missing_failure_kind"] !== "adapter_id_missing") add(errors, "invalid_adapter_id_failure", `${path}.adapter_id_missing_failure_kind`, "must be adapter_id_missing.");
  notes(input, path, errors);
}

function validateApiKey(value: unknown, path: string, errors: Issues): void {
  const input = objectAt(value, path, errors); if (!input) return;
  fields(input, ["api_key_required_for_live", "api_key_env_var_name", "api_key_env_var_name_is_secret", "api_key_value_present", "api_key_value_read", "api_key_value_stored", "api_key_value_logged", "api_key_value_written_to_ledger", "api_key_value_written_to_storage", "api_key_value_available_for_r26", "api_key_presence_promotes_trust", "missing_api_key_failure_kind", "notes"], path, errors);
  str(input, "api_key_env_var_name", path, errors);
  ["api_key_env_var_name_is_secret", "api_key_value_present", "api_key_value_read", "api_key_value_stored", "api_key_value_logged", "api_key_value_written_to_ledger", "api_key_value_written_to_storage", "api_key_value_available_for_r26", "api_key_presence_promotes_trust"].forEach((field) => f(input[field], `${path}.${field}`, errors));
  if (input["missing_api_key_failure_kind"] !== "missing_api_key") add(errors, "invalid_missing_api_key_failure", `${path}.missing_api_key_failure_kind`, "must be missing_api_key.");
  notes(input, path, errors);
}

export function validateOneProviderAdapterOptInEvidence(input: unknown): OneProviderAdapterOptInHarnessValidationResult {
  const errors: Issues = [];
  const obj = objectAt(input, "$", errors); if (!obj) return { ok: false, errors };
  fields(obj, ["schema_version", "evidence_id", "harness_id", "env_flag_ref", "command_flag", "allowlist", "adapter_id", "api_key_availability", "created_at", "notes"], "$", errors);
  ["evidence_id", "harness_id", "created_at"].forEach((field) => str(obj, field, "$", errors));
  validateEnvFlag(obj["env_flag_ref"], "$.env_flag_ref", errors);
  validateCommandFlag(obj["command_flag"], "$.command_flag", errors);
  validateAllowlist(obj["allowlist"], "$.allowlist", errors);
  validateAdapterId(obj["adapter_id"], "$.adapter_id", errors);
  validateApiKey(obj["api_key_availability"], "$.api_key_availability", errors);
  notes(obj, "$", errors);
  return { ok: errors.length === 0, errors };
}

export function validateOneProviderAdapterHumanApprovalRecord(input: unknown): OneProviderAdapterOptInHarnessValidationResult {
  const errors: Issues = [];
  const obj = objectAt(input, "$", errors); if (!obj) return { ok: false, errors };
  fields(obj, ["human_approval_required", "human_approval_recorded", "approval_id", "approver_ref", "approval_scope", "approval_timestamp", "approval_expires_at", "approval_source", "approval_promotes_trust", "approval_allows_live_execution_in_r26", "notes"], "$", errors);
  t(obj["human_approval_required"], "$.human_approval_required", errors);
  ["approval_id", "approver_ref", "approval_scope", "approval_timestamp", "approval_expires_at", "approval_source"].forEach((field) => str(obj, field, "$", errors, true));
  f(obj["approval_promotes_trust"], "$.approval_promotes_trust", errors);
  f(obj["approval_allows_live_execution_in_r26"], "$.approval_allows_live_execution_in_r26", errors);
  notes(obj, "$", errors);
  return { ok: errors.length === 0, errors };
}

export function validateOneProviderAdapterKillSwitchState(input: unknown): OneProviderAdapterOptInHarnessValidationResult {
  const errors: Issues = [];
  const obj = objectAt(input, "$", errors); if (!obj) return { ok: false, errors };
  fields(obj, ["kill_switch_required", "kill_switch_env_var_name", "kill_switch_value_required_for_live", "kill_switch_value_present", "kill_switch_value_read", "kill_switch_enabled_by_default", "kill_switch_allows_live_execution", "kill_switch_blocks_live_execution", "kill_switch_promotes_trust", "notes"], "$", errors);
  t(obj["kill_switch_required"], "$.kill_switch_required", errors);
  str(obj, "kill_switch_env_var_name", "$", errors);
  ["kill_switch_value_present", "kill_switch_value_read", "kill_switch_enabled_by_default", "kill_switch_allows_live_execution", "kill_switch_promotes_trust"].forEach((field) => f(obj[field], `$.${field}`, errors));
  t(obj["kill_switch_blocks_live_execution"], "$.kill_switch_blocks_live_execution", errors);
  notes(obj, "$", errors);
  return { ok: errors.length === 0, errors };
}

function validateRedaction(value: unknown, path: string, errors: Issues): void {
  const obj = objectAt(value, path, errors); if (!obj) return;
  fields(obj, ["redaction_policy_required", "redaction_manifest_required", "redaction_result_required", "redaction_policy_present", "redaction_manifest_present", "redaction_result_present", "redaction_ready", "redaction_promotes_trust", "redaction_metadata_promotes_trust", "raw_prompt_allowed", "raw_output_allowed", "notes"], path, errors);
  ["redaction_policy_required", "redaction_manifest_required", "redaction_result_required"].forEach((field) => t(obj[field], `${path}.${field}`, errors));
  ["redaction_promotes_trust", "redaction_metadata_promotes_trust", "raw_prompt_allowed", "raw_output_allowed"].forEach((field) => f(obj[field], `${path}.${field}`, errors));
  notes(obj, path, errors);
}

function validateSafety(value: unknown, path: string, errors: Issues): void {
  const obj = objectAt(value, path, errors); if (!obj) return;
  fields(obj, ["safety_profile_required", "safety_profile_id", "safety_profile_present", "safety_profile_ready", "safety_profile_promotes_trust", "missing_safety_profile_failure_kind", "notes"], path, errors);
  t(obj["safety_profile_required"], `${path}.safety_profile_required`, errors);
  str(obj, "safety_profile_id", path, errors);
  f(obj["safety_profile_promotes_trust"], `${path}.safety_profile_promotes_trust`, errors);
  if (obj["missing_safety_profile_failure_kind"] !== "safety_profile_required") add(errors, "invalid_safety_failure", `${path}.missing_safety_profile_failure_kind`, "must be safety_profile_required.");
  notes(obj, path, errors);
}

function validateCost(value: unknown, path: string, errors: Issues): void {
  const obj = objectAt(value, path, errors); if (!obj) return;
  fields(obj, ["cost_guard_required", "cost_guard_present", "cost_guard_ready", "max_live_requests_per_test", "max_output_tokens", "max_cost_units_per_run", "background_live_calls_allowed", "cost_guard_promotes_trust", "cost_limit_exceeded_failure_kind", "notes"], path, errors);
  t(obj["cost_guard_required"], `${path}.cost_guard_required`, errors);
  ["max_live_requests_per_test", "max_output_tokens", "max_cost_units_per_run"].forEach((field) => positive(obj[field], `${path}.${field}`, errors));
  f(obj["background_live_calls_allowed"], `${path}.background_live_calls_allowed`, errors);
  f(obj["cost_guard_promotes_trust"], `${path}.cost_guard_promotes_trust`, errors);
  if (obj["cost_limit_exceeded_failure_kind"] !== "cost_limit_exceeded") add(errors, "invalid_cost_failure", `${path}.cost_limit_exceeded_failure_kind`, "must be cost_limit_exceeded.");
  notes(obj, path, errors);
}

function validateLiveTests(value: unknown, path: string, errors: Issues): void {
  const obj = objectAt(value, path, errors); if (!obj) return;
  fields(obj, ["live_tests_created_in_r26", "live_tests_allowed_in_default_run", "live_tests_opt_in_only", "live_tests_skipped_by_default", "live_tests_can_run_in_ci_by_default", "live_tests_require_api_key", "live_tests_require_provider_allowlist", "test_fixtures_contain_secrets", "test_fixtures_contain_api_keys", "test_fixtures_contain_raw_prompt", "test_fixtures_contain_raw_output", "live_test_gate_promotes_trust", "notes"], path, errors);
  ["live_tests_created_in_r26", "live_tests_allowed_in_default_run", "live_tests_can_run_in_ci_by_default", "test_fixtures_contain_secrets", "test_fixtures_contain_api_keys", "test_fixtures_contain_raw_prompt", "test_fixtures_contain_raw_output", "live_test_gate_promotes_trust"].forEach((field) => f(obj[field], `${path}.${field}`, errors));
  ["live_tests_opt_in_only", "live_tests_skipped_by_default"].forEach((field) => t(obj[field], `${path}.${field}`, errors));
  notes(obj, path, errors);
}

function validateTrust(value: unknown, path: string, errors: Issues): void {
  const obj = objectAt(value, path, errors); if (!obj) return;
  const falseFields = ["opt_in_evidence_promotes_trust", "command_flag_promotes_trust", "env_flag_name_promotes_trust", "human_approval_promotes_trust", "kill_switch_state_promotes_trust", "api_key_presence_promotes_trust", "provider_allowlist_promotes_trust", "network_permission_promotes_trust", "harness_decision_promotes_trust", "live_execution_allowed_in_r26", "provider_identity_promotes_trust", "successful_provider_response_promotes_trust", "provider_output_is_deterministic_evidence", "verified_final_truth_claimed"];
  fields(obj, [...falseFields, "raw_provider_output_trust_tier", "schema_valid_provider_output_trust_tier", "max_provider_output_trust_tier", "requires_hollow_verification_for_t2", "notes"], path, errors);
  falseFields.forEach((field) => f(obj[field], `${path}.${field}`, errors));
  if (obj["raw_provider_output_trust_tier"] !== "T0") add(errors, "invalid_raw_trust_tier", `${path}.raw_provider_output_trust_tier`, "must be T0.");
  if (obj["schema_valid_provider_output_trust_tier"] !== "T1") add(errors, "invalid_schema_trust_tier", `${path}.schema_valid_provider_output_trust_tier`, "must be T1.");
  if (obj["max_provider_output_trust_tier"] !== "T1") add(errors, "invalid_max_trust_tier", `${path}.max_provider_output_trust_tier`, "must be T1.");
  t(obj["requires_hollow_verification_for_t2"], `${path}.requires_hollow_verification_for_t2`, errors);
  notes(obj, path, errors);
}

function validateAudit(value: unknown, path: string, errors: Issues): void {
  const obj = objectAt(value, path, errors); if (!obj) return;
  fields(obj, ["harness_id", "config_ref", "opt_in_evidence_ref", "decision_id", "decision_kind", "refusal_kind", "live_execution_attempted", "provider_call_attempted", "network_call_attempted", "api_key_value_read", "process_env_read", "provider_sdk_used", "ledger_write_attempted", "file_write_attempted", "fake_success_returned", "provider_output_returned", "audit_notes"], path, errors);
  ["harness_id", "config_ref", "opt_in_evidence_ref", "decision_id"].forEach((field) => str(obj, field, path, errors));
  oneOf(obj["decision_kind"], decisionKinds, `${path}.decision_kind`, errors);
  oneOf(obj["refusal_kind"], refusalKinds, `${path}.refusal_kind`, errors);
  ["live_execution_attempted", "provider_call_attempted", "network_call_attempted", "api_key_value_read", "process_env_read", "provider_sdk_used", "ledger_write_attempted", "file_write_attempted", "fake_success_returned", "provider_output_returned"].forEach((field) => f(obj[field], `${path}.${field}`, errors));
  arr(obj["audit_notes"], `${path}.audit_notes`, errors);
}

export function validateOneProviderAdapterOptInHarnessRefusal(input: unknown): OneProviderAdapterOptInHarnessValidationResult {
  const errors: Issues = [];
  const obj = objectAt(input, "$", errors); if (!obj) return { ok: false, errors };
  fields(obj, ["schema_version", "refusal_id", "ok", "status", "refusal_kind", "provider_call_attempted", "network_call_attempted", "api_key_value_read", "process_env_read", "fake_success_returned", "provider_output_returned", "warnings", "errors", "notes"], "$", errors);
  str(obj, "refusal_id", "$", errors);
  f(obj["ok"], "$.ok", errors);
  oneOf(obj["status"], statuses, "$.status", errors);
  oneOf(obj["refusal_kind"], refusalKinds, "$.refusal_kind", errors);
  ["provider_call_attempted", "network_call_attempted", "api_key_value_read", "process_env_read", "fake_success_returned", "provider_output_returned"].forEach((field) => f(obj[field], `$.${field}`, errors));
  arr(obj["warnings"], "$.warnings", errors);
  arr(obj["errors"], "$.errors", errors);
  notes(obj, "$", errors);
  return { ok: errors.length === 0, errors };
}

export function validateOneProviderAdapterOptInHarnessDecision(input: unknown): OneProviderAdapterOptInHarnessValidationResult {
  const errors: Issues = [];
  const obj = objectAt(input, "$", errors); if (!obj) return { ok: false, errors };
  fields(obj, ["schema_version", "decision_id", "harness_id", "status", "decision_kind", "refusal_kind", "opt_in_evidence", "human_approval", "kill_switch", "redaction", "safety_profile", "cost_guard", "live_test_gate", "refusal", "audit_summary", "trust_summary", "created_at", "notes"], "$", errors);
  ["decision_id", "harness_id", "created_at"].forEach((field) => str(obj, field, "$", errors));
  oneOf(obj["status"], statuses, "$.status", errors);
  oneOf(obj["decision_kind"], decisionKinds, "$.decision_kind", errors);
  oneOf(obj["refusal_kind"], refusalKinds, "$.refusal_kind", errors);
  validateOneProviderAdapterOptInEvidence(obj["opt_in_evidence"]).errors.forEach((error) => errors.push({ ...error, path: `$.opt_in_evidence${error.path.slice(1)}` }));
  validateOneProviderAdapterHumanApprovalRecord(obj["human_approval"]).errors.forEach((error) => errors.push({ ...error, path: `$.human_approval${error.path.slice(1)}` }));
  validateOneProviderAdapterKillSwitchState(obj["kill_switch"]).errors.forEach((error) => errors.push({ ...error, path: `$.kill_switch${error.path.slice(1)}` }));
  validateRedaction(obj["redaction"], "$.redaction", errors);
  validateSafety(obj["safety_profile"], "$.safety_profile", errors);
  validateCost(obj["cost_guard"], "$.cost_guard", errors);
  validateLiveTests(obj["live_test_gate"], "$.live_test_gate", errors);
  validateOneProviderAdapterOptInHarnessRefusal(obj["refusal"]).errors.forEach((error) => errors.push({ ...error, path: `$.refusal${error.path.slice(1)}` }));
  validateAudit(obj["audit_summary"], "$.audit_summary", errors);
  validateTrust(obj["trust_summary"], "$.trust_summary", errors);
  notes(obj, "$", errors);
  return { ok: errors.length === 0, errors };
}

export function isOneProviderAdapterOptInHarnessDecision(input: unknown): input is OneProviderAdapterOptInHarnessDecision {
  return validateOneProviderAdapterOptInHarnessDecision(input).ok;
}

export function isOneProviderAdapterOptInHarnessRefusal(input: unknown): input is OneProviderAdapterOptInHarnessRefusal {
  return validateOneProviderAdapterOptInHarnessRefusal(input).ok;
}

export function assertOneProviderAdapterOptInHarnessDecision(input: unknown): OneProviderAdapterOptInHarnessDecision {
  const validation = validateOneProviderAdapterOptInHarnessDecision(input);
  if (!validation.ok) throw new Error(`Invalid OneProviderAdapterOptInHarnessDecision: ${validation.errors.map((error) => `${error.path} ${error.code}`).join("; ")}`);
  return input as OneProviderAdapterOptInHarnessDecision;
}

export function assertOneProviderAdapterOptInHarnessRefusal(input: unknown): OneProviderAdapterOptInHarnessRefusal {
  const validation = validateOneProviderAdapterOptInHarnessRefusal(input);
  if (!validation.ok) throw new Error(`Invalid OneProviderAdapterOptInHarnessRefusal: ${validation.errors.map((error) => `${error.path} ${error.code}`).join("; ")}`);
  return input as OneProviderAdapterOptInHarnessRefusal;
}

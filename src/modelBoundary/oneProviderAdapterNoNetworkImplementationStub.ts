import type { OneProviderAdapterConfigDocument } from "./types/oneProviderAdapterConfigContractTypes.js";
import {
  validateOneProviderAdapterConfigDocument
} from "./oneProviderAdapterConfigContractValidator.js";
import type {
  OneProviderAdapterNoNetworkStubCapabilities,
  OneProviderAdapterNoNetworkStubConfigSummary,
  OneProviderAdapterNoNetworkStubHealth,
  OneProviderAdapterNoNetworkStubInvocation,
  OneProviderAdapterNoNetworkStubResult,
  OneProviderAdapterNoNetworkStubSafetySummary,
  OneProviderAdapterNoNetworkStubTrustSummary,
  OneProviderAdapterNoNetworkStubValidationIssue,
  OneProviderAdapterNoNetworkStubValidationResult
} from "./types/oneProviderAdapterNoNetworkImplementationStubTypes.js";

const blockedTopLevelFields = new Set(["raw_prompt_text", "prompt_text", "raw_output_text", "output_text", "api_key", "api_key_value", "secret", "env", "env_value", "environment", "environment_value", "credential", "auth_token", "private_key"]);
const resultStatuses = new Set(["future_live_not_enabled", "missing_opt_in", "provider_not_selected", "provider_not_allowlisted", "missing_api_key", "redaction_required", "safety_profile_required", "rejected", "config_invalid", "validation_failed"]);
const healthStatuses = new Set(["ready_no_network", "future_live_not_enabled", "config_invalid", "provider_not_selected", "provider_not_allowlisted", "missing_opt_in", "missing_api_key", "redaction_required", "safety_profile_required", "rejected", "validation_failed"]);
const failureKinds = new Set(["none", "config_invalid", "live_provider_not_enabled", "provider_not_selected", "provider_not_allowlisted", "missing_opt_in", "missing_api_key", "redaction_required", "safety_profile_required", "network_disabled", "provider_sdk_unavailable", "fake_success_blocked", "validation_failed"]);
const schemaVersion = "0.1.0";
const defaultCreatedAt = "2026-07-03T00:00:00.000Z";

type Shape = Record<string, unknown>;
type Issues = OneProviderAdapterNoNetworkStubValidationIssue[];

export interface OneProviderAdapterNoNetworkStubOptions {
  readonly stub_id?: string;
  readonly adapter_id?: string;
  readonly adapter_version?: string;
  readonly created_at?: string;
  readonly checked_at?: string;
}

export interface OneProviderAdapterNoNetworkImplementationStub {
  readonly capabilities: (options?: OneProviderAdapterNoNetworkStubOptions) => OneProviderAdapterNoNetworkStubCapabilities;
  readonly health: (options?: OneProviderAdapterNoNetworkStubOptions) => OneProviderAdapterNoNetworkStubHealth;
  readonly invoke: (invocation: unknown, options?: OneProviderAdapterNoNetworkStubOptions) => OneProviderAdapterNoNetworkStubResult;
}

function isObject(value: unknown): value is Shape {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function issue(errors: Issues, code: string, path: string, message: string): void {
  errors.push({ code, path, message, severity: "error" });
}

function objectAt(value: unknown, path: string, errors: Issues): Shape | null {
  if (!isObject(value)) {
    issue(errors, "invalid_object", path, `${path} must be an object.`);
    return null;
  }
  return value;
}

function rejectBlocked(input: Shape, path: string, errors: Issues): void {
  for (const field of Object.keys(input)) {
    if (blockedTopLevelFields.has(field.toLowerCase())) issue(errors, "blocked_top_level_field", `${path}.${field}`, `${field} is blocked from R25 stub contracts.`);
  }
}

function requireFields(input: Shape, fields: readonly string[], path: string, errors: Issues): void {
  for (const field of fields) if (!(field in input)) issue(errors, "missing_required_field", `${path}.${field}`, `${field} is required.`);
}

function requireString(input: Shape, field: string, path: string, errors: Issues): void {
  if (field in input && !isNonEmptyString(input[field])) issue(errors, "invalid_required_string", `${path}.${field}`, `${field} must be a non-empty string.`);
}

function requireArray(value: unknown, path: string, errors: Issues): void {
  if (!Array.isArray(value)) issue(errors, "invalid_array", path, `${path} must be an array.`);
}

function requireTrue(value: unknown, path: string, errors: Issues): void {
  if (value !== true) issue(errors, "required_true", path, `${path} must be true.`);
}

function requireFalse(value: unknown, path: string, errors: Issues): void {
  if (value !== false) issue(errors, "required_false", path, `${path} must be false.`);
}

function notes(input: Shape, path: string, errors: Issues): void {
  requireArray(input["notes"], `${path}.notes`, errors);
}

function ids(config: OneProviderAdapterConfigDocument, options?: OneProviderAdapterNoNetworkStubOptions) {
  return {
    stub_id: options?.stub_id ?? "one_provider_no_network_stub",
    adapter_id: options?.adapter_id ?? "first_provider_adapter_no_network_stub",
    adapter_version: options?.adapter_version ?? "0.1.0",
    created_at: options?.created_at ?? defaultCreatedAt,
    checked_at: options?.checked_at ?? options?.created_at ?? defaultCreatedAt,
    provider_slot_id: config.provider_slot.provider_slot_id,
    provider_id: config.provider_slot.provider_id,
    provider_kind: config.provider_slot.provider_kind
  };
}

function makeTrustSummary(): OneProviderAdapterNoNetworkStubTrustSummary {
  return {
    config_validity_promotes_trust: false,
    config_presence_enables_opt_in: false,
    stub_execution_promotes_trust: false,
    stub_refusal_is_model_evidence: false,
    provider_slot_selection_promotes_trust: false,
    explicit_opt_in_promotes_trust: false,
    api_key_env_var_name_promotes_trust: false,
    api_key_presence_promotes_trust: false,
    network_success_promotes_trust: false,
    provider_identity_promotes_trust: false,
    successful_provider_response_promotes_trust: false,
    provider_output_is_deterministic_evidence: false,
    raw_provider_output_trust_tier: "T0",
    schema_valid_provider_output_trust_tier: "T1",
    max_provider_output_trust_tier: "T1",
    verified_final_truth_claimed: false,
    requires_hollow_verification_for_t2: true,
    notes: ["No trust promotion occurs in the no-network stub."]
  };
}

function makeSafetySummary(): OneProviderAdapterNoNetworkStubSafetySummary {
  return {
    raw_prompt_blocked: true,
    raw_output_blocked: true,
    api_key_value_blocked: true,
    secrets_blocked: true,
    env_values_blocked: true,
    credentials_blocked: true,
    auth_tokens_blocked: true,
    private_keys_blocked: true,
    process_env_read_blocked: true,
    network_call_blocked: true,
    provider_sdk_blocked: true,
    ledger_write_blocked: true,
    file_write_blocked: true,
    fake_success_blocked: true,
    provider_output_blocked: true,
    notes: ["All live-provider and sensitive-content paths are blocked."]
  };
}

function makeConfigSummary(config: OneProviderAdapterConfigDocument): OneProviderAdapterNoNetworkStubConfigSummary {
  return {
    config_id: config.config_id,
    config_version: config.config_version,
    config_status: config.config_status,
    provider_slot_id: config.provider_slot.provider_slot_id,
    real_provider_selected: config.provider_slot.real_provider_selected,
    provider_specific_behavior_enabled: config.provider_slot.provider_specific_behavior_enabled,
    opt_in_required: config.opt_in.explicit_opt_in_required,
    opt_in_present: config.opt_in.opt_in_value_present,
    default_runtime_enabled: config.opt_in.opt_in_enabled_by_default,
    api_key_value_read: config.api_key_ref.api_key_value_read,
    network_call_performed_in_config: config.network.network_call_performed_in_r24,
    live_tests_created_in_config: config.live_test_gate.live_tests_created_in_r24,
    ledger_write_allowed_in_config_contract: config.ledger.ledger_write_allowed_in_config_contract,
    storage_write_allowed_in_config_contract: config.runtime_storage.storage_write_allowed_in_config_contract,
    notes: ["Summary derived from supplied R24 config data."]
  };
}

export function getOneProviderAdapterNoNetworkStubCapabilities(configDocument: OneProviderAdapterConfigDocument, options?: OneProviderAdapterNoNetworkStubOptions): OneProviderAdapterNoNetworkStubCapabilities {
  const id = ids(configDocument, options);
  return {
    schema_version: schemaVersion,
    stub_id: id.stub_id,
    adapter_id: id.adapter_id,
    adapter_version: id.adapter_version,
    provider_slot_id: id.provider_slot_id,
    provider_id: id.provider_id,
    provider_kind: id.provider_kind,
    consumes_config_contract: true,
    supports_no_network_invocation: true,
    supports_live_network: false,
    supports_provider_sdk: false,
    requires_api_key_value: false,
    reads_process_env: false,
    reads_api_key_value: false,
    performs_network_call: false,
    writes_ledger: false,
    writes_files: false,
    returns_provider_output: false,
    returns_fake_success: false,
    max_output_trust_tier: "T1",
    created_at: id.created_at,
    notes: ["Offline config-consuming stub only."]
  };
}

export function getOneProviderAdapterNoNetworkStubHealth(configDocument: OneProviderAdapterConfigDocument, options?: OneProviderAdapterNoNetworkStubOptions): OneProviderAdapterNoNetworkStubHealth {
  const id = ids(configDocument, options);
  const configValid = validateOneProviderAdapterConfigDocument(configDocument).ok;
  return {
    schema_version: schemaVersion,
    stub_id: id.stub_id,
    adapter_id: id.adapter_id,
    provider_slot_id: id.provider_slot_id,
    status: configValid ? "future_live_not_enabled" : "config_invalid",
    config_contract_available: true,
    config_valid: configValid,
    live_provider_enabled: false,
    network_available: false,
    provider_sdk_available: false,
    api_key_value_available: false,
    process_env_read: false,
    provider_selected: configDocument.provider_slot.provider_selected,
    provider_allowlisted: configDocument.allowlist.provider_allowlist_present,
    opt_in_present: configDocument.opt_in.opt_in_value_present,
    checked_at: id.checked_at,
    warnings: [],
    errors: configValid ? [] : ["config_invalid"],
    notes: ["Health is derived from supplied config only."]
  };
}

function resultStatus(invocationValid: boolean, configValid: boolean, invocation?: OneProviderAdapterNoNetworkStubInvocation): { status: string; failure_kind: string } {
  if (!configValid) return { status: "config_invalid", failure_kind: "config_invalid" };
  if (!invocationValid) return { status: "validation_failed", failure_kind: "validation_failed" };
  if (!invocation?.opt_in_present) return { status: "missing_opt_in", failure_kind: "missing_opt_in" };
  if (!invocation.provider_allowlisted) return { status: "provider_not_allowlisted", failure_kind: "provider_not_allowlisted" };
  if (!invocation.api_key_value_available) return { status: "missing_api_key", failure_kind: "missing_api_key" };
  return { status: "future_live_not_enabled", failure_kind: "live_provider_not_enabled" };
}

export function invokeOneProviderAdapterNoNetworkStub(input: unknown, options?: OneProviderAdapterNoNetworkStubOptions): OneProviderAdapterNoNetworkStubResult {
  const invocationValidation = validateOneProviderAdapterNoNetworkStubInvocation(input);
  const invocation = input as OneProviderAdapterNoNetworkStubInvocation;
  const config = isObject(input) && isObject(input["config_document"]) ? input["config_document"] as unknown as OneProviderAdapterConfigDocument : invalidConfigFallback();
  const configValidation = validateOneProviderAdapterConfigDocument(config);
  const id = ids(config, options);
  const status = resultStatus(invocationValidation.ok, configValidation.ok, invocation);
  const invocationId = isObject(input) && isNonEmptyString(input["invocation_id"]) ? input["invocation_id"] : "invalid_invocation";
  return {
    schema_version: schemaVersion,
    result_id: `${invocationId}_no_network_refusal`,
    invocation_id: invocationId,
    stub_id: id.stub_id,
    adapter_id: id.adapter_id,
    provider_slot_id: id.provider_slot_id,
    provider_id: id.provider_id,
    provider_kind: id.provider_kind,
    ok: false,
    status: status.status,
    failure_kind: status.failure_kind,
    capabilities: getOneProviderAdapterNoNetworkStubCapabilities(config, options),
    health: getOneProviderAdapterNoNetworkStubHealth(config, options),
    config_summary: makeConfigSummary(config),
    trust_summary: makeTrustSummary(),
    safety_summary: makeSafetySummary(),
    provider_call_attempted: false,
    network_call_attempted: false,
    provider_sdk_used: false,
    process_env_read: false,
    api_key_value_read: false,
    ledger_write_attempted: false,
    file_write_attempted: false,
    fake_success_returned: false,
    provider_output_returned: false,
    warnings: [],
    errors: [...configValidation.errors.map((error) => error.code), ...invocationValidation.errors.map((error) => error.code), status.failure_kind],
    created_at: options?.created_at ?? defaultCreatedAt,
    notes: ["No-network stub refused live execution deterministically."]
  };
}

export function createOneProviderAdapterNoNetworkImplementationStub(configDocument: unknown): OneProviderAdapterNoNetworkImplementationStub {
  const validation = validateOneProviderAdapterConfigDocument(configDocument);
  if (!validation.ok) throw new Error(`Invalid R24 config for no-network stub: ${validation.errors.map((error) => `${error.path} ${error.code}`).join("; ")}`);
  const config = configDocument as OneProviderAdapterConfigDocument;
  return {
    capabilities: (options) => getOneProviderAdapterNoNetworkStubCapabilities(config, options),
    health: (options) => getOneProviderAdapterNoNetworkStubHealth(config, options),
    invoke: (invocation, options) => invokeOneProviderAdapterNoNetworkStub(invocation, options)
  };
}

function invalidConfigFallback(): OneProviderAdapterConfigDocument {
  return {
    schema_version: schemaVersion,
    config_id: "invalid_config",
    config_version: "invalid",
    config_status: "config_invalid",
    config_source_kind: "static_fixture",
    provider_slot: { provider_slot_id: "first_provider_slot", provider_id: "first_provider_placeholder", provider_kind: "placeholder", provider_selected: false, provider_selection_authorized: false, real_provider_selected: false, provider_specific_behavior_enabled: false, provider_slot_selection_promotes_trust: false, notes: [] },
    opt_in: { explicit_opt_in_required: true, opt_in_env_var_name: "UNREAD", opt_in_value_required: true, opt_in_value_present: false, opt_in_enabled_by_default: false, explicit_command_flag_required: true, explicit_command_flag_name: "--unread", explicit_command_flag_present: false, human_approval_required: true, human_approval_recorded: false, opt_in_promotes_trust: false, missing_opt_in_failure_kind: "live_provider_not_enabled", fake_success_allowed: false, notes: [] },
    allowlist: { provider_allowlist_required: true, provider_allowlist_present: false, allowed_provider_ids: [], allowed_provider_kinds: [], provider_not_allowlisted_failure_kind: "provider_not_allowlisted", allowlist_values_are_secret: false, allowlist_promotes_trust: false, notes: [] },
    api_key_ref: { api_key_required_for_live: true, api_key_env_var_name: "UNREAD", api_key_env_var_name_is_secret: false, api_key_value_present: false, api_key_value_read: false, api_key_value_stored: false, api_key_value_logged: false, api_key_value_written_to_ledger: false, api_key_value_written_to_storage: false, api_key_value_allowed_in_fixtures: false, api_key_presence_promotes_trust: false, missing_api_key_failure_kind: "missing_api_key", notes: [] },
    network: { network_calls_allowed_by_default: false, network_calls_require_opt_in: true, network_available_in_r24: false, network_call_performed_in_r24: false, default_unit_tests_offline: true, default_acceptance_tests_offline: true, live_tests_opt_in_only: true, live_tests_skipped_by_default: true, network_success_promotes_trust: false, network_failure_normalized: true, notes: [] },
    timeout_retry: { timeout_required: true, timeout_ms: 1, retry_count: 0, max_retry_count: 0, retry_count_recorded: true, unbounded_retries_allowed: false, silent_retry_allowed: false, timeout_failure_kind: "provider_timeout", notes: [] },
    cost_guard: { cost_guard_required: true, max_live_requests_per_test: 1, max_output_tokens: 1, max_cost_units_per_run: 1, cost_warning_required: true, cost_stop_condition_required: true, background_live_calls_allowed: false, cost_limit_exceeded_failure_kind: "cost_limit_exceeded", notes: [] },
    live_test_gate: { live_tests_created_in_r24: false, live_tests_allowed_in_default_run: false, live_tests_require_opt_in_flag: true, live_tests_require_api_key: true, live_tests_require_provider_allowlist: true, live_tests_skipped_by_default: true, live_tests_can_run_in_ci_by_default: false, test_fixtures_may_contain_secrets: false, test_fixtures_may_contain_api_keys: false, test_fixtures_may_contain_raw_prompt: false, test_fixtures_may_contain_raw_output: false, notes: [] },
    redaction: { redaction_policy_required: true, redaction_manifest_required: true, redaction_result_required: true, raw_prompt_allowed: false, raw_output_allowed: false, raw_transcript_storage_allowed: false, redaction_promotes_trust: false, redaction_metadata_promotes_trust: false, notes: [] },
    safety_profile: { safety_profile_required: true, safety_profile_id: "fallback", safety_profile_present: false, missing_safety_profile_failure_kind: "safety_profile_required", safety_profile_promotes_trust: false, notes: [] },
    ledger: { ledger_provenance_required: true, ledger_write_allowed_in_config_contract: false, raw_prompt_written_to_ledger: false, raw_output_written_to_ledger: false, api_key_written_to_ledger: false, secrets_written_to_ledger: false, env_values_written_to_ledger: false, refs_digests_statuses_allowed: true, ledger_write_promotes_trust: false, ledger_presence_promotes_trust: false, notes: [] },
    runtime_storage: { runtime_storage_contract_required: true, storage_write_allowed_in_config_contract: false, persistent_transcript_storage_allowed: false, raw_provider_output_storage_tier: "T0", schema_valid_provider_output_storage_tier: "T1", storage_promotes_trust: false, retrieval_promotes_trust: false, persistence_is_verification: false, notes: [] },
    trust_cap: { raw_provider_output_trust_tier: "T0", schema_valid_provider_output_trust_tier: "T1", max_provider_output_trust_tier: "T1", config_validity_promotes_trust: false, config_presence_promotes_opt_in: false, provider_slot_selection_promotes_trust: false, explicit_opt_in_promotes_trust: false, api_key_env_var_name_promotes_trust: false, api_key_presence_promotes_trust: false, network_success_promotes_trust: false, provider_identity_promotes_trust: false, successful_provider_response_promotes_trust: false, provider_output_is_deterministic_evidence: false, verified_final_truth_claimed: false, requires_hollow_verification_for_t2: true, notes: [] },
    kill_switch: { kill_switch_required: true, kill_switch_env_var_name: "UNREAD", kill_switch_value_required_for_live: true, kill_switch_enabled_by_default: false, provider_allowlist_required: true, safe_refusal_when_disabled: true, safe_refusal_when_not_allowlisted: true, safe_refusal_when_api_key_missing: true, safe_refusal_when_redaction_missing: true, safe_refusal_when_safety_profile_missing: true, rollback_instructions_required: true, notes: [] },
    refusal: { refusal_id: "fallback", config_status: "config_invalid", refusal_kind: "config_invalid", ok: false, fake_success_returned: false, provider_call_attempted: false, network_call_attempted: false, api_key_value_read: false, trust_promoted: false, warnings: [], errors: [], notes: [] },
    created_at: defaultCreatedAt,
    notes: []
  };
}

export function validateOneProviderAdapterNoNetworkStubCapabilities(input: unknown): OneProviderAdapterNoNetworkStubValidationResult {
  const errors: Issues = [];
  const obj = objectAt(input, "$", errors); if (!obj) return { ok: false, errors };
  requireFields(obj, ["schema_version", "stub_id", "adapter_id", "adapter_version", "provider_slot_id", "provider_id", "provider_kind", "consumes_config_contract", "supports_no_network_invocation", "supports_live_network", "supports_provider_sdk", "requires_api_key_value", "reads_process_env", "reads_api_key_value", "performs_network_call", "writes_ledger", "writes_files", "returns_provider_output", "returns_fake_success", "max_output_trust_tier", "created_at", "notes"], "$", errors);
  ["stub_id", "adapter_id", "adapter_version", "provider_slot_id", "provider_id", "provider_kind", "created_at"].forEach((field) => requireString(obj, field, "$", errors));
  requireTrue(obj["consumes_config_contract"], "$.consumes_config_contract", errors);
  requireTrue(obj["supports_no_network_invocation"], "$.supports_no_network_invocation", errors);
  ["supports_live_network", "supports_provider_sdk", "requires_api_key_value", "reads_process_env", "reads_api_key_value", "performs_network_call", "writes_ledger", "writes_files", "returns_provider_output", "returns_fake_success"].forEach((field) => requireFalse(obj[field], `$.${field}`, errors));
  if (obj["max_output_trust_tier"] !== "T1") issue(errors, "invalid_max_trust_tier", "$.max_output_trust_tier", "must be T1.");
  notes(obj, "$", errors);
  return { ok: errors.length === 0, errors };
}

export function validateOneProviderAdapterNoNetworkStubHealth(input: unknown): OneProviderAdapterNoNetworkStubValidationResult {
  const errors: Issues = [];
  const obj = objectAt(input, "$", errors); if (!obj) return { ok: false, errors };
  requireFields(obj, ["schema_version", "stub_id", "adapter_id", "provider_slot_id", "status", "config_contract_available", "config_valid", "live_provider_enabled", "network_available", "provider_sdk_available", "api_key_value_available", "process_env_read", "provider_selected", "provider_allowlisted", "opt_in_present", "checked_at", "warnings", "errors", "notes"], "$", errors);
  if (typeof obj["status"] !== "string" || !healthStatuses.has(obj["status"])) issue(errors, "invalid_status", "$.status", "unsupported health status.");
  requireTrue(obj["config_contract_available"], "$.config_contract_available", errors);
  ["live_provider_enabled", "network_available", "provider_sdk_available", "api_key_value_available", "process_env_read", "provider_selected", "opt_in_present"].forEach((field) => requireFalse(obj[field], `$.${field}`, errors));
  requireArray(obj["warnings"], "$.warnings", errors); requireArray(obj["errors"], "$.errors", errors); notes(obj, "$", errors);
  return { ok: errors.length === 0, errors };
}

export function validateOneProviderAdapterNoNetworkStubInvocation(input: unknown): OneProviderAdapterNoNetworkStubValidationResult {
  const errors: Issues = [];
  const obj = objectAt(input, "$", errors); if (!obj) return { ok: false, errors };
  rejectBlocked(obj, "$", errors);
  requireFields(obj, ["schema_version", "invocation_id", "stub_id", "adapter_id", "config_ref", "config_document", "route_mode", "request_ref", "request_digest", "redaction_result_ref", "safety_profile_id", "opt_in_present", "command_flag_present", "human_approval_recorded", "provider_allowlisted", "api_key_value_available", "network_allowed", "provider_sdk_allowed", "created_at", "notes"], "$", errors);
  ["invocation_id", "stub_id", "adapter_id", "config_ref", "request_ref", "request_digest", "redaction_result_ref", "safety_profile_id", "created_at"].forEach((field) => requireString(obj, field, "$", errors));
  if (obj["route_mode"] !== "single_pass") issue(errors, "invalid_route_mode", "$.route_mode", "route_mode must be single_pass.");
  if (!validateOneProviderAdapterConfigDocument(obj["config_document"]).ok) issue(errors, "invalid_config_document", "$.config_document", "config_document must satisfy R24 contract.");
  ["opt_in_present", "command_flag_present", "human_approval_recorded", "api_key_value_available", "network_allowed", "provider_sdk_allowed"].forEach((field) => requireFalse(obj[field], `$.${field}`, errors));
  notes(obj, "$", errors);
  return { ok: errors.length === 0, errors };
}

function validateTrust(input: unknown, path: string, errors: Issues): void {
  const obj = objectAt(input, path, errors); if (!obj) return;
  requireFields(obj, ["config_validity_promotes_trust", "config_presence_enables_opt_in", "stub_execution_promotes_trust", "stub_refusal_is_model_evidence", "provider_slot_selection_promotes_trust", "explicit_opt_in_promotes_trust", "api_key_env_var_name_promotes_trust", "api_key_presence_promotes_trust", "network_success_promotes_trust", "provider_identity_promotes_trust", "successful_provider_response_promotes_trust", "provider_output_is_deterministic_evidence", "raw_provider_output_trust_tier", "schema_valid_provider_output_trust_tier", "max_provider_output_trust_tier", "verified_final_truth_claimed", "requires_hollow_verification_for_t2", "notes"], path, errors);
  ["config_validity_promotes_trust", "config_presence_enables_opt_in", "stub_execution_promotes_trust", "stub_refusal_is_model_evidence", "provider_slot_selection_promotes_trust", "explicit_opt_in_promotes_trust", "api_key_env_var_name_promotes_trust", "api_key_presence_promotes_trust", "network_success_promotes_trust", "provider_identity_promotes_trust", "successful_provider_response_promotes_trust", "provider_output_is_deterministic_evidence", "verified_final_truth_claimed"].forEach((field) => requireFalse(obj[field], `${path}.${field}`, errors));
  if (obj["raw_provider_output_trust_tier"] !== "T0") issue(errors, "invalid_raw_trust_tier", `${path}.raw_provider_output_trust_tier`, "must be T0.");
  if (obj["schema_valid_provider_output_trust_tier"] !== "T1") issue(errors, "invalid_schema_trust_tier", `${path}.schema_valid_provider_output_trust_tier`, "must be T1.");
  if (obj["max_provider_output_trust_tier"] !== "T1") issue(errors, "invalid_max_trust_tier", `${path}.max_provider_output_trust_tier`, "must be T1.");
  requireTrue(obj["requires_hollow_verification_for_t2"], `${path}.requires_hollow_verification_for_t2`, errors);
  notes(obj, path, errors);
}

function validateSafety(input: unknown, path: string, errors: Issues): void {
  const obj = objectAt(input, path, errors); if (!obj) return;
  const fields = ["raw_prompt_blocked", "raw_output_blocked", "api_key_value_blocked", "secrets_blocked", "env_values_blocked", "credentials_blocked", "auth_tokens_blocked", "private_keys_blocked", "process_env_read_blocked", "network_call_blocked", "provider_sdk_blocked", "ledger_write_blocked", "file_write_blocked", "fake_success_blocked", "provider_output_blocked"];
  requireFields(obj, [...fields, "notes"], path, errors);
  fields.forEach((field) => requireTrue(obj[field], `${path}.${field}`, errors));
  notes(obj, path, errors);
}

function validateConfigSummary(input: unknown, path: string, errors: Issues): void {
  const obj = objectAt(input, path, errors); if (!obj) return;
  requireFields(obj, ["config_id", "config_version", "config_status", "provider_slot_id", "real_provider_selected", "provider_specific_behavior_enabled", "opt_in_required", "opt_in_present", "default_runtime_enabled", "api_key_value_read", "network_call_performed_in_config", "live_tests_created_in_config", "ledger_write_allowed_in_config_contract", "storage_write_allowed_in_config_contract", "notes"], path, errors);
  ["config_id", "config_version", "provider_slot_id"].forEach((field) => requireString(obj, field, path, errors));
  requireTrue(obj["opt_in_required"], `${path}.opt_in_required`, errors);
  ["real_provider_selected", "provider_specific_behavior_enabled", "opt_in_present", "default_runtime_enabled", "api_key_value_read", "network_call_performed_in_config", "live_tests_created_in_config", "ledger_write_allowed_in_config_contract", "storage_write_allowed_in_config_contract"].forEach((field) => requireFalse(obj[field], `${path}.${field}`, errors));
  notes(obj, path, errors);
}

export function validateOneProviderAdapterNoNetworkStubResult(input: unknown): OneProviderAdapterNoNetworkStubValidationResult {
  const errors: Issues = [];
  const obj = objectAt(input, "$", errors); if (!obj) return { ok: false, errors };
  rejectBlocked(obj, "$", errors);
  requireFields(obj, ["schema_version", "result_id", "invocation_id", "stub_id", "adapter_id", "provider_slot_id", "provider_id", "provider_kind", "ok", "status", "failure_kind", "capabilities", "health", "config_summary", "trust_summary", "safety_summary", "provider_call_attempted", "network_call_attempted", "provider_sdk_used", "process_env_read", "api_key_value_read", "ledger_write_attempted", "file_write_attempted", "fake_success_returned", "provider_output_returned", "warnings", "errors", "created_at", "notes"], "$", errors);
  requireFalse(obj["ok"], "$.ok", errors);
  if (typeof obj["status"] !== "string" || !resultStatuses.has(obj["status"])) issue(errors, "invalid_status", "$.status", "unsupported result status.");
  if (typeof obj["failure_kind"] !== "string" || !failureKinds.has(obj["failure_kind"])) issue(errors, "invalid_failure_kind", "$.failure_kind", "unsupported failure kind.");
  validateOneProviderAdapterNoNetworkStubCapabilities(obj["capabilities"]).errors.forEach((error) => errors.push({ ...error, path: `$.capabilities${error.path.slice(1)}` }));
  validateOneProviderAdapterNoNetworkStubHealth(obj["health"]).errors.forEach((error) => errors.push({ ...error, path: `$.health${error.path.slice(1)}` }));
  validateConfigSummary(obj["config_summary"], "$.config_summary", errors);
  validateTrust(obj["trust_summary"], "$.trust_summary", errors);
  validateSafety(obj["safety_summary"], "$.safety_summary", errors);
  ["provider_call_attempted", "network_call_attempted", "provider_sdk_used", "process_env_read", "api_key_value_read", "ledger_write_attempted", "file_write_attempted", "fake_success_returned", "provider_output_returned"].forEach((field) => requireFalse(obj[field], `$.${field}`, errors));
  requireArray(obj["warnings"], "$.warnings", errors); requireArray(obj["errors"], "$.errors", errors); notes(obj, "$", errors);
  return { ok: errors.length === 0, errors };
}

export function isOneProviderAdapterNoNetworkStubResult(input: unknown): input is OneProviderAdapterNoNetworkStubResult {
  return validateOneProviderAdapterNoNetworkStubResult(input).ok;
}

export function assertOneProviderAdapterNoNetworkStubResult(input: unknown): OneProviderAdapterNoNetworkStubResult {
  const validation = validateOneProviderAdapterNoNetworkStubResult(input);
  if (!validation.ok) throw new Error(`Invalid OneProviderAdapterNoNetworkStubResult: ${validation.errors.map((error) => `${error.path} ${error.code}`).join("; ")}`);
  return input as OneProviderAdapterNoNetworkStubResult;
}

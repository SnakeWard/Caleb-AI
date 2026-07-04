import type {
  ProviderAdapterNoNetworkStubCapabilities,
  ProviderAdapterNoNetworkStubConfig,
  ProviderAdapterNoNetworkStubHealth,
  ProviderAdapterNoNetworkStubInvocationInput,
  ProviderAdapterNoNetworkStubResult,
  ProviderAdapterNoNetworkStubSafetySummary,
  ProviderAdapterNoNetworkStubTrustSummary,
  ProviderAdapterNoNetworkStubValidationIssue,
  ProviderAdapterNoNetworkStubValidationResult
} from "./types/providerAdapterNoNetworkStubTypes.js";

const stubModes = new Set(["no_network_stub", "disabled_live_stub", "future_live_not_enabled"]);
const stubStatuses = new Set(["future_live_not_enabled", "disabled", "unavailable", "rejected", "validation_failed"]);
const healthStatuses = new Set(["future_live_not_enabled", "disabled", "unavailable"]);
const failureKinds = new Set(["live_network_disabled", "provider_sdk_unavailable", "api_key_not_required", "api_key_not_available", "live_provider_not_enabled", "invalid_request", "redaction_required", "safety_profile_required", "validation_failed"]);
const providerKinds = new Set(["openai_compatible", "anthropic_compatible", "google_compatible", "xai_compatible", "local_compatible", "custom_compatible"]);
const blockedFields = new Set(["raw_prompt_text", "prompt_text", "raw_output_text", "output_text", "api_key", "secret", "env", "environment", "credential", "auth_token", "private_key"]);

const defaultConfig: ProviderAdapterNoNetworkStubConfig = {
  schema_version: "0.1.0",
  stub_id: "provider_adapter_no_network_stub_r21",
  adapter_id: "adapter_r21_no_network_stub",
  adapter_version: "0.1.0",
  mode: "future_live_not_enabled",
  provider_id: "provider_neutral_no_network_stub",
  provider_kind: "custom_compatible",
  network_enabled: false,
  provider_sdk_enabled: false,
  api_key_required: false,
  live_provider_enabled: false,
  allow_mock_compatible_interface: true,
  created_at: "2026-07-03T13:09:30.000Z",
  notes: ["R21 no-network provider adapter stub default config."]
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function issue(code: string, path: string, message: string): ProviderAdapterNoNetworkStubValidationIssue {
  return { code, path, message, severity: "error" };
}

function rejectBlockedTopLevel(input: Record<string, unknown>, errors: ProviderAdapterNoNetworkStubValidationIssue[]): void {
  for (const field of Object.keys(input)) {
    if (blockedFields.has(field.toLowerCase())) errors.push(issue("blocked_top_level_field", `$.${field}`, `${field} is blocked from R21 no-network stub contracts.`));
  }
}

function requireStrings(input: Record<string, unknown>, fields: readonly string[], errors: ProviderAdapterNoNetworkStubValidationIssue[], prefix = "$"): void {
  for (const field of fields) {
    if (!isNonEmptyString(input[field])) errors.push(issue("invalid_required_string", `${prefix}.${field}`, `${field} must be a non-empty string.`));
  }
}

function requireArray(value: unknown, path: string, errors: ProviderAdapterNoNetworkStubValidationIssue[]): value is unknown[] {
  if (!Array.isArray(value)) {
    errors.push(issue("invalid_array", path, `${path} must be an array.`));
    return false;
  }
  return true;
}

function requireBoolean(value: unknown, path: string, errors: ProviderAdapterNoNetworkStubValidationIssue[]): void {
  if (typeof value !== "boolean") errors.push(issue("invalid_boolean", path, `${path} must be boolean.`));
}

function requireTrue(value: unknown, path: string, code: string, errors: ProviderAdapterNoNetworkStubValidationIssue[]): void {
  if (value !== true) errors.push(issue(code, path, `${path} must be true.`));
}

function requireFalse(value: unknown, path: string, code: string, errors: ProviderAdapterNoNetworkStubValidationIssue[]): void {
  if (value !== false) errors.push(issue(code, path, `${path} must be false.`));
}

function validateStringArray(value: unknown, path: string, errors: ProviderAdapterNoNetworkStubValidationIssue[]): void {
  if (!requireArray(value, path, errors)) return;
  for (const [index, item] of value.entries()) {
    if (typeof item !== "string") errors.push(issue("invalid_string_array_item", `${path}.${index}`, "array item must be a string."));
  }
}

function normalizeConfig(config?: Partial<ProviderAdapterNoNetworkStubConfig>): ProviderAdapterNoNetworkStubConfig {
  return { ...defaultConfig, ...config };
}

function validateTrustSummary(value: unknown, path: string, errors: ProviderAdapterNoNetworkStubValidationIssue[]): void {
  if (!isObject(value)) { errors.push(issue("invalid_object", path, `${path} must be an object.`)); return; }
  rejectBlockedTopLevel(value, errors);
  for (const field of ["stub_execution_promotes_trust", "stub_availability_promotes_trust", "provider_identity_promotes_trust", "successful_provider_response_promotes_trust", "provider_output_is_deterministic_evidence", "ledger_presence_promotes_trust", "storage_promotes_trust", "retrieval_promotes_trust", "verified_final_truth_claimed"]) {
    requireFalse(value[field], `${path}.${field}`, "trust_promotion_not_allowed", errors);
  }
  if (value["raw_provider_output_trust_tier"] !== "T0") errors.push(issue("raw_provider_trust_not_t0", `${path}.raw_provider_output_trust_tier`, "raw provider output trust tier must be T0."));
  if (value["schema_valid_provider_output_trust_tier"] !== "T1") errors.push(issue("schema_valid_trust_not_t1", `${path}.schema_valid_provider_output_trust_tier`, "schema-valid provider output trust tier must be T1."));
  if (value["max_allowed_output_trust_tier"] !== "T1") errors.push(issue("max_output_trust_above_t1", `${path}.max_allowed_output_trust_tier`, "max allowed output trust tier must be T1."));
  requireTrue(value["requires_hollow_verification_for_t2"], `${path}.requires_hollow_verification_for_t2`, "hollow_verification_required", errors);
  validateStringArray(value["notes"], `${path}.notes`, errors);
}

function validateSafetySummary(value: unknown, path: string, errors: ProviderAdapterNoNetworkStubValidationIssue[]): void {
  if (!isObject(value)) { errors.push(issue("invalid_object", path, `${path} must be an object.`)); return; }
  rejectBlockedTopLevel(value, errors);
  for (const field of ["redaction_required", "redaction_result_required", "safety_profile_required", "raw_prompt_blocked", "raw_output_blocked", "api_key_blocked", "secrets_blocked", "env_values_blocked", "credentials_blocked", "no_network_enforced", "no_provider_sdk_enforced", "no_ledger_write_enforced", "no_file_write_enforced"]) {
    requireTrue(value[field], `${path}.${field}`, "safety_enforcement_required", errors);
  }
  validateStringArray(value["notes"], `${path}.notes`, errors);
}

export function validateProviderAdapterNoNetworkStubConfig(input: unknown): ProviderAdapterNoNetworkStubValidationResult {
  const errors: ProviderAdapterNoNetworkStubValidationIssue[] = [];
  if (!isObject(input)) return { ok: false, errors: [issue("invalid_root", "$", "ProviderAdapterNoNetworkStubConfig must be an object.")] };
  rejectBlockedTopLevel(input, errors);
  requireStrings(input, ["schema_version", "stub_id", "adapter_id", "adapter_version", "provider_id", "provider_kind", "created_at"], errors);
  if (!stubModes.has(String(input["mode"]))) errors.push(issue("invalid_stub_mode", "$.mode", "mode is not supported by R21."));
  requireFalse(input["network_enabled"], "$.network_enabled", "network_disabled_required", errors);
  requireFalse(input["provider_sdk_enabled"], "$.provider_sdk_enabled", "provider_sdk_disabled_required", errors);
  requireFalse(input["api_key_required"], "$.api_key_required", "api_key_not_required", errors);
  requireFalse(input["live_provider_enabled"], "$.live_provider_enabled", "live_provider_disabled_required", errors);
  requireTrue(input["allow_mock_compatible_interface"], "$.allow_mock_compatible_interface", "mock_interface_required", errors);
  if (!providerKinds.has(String(input["provider_kind"]))) errors.push(issue("invalid_provider_kind", "$.provider_kind", "provider_kind is not supported by the neutral contract."));
  validateStringArray(input["notes"], "$.notes", errors);
  return { ok: errors.length === 0, errors };
}

export function getProviderAdapterNoNetworkStubCapabilities(config?: Partial<ProviderAdapterNoNetworkStubConfig>): ProviderAdapterNoNetworkStubCapabilities {
  const resolved = normalizeConfig(config);
  return {
    schema_version: resolved.schema_version,
    stub_id: resolved.stub_id,
    adapter_id: resolved.adapter_id,
    adapter_version: resolved.adapter_version,
    provider_id: resolved.provider_id,
    provider_kind: resolved.provider_kind,
    supports_live_network: false,
    supports_mock_compatible_interface: true,
    requires_api_key: false,
    imports_provider_sdk: false,
    performs_network_call: false,
    stores_raw_prompt: false,
    stores_raw_output: false,
    writes_ledger_directly: false,
    max_output_trust_tier: "T1",
    created_at: resolved.created_at,
    notes: ["No-network stub capabilities. No live provider behavior."]
  };
}

export function validateProviderAdapterNoNetworkStubCapabilities(input: unknown): ProviderAdapterNoNetworkStubValidationResult {
  const errors: ProviderAdapterNoNetworkStubValidationIssue[] = [];
  if (!isObject(input)) return { ok: false, errors: [issue("invalid_root", "$", "ProviderAdapterNoNetworkStubCapabilities must be an object.")] };
  rejectBlockedTopLevel(input, errors);
  requireStrings(input, ["schema_version", "stub_id", "adapter_id", "adapter_version", "provider_id", "provider_kind", "created_at"], errors);
  requireFalse(input["supports_live_network"], "$.supports_live_network", "live_network_not_supported", errors);
  requireTrue(input["supports_mock_compatible_interface"], "$.supports_mock_compatible_interface", "mock_interface_required", errors);
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

export function getProviderAdapterNoNetworkStubHealth(config?: Partial<ProviderAdapterNoNetworkStubConfig>): ProviderAdapterNoNetworkStubHealth {
  const resolved = normalizeConfig(config);
  return {
    schema_version: resolved.schema_version,
    stub_id: resolved.stub_id,
    adapter_id: resolved.adapter_id,
    provider_id: resolved.provider_id,
    status: resolved.mode === "disabled_live_stub" ? "disabled" : "future_live_not_enabled",
    live_network_available: false,
    provider_sdk_available: false,
    api_key_available: false,
    mock_compatible_interface_available: true,
    checked_at: resolved.created_at,
    warnings: ["Live provider behavior is not enabled in R21."],
    errors: []
  };
}

export function validateProviderAdapterNoNetworkStubHealth(input: unknown): ProviderAdapterNoNetworkStubValidationResult {
  const errors: ProviderAdapterNoNetworkStubValidationIssue[] = [];
  if (!isObject(input)) return { ok: false, errors: [issue("invalid_root", "$", "ProviderAdapterNoNetworkStubHealth must be an object.")] };
  rejectBlockedTopLevel(input, errors);
  requireStrings(input, ["schema_version", "stub_id", "adapter_id", "provider_id", "checked_at"], errors);
  if (!healthStatuses.has(String(input["status"]))) errors.push(issue("invalid_health_status", "$.status", "health status must be future_live_not_enabled, disabled, or unavailable."));
  requireFalse(input["live_network_available"], "$.live_network_available", "live_network_unavailable", errors);
  requireFalse(input["provider_sdk_available"], "$.provider_sdk_available", "provider_sdk_unavailable", errors);
  requireFalse(input["api_key_available"], "$.api_key_available", "api_key_unavailable", errors);
  requireTrue(input["mock_compatible_interface_available"], "$.mock_compatible_interface_available", "mock_interface_available_required", errors);
  validateStringArray(input["warnings"], "$.warnings", errors);
  validateStringArray(input["errors"], "$.errors", errors);
  return { ok: errors.length === 0, errors };
}

export function validateProviderAdapterNoNetworkStubInvocationInput(input: unknown): ProviderAdapterNoNetworkStubValidationResult {
  const errors: ProviderAdapterNoNetworkStubValidationIssue[] = [];
  if (!isObject(input)) return { ok: false, errors: [issue("invalid_root", "$", "ProviderAdapterNoNetworkStubInvocationInput must be an object.")] };
  rejectBlockedTopLevel(input, errors);
  requireStrings(input, ["schema_version", "invocation_id", "stub_id", "adapter_id", "live_adapter_request_ref", "redaction_result_ref", "safety_profile_id", "redaction_policy_id", "prompt_digest", "created_at"], errors);
  if (!isObject(input["live_adapter_request"])) errors.push(issue("invalid_object", "$.live_adapter_request", "live_adapter_request must be an object."));
  requireBoolean(input["output_expected"], "$.output_expected", errors);
  requireFalse(input["raw_prompt_included"], "$.raw_prompt_included", "raw_prompt_not_included", errors);
  requireFalse(input["api_key_included"], "$.api_key_included", "api_key_not_included", errors);
  requireFalse(input["network_allowed"], "$.network_allowed", "network_not_allowed", errors);
  requireFalse(input["provider_sdk_allowed"], "$.provider_sdk_allowed", "provider_sdk_not_allowed", errors);
  validateStringArray(input["notes"], "$.notes", errors);
  return { ok: errors.length === 0, errors };
}

function trustSummary(): ProviderAdapterNoNetworkStubTrustSummary {
  return {
    stub_execution_promotes_trust: false,
    stub_availability_promotes_trust: false,
    provider_identity_promotes_trust: false,
    successful_provider_response_promotes_trust: false,
    provider_output_is_deterministic_evidence: false,
    raw_provider_output_trust_tier: "T0",
    schema_valid_provider_output_trust_tier: "T1",
    max_allowed_output_trust_tier: "T1",
    ledger_presence_promotes_trust: false,
    storage_promotes_trust: false,
    retrieval_promotes_trust: false,
    verified_final_truth_claimed: false,
    requires_hollow_verification_for_t2: true,
    notes: ["Stub refusal is not model evidence."]
  };
}

function safetySummary(): ProviderAdapterNoNetworkStubSafetySummary {
  return {
    redaction_required: true,
    redaction_result_required: true,
    safety_profile_required: true,
    raw_prompt_blocked: true,
    raw_output_blocked: true,
    api_key_blocked: true,
    secrets_blocked: true,
    env_values_blocked: true,
    credentials_blocked: true,
    no_network_enforced: true,
    no_provider_sdk_enforced: true,
    no_ledger_write_enforced: true,
    no_file_write_enforced: true,
    notes: ["R21 stub returns refs, status, and summaries only."]
  };
}

export function validateProviderAdapterNoNetworkStubResult(input: unknown): ProviderAdapterNoNetworkStubValidationResult {
  const errors: ProviderAdapterNoNetworkStubValidationIssue[] = [];
  if (!isObject(input)) return { ok: false, errors: [issue("invalid_root", "$", "ProviderAdapterNoNetworkStubResult must be an object.")] };
  rejectBlockedTopLevel(input, errors);
  requireStrings(input, ["schema_version", "result_id", "invocation_id", "stub_id", "adapter_id", "provider_id", "provider_kind", "created_at"], errors);
  requireFalse(input["ok"], "$.ok", "stub_result_must_not_be_success", errors);
  if (!stubStatuses.has(String(input["status"]))) errors.push(issue("invalid_stub_status", "$.status", "status is not supported by R21."));
  if (!failureKinds.has(String(input["failure_kind"]))) errors.push(issue("invalid_failure_kind", "$.failure_kind", "failure_kind is not supported by R21."));
  validateProviderAdapterNoNetworkStubCapabilities(input["capabilities"]).errors.forEach((error) => errors.push({ ...error, path: `$.capabilities${error.path.slice(1)}` }));
  validateProviderAdapterNoNetworkStubHealth(input["health"]).errors.forEach((error) => errors.push({ ...error, path: `$.health${error.path.slice(1)}` }));
  validateTrustSummary(input["trust_summary"], "$.trust_summary", errors);
  validateSafetySummary(input["safety_summary"], "$.safety_summary", errors);
  if ("successful_provider_response" in input) errors.push(issue("successful_provider_response_blocked", "$.successful_provider_response", "R21 stub must not contain a successful provider response."));
  validateStringArray(input["warnings"], "$.warnings", errors);
  validateStringArray(input["errors"], "$.errors", errors);
  validateStringArray(input["notes"], "$.notes", errors);
  return { ok: errors.length === 0, errors };
}

export function invokeProviderAdapterNoNetworkStub(input: unknown, config?: Partial<ProviderAdapterNoNetworkStubConfig>): ProviderAdapterNoNetworkStubResult {
  const resolved = normalizeConfig(config);
  const validation = validateProviderAdapterNoNetworkStubInvocationInput(input);
  const invocationId = isObject(input) && isNonEmptyString(input["invocation_id"]) ? input["invocation_id"] : "invalid_invocation";
  const status: ProviderAdapterNoNetworkStubResult["status"] = validation.ok ? "future_live_not_enabled" : "validation_failed";
  const failureKind: ProviderAdapterNoNetworkStubResult["failure_kind"] = validation.ok ? "live_provider_not_enabled" : "validation_failed";
  return {
    schema_version: resolved.schema_version,
    result_id: `result_${invocationId}`,
    invocation_id: invocationId,
    stub_id: resolved.stub_id,
    adapter_id: resolved.adapter_id,
    provider_id: resolved.provider_id,
    provider_kind: resolved.provider_kind,
    ok: false,
    status,
    failure_kind: failureKind,
    capabilities: getProviderAdapterNoNetworkStubCapabilities(resolved),
    health: getProviderAdapterNoNetworkStubHealth(resolved),
    trust_summary: trustSummary(),
    safety_summary: safetySummary(),
    warnings: ["R21 no-network stub refused live provider execution."],
    errors: validation.ok ? [] : validation.errors.map((error) => `${error.path} ${error.code}`),
    created_at: resolved.created_at,
    notes: ["No provider output, fake model text, SDK call, network call, Ledger write, or file write was produced."]
  };
}

export function createProviderAdapterNoNetworkStub(config?: Partial<ProviderAdapterNoNetworkStubConfig>) {
  const resolved = normalizeConfig(config);
  return {
    capabilities: () => getProviderAdapterNoNetworkStubCapabilities(resolved),
    health: () => getProviderAdapterNoNetworkStubHealth(resolved),
    invoke: (input: unknown) => invokeProviderAdapterNoNetworkStub(input, resolved)
  };
}

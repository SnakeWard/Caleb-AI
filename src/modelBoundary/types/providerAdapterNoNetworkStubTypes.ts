import type { LiveAdapterProviderKind, LiveAdapterRequest } from "./liveAdapterTypes.js";

export type ProviderAdapterNoNetworkStubSchemaVersion = "0.1.0" | string;
export type ProviderAdapterNoNetworkStubId = string;
export type ProviderAdapterNoNetworkStubMode = "no_network_stub" | "disabled_live_stub" | "future_live_not_enabled";
export type ProviderAdapterNoNetworkStubStatus = "future_live_not_enabled" | "disabled" | "unavailable" | "rejected" | "validation_failed";
export type ProviderAdapterNoNetworkStubFailureKind =
  | "live_network_disabled"
  | "provider_sdk_unavailable"
  | "api_key_not_required"
  | "api_key_not_available"
  | "live_provider_not_enabled"
  | "invalid_request"
  | "redaction_required"
  | "safety_profile_required"
  | "validation_failed";

export interface ProviderAdapterNoNetworkStubConfig {
  readonly schema_version: ProviderAdapterNoNetworkStubSchemaVersion;
  readonly stub_id: ProviderAdapterNoNetworkStubId;
  readonly adapter_id: string;
  readonly adapter_version: string;
  readonly mode: ProviderAdapterNoNetworkStubMode;
  readonly provider_id: string;
  readonly provider_kind: LiveAdapterProviderKind | string;
  readonly network_enabled: false;
  readonly provider_sdk_enabled: false;
  readonly api_key_required: false;
  readonly live_provider_enabled: false;
  readonly allow_mock_compatible_interface: true;
  readonly created_at: string;
  readonly notes: readonly string[];
}

export interface ProviderAdapterNoNetworkStubCapabilities {
  readonly schema_version: ProviderAdapterNoNetworkStubSchemaVersion;
  readonly stub_id: ProviderAdapterNoNetworkStubId;
  readonly adapter_id: string;
  readonly adapter_version: string;
  readonly provider_id: string;
  readonly provider_kind: LiveAdapterProviderKind | string;
  readonly supports_live_network: false;
  readonly supports_mock_compatible_interface: true;
  readonly requires_api_key: false;
  readonly imports_provider_sdk: false;
  readonly performs_network_call: false;
  readonly stores_raw_prompt: false;
  readonly stores_raw_output: false;
  readonly writes_ledger_directly: false;
  readonly max_output_trust_tier: "T1";
  readonly created_at: string;
  readonly notes: readonly string[];
}

export interface ProviderAdapterNoNetworkStubHealth {
  readonly schema_version: ProviderAdapterNoNetworkStubSchemaVersion;
  readonly stub_id: ProviderAdapterNoNetworkStubId;
  readonly adapter_id: string;
  readonly provider_id: string;
  readonly status: Extract<ProviderAdapterNoNetworkStubStatus, "future_live_not_enabled" | "disabled" | "unavailable">;
  readonly live_network_available: false;
  readonly provider_sdk_available: false;
  readonly api_key_available: false;
  readonly mock_compatible_interface_available: true;
  readonly checked_at: string;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
}

export interface ProviderAdapterNoNetworkStubInvocationInput {
  readonly schema_version: ProviderAdapterNoNetworkStubSchemaVersion;
  readonly invocation_id: string;
  readonly stub_id: ProviderAdapterNoNetworkStubId;
  readonly adapter_id: string;
  readonly live_adapter_request_ref: string;
  readonly live_adapter_request: LiveAdapterRequest | Readonly<Record<string, unknown>>;
  readonly redaction_result_ref: string;
  readonly safety_profile_id: string;
  readonly redaction_policy_id: string;
  readonly prompt_digest: string;
  readonly output_expected: boolean;
  readonly raw_prompt_included: false;
  readonly api_key_included: false;
  readonly network_allowed: false;
  readonly provider_sdk_allowed: false;
  readonly created_at: string;
  readonly notes: readonly string[];
}

export interface ProviderAdapterNoNetworkStubTrustSummary {
  readonly stub_execution_promotes_trust: false;
  readonly stub_availability_promotes_trust: false;
  readonly provider_identity_promotes_trust: false;
  readonly successful_provider_response_promotes_trust: false;
  readonly provider_output_is_deterministic_evidence: false;
  readonly raw_provider_output_trust_tier: "T0";
  readonly schema_valid_provider_output_trust_tier: "T1";
  readonly max_allowed_output_trust_tier: "T1";
  readonly ledger_presence_promotes_trust: false;
  readonly storage_promotes_trust: false;
  readonly retrieval_promotes_trust: false;
  readonly verified_final_truth_claimed: false;
  readonly requires_hollow_verification_for_t2: true;
  readonly notes: readonly string[];
}

export interface ProviderAdapterNoNetworkStubSafetySummary {
  readonly redaction_required: true;
  readonly redaction_result_required: true;
  readonly safety_profile_required: true;
  readonly raw_prompt_blocked: true;
  readonly raw_output_blocked: true;
  readonly api_key_blocked: true;
  readonly secrets_blocked: true;
  readonly env_values_blocked: true;
  readonly credentials_blocked: true;
  readonly no_network_enforced: true;
  readonly no_provider_sdk_enforced: true;
  readonly no_ledger_write_enforced: true;
  readonly no_file_write_enforced: true;
  readonly notes: readonly string[];
}

export interface ProviderAdapterNoNetworkStubResult {
  readonly schema_version: ProviderAdapterNoNetworkStubSchemaVersion;
  readonly result_id: string;
  readonly invocation_id: string;
  readonly stub_id: ProviderAdapterNoNetworkStubId;
  readonly adapter_id: string;
  readonly provider_id: string;
  readonly provider_kind: LiveAdapterProviderKind | string;
  readonly ok: false;
  readonly status: ProviderAdapterNoNetworkStubStatus;
  readonly failure_kind: ProviderAdapterNoNetworkStubFailureKind;
  readonly capabilities: ProviderAdapterNoNetworkStubCapabilities;
  readonly health: ProviderAdapterNoNetworkStubHealth;
  readonly trust_summary: ProviderAdapterNoNetworkStubTrustSummary;
  readonly safety_summary: ProviderAdapterNoNetworkStubSafetySummary;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly created_at: string;
  readonly notes: readonly string[];
}

export interface ProviderAdapterNoNetworkStubValidationIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
  readonly severity: "error" | "warning";
}

export interface ProviderAdapterNoNetworkStubValidationResult {
  readonly ok: boolean;
  readonly errors: readonly ProviderAdapterNoNetworkStubValidationIssue[];
}

import type { OneProviderAdapterConfigDocument } from "./oneProviderAdapterConfigContractTypes.js";

export type OneProviderAdapterNoNetworkStubSchemaVersion = "0.1.0" | string;

export type OneProviderAdapterNoNetworkStubStatus =
  | "ready_no_network"
  | "future_live_not_enabled"
  | "config_invalid"
  | "provider_not_selected"
  | "provider_not_allowlisted"
  | "missing_opt_in"
  | "missing_api_key"
  | "redaction_required"
  | "safety_profile_required"
  | "rejected"
  | "validation_failed";

export type OneProviderAdapterNoNetworkStubFailureKind =
  | "none"
  | "config_invalid"
  | "live_provider_not_enabled"
  | "provider_not_selected"
  | "provider_not_allowlisted"
  | "missing_opt_in"
  | "missing_api_key"
  | "redaction_required"
  | "safety_profile_required"
  | "network_disabled"
  | "provider_sdk_unavailable"
  | "fake_success_blocked"
  | "validation_failed";

export interface OneProviderAdapterNoNetworkStubCapabilities {
  readonly schema_version: OneProviderAdapterNoNetworkStubSchemaVersion;
  readonly stub_id: string;
  readonly adapter_id: string;
  readonly adapter_version: string;
  readonly provider_slot_id: string;
  readonly provider_id: string;
  readonly provider_kind: string;
  readonly consumes_config_contract: boolean;
  readonly supports_no_network_invocation: boolean;
  readonly supports_live_network: boolean;
  readonly supports_provider_sdk: boolean;
  readonly requires_api_key_value: boolean;
  readonly reads_process_env: boolean;
  readonly reads_api_key_value: boolean;
  readonly performs_network_call: boolean;
  readonly writes_ledger: boolean;
  readonly writes_files: boolean;
  readonly returns_provider_output: boolean;
  readonly returns_fake_success: boolean;
  readonly max_output_trust_tier: "T1" | string;
  readonly created_at: string;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterNoNetworkStubHealth {
  readonly schema_version: OneProviderAdapterNoNetworkStubSchemaVersion;
  readonly stub_id: string;
  readonly adapter_id: string;
  readonly provider_slot_id: string;
  readonly status: OneProviderAdapterNoNetworkStubStatus | string;
  readonly config_contract_available: boolean;
  readonly config_valid: boolean;
  readonly live_provider_enabled: boolean;
  readonly network_available: boolean;
  readonly provider_sdk_available: boolean;
  readonly api_key_value_available: boolean;
  readonly process_env_read: boolean;
  readonly provider_selected: boolean;
  readonly provider_allowlisted: boolean;
  readonly opt_in_present: boolean;
  readonly checked_at: string;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly notes: readonly string[];
}

export interface OneProviderAdapterNoNetworkStubInvocation {
  readonly schema_version: OneProviderAdapterNoNetworkStubSchemaVersion;
  readonly invocation_id: string;
  readonly stub_id: string;
  readonly adapter_id: string;
  readonly config_ref: string;
  readonly config_document: OneProviderAdapterConfigDocument;
  readonly route_mode: "single_pass" | string;
  readonly request_ref: string;
  readonly request_digest: string;
  readonly redaction_result_ref: string;
  readonly safety_profile_id: string;
  readonly opt_in_present: boolean;
  readonly command_flag_present: boolean;
  readonly human_approval_recorded: boolean;
  readonly provider_allowlisted: boolean;
  readonly api_key_value_available: boolean;
  readonly network_allowed: boolean;
  readonly provider_sdk_allowed: boolean;
  readonly created_at: string;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterNoNetworkStubTrustSummary {
  readonly config_validity_promotes_trust: boolean;
  readonly config_presence_enables_opt_in: boolean;
  readonly stub_execution_promotes_trust: boolean;
  readonly stub_refusal_is_model_evidence: boolean;
  readonly provider_slot_selection_promotes_trust: boolean;
  readonly explicit_opt_in_promotes_trust: boolean;
  readonly api_key_env_var_name_promotes_trust: boolean;
  readonly api_key_presence_promotes_trust: boolean;
  readonly network_success_promotes_trust: boolean;
  readonly provider_identity_promotes_trust: boolean;
  readonly successful_provider_response_promotes_trust: boolean;
  readonly provider_output_is_deterministic_evidence: boolean;
  readonly raw_provider_output_trust_tier: "T0" | string;
  readonly schema_valid_provider_output_trust_tier: "T1" | string;
  readonly max_provider_output_trust_tier: "T1" | string;
  readonly verified_final_truth_claimed: boolean;
  readonly requires_hollow_verification_for_t2: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterNoNetworkStubSafetySummary {
  readonly raw_prompt_blocked: boolean;
  readonly raw_output_blocked: boolean;
  readonly api_key_value_blocked: boolean;
  readonly secrets_blocked: boolean;
  readonly env_values_blocked: boolean;
  readonly credentials_blocked: boolean;
  readonly auth_tokens_blocked: boolean;
  readonly private_keys_blocked: boolean;
  readonly process_env_read_blocked: boolean;
  readonly network_call_blocked: boolean;
  readonly provider_sdk_blocked: boolean;
  readonly ledger_write_blocked: boolean;
  readonly file_write_blocked: boolean;
  readonly fake_success_blocked: boolean;
  readonly provider_output_blocked: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterNoNetworkStubConfigSummary {
  readonly config_id: string;
  readonly config_version: string;
  readonly config_status: string;
  readonly provider_slot_id: string;
  readonly real_provider_selected: boolean;
  readonly provider_specific_behavior_enabled: boolean;
  readonly opt_in_required: boolean;
  readonly opt_in_present: boolean;
  readonly default_runtime_enabled: boolean;
  readonly api_key_value_read: boolean;
  readonly network_call_performed_in_config: boolean;
  readonly live_tests_created_in_config: boolean;
  readonly ledger_write_allowed_in_config_contract: boolean;
  readonly storage_write_allowed_in_config_contract: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterNoNetworkStubResult {
  readonly schema_version: OneProviderAdapterNoNetworkStubSchemaVersion;
  readonly result_id: string;
  readonly invocation_id: string;
  readonly stub_id: string;
  readonly adapter_id: string;
  readonly provider_slot_id: string;
  readonly provider_id: string;
  readonly provider_kind: string;
  readonly ok: boolean;
  readonly status: OneProviderAdapterNoNetworkStubStatus | string;
  readonly failure_kind: OneProviderAdapterNoNetworkStubFailureKind | string;
  readonly capabilities: OneProviderAdapterNoNetworkStubCapabilities;
  readonly health: OneProviderAdapterNoNetworkStubHealth;
  readonly config_summary: OneProviderAdapterNoNetworkStubConfigSummary;
  readonly trust_summary: OneProviderAdapterNoNetworkStubTrustSummary;
  readonly safety_summary: OneProviderAdapterNoNetworkStubSafetySummary;
  readonly provider_call_attempted: boolean;
  readonly network_call_attempted: boolean;
  readonly provider_sdk_used: boolean;
  readonly process_env_read: boolean;
  readonly api_key_value_read: boolean;
  readonly ledger_write_attempted: boolean;
  readonly file_write_attempted: boolean;
  readonly fake_success_returned: boolean;
  readonly provider_output_returned: boolean;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly created_at: string;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterNoNetworkStubValidationIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
  readonly severity: "error" | "warning";
}

export interface OneProviderAdapterNoNetworkStubValidationResult {
  readonly ok: boolean;
  readonly errors: readonly OneProviderAdapterNoNetworkStubValidationIssue[];
}

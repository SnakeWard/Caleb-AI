export type OneProviderAdapterConfigContractSchemaVersion = "0.1.0" | string;

export type OneProviderAdapterConfigStatus =
  | "config_valid_disabled"
  | "config_valid_opt_in_required"
  | "config_rejected"
  | "config_invalid"
  | "future_live_not_enabled";

export type OneProviderAdapterConfigSourceKind =
  | "static_fixture"
  | "checked_in_example"
  | "future_external_config"
  | "future_runtime_supplied";

export interface OneProviderAdapterConfigProviderSlot {
  readonly provider_slot_id: "first_provider_slot" | string;
  readonly provider_id: string;
  readonly provider_kind: string;
  readonly provider_selected: boolean;
  readonly provider_selection_authorized: boolean;
  readonly real_provider_selected: boolean;
  readonly provider_specific_behavior_enabled: boolean;
  readonly provider_slot_selection_promotes_trust: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterConfigOptIn {
  readonly explicit_opt_in_required: boolean;
  readonly opt_in_env_var_name: string;
  readonly opt_in_value_required: boolean | string;
  readonly opt_in_value_present: boolean;
  readonly opt_in_enabled_by_default: boolean;
  readonly explicit_command_flag_required: boolean;
  readonly explicit_command_flag_name: string;
  readonly explicit_command_flag_present: boolean;
  readonly human_approval_required: boolean;
  readonly human_approval_recorded: boolean;
  readonly opt_in_promotes_trust: boolean;
  readonly missing_opt_in_failure_kind: "live_provider_not_enabled" | "adapter_unavailable" | string;
  readonly fake_success_allowed: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterConfigAllowlist {
  readonly provider_allowlist_required: boolean;
  readonly provider_allowlist_present: boolean;
  readonly allowed_provider_ids: readonly string[];
  readonly allowed_provider_kinds: readonly string[];
  readonly provider_not_allowlisted_failure_kind: "provider_not_allowlisted" | string;
  readonly allowlist_values_are_secret: boolean;
  readonly allowlist_promotes_trust: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterConfigApiKeyRef {
  readonly api_key_required_for_live: boolean;
  readonly api_key_env_var_name: string;
  readonly api_key_env_var_name_is_secret: boolean;
  readonly api_key_value_present: boolean;
  readonly api_key_value_read: boolean;
  readonly api_key_value_stored: boolean;
  readonly api_key_value_logged: boolean;
  readonly api_key_value_written_to_ledger: boolean;
  readonly api_key_value_written_to_storage: boolean;
  readonly api_key_value_allowed_in_fixtures: boolean;
  readonly api_key_presence_promotes_trust: boolean;
  readonly missing_api_key_failure_kind: "missing_api_key" | "adapter_unavailable" | string;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterConfigNetwork {
  readonly network_calls_allowed_by_default: boolean;
  readonly network_calls_require_opt_in: boolean;
  readonly network_available_in_r24: boolean;
  readonly network_call_performed_in_r24: boolean;
  readonly default_unit_tests_offline: boolean;
  readonly default_acceptance_tests_offline: boolean;
  readonly live_tests_opt_in_only: boolean;
  readonly live_tests_skipped_by_default: boolean;
  readonly network_success_promotes_trust: boolean;
  readonly network_failure_normalized: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterConfigTimeoutRetry {
  readonly timeout_required: boolean;
  readonly timeout_ms: number;
  readonly retry_count: number;
  readonly max_retry_count: number;
  readonly retry_count_recorded: boolean;
  readonly unbounded_retries_allowed: boolean;
  readonly silent_retry_allowed: boolean;
  readonly timeout_failure_kind: "provider_timeout" | string;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterConfigCostGuard {
  readonly cost_guard_required: boolean;
  readonly max_live_requests_per_test: number;
  readonly max_output_tokens: number;
  readonly max_cost_units_per_run: number;
  readonly cost_warning_required: boolean;
  readonly cost_stop_condition_required: boolean;
  readonly background_live_calls_allowed: boolean;
  readonly cost_limit_exceeded_failure_kind: "cost_limit_exceeded" | string;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterConfigLiveTestGate {
  readonly live_tests_created_in_r24: boolean;
  readonly live_tests_allowed_in_default_run: boolean;
  readonly live_tests_require_opt_in_flag: boolean;
  readonly live_tests_require_api_key: boolean;
  readonly live_tests_require_provider_allowlist: boolean;
  readonly live_tests_skipped_by_default: boolean;
  readonly live_tests_can_run_in_ci_by_default: boolean;
  readonly test_fixtures_may_contain_secrets: boolean;
  readonly test_fixtures_may_contain_api_keys: boolean;
  readonly test_fixtures_may_contain_raw_prompt: boolean;
  readonly test_fixtures_may_contain_raw_output: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterConfigRedaction {
  readonly redaction_policy_required: boolean;
  readonly redaction_manifest_required: boolean;
  readonly redaction_result_required: boolean;
  readonly raw_prompt_allowed: boolean;
  readonly raw_output_allowed: boolean;
  readonly raw_transcript_storage_allowed: boolean;
  readonly redaction_promotes_trust: boolean;
  readonly redaction_metadata_promotes_trust: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterConfigSafetyProfile {
  readonly safety_profile_required: boolean;
  readonly safety_profile_id: string;
  readonly safety_profile_present: boolean;
  readonly missing_safety_profile_failure_kind: "safety_profile_required" | string;
  readonly safety_profile_promotes_trust: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterConfigLedger {
  readonly ledger_provenance_required: boolean;
  readonly ledger_write_allowed_in_config_contract: boolean;
  readonly raw_prompt_written_to_ledger: boolean;
  readonly raw_output_written_to_ledger: boolean;
  readonly api_key_written_to_ledger: boolean;
  readonly secrets_written_to_ledger: boolean;
  readonly env_values_written_to_ledger: boolean;
  readonly refs_digests_statuses_allowed: boolean;
  readonly ledger_write_promotes_trust: boolean;
  readonly ledger_presence_promotes_trust: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterConfigRuntimeStorage {
  readonly runtime_storage_contract_required: boolean;
  readonly storage_write_allowed_in_config_contract: boolean;
  readonly persistent_transcript_storage_allowed: boolean;
  readonly raw_provider_output_storage_tier: "T0" | string;
  readonly schema_valid_provider_output_storage_tier: "T1" | string;
  readonly storage_promotes_trust: boolean;
  readonly retrieval_promotes_trust: boolean;
  readonly persistence_is_verification: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterConfigTrustCap {
  readonly raw_provider_output_trust_tier: "T0" | string;
  readonly schema_valid_provider_output_trust_tier: "T1" | string;
  readonly max_provider_output_trust_tier: "T1" | string;
  readonly config_validity_promotes_trust: boolean;
  readonly config_presence_promotes_opt_in: boolean;
  readonly provider_slot_selection_promotes_trust: boolean;
  readonly explicit_opt_in_promotes_trust: boolean;
  readonly api_key_env_var_name_promotes_trust: boolean;
  readonly api_key_presence_promotes_trust: boolean;
  readonly network_success_promotes_trust: boolean;
  readonly provider_identity_promotes_trust: boolean;
  readonly successful_provider_response_promotes_trust: boolean;
  readonly provider_output_is_deterministic_evidence: boolean;
  readonly verified_final_truth_claimed: boolean;
  readonly requires_hollow_verification_for_t2: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterConfigKillSwitch {
  readonly kill_switch_required: boolean;
  readonly kill_switch_env_var_name: string;
  readonly kill_switch_value_required_for_live: boolean | string;
  readonly kill_switch_enabled_by_default: boolean;
  readonly provider_allowlist_required: boolean;
  readonly safe_refusal_when_disabled: boolean;
  readonly safe_refusal_when_not_allowlisted: boolean;
  readonly safe_refusal_when_api_key_missing: boolean;
  readonly safe_refusal_when_redaction_missing: boolean;
  readonly safe_refusal_when_safety_profile_missing: boolean;
  readonly rollback_instructions_required: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterConfigRefusal {
  readonly refusal_id: string;
  readonly config_status: OneProviderAdapterConfigStatus | string;
  readonly refusal_kind: string;
  readonly ok: boolean;
  readonly fake_success_returned: boolean;
  readonly provider_call_attempted: boolean;
  readonly network_call_attempted: boolean;
  readonly api_key_value_read: boolean;
  readonly trust_promoted: boolean;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly notes: readonly string[];
}

export interface OneProviderAdapterConfigDocument {
  readonly schema_version: OneProviderAdapterConfigContractSchemaVersion;
  readonly config_id: string;
  readonly config_version: string;
  readonly config_status: OneProviderAdapterConfigStatus;
  readonly config_source_kind: OneProviderAdapterConfigSourceKind;
  readonly provider_slot: OneProviderAdapterConfigProviderSlot;
  readonly opt_in: OneProviderAdapterConfigOptIn;
  readonly allowlist: OneProviderAdapterConfigAllowlist;
  readonly api_key_ref: OneProviderAdapterConfigApiKeyRef;
  readonly network: OneProviderAdapterConfigNetwork;
  readonly timeout_retry: OneProviderAdapterConfigTimeoutRetry;
  readonly cost_guard: OneProviderAdapterConfigCostGuard;
  readonly live_test_gate: OneProviderAdapterConfigLiveTestGate;
  readonly redaction: OneProviderAdapterConfigRedaction;
  readonly safety_profile: OneProviderAdapterConfigSafetyProfile;
  readonly ledger: OneProviderAdapterConfigLedger;
  readonly runtime_storage: OneProviderAdapterConfigRuntimeStorage;
  readonly trust_cap: OneProviderAdapterConfigTrustCap;
  readonly kill_switch: OneProviderAdapterConfigKillSwitch;
  readonly refusal: OneProviderAdapterConfigRefusal;
  readonly created_at: string;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterConfigValidationIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
  readonly severity: "error" | "warning";
}

export interface OneProviderAdapterConfigValidationResult {
  readonly ok: boolean;
  readonly errors: readonly OneProviderAdapterConfigValidationIssue[];
}

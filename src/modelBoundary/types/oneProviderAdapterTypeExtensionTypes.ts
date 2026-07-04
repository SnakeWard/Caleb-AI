export type OneProviderAdapterTypeExtensionSchemaVersion = "0.1.0" | string;
export type OneProviderAdapterSlotId = "first_provider_slot";

export interface OneProviderAdapterProviderSelection {
  readonly schema_version: OneProviderAdapterTypeExtensionSchemaVersion;
  readonly provider_slot_id: OneProviderAdapterSlotId;
  readonly provider_id: string;
  readonly provider_kind: string;
  readonly provider_selected: boolean;
  readonly provider_selection_authorized: boolean;
  readonly provider_selection_notes: readonly string[];
  readonly created_at: string;
}

export interface OneProviderAdapterOptInGate {
  readonly opt_in_required: boolean;
  readonly opt_in_env_var_name: string;
  readonly opt_in_env_var_value_required: boolean | string;
  readonly provider_allowlist_required: boolean;
  readonly adapter_id_required: boolean;
  readonly explicit_command_flag_required: boolean;
  readonly human_approval_required: boolean;
  readonly default_runtime_enabled: boolean;
  readonly missing_opt_in_failure_kind: "live_provider_not_enabled" | "adapter_unavailable" | string;
  readonly fake_success_allowed: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterAllowlist {
  readonly allowlist_required: boolean;
  readonly allowed_provider_ids: readonly string[];
  readonly allowed_provider_kinds: readonly string[];
  readonly provider_not_allowlisted_failure_kind: "provider_not_allowlisted" | string;
  readonly allowlist_values_are_secrets: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterApiKeyRef {
  readonly api_key_required_for_live: boolean;
  readonly api_key_env_var_name: string;
  readonly api_key_value_present: boolean;
  readonly api_key_value_stored: boolean;
  readonly api_key_value_logged: boolean;
  readonly api_key_value_written_to_ledger: boolean;
  readonly api_key_value_written_to_storage: boolean;
  readonly api_key_value_allowed_in_fixtures: boolean;
  readonly missing_api_key_failure_kind: "missing_api_key" | "adapter_unavailable" | string;
  readonly api_key_presence_promotes_trust: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterNetworkPolicy {
  readonly network_calls_allowed_by_default: boolean;
  readonly network_calls_require_opt_in: boolean;
  readonly default_unit_tests_offline: boolean;
  readonly default_acceptance_tests_offline: boolean;
  readonly live_tests_opt_in_only: boolean;
  readonly live_tests_skipped_by_default: boolean;
  readonly network_success_promotes_trust: boolean;
  readonly network_failure_normalized: boolean;
  readonly timeout_required: boolean;
  readonly retries_bounded: boolean;
  readonly costs_bounded: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterTimeoutRetryPolicy {
  readonly timeout_ms: number;
  readonly retry_count: number;
  readonly retry_backoff_strategy: string;
  readonly unbounded_retries_allowed: boolean;
  readonly silent_retry_allowed: boolean;
  readonly retry_count_recorded: boolean;
  readonly provider_timeout_failure_kind: "provider_timeout" | string;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterCostGuard {
  readonly cost_guard_required: boolean;
  readonly max_live_requests_per_test: number;
  readonly max_output_tokens: number;
  readonly max_retry_count: number;
  readonly background_live_calls_allowed: boolean;
  readonly cost_limit_exceeded_failure_kind: "cost_limit_exceeded" | string;
  readonly cost_notes: readonly string[];
}

export interface OneProviderAdapterLiveTestGate {
  readonly live_tests_allowed_in_default_run: boolean;
  readonly live_tests_require_opt_in_flag: boolean;
  readonly live_tests_require_api_key: boolean;
  readonly live_tests_require_provider_allowlist: boolean;
  readonly live_tests_skipped_by_default: boolean;
  readonly live_tests_label: string;
  readonly live_tests_can_run_in_ci_by_default: boolean;
  readonly test_fixtures_may_contain_secrets: boolean;
  readonly test_fixtures_may_contain_raw_prompt: boolean;
  readonly test_fixtures_may_contain_raw_output: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterRequestMapping {
  readonly maps_from_live_adapter_request: boolean;
  readonly provider_specific_request_shape_defined: boolean;
  readonly raw_prompt_forwarding_allowed: boolean;
  readonly prompt_digest_required: boolean;
  readonly redaction_result_required: boolean;
  readonly safety_profile_required: boolean;
  readonly evidence_refs_supported: boolean;
  readonly context_refs_supported: boolean;
  readonly secrets_in_payload_allowed: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterResponseMapping {
  readonly maps_to_live_adapter_response: boolean;
  readonly provider_specific_response_shape_defined: boolean;
  readonly raw_output_storage_allowed: boolean;
  readonly output_digest_required: boolean;
  readonly output_ref_required: boolean;
  readonly token_usage_recorded_if_available: boolean;
  readonly latency_recorded_if_available: boolean;
  readonly finish_reason_recorded_if_available: boolean;
  readonly successful_response_promotes_trust: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterFailureMapping {
  readonly failure_kinds_supported: readonly string[];
  readonly missing_opt_in_maps_to: string;
  readonly provider_not_allowlisted_maps_to: string;
  readonly missing_api_key_maps_to: string;
  readonly network_disabled_maps_to: string;
  readonly provider_timeout_maps_to: string;
  readonly provider_rate_limited_maps_to: string;
  readonly provider_auth_failed_maps_to: string;
  readonly provider_rejected_request_maps_to: string;
  readonly provider_malformed_response_maps_to: string;
  readonly response_validation_failed_maps_to: string;
  readonly cost_limit_exceeded_maps_to: string;
  readonly unknown_provider_error_maps_to: string;
  readonly failures_claim_verified_truth: boolean;
  readonly failures_promote_trust: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterRedactionCompatibility {
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

export interface OneProviderAdapterLedgerCompatibility {
  readonly ledger_provenance_required: boolean;
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

export interface OneProviderAdapterStorageCompatibility {
  readonly runtime_storage_contract_required: boolean;
  readonly persistent_transcript_storage_allowed: boolean;
  readonly raw_provider_output_storage_tier: "T0" | string;
  readonly schema_valid_provider_output_storage_tier: "T1" | string;
  readonly storage_promotes_trust: boolean;
  readonly retrieval_promotes_trust: boolean;
  readonly persistence_is_verification: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterTrustCap {
  readonly raw_provider_output_trust_tier: "T0" | string;
  readonly schema_valid_provider_output_trust_tier: "T1" | string;
  readonly max_provider_output_trust_tier: "T1" | string;
  readonly provider_slot_selection_promotes_trust: boolean;
  readonly explicit_opt_in_promotes_trust: boolean;
  readonly api_key_presence_promotes_trust: boolean;
  readonly network_success_promotes_trust: boolean;
  readonly provider_identity_promotes_trust: boolean;
  readonly successful_provider_response_promotes_trust: boolean;
  readonly provider_output_is_deterministic_evidence: boolean;
  readonly verified_final_truth_claimed: boolean;
  readonly requires_hollow_verification_for_t2: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterRollbackPlan {
  readonly kill_switch_required: boolean;
  readonly kill_switch_env_var_name: string;
  readonly provider_allowlist_required: boolean;
  readonly safe_refusal_when_disabled: boolean;
  readonly safe_refusal_when_not_allowlisted: boolean;
  readonly safe_refusal_when_api_key_missing: boolean;
  readonly safe_refusal_when_redaction_missing: boolean;
  readonly safe_refusal_when_safety_profile_missing: boolean;
  readonly rollback_instructions_required: boolean;
  readonly stop_conditions: readonly string[];
  readonly notes: readonly string[];
}

export interface OneProviderAdapterConfig {
  readonly schema_version: OneProviderAdapterTypeExtensionSchemaVersion;
  readonly config_id: string;
  readonly provider_slot_id: OneProviderAdapterSlotId;
  readonly adapter_id: string;
  readonly adapter_version: string;
  readonly provider_selection: OneProviderAdapterProviderSelection;
  readonly opt_in_gate: OneProviderAdapterOptInGate;
  readonly allowlist: OneProviderAdapterAllowlist;
  readonly api_key_ref: OneProviderAdapterApiKeyRef;
  readonly network_policy: OneProviderAdapterNetworkPolicy;
  readonly timeout_retry_policy: OneProviderAdapterTimeoutRetryPolicy;
  readonly cost_guard: OneProviderAdapterCostGuard;
  readonly live_test_gate: OneProviderAdapterLiveTestGate;
  readonly redaction_compatibility: OneProviderAdapterRedactionCompatibility;
  readonly ledger_compatibility: OneProviderAdapterLedgerCompatibility;
  readonly storage_compatibility: OneProviderAdapterStorageCompatibility;
  readonly trust_cap: OneProviderAdapterTrustCap;
  readonly rollback_plan: OneProviderAdapterRollbackPlan;
  readonly created_at: string;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterValidationIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
  readonly severity: "error" | "warning";
}

export interface OneProviderAdapterValidationResult {
  readonly ok: boolean;
  readonly errors: readonly OneProviderAdapterValidationIssue[];
}

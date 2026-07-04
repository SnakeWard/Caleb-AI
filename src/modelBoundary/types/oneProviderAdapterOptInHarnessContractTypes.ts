export type OneProviderAdapterOptInHarnessSchemaVersion = "0.1.0" | string;

export type OneProviderAdapterOptInHarnessStatus =
  | "opt_in_ready_but_live_disabled"
  | "opt_in_missing"
  | "kill_switch_disabled"
  | "provider_not_allowlisted"
  | "adapter_id_missing"
  | "command_flag_missing"
  | "human_approval_missing"
  | "api_key_unavailable"
  | "redaction_not_ready"
  | "safety_profile_not_ready"
  | "cost_guard_not_ready"
  | "live_tests_disabled"
  | "harness_invalid"
  | "refused";

export type OneProviderAdapterOptInHarnessDecisionKind =
  | "refuse_live_execution"
  | "future_live_execution_allowed_by_contract_only"
  | "live_execution_not_enabled_in_r26";

export type OneProviderAdapterOptInHarnessRefusalKind =
  | "live_execution_not_enabled_in_r26"
  | "missing_opt_in"
  | "kill_switch_disabled"
  | "provider_not_allowlisted"
  | "adapter_id_missing"
  | "command_flag_missing"
  | "human_approval_missing"
  | "missing_api_key"
  | "redaction_required"
  | "safety_profile_required"
  | "cost_guard_required"
  | "live_tests_disabled"
  | "config_invalid"
  | "harness_invalid";

export interface OneProviderAdapterEnvFlagRef {
  readonly env_var_name: string;
  readonly env_var_value_required: boolean | string;
  readonly env_var_value_present: boolean;
  readonly env_var_value_read: boolean;
  readonly env_var_value_stored: boolean;
  readonly env_var_value_logged: boolean;
  readonly env_var_value_written_to_ledger: boolean;
  readonly env_var_value_written_to_storage: boolean;
  readonly env_var_name_promotes_trust: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterCommandFlagEvidence {
  readonly command_flag_required: boolean;
  readonly command_flag_name: string;
  readonly command_flag_present: boolean;
  readonly command_flag_source: string;
  readonly command_flag_promotes_trust: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterAllowlistEvidence {
  readonly provider_allowlist_required: boolean;
  readonly provider_id: string;
  readonly provider_kind: string;
  readonly provider_allowlist_present: boolean;
  readonly provider_allowlisted: boolean;
  readonly provider_allowlist_source: string;
  readonly provider_allowlist_promotes_trust: boolean;
  readonly provider_not_allowlisted_failure_kind: string;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterAdapterIdEvidence {
  readonly adapter_id_required: boolean;
  readonly adapter_id: string;
  readonly adapter_id_present: boolean;
  readonly adapter_id_allowed: boolean;
  readonly adapter_id_promotes_trust: boolean;
  readonly adapter_id_missing_failure_kind: string;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterHumanApprovalRecord {
  readonly human_approval_required: boolean;
  readonly human_approval_recorded: boolean;
  readonly approval_id: string;
  readonly approver_ref: string;
  readonly approval_scope: string;
  readonly approval_timestamp: string;
  readonly approval_expires_at: string;
  readonly approval_source: string;
  readonly approval_promotes_trust: boolean;
  readonly approval_allows_live_execution_in_r26: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterKillSwitchState {
  readonly kill_switch_required: boolean;
  readonly kill_switch_env_var_name: string;
  readonly kill_switch_value_required_for_live: boolean | string;
  readonly kill_switch_value_present: boolean;
  readonly kill_switch_value_read: boolean;
  readonly kill_switch_enabled_by_default: boolean;
  readonly kill_switch_allows_live_execution: boolean;
  readonly kill_switch_blocks_live_execution: boolean;
  readonly kill_switch_promotes_trust: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterApiKeyAvailabilityEvidence {
  readonly api_key_required_for_live: boolean;
  readonly api_key_env_var_name: string;
  readonly api_key_env_var_name_is_secret: boolean;
  readonly api_key_value_present: boolean;
  readonly api_key_value_read: boolean;
  readonly api_key_value_stored: boolean;
  readonly api_key_value_logged: boolean;
  readonly api_key_value_written_to_ledger: boolean;
  readonly api_key_value_written_to_storage: boolean;
  readonly api_key_value_available_for_r26: boolean;
  readonly api_key_presence_promotes_trust: boolean;
  readonly missing_api_key_failure_kind: string;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterRedactionReadinessEvidence {
  readonly redaction_policy_required: boolean;
  readonly redaction_manifest_required: boolean;
  readonly redaction_result_required: boolean;
  readonly redaction_policy_present: boolean;
  readonly redaction_manifest_present: boolean;
  readonly redaction_result_present: boolean;
  readonly redaction_ready: boolean;
  readonly redaction_promotes_trust: boolean;
  readonly redaction_metadata_promotes_trust: boolean;
  readonly raw_prompt_allowed: boolean;
  readonly raw_output_allowed: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterSafetyProfileReadinessEvidence {
  readonly safety_profile_required: boolean;
  readonly safety_profile_id: string;
  readonly safety_profile_present: boolean;
  readonly safety_profile_ready: boolean;
  readonly safety_profile_promotes_trust: boolean;
  readonly missing_safety_profile_failure_kind: string;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterCostGuardReadinessEvidence {
  readonly cost_guard_required: boolean;
  readonly cost_guard_present: boolean;
  readonly cost_guard_ready: boolean;
  readonly max_live_requests_per_test: number;
  readonly max_output_tokens: number;
  readonly max_cost_units_per_run: number;
  readonly background_live_calls_allowed: boolean;
  readonly cost_guard_promotes_trust: boolean;
  readonly cost_limit_exceeded_failure_kind: string;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterLiveTestGateEvidence {
  readonly live_tests_created_in_r26: boolean;
  readonly live_tests_allowed_in_default_run: boolean;
  readonly live_tests_opt_in_only: boolean;
  readonly live_tests_skipped_by_default: boolean;
  readonly live_tests_can_run_in_ci_by_default: boolean;
  readonly live_tests_require_api_key: boolean;
  readonly live_tests_require_provider_allowlist: boolean;
  readonly test_fixtures_contain_secrets: boolean;
  readonly test_fixtures_contain_api_keys: boolean;
  readonly test_fixtures_contain_raw_prompt: boolean;
  readonly test_fixtures_contain_raw_output: boolean;
  readonly live_test_gate_promotes_trust: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterOptInEvidence {
  readonly schema_version: OneProviderAdapterOptInHarnessSchemaVersion;
  readonly evidence_id: string;
  readonly harness_id: string;
  readonly env_flag_ref: OneProviderAdapterEnvFlagRef;
  readonly command_flag: OneProviderAdapterCommandFlagEvidence;
  readonly allowlist: OneProviderAdapterAllowlistEvidence;
  readonly adapter_id: OneProviderAdapterAdapterIdEvidence;
  readonly api_key_availability: OneProviderAdapterApiKeyAvailabilityEvidence;
  readonly created_at: string;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterOptInHarnessTrustSummary {
  readonly opt_in_evidence_promotes_trust: boolean;
  readonly command_flag_promotes_trust: boolean;
  readonly env_flag_name_promotes_trust: boolean;
  readonly human_approval_promotes_trust: boolean;
  readonly kill_switch_state_promotes_trust: boolean;
  readonly api_key_presence_promotes_trust: boolean;
  readonly provider_allowlist_promotes_trust: boolean;
  readonly network_permission_promotes_trust: boolean;
  readonly harness_decision_promotes_trust: boolean;
  readonly live_execution_allowed_in_r26: boolean;
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

export interface OneProviderAdapterOptInHarnessAuditSummary {
  readonly harness_id: string;
  readonly config_ref: string;
  readonly opt_in_evidence_ref: string;
  readonly decision_id: string;
  readonly decision_kind: string;
  readonly refusal_kind: string;
  readonly live_execution_attempted: boolean;
  readonly provider_call_attempted: boolean;
  readonly network_call_attempted: boolean;
  readonly api_key_value_read: boolean;
  readonly process_env_read: boolean;
  readonly provider_sdk_used: boolean;
  readonly ledger_write_attempted: boolean;
  readonly file_write_attempted: boolean;
  readonly fake_success_returned: boolean;
  readonly provider_output_returned: boolean;
  readonly audit_notes: readonly string[];
}

export interface OneProviderAdapterOptInHarnessRefusal {
  readonly schema_version: OneProviderAdapterOptInHarnessSchemaVersion;
  readonly refusal_id: string;
  readonly ok: boolean;
  readonly status: OneProviderAdapterOptInHarnessStatus | string;
  readonly refusal_kind: OneProviderAdapterOptInHarnessRefusalKind | string;
  readonly provider_call_attempted: boolean;
  readonly network_call_attempted: boolean;
  readonly api_key_value_read: boolean;
  readonly process_env_read: boolean;
  readonly fake_success_returned: boolean;
  readonly provider_output_returned: boolean;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly notes: readonly string[];
}

export interface OneProviderAdapterOptInHarnessDecision {
  readonly schema_version: OneProviderAdapterOptInHarnessSchemaVersion;
  readonly decision_id: string;
  readonly harness_id: string;
  readonly status: OneProviderAdapterOptInHarnessStatus | string;
  readonly decision_kind: OneProviderAdapterOptInHarnessDecisionKind | string;
  readonly refusal_kind: OneProviderAdapterOptInHarnessRefusalKind | string;
  readonly opt_in_evidence: OneProviderAdapterOptInEvidence;
  readonly human_approval: OneProviderAdapterHumanApprovalRecord;
  readonly kill_switch: OneProviderAdapterKillSwitchState;
  readonly redaction: OneProviderAdapterRedactionReadinessEvidence;
  readonly safety_profile: OneProviderAdapterSafetyProfileReadinessEvidence;
  readonly cost_guard: OneProviderAdapterCostGuardReadinessEvidence;
  readonly live_test_gate: OneProviderAdapterLiveTestGateEvidence;
  readonly refusal: OneProviderAdapterOptInHarnessRefusal;
  readonly audit_summary: OneProviderAdapterOptInHarnessAuditSummary;
  readonly trust_summary: OneProviderAdapterOptInHarnessTrustSummary;
  readonly created_at: string;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterOptInHarnessValidationIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
  readonly severity: "error" | "warning";
}

export interface OneProviderAdapterOptInHarnessValidationResult {
  readonly ok: boolean;
  readonly errors: readonly OneProviderAdapterOptInHarnessValidationIssue[];
}

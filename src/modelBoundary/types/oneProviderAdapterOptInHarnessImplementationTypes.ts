export type OneProviderAdapterOptInHarnessImplementationSchemaVersion = "0.1.0" | string;

export type OneProviderAdapterOptInHarnessGate =
  | "config"
  | "kill_switch"
  | "env_flag"
  | "command_flag"
  | "provider_allowlist"
  | "adapter_id"
  | "human_approval"
  | "api_key_availability"
  | "redaction_readiness"
  | "safety_profile_readiness"
  | "cost_guard_readiness"
  | "live_test_gate"
  | "r27_live_execution_disabled";

export type OneProviderAdapterOptInHarnessEvaluationStatus =
  | "missing_opt_in"
  | "config_invalid"
  | "kill_switch_blocks_live_execution"
  | "env_flag_missing"
  | "command_flag_missing"
  | "provider_not_allowlisted"
  | "adapter_id_missing"
  | "adapter_id_not_allowed"
  | "human_approval_missing"
  | "api_key_unavailable"
  | "redaction_not_ready"
  | "safety_profile_not_ready"
  | "cost_guard_not_ready"
  | "live_tests_disabled"
  | "ready_but_live_execution_disabled"
  | "validation_failed";

export interface OneProviderAdapterOptInHarnessEvaluationConfigGate {
  readonly config_present: boolean;
  readonly config_valid: boolean;
  readonly config_ref: string;
  readonly config_promotes_trust: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterOptInHarnessEvaluationEvidence {
  readonly opt_in_present: boolean;
  readonly env_flag_present: boolean;
  readonly command_flag_present: boolean;
  readonly provider_allowlist_present: boolean;
  readonly provider_allowlisted: boolean;
  readonly adapter_id_present: boolean;
  readonly adapter_id_allowed: boolean;
  readonly human_approval_recorded: boolean;
  readonly api_key_available_by_reference: boolean;
  readonly redaction_ready: boolean;
  readonly safety_profile_ready: boolean;
  readonly cost_guard_ready: boolean;
  readonly live_tests_enabled_for_explicit_opt_in: boolean;
  readonly evidence_promotes_trust: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterOptInHarnessEvaluationKillSwitch {
  readonly kill_switch_present: boolean;
  readonly kill_switch_blocks_live_execution: boolean;
  readonly kill_switch_promotes_trust: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterOptInHarnessEvaluationInput {
  readonly schema_version: OneProviderAdapterOptInHarnessImplementationSchemaVersion;
  readonly evaluation_id: string;
  readonly harness_id: string;
  readonly adapter_id: string;
  readonly provider_id: string;
  readonly provider_kind: string;
  readonly config: OneProviderAdapterOptInHarnessEvaluationConfigGate;
  readonly opt_in_evidence: OneProviderAdapterOptInHarnessEvaluationEvidence;
  readonly kill_switch: OneProviderAdapterOptInHarnessEvaluationKillSwitch;
  readonly created_at: string;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterOptInHarnessRuntimeCapabilities {
  readonly schema_version: OneProviderAdapterOptInHarnessImplementationSchemaVersion;
  readonly harness_id: string;
  readonly evaluates_opt_in_evidence: boolean;
  readonly reads_process_env: boolean;
  readonly reads_api_key_value: boolean;
  readonly performs_network_call: boolean;
  readonly imports_provider_sdk: boolean;
  readonly enables_live_execution: boolean;
  readonly writes_ledger: boolean;
  readonly writes_files: boolean;
  readonly returns_provider_output: boolean;
  readonly returns_fake_success: boolean;
  readonly created_at: string;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterOptInHarnessRuntimeHealth {
  readonly schema_version: OneProviderAdapterOptInHarnessImplementationSchemaVersion;
  readonly harness_id: string;
  readonly contract_available: boolean;
  readonly runtime_enabled: boolean;
  readonly live_execution_enabled: boolean;
  readonly process_env_read: boolean;
  readonly api_key_value_read: boolean;
  readonly network_available: boolean;
  readonly provider_sdk_available: boolean;
  readonly checked_at: string;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly notes: readonly string[];
}

export interface OneProviderAdapterOptInHarnessGateResult {
  readonly gate: OneProviderAdapterOptInHarnessGate;
  readonly passed: boolean;
  readonly status: OneProviderAdapterOptInHarnessEvaluationStatus;
  readonly refusal_kind: OneProviderAdapterOptInHarnessEvaluationStatus;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterOptInHarnessImplementationTrustSummary {
  readonly harness_evaluation_promotes_trust: boolean;
  readonly harness_decision_promotes_trust: boolean;
  readonly opt_in_evidence_promotes_trust: boolean;
  readonly human_approval_evidence_promotes_trust: boolean;
  readonly kill_switch_state_promotes_trust: boolean;
  readonly api_key_availability_promotes_trust: boolean;
  readonly provider_allowlist_presence_promotes_trust: boolean;
  readonly network_permission_promotes_trust: boolean;
  readonly ready_disabled_promotes_trust: boolean;
  readonly provider_output_is_deterministic_evidence: boolean;
  readonly raw_provider_output_trust_tier: "T0" | string;
  readonly schema_valid_provider_output_trust_tier: "T1" | string;
  readonly max_provider_output_trust_tier: "T1" | string;
  readonly requires_vrp_for_t2: boolean;
  readonly verified_final_truth_claimed: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterOptInHarnessImplementationSafetySummary {
  readonly live_execution_blocked: boolean;
  readonly live_adapter_blocked: boolean;
  readonly provider_call_blocked: boolean;
  readonly provider_specific_behavior_blocked: boolean;
  readonly real_model_api_layer_blocked: boolean;
  readonly process_env_read_blocked: boolean;
  readonly api_key_value_read_blocked: boolean;
  readonly network_call_blocked: boolean;
  readonly provider_sdk_blocked: boolean;
  readonly ledger_write_blocked: boolean;
  readonly file_write_blocked: boolean;
  readonly fake_success_blocked: boolean;
  readonly provider_output_blocked: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterOptInHarnessImplementationAuditSummary {
  readonly live_execution_attempted: boolean;
  readonly live_adapter_used: boolean;
  readonly provider_call_attempted: boolean;
  readonly provider_specific_behavior_used: boolean;
  readonly real_model_api_layer_used: boolean;
  readonly process_env_read: boolean;
  readonly api_key_value_read: boolean;
  readonly network_call_attempted: boolean;
  readonly provider_sdk_used: boolean;
  readonly ledger_write_attempted: boolean;
  readonly file_write_attempted: boolean;
  readonly fake_success_returned: boolean;
  readonly provider_output_returned: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterOptInHarnessEvaluationResult {
  readonly schema_version: OneProviderAdapterOptInHarnessImplementationSchemaVersion;
  readonly result_id: string;
  readonly evaluation_id: string;
  readonly harness_id: string;
  readonly adapter_id: string;
  readonly provider_id: string;
  readonly provider_kind: string;
  readonly ok: boolean;
  readonly status: OneProviderAdapterOptInHarnessEvaluationStatus;
  readonly blocking_gate: OneProviderAdapterOptInHarnessGate;
  readonly refusal_kind: OneProviderAdapterOptInHarnessEvaluationStatus;
  readonly ready_disabled: boolean;
  readonly gate_order: readonly OneProviderAdapterOptInHarnessGate[];
  readonly gate_results: readonly OneProviderAdapterOptInHarnessGateResult[];
  readonly capabilities: OneProviderAdapterOptInHarnessRuntimeCapabilities;
  readonly health: OneProviderAdapterOptInHarnessRuntimeHealth;
  readonly trust_summary: OneProviderAdapterOptInHarnessImplementationTrustSummary;
  readonly safety_summary: OneProviderAdapterOptInHarnessImplementationSafetySummary;
  readonly audit_summary: OneProviderAdapterOptInHarnessImplementationAuditSummary;
  readonly live_execution_attempted: boolean;
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

export interface OneProviderAdapterOptInHarnessImplementationValidationIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
  readonly severity: "error" | "warning";
}

export interface OneProviderAdapterOptInHarnessImplementationValidationResult {
  readonly ok: boolean;
  readonly errors: readonly OneProviderAdapterOptInHarnessImplementationValidationIssue[];
}

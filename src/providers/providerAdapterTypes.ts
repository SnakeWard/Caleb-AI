export type ProviderAdapterSkeletonStatus = "disabled" | "blocked" | "not_run";

export type ProviderOutputTrustTier = "T0" | "T1";

export interface ExplicitOptInProviderGateInput {
  readonly explicit_opt_in: boolean;
  readonly command_flag_present: boolean;
  readonly provider_allowlisted: boolean;
  readonly human_approval_recorded: boolean;
  readonly kill_switch_open: boolean;
  readonly redaction_ready: boolean;
  readonly safety_profile_ready: boolean;
  readonly cost_guard_ready: boolean;
  readonly notes?: readonly string[];
}

export interface ExplicitOptInProviderGateResult {
  readonly ok: boolean;
  readonly status: ProviderAdapterSkeletonStatus;
  readonly block_reason: string;
  readonly explicit_opt_in_from_input_data: boolean;
  readonly process_env_read: boolean;
  readonly api_key_value_read: boolean;
  readonly network_call_attempted: boolean;
  readonly live_execution_attempted: boolean;
  readonly notes: readonly string[];
}

export interface OneProviderAdapterSkeletonInput {
  readonly request_id: string;
  readonly adapter_id: string;
  readonly gate: ExplicitOptInProviderGateInput;
  readonly provider_output_shape_valid?: boolean;
  readonly created_at?: string;
  readonly notes?: readonly string[];
}

export interface OneProviderAdapterSkeletonResult {
  readonly ok: false;
  readonly status: ProviderAdapterSkeletonStatus;
  readonly request_id: string;
  readonly adapter_id: string;
  readonly block_reason: string;
  readonly provider_output_content: null;
  readonly provider_success_simulated: false;
  readonly provider_call_attempted: false;
  readonly process_env_read: false;
  readonly api_key_value_read: false;
  readonly network_call_attempted: false;
  readonly live_execution_attempted: false;
  readonly provider_output_trust_tier: ProviderOutputTrustTier;
  readonly provider_output_max_trust_tier: "T1";
  readonly t2_requires_vrp_verified_deterministic_hollow_evidence: true;
  readonly created_at: string;
  readonly notes: readonly string[];
}

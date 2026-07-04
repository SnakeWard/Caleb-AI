export type DisabledByDefaultLiveHarnessStatus = "skipped" | "blocked" | "not_run";

export type DisabledByDefaultLiveHarnessTrustTier = "T0" | "T1";

export type LiveHarnessInputState = "present" | "missing";

export type LiveHarnessExecutionState = "not_run" | "unavailable";

export interface DisabledByDefaultLiveHarnessInput {
  readonly harness_id: string;
  readonly provider_adapter_id: string;
  readonly explicit_opt_in: boolean;
  readonly explicit_live_harness_request: boolean;
  readonly provider_output_shape_valid?: boolean;
  readonly created_at?: string;
  readonly notes?: readonly string[];
}

export interface DisabledByDefaultLiveHarnessReport {
  readonly ok: false;
  readonly status: DisabledByDefaultLiveHarnessStatus;
  readonly harness_id: string;
  readonly provider_adapter_id: string;
  readonly opt_in_state: LiveHarnessInputState;
  readonly explicit_live_request_state: LiveHarnessInputState;
  readonly live_execution_state: LiveHarnessExecutionState;
  readonly skip_reason: string | null;
  readonly block_reason: string | null;
  readonly network_attempted: false;
  readonly provider_response_received: false;
  readonly provider_output_present: false;
  readonly provider_output_content: null;
  readonly provider_success_simulated: false;
  readonly provider_response_simulated: false;
  readonly process_env_read: false;
  readonly api_key_required: false;
  readonly api_key_read: false;
  readonly provider_output_trust_tier: DisabledByDefaultLiveHarnessTrustTier;
  readonly provider_output_max_trust_tier: "T1";
  readonly vrp_evidence_required_for_T2: true;
  readonly ledger_write_policy: "no_provider_behavior_ledger_write";
  readonly created_at: string;
  readonly notes: readonly string[];
}

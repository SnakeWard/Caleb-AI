export type OneProviderAdapterDryRunReportStatus = "skipped" | "blocked" | "not_run";

export type OneProviderAdapterDryRunReportMode = "dry_run" | "contract_only";

export type OneProviderAdapterDryRunInputState = "present" | "missing";

export type OneProviderAdapterDryRunExecutionState = "not_run" | "unavailable";

export type OneProviderAdapterDryRunState = "report_only" | "contract_only";

export type OneProviderAdapterDryRunTrustTier = "T0" | "T1";

export interface OneProviderAdapterDryRunReportInput {
  readonly report_id: string;
  readonly harness_id: string;
  readonly provider_adapter_id: string;
  readonly report_mode: OneProviderAdapterDryRunReportMode;
  readonly explicit_opt_in: boolean;
  readonly explicit_live_request: boolean;
  readonly provider_output_shape_valid?: boolean;
  readonly created_at: string;
  readonly notes?: readonly string[];
}

export interface OneProviderAdapterDryRunReport {
  readonly ok: false;
  readonly status: OneProviderAdapterDryRunReportStatus;
  readonly report_id: string;
  readonly harness_id: string;
  readonly provider_adapter_id: string;
  readonly report_mode: OneProviderAdapterDryRunReportMode;
  readonly opt_in_state: OneProviderAdapterDryRunInputState;
  readonly explicit_live_request_state: OneProviderAdapterDryRunInputState;
  readonly live_execution_state: OneProviderAdapterDryRunExecutionState;
  readonly dry_run_state: OneProviderAdapterDryRunState;
  readonly skip_reason: string | null;
  readonly block_reason: string | null;
  readonly network_attempted: false;
  readonly provider_execution_attempted: false;
  readonly provider_response_received: false;
  readonly provider_output_present: false;
  readonly provider_content_present: false;
  readonly provider_success_simulated: false;
  readonly provider_response_simulated: false;
  readonly process_env_read: false;
  readonly api_key_required: false;
  readonly api_key_read: false;
  readonly provider_output_trust_tier: OneProviderAdapterDryRunTrustTier;
  readonly provider_output_trust_ceiling: "T1";
  readonly vrp_evidence_required_for_T2: true;
  readonly ledger_write_policy: "no_provider_behavior_ledger_write";
  readonly storage_trust_policy: "storage_does_not_increase_trust";
  readonly created_at: string;
  readonly notes: readonly string[];
}

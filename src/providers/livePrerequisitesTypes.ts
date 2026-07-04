export type OneProviderAdapterLivePrerequisitesEvaluationMode = "prerequisites_evaluation" | "contract_only";

export type OneProviderAdapterLiveExecutionState = "not_run" | "blocked";

export type OneProviderAdapterLivePrerequisitesTrustCeiling = "T1";

export interface OneProviderAdapterLivePrerequisitesInput {
  readonly repo_root_confirmed: boolean;
  readonly explicit_opt_in: boolean;
  readonly explicit_live_request: boolean;
  readonly provider_adapter_allowlisted: boolean;
  readonly live_harness_allowlisted: boolean;
  readonly credential_source_declared_by_caller: boolean;
  readonly credential_auto_read: boolean;
  readonly network_permission_granted_by_caller: boolean;
  readonly explicit_live_command_or_flag: boolean;
  readonly dry_run_report_completed: boolean;
  readonly default_tests_non_live: boolean;
  readonly default_acceptance_non_live: boolean;
  readonly default_ci_non_live: boolean;
  readonly provider_output_trust_ceiling: "T1";
  readonly vrp_evidence_required_for_T2: true;
  readonly created_at?: string;
}

export interface OneProviderAdapterLivePrerequisitesEvaluation {
  readonly ok: false;
  readonly evaluator_id: string;
  readonly evaluation_mode: OneProviderAdapterLivePrerequisitesEvaluationMode;
  readonly prerequisites_met: boolean;
  readonly missing_prerequisites: readonly string[];
  readonly blocking_reasons: readonly string[];
  readonly live_execution_state: OneProviderAdapterLiveExecutionState;
  readonly network_attempted: false;
  readonly provider_execution_attempted: false;
  readonly provider_response_received: false;
  readonly provider_output_present: false;
  readonly provider_content_present: false;
  readonly provider_output_trust_ceiling: OneProviderAdapterLivePrerequisitesTrustCeiling;
  readonly vrp_evidence_required_for_T2: true;
  readonly credential_auto_read_allowed: false;
  readonly default_tests_non_live: boolean;
  readonly default_acceptance_non_live: boolean;
  readonly default_ci_non_live: boolean;
  readonly created_at: string;
  readonly notes: readonly string[];
}

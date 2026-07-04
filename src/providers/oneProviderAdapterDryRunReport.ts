import type {
  OneProviderAdapterDryRunReport,
  OneProviderAdapterDryRunReportInput,
  OneProviderAdapterDryRunTrustTier
} from "./dryRunReportTypes.js";

export function evaluateDryRunProviderOutputTrustTier(
  providerOutputShapeValid: boolean | undefined
): OneProviderAdapterDryRunTrustTier {
  return providerOutputShapeValid === true ? "T1" : "T0";
}

export function createOneProviderAdapterDryRunReport(
  input: OneProviderAdapterDryRunReportInput
): OneProviderAdapterDryRunReport {
  const optInPresent = input.explicit_opt_in === true;
  const liveRequestPresent = input.explicit_live_request === true;
  const skipReason = !optInPresent
    ? "explicit_opt_in_missing"
    : !liveRequestPresent
      ? "explicit_live_request_missing"
      : null;
  const blockReason = skipReason === null ? "live_execution_unavailable" : null;

  return {
    ok: false,
    status: skipReason === null ? "blocked" : "skipped",
    report_id: input.report_id,
    harness_id: input.harness_id,
    provider_adapter_id: input.provider_adapter_id,
    report_mode: input.report_mode,
    opt_in_state: optInPresent ? "present" : "missing",
    explicit_live_request_state: liveRequestPresent ? "present" : "missing",
    live_execution_state: skipReason === null ? "unavailable" : "not_run",
    dry_run_state: input.report_mode === "contract_only" ? "contract_only" : "report_only",
    skip_reason: skipReason,
    block_reason: blockReason,
    network_attempted: false,
    provider_execution_attempted: false,
    provider_response_received: false,
    provider_output_present: false,
    provider_content_present: false,
    provider_success_simulated: false,
    provider_response_simulated: false,
    process_env_read: false,
    api_key_required: false,
    api_key_read: false,
    provider_output_trust_tier: evaluateDryRunProviderOutputTrustTier(input.provider_output_shape_valid),
    provider_output_trust_ceiling: "T1",
    vrp_evidence_required_for_T2: true,
    ledger_write_policy: "no_provider_behavior_ledger_write",
    storage_trust_policy: "storage_does_not_increase_trust",
    created_at: input.created_at,
    notes: ["One-provider adapter dry-run report contract only.", ...(input.notes ?? [])]
  };
}

export function createDefaultOneProviderAdapterDryRunReport(createdAt: string): OneProviderAdapterDryRunReport {
  return createOneProviderAdapterDryRunReport({
    report_id: "default_one_provider_adapter_dry_run_report",
    harness_id: "default_disabled_one_provider_live_harness_scaffold",
    provider_adapter_id: "one_provider_adapter_skeleton",
    report_mode: "dry_run",
    explicit_opt_in: false,
    explicit_live_request: false,
    provider_output_shape_valid: false,
    created_at: createdAt,
    notes: ["Default dry-run report-only state."]
  });
}

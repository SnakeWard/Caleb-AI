import type {
  DisabledByDefaultLiveHarnessInput,
  DisabledByDefaultLiveHarnessReport,
  DisabledByDefaultLiveHarnessTrustTier
} from "./liveHarnessTypes.js";

const defaultCreatedAt = "2026-07-04T00:00:00.000Z";

export function evaluateLiveHarnessProviderOutputTrustTier(
  providerOutputShapeValid: boolean | undefined
): DisabledByDefaultLiveHarnessTrustTier {
  return providerOutputShapeValid === true ? "T1" : "T0";
}

export function createDisabledByDefaultLiveHarnessReport(
  input: DisabledByDefaultLiveHarnessInput
): DisabledByDefaultLiveHarnessReport {
  const optInPresent = input.explicit_opt_in === true;
  const liveRequestPresent = input.explicit_live_harness_request === true;
  const skipReason = !optInPresent
    ? "explicit_opt_in_missing"
    : !liveRequestPresent
      ? "explicit_live_harness_request_missing"
      : null;
  const blockReason = skipReason === null ? "live_execution_unavailable" : null;

  return {
    ok: false,
    status: skipReason === null ? "blocked" : "skipped",
    harness_id: input.harness_id,
    provider_adapter_id: input.provider_adapter_id,
    opt_in_state: optInPresent ? "present" : "missing",
    explicit_live_request_state: liveRequestPresent ? "present" : "missing",
    live_execution_state: skipReason === null ? "unavailable" : "not_run",
    skip_reason: skipReason,
    block_reason: blockReason,
    network_attempted: false,
    provider_response_received: false,
    provider_output_present: false,
    provider_output_content: null,
    provider_success_simulated: false,
    provider_response_simulated: false,
    process_env_read: false,
    api_key_required: false,
    api_key_read: false,
    provider_output_trust_tier: evaluateLiveHarnessProviderOutputTrustTier(input.provider_output_shape_valid),
    provider_output_max_trust_tier: "T1",
    vrp_evidence_required_for_T2: true,
    ledger_write_policy: "no_provider_behavior_ledger_write",
    created_at: input.created_at ?? defaultCreatedAt,
    notes: ["Inert disabled-by-default live harness scaffold only.", ...(input.notes ?? [])]
  };
}

export function createDefaultDisabledLiveHarnessScaffoldReport(): DisabledByDefaultLiveHarnessReport {
  return createDisabledByDefaultLiveHarnessReport({
    harness_id: "default_disabled_one_provider_live_harness_scaffold",
    provider_adapter_id: "one_provider_adapter_skeleton",
    explicit_opt_in: false,
    explicit_live_harness_request: false,
    provider_output_shape_valid: false,
    created_at: defaultCreatedAt,
    notes: ["Disabled by default."]
  });
}

import { evaluateExplicitOptInProviderGate } from "./explicitOptInProviderGate.js";
import type {
  OneProviderAdapterSkeletonInput,
  OneProviderAdapterSkeletonResult,
  ProviderOutputTrustTier
} from "./providerAdapterTypes.js";

const defaultCreatedAt = "2026-07-04T00:00:00.000Z";

export function evaluateProviderOutputTrustTier(providerOutputShapeValid: boolean | undefined): ProviderOutputTrustTier {
  return providerOutputShapeValid === true ? "T1" : "T0";
}

export function createOneProviderAdapterSkeletonResult(input: OneProviderAdapterSkeletonInput): OneProviderAdapterSkeletonResult {
  const gate = evaluateExplicitOptInProviderGate(input.gate);
  return {
    ok: false,
    status: gate.ok ? "not_run" : gate.status,
    request_id: input.request_id,
    adapter_id: input.adapter_id,
    block_reason: gate.ok ? "inert_skeleton_no_live_execution" : gate.block_reason,
    provider_output_content: null,
    provider_success_simulated: false,
    provider_call_attempted: false,
    process_env_read: false,
    api_key_value_read: false,
    network_call_attempted: false,
    live_execution_attempted: false,
    provider_output_trust_tier: evaluateProviderOutputTrustTier(input.provider_output_shape_valid),
    provider_output_max_trust_tier: "T1",
    t2_requires_vrp_verified_deterministic_hollow_evidence: true,
    created_at: input.created_at ?? defaultCreatedAt,
    notes: ["Inert provider adapter skeleton only.", ...gate.notes, ...(input.notes ?? [])]
  };
}

export function createDefaultDisabledOneProviderAdapterSkeleton(): OneProviderAdapterSkeletonResult {
  return createOneProviderAdapterSkeletonResult({
    request_id: "default_disabled_provider_adapter_skeleton",
    adapter_id: "one_provider_adapter_skeleton",
    gate: {
      explicit_opt_in: false,
      command_flag_present: false,
      provider_allowlisted: false,
      human_approval_recorded: false,
      kill_switch_open: false,
      redaction_ready: false,
      safety_profile_ready: false,
      cost_guard_ready: false
    },
    provider_output_shape_valid: false,
    created_at: defaultCreatedAt,
    notes: ["Disabled by default."]
  });
}

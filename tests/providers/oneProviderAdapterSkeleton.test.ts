import { describe, expect, it } from "vitest";
import {
  createDefaultDisabledOneProviderAdapterSkeleton,
  createOneProviderAdapterSkeletonResult,
  evaluateExplicitOptInProviderGate,
  evaluateProviderOutputTrustTier
} from "../../src/index.js";

const readyGate = {
  explicit_opt_in: true,
  command_flag_present: true,
  provider_allowlisted: true,
  human_approval_recorded: true,
  kill_switch_open: true,
  redaction_ready: true,
  safety_profile_ready: true,
  cost_guard_ready: true
};

describe("one provider adapter skeleton", () => {
  it("default skeleton state is disabled or not-run", () => {
    const result = createDefaultDisabledOneProviderAdapterSkeleton();
    expect(["disabled", "not_run"]).toContain(result.status);
    expect(result.ok).toBe(false);
    expect(result.provider_output_content).toBeNull();
  });

  it("explicit opt-in must be passed as input data", () => {
    const gate = evaluateExplicitOptInProviderGate({ ...readyGate, explicit_opt_in: false });
    expect(gate.explicit_opt_in_from_input_data).toBe(false);
    expect(gate.status).toBe("disabled");
    expect(gate.block_reason).toBe("explicit_opt_in_missing");
  });

  it("opt-in false returns disabled or not-run", () => {
    const result = createOneProviderAdapterSkeletonResult({
      request_id: "opt_in_false",
      adapter_id: "one_provider_adapter_skeleton",
      gate: { ...readyGate, explicit_opt_in: false }
    });
    expect(["disabled", "not_run"]).toContain(result.status);
    expect(result.block_reason).toBe("explicit_opt_in_missing");
  });

  it("missing required future live prerequisites returns blocked or not-run", () => {
    const result = createOneProviderAdapterSkeletonResult({
      request_id: "missing_prerequisite",
      adapter_id: "one_provider_adapter_skeleton",
      gate: { ...readyGate, provider_allowlisted: false }
    });
    expect(["blocked", "not_run"]).toContain(result.status);
    expect(result.block_reason).toBe("provider_not_allowlisted");
  });

  it("no provider output field contains content", () => {
    const result = createOneProviderAdapterSkeletonResult({
      request_id: "no_output",
      adapter_id: "one_provider_adapter_skeleton",
      gate: readyGate
    });
    expect(result.provider_output_content).toBeNull();
    expect(result.provider_call_attempted).toBe(false);
  });

  it("no success response is possible", () => {
    const result = createOneProviderAdapterSkeletonResult({
      request_id: "no_success",
      adapter_id: "one_provider_adapter_skeleton",
      gate: readyGate
    });
    expect(result.ok).toBe(false);
    expect(result.provider_success_simulated).toBe(false);
    expect(result.status).toBe("not_run");
  });

  it("trust tier cannot exceed T1 for provider-shaped data", () => {
    expect(evaluateProviderOutputTrustTier(false)).toBe("T0");
    expect(evaluateProviderOutputTrustTier(true)).toBe("T1");
    const result = createOneProviderAdapterSkeletonResult({
      request_id: "trust_tier",
      adapter_id: "one_provider_adapter_skeleton",
      gate: readyGate,
      provider_output_shape_valid: true
    });
    expect(result.provider_output_trust_tier).toBe("T1");
    expect(result.provider_output_max_trust_tier).toBe("T1");
  });

  it("T2 requires VRP-verified deterministic Hollow evidence", () => {
    const result = createDefaultDisabledOneProviderAdapterSkeleton();
    expect(result.t2_requires_vrp_verified_deterministic_hollow_evidence).toBe(true);
  });

  it("does not read env, API keys, network, or live execution state", () => {
    const result = createOneProviderAdapterSkeletonResult({
      request_id: "side_effects",
      adapter_id: "one_provider_adapter_skeleton",
      gate: readyGate
    });
    expect(result.process_env_read).toBe(false);
    expect(result.api_key_value_read).toBe(false);
    expect(result.network_call_attempted).toBe(false);
    expect(result.live_execution_attempted).toBe(false);
  });
});

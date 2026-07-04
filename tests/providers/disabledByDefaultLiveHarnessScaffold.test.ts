import { describe, expect, it } from "vitest";
import {
  createDefaultDisabledLiveHarnessScaffoldReport,
  createDisabledByDefaultLiveHarnessReport,
  evaluateLiveHarnessProviderOutputTrustTier
} from "../../src/index.js";

describe("disabled-by-default live harness scaffold", () => {
  it("scaffold default state is skipped/not-run", () => {
    const report = createDefaultDisabledLiveHarnessScaffoldReport();
    expect(report.status).toBe("skipped");
    expect(report.live_execution_state).toBe("not_run");
    expect(report.skip_reason).toBe("explicit_opt_in_missing");
  });

  it("opt-in false returns skipped/not-run", () => {
    const report = createDisabledByDefaultLiveHarnessReport({
      harness_id: "opt_in_false",
      provider_adapter_id: "one_provider_adapter_skeleton",
      explicit_opt_in: false,
      explicit_live_harness_request: true
    });
    expect(report.status).toBe("skipped");
    expect(report.live_execution_state).toBe("not_run");
    expect(report.skip_reason).toBe("explicit_opt_in_missing");
  });

  it("missing explicit live request returns skipped/not-run", () => {
    const report = createDisabledByDefaultLiveHarnessReport({
      harness_id: "missing_live_request",
      provider_adapter_id: "one_provider_adapter_skeleton",
      explicit_opt_in: true,
      explicit_live_harness_request: false
    });
    expect(report.status).toBe("skipped");
    expect(report.live_execution_state).toBe("not_run");
    expect(report.skip_reason).toBe("explicit_live_harness_request_missing");
  });

  it("opt-in true plus explicit live request still returns blocked/not-run because live execution is unavailable", () => {
    const report = createDisabledByDefaultLiveHarnessReport({
      harness_id: "blocked_live_unavailable",
      provider_adapter_id: "one_provider_adapter_skeleton",
      explicit_opt_in: true,
      explicit_live_harness_request: true
    });
    expect(report.status).toBe("blocked");
    expect(report.live_execution_state).toBe("unavailable");
    expect(report.block_reason).toBe("live_execution_unavailable");
  });

  it("network and provider response fields are always false", () => {
    const report = createDisabledByDefaultLiveHarnessReport({
      harness_id: "no_network",
      provider_adapter_id: "one_provider_adapter_skeleton",
      explicit_opt_in: true,
      explicit_live_harness_request: true
    });
    expect(report.network_attempted).toBe(false);
    expect(report.provider_response_received).toBe(false);
    expect(report.provider_output_present).toBe(false);
  });

  it("no provider content is returned", () => {
    const report = createDisabledByDefaultLiveHarnessReport({
      harness_id: "no_content",
      provider_adapter_id: "one_provider_adapter_skeleton",
      explicit_opt_in: true,
      explicit_live_harness_request: true
    });
    expect(report.provider_output_content).toBeNull();
    expect(report.provider_output_present).toBe(false);
  });

  it("no success response is possible", () => {
    const report = createDisabledByDefaultLiveHarnessReport({
      harness_id: "no_success",
      provider_adapter_id: "one_provider_adapter_skeleton",
      explicit_opt_in: true,
      explicit_live_harness_request: true
    });
    expect(report.ok).toBe(false);
    expect(report.provider_success_simulated).toBe(false);
    expect(report.provider_response_simulated).toBe(false);
  });

  it("provider-shaped trust cannot exceed T1", () => {
    expect(evaluateLiveHarnessProviderOutputTrustTier(false)).toBe("T0");
    expect(evaluateLiveHarnessProviderOutputTrustTier(true)).toBe("T1");
    const report = createDisabledByDefaultLiveHarnessReport({
      harness_id: "trust_tier",
      provider_adapter_id: "one_provider_adapter_skeleton",
      explicit_opt_in: true,
      explicit_live_harness_request: true,
      provider_output_shape_valid: true
    });
    expect(report.provider_output_trust_tier).toBe("T1");
    expect(report.provider_output_max_trust_tier).toBe("T1");
  });

  it("T2 requires VRP-verified deterministic Hollow evidence", () => {
    const report = createDefaultDisabledLiveHarnessScaffoldReport();
    expect(report.vrp_evidence_required_for_T2).toBe(true);
  });

  it("scaffold does not read process.env or require API keys", () => {
    const report = createDisabledByDefaultLiveHarnessReport({
      harness_id: "no_secret_reads",
      provider_adapter_id: "one_provider_adapter_skeleton",
      explicit_opt_in: true,
      explicit_live_harness_request: true
    });
    expect(report.process_env_read).toBe(false);
    expect(report.api_key_required).toBe(false);
    expect(report.api_key_read).toBe(false);
  });
});

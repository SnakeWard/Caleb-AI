import { describe, expect, it } from "vitest";
import {
  createDefaultOneProviderAdapterDryRunReport,
  createOneProviderAdapterDryRunReport,
  evaluateDryRunProviderOutputTrustTier
} from "../../src/index.js";

const createdAt = "2026-07-04T00:00:00.000Z";

function readyInput() {
  return {
    report_id: "dry_run_report",
    harness_id: "disabled_live_harness",
    provider_adapter_id: "one_provider_adapter_skeleton",
    report_mode: "dry_run" as const,
    explicit_opt_in: true,
    explicit_live_request: true,
    created_at: createdAt
  };
}

describe("one provider adapter dry-run report", () => {
  it("report builder returns dry-run/report-only state", () => {
    const report = createDefaultOneProviderAdapterDryRunReport(createdAt);
    expect(report.report_mode).toBe("dry_run");
    expect(report.dry_run_state).toBe("report_only");
    expect(report.status).toBe("skipped");
    expect(report.live_execution_state).toBe("not_run");
  });

  it("network_attempted is false", () => {
    expect(createOneProviderAdapterDryRunReport(readyInput()).network_attempted).toBe(false);
  });

  it("provider execution and response fields are false", () => {
    const report = createOneProviderAdapterDryRunReport(readyInput());
    expect(report.provider_execution_attempted).toBe(false);
    expect(report.provider_response_received).toBe(false);
  });

  it("provider output and content presence fields are false", () => {
    const report = createOneProviderAdapterDryRunReport(readyInput());
    expect(report.provider_output_present).toBe(false);
    expect(report.provider_content_present).toBe(false);
  });

  it("no provider content field exists or contains content", () => {
    const report = createOneProviderAdapterDryRunReport(readyInput());
    expect("provider_content" in report).toBe(false);
    expect("provider_output_content" in report).toBe(false);
  });

  it("no success response is possible", () => {
    const report = createOneProviderAdapterDryRunReport(readyInput());
    expect(report.ok).toBe(false);
    expect(report.status).toBe("blocked");
    expect(report.provider_success_simulated).toBe(false);
    expect(report.provider_response_simulated).toBe(false);
  });

  it("provider_output_trust_ceiling is T1", () => {
    expect(createOneProviderAdapterDryRunReport(readyInput()).provider_output_trust_ceiling).toBe("T1");
  });

  it("provider-shaped trust cannot exceed T1", () => {
    expect(evaluateDryRunProviderOutputTrustTier(false)).toBe("T0");
    expect(evaluateDryRunProviderOutputTrustTier(true)).toBe("T1");
    const report = createOneProviderAdapterDryRunReport({
      ...readyInput(),
      provider_output_shape_valid: true
    });
    expect(report.provider_output_trust_tier).toBe("T1");
  });

  it("T2 requires VRP-verified deterministic Hollow evidence", () => {
    expect(createOneProviderAdapterDryRunReport(readyInput()).vrp_evidence_required_for_T2).toBe(true);
  });

  it("report builder does not read process.env or require API keys", () => {
    const report = createOneProviderAdapterDryRunReport(readyInput());
    expect(report.process_env_read).toBe(false);
    expect(report.api_key_required).toBe(false);
    expect(report.api_key_read).toBe(false);
  });
});

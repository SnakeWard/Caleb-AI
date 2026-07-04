import { describe, expect, it } from "vitest";
import { createOneProviderAdapterDryRunCliReport } from "../../src/index.js";

describe("one provider adapter dry-run CLI helper", () => {
  it("default CLI handler state is skipped/not-run", () => {
    const result = createOneProviderAdapterDryRunCliReport();
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.report.status).toBe("skipped");
      expect(result.report.live_execution_state).toBe("not_run");
      expect(result.report.skip_reason).toBe("explicit_opt_in_missing");
    }
  });

  it("missing explicit opt-in returns skipped/not-run", () => {
    const result = createOneProviderAdapterDryRunCliReport({ explicit_live_request: "true" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.report.status).toBe("skipped");
      expect(result.report.live_execution_state).toBe("not_run");
      expect(result.report.skip_reason).toBe("explicit_opt_in_missing");
    }
  });

  it("missing explicit live request returns skipped/not-run", () => {
    const result = createOneProviderAdapterDryRunCliReport({ explicit_opt_in: "true" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.report.status).toBe("skipped");
      expect(result.report.live_execution_state).toBe("not_run");
      expect(result.report.skip_reason).toBe("explicit_live_request_missing");
    }
  });

  it("explicit opt-in true plus explicit live request true returns blocked/not-run", () => {
    const result = createOneProviderAdapterDryRunCliReport({
      explicit_opt_in: "true",
      explicit_live_request: "true"
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.report.status).toBe("blocked");
      expect(result.report.live_execution_state).toBe("unavailable");
      expect(result.report.block_reason).toBe("live_execution_unavailable");
    }
  });

  it("network and provider execution fields are false", () => {
    const result = createOneProviderAdapterDryRunCliReport({ explicit_opt_in: true, explicit_live_request: true });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.report.network_attempted).toBe(false);
      expect(result.report.provider_execution_attempted).toBe(false);
      expect(result.report.provider_response_received).toBe(false);
      expect(result.report.provider_output_present).toBe(false);
      expect(result.report.provider_content_present).toBe(false);
    }
  });

  it("no provider content exists", () => {
    const result = createOneProviderAdapterDryRunCliReport({ explicit_opt_in: true, explicit_live_request: true });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect("provider_content" in result.report).toBe(false);
      expect("provider_output_content" in result.report).toBe(false);
    }
  });

  it("no success response is possible", () => {
    const result = createOneProviderAdapterDryRunCliReport({ explicit_opt_in: true, explicit_live_request: true });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.report.ok).toBe(false);
      expect(result.report.provider_success_simulated).toBe(false);
      expect(result.report.provider_response_simulated).toBe(false);
    }
  });

  it("provider_output_trust_ceiling is T1", () => {
    const result = createOneProviderAdapterDryRunCliReport({ explicit_opt_in: true, explicit_live_request: true });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.report.provider_output_trust_ceiling).toBe("T1");
    }
  });

  it("T2 requires VRP-verified deterministic Hollow evidence", () => {
    const result = createOneProviderAdapterDryRunCliReport({ explicit_opt_in: true, explicit_live_request: true });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.report.vrp_evidence_required_for_T2).toBe(true);
    }
  });

  it("CLI handler does not read process.env or require API keys", () => {
    const result = createOneProviderAdapterDryRunCliReport({ explicit_opt_in: true, explicit_live_request: true });
    expect(result.process_env_read).toBe(false);
    expect(result.api_key_required).toBe(false);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.report.process_env_read).toBe(false);
      expect(result.report.api_key_required).toBe(false);
      expect(result.report.api_key_read).toBe(false);
    }
  });
});

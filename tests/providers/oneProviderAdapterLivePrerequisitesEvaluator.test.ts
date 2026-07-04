import { describe, expect, it } from "vitest";
import { evaluateOneProviderAdapterLivePrerequisites } from "../../src/index.js";
import type { OneProviderAdapterLivePrerequisitesInput } from "../../src/index.js";

const createdAt = "2026-07-04T00:00:00.000Z";

function readyInput(): OneProviderAdapterLivePrerequisitesInput {
  return {
    repo_root_confirmed: true,
    explicit_opt_in: true,
    explicit_live_request: true,
    provider_adapter_allowlisted: true,
    live_harness_allowlisted: true,
    credential_source_declared_by_caller: true,
    credential_auto_read: false,
    network_permission_granted_by_caller: true,
    explicit_live_command_or_flag: true,
    dry_run_report_completed: true,
    default_tests_non_live: true,
    default_acceptance_non_live: true,
    default_ci_non_live: true,
    provider_output_trust_ceiling: "T1",
    vrp_evidence_required_for_T2: true,
    created_at: createdAt
  };
}

describe("one provider adapter live prerequisites evaluator", () => {
  it("is pure input-data only and returns a report object", () => {
    const evaluation = evaluateOneProviderAdapterLivePrerequisites(readyInput());
    expect(evaluation.ok).toBe(false);
    expect(evaluation.evaluation_mode).toBe("prerequisites_evaluation");
  });

  it("missing opt-in blocks prerequisites", () => {
    const evaluation = evaluateOneProviderAdapterLivePrerequisites({ ...readyInput(), explicit_opt_in: false });
    expect(evaluation.prerequisites_met).toBe(false);
    expect(evaluation.missing_prerequisites).toContain("explicit_opt_in");
    expect(evaluation.blocking_reasons).toContain("explicit_opt_in_missing");
  });

  it("missing live request blocks prerequisites", () => {
    const evaluation = evaluateOneProviderAdapterLivePrerequisites({ ...readyInput(), explicit_live_request: false });
    expect(evaluation.prerequisites_met).toBe(false);
    expect(evaluation.missing_prerequisites).toContain("explicit_live_request");
    expect(evaluation.blocking_reasons).toContain("explicit_live_request_missing");
  });

  it("missing allowlisted adapter blocks prerequisites", () => {
    const evaluation = evaluateOneProviderAdapterLivePrerequisites({
      ...readyInput(),
      provider_adapter_allowlisted: false
    });
    expect(evaluation.prerequisites_met).toBe(false);
    expect(evaluation.missing_prerequisites).toContain("provider_adapter_allowlisted");
    expect(evaluation.blocking_reasons).toContain("provider_adapter_not_allowlisted");
  });

  it("missing allowlisted harness blocks prerequisites", () => {
    const evaluation = evaluateOneProviderAdapterLivePrerequisites({
      ...readyInput(),
      live_harness_allowlisted: false
    });
    expect(evaluation.prerequisites_met).toBe(false);
    expect(evaluation.missing_prerequisites).toContain("live_harness_allowlisted");
    expect(evaluation.blocking_reasons).toContain("live_harness_not_allowlisted");
  });

  it("credential_auto_read=true blocks prerequisites", () => {
    const evaluation = evaluateOneProviderAdapterLivePrerequisites({ ...readyInput(), credential_auto_read: true });
    expect(evaluation.prerequisites_met).toBe(false);
    expect(evaluation.missing_prerequisites).toContain("credential_auto_read");
    expect(evaluation.blocking_reasons).toContain("credential_auto_read_enabled");
  });

  it("default_tests_non_live=false blocks prerequisites", () => {
    const evaluation = evaluateOneProviderAdapterLivePrerequisites({
      ...readyInput(),
      default_tests_non_live: false
    });
    expect(evaluation.prerequisites_met).toBe(false);
    expect(evaluation.missing_prerequisites).toContain("default_tests_non_live");
    expect(evaluation.blocking_reasons).toContain("default_tests_non_live_disabled");
  });

  it("default_acceptance_non_live=false blocks prerequisites", () => {
    const evaluation = evaluateOneProviderAdapterLivePrerequisites({
      ...readyInput(),
      default_acceptance_non_live: false
    });
    expect(evaluation.prerequisites_met).toBe(false);
    expect(evaluation.missing_prerequisites).toContain("default_acceptance_non_live");
    expect(evaluation.blocking_reasons).toContain("default_acceptance_non_live_disabled");
  });

  it("default_ci_non_live=false blocks prerequisites", () => {
    const evaluation = evaluateOneProviderAdapterLivePrerequisites({ ...readyInput(), default_ci_non_live: false });
    expect(evaluation.prerequisites_met).toBe(false);
    expect(evaluation.missing_prerequisites).toContain("default_ci_non_live");
    expect(evaluation.blocking_reasons).toContain("default_ci_non_live_disabled");
  });

  it("all valid prerequisites return prerequisites_met=true while live_execution_state remains not_run", () => {
    const evaluation = evaluateOneProviderAdapterLivePrerequisites(readyInput());
    expect(evaluation.prerequisites_met).toBe(true);
    expect(evaluation.missing_prerequisites).toEqual([]);
    expect(evaluation.blocking_reasons).toEqual([]);
    expect(evaluation.live_execution_state).toBe("not_run");
  });

  it("network_attempted is false", () => {
    expect(evaluateOneProviderAdapterLivePrerequisites(readyInput()).network_attempted).toBe(false);
  });

  it("provider execution and response fields are false", () => {
    const evaluation = evaluateOneProviderAdapterLivePrerequisites(readyInput());
    expect(evaluation.provider_execution_attempted).toBe(false);
    expect(evaluation.provider_response_received).toBe(false);
  });

  it("provider output and content presence fields are false", () => {
    const evaluation = evaluateOneProviderAdapterLivePrerequisites(readyInput());
    expect(evaluation.provider_output_present).toBe(false);
    expect(evaluation.provider_content_present).toBe(false);
  });

  it("provider_output_trust_ceiling is T1", () => {
    expect(evaluateOneProviderAdapterLivePrerequisites(readyInput()).provider_output_trust_ceiling).toBe("T1");
  });

  it("T2 requires VRP-verified deterministic Hollow evidence", () => {
    expect(evaluateOneProviderAdapterLivePrerequisites(readyInput()).vrp_evidence_required_for_T2).toBe(true);
  });

  it("credential_auto_read_allowed is locked false regardless of input", () => {
    expect(evaluateOneProviderAdapterLivePrerequisites(readyInput()).credential_auto_read_allowed).toBe(false);
  });

  it("does not read process.env or require API keys", () => {
    const source = evaluateOneProviderAdapterLivePrerequisites.toString();
    expect(source).not.toMatch(/process\.env/);
    expect(source).not.toMatch(/api[_-]?key/i);
  });
});

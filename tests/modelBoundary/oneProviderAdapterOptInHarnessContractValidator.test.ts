import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  assertOneProviderAdapterOptInHarnessDecision,
  assertOneProviderAdapterOptInHarnessRefusal,
  isOneProviderAdapterOptInHarnessDecision,
  isOneProviderAdapterOptInHarnessRefusal,
  validateOneProviderAdapterHumanApprovalRecord,
  validateOneProviderAdapterKillSwitchState,
  validateOneProviderAdapterOptInEvidence,
  validateOneProviderAdapterOptInHarnessDecision,
  validateOneProviderAdapterOptInHarnessRefusal
} from "../../src/modelBoundary/index.js";

type JsonObject = Record<string, unknown>;

function readExample<T>(name: string): T {
  return JSON.parse(readFileSync(new URL(`../../examples/modelBoundary/${name}`, import.meta.url), "utf8")) as T;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function setPath(value: JsonObject, path: string, next: unknown): JsonObject {
  const parts = path.split(".");
  let cursor: JsonObject = value;
  for (const part of parts.slice(0, -1)) cursor = cursor[part] as JsonObject;
  cursor[parts.at(-1) ?? path] = next;
  return value;
}

const decision = () => clone(readExample<JsonObject>("one-provider-adapter-harness-decision.valid.json"));
const refusal = () => clone(readExample<JsonObject>("one-provider-adapter-harness-refusal.valid.json"));
const evidence = () => clone(readExample<JsonObject>("one-provider-adapter-opt-in-evidence.valid.json"));
const approval = () => clone(readExample<JsonObject>("one-provider-adapter-human-approval.valid.json"));
const killSwitch = () => clone(readExample<JsonObject>("one-provider-adapter-kill-switch.valid.json"));

const decisionCases: Array<[string, string, unknown]> = [
  ["invalid status fails", "status", "ready"],
  ["invalid decision_kind fails", "decision_kind", "allow_live_now"],
  ["invalid refusal_kind fails", "refusal_kind", "success"],
  ["env_var_value_read true fails", "opt_in_evidence.env_flag_ref.env_var_value_read", true],
  ["env_var_value_stored true fails", "opt_in_evidence.env_flag_ref.env_var_value_stored", true],
  ["env_var_value_logged true fails", "opt_in_evidence.env_flag_ref.env_var_value_logged", true],
  ["env_var_value_written_to_ledger true fails", "opt_in_evidence.env_flag_ref.env_var_value_written_to_ledger", true],
  ["env_var_value_written_to_storage true fails", "opt_in_evidence.env_flag_ref.env_var_value_written_to_storage", true],
  ["env_var_name_promotes_trust true fails", "opt_in_evidence.env_flag_ref.env_var_name_promotes_trust", true],
  ["command_flag_required false fails", "opt_in_evidence.command_flag.command_flag_required", false],
  ["command_flag_promotes_trust true fails", "opt_in_evidence.command_flag.command_flag_promotes_trust", true],
  ["provider_allowlist_required false fails", "opt_in_evidence.allowlist.provider_allowlist_required", false],
  ["provider_allowlist_promotes_trust true fails", "opt_in_evidence.allowlist.provider_allowlist_promotes_trust", true],
  ["adapter_id_required false fails", "opt_in_evidence.adapter_id.adapter_id_required", false],
  ["adapter_id_promotes_trust true fails", "opt_in_evidence.adapter_id.adapter_id_promotes_trust", true],
  ["human_approval_required false fails", "human_approval.human_approval_required", false],
  ["approval_promotes_trust true fails", "human_approval.approval_promotes_trust", true],
  ["approval_allows_live_execution_in_r26 true fails", "human_approval.approval_allows_live_execution_in_r26", true],
  ["kill_switch_required false fails", "kill_switch.kill_switch_required", false],
  ["kill_switch_value_read true fails", "kill_switch.kill_switch_value_read", true],
  ["kill_switch_enabled_by_default true fails", "kill_switch.kill_switch_enabled_by_default", true],
  ["kill_switch_allows_live_execution true fails", "kill_switch.kill_switch_allows_live_execution", true],
  ["kill_switch_blocks_live_execution false fails", "kill_switch.kill_switch_blocks_live_execution", false],
  ["kill_switch_promotes_trust true fails", "kill_switch.kill_switch_promotes_trust", true],
  ["api_key_env_var_name_is_secret true fails", "opt_in_evidence.api_key_availability.api_key_env_var_name_is_secret", true],
  ["api_key_value_present true fails", "opt_in_evidence.api_key_availability.api_key_value_present", true],
  ["api_key_value_read true fails", "opt_in_evidence.api_key_availability.api_key_value_read", true],
  ["api_key_value_stored true fails", "opt_in_evidence.api_key_availability.api_key_value_stored", true],
  ["api_key_value_logged true fails", "opt_in_evidence.api_key_availability.api_key_value_logged", true],
  ["api_key_value_written_to_ledger true fails", "opt_in_evidence.api_key_availability.api_key_value_written_to_ledger", true],
  ["api_key_value_written_to_storage true fails", "opt_in_evidence.api_key_availability.api_key_value_written_to_storage", true],
  ["api_key_value_available_for_r26 true fails", "opt_in_evidence.api_key_availability.api_key_value_available_for_r26", true],
  ["api_key_presence_promotes_trust true fails", "opt_in_evidence.api_key_availability.api_key_presence_promotes_trust", true],
  ["redaction_policy_required false fails", "redaction.redaction_policy_required", false],
  ["redaction_manifest_required false fails", "redaction.redaction_manifest_required", false],
  ["redaction_result_required false fails", "redaction.redaction_result_required", false],
  ["redaction_promotes_trust true fails", "redaction.redaction_promotes_trust", true],
  ["redaction_metadata_promotes_trust true fails", "redaction.redaction_metadata_promotes_trust", true],
  ["raw_prompt_allowed true fails", "redaction.raw_prompt_allowed", true],
  ["raw_output_allowed true fails", "redaction.raw_output_allowed", true],
  ["safety_profile_required false fails", "safety_profile.safety_profile_required", false],
  ["safety_profile_promotes_trust true fails", "safety_profile.safety_profile_promotes_trust", true],
  ["cost_guard_required false fails", "cost_guard.cost_guard_required", false],
  ["max_live_requests_per_test <= 0 fails", "cost_guard.max_live_requests_per_test", 0],
  ["max_output_tokens <= 0 fails", "cost_guard.max_output_tokens", 0],
  ["max_cost_units_per_run <= 0 fails", "cost_guard.max_cost_units_per_run", 0],
  ["background_live_calls_allowed true fails", "cost_guard.background_live_calls_allowed", true],
  ["cost_guard_promotes_trust true fails", "cost_guard.cost_guard_promotes_trust", true],
  ["live_tests_created_in_r26 true fails", "live_test_gate.live_tests_created_in_r26", true],
  ["live_tests_allowed_in_default_run true fails", "live_test_gate.live_tests_allowed_in_default_run", true],
  ["live_tests_opt_in_only false fails", "live_test_gate.live_tests_opt_in_only", false],
  ["live_tests_skipped_by_default false fails", "live_test_gate.live_tests_skipped_by_default", false],
  ["live_tests_can_run_in_ci_by_default true fails", "live_test_gate.live_tests_can_run_in_ci_by_default", true],
  ["test fixture secret flags true fail", "live_test_gate.test_fixtures_contain_secrets", true],
  ["test fixture API key flags true fail", "live_test_gate.test_fixtures_contain_api_keys", true],
  ["test fixture raw prompt flags true fail", "live_test_gate.test_fixtures_contain_raw_prompt", true],
  ["test fixture raw output flags true fail", "live_test_gate.test_fixtures_contain_raw_output", true],
  ["live_test_gate_promotes_trust true fails", "live_test_gate.live_test_gate_promotes_trust", true],
  ["opt_in_evidence_promotes_trust true fails", "trust_summary.opt_in_evidence_promotes_trust", true],
  ["command_flag_promotes_trust true fails", "trust_summary.command_flag_promotes_trust", true],
  ["env_flag_name_promotes_trust true fails", "trust_summary.env_flag_name_promotes_trust", true],
  ["human_approval_promotes_trust true fails", "trust_summary.human_approval_promotes_trust", true],
  ["kill_switch_state_promotes_trust true fails", "trust_summary.kill_switch_state_promotes_trust", true],
  ["provider_allowlist_promotes_trust true fails", "trust_summary.provider_allowlist_promotes_trust", true],
  ["network_permission_promotes_trust true fails", "trust_summary.network_permission_promotes_trust", true],
  ["harness_decision_promotes_trust true fails", "trust_summary.harness_decision_promotes_trust", true],
  ["live_execution_allowed_in_r26 true fails", "trust_summary.live_execution_allowed_in_r26", true],
  ["provider_identity_promotes_trust true fails", "trust_summary.provider_identity_promotes_trust", true],
  ["successful_provider_response_promotes_trust true fails", "trust_summary.successful_provider_response_promotes_trust", true],
  ["provider_output_is_deterministic_evidence true fails", "trust_summary.provider_output_is_deterministic_evidence", true],
  ["raw_provider_output_trust_tier other than T0 fails", "trust_summary.raw_provider_output_trust_tier", "T1"],
  ["schema_valid_provider_output_trust_tier other than T1 fails", "trust_summary.schema_valid_provider_output_trust_tier", "T2"],
  ["max_provider_output_trust_tier above T1 fails", "trust_summary.max_provider_output_trust_tier", "T2"],
  ["verified_final_truth_claimed true fails", "trust_summary.verified_final_truth_claimed", true],
  ["requires_hollow_verification_for_t2 false fails", "trust_summary.requires_hollow_verification_for_t2", false],
  ["live_execution_attempted true fails", "audit_summary.live_execution_attempted", true],
  ["provider_call_attempted true fails", "audit_summary.provider_call_attempted", true],
  ["network_call_attempted true fails", "audit_summary.network_call_attempted", true],
  ["audit api_key_value_read true fails", "audit_summary.api_key_value_read", true],
  ["process_env_read true fails", "audit_summary.process_env_read", true],
  ["provider_sdk_used true fails", "audit_summary.provider_sdk_used", true],
  ["ledger_write_attempted true fails", "audit_summary.ledger_write_attempted", true],
  ["file_write_attempted true fails", "audit_summary.file_write_attempted", true],
  ["fake_success_returned true fails", "audit_summary.fake_success_returned", true],
  ["provider_output_returned true fails", "audit_summary.provider_output_returned", true],
  ["refusal ok true fails", "refusal.ok", true]
];

describe("one provider adapter opt-in harness contract validator", () => {
  it("valid opt-in evidence example passes", () => expect(validateOneProviderAdapterOptInEvidence(evidence()).ok).toBe(true));
  it("valid human approval example passes", () => expect(validateOneProviderAdapterHumanApprovalRecord(approval()).ok).toBe(true));
  it("valid kill switch example passes", () => expect(validateOneProviderAdapterKillSwitchState(killSwitch()).ok).toBe(true));
  it("valid decision example passes", () => expect(validateOneProviderAdapterOptInHarnessDecision(decision()).ok).toBe(true));
  it("valid refusal example passes", () => expect(validateOneProviderAdapterOptInHarnessRefusal(refusal()).ok).toBe(true));
  it("invalid trust-promotion example fails", () => expect(validateOneProviderAdapterOptInHarnessDecision(readExample<JsonObject>("one-provider-adapter-harness-decision.invalid.trust-promotion.json")).ok).toBe(false));
  it("invalid secret-leakage example fails", () => expect(validateOneProviderAdapterOptInHarnessDecision(readExample<JsonObject>("one-provider-adapter-harness-decision.invalid.secret-leakage.json")).ok).toBe(false));
  it("non-object decision fails", () => expect(validateOneProviderAdapterOptInHarnessDecision(null).ok).toBe(false));
  it("missing required fields fail", () => { const candidate = decision(); delete candidate["decision_id"]; expect(validateOneProviderAdapterOptInHarnessDecision(candidate).ok).toBe(false); });

  it.each(decisionCases)("%s", (_name, path, value) => {
    expect(validateOneProviderAdapterOptInHarnessDecision(setPath(decision(), path, value)).ok).toBe(false);
  });

  it.each(["raw_prompt_text", "prompt_text", "raw_output_text", "output_text", "api_key", "api_key_value", "secret", "env", "env_value", "environment", "environment_value", "credential", "auth_token", "private_key"])("%s top-level field fails", (field) => {
    expect(validateOneProviderAdapterOptInHarnessDecision({ ...decision(), [field]: "blocked" }).ok).toBe(false);
  });

  it("type guards return true only for valid examples", () => {
    expect(isOneProviderAdapterOptInHarnessDecision(decision())).toBe(true);
    expect(isOneProviderAdapterOptInHarnessDecision(setPath(decision(), "trust_summary.max_provider_output_trust_tier", "T2"))).toBe(false);
    expect(isOneProviderAdapterOptInHarnessRefusal(refusal())).toBe(true);
    expect(isOneProviderAdapterOptInHarnessRefusal(setPath(refusal(), "ok", true))).toBe(false);
  });

  it("assert helpers throw on invalid examples", () => {
    expect(assertOneProviderAdapterOptInHarnessDecision(decision())).toEqual(decision());
    expect(assertOneProviderAdapterOptInHarnessRefusal(refusal())).toEqual(refusal());
    expect(() => assertOneProviderAdapterOptInHarnessDecision(setPath(decision(), "trust_summary.harness_decision_promotes_trust", true))).toThrow("Invalid OneProviderAdapterOptInHarnessDecision");
    expect(() => assertOneProviderAdapterOptInHarnessRefusal(setPath(refusal(), "ok", true))).toThrow("Invalid OneProviderAdapterOptInHarnessRefusal");
  });

  it("validator source does not read process env", () => {
    const source = readFileSync(new URL("../../src/modelBoundary/oneProviderAdapterOptInHarnessContractValidator.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/process\.env/);
  });

  it("validator source does not import provider SDKs", () => {
    const source = readFileSync(new URL("../../src/modelBoundary/oneProviderAdapterOptInHarnessContractValidator.ts", import.meta.url), "utf8");
    const importLines = source.split(/\r?\n/).filter((line) => line.trim().startsWith("import "));
    expect(importLines.join("\n")).not.toMatch(/openai|anthropic|gemini|grok|langchain|langgraph|autogen|crewai|@ai-sdk|google/i);
  });

  it("validator source does not call network APIs", () => {
    const source = readFileSync(new URL("../../src/modelBoundary/oneProviderAdapterOptInHarnessContractValidator.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/fetch\(|XMLHttpRequest|node:http|node:https/);
  });

  it("validator source does not write files", () => {
    const source = readFileSync(new URL("../../src/modelBoundary/oneProviderAdapterOptInHarnessContractValidator.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/writeFile|appendFile|createWriteStream/);
  });

  it("validator source does not write Ledger", () => {
    const source = readFileSync(new URL("../../src/modelBoundary/oneProviderAdapterOptInHarnessContractValidator.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/ledger\.append|recordInvocation|createLedgerEntry|writeLedger/i);
  });

  it("package.json unchanged with no provider SDK dependency", () => {
    const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    expect([...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})].join("\n")).not.toMatch(/openai|anthropic|gemini|grok|langchain|langgraph|autogen|crewai|@ai-sdk|google/i);
  });

  it("examples validate", () => {
    expect(validateOneProviderAdapterOptInEvidence(evidence()).ok).toBe(true);
    expect(validateOneProviderAdapterHumanApprovalRecord(approval()).ok).toBe(true);
    expect(validateOneProviderAdapterKillSwitchState(killSwitch()).ok).toBe(true);
    expect(validateOneProviderAdapterOptInHarnessDecision(decision()).ok).toBe(true);
    expect(validateOneProviderAdapterOptInHarnessRefusal(refusal()).ok).toBe(true);
  });
});

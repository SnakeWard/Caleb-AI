import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  assertOneProviderAdapterConfigDocument,
  assertOneProviderAdapterConfigRefusal,
  isOneProviderAdapterConfigDocument,
  isOneProviderAdapterConfigRefusal,
  validateOneProviderAdapterConfigDocument,
  validateOneProviderAdapterConfigRefusal
} from "../../src/modelBoundary/index.js";

type JsonObject = Record<string, unknown>;

function readExample<T>(name: string): T {
  return JSON.parse(readFileSync(new URL(`../../examples/modelBoundary/${name}`, import.meta.url), "utf8")) as T;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function config(): JsonObject {
  return clone(readExample<JsonObject>("one-provider-adapter-config-contract.valid.json"));
}

function refusal(): JsonObject {
  return clone(readExample<JsonObject>("one-provider-adapter-config-refusal.valid.json"));
}

function setPath(value: JsonObject, path: string, next: unknown): JsonObject {
  const parts = path.split(".");
  let cursor: JsonObject = value;
  for (const part of parts.slice(0, -1)) cursor = cursor[part] as JsonObject;
  cursor[parts[parts.length - 1] ?? path] = next;
  return value;
}

const configCases: Array<[string, string, unknown]> = [
  ["invalid config_status fails", "config_status", "config_success"],
  ["invalid config_source_kind fails", "config_source_kind", "runtime_magic"],
  ["provider_slot_id other than first_provider_slot fails", "provider_slot.provider_slot_id", "second_provider_slot"],
  ["real_provider_selected true fails", "provider_slot.real_provider_selected", true],
  ["provider_specific_behavior_enabled true fails", "provider_slot.provider_specific_behavior_enabled", true],
  ["provider_slot_selection_promotes_trust true fails", "provider_slot.provider_slot_selection_promotes_trust", true],
  ["explicit_opt_in_required false fails", "opt_in.explicit_opt_in_required", false],
  ["opt_in_value_present true fails in R24 example", "opt_in.opt_in_value_present", true],
  ["opt_in_enabled_by_default true fails", "opt_in.opt_in_enabled_by_default", true],
  ["explicit_command_flag_present true fails in R24 example", "opt_in.explicit_command_flag_present", true],
  ["human_approval_recorded true fails in R24 example", "opt_in.human_approval_recorded", true],
  ["opt_in_promotes_trust true fails", "opt_in.opt_in_promotes_trust", true],
  ["fake_success_allowed true fails", "opt_in.fake_success_allowed", true],
  ["provider_allowlist_required false fails", "allowlist.provider_allowlist_required", false],
  ["allowlist_promotes_trust true fails", "allowlist.allowlist_promotes_trust", true],
  ["api_key_env_var_name_is_secret true fails", "api_key_ref.api_key_env_var_name_is_secret", true],
  ["api_key_value_present true fails", "api_key_ref.api_key_value_present", true],
  ["api_key_value_read true fails", "api_key_ref.api_key_value_read", true],
  ["api_key_value_stored true fails", "api_key_ref.api_key_value_stored", true],
  ["api_key_value_logged true fails", "api_key_ref.api_key_value_logged", true],
  ["api_key_value_written_to_ledger true fails", "api_key_ref.api_key_value_written_to_ledger", true],
  ["api_key_value_written_to_storage true fails", "api_key_ref.api_key_value_written_to_storage", true],
  ["api_key_value_allowed_in_fixtures true fails", "api_key_ref.api_key_value_allowed_in_fixtures", true],
  ["api_key_presence_promotes_trust true fails", "api_key_ref.api_key_presence_promotes_trust", true],
  ["network_calls_allowed_by_default true fails", "network.network_calls_allowed_by_default", true],
  ["network_calls_require_opt_in false fails", "network.network_calls_require_opt_in", false],
  ["network_available_in_r24 true fails", "network.network_available_in_r24", true],
  ["network_call_performed_in_r24 true fails", "network.network_call_performed_in_r24", true],
  ["default_unit_tests_offline false fails", "network.default_unit_tests_offline", false],
  ["default_acceptance_tests_offline false fails", "network.default_acceptance_tests_offline", false],
  ["live_tests_opt_in_only false fails", "network.live_tests_opt_in_only", false],
  ["live_tests_skipped_by_default false fails", "network.live_tests_skipped_by_default", false],
  ["network_success_promotes_trust true fails", "network.network_success_promotes_trust", true],
  ["network_failure_normalized false fails", "network.network_failure_normalized", false],
  ["timeout_required false fails", "timeout_retry.timeout_required", false],
  ["timeout_ms <= 0 fails", "timeout_retry.timeout_ms", 0],
  ["retry_count < 0 fails", "timeout_retry.retry_count", -1],
  ["max_retry_count < 0 fails", "timeout_retry.max_retry_count", -1],
  ["retry_count > max_retry_count fails", "timeout_retry.retry_count", 1],
  ["retry_count_recorded false fails", "timeout_retry.retry_count_recorded", false],
  ["unbounded_retries_allowed true fails", "timeout_retry.unbounded_retries_allowed", true],
  ["silent_retry_allowed true fails", "timeout_retry.silent_retry_allowed", true],
  ["cost_guard_required false fails", "cost_guard.cost_guard_required", false],
  ["max_live_requests_per_test <= 0 fails", "cost_guard.max_live_requests_per_test", 0],
  ["max_output_tokens <= 0 fails", "cost_guard.max_output_tokens", 0],
  ["max_cost_units_per_run <= 0 fails", "cost_guard.max_cost_units_per_run", 0],
  ["cost_warning_required false fails", "cost_guard.cost_warning_required", false],
  ["cost_stop_condition_required false fails", "cost_guard.cost_stop_condition_required", false],
  ["background_live_calls_allowed true fails", "cost_guard.background_live_calls_allowed", true],
  ["live_tests_created_in_r24 true fails", "live_test_gate.live_tests_created_in_r24", true],
  ["live_tests_allowed_in_default_run true fails", "live_test_gate.live_tests_allowed_in_default_run", true],
  ["live_tests_skipped_by_default false fails", "live_test_gate.live_tests_skipped_by_default", false],
  ["live_tests_can_run_in_ci_by_default true fails", "live_test_gate.live_tests_can_run_in_ci_by_default", true],
  ["test fixture secrets flag true fails", "live_test_gate.test_fixtures_may_contain_secrets", true],
  ["test fixture api key flag true fails", "live_test_gate.test_fixtures_may_contain_api_keys", true],
  ["test fixture raw prompt flag true fails", "live_test_gate.test_fixtures_may_contain_raw_prompt", true],
  ["test fixture raw output flag true fails", "live_test_gate.test_fixtures_may_contain_raw_output", true],
  ["raw_prompt_allowed true fails", "redaction.raw_prompt_allowed", true],
  ["raw_output_allowed true fails", "redaction.raw_output_allowed", true],
  ["raw_transcript_storage_allowed true fails", "redaction.raw_transcript_storage_allowed", true],
  ["redaction_promotes_trust true fails", "redaction.redaction_promotes_trust", true],
  ["redaction_metadata_promotes_trust true fails", "redaction.redaction_metadata_promotes_trust", true],
  ["safety_profile_required false fails", "safety_profile.safety_profile_required", false],
  ["safety_profile_promotes_trust true fails", "safety_profile.safety_profile_promotes_trust", true],
  ["ledger_write_allowed_in_config_contract true fails", "ledger.ledger_write_allowed_in_config_contract", true],
  ["raw_prompt_written_to_ledger true fails", "ledger.raw_prompt_written_to_ledger", true],
  ["raw_output_written_to_ledger true fails", "ledger.raw_output_written_to_ledger", true],
  ["api_key_written_to_ledger true fails", "ledger.api_key_written_to_ledger", true],
  ["secrets_written_to_ledger true fails", "ledger.secrets_written_to_ledger", true],
  ["env_values_written_to_ledger true fails", "ledger.env_values_written_to_ledger", true],
  ["ledger_write_promotes_trust true fails", "ledger.ledger_write_promotes_trust", true],
  ["ledger_presence_promotes_trust true fails", "ledger.ledger_presence_promotes_trust", true],
  ["storage_write_allowed_in_config_contract true fails", "runtime_storage.storage_write_allowed_in_config_contract", true],
  ["persistent_transcript_storage_allowed true fails", "runtime_storage.persistent_transcript_storage_allowed", true],
  ["raw_provider_output_storage_tier other than T0 fails", "runtime_storage.raw_provider_output_storage_tier", "T1"],
  ["schema_valid_provider_output_storage_tier other than T1 fails", "runtime_storage.schema_valid_provider_output_storage_tier", "T2"],
  ["storage_promotes_trust true fails", "runtime_storage.storage_promotes_trust", true],
  ["retrieval_promotes_trust true fails", "runtime_storage.retrieval_promotes_trust", true],
  ["persistence_is_verification true fails", "runtime_storage.persistence_is_verification", true],
  ["raw_provider_output_trust_tier other than T0 fails", "trust_cap.raw_provider_output_trust_tier", "T1"],
  ["schema_valid_provider_output_trust_tier other than T1 fails", "trust_cap.schema_valid_provider_output_trust_tier", "T2"],
  ["max_provider_output_trust_tier above T1 fails", "trust_cap.max_provider_output_trust_tier", "T2"],
  ["config_validity_promotes_trust true fails", "trust_cap.config_validity_promotes_trust", true],
  ["config_presence_promotes_opt_in true fails", "trust_cap.config_presence_promotes_opt_in", true],
  ["explicit_opt_in_promotes_trust true fails", "trust_cap.explicit_opt_in_promotes_trust", true],
  ["api_key_env_var_name_promotes_trust true fails", "trust_cap.api_key_env_var_name_promotes_trust", true],
  ["provider_identity_promotes_trust true fails", "trust_cap.provider_identity_promotes_trust", true],
  ["successful_provider_response_promotes_trust true fails", "trust_cap.successful_provider_response_promotes_trust", true],
  ["provider_output_is_deterministic_evidence true fails", "trust_cap.provider_output_is_deterministic_evidence", true],
  ["verified_final_truth_claimed true fails", "trust_cap.verified_final_truth_claimed", true],
  ["requires_hollow_verification_for_t2 false fails", "trust_cap.requires_hollow_verification_for_t2", false],
  ["kill_switch_required false fails", "kill_switch.kill_switch_required", false],
  ["kill_switch_enabled_by_default true fails", "kill_switch.kill_switch_enabled_by_default", true],
  ["safe refusal disabled flag false fails", "kill_switch.safe_refusal_when_disabled", false],
  ["safe refusal not allowlisted flag false fails", "kill_switch.safe_refusal_when_not_allowlisted", false],
  ["safe refusal api key missing flag false fails", "kill_switch.safe_refusal_when_api_key_missing", false],
  ["safe refusal redaction missing flag false fails", "kill_switch.safe_refusal_when_redaction_missing", false],
  ["safe refusal safety profile missing flag false fails", "kill_switch.safe_refusal_when_safety_profile_missing", false],
  ["rollback_instructions_required false fails", "kill_switch.rollback_instructions_required", false]
];

const refusalCases: Array<[string, string, unknown]> = [
  ["refusal ok true fails", "ok", true],
  ["refusal fake_success_returned true fails", "fake_success_returned", true],
  ["refusal provider_call_attempted true fails", "provider_call_attempted", true],
  ["refusal network_call_attempted true fails", "network_call_attempted", true],
  ["refusal api_key_value_read true fails", "api_key_value_read", true],
  ["refusal trust_promoted true fails", "trust_promoted", true]
];

describe("one provider adapter config contract validator", () => {
  it("valid config example passes", () => {
    expect(validateOneProviderAdapterConfigDocument(config())).toEqual({ ok: true, errors: [] });
  });

  it("valid refusal example passes", () => {
    expect(validateOneProviderAdapterConfigRefusal(refusal())).toEqual({ ok: true, errors: [] });
  });

  it("invalid secret leakage example fails", () => {
    expect(validateOneProviderAdapterConfigDocument(readExample<JsonObject>("one-provider-adapter-config-contract.invalid.secret-leakage.json")).ok).toBe(false);
  });

  it("invalid trust promotion example fails", () => {
    expect(validateOneProviderAdapterConfigDocument(readExample<JsonObject>("one-provider-adapter-config-contract.invalid.trust-promotion.json")).ok).toBe(false);
  });

  it("non-object config fails", () => {
    expect(validateOneProviderAdapterConfigDocument(null).ok).toBe(false);
  });

  it("missing required fields fail", () => {
    const candidate = config();
    delete candidate["provider_slot"];
    expect(validateOneProviderAdapterConfigDocument(candidate).ok).toBe(false);
  });

  it.each(configCases)("%s", (_name, path, value) => {
    expect(validateOneProviderAdapterConfigDocument(setPath(config(), path, value)).ok).toBe(false);
  });

  it.each(refusalCases)("%s", (_name, path, value) => {
    expect(validateOneProviderAdapterConfigRefusal(setPath(refusal(), path, value)).ok).toBe(false);
  });

  it.each(["raw_prompt_text", "prompt_text", "raw_output_text", "output_text", "api_key", "api_key_value", "secret", "env", "env_value", "environment", "environment_value", "credential", "auth_token", "private_key"])("%s top-level field fails", (field) => {
    expect(validateOneProviderAdapterConfigDocument({ ...config(), [field]: "blocked" }).ok).toBe(false);
  });

  it("type guards return true only for valid examples", () => {
    expect(isOneProviderAdapterConfigDocument(config())).toBe(true);
    expect(isOneProviderAdapterConfigDocument(setPath(config(), "trust_cap.max_provider_output_trust_tier", "T2"))).toBe(false);
    expect(isOneProviderAdapterConfigRefusal(refusal())).toBe(true);
    expect(isOneProviderAdapterConfigRefusal(setPath(refusal(), "ok", true))).toBe(false);
  });

  it("assert helpers throw on invalid examples", () => {
    expect(assertOneProviderAdapterConfigDocument(config())).toEqual(config());
    expect(assertOneProviderAdapterConfigRefusal(refusal())).toEqual(refusal());
    expect(() => assertOneProviderAdapterConfigDocument(setPath(config(), "api_key_ref.api_key_value_read", true))).toThrow("Invalid OneProviderAdapterConfigDocument");
    expect(() => assertOneProviderAdapterConfigRefusal(setPath(refusal(), "network_call_attempted", true))).toThrow("Invalid OneProviderAdapterConfigRefusal");
  });

  it("validator source does not read process env", () => {
    const source = readFileSync(new URL("../../src/modelBoundary/oneProviderAdapterConfigContractValidator.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/process\.env/);
  });

  it("validator source does not import provider SDKs", () => {
    const source = readFileSync(new URL("../../src/modelBoundary/oneProviderAdapterConfigContractValidator.ts", import.meta.url), "utf8");
    const importLines = source.split(/\r?\n/).filter((line) => line.trim().startsWith("import "));
    expect(importLines.join("\n")).not.toMatch(/openai|anthropic|gemini|grok|langchain|langgraph|autogen|crewai|@ai-sdk|google/i);
  });

  it("validator source does not call network APIs", () => {
    const source = readFileSync(new URL("../../src/modelBoundary/oneProviderAdapterConfigContractValidator.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/fetch\(|XMLHttpRequest|node:http|node:https/);
  });

  it("validator source does not write files", () => {
    const source = readFileSync(new URL("../../src/modelBoundary/oneProviderAdapterConfigContractValidator.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/writeFile|appendFile|createWriteStream/);
  });

  it("validator source does not write Ledger", () => {
    const source = readFileSync(new URL("../../src/modelBoundary/oneProviderAdapterConfigContractValidator.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/ledger\.append|recordInvocation|createLedgerEntry|writeLedger/i);
  });
});

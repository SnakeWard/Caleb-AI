import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  assertOneProviderAdapterConfig,
  assertOneProviderAdapterOptInGate,
  isOneProviderAdapterConfig,
  isOneProviderAdapterOptInGate,
  validateOneProviderAdapterConfig,
  validateOneProviderAdapterMapping,
  validateOneProviderAdapterOptInGate
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
  for (const part of parts.slice(0, -1)) {
    cursor = cursor[part] as JsonObject;
  }
  cursor[parts[parts.length - 1] ?? path] = next;
  return value;
}

function validConfig(): JsonObject {
  return clone(readExample<JsonObject>("one-provider-adapter-config.valid.json"));
}

function validGate(): JsonObject {
  return clone(readExample<JsonObject>("one-provider-adapter-opt-in-gate.valid.json"));
}

function validMapping(): JsonObject {
  return clone(readExample<JsonObject>("one-provider-adapter-mapping.valid.json"));
}

const configInvalidCases: Array<[string, string, unknown]> = [
  ["rejects blank config schema version", "schema_version", ""],
  ["rejects blank config id", "config_id", ""],
  ["rejects non-first root provider slot", "provider_slot_id", "second_provider_slot"],
  ["rejects blank adapter id", "adapter_id", ""],
  ["rejects blank adapter version", "adapter_version", ""],
  ["rejects blank created_at", "created_at", ""],
  ["rejects non-array config notes", "notes", "note"],
  ["rejects provider selection slot drift", "provider_selection.provider_slot_id", "second_provider_slot"],
  ["rejects selected provider", "provider_selection.provider_selected", true],
  ["rejects authorized provider selection", "provider_selection.provider_selection_authorized", true],
  ["rejects provider selection notes as text", "provider_selection.provider_selection_notes", "note"],
  ["rejects missing opt-in requirement", "opt_in_gate.opt_in_required", false],
  ["rejects blank opt-in env var name", "opt_in_gate.opt_in_env_var_name", ""],
  ["rejects missing provider allowlist gate", "opt_in_gate.provider_allowlist_required", false],
  ["rejects missing adapter id gate", "opt_in_gate.adapter_id_required", false],
  ["rejects missing explicit command gate", "opt_in_gate.explicit_command_flag_required", false],
  ["rejects missing human approval gate", "opt_in_gate.human_approval_required", false],
  ["rejects default runtime enablement", "opt_in_gate.default_runtime_enabled", true],
  ["rejects unknown missing opt-in failure", "opt_in_gate.missing_opt_in_failure_kind", "success"],
  ["rejects fake provider success", "opt_in_gate.fake_success_allowed", true],
  ["rejects non-array opt-in notes", "opt_in_gate.notes", "note"],
  ["rejects disabled allowlist requirement", "allowlist.allowlist_required", false],
  ["rejects non-array allowed provider ids", "allowlist.allowed_provider_ids", "provider"],
  ["rejects non-array allowed provider kinds", "allowlist.allowed_provider_kinds", "kind"],
  ["rejects unknown allowlist failure kind", "allowlist.provider_not_allowlisted_failure_kind", "success"],
  ["rejects secret allowlist values", "allowlist.allowlist_values_are_secrets", true],
  ["rejects live api key requirement disabled", "api_key_ref.api_key_required_for_live", false],
  ["rejects blank api key env var name", "api_key_ref.api_key_env_var_name", ""],
  ["rejects present api key value", "api_key_ref.api_key_value_present", true],
  ["rejects stored api key value", "api_key_ref.api_key_value_stored", true],
  ["rejects logged api key value", "api_key_ref.api_key_value_logged", true],
  ["rejects ledgered api key value", "api_key_ref.api_key_value_written_to_ledger", true],
  ["rejects stored api key value in runtime storage", "api_key_ref.api_key_value_written_to_storage", true],
  ["rejects api key value in fixtures", "api_key_ref.api_key_value_allowed_in_fixtures", true],
  ["rejects unknown missing api key failure", "api_key_ref.missing_api_key_failure_kind", "success"],
  ["rejects api key trust promotion", "api_key_ref.api_key_presence_promotes_trust", true],
  ["rejects default network calls", "network_policy.network_calls_allowed_by_default", true],
  ["rejects network without opt-in", "network_policy.network_calls_require_opt_in", false],
  ["rejects online default unit tests", "network_policy.default_unit_tests_offline", false],
  ["rejects online default acceptance tests", "network_policy.default_acceptance_tests_offline", false],
  ["rejects non-opt-in live tests", "network_policy.live_tests_opt_in_only", false],
  ["rejects live tests enabled by default", "network_policy.live_tests_skipped_by_default", false],
  ["rejects network success trust promotion", "network_policy.network_success_promotes_trust", true],
  ["rejects unnormalized network failure", "network_policy.network_failure_normalized", false],
  ["rejects missing timeout requirement", "network_policy.timeout_required", false],
  ["rejects unbounded retry policy", "network_policy.retries_bounded", false],
  ["rejects unbounded cost policy", "network_policy.costs_bounded", false],
  ["rejects zero timeout", "timeout_retry_policy.timeout_ms", 0],
  ["rejects negative retry count", "timeout_retry_policy.retry_count", -1],
  ["rejects blank retry strategy", "timeout_retry_policy.retry_backoff_strategy", ""],
  ["rejects unbounded retries", "timeout_retry_policy.unbounded_retries_allowed", true],
  ["rejects silent retries", "timeout_retry_policy.silent_retry_allowed", true],
  ["rejects omitted retry recording", "timeout_retry_policy.retry_count_recorded", false],
  ["rejects unknown timeout failure kind", "timeout_retry_policy.provider_timeout_failure_kind", "success"],
  ["rejects missing cost guard", "cost_guard.cost_guard_required", false],
  ["rejects zero max live requests", "cost_guard.max_live_requests_per_test", 0],
  ["rejects zero max output tokens", "cost_guard.max_output_tokens", 0],
  ["rejects negative max retry count", "cost_guard.max_retry_count", -1],
  ["rejects background live calls", "cost_guard.background_live_calls_allowed", true],
  ["rejects unknown cost failure kind", "cost_guard.cost_limit_exceeded_failure_kind", "success"],
  ["rejects live tests in default run", "live_test_gate.live_tests_allowed_in_default_run", true]
];

const mappingInvalidCases: Array<[string, string, unknown]> = [
  ["rejects request mapping disabled", "request_mapping.maps_from_live_adapter_request", false],
  ["rejects provider-specific request shape", "request_mapping.provider_specific_request_shape_defined", true],
  ["rejects raw prompt forwarding", "request_mapping.raw_prompt_forwarding_allowed", true],
  ["rejects secrets in provider payload", "request_mapping.secrets_in_payload_allowed", true],
  ["rejects response mapping disabled", "response_mapping.maps_to_live_adapter_response", false],
  ["rejects raw output storage", "response_mapping.raw_output_storage_allowed", true],
  ["rejects successful response trust promotion", "response_mapping.successful_response_promotes_trust", true],
  ["rejects non-array failure kinds", "failure_mapping.failure_kinds_supported", "provider_timeout"],
  ["rejects failure truth claims", "failure_mapping.failures_claim_verified_truth", true],
  ["rejects raw prompt redaction bypass", "redaction_compatibility.raw_prompt_allowed", true],
  ["rejects api key ledger writes", "ledger_compatibility.api_key_written_to_ledger", true],
  ["rejects T2 trust cap promotion", "trust_cap.max_provider_output_trust_tier", "T2"]
];

describe("one provider adapter type extension validator", () => {
  it("accepts the valid full config example", () => {
    expect(validateOneProviderAdapterConfig(validConfig())).toEqual({ ok: true, errors: [] });
  });

  it("accepts the valid opt-in gate example", () => {
    expect(validateOneProviderAdapterOptInGate(validGate())).toEqual({ ok: true, errors: [] });
  });

  it("accepts the valid mapping example", () => {
    expect(validateOneProviderAdapterMapping(validMapping())).toEqual({ ok: true, errors: [] });
  });

  it("rejects the invalid trust-promotion example", () => {
    const result = validateOneProviderAdapterConfig(readExample<JsonObject>("one-provider-adapter-config.invalid.trust-promotion.json"));
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(5);
  });

  it("narrows valid configs with the type guard", () => {
    expect(isOneProviderAdapterConfig(validConfig())).toBe(true);
  });

  it("does not narrow invalid configs with the type guard", () => {
    expect(isOneProviderAdapterConfig(setPath(validConfig(), "trust_cap.max_provider_output_trust_tier", "T2"))).toBe(false);
  });

  it("narrows valid opt-in gates with the type guard", () => {
    expect(isOneProviderAdapterOptInGate(validGate())).toBe(true);
  });

  it("returns the input from the opt-in assertion when valid", () => {
    const gate = validGate();
    expect(assertOneProviderAdapterOptInGate(gate)).toBe(gate);
  });

  it("throws from the config assertion when invalid", () => {
    expect(() => assertOneProviderAdapterConfig(setPath(validConfig(), "api_key_ref.api_key_value_present", true))).toThrow("Invalid OneProviderAdapterConfig");
  });

  it("throws from the opt-in assertion when invalid", () => {
    expect(() => assertOneProviderAdapterOptInGate(setPath(validGate(), "fake_success_allowed", true))).toThrow("Invalid OneProviderAdapterOptInGate");
  });

  it("keeps validator source free of network imports", () => {
    const source = readFileSync(new URL("../../src/modelBoundary/oneProviderAdapterTypeExtensionValidator.ts", import.meta.url), "utf8");
    const importLines = source.split(/\r?\n/).filter((line) => line.trim().startsWith("import "));
    expect(importLines.join("\n")).not.toMatch(/node:http|node:https|fetch|XMLHttpRequest/);
  });

  it("keeps validator source free of provider SDK imports", () => {
    const source = readFileSync(new URL("../../src/modelBoundary/oneProviderAdapterTypeExtensionValidator.ts", import.meta.url), "utf8");
    const importLines = source.split(/\r?\n/).filter((line) => line.trim().startsWith("import "));
    expect(importLines.join("\n")).not.toMatch(/openai|anthropic|google|langchain|ai-sdk|@ai-sdk/i);
  });

  it("keeps validator source free of ledger writes", () => {
    const source = readFileSync(new URL("../../src/modelBoundary/oneProviderAdapterTypeExtensionValidator.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/appendFile|writeFile|createLedger|ledger\.append|recordInvocation/);
  });

  it("rejects blocked top-level content fields", () => {
    const blocked = ["raw_prompt_text", "prompt_text", "raw_output_text", "output_text", "api_key", "api_key_value", "secret", "env", "environment", "credential", "auth_token", "private_key"];
    for (const field of blocked) {
      expect(validateOneProviderAdapterConfig({ ...validConfig(), [field]: "blocked" }).ok).toBe(false);
    }
  });

  it.each(configInvalidCases)("%s", (_name, path, value) => {
    expect(validateOneProviderAdapterConfig(setPath(validConfig(), path, value)).ok).toBe(false);
  });

  it.each(mappingInvalidCases)("%s", (_name, path, value) => {
    expect(validateOneProviderAdapterMapping(setPath(validMapping(), path, value)).ok).toBe(false);
  });
});

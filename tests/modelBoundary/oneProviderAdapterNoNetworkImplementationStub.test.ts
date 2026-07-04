import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  assertOneProviderAdapterNoNetworkStubResult,
  createOneProviderAdapterNoNetworkImplementationStub,
  getOneProviderAdapterNoNetworkStubCapabilities,
  getOneProviderAdapterNoNetworkStubHealth,
  invokeOneProviderAdapterNoNetworkStub,
  isOneProviderAdapterNoNetworkStubResult,
  validateOneProviderAdapterNoNetworkStubCapabilities,
  validateOneProviderAdapterNoNetworkStubHealth,
  validateOneProviderAdapterNoNetworkStubInvocation,
  validateOneProviderAdapterNoNetworkStubResult
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

function capabilities(): JsonObject {
  return clone(readExample<JsonObject>("one-provider-adapter-no-network-stub-capabilities.valid.json"));
}

function health(): JsonObject {
  return clone(readExample<JsonObject>("one-provider-adapter-no-network-stub-health.valid.json"));
}

function invocation(): JsonObject {
  return clone(readExample<JsonObject>("one-provider-adapter-no-network-stub-invocation.valid.json"));
}

function result(): JsonObject {
  return clone(readExample<JsonObject>("one-provider-adapter-no-network-stub-result.valid.json"));
}

function setPath(value: JsonObject, path: string, next: unknown): JsonObject {
  const parts = path.split(".");
  let cursor: JsonObject = value;
  for (const part of parts.slice(0, -1)) cursor = cursor[part] as JsonObject;
  cursor[parts[parts.length - 1] ?? path] = next;
  return value;
}

const capabilityCases: Array<[string, string, unknown]> = [
  ["capabilities.consumes_config_contract false fails", "consumes_config_contract", false],
  ["capabilities.supports_no_network_invocation false fails", "supports_no_network_invocation", false],
  ["capabilities.supports_live_network true fails", "supports_live_network", true],
  ["capabilities.supports_provider_sdk true fails", "supports_provider_sdk", true],
  ["capabilities.requires_api_key_value true fails", "requires_api_key_value", true],
  ["capabilities.reads_process_env true fails", "reads_process_env", true],
  ["capabilities.reads_api_key_value true fails", "reads_api_key_value", true],
  ["capabilities.performs_network_call true fails", "performs_network_call", true],
  ["capabilities.writes_ledger true fails", "writes_ledger", true],
  ["capabilities.writes_files true fails", "writes_files", true],
  ["capabilities.returns_provider_output true fails", "returns_provider_output", true],
  ["capabilities.returns_fake_success true fails", "returns_fake_success", true],
  ["capabilities max_output_trust_tier above T1 fails", "max_output_trust_tier", "T2"]
];

const healthCases: Array<[string, string, unknown]> = [
  ["health.live_provider_enabled true fails", "live_provider_enabled", true],
  ["health.network_available true fails", "network_available", true],
  ["health.provider_sdk_available true fails", "provider_sdk_available", true],
  ["health.api_key_value_available true fails", "api_key_value_available", true],
  ["health.process_env_read true fails", "process_env_read", true]
];

const invocationCases: Array<[string, string, unknown]> = [
  ["invocation route_mode other than single_pass fails", "route_mode", "multi_pass"],
  ["invocation api_key_value_available true fails", "api_key_value_available", true],
  ["invocation network_allowed true fails", "network_allowed", true],
  ["invocation provider_sdk_allowed true fails", "provider_sdk_allowed", true]
];

const trustCases: Array<[string, string, unknown]> = [
  ["config_validity_promotes_trust true fails", "trust_summary.config_validity_promotes_trust", true],
  ["config_presence_enables_opt_in true fails", "trust_summary.config_presence_enables_opt_in", true],
  ["stub_execution_promotes_trust true fails", "trust_summary.stub_execution_promotes_trust", true],
  ["stub_refusal_is_model_evidence true fails", "trust_summary.stub_refusal_is_model_evidence", true],
  ["provider_slot_selection_promotes_trust true fails", "trust_summary.provider_slot_selection_promotes_trust", true],
  ["explicit_opt_in_promotes_trust true fails", "trust_summary.explicit_opt_in_promotes_trust", true],
  ["api_key_env_var_name_promotes_trust true fails", "trust_summary.api_key_env_var_name_promotes_trust", true],
  ["api_key_presence_promotes_trust true fails", "trust_summary.api_key_presence_promotes_trust", true],
  ["network_success_promotes_trust true fails", "trust_summary.network_success_promotes_trust", true],
  ["provider_identity_promotes_trust true fails", "trust_summary.provider_identity_promotes_trust", true],
  ["successful_provider_response_promotes_trust true fails", "trust_summary.successful_provider_response_promotes_trust", true],
  ["provider_output_is_deterministic_evidence true fails", "trust_summary.provider_output_is_deterministic_evidence", true],
  ["raw_provider_output_trust_tier other than T0 fails", "trust_summary.raw_provider_output_trust_tier", "T1"],
  ["schema_valid_provider_output_trust_tier other than T1 fails", "trust_summary.schema_valid_provider_output_trust_tier", "T2"],
  ["max_provider_output_trust_tier above T1 fails", "trust_summary.max_provider_output_trust_tier", "T2"],
  ["verified_final_truth_claimed true fails", "trust_summary.verified_final_truth_claimed", true],
  ["requires_hollow_verification_for_t2 false fails", "trust_summary.requires_hollow_verification_for_t2", false]
];

const configSummaryCases: Array<[string, string, unknown]> = [
  ["config summary real_provider_selected true fails unless explicit authorization exists", "config_summary.real_provider_selected", true],
  ["config summary provider_specific_behavior_enabled true fails", "config_summary.provider_specific_behavior_enabled", true],
  ["config summary opt_in_present true fails in default R25 example", "config_summary.opt_in_present", true],
  ["config summary default_runtime_enabled true fails", "config_summary.default_runtime_enabled", true],
  ["config summary api_key_value_read true fails", "config_summary.api_key_value_read", true],
  ["config summary network_call_performed_in_config true fails", "config_summary.network_call_performed_in_config", true],
  ["config summary live_tests_created_in_config true fails", "config_summary.live_tests_created_in_config", true],
  ["config summary ledger_write_allowed_in_config_contract true fails", "config_summary.ledger_write_allowed_in_config_contract", true],
  ["config summary storage_write_allowed_in_config_contract true fails", "config_summary.storage_write_allowed_in_config_contract", true]
];

const resultCases: Array<[string, string, unknown]> = [
  ["result ok true fails", "ok", true],
  ["result provider_call_attempted true fails", "provider_call_attempted", true],
  ["result network_call_attempted true fails", "network_call_attempted", true],
  ["result provider_sdk_used true fails", "provider_sdk_used", true],
  ["result process_env_read true fails", "process_env_read", true],
  ["result api_key_value_read true fails", "api_key_value_read", true],
  ["result ledger_write_attempted true fails", "ledger_write_attempted", true],
  ["result file_write_attempted true fails", "file_write_attempted", true],
  ["result fake_success_returned true fails", "fake_success_returned", true],
  ["result provider_output_returned true fails", "provider_output_returned", true]
];

describe("one provider adapter no-network implementation stub", () => {
  it("valid capabilities example passes", () => expect(validateOneProviderAdapterNoNetworkStubCapabilities(capabilities()).ok).toBe(true));
  it("valid health example passes", () => expect(validateOneProviderAdapterNoNetworkStubHealth(health()).ok).toBe(true));
  it("valid invocation example passes", () => expect(validateOneProviderAdapterNoNetworkStubInvocation(invocation()).ok).toBe(true));
  it("valid result example passes", () => expect(validateOneProviderAdapterNoNetworkStubResult(result()).ok).toBe(true));
  it("invalid fake-success example fails", () => expect(validateOneProviderAdapterNoNetworkStubResult(readExample<JsonObject>("one-provider-adapter-no-network-stub-result.invalid.fake-success.json")).ok).toBe(false));
  it("invalid trust-promotion example fails", () => expect(validateOneProviderAdapterNoNetworkStubResult(readExample<JsonObject>("one-provider-adapter-no-network-stub-result.invalid.trust-promotion.json")).ok).toBe(false));

  it("create stub from valid R24 config", () => {
    expect(createOneProviderAdapterNoNetworkImplementationStub(config()).capabilities().consumes_config_contract).toBe(true);
  });

  it("create stub rejects invalid R24 config", () => {
    expect(() => createOneProviderAdapterNoNetworkImplementationStub({ ...config(), config_id: "" })).toThrow("Invalid R24 config");
  });

  it("capabilities returns valid no-network capabilities", () => {
    expect(validateOneProviderAdapterNoNetworkStubCapabilities(getOneProviderAdapterNoNetworkStubCapabilities(config() as never)).ok).toBe(true);
  });

  it("health returns valid no-network health", () => {
    expect(validateOneProviderAdapterNoNetworkStubHealth(getOneProviderAdapterNoNetworkStubHealth(config() as never)).ok).toBe(true);
  });

  it("invoke returns ok false", () => {
    expect(createOneProviderAdapterNoNetworkImplementationStub(config()).invoke(invocation()).ok).toBe(false);
  });

  it("invoke returns missing_opt_in or future_live_not_enabled", () => {
    expect(["missing_opt_in", "future_live_not_enabled"]).toContain(createOneProviderAdapterNoNetworkImplementationStub(config()).invoke(invocation()).status);
  });

  it("invoke does not return provider output", () => expect(createOneProviderAdapterNoNetworkImplementationStub(config()).invoke(invocation()).provider_output_returned).toBe(false));
  it("invoke does not return fake success", () => expect(createOneProviderAdapterNoNetworkImplementationStub(config()).invoke(invocation()).fake_success_returned).toBe(false));
  it("invoke does not return successful LiveAdapterResponse", () => expect(createOneProviderAdapterNoNetworkImplementationStub(config()).invoke(invocation())).not.toHaveProperty("response_text"));
  it("invoke validates invocation before refusal", () => expect(invokeOneProviderAdapterNoNetworkStub({ ...invocation(), route_mode: "bad" }).status).toBe("validation_failed"));
  it("invoke is deterministic with fixed timestamps/options", () => {
    const options = { created_at: "2026-07-03T00:00:00.000Z", checked_at: "2026-07-03T00:00:00.000Z" };
    expect(invokeOneProviderAdapterNoNetworkStub(invocation(), options)).toEqual(invokeOneProviderAdapterNoNetworkStub(invocation(), options));
  });

  it.each(capabilityCases)("%s", (_name, path, value) => expect(validateOneProviderAdapterNoNetworkStubCapabilities(setPath(capabilities(), path, value)).ok).toBe(false));
  it.each(healthCases)("%s", (_name, path, value) => expect(validateOneProviderAdapterNoNetworkStubHealth(setPath(health(), path, value)).ok).toBe(false));
  it.each(invocationCases)("%s", (_name, path, value) => expect(validateOneProviderAdapterNoNetworkStubInvocation(setPath(invocation(), path, value)).ok).toBe(false));
  it.each(trustCases)("%s", (_name, path, value) => expect(validateOneProviderAdapterNoNetworkStubResult(setPath(result(), path, value)).ok).toBe(false));

  it("any safety summary flag false fails", () => {
    const safety = result().safety_summary as JsonObject;
    for (const field of Object.keys(safety).filter((key) => key !== "notes")) {
      expect(validateOneProviderAdapterNoNetworkStubResult(setPath(result(), `safety_summary.${field}`, false)).ok).toBe(false);
    }
  });

  it.each(configSummaryCases)("%s", (_name, path, value) => expect(validateOneProviderAdapterNoNetworkStubResult(setPath(result(), path, value)).ok).toBe(false));
  it.each(resultCases)("%s", (_name, path, value) => expect(validateOneProviderAdapterNoNetworkStubResult(setPath(result(), path, value)).ok).toBe(false));

  it.each(["raw_prompt_text", "prompt_text", "raw_output_text", "output_text", "api_key", "api_key_value", "secret", "env", "env_value", "environment", "environment_value", "credential", "auth_token", "private_key"])("%s top-level field fails", (field) => {
    expect(validateOneProviderAdapterNoNetworkStubResult({ ...result(), [field]: "blocked" }).ok).toBe(false);
    expect(validateOneProviderAdapterNoNetworkStubInvocation({ ...invocation(), [field]: "blocked" }).ok).toBe(false);
  });

  it("type guards return true only for valid examples", () => {
    expect(isOneProviderAdapterNoNetworkStubResult(result())).toBe(true);
    expect(isOneProviderAdapterNoNetworkStubResult(setPath(result(), "ok", true))).toBe(false);
  });

  it("assert helpers throw on invalid examples", () => {
    expect(assertOneProviderAdapterNoNetworkStubResult(result())).toEqual(result());
    expect(() => assertOneProviderAdapterNoNetworkStubResult(setPath(result(), "fake_success_returned", true))).toThrow("Invalid OneProviderAdapterNoNetworkStubResult");
  });

  it("stub source does not read process env", () => {
    const source = readFileSync(new URL("../../src/modelBoundary/oneProviderAdapterNoNetworkImplementationStub.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/process\.env/);
  });

  it("stub source does not import provider SDKs", () => {
    const source = readFileSync(new URL("../../src/modelBoundary/oneProviderAdapterNoNetworkImplementationStub.ts", import.meta.url), "utf8");
    const importLines = source.split(/\r?\n/).filter((line) => line.trim().startsWith("import "));
    expect(importLines.join("\n")).not.toMatch(/openai|anthropic|gemini|grok|langchain|langgraph|autogen|crewai|@ai-sdk|google/i);
  });

  it("stub source does not call network APIs", () => {
    const source = readFileSync(new URL("../../src/modelBoundary/oneProviderAdapterNoNetworkImplementationStub.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/fetch\(|XMLHttpRequest|node:http|node:https/);
  });

  it("stub source does not write files", () => {
    const source = readFileSync(new URL("../../src/modelBoundary/oneProviderAdapterNoNetworkImplementationStub.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/writeFile|appendFile|createWriteStream/);
  });

  it("stub source does not write Ledger", () => {
    const source = readFileSync(new URL("../../src/modelBoundary/oneProviderAdapterNoNetworkImplementationStub.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/ledger\.append|recordInvocation|createLedgerEntry|writeLedger/i);
  });

  it("package.json unchanged with no provider SDK dependency", () => {
    const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    expect([...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})].join("\n")).not.toMatch(/openai|anthropic|gemini|grok|langchain|langgraph|autogen|crewai|@ai-sdk|google/i);
  });

  it("examples validate", () => {
    expect(validateOneProviderAdapterNoNetworkStubCapabilities(capabilities()).ok).toBe(true);
    expect(validateOneProviderAdapterNoNetworkStubHealth(health()).ok).toBe(true);
    expect(validateOneProviderAdapterNoNetworkStubInvocation(invocation()).ok).toBe(true);
    expect(validateOneProviderAdapterNoNetworkStubResult(result()).ok).toBe(true);
  });
});

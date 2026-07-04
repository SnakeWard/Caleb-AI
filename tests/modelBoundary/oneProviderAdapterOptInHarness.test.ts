import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  assertOneProviderAdapterOptInHarnessEvaluationResult,
  createOneProviderAdapterOptInHarness,
  evaluateOneProviderAdapterOptInHarness,
  getOneProviderAdapterOptInHarnessRuntimeCapabilities,
  getOneProviderAdapterOptInHarnessRuntimeHealth,
  isOneProviderAdapterOptInHarnessEvaluationResult,
  validateOneProviderAdapterOptInHarnessEvaluationInput,
  validateOneProviderAdapterOptInHarnessEvaluationResult
} from "../../src/modelBoundary/index.js";

type JsonObject = Record<string, unknown>;

const expectedGateOrder = ["config", "kill_switch", "env_flag", "command_flag", "provider_allowlist", "adapter_id", "human_approval", "api_key_availability", "redaction_readiness", "safety_profile_readiness", "cost_guard_readiness", "live_test_gate", "r27_live_execution_disabled"];

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
  const finalPart = parts[parts.length - 1];
  if (finalPart === undefined) throw new Error("path must not be empty");
  cursor[finalPart] = next;
  return value;
}

const validInput = () => clone(readExample<JsonObject>("one-provider-adapter-opt-in-harness-input.valid.json"));

describe("one provider adapter opt-in harness", () => {
  it("valid examples pass", () => {
    expect(validateOneProviderAdapterOptInHarnessEvaluationInput(validInput()).ok).toBe(true);
    expect(validateOneProviderAdapterOptInHarnessEvaluationResult(readExample<JsonObject>("one-provider-adapter-opt-in-harness-result.refusal.valid.json")).ok).toBe(true);
    expect(validateOneProviderAdapterOptInHarnessEvaluationResult(readExample<JsonObject>("one-provider-adapter-opt-in-harness-result.ready-disabled.valid.json")).ok).toBe(true);
  });

  it("invalid examples fail", () => {
    expect(validateOneProviderAdapterOptInHarnessEvaluationResult(readExample<JsonObject>("one-provider-adapter-opt-in-harness-result.invalid.live-execution.json")).ok).toBe(false);
    expect(validateOneProviderAdapterOptInHarnessEvaluationResult(readExample<JsonObject>("one-provider-adapter-opt-in-harness-result.invalid.trust-promotion.json")).ok).toBe(false);
    expect(validateOneProviderAdapterOptInHarnessEvaluationResult(readExample<JsonObject>("one-provider-adapter-opt-in-harness-result.invalid.secret-leakage.json")).ok).toBe(false);
  });

  it("harness object is created", () => {
    const harness = createOneProviderAdapterOptInHarness();
    expect(harness.capabilities().evaluates_opt_in_evidence).toBe(true);
    expect(harness.health().runtime_enabled).toBe(true);
    expect(harness.evaluate(validInput()).status).toBe("ready_but_live_execution_disabled");
  });

  it("capabilities are offline-only", () => {
    const capabilities = getOneProviderAdapterOptInHarnessRuntimeCapabilities();
    expect(capabilities).toMatchObject({
      evaluates_opt_in_evidence: true,
      reads_process_env: false,
      reads_api_key_value: false,
      performs_network_call: false,
      imports_provider_sdk: false,
      enables_live_execution: false,
      writes_ledger: false,
      writes_files: false,
      returns_provider_output: false,
      returns_fake_success: false
    });
  });

  it("health is offline-only", () => {
    const health = getOneProviderAdapterOptInHarnessRuntimeHealth();
    expect(health).toMatchObject({
      contract_available: true,
      runtime_enabled: true,
      live_execution_enabled: false,
      process_env_read: false,
      api_key_value_read: false,
      network_available: false,
      provider_sdk_available: false
    });
  });

  it.each([
    ["config.config_valid", false, "config", "config_invalid"],
    ["kill_switch.kill_switch_blocks_live_execution", true, "kill_switch", "kill_switch_blocks_live_execution"],
    ["opt_in_evidence.env_flag_present", false, "env_flag", "missing_opt_in"],
    ["opt_in_evidence.command_flag_present", false, "command_flag", "command_flag_missing"],
    ["opt_in_evidence.provider_allowlisted", false, "provider_allowlist", "provider_not_allowlisted"],
    ["opt_in_evidence.adapter_id_present", false, "adapter_id", "adapter_id_missing"],
    ["opt_in_evidence.adapter_id_allowed", false, "adapter_id", "adapter_id_not_allowed"],
    ["opt_in_evidence.human_approval_recorded", false, "human_approval", "human_approval_missing"],
    ["opt_in_evidence.api_key_available_by_reference", false, "api_key_availability", "api_key_unavailable"],
    ["opt_in_evidence.redaction_ready", false, "redaction_readiness", "redaction_not_ready"],
    ["opt_in_evidence.safety_profile_ready", false, "safety_profile_readiness", "safety_profile_not_ready"],
    ["opt_in_evidence.cost_guard_ready", false, "cost_guard_readiness", "cost_guard_not_ready"],
    ["opt_in_evidence.live_tests_enabled_for_explicit_opt_in", false, "live_test_gate", "live_tests_disabled"]
  ])("returns first refusal for %s", (path, value, gate, status) => {
    const result = evaluateOneProviderAdapterOptInHarness(setPath(validInput(), path, value));
    expect(result.ok).toBe(false);
    expect(result.blocking_gate).toBe(gate);
    expect(result.status).toBe(status);
    expect(result.refusal_kind).toBe(status);
    expect(result.gate_results.at(-1)?.gate).toBe(gate);
  });

  it("ready-disabled occurs only after all supplied gates pass", () => {
    const result = evaluateOneProviderAdapterOptInHarness(validInput());
    expect(result.ok).toBe(true);
    expect(result.ready_disabled).toBe(true);
    expect(result.status).toBe("ready_but_live_execution_disabled");
    expect(result.blocking_gate).toBe("r27_live_execution_disabled");
    expect(result.gate_results).toHaveLength(expectedGateOrder.length);
    expect(result.gate_results.every((gate) => gate.passed)).toBe(true);
  });

  it("ready-disabled does not attempt live execution", () => {
    const result = evaluateOneProviderAdapterOptInHarness(validInput());
    expect(result.live_execution_attempted).toBe(false);
    expect(result.provider_call_attempted).toBe(false);
    expect(result.network_call_attempted).toBe(false);
    expect(result.provider_sdk_used).toBe(false);
    expect(result.process_env_read).toBe(false);
    expect(result.api_key_value_read).toBe(false);
    expect(result.provider_output_returned).toBe(false);
  });

  it("uses deterministic gate order", () => {
    const result = evaluateOneProviderAdapterOptInHarness(validInput());
    expect(result.gate_order).toEqual(expectedGateOrder);
    expect(result.gate_results.map((gate) => gate.gate)).toEqual(expectedGateOrder);
  });

  it("type guards and assertions validate results", () => {
    const result = evaluateOneProviderAdapterOptInHarness(validInput());
    expect(isOneProviderAdapterOptInHarnessEvaluationResult(result)).toBe(true);
    expect(assertOneProviderAdapterOptInHarnessEvaluationResult(result)).toEqual(result);
    expect(isOneProviderAdapterOptInHarnessEvaluationResult({ ...result, live_execution_attempted: true })).toBe(false);
    expect(() => assertOneProviderAdapterOptInHarnessEvaluationResult({ ...result, live_execution_attempted: true })).toThrow("Invalid OneProviderAdapterOptInHarnessEvaluationResult");
  });

  it("matches ready-disabled example output", () => {
    expect(evaluateOneProviderAdapterOptInHarness(validInput())).toEqual(readExample<JsonObject>("one-provider-adapter-opt-in-harness-result.ready-disabled.valid.json"));
  });

  it("matches refusal example output", () => {
    expect(evaluateOneProviderAdapterOptInHarness(setPath(validInput(), "opt_in_evidence.command_flag_present", false))).toEqual(readExample<JsonObject>("one-provider-adapter-opt-in-harness-result.refusal.valid.json"));
  });

  it("source does not read process env", () => {
    const source = readFileSync(new URL("../../src/modelBoundary/oneProviderAdapterOptInHarness.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/process\.env/);
  });

  it("source does not import network APIs or provider SDKs", () => {
    const source = readFileSync(new URL("../../src/modelBoundary/oneProviderAdapterOptInHarness.ts", import.meta.url), "utf8");
    const importLines = source.split(/\r?\n/).filter((line) => line.trim().startsWith("import "));
    expect(importLines.join("\n")).not.toMatch(/node:http|node:https|fetch|XMLHttpRequest/);
    expect(importLines.join("\n")).not.toMatch(/openai|anthropic|gemini|grok|langchain|langgraph|autogen|crewai|@ai-sdk|google/i);
  });

  it("source does not write Ledger or files", () => {
    const source = readFileSync(new URL("../../src/modelBoundary/oneProviderAdapterOptInHarness.ts", import.meta.url), "utf8");
    expect(source).not.toMatch(/ledger\.append|recordInvocation|createLedgerEntry|writeLedger/i);
    expect(source).not.toMatch(/writeFile|appendFile|createWriteStream/);
  });

  it("package.json unchanged with no provider SDK dependency", () => {
    const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8")) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    expect([...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})].join("\n")).not.toMatch(/openai|anthropic|gemini|grok|langchain|langgraph|autogen|crewai|@ai-sdk|google/i);
  });
});

import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  assertLiveAdapterInterfaceCapabilities,
  assertLiveAdapterInvocationContext,
  assertLiveAdapterInvocationResult,
  isLiveAdapterInterfaceCapabilities,
  isLiveAdapterInvocationContext,
  isLiveAdapterInvocationResult,
  validateLiveAdapterInterfaceCapabilities,
  validateLiveAdapterInvocationContext,
  validateLiveAdapterInvocationInput,
  validateLiveAdapterInvocationOutput,
  validateLiveAdapterInvocationResult
} from "../../src/index.js";

async function readJson(path: string): Promise<any> {
  return JSON.parse(await readFile(path, "utf8"));
}

async function capabilities(overrides: Record<string, unknown> = {}) {
  return { ...(await readJson("examples/modelBoundary/live-adapter-interface-capabilities.valid.json")), ...overrides };
}

async function context(overrides: Record<string, unknown> = {}) {
  return { ...(await readJson("examples/modelBoundary/live-adapter-interface-context.valid.json")), ...overrides };
}

async function result(overrides: Record<string, unknown> = {}) {
  return { ...(await readJson("examples/modelBoundary/live-adapter-interface-result.valid.json")), ...overrides };
}

async function invocationInput(overrides: Record<string, unknown> = {}) {
  return {
    schema_version: "0.1.0",
    invocation_id: "invocation_r20_input_example",
    context: await context(),
    live_adapter_request: await readJson("examples/modelBoundary/live-adapter-request.valid.json"),
    redaction_result_ref: "redaction_result_r19_example",
    prompt_digest: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    raw_prompt_included: false,
    api_key_included: false,
    network_allowed: false,
    created_at: "2026-07-03T12:41:00.000Z",
    ...overrides
  };
}

async function invocationOutput(overrides: Record<string, unknown> = {}) {
  return {
    schema_version: "0.1.0",
    invocation_id: "invocation_r20_output_example",
    response_id: "response_r20_output_example",
    adapter_id: "adapter_r20_mock_compatible",
    interface_id: "live_adapter_interface_r20_mock_compatible",
    live_adapter_response: await readJson("examples/modelBoundary/live-adapter-response.valid.json"),
    redaction_result_ref: "redaction_result_r19_example",
    output_digest: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
    raw_output_included: false,
    network_used: false,
    provider_sdk_used: false,
    created_at: "2026-07-03T12:41:01.000Z",
    ...overrides
  };
}

function withHealth(base: any, overrides: Record<string, unknown>) {
  return { ...base, health_status: { ...base.health_status, ...overrides } };
}

function withSafety(base: any, overrides: Record<string, unknown>) {
  return { ...base, safety_requirements: { ...base.safety_requirements, ...overrides } };
}

function withRedaction(base: any, overrides: Record<string, unknown>) {
  return { ...base, redaction_requirements: { ...base.redaction_requirements, ...overrides } };
}

function withTrust(base: any, overrides: Record<string, unknown>) {
  return { ...base, trust_cap_requirements: { ...base.trust_cap_requirements, ...overrides } };
}

function withTestIsolation(base: any, overrides: Record<string, unknown>) {
  return { ...base, test_isolation_requirements: { ...base.test_isolation_requirements, ...overrides } };
}

function withMockCompatibility(base: any, overrides: Record<string, unknown>) {
  return { ...base, mock_compatibility: { ...base.mock_compatibility, ...overrides } };
}

describe("Live Adapter Mock-Compatible Interface", () => {
  it("valid capabilities example passes", async () => expect(validateLiveAdapterInterfaceCapabilities(await capabilities()).ok).toBe(true));
  it("valid context example passes", async () => expect(validateLiveAdapterInvocationContext(await context()).ok).toBe(true));
  it("valid result example passes", async () => expect(validateLiveAdapterInvocationResult(await result()).ok).toBe(true));
  it("invalid trust promotion example fails", async () => expect(validateLiveAdapterInvocationResult(await readJson("examples/modelBoundary/live-adapter-interface-result.invalid.trust-promotion.json")).ok).toBe(false));
  it("non-object capabilities fails", () => expect(validateLiveAdapterInterfaceCapabilities(null).ok).toBe(false));
  it("non-object context fails", () => expect(validateLiveAdapterInvocationContext(null).ok).toBe(false));
  it("non-object result fails", () => expect(validateLiveAdapterInvocationResult(null).ok).toBe(false));
  it("missing capabilities fields fail", () => expect(validateLiveAdapterInterfaceCapabilities({}).ok).toBe(false));
  it("missing context fields fail", () => expect(validateLiveAdapterInvocationContext({}).ok).toBe(false));
  it("missing result fields fail", () => expect(validateLiveAdapterInvocationResult({}).ok).toBe(false));
  it("route_mode other than single_pass fails", async () => expect(validateLiveAdapterInvocationContext(await context({ route_mode: "parallel" })).ok).toBe(false));
  it("supports_live_network true fails", async () => expect(validateLiveAdapterInterfaceCapabilities(await capabilities({ supports_live_network: true })).ok).toBe(false));
  it("requires_api_key true fails", async () => expect(validateLiveAdapterInterfaceCapabilities(await capabilities({ requires_api_key: true })).ok).toBe(false));
  it("imports_provider_sdk true fails", async () => expect(validateLiveAdapterInterfaceCapabilities(await capabilities({ imports_provider_sdk: true })).ok).toBe(false));
  it("performs_network_call true fails", async () => expect(validateLiveAdapterInterfaceCapabilities(await capabilities({ performs_network_call: true })).ok).toBe(false));
  it("stores_raw_prompt true fails", async () => expect(validateLiveAdapterInterfaceCapabilities(await capabilities({ stores_raw_prompt: true })).ok).toBe(false));
  it("stores_raw_output true fails", async () => expect(validateLiveAdapterInterfaceCapabilities(await capabilities({ stores_raw_output: true })).ok).toBe(false));
  it("writes_ledger_directly true fails", async () => expect(validateLiveAdapterInterfaceCapabilities(await capabilities({ writes_ledger_directly: true })).ok).toBe(false));
  it("max output trust above T1 fails", async () => expect(validateLiveAdapterInterfaceCapabilities(await capabilities({ max_output_trust_tier: "T2" })).ok).toBe(false));
  it("invocation input raw_prompt_included true fails", async () => expect(validateLiveAdapterInvocationInput(await invocationInput({ raw_prompt_included: true })).ok).toBe(false));
  it("invocation input api_key_included true fails", async () => expect(validateLiveAdapterInvocationInput(await invocationInput({ api_key_included: true })).ok).toBe(false));
  it("invocation input network_allowed true fails", async () => expect(validateLiveAdapterInvocationInput(await invocationInput({ network_allowed: true })).ok).toBe(false));
  it("invocation output raw_output_included true fails", async () => expect(validateLiveAdapterInvocationOutput(await invocationOutput({ raw_output_included: true })).ok).toBe(false));
  it("invocation output network_used true fails", async () => expect(validateLiveAdapterInvocationOutput(await invocationOutput({ network_used: true })).ok).toBe(false));
  it("invocation output provider_sdk_used true fails", async () => expect(validateLiveAdapterInvocationOutput(await invocationOutput({ provider_sdk_used: true })).ok).toBe(false));
  it("health status live_network_available true fails", async () => expect(validateLiveAdapterInvocationResult(withHealth(await result(), { live_network_available: true })).ok).toBe(false));
  it("health status api_key_available true fails", async () => expect(validateLiveAdapterInvocationResult(withHealth(await result(), { api_key_available: true })).ok).toBe(false));
  it("health status provider_sdk_available true fails", async () => expect(validateLiveAdapterInvocationResult(withHealth(await result(), { provider_sdk_available: true })).ok).toBe(false));
  it("safety requirement flag false fails", async () => expect(validateLiveAdapterInvocationResult(withSafety(await result(), { raw_prompt_forbidden: false })).ok).toBe(false));
  it("redaction requirement flag false fails", async () => expect(validateLiveAdapterInvocationResult(withRedaction(await result(), { redaction_policy_required: false })).ok).toBe(false));
  it("raw provider output trust other than T0 fails", async () => expect(validateLiveAdapterInvocationResult(withTrust(await result(), { raw_provider_output_trust_tier: "T1" })).ok).toBe(false));
  it("schema-valid provider output trust other than T1 fails", async () => expect(validateLiveAdapterInvocationResult(withTrust(await result(), { schema_valid_provider_output_trust_tier: "T0" })).ok).toBe(false));
  it("max allowed output trust above T1 fails", async () => expect(validateLiveAdapterInvocationResult(withTrust(await result(), { max_allowed_output_trust_tier: "T2" })).ok).toBe(false));
  it("interface_validation_promotes_trust true fails", async () => expect(validateLiveAdapterInvocationResult(withTrust(await result(), { interface_validation_promotes_trust: true })).ok).toBe(false));
  it("adapter_availability_promotes_trust true fails", async () => expect(validateLiveAdapterInvocationResult(withTrust(await result(), { adapter_availability_promotes_trust: true })).ok).toBe(false));
  it("mock_compatibility_promotes_trust true fails", async () => expect(validateLiveAdapterInvocationResult(withTrust(await result(), { mock_compatibility_promotes_trust: true })).ok).toBe(false));
  it("provider_identity_promotes_trust true fails", async () => expect(validateLiveAdapterInvocationResult(withTrust(await result(), { provider_identity_promotes_trust: true })).ok).toBe(false));
  it("successful_provider_response_promotes_trust true fails", async () => expect(validateLiveAdapterInvocationResult(withTrust(await result(), { successful_provider_response_promotes_trust: true })).ok).toBe(false));
  it("provider_output_is_deterministic_evidence true fails", async () => expect(validateLiveAdapterInvocationResult(withTrust(await result(), { provider_output_is_deterministic_evidence: true })).ok).toBe(false));
  it("requires_hollow_verification_for_t2 false fails", async () => expect(validateLiveAdapterInvocationResult(withTrust(await result(), { requires_hollow_verification_for_t2: false })).ok).toBe(false));
  it("test isolation flag false fails", async () => expect(validateLiveAdapterInvocationResult(withTestIsolation(await result(), { unit_tests_no_network: false })).ok).toBe(false));
  it("mock compatibility flag false fails", async () => expect(validateLiveAdapterInvocationResult(withMockCompatibility(await result(), { no_provider_sdk_required: false })).ok).toBe(false));
  it("raw_prompt_text top-level field fails", async () => expect(validateLiveAdapterInvocationResult(await result({ raw_prompt_text: "raw" })).ok).toBe(false));
  it("prompt_text top-level field fails", async () => expect(validateLiveAdapterInvocationResult(await result({ prompt_text: "raw" })).ok).toBe(false));
  it("raw_output_text top-level field fails", async () => expect(validateLiveAdapterInvocationResult(await result({ raw_output_text: "raw" })).ok).toBe(false));
  it("output_text top-level field fails", async () => expect(validateLiveAdapterInvocationResult(await result({ output_text: "raw" })).ok).toBe(false));
  it("api_key top-level field fails", async () => expect(validateLiveAdapterInvocationResult(await result({ api_key: "secret" })).ok).toBe(false));
  it("secret top-level field fails", async () => expect(validateLiveAdapterInvocationResult(await result({ secret: "secret" })).ok).toBe(false));
  it("env/environment top-level field fails", async () => {
    expect(validateLiveAdapterInvocationResult(await result({ env: "prod" })).ok).toBe(false);
    expect(validateLiveAdapterInvocationResult(await result({ environment: "prod" })).ok).toBe(false);
  });
  it("credential/auth_token/private_key top-level fields fail", async () => {
    expect(validateLiveAdapterInvocationResult(await result({ credential: "credential" })).ok).toBe(false);
    expect(validateLiveAdapterInvocationResult(await result({ auth_token: "token" })).ok).toBe(false);
    expect(validateLiveAdapterInvocationResult(await result({ private_key: "key" })).ok).toBe(false);
  });
  it("type guards return true only for valid examples", async () => {
    expect(isLiveAdapterInterfaceCapabilities(await capabilities())).toBe(true);
    expect(isLiveAdapterInvocationContext(await context())).toBe(true);
    expect(isLiveAdapterInvocationResult(await result())).toBe(true);
    expect(isLiveAdapterInvocationResult(await result({ api_key: "secret" }))).toBe(false);
  });
  it("assert helpers throw on invalid examples", async () => {
    expect(() => assertLiveAdapterInterfaceCapabilities({})).toThrow();
    expect(() => assertLiveAdapterInvocationContext({})).toThrow();
    expect(() => assertLiveAdapterInvocationResult({})).toThrow();
  });
  it("validator source does not import provider SDKs", async () => {
    const source = await readFile("src/modelBoundary/liveAdapterInterfaceValidator.ts", "utf8");
    const importLines = source.split(/\r?\n/).filter((line) => /^\s*import\b/.test(line)).join("\n");
    expect(importLines).not.toMatch(/openai|anthropic|gemini|grok|langchain|langgraph|autogen|crewai/i);
  });
  it("validator source does not call network APIs", async () => {
    const source = await readFile("src/modelBoundary/liveAdapterInterfaceValidator.ts", "utf8");
    expect(source).not.toMatch(/from\s+["'](?:node:http|http|node:https|https)["']|\bfetch\s*\(/);
  });
  it("validator source does not write files", async () => {
    const source = await readFile("src/modelBoundary/liveAdapterInterfaceValidator.ts", "utf8");
    expect(source).not.toMatch(/node:fs|writeFile|appendFile|mkdir|rm\(/);
  });
  it("validator source does not write Ledger", async () => {
    const source = await readFile("src/modelBoundary/liveAdapterInterfaceValidator.ts", "utf8");
    expect(source).not.toMatch(/writeLedger|appendLedger|ledgerWriter|createLedgerEntry|JsonlLedger/);
  });
});

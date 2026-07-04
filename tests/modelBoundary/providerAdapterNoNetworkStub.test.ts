import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  createProviderAdapterNoNetworkStub,
  getProviderAdapterNoNetworkStubCapabilities,
  getProviderAdapterNoNetworkStubHealth,
  invokeProviderAdapterNoNetworkStub,
  validateProviderAdapterNoNetworkStubCapabilities,
  validateProviderAdapterNoNetworkStubConfig,
  validateProviderAdapterNoNetworkStubHealth,
  validateProviderAdapterNoNetworkStubInvocationInput,
  validateProviderAdapterNoNetworkStubResult
} from "../../src/index.js";

async function readJson(path: string): Promise<any> {
  return JSON.parse(await readFile(path, "utf8"));
}

async function capabilities(overrides: Record<string, unknown> = {}) {
  return { ...(await readJson("examples/modelBoundary/provider-adapter-no-network-capabilities.valid.json")), ...overrides };
}

async function health(overrides: Record<string, unknown> = {}) {
  return { ...(await readJson("examples/modelBoundary/provider-adapter-no-network-health.valid.json")), ...overrides };
}

async function result(overrides: Record<string, unknown> = {}) {
  return { ...(await readJson("examples/modelBoundary/provider-adapter-no-network-result.valid.json")), ...overrides };
}

async function config(overrides: Record<string, unknown> = {}) {
  return {
    schema_version: "0.1.0",
    stub_id: "provider_adapter_no_network_stub_r21",
    adapter_id: "adapter_r21_no_network_stub",
    adapter_version: "0.1.0",
    mode: "future_live_not_enabled",
    provider_id: "provider_neutral_no_network_stub",
    provider_kind: "custom_compatible",
    network_enabled: false,
    provider_sdk_enabled: false,
    api_key_required: false,
    live_provider_enabled: false,
    allow_mock_compatible_interface: true,
    created_at: "2026-07-03T13:09:30.000Z",
    notes: [],
    ...overrides
  };
}

async function invocationInput(overrides: Record<string, unknown> = {}) {
  return {
    schema_version: "0.1.0",
    invocation_id: "invocation_r21_example",
    stub_id: "provider_adapter_no_network_stub_r21",
    adapter_id: "adapter_r21_no_network_stub",
    live_adapter_request_ref: "live_adapter_request_ref_r21",
    live_adapter_request: await readJson("examples/modelBoundary/live-adapter-request.valid.json"),
    redaction_result_ref: "redaction_result_r19_example",
    safety_profile_id: "live_adapter_safety_profile_r19",
    redaction_policy_id: "redaction_policy_r19_default",
    prompt_digest: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    output_expected: true,
    raw_prompt_included: false,
    api_key_included: false,
    network_allowed: false,
    provider_sdk_allowed: false,
    created_at: "2026-07-03T13:09:31.000Z",
    notes: [],
    ...overrides
  };
}

function withTrust(base: any, overrides: Record<string, unknown>) {
  return { ...base, trust_summary: { ...base.trust_summary, ...overrides } };
}

function withSafety(base: any, overrides: Record<string, unknown>) {
  return { ...base, safety_summary: { ...base.safety_summary, ...overrides } };
}

describe("Provider Adapter Stub With No Network", () => {
  it("valid capabilities example passes", async () => expect(validateProviderAdapterNoNetworkStubCapabilities(await capabilities()).ok).toBe(true));
  it("valid health example passes", async () => expect(validateProviderAdapterNoNetworkStubHealth(await health()).ok).toBe(true));
  it("valid result example passes", async () => expect(validateProviderAdapterNoNetworkStubResult(await result()).ok).toBe(true));
  it("invalid trust promotion example fails", async () => expect(validateProviderAdapterNoNetworkStubResult(await readJson("examples/modelBoundary/provider-adapter-no-network-result.invalid.trust-promotion.json")).ok).toBe(false));
  it("creates stub object", () => {
    const stub = createProviderAdapterNoNetworkStub();
    expect(typeof stub.capabilities).toBe("function");
    expect(typeof stub.health).toBe("function");
    expect(typeof stub.invoke).toBe("function");
  });
  it("capabilities returns valid no-network capabilities", () => expect(validateProviderAdapterNoNetworkStubCapabilities(getProviderAdapterNoNetworkStubCapabilities()).ok).toBe(true));
  it("health returns valid no-network health", () => expect(validateProviderAdapterNoNetworkStubHealth(getProviderAdapterNoNetworkStubHealth()).ok).toBe(true));
  it("invoke returns ok false", async () => expect(invokeProviderAdapterNoNetworkStub(await invocationInput()).ok).toBe(false));
  it("invoke returns future_live_not_enabled or unavailable", async () => expect(["future_live_not_enabled", "unavailable", "validation_failed"]).toContain(invokeProviderAdapterNoNetworkStub(await invocationInput()).status));
  it("invoke does not return provider output", async () => expect(invokeProviderAdapterNoNetworkStub(await invocationInput())).not.toHaveProperty("live_adapter_response"));
  it("invoke does not return fake model text", async () => {
    const stubResult = invokeProviderAdapterNoNetworkStub(await invocationInput()) as unknown as Record<string, unknown>;
    expect(stubResult).not.toHaveProperty("output_text");
    expect(stubResult).not.toHaveProperty("raw_output_text");
    expect(stubResult).not.toHaveProperty("model_text");
  });
  it("invoke rejects invalid input", () => expect(invokeProviderAdapterNoNetworkStub({}).status).toBe("validation_failed"));
  it("network_enabled true fails config validation", async () => expect(validateProviderAdapterNoNetworkStubConfig(await config({ network_enabled: true })).ok).toBe(false));
  it("provider_sdk_enabled true fails config validation", async () => expect(validateProviderAdapterNoNetworkStubConfig(await config({ provider_sdk_enabled: true })).ok).toBe(false));
  it("api_key_required true fails config validation", async () => expect(validateProviderAdapterNoNetworkStubConfig(await config({ api_key_required: true })).ok).toBe(false));
  it("live_provider_enabled true fails config validation", async () => expect(validateProviderAdapterNoNetworkStubConfig(await config({ live_provider_enabled: true })).ok).toBe(false));
  it("supports_live_network true fails", async () => expect(validateProviderAdapterNoNetworkStubCapabilities(await capabilities({ supports_live_network: true })).ok).toBe(false));
  it("requires_api_key true fails", async () => expect(validateProviderAdapterNoNetworkStubCapabilities(await capabilities({ requires_api_key: true })).ok).toBe(false));
  it("imports_provider_sdk true fails", async () => expect(validateProviderAdapterNoNetworkStubCapabilities(await capabilities({ imports_provider_sdk: true })).ok).toBe(false));
  it("performs_network_call true fails", async () => expect(validateProviderAdapterNoNetworkStubCapabilities(await capabilities({ performs_network_call: true })).ok).toBe(false));
  it("stores_raw_prompt true fails", async () => expect(validateProviderAdapterNoNetworkStubCapabilities(await capabilities({ stores_raw_prompt: true })).ok).toBe(false));
  it("stores_raw_output true fails", async () => expect(validateProviderAdapterNoNetworkStubCapabilities(await capabilities({ stores_raw_output: true })).ok).toBe(false));
  it("writes_ledger_directly true fails", async () => expect(validateProviderAdapterNoNetworkStubCapabilities(await capabilities({ writes_ledger_directly: true })).ok).toBe(false));
  it("max output trust above T1 fails", async () => expect(validateProviderAdapterNoNetworkStubCapabilities(await capabilities({ max_output_trust_tier: "T2" })).ok).toBe(false));
  it("health live_network_available true fails", async () => expect(validateProviderAdapterNoNetworkStubHealth(await health({ live_network_available: true })).ok).toBe(false));
  it("health provider_sdk_available true fails", async () => expect(validateProviderAdapterNoNetworkStubHealth(await health({ provider_sdk_available: true })).ok).toBe(false));
  it("health api_key_available true fails", async () => expect(validateProviderAdapterNoNetworkStubHealth(await health({ api_key_available: true })).ok).toBe(false));
  it("invocation input raw_prompt_included true fails", async () => expect(validateProviderAdapterNoNetworkStubInvocationInput(await invocationInput({ raw_prompt_included: true })).ok).toBe(false));
  it("invocation input api_key_included true fails", async () => expect(validateProviderAdapterNoNetworkStubInvocationInput(await invocationInput({ api_key_included: true })).ok).toBe(false));
  it("invocation input network_allowed true fails", async () => expect(validateProviderAdapterNoNetworkStubInvocationInput(await invocationInput({ network_allowed: true })).ok).toBe(false));
  it("invocation input provider_sdk_allowed true fails", async () => expect(validateProviderAdapterNoNetworkStubInvocationInput(await invocationInput({ provider_sdk_allowed: true })).ok).toBe(false));
  it("stub_execution_promotes_trust true fails", async () => expect(validateProviderAdapterNoNetworkStubResult(withTrust(await result(), { stub_execution_promotes_trust: true })).ok).toBe(false));
  it("stub_availability_promotes_trust true fails", async () => expect(validateProviderAdapterNoNetworkStubResult(withTrust(await result(), { stub_availability_promotes_trust: true })).ok).toBe(false));
  it("provider_identity_promotes_trust true fails", async () => expect(validateProviderAdapterNoNetworkStubResult(withTrust(await result(), { provider_identity_promotes_trust: true })).ok).toBe(false));
  it("successful_provider_response_promotes_trust true fails", async () => expect(validateProviderAdapterNoNetworkStubResult(withTrust(await result(), { successful_provider_response_promotes_trust: true })).ok).toBe(false));
  it("provider_output_is_deterministic_evidence true fails", async () => expect(validateProviderAdapterNoNetworkStubResult(withTrust(await result(), { provider_output_is_deterministic_evidence: true })).ok).toBe(false));
  it("raw provider output trust other than T0 fails", async () => expect(validateProviderAdapterNoNetworkStubResult(withTrust(await result(), { raw_provider_output_trust_tier: "T1" })).ok).toBe(false));
  it("schema-valid provider output trust other than T1 fails", async () => expect(validateProviderAdapterNoNetworkStubResult(withTrust(await result(), { schema_valid_provider_output_trust_tier: "T0" })).ok).toBe(false));
  it("max allowed output trust above T1 fails", async () => expect(validateProviderAdapterNoNetworkStubResult(withTrust(await result(), { max_allowed_output_trust_tier: "T2" })).ok).toBe(false));
  it("ledger_presence_promotes_trust true fails", async () => expect(validateProviderAdapterNoNetworkStubResult(withTrust(await result(), { ledger_presence_promotes_trust: true })).ok).toBe(false));
  it("storage_promotes_trust true fails", async () => expect(validateProviderAdapterNoNetworkStubResult(withTrust(await result(), { storage_promotes_trust: true })).ok).toBe(false));
  it("retrieval_promotes_trust true fails", async () => expect(validateProviderAdapterNoNetworkStubResult(withTrust(await result(), { retrieval_promotes_trust: true })).ok).toBe(false));
  it("verified_final_truth_claimed true fails", async () => expect(validateProviderAdapterNoNetworkStubResult(withTrust(await result(), { verified_final_truth_claimed: true })).ok).toBe(false));
  it("requires_hollow_verification_for_t2 false fails", async () => expect(validateProviderAdapterNoNetworkStubResult(withTrust(await result(), { requires_hollow_verification_for_t2: false })).ok).toBe(false));
  it("safety summary flag false fails", async () => expect(validateProviderAdapterNoNetworkStubResult(withSafety(await result(), { no_network_enforced: false })).ok).toBe(false));
  it("ok true fails for R21 result", async () => expect(validateProviderAdapterNoNetworkStubResult(await result({ ok: true })).ok).toBe(false));
  it("successful provider response field fails", async () => expect(validateProviderAdapterNoNetworkStubResult(await result({ successful_provider_response: {} })).ok).toBe(false));
  it("raw_prompt_text top-level field fails", async () => expect(validateProviderAdapterNoNetworkStubResult(await result({ raw_prompt_text: "raw" })).ok).toBe(false));
  it("prompt_text top-level field fails", async () => expect(validateProviderAdapterNoNetworkStubResult(await result({ prompt_text: "raw" })).ok).toBe(false));
  it("raw_output_text top-level field fails", async () => expect(validateProviderAdapterNoNetworkStubResult(await result({ raw_output_text: "raw" })).ok).toBe(false));
  it("output_text top-level field fails", async () => expect(validateProviderAdapterNoNetworkStubResult(await result({ output_text: "raw" })).ok).toBe(false));
  it("api_key top-level field fails", async () => expect(validateProviderAdapterNoNetworkStubResult(await result({ api_key: "secret" })).ok).toBe(false));
  it("secret top-level field fails", async () => expect(validateProviderAdapterNoNetworkStubResult(await result({ secret: "secret" })).ok).toBe(false));
  it("env/environment top-level field fails", async () => {
    expect(validateProviderAdapterNoNetworkStubResult(await result({ env: "prod" })).ok).toBe(false);
    expect(validateProviderAdapterNoNetworkStubResult(await result({ environment: "prod" })).ok).toBe(false);
  });
  it("credential/auth_token/private_key top-level fields fail", async () => {
    expect(validateProviderAdapterNoNetworkStubResult(await result({ credential: "credential" })).ok).toBe(false);
    expect(validateProviderAdapterNoNetworkStubResult(await result({ auth_token: "token" })).ok).toBe(false);
    expect(validateProviderAdapterNoNetworkStubResult(await result({ private_key: "key" })).ok).toBe(false);
  });
  it("stub source does not import provider SDKs", async () => {
    const source = await readFile("src/modelBoundary/providerAdapterNoNetworkStub.ts", "utf8");
    const importLines = source.split(/\r?\n/).filter((line) => /^\s*import\b/.test(line)).join("\n");
    expect(importLines).not.toMatch(/openai|anthropic|gemini|grok|langchain|langgraph|autogen|crewai/i);
  });
  it("stub source does not call network APIs", async () => {
    const source = await readFile("src/modelBoundary/providerAdapterNoNetworkStub.ts", "utf8");
    expect(source).not.toMatch(/from\s+["'](?:node:http|http|node:https|https)["']|\bfetch\s*\(/);
  });
  it("stub source does not write files", async () => {
    const source = await readFile("src/modelBoundary/providerAdapterNoNetworkStub.ts", "utf8");
    expect(source).not.toMatch(/node:fs|writeFile|appendFile|mkdir|rm\(/);
  });
  it("stub source does not write Ledger", async () => {
    const source = await readFile("src/modelBoundary/providerAdapterNoNetworkStub.ts", "utf8");
    expect(source).not.toMatch(/writeLedger|appendLedger|ledgerWriter|createLedgerEntry|JsonlLedger/);
  });
  it("examples validate", async () => {
    expect(validateProviderAdapterNoNetworkStubCapabilities(await capabilities()).ok).toBe(true);
    expect(validateProviderAdapterNoNetworkStubHealth(await health()).ok).toBe(true);
    expect(validateProviderAdapterNoNetworkStubResult(await result()).ok).toBe(true);
  });
});

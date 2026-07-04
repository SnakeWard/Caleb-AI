import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  assertLiveAdapterFailure,
  assertLiveAdapterRequest,
  assertLiveAdapterResponse,
  isLiveAdapterFailure,
  isLiveAdapterRequest,
  isLiveAdapterResponse,
  validateLiveAdapterFailure,
  validateLiveAdapterRequest,
  validateLiveAdapterResponse
} from "../../src/index.js";

async function readJson(path: string): Promise<any> {
  return JSON.parse(await readFile(path, "utf8"));
}

async function request(overrides: Record<string, unknown> = {}) {
  return { ...(await readJson("examples/modelBoundary/live-adapter-request.valid.json")), ...overrides };
}

async function response(overrides: Record<string, unknown> = {}) {
  return { ...(await readJson("examples/modelBoundary/live-adapter-response.valid.json")), ...overrides };
}

async function failure(overrides: Record<string, unknown> = {}) {
  return { ...(await readJson("examples/modelBoundary/live-adapter-failure.valid.json")), ...overrides };
}

function withTrust(base: any, overrides: Record<string, unknown>) {
  return { ...base, trust_summary: { ...base.trust_summary, ...overrides } };
}

describe("Live Adapter Type Contracts", () => {
  it("valid request example passes", async () => expect(validateLiveAdapterRequest(await request()).ok).toBe(true));
  it("valid response example passes", async () => expect(validateLiveAdapterResponse(await response()).ok).toBe(true));
  it("valid failure example passes", async () => expect(validateLiveAdapterFailure(await failure()).ok).toBe(true));
  it("invalid trust promotion example fails", async () => expect(validateLiveAdapterResponse(await readJson("examples/modelBoundary/live-adapter-response.invalid.trust-promotion.json")).ok).toBe(false));
  it("non-object request fails", () => expect(validateLiveAdapterRequest(null).ok).toBe(false));
  it("non-object response fails", () => expect(validateLiveAdapterResponse(null).ok).toBe(false));
  it("missing request fields fail", () => expect(validateLiveAdapterRequest({}).ok).toBe(false));
  it("missing response fields fail", () => expect(validateLiveAdapterResponse({}).ok).toBe(false));
  it("route_mode other than single_pass fails", async () => expect(validateLiveAdapterRequest(await request({ route_mode: "hollow_only" })).ok).toBe(false));
  it("invalid provider_kind fails", async () => expect(validateLiveAdapterRequest(await request({ provider_kind: "provider_specific" })).ok).toBe(false));
  it("invalid failure_kind fails", async () => expect(validateLiveAdapterFailure(await failure({ failure_kind: "bad_failure" })).ok).toBe(false));
  it("timeout_ms <= 0 fails", async () => { const item = await request(); expect(validateLiveAdapterRequest({ ...item, limits: { ...item.limits, timeout_ms: 0 } }).ok).toBe(false); });
  it("max_output_tokens <= 0 fails", async () => { const item = await request(); expect(validateLiveAdapterRequest({ ...item, limits: { ...item.limits, max_output_tokens: 0 } }).ok).toBe(false); });
  it("retry_count < 0 fails", async () => { const item = await request(); expect(validateLiveAdapterRequest({ ...item, limits: { ...item.limits, retry_count: -1 } }).ok).toBe(false); });
  it("ledger_raw_prompt_allowed true fails", async () => { const item = await request(); expect(validateLiveAdapterRequest({ ...item, safety_profile: { ...item.safety_profile, ledger_raw_prompt_allowed: true } }).ok).toBe(false); });
  it("ledger_raw_output_allowed true fails", async () => { const item = await request(); expect(validateLiveAdapterRequest({ ...item, safety_profile: { ...item.safety_profile, ledger_raw_output_allowed: true } }).ok).toBe(false); });
  it("raw_prompt_included true fails", async () => { const item = await request(); expect(validateLiveAdapterRequest({ ...item, prompt_ref: { ...item.prompt_ref, raw_prompt_included: true } }).ok).toBe(false); });
  it("raw_output_included true fails", async () => { const item = await response(); expect(validateLiveAdapterResponse({ ...item, output_ref: { ...item.output_ref, raw_output_included: true } }).ok).toBe(false); });
  it("raw provider output trust other than T0 fails", async () => expect(validateLiveAdapterResponse(withTrust(await response(), { raw_provider_output_trust_tier: "T1" })).ok).toBe(false));
  it("schema-valid provider output trust above T1 fails", async () => expect(validateLiveAdapterResponse(withTrust(await response(), { schema_valid_provider_output_trust_tier: "T2" })).ok).toBe(false));
  it("failure schema-valid provider output trust above T0 fails", async () => expect(validateLiveAdapterFailure(withTrust(await failure(), { schema_valid_provider_output_trust_tier: "T1" })).ok).toBe(false));
  it("max allowed trust above T1 fails", async () => expect(validateLiveAdapterResponse(withTrust(await response(), { max_allowed_trust_tier: "T2" })).ok).toBe(false));
  it("provider_identity_promotes_trust true fails", async () => expect(validateLiveAdapterResponse(withTrust(await response(), { provider_identity_promotes_trust: true })).ok).toBe(false));
  it("successful_response_promotes_trust true fails", async () => expect(validateLiveAdapterResponse(withTrust(await response(), { successful_response_promotes_trust: true })).ok).toBe(false));
  it("provider_output_is_deterministic_evidence true fails", async () => expect(validateLiveAdapterResponse(withTrust(await response(), { provider_output_is_deterministic_evidence: true })).ok).toBe(false));
  it("storage_promotes_trust true fails", async () => expect(validateLiveAdapterResponse(withTrust(await response(), { storage_promotes_trust: true })).ok).toBe(false));
  it("retrieval_promotes_trust true fails", async () => expect(validateLiveAdapterResponse(withTrust(await response(), { retrieval_promotes_trust: true })).ok).toBe(false));
  it("ledger_presence_promotes_trust true fails", async () => expect(validateLiveAdapterResponse(withTrust(await response(), { ledger_presence_promotes_trust: true })).ok).toBe(false));
  it("verified_final_truth_claimed true fails", async () => expect(validateLiveAdapterResponse(withTrust(await response(), { verified_final_truth_claimed: true })).ok).toBe(false));
  it("requires_hollow_verification_for_t2 false fails", async () => expect(validateLiveAdapterResponse(withTrust(await response(), { requires_hollow_verification_for_t2: false })).ok).toBe(false));
  it("raw_prompt_text top-level field fails", async () => expect(validateLiveAdapterRequest(await request({ raw_prompt_text: "raw" })).ok).toBe(false));
  it("prompt_text top-level field fails", async () => expect(validateLiveAdapterRequest(await request({ prompt_text: "raw" })).ok).toBe(false));
  it("raw_output_text top-level field fails", async () => expect(validateLiveAdapterResponse(await response({ raw_output_text: "raw" })).ok).toBe(false));
  it("output_text top-level field fails", async () => expect(validateLiveAdapterResponse(await response({ output_text: "raw" })).ok).toBe(false));
  it("api_key top-level field fails", async () => expect(validateLiveAdapterRequest(await request({ api_key: "secret" })).ok).toBe(false));
  it("secret top-level field fails", async () => expect(validateLiveAdapterRequest(await request({ secret: "secret" })).ok).toBe(false));
  it("env/environment top-level field fails", async () => {
    expect(validateLiveAdapterRequest(await request({ env: "prod" })).ok).toBe(false);
    expect(validateLiveAdapterRequest(await request({ environment: "prod" })).ok).toBe(false);
  });
  it("type guards return true only for valid examples", async () => {
    expect(isLiveAdapterRequest(await request())).toBe(true);
    expect(isLiveAdapterResponse(await response())).toBe(true);
    expect(isLiveAdapterFailure(await failure())).toBe(true);
    expect(isLiveAdapterRequest(await request({ api_key: "secret" }))).toBe(false);
  });
  it("assert helpers throw on invalid examples", async () => {
    expect(() => assertLiveAdapterRequest({})).toThrow();
    expect(() => assertLiveAdapterResponse({})).toThrow();
    expect(() => assertLiveAdapterFailure({})).toThrow();
  });
  it("validator source does not import provider SDKs", async () => {
    const source = await readFile("src/modelBoundary/liveAdapterContractValidator.ts", "utf8");
    const importLines = source.split(/\r?\n/).filter((line) => /^\s*import\b/.test(line)).join("\n");
    expect(importLines).not.toMatch(/openai|anthropic|gemini|grok|langchain|langgraph|autogen|crewai/i);
  });
  it("validator source does not call network APIs", async () => {
    const source = await readFile("src/modelBoundary/liveAdapterContractValidator.ts", "utf8");
    expect(source).not.toMatch(/from\s+["'](?:node:http|http|node:https|https)["']|\bfetch\s*\(/);
  });
  it("validator source does not write files", async () => {
    const source = await readFile("src/modelBoundary/liveAdapterContractValidator.ts", "utf8");
    expect(source).not.toMatch(/node:fs|writeFile|appendFile|mkdir|rm\(/);
  });
  it("validator source does not write Ledger", async () => {
    const source = await readFile("src/modelBoundary/liveAdapterContractValidator.ts", "utf8");
    expect(source).not.toMatch(/writeLedger|appendLedger|ledgerWriter|createLedgerEntry|JsonlLedger/);
  });
});

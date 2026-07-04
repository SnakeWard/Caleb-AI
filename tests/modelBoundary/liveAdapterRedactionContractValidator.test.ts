import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  assertLiveAdapterRedactionManifest,
  assertLiveAdapterRedactionPolicy,
  assertLiveAdapterRedactionResult,
  isLiveAdapterRedactionManifest,
  isLiveAdapterRedactionPolicy,
  isLiveAdapterRedactionResult,
  validateLiveAdapterRedactionManifest,
  validateLiveAdapterRedactionPolicy,
  validateLiveAdapterRedactionResult
} from "../../src/index.js";

async function readJson(path: string): Promise<any> {
  return JSON.parse(await readFile(path, "utf8"));
}

async function policy(overrides: Record<string, unknown> = {}) {
  return { ...(await readJson("examples/modelBoundary/live-adapter-redaction-policy.valid.json")), ...overrides };
}

async function manifest(overrides: Record<string, unknown> = {}) {
  return { ...(await readJson("examples/modelBoundary/live-adapter-redaction-manifest.valid.json")), ...overrides };
}

async function result(overrides: Record<string, unknown> = {}) {
  return { ...(await readJson("examples/modelBoundary/live-adapter-redaction-result.valid.json")), ...overrides };
}

function withAllowedContent(base: any, overrides: Record<string, unknown>) {
  return { ...base, allowed_content: { ...base.allowed_content, ...overrides } };
}

function withBlockedContent(base: any, overrides: Record<string, unknown>) {
  return { ...base, blocked_content: { ...base.blocked_content, ...overrides } };
}

function withDigestRef(base: any, overrides: Record<string, unknown>) {
  return { ...base, digest_refs: [{ ...base.digest_refs[0], ...overrides }] };
}

function withAudit(base: any, overrides: Record<string, unknown>) {
  return { ...base, audit_summary: { ...base.audit_summary, ...overrides } };
}

function withCompatibility(base: any, overrides: Record<string, unknown>) {
  return { ...base, safety_profile_compatibility: { ...base.safety_profile_compatibility, ...overrides } };
}

function withTrust(base: any, overrides: Record<string, unknown>) {
  return { ...base, trust_summary: { ...base.trust_summary, ...overrides } };
}

describe("Live Adapter Redaction Contract", () => {
  it("valid policy example passes", async () => expect(validateLiveAdapterRedactionPolicy(await policy()).ok).toBe(true));
  it("valid manifest example passes", async () => expect(validateLiveAdapterRedactionManifest(await manifest()).ok).toBe(true));
  it("valid result example passes", async () => expect(validateLiveAdapterRedactionResult(await result()).ok).toBe(true));
  it("invalid leakage example fails", async () => expect(validateLiveAdapterRedactionResult(await readJson("examples/modelBoundary/live-adapter-redaction-result.invalid.leakage.json")).ok).toBe(false));
  it("non-object policy fails", () => expect(validateLiveAdapterRedactionPolicy(null).ok).toBe(false));
  it("non-object manifest fails", () => expect(validateLiveAdapterRedactionManifest(null).ok).toBe(false));
  it("non-object result fails", () => expect(validateLiveAdapterRedactionResult(null).ok).toBe(false));
  it("missing policy fields fail", () => expect(validateLiveAdapterRedactionPolicy({}).ok).toBe(false));
  it("missing manifest fields fail", () => expect(validateLiveAdapterRedactionManifest({}).ok).toBe(false));
  it("missing result fields fail", () => expect(validateLiveAdapterRedactionResult({}).ok).toBe(false));
  it("invalid scope fails", async () => expect(validateLiveAdapterRedactionPolicy(await policy({ scope: "live_provider" })).ok).toBe(false));
  it("invalid sensitive category fails", async () => expect(validateLiveAdapterRedactionPolicy(await policy({ sensitive_categories: ["not_sensitive"] })).ok).toBe(false));
  it("invalid redaction action fails", async () => expect(validateLiveAdapterRedactionPolicy(await policy({ default_action: "decrypt" })).ok).toBe(false));
  it("raw_prompt_allowed true fails", async () => expect(validateLiveAdapterRedactionPolicy(await policy({ raw_prompt_allowed: true })).ok).toBe(false));
  it("raw_output_allowed true fails", async () => expect(validateLiveAdapterRedactionPolicy(await policy({ raw_output_allowed: true })).ok).toBe(false));
  it("ledger_raw_prompt_allowed true fails", async () => expect(validateLiveAdapterRedactionPolicy(await policy({ ledger_raw_prompt_allowed: true })).ok).toBe(false));
  it("ledger_raw_output_allowed true fails", async () => expect(validateLiveAdapterRedactionPolicy(await policy({ ledger_raw_output_allowed: true })).ok).toBe(false));
  it("runtime_storage_raw_prompt_allowed true fails", async () => expect(validateLiveAdapterRedactionPolicy(await policy({ runtime_storage_raw_prompt_allowed: true })).ok).toBe(false));
  it("runtime_storage_raw_output_allowed true fails", async () => expect(validateLiveAdapterRedactionPolicy(await policy({ runtime_storage_raw_output_allowed: true })).ok).toBe(false));
  it("allowed_content.raw_text_allowed true fails", async () => expect(validateLiveAdapterRedactionPolicy(withAllowedContent(await policy(), { raw_text_allowed: true })).ok).toBe(false));
  it("blocked content flag false fails", async () => expect(validateLiveAdapterRedactionPolicy(withBlockedContent(await policy(), { api_keys_blocked: false })).ok).toBe(false));
  it("raw_content_retained true fails", async () => expect(validateLiveAdapterRedactionResult(withDigestRef(await result(), { raw_content_retained: true })).ok).toBe(false));
  it("manifest raw_prompt_removed false fails", async () => expect(validateLiveAdapterRedactionManifest(await manifest({ raw_prompt_removed: false })).ok).toBe(false));
  it("manifest api_keys_removed false fails", async () => expect(validateLiveAdapterRedactionManifest(await manifest({ api_keys_removed: false })).ok).toBe(false));
  it("manifest secrets_removed false fails", async () => expect(validateLiveAdapterRedactionManifest(await manifest({ secrets_removed: false })).ok).toBe(false));
  it("manifest env_values_removed false fails", async () => expect(validateLiveAdapterRedactionManifest(await manifest({ env_values_removed: false })).ok).toBe(false));
  it("audit redaction_applied false fails for redacted result", async () => expect(validateLiveAdapterRedactionResult(withAudit(await result(), { redaction_applied: false })).ok).toBe(false));
  it("remaining_sensitive_content_allowed true fails", async () => expect(validateLiveAdapterRedactionResult(withAudit(await result(), { remaining_sensitive_content_allowed: true })).ok).toBe(false));
  it("raw transcript storage allowed true fails", async () => expect(validateLiveAdapterRedactionResult(withCompatibility(await result(), { raw_transcript_storage_allowed: true })).ok).toBe(false));
  it("redaction_promotes_trust true fails", async () => expect(validateLiveAdapterRedactionResult(withTrust(await result(), { redaction_promotes_trust: true })).ok).toBe(false));
  it("redaction_metadata_promotes_trust true fails", async () => expect(validateLiveAdapterRedactionResult(withTrust(await result(), { redaction_metadata_promotes_trust: true })).ok).toBe(false));
  it("provider_identity_promotes_trust true fails", async () => expect(validateLiveAdapterRedactionResult(withTrust(await result(), { provider_identity_promotes_trust: true })).ok).toBe(false));
  it("successful_provider_response_promotes_trust true fails", async () => expect(validateLiveAdapterRedactionResult(withTrust(await result(), { successful_provider_response_promotes_trust: true })).ok).toBe(false));
  it("ledger_presence_promotes_trust true fails", async () => expect(validateLiveAdapterRedactionResult(withTrust(await result(), { ledger_presence_promotes_trust: true })).ok).toBe(false));
  it("storage_promotes_trust true fails", async () => expect(validateLiveAdapterRedactionResult(withTrust(await result(), { storage_promotes_trust: true })).ok).toBe(false));
  it("retrieval_promotes_trust true fails", async () => expect(validateLiveAdapterRedactionResult(withTrust(await result(), { retrieval_promotes_trust: true })).ok).toBe(false));
  it("redacted_output_is_verified_truth true fails", async () => expect(validateLiveAdapterRedactionResult(withTrust(await result(), { redacted_output_is_verified_truth: true })).ok).toBe(false));
  it("redacted_output_is_deterministic_evidence true fails", async () => expect(validateLiveAdapterRedactionResult(withTrust(await result(), { redacted_output_is_deterministic_evidence: true })).ok).toBe(false));
  it("live_provider_output_max_trust_tier above T1 fails", async () => expect(validateLiveAdapterRedactionResult(withTrust(await result(), { live_provider_output_max_trust_tier: "T2" })).ok).toBe(false));
  it("requires_hollow_verification_for_t2 false fails", async () => expect(validateLiveAdapterRedactionResult(withTrust(await result(), { requires_hollow_verification_for_t2: false })).ok).toBe(false));
  it("raw_prompt_text top-level field fails", async () => expect(validateLiveAdapterRedactionResult(await result({ raw_prompt_text: "raw" })).ok).toBe(false));
  it("prompt_text top-level field fails", async () => expect(validateLiveAdapterRedactionResult(await result({ prompt_text: "raw" })).ok).toBe(false));
  it("raw_output_text top-level field fails", async () => expect(validateLiveAdapterRedactionResult(await result({ raw_output_text: "raw" })).ok).toBe(false));
  it("output_text top-level field fails", async () => expect(validateLiveAdapterRedactionResult(await result({ output_text: "raw" })).ok).toBe(false));
  it("api_key top-level field fails", async () => expect(validateLiveAdapterRedactionResult(await result({ api_key: "secret" })).ok).toBe(false));
  it("secret top-level field fails", async () => expect(validateLiveAdapterRedactionResult(await result({ secret: "secret" })).ok).toBe(false));
  it("env/environment top-level field fails", async () => {
    expect(validateLiveAdapterRedactionResult(await result({ env: "prod" })).ok).toBe(false);
    expect(validateLiveAdapterRedactionResult(await result({ environment: "prod" })).ok).toBe(false);
  });
  it("credential/auth_token/private_key top-level fields fail", async () => {
    expect(validateLiveAdapterRedactionResult(await result({ credential: "credential" })).ok).toBe(false);
    expect(validateLiveAdapterRedactionResult(await result({ auth_token: "token" })).ok).toBe(false);
    expect(validateLiveAdapterRedactionResult(await result({ private_key: "key" })).ok).toBe(false);
  });
  it("type guards return true only for valid examples", async () => {
    expect(isLiveAdapterRedactionPolicy(await policy())).toBe(true);
    expect(isLiveAdapterRedactionManifest(await manifest())).toBe(true);
    expect(isLiveAdapterRedactionResult(await result())).toBe(true);
    expect(isLiveAdapterRedactionResult(await result({ api_key: "secret" }))).toBe(false);
  });
  it("assert helpers throw on invalid examples", async () => {
    expect(() => assertLiveAdapterRedactionPolicy({})).toThrow();
    expect(() => assertLiveAdapterRedactionManifest({})).toThrow();
    expect(() => assertLiveAdapterRedactionResult({})).toThrow();
  });
  it("validator source does not import provider SDKs", async () => {
    const source = await readFile("src/modelBoundary/liveAdapterRedactionContractValidator.ts", "utf8");
    const importLines = source.split(/\r?\n/).filter((line) => /^\s*import\b/.test(line)).join("\n");
    expect(importLines).not.toMatch(/openai|anthropic|gemini|grok|langchain|langgraph|autogen|crewai/i);
  });
  it("validator source does not call network APIs", async () => {
    const source = await readFile("src/modelBoundary/liveAdapterRedactionContractValidator.ts", "utf8");
    expect(source).not.toMatch(/from\s+["'](?:node:http|http|node:https|https)["']|\bfetch\s*\(/);
  });
  it("validator source does not write files", async () => {
    const source = await readFile("src/modelBoundary/liveAdapterRedactionContractValidator.ts", "utf8");
    expect(source).not.toMatch(/node:fs|writeFile|appendFile|mkdir|rm\(/);
  });
  it("validator source does not write Ledger", async () => {
    const source = await readFile("src/modelBoundary/liveAdapterRedactionContractValidator.ts", "utf8");
    expect(source).not.toMatch(/writeLedger|appendLedger|ledgerWriter|createLedgerEntry|JsonlLedger/);
  });
});

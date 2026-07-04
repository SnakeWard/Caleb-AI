import { access, readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";
import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";

const docPath = "docs/LIVE_ADAPTER_TYPE_CONTRACTS.md";
const exactVerdict = `Live Adapter Type Contracts: Accepted
Status: Provider-neutral live adapter contracts complete; no live adapter implemented
Next phase: Live adapter redaction contract`;

describe("Live Adapter Type Contracts acceptance lock", () => {
  it("required files exist", async () => {
    for (const path of [
      docPath,
      "src/modelBoundary/types/liveAdapterTypes.ts",
      "src/modelBoundary/liveAdapterContractValidator.ts",
      "examples/modelBoundary/live-adapter-request.valid.json",
      "examples/modelBoundary/live-adapter-response.valid.json",
      "examples/modelBoundary/live-adapter-failure.valid.json",
      "examples/modelBoundary/live-adapter-response.invalid.trust-promotion.json"
    ]) await expect(access(path)).resolves.toBeUndefined();
  });
  it("doc contains exact verdict block", async () => expect(await readFile(docPath, "utf8")).toContain(exactVerdict));
  it("doc locks non-implementation statements", async () => {
    const doc = await readFile(docPath, "utf8");
    for (const statement of [
      "No live adapter is implemented.",
      "No provider stub is implemented.",
      "No real Model API Layer is implemented.",
      "No provider SDK is imported.",
      "No API key or secret is required.",
      "No network call is performed.",
      "No provider dependency is added."
    ]) expect(doc).toContain(statement);
  });
  it("doc locks trust and content rules", async () => {
    const doc = await readFile(docPath, "utf8");
    for (const statement of [
      "Live provider output starts at T0.",
      "Schema-valid live provider output may reach T1 only.",
      "Live provider output does not become T2 deterministic Hollow evidence.",
      "Provider identity does not promote trust.",
      "Successful provider response does not promote trust.",
      "Raw prompt text must not be present in R18 live adapter contracts.",
      "Raw model output text must not be present in R18 live adapter contracts.",
      "API keys must not be present."
    ]) expect(doc).toContain(statement);
  });
  it("doc lists all failure taxonomy entries", async () => {
    const doc = await readFile(docPath, "utf8");
    for (const failure of ["adapter_unavailable", "missing_api_key", "invalid_request", "provider_timeout", "provider_rate_limited", "provider_auth_failed", "provider_rejected_request", "provider_malformed_response", "response_validation_failed", "safety_profile_blocked", "network_failure", "unknown_provider_error"]) expect(doc).toContain(failure);
  });
  it("source does not import network APIs or provider SDKs", async () => {
    const source = `${await readFile("src/modelBoundary/liveAdapterContractValidator.ts", "utf8")}\n${await readFile("src/modelBoundary/types/liveAdapterTypes.ts", "utf8")}`;
    const importLines = source.split(/\r?\n/).filter((line) => /^\s*import\b/.test(line)).join("\n");
    expect(source).not.toMatch(/from\s+["'](?:node:http|http|node:https|https)["']|\bfetch\s*\(/);
    expect(importLines).not.toMatch(/openai|anthropic|gemini|grok/i);
    expect(importLines).not.toMatch(/langchain|langgraph|autogen|crewai/i);
  });
  it("package.json was not modified to add provider SDK dependencies", async () => {
    const pkg = await readFile("package.json", "utf8");
    expect(pkg).not.toMatch(/openai|anthropic|gemini|grok|langchain|langgraph|autogen|crewai/i);
  });
  it("keeps V1 Hollow catalog count locked at 12", () => expect(V1_HOLLOW_MANIFESTS).toHaveLength(12));
  it("keeps Hollowcut catalog count locked at 9", () => expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9));
});

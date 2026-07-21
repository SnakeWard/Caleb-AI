import { readdir, readFile, access } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";
import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";

const docPath = "docs/ONE_PROVIDER_ADAPTER_EXPLICIT_OPT_IN_PLANNING.md";
const exactVerdict = `One Provider Adapter Behind Explicit Opt-In Planning: Accepted
Status: First-provider opt-in boundary locked; no live provider implementation
Next phase: One provider adapter type extension`;

async function readProviderSourceFiles(dir: string): Promise<readonly string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await readProviderSourceFiles(path));
    else if (entry.isFile() && path.endsWith(".ts") && /provider/i.test(path)) files.push(path);
  }
  return files;
}

describe("One Provider Adapter Behind Explicit Opt-In Planning acceptance lock", () => {
  it("planning document exists", async () => await expect(access(docPath)).resolves.toBeUndefined());
  it("contains exact verdict block", async () => expect(await readFile(docPath, "utf8")).toContain(exactVerdict));
  it("locks non-implementation statements", async () => {
    const doc = await readFile(docPath, "utf8");
    for (const statement of [
      "This pass does not implement a live adapter.",
      "This pass does not implement provider-specific behavior.",
      "This pass does not implement a real Model API Layer.",
      "This pass does not add provider SDKs.",
      "This pass does not require API keys.",
      "This pass does not perform network calls.",
      "This pass does not create live provider tests."
    ]) expect(doc).toContain(statement);
  });
  it("locks trust statements", async () => {
    const doc = await readFile(docPath, "utf8");
    for (const statement of [
      "Explicit opt-in enables controlled execution only; it does not promote trust.",
      "API key presence does not promote trust.",
      "Network success does not promote trust.",
      "Provider identity does not promote trust.",
      "Successful provider response does not promote trust.",
      "Live provider output starts at T0.",
      "Schema-valid live provider output may reach T1 only.",
      "Provider output is not deterministic Hollow evidence.",
      "T2 requires verified deterministic Hollow evidence through VRP."
    ]) expect(doc).toContain(statement);
  });
  it("locks offline test and fake-success statements", async () => {
    const doc = await readFile(docPath, "utf8");
    for (const statement of [
      "Default unit tests must perform no network calls.",
      "Live provider tests must be opt-in only.",
      "Live provider tests must be skipped by default.",
      "Missing opt-in must not silently fall back to fake success.",
      "raw prompt excluded from Ledger by default",
      "raw output excluded from Ledger by default",
      "API key values must never be written to Ledger."
    ]) expect(doc).toContain(statement);
  });
  it("lists failure and refusal kinds", async () => {
    const doc = await readFile(docPath, "utf8");
    for (const failure of [
      "live_provider_not_enabled",
      "provider_not_allowlisted",
      "missing_api_key",
      "invalid_api_key_configuration",
      "redaction_required",
      "safety_profile_required",
      "network_disabled",
      "provider_timeout",
      "provider_rate_limited",
      "provider_auth_failed",
      "provider_rejected_request",
      "provider_malformed_response",
      "response_validation_failed",
      "cost_limit_exceeded",
      "unknown_provider_error"
    ]) expect(doc).toContain(failure);
  });
  it("lists stop conditions", async () => {
    const doc = await readFile(docPath, "utf8");
    for (const stop of [
      "provider SDK import appears unexpectedly",
      "network call appears outside approved adapter file",
      "API key value appears in logs, ledger, fixtures, or storage",
      "raw prompt text appears in ledger record",
      "raw output text appears in ledger record",
      "provider output is promoted above T1",
      "default tests require network",
      "default tests require API keys",
      "provider call occurs without opt-in",
      "fake live-provider success is returned when provider is disabled"
    ]) expect(doc).toContain(stop);
  });
  it("modelBoundary provider files do not import network APIs or provider SDKs", async () => {
    const sourceFiles = await readProviderSourceFiles("src/modelBoundary");
    for (const file of sourceFiles) {
      const source = await readFile(file, "utf8");
      const importLines = source.split(/\r?\n/).filter((line) => /^\s*import\b/.test(line)).join("\n");
      expect(source, file).not.toMatch(/from\s+["'](?:node:http|http|node:https|https)["']|\bfetch\s*\(/);
      expect(importLines, file).not.toMatch(/openai|@anthropic-ai\/sdk|@google\/generative-ai|@google\/genai|gemini|grok/i);
      expect(importLines, file).not.toMatch(/langchain|langgraph|autogen|crewai/i);
    }
  });
  it("package.json was not modified to add provider SDK dependencies", async () => {
    const pkg = await readFile("package.json", "utf8");
    expect(pkg).not.toMatch(/openai|anthropic|gemini|grok|langchain|langgraph|autogen|crewai/i);
  });
  it("keeps V1 Hollow catalog count locked at 14", () => expect(V1_HOLLOW_MANIFESTS).toHaveLength(14));
  it("keeps Hollowcut catalog count locked at 9", () => expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9));
});

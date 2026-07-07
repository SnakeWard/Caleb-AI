import { access, readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";
import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";

const docPath = "docs/LIVE_ADAPTER_REDACTION_CONTRACT.md";
const exactVerdict = `Live Adapter Redaction Contract: Accepted
Status: Redaction policy and metadata contracts complete; no live adapter implemented
Next phase: Live adapter mock-compatible interface`;

describe("Live Adapter Redaction Contract acceptance lock", () => {
  it("required files exist", async () => {
    for (const path of [
      docPath,
      "src/modelBoundary/types/liveAdapterRedactionTypes.ts",
      "src/modelBoundary/liveAdapterRedactionContractValidator.ts",
      "examples/modelBoundary/live-adapter-redaction-policy.valid.json",
      "examples/modelBoundary/live-adapter-redaction-manifest.valid.json",
      "examples/modelBoundary/live-adapter-redaction-result.valid.json",
      "examples/modelBoundary/live-adapter-redaction-result.invalid.leakage.json"
    ]) await expect(access(path)).resolves.toBeUndefined();
  });
  it("doc contains exact verdict block", async () => expect(await readFile(docPath, "utf8")).toContain(exactVerdict));
  it("doc locks non-implementation statements", async () => {
    const doc = await readFile(docPath, "utf8");
    for (const statement of [
      "No live adapter is implemented.",
      "No provider stub is implemented.",
      "No full redaction engine is implemented.",
      "No real Model API Layer is implemented.",
      "No provider SDK is imported.",
      "No API key or secret is required.",
      "No network call is performed.",
      "No provider dependency is added."
    ]) expect(doc).toContain(statement);
  });
  it("doc locks content safety statements", async () => {
    const doc = await readFile(docPath, "utf8");
    for (const statement of [
      "Raw prompt text must not be present.",
      "Raw model output text must not be present.",
      "API keys must not be present.",
      "Secrets must not be present.",
      "Environment values must not be present."
    ]) expect(doc).toContain(statement);
  });
  it("doc locks trust statements", async () => {
    const doc = await readFile(docPath, "utf8");
    for (const statement of [
      "Redaction reduces exposure risk; it does not verify truth.",
      "Redaction does not promote trust.",
      "Redaction metadata does not promote trust.",
      "Redacted output is not deterministic Hollow evidence.",
      "Live provider output remains capped at T1."
    ]) expect(doc).toContain(statement);
  });
  it("source does not import network APIs or provider SDKs", async () => {
    const source = `${await readFile("src/modelBoundary/liveAdapterRedactionContractValidator.ts", "utf8")}\n${await readFile("src/modelBoundary/types/liveAdapterRedactionTypes.ts", "utf8")}`;
    const importLines = source.split(/\r?\n/).filter((line) => /^\s*import\b/.test(line)).join("\n");
    expect(source).not.toMatch(/from\s+["'](?:node:http|http|node:https|https)["']|\bfetch\s*\(/);
    expect(importLines).not.toMatch(/openai|anthropic|gemini|grok/i);
    expect(importLines).not.toMatch(/langchain|langgraph|autogen|crewai/i);
  });
  it("package.json was not modified to add provider SDK dependencies", async () => {
    const pkg = await readFile("package.json", "utf8");
    expect(pkg).not.toMatch(/openai|anthropic|gemini|grok|langchain|langgraph|autogen|crewai/i);
  });
  it("keeps V1 Hollow catalog count locked at 13", () => expect(V1_HOLLOW_MANIFESTS).toHaveLength(13));
  it("keeps Hollowcut catalog count locked at 9", () => expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9));
});

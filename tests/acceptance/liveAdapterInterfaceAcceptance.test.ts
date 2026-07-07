import { access, readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";
import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";

const docPath = "docs/LIVE_ADAPTER_MOCK_COMPATIBLE_INTERFACE.md";
const exactVerdict = `Live Adapter Mock-Compatible Interface: Accepted
Status: Mock-compatible adapter interface seam complete; no live adapter implemented
Next phase: Provider adapter stub with no network`;

describe("Live Adapter Mock-Compatible Interface acceptance lock", () => {
  it("required files exist", async () => {
    for (const path of [
      docPath,
      "src/modelBoundary/types/liveAdapterInterfaceTypes.ts",
      "src/modelBoundary/liveAdapterInterfaceValidator.ts",
      "examples/modelBoundary/live-adapter-interface-capabilities.valid.json",
      "examples/modelBoundary/live-adapter-interface-context.valid.json",
      "examples/modelBoundary/live-adapter-interface-result.valid.json",
      "examples/modelBoundary/live-adapter-interface-result.invalid.trust-promotion.json"
    ]) await expect(access(path)).resolves.toBeUndefined();
  });
  it("doc contains exact verdict block", async () => expect(await readFile(docPath, "utf8")).toContain(exactVerdict));
  it("doc locks non-implementation statements", async () => {
    const doc = await readFile(docPath, "utf8");
    for (const statement of [
      "No live adapter is implemented.",
      "No provider stub is implemented.",
      "No provider-specific behavior is implemented.",
      "No real Model API Layer is implemented.",
      "No provider SDK is imported.",
      "No API key or secret is required.",
      "No network call is performed.",
      "No provider dependency is added."
    ]) expect(doc).toContain(statement);
  });
  it("doc locks capability statements", async () => {
    const doc = await readFile(docPath, "utf8");
    for (const statement of [
      "supports_live_network false for R20.",
      "supports_mock_invocation true.",
      "requires_api_key false.",
      "imports_provider_sdk false.",
      "performs_network_call false."
    ]) expect(doc).toContain(statement);
  });
  it("doc locks trust statements", async () => {
    const doc = await readFile(docPath, "utf8");
    for (const statement of [
      "Interface validation does not promote trust.",
      "Adapter availability does not promote trust.",
      "Mock compatibility does not promote trust.",
      "Provider output is not deterministic Hollow evidence.",
      "T2 requires verified deterministic Hollow evidence through VRP."
    ]) expect(doc).toContain(statement);
  });
  it("source does not import network APIs or provider SDKs", async () => {
    const source = `${await readFile("src/modelBoundary/liveAdapterInterfaceValidator.ts", "utf8")}\n${await readFile("src/modelBoundary/types/liveAdapterInterfaceTypes.ts", "utf8")}`;
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

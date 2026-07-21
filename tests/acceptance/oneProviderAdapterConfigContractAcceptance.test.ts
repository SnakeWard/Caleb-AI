import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { handleCliCommand, parseCliArgs } from "../../src/cli/index.js";

const root = new URL("../../", import.meta.url);

function file(path: string): string {
  return fileURLToPath(new URL(path, root));
}

function read(path: string): string {
  return readFileSync(new URL(path, root), "utf8");
}

describe("one provider adapter config contract acceptance", () => {
  it("creates the required R24 artifacts", () => {
    const required = [
      "docs/ONE_PROVIDER_ADAPTER_CONFIG_CONTRACT.md",
      "src/modelBoundary/types/oneProviderAdapterConfigContractTypes.ts",
      "src/modelBoundary/oneProviderAdapterConfigContractValidator.ts",
      "examples/modelBoundary/one-provider-adapter-config-contract.valid.json",
      "examples/modelBoundary/one-provider-adapter-config-refusal.valid.json",
      "examples/modelBoundary/one-provider-adapter-config-contract.invalid.secret-leakage.json",
      "examples/modelBoundary/one-provider-adapter-config-contract.invalid.trust-promotion.json"
    ];

    for (const path of required) expect(existsSync(file(path)), path).toBe(true);
  });

  it("documents the exact acceptance verdict", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_CONFIG_CONTRACT.md");
    expect(doc).toContain("One Provider Adapter Config Contract: Accepted");
    expect(doc).toContain("Status: First-provider config contract complete; no provider implementation");
    expect(doc).toContain("Next phase: One provider adapter no-network implementation stub");
  });

  it("documents non-implementation boundaries", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_CONFIG_CONTRACT.md");
    const phrases = [
      "No live adapter is implemented.",
      "No provider-specific behavior is implemented.",
      "No real Model API Layer is implemented.",
      "No provider SDK is imported.",
      "No API key or secret is required.",
      "No API key value is read.",
      "process.env is not read.",
      "No network call is performed.",
      "No live provider test is added.",
      "No provider dependency is added.",
      "No runtime behavior is changed.",
      "No real provider is selected unless explicitly authorized by the user."
    ];
    for (const phrase of phrases) expect(doc).toContain(phrase);
  });

  it("documents trust guardrails", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_CONFIG_CONTRACT.md");
    const phrases = [
      "Config validity does not promote trust.",
      "Config presence does not enable opt-in.",
      "API key env var name does not promote trust.",
      "API key presence does not promote trust.",
      "Network success does not promote trust.",
      "Raw provider output starts at T0.",
      "Schema-valid provider output may reach T1 only.",
      "T2 requires verified deterministic Hollow evidence through VRP."
    ];
    for (const phrase of phrases) expect(doc).toContain(phrase);
  });

  it("source does not read process env", () => {
    const source = read("src/modelBoundary/oneProviderAdapterConfigContractValidator.ts");
    expect(source).not.toMatch(/process\.env/);
  });

  it("source does not import network APIs or provider frameworks", () => {
    const source = [
      read("src/modelBoundary/types/oneProviderAdapterConfigContractTypes.ts"),
      read("src/modelBoundary/oneProviderAdapterConfigContractValidator.ts")
    ].join("\n");
    const importLines = source.split(/\r?\n/).filter((line) => line.trim().startsWith("import "));
    expect(importLines.join("\n")).not.toMatch(/node:http|node:https|fetch|XMLHttpRequest/);
    expect(importLines.join("\n")).not.toMatch(/openai|anthropic|gemini|grok|langchain|langgraph|autogen|crewai|@ai-sdk|google/i);
  });

  it("package.json does not add provider SDK dependencies", () => {
    const pkg = JSON.parse(read("package.json")) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    const dependencyNames = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})].join("\n");
    expect(dependencyNames).not.toMatch(/openai|anthropic|gemini|grok|langchain|langgraph|autogen|crewai|@ai-sdk|google-generative-ai|vertexai/i);
  });

  it("keeps production catalog counts unchanged", async () => {
    const v1 = await handleCliCommand(parseCliArgs(["list-hollows", "--json"]));
    const hollowcut = await handleCliCommand(parseCliArgs(["list-hollowcut-hollows", "--json"]));
    const v1Data = v1.data as { hollows: unknown[] };
    const hollowcutData = hollowcut.data as { hollows: unknown[] };

    expect(v1.ok).toBe(true);
    expect(v1Data.hollows).toHaveLength(14);
    expect(hollowcut.ok).toBe(true);
    expect(hollowcutData.hollows).toHaveLength(9);
  });
});

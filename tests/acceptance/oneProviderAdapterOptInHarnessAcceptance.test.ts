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

describe("one provider adapter opt-in harness acceptance", () => {
  it("creates required R27 artifacts", () => {
    const required = [
      "docs/ONE_PROVIDER_ADAPTER_OPT_IN_HARNESS_IMPLEMENTATION.md",
      "src/modelBoundary/types/oneProviderAdapterOptInHarnessImplementationTypes.ts",
      "src/modelBoundary/oneProviderAdapterOptInHarness.ts",
      "tests/modelBoundary/oneProviderAdapterOptInHarness.test.ts",
      "examples/modelBoundary/one-provider-adapter-opt-in-harness-input.valid.json",
      "examples/modelBoundary/one-provider-adapter-opt-in-harness-result.refusal.valid.json",
      "examples/modelBoundary/one-provider-adapter-opt-in-harness-result.ready-disabled.valid.json",
      "examples/modelBoundary/one-provider-adapter-opt-in-harness-result.invalid.live-execution.json",
      "examples/modelBoundary/one-provider-adapter-opt-in-harness-result.invalid.trust-promotion.json",
      "examples/modelBoundary/one-provider-adapter-opt-in-harness-result.invalid.secret-leakage.json"
    ];

    for (const path of required) expect(existsSync(file(path)), path).toBe(true);
  });

  it("documents the exact verdict block", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_OPT_IN_HARNESS_IMPLEMENTATION.md");
    expect(doc).toContain("One Provider Adapter Opt-In Harness Implementation: Accepted");
    expect(doc).toContain("Status: Offline opt-in harness evaluator complete; live execution still disabled");
    expect(doc).toContain("Next phase: One provider adapter live test plan");
  });

  it("documents non-implementation boundaries", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_OPT_IN_HARNESS_IMPLEMENTATION.md");
    const phrases = [
      "This pass does not implement live execution.",
      "This pass does not implement a live adapter.",
      "This pass does not implement provider-specific behavior.",
      "This pass does not implement a real Model API Layer.",
      "This pass does not import a provider SDK.",
      "This pass does not read API key values.",
      "This pass does not read process.env.",
      "This pass does not perform a network call.",
      "This pass does not add a live provider test.",
      "This pass does not return fake live-provider success.",
      "This pass does not return provider output."
    ];

    for (const phrase of phrases) expect(doc).toContain(phrase);
  });

  it("documents ready-disabled and trust guardrails", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_OPT_IN_HARNESS_IMPLEMENTATION.md");
    const phrases = [
      "Ready-disabled does not mean live execution occurred.",
      "Ready-disabled does not promote trust.",
      "Ready-disabled does not return provider output.",
      "Harness evaluation does not promote trust.",
      "Harness decision does not promote trust.",
      "Opt-in evidence does not promote trust.",
      "Human approval evidence does not promote trust.",
      "Provider output is not deterministic Hollow evidence.",
      "Raw provider output starts at T0.",
      "Schema-valid provider output may reach T1 only.",
      "T2 requires VRP-verified deterministic Hollow evidence."
    ];

    for (const phrase of phrases) expect(doc).toContain(phrase);
  });

  it("source does not read env, import network/provider frameworks, or write side effects", () => {
    const source = [
      read("src/modelBoundary/types/oneProviderAdapterOptInHarnessImplementationTypes.ts"),
      read("src/modelBoundary/oneProviderAdapterOptInHarness.ts")
    ].join("\n");
    const importLines = source.split(/\r?\n/).filter((line) => line.trim().startsWith("import "));

    expect(source).not.toMatch(/process\.env/);
    expect(importLines.join("\n")).not.toMatch(/node:http|node:https|fetch|XMLHttpRequest/);
    expect(importLines.join("\n")).not.toMatch(/openai|anthropic|gemini|grok|langchain|langgraph|autogen|crewai|@ai-sdk|google/i);
    expect(source).not.toMatch(/ledger\.append|recordInvocation|createLedgerEntry|writeLedger/i);
    expect(source).not.toMatch(/writeFile|appendFile|createWriteStream/);
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
    expect(v1Data.hollows).toHaveLength(12);
    expect(hollowcut.ok).toBe(true);
    expect(hollowcutData.hollows).toHaveLength(9);
  });
});

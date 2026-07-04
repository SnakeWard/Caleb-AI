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

describe("one provider adapter opt-in harness contract acceptance", () => {
  it("creates required R26 artifacts", () => {
    const required = [
      "docs/ONE_PROVIDER_ADAPTER_OPT_IN_HARNESS_CONTRACT.md",
      "src/modelBoundary/types/oneProviderAdapterOptInHarnessContractTypes.ts",
      "src/modelBoundary/oneProviderAdapterOptInHarnessContractValidator.ts",
      "tests/modelBoundary/oneProviderAdapterOptInHarnessContractValidator.test.ts",
      "examples/modelBoundary/one-provider-adapter-opt-in-evidence.valid.json",
      "examples/modelBoundary/one-provider-adapter-human-approval.valid.json",
      "examples/modelBoundary/one-provider-adapter-kill-switch.valid.json",
      "examples/modelBoundary/one-provider-adapter-harness-decision.valid.json",
      "examples/modelBoundary/one-provider-adapter-harness-refusal.valid.json",
      "examples/modelBoundary/one-provider-adapter-harness-decision.invalid.trust-promotion.json",
      "examples/modelBoundary/one-provider-adapter-harness-decision.invalid.secret-leakage.json"
    ];

    for (const path of required) expect(existsSync(file(path)), path).toBe(true);
  });

  it("documents the exact verdict block", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_OPT_IN_HARNESS_CONTRACT.md");
    expect(doc).toContain("One Provider Adapter Opt-In Harness Contract: Accepted");
    expect(doc).toContain("Status: Opt-in harness contract complete; live execution still disabled");
    expect(doc).toContain("Next phase: One provider adapter opt-in harness implementation");
  });

  it("documents non-implementation boundaries", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_OPT_IN_HARNESS_CONTRACT.md");
    const phrases = [
      "No opt-in harness runtime is implemented.",
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
      "No live provider execution is enabled.",
      "No fake live-provider success is returned.",
      "No successful provider response is produced."
    ];

    for (const phrase of phrases) expect(doc).toContain(phrase);
  });

  it("documents trust guardrails", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_OPT_IN_HARNESS_CONTRACT.md");
    const phrases = [
      "Opt-in evidence does not promote trust.",
      "Command flag presence does not promote trust.",
      "Env flag name does not promote trust.",
      "Human approval does not promote trust.",
      "Kill switch state does not promote trust.",
      "Provider allowlist does not promote trust.",
      "Network permission does not promote trust.",
      "Harness decision does not promote trust.",
      "Live execution is not allowed in R26.",
      "API key presence does not promote trust.",
      "Provider output is not deterministic Hollow evidence.",
      "Raw provider output starts at T0.",
      "Schema-valid provider output may reach T1 only.",
      "T2 requires verified deterministic Hollow evidence through VRP."
    ];

    for (const phrase of phrases) expect(doc).toContain(phrase);
  });

  it("source does not read env, import network/provider frameworks, or write side effects", () => {
    const source = [
      read("src/modelBoundary/types/oneProviderAdapterOptInHarnessContractTypes.ts"),
      read("src/modelBoundary/oneProviderAdapterOptInHarnessContractValidator.ts")
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

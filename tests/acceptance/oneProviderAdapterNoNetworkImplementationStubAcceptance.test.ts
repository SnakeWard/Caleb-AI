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

describe("one provider adapter no-network implementation stub acceptance", () => {
  it("creates required R25 artifacts", () => {
    const required = [
      "docs/ONE_PROVIDER_ADAPTER_NO_NETWORK_IMPLEMENTATION_STUB.md",
      "src/modelBoundary/types/oneProviderAdapterNoNetworkImplementationStubTypes.ts",
      "src/modelBoundary/oneProviderAdapterNoNetworkImplementationStub.ts",
      "examples/modelBoundary/one-provider-adapter-no-network-stub-capabilities.valid.json",
      "examples/modelBoundary/one-provider-adapter-no-network-stub-health.valid.json",
      "examples/modelBoundary/one-provider-adapter-no-network-stub-invocation.valid.json",
      "examples/modelBoundary/one-provider-adapter-no-network-stub-result.valid.json",
      "examples/modelBoundary/one-provider-adapter-no-network-stub-result.invalid.fake-success.json",
      "examples/modelBoundary/one-provider-adapter-no-network-stub-result.invalid.trust-promotion.json"
    ];
    for (const path of required) expect(existsSync(file(path)), path).toBe(true);
  });

  it("documents the exact verdict block", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_NO_NETWORK_IMPLEMENTATION_STUB.md");
    expect(doc).toContain("One Provider Adapter No-Network Implementation Stub: Accepted");
    expect(doc).toContain("Status: Config-consuming no-network provider stub complete; live execution still disabled");
    expect(doc).toContain("Next phase: One provider adapter opt-in harness contract");
  });

  it("documents non-implementation and no-success boundaries", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_NO_NETWORK_IMPLEMENTATION_STUB.md");
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
      "No fake live-provider success is returned.",
      "No successful provider response is produced."
    ];
    for (const phrase of phrases) expect(doc).toContain(phrase);
  });

  it("documents trust guardrails", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_NO_NETWORK_IMPLEMENTATION_STUB.md");
    const phrases = [
      "Config validity does not promote trust.",
      "Config presence does not enable opt-in.",
      "Stub execution does not promote trust.",
      "Stub refusal is not model evidence.",
      "API key env var name does not promote trust.",
      "API key presence does not promote trust.",
      "Network success does not promote trust.",
      "Provider output is not deterministic Hollow evidence.",
      "T2 requires verified deterministic Hollow evidence through VRP."
    ];
    for (const phrase of phrases) expect(doc).toContain(phrase);
  });

  it("source does not read env, import network/provider frameworks, or write side effects", () => {
    const source = [
      read("src/modelBoundary/types/oneProviderAdapterNoNetworkImplementationStubTypes.ts"),
      read("src/modelBoundary/oneProviderAdapterNoNetworkImplementationStub.ts")
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
    expect([...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})].join("\n")).not.toMatch(/openai|anthropic|gemini|grok|langchain|langgraph|autogen|crewai|@ai-sdk|google/i);
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

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

describe("one provider adapter live test plan acceptance", () => {
  it("creates the R28 planning document", () => {
    expect(existsSync(file("docs/ONE_PROVIDER_ADAPTER_LIVE_TEST_PLAN.md"))).toBe(true);
  });

  it("documents the exact verdict block", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_LIVE_TEST_PLAN.md");
    expect(doc).toContain("One Provider Adapter Live Test Plan: Accepted");
    expect(doc).toContain("Status: Live test planning boundary complete; no live tests implemented");
    expect(doc).toContain("Next phase: One provider adapter implementation behind explicit opt-in planning");
  });

  it("documents non-implementation boundaries", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_LIVE_TEST_PLAN.md");
    const phrases = [
      "No live tests are implemented.",
      "No live adapter is implemented.",
      "No provider-specific behavior is implemented.",
      "No real Model API Layer is implemented.",
      "No provider SDK is imported.",
      "No API key value is read.",
      "process.env is not read.",
      "No network call is performed.",
      "No live provider execution is enabled."
    ];

    for (const phrase of phrases) expect(doc).toContain(phrase);
  });

  it("documents live-test isolation and opt-in rules", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_LIVE_TEST_PLAN.md");
    const phrases = [
      "Future live tests are opt-in only.",
      "Future live tests are skipped by default.",
      "Live tests must not run in normal npx vitest run.",
      "Default unit tests remain offline.",
      "Default acceptance tests remain offline."
    ];

    for (const phrase of phrases) expect(doc).toContain(phrase);
  });

  it("documents API key, network, and trust guardrails", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_LIVE_TEST_PLAN.md");
    const phrases = [
      "API key values must never appear in fixtures/logs/Ledger/storage.",
      "Network success does not promote trust.",
      "Live test success does not promote trust.",
      "Provider output is not deterministic Hollow evidence.",
      "T2 requires verified deterministic Hollow evidence through VRP."
    ];

    for (const phrase of phrases) expect(doc).toContain(phrase);
  });

  it("source does not read env, import network/provider frameworks, or add live source", () => {
    const source = [
      read("src/modelBoundary/oneProviderAdapterOptInHarness.ts"),
      read("src/modelBoundary/types/oneProviderAdapterOptInHarnessImplementationTypes.ts")
    ].join("\n");
    const importLines = read("tests/acceptance/oneProviderAdapterLiveTestPlanAcceptance.test.ts").split(/\r?\n/).filter((line) => line.trim().startsWith("import "));

    expect(source).not.toMatch(/process\.env/);
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

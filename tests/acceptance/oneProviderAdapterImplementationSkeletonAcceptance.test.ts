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

describe("one provider adapter implementation skeleton acceptance", () => {
  it("creates required R31 files", () => {
    const required = [
      "src/providers/providerAdapterTypes.ts",
      "src/providers/explicitOptInProviderGate.ts",
      "src/providers/oneProviderAdapterSkeleton.ts",
      "tests/providers/oneProviderAdapterSkeleton.test.ts",
      "docs/ONE_PROVIDER_ADAPTER_IMPLEMENTATION_SKELETON.md"
    ];
    for (const path of required) expect(existsSync(file(path)), path).toBe(true);
  });

  it("documents title and inert skeleton status", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_IMPLEMENTATION_SKELETON.md");
    expect(doc).toContain("# One Provider Adapter Implementation Skeleton Behind Explicit Opt-In");
    expect(doc).toContain("Status: Inert skeleton only");
  });

  it("documents non-implementation boundaries", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_IMPLEMENTATION_SKELETON.md");
    const phrases = [
      "No live provider adapter is added.",
      "No provider SDK/package changes are added.",
      "No API-key or process.env reads are added.",
      "No network calls or live execution are added.",
      "No fake provider success or provider output is added."
    ];
    for (const phrase of phrases) expect(doc).toContain(phrase);
  });

  it("documents inert skeleton behavior", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_IMPLEMENTATION_SKELETON.md");
    const phrases = [
      "The skeleton is disabled by default.",
      "The skeleton requires explicit opt-in passed as input data.",
      "The skeleton returns disabled, blocked, or not-run states only.",
      "The skeleton never returns provider content.",
      "The skeleton never simulates provider success."
    ];
    for (const phrase of phrases) expect(doc).toContain(phrase);
  });

  it("locks provider output trust tiers and VRP requirement", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_IMPLEMENTATION_SKELETON.md");
    expect(doc).toContain("Raw provider output = T0.");
    expect(doc).toContain("Schema-valid provider output = T1 maximum.");
    expect(doc).toContain("T2 requires VRP-verified deterministic Hollow evidence.");
  });

  it("contains exact final verdict", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_IMPLEMENTATION_SKELETON.md");
    expect(doc).toContain("One Provider Adapter Implementation Skeleton Behind Explicit Opt-In: Accepted");
    expect(doc).toContain("Status: Inert provider adapter skeleton locked; no live provider behavior added");
    expect(doc).toContain("Next phase: One provider adapter disabled-by-default live harness scaffold");
  });

  it("updates PLANS.md with R31", () => {
    expect(read("PLANS.md")).toContain("ExecPlan - One Provider Adapter Implementation Skeleton Behind Explicit Opt-In");
  });

  it("source does not read env, import network/provider frameworks, or write side effects", () => {
    const source = [
      read("src/providers/providerAdapterTypes.ts"),
      read("src/providers/explicitOptInProviderGate.ts"),
      read("src/providers/oneProviderAdapterSkeleton.ts")
    ].join("\n");
    const importLines = source.split(/\r?\n/).filter((line) => line.trim().startsWith("import "));
    expect(source).not.toMatch(/process\.env/);
    expect(importLines.join("\n")).not.toMatch(/node:http|node:https|fetch|XMLHttpRequest/);
    expect(importLines.join("\n")).not.toMatch(/openai|anthropic|gemini|grok|langchain|langgraph|autogen|crewai|@ai-sdk|google/i);
    expect(source).not.toMatch(/ledger\.append|recordInvocation|createLedgerEntry|writeLedger/i);
    expect(source).not.toMatch(/writeFile|appendFile|createWriteStream/);
  });

  it("does not add provider SDK dependencies", () => {
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

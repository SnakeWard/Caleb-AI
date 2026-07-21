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

describe("one provider adapter disabled-by-default live harness scaffold acceptance", () => {
  it("creates required R32 files", () => {
    const required = [
      "src/providers/liveHarnessTypes.ts",
      "src/providers/disabledByDefaultLiveHarnessScaffold.ts",
      "tests/providers/disabledByDefaultLiveHarnessScaffold.test.ts",
      "docs/ONE_PROVIDER_ADAPTER_DISABLED_BY_DEFAULT_LIVE_HARNESS_SCAFFOLD.md"
    ];
    for (const path of required) expect(existsSync(file(path)), path).toBe(true);
  });

  it("documents title and inert scaffold status", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_DISABLED_BY_DEFAULT_LIVE_HARNESS_SCAFFOLD.md");
    expect(doc).toContain("# One Provider Adapter Disabled-By-Default Live Harness Scaffold");
    expect(doc).toContain("Status: Inert scaffold only");
  });

  it("documents non-implementation boundaries", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_DISABLED_BY_DEFAULT_LIVE_HARNESS_SCAFFOLD.md");
    const phrases = [
      "No live provider adapter is added.",
      "No provider SDK/package changes are added.",
      "No API-key or process.env reads are added.",
      "No network calls or live execution are added.",
      "No fake provider success, provider response simulation, or provider output is added."
    ];
    for (const phrase of phrases) expect(doc).toContain(phrase);
  });

  it("documents scaffold behavior", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_DISABLED_BY_DEFAULT_LIVE_HARNESS_SCAFFOLD.md");
    const phrases = [
      "The scaffold is disabled by default.",
      "The scaffold requires explicit opt-in passed as input data.",
      "The scaffold requires explicit live harness request passed as input data.",
      "The scaffold returns skipped/not-run when not opted in.",
      "The scaffold returns blocked/not-run when opt-in is present but live execution is unavailable."
    ];
    for (const phrase of phrases) expect(doc).toContain(phrase);
  });

  it("documents required future report fields", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_DISABLED_BY_DEFAULT_LIVE_HARNESS_SCAFFOLD.md");
    const fields = [
      "harness_id",
      "provider_adapter_id",
      "opt_in_state",
      "explicit_live_request_state",
      "live_execution_state",
      "skip_reason",
      "block_reason",
      "network_attempted",
      "provider_response_received",
      "provider_output_present",
      "provider_output_trust_tier",
      "vrp_evidence_required_for_T2",
      "ledger_write_policy",
      "created_at"
    ];
    for (const field of fields) expect(doc).toContain(field);
  });

  it("locks provider output trust tiers and VRP requirement", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_DISABLED_BY_DEFAULT_LIVE_HARNESS_SCAFFOLD.md");
    expect(doc).toContain("Raw provider output = T0.");
    expect(doc).toContain("Schema-valid provider output = T1 maximum.");
    expect(doc).toContain("T2 requires VRP-verified deterministic Hollow evidence.");
  });

  it("contains exact final verdict", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_DISABLED_BY_DEFAULT_LIVE_HARNESS_SCAFFOLD.md");
    expect(doc).toContain("One Provider Adapter Disabled-By-Default Live Harness Scaffold: Accepted");
    expect(doc).toContain("Status: Live harness scaffold locked disabled-by-default; no live execution added");
    expect(doc).toContain("Next phase: One provider adapter dry-run report contract");
  });

  it("updates PLANS.md with R32", () => {
    expect(read("PLANS.md")).toContain("ExecPlan - One Provider Adapter Disabled-By-Default Live Harness Scaffold");
  });

  it("source does not read env, import network/provider frameworks, or write provider side effects", () => {
    const source = [
      read("src/providers/liveHarnessTypes.ts"),
      read("src/providers/disabledByDefaultLiveHarnessScaffold.ts")
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
    expect(v1Data.hollows).toHaveLength(14);
    expect(hollowcut.ok).toBe(true);
    expect(hollowcutData.hollows).toHaveLength(9);
  });
});

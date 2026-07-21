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

describe("one provider adapter dry-run CLI surface acceptance", () => {
  it("creates required R34 files", () => {
    const required = [
      "src/providers/oneProviderAdapterDryRunCli.ts",
      "tests/providers/oneProviderAdapterDryRunCli.test.ts",
      "docs/ONE_PROVIDER_ADAPTER_DRY_RUN_CLI_SURFACE.md"
    ];
    for (const path of required) expect(existsSync(file(path)), path).toBe(true);
  });

  it("documents exact title and inert CLI status", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_DRY_RUN_CLI_SURFACE.md");
    expect(doc).toContain("# One Provider Adapter Dry-Run CLI Surface Behind Explicit Opt-In");
    expect(doc).toContain("Status: Inert CLI dry-run surface only");
  });

  it("documents non-implementation boundaries", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_DRY_RUN_CLI_SURFACE.md");
    const phrases = [
      "No live provider adapter is added.",
      "No provider SDK/package changes are added.",
      "No API-key or process.env reads are added.",
      "No network calls or live execution are added.",
      "No fake provider success, provider response simulation, provider output, or provider content is added."
    ];
    for (const phrase of phrases) expect(doc).toContain(phrase);
  });

  it("documents skipped/not-run and blocked/not-run states", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_DRY_RUN_CLI_SURFACE.md");
    expect(doc).toContain("The CLI returns skipped/not-run without explicit opt-in.");
    expect(doc).toContain("The CLI returns skipped/not-run without explicit live request.");
    expect(doc).toContain("The CLI returns blocked/not-run when opt-in and live request are present but live execution is unavailable.");
  });

  it("locks provider output trust tiers and VRP requirement", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_DRY_RUN_CLI_SURFACE.md");
    expect(doc).toContain("Raw provider output = T0.");
    expect(doc).toContain("Schema-valid provider output = T1 maximum.");
    expect(doc).toContain("T2 requires VRP-verified deterministic Hollow evidence.");
  });

  it("contains exact final verdict", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_DRY_RUN_CLI_SURFACE.md");
    expect(doc).toContain("One Provider Adapter Dry-Run CLI Surface Behind Explicit Opt-In: Accepted");
    expect(doc).toContain("Status: Dry-run CLI surface locked; no live provider behavior added");
    expect(doc).toContain("Next phase: One provider adapter live prerequisites contract");
  });

  it("updates PLANS.md with R34", () => {
    expect(read("PLANS.md")).toContain("ExecPlan - One Provider Adapter Dry-Run CLI Surface Behind Explicit Opt-In");
  });

  it("CLI command returns skipped report by default", async () => {
    const result = await handleCliCommand(parseCliArgs(["one-provider-adapter-dry-run", "--json"]));
    const data = result.data as { report: { status: string; live_execution_state: string } };
    expect(result.ok).toBe(true);
    expect(data.report.status).toBe("skipped");
    expect(data.report.live_execution_state).toBe("not_run");
  });

  it("CLI command returns blocked report with opt-in and live request", async () => {
    const result = await handleCliCommand(
      parseCliArgs([
        "one-provider-adapter-dry-run",
        "--explicit-opt-in",
        "true",
        "--explicit-live-request",
        "true",
        "--json"
      ])
    );
    const data = result.data as {
      report: {
        status: string;
        live_execution_state: string;
        network_attempted: boolean;
        provider_execution_attempted: boolean;
        provider_response_received: boolean;
        provider_output_present: boolean;
        provider_content_present: boolean;
        provider_output_trust_ceiling: string;
        vrp_evidence_required_for_T2: boolean;
      };
    };
    expect(result.ok).toBe(true);
    expect(data.report.status).toBe("blocked");
    expect(data.report.live_execution_state).toBe("unavailable");
    expect(data.report.network_attempted).toBe(false);
    expect(data.report.provider_execution_attempted).toBe(false);
    expect(data.report.provider_response_received).toBe(false);
    expect(data.report.provider_output_present).toBe(false);
    expect(data.report.provider_content_present).toBe(false);
    expect(data.report.provider_output_trust_ceiling).toBe("T1");
    expect(data.report.vrp_evidence_required_for_T2).toBe(true);
  });

  it("dry-run source reads no env and imports no network/provider frameworks", () => {
    const source = read("src/providers/oneProviderAdapterDryRunCli.ts");
    const importLines = source.split(/\r?\n/).filter((line) => line.trim().startsWith("import "));
    expect(source).not.toMatch(/process\.env/);
    expect(importLines.join("\n")).not.toMatch(/node:http|node:https|fetch|XMLHttpRequest/);
    expect(importLines.join("\n")).not.toMatch(/openai|anthropic|gemini|grok|langchain|langgraph|autogen|crewai|@ai-sdk|google/i);
  });

  it("commandHandlers contains exactly one env read: the caller-declared live credential (M1 authorized)", () => {
    const source = read("src/cli/commandHandlers.ts");
    const envReads = source.match(/process\.env/g) ?? [];
    expect(envReads).toHaveLength(1);
    expect(source).toContain("() => process.env[credentialEnvVar]");
    const importLines = source.split(/\r?\n/).filter((line) => line.trim().startsWith("import "));
    expect(importLines.join("\n")).not.toMatch(/node:http|node:https|fetch|XMLHttpRequest/);
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

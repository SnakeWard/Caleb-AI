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

const DOC = "docs/ONE_PROVIDER_ADAPTER_LIVE_PREREQUISITES_EVALUATOR.md";

describe("one provider adapter live prerequisites evaluator acceptance", () => {
  it("creates required R36 files", () => {
    const required = [
      "src/providers/livePrerequisitesTypes.ts",
      "src/providers/oneProviderAdapterLivePrerequisitesEvaluator.ts",
      "tests/providers/oneProviderAdapterLivePrerequisitesEvaluator.test.ts",
      "tests/acceptance/oneProviderAdapterLivePrerequisitesEvaluatorAcceptance.test.ts",
      DOC
    ];
    for (const path of required) expect(existsSync(file(path)), path).toBe(true);
  });

  it("documents exact title and pure evaluator status", () => {
    const doc = read(DOC);
    expect(doc).toContain("# One Provider Adapter Live Prerequisites Evaluator");
    expect(doc).toContain("Status: Pure evaluator only");
    expect(doc).toContain("Prior pass: R35 — One Provider Adapter Live Prerequisites Contract");
  });

  it("documents non-implementation boundaries", () => {
    const doc = read(DOC);
    const phrases = [
      "No live provider adapter is added.",
      "No provider SDK/package changes are added.",
      "No API-key or process.env reads are added.",
      "No network calls or live execution are added.",
      "No fake provider success, provider response simulation, provider output, or provider content is added."
    ];
    for (const phrase of phrases) expect(doc).toContain(phrase);
  });

  it("documents required evaluator input fields", () => {
    const doc = read(DOC);
    const fields = [
      "repo_root_confirmed",
      "explicit_opt_in",
      "explicit_live_request",
      "provider_adapter_allowlisted",
      "live_harness_allowlisted",
      "credential_source_declared_by_caller",
      "credential_auto_read",
      "network_permission_granted_by_caller",
      "explicit_live_command_or_flag",
      "dry_run_report_completed",
      "default_tests_non_live",
      "default_acceptance_non_live",
      "default_ci_non_live",
      "provider_output_trust_ceiling",
      "vrp_evidence_required_for_T2",
      "created_at"
    ];
    for (const fieldName of fields) expect(doc).toContain(fieldName);
  });

  it("documents required evaluator output fields", () => {
    const doc = read(DOC);
    const fields = [
      "evaluator_id",
      "evaluation_mode",
      "prerequisites_met",
      "missing_prerequisites",
      "blocking_reasons",
      "live_execution_state",
      "network_attempted",
      "provider_execution_attempted",
      "provider_response_received",
      "provider_output_present",
      "provider_content_present",
      "provider_output_trust_ceiling",
      "vrp_evidence_required_for_T2",
      "credential_auto_read_allowed",
      "default_tests_non_live",
      "default_acceptance_non_live",
      "default_ci_non_live",
      "created_at"
    ];
    for (const fieldName of fields) expect(doc).toContain(fieldName);
  });

  it("documents locked output values", () => {
    const doc = read(DOC);
    const phrases = [
      "`evaluation_mode` is `prerequisites_evaluation` or `contract_only`.",
      "`live_execution_state` is `not_run` or `blocked`.",
      "`network_attempted` is `false`.",
      "`provider_execution_attempted` is `false`.",
      "`provider_response_received` is `false`.",
      "`provider_output_present` is `false`.",
      "`provider_content_present` is `false`.",
      "`provider_output_trust_ceiling` is `T1`.",
      "`vrp_evidence_required_for_T2` is `true`.",
      "`credential_auto_read_allowed` is `false`."
    ];
    for (const phrase of phrases) expect(doc).toContain(phrase);
  });

  it("states evaluator success does not execute provider behavior or promote trust", () => {
    const doc = read(DOC);
    expect(doc).toContain("Evaluator success does not execute provider behavior.");
    expect(doc).toContain("Evaluator success does not promote provider output trust.");
  });

  it("locks trust boundaries", () => {
    const doc = read(DOC);
    expect(doc).toContain("Raw provider output = T0.");
    expect(doc).toContain("Schema-valid provider output = T1 maximum.");
    expect(doc).toContain("T2 requires VRP-verified deterministic Hollow evidence.");
  });

  it("contains exact final verdict", () => {
    const doc = read(DOC);
    expect(doc).toContain("One Provider Adapter Live Prerequisites Evaluator: Accepted");
    expect(doc).toContain("Status: Live prerequisites evaluator locked; no live provider behavior added");
    expect(doc).toContain("Next phase: One provider adapter live prerequisites CLI surface");
  });

  it("updates PLANS.md with R36", () => {
    expect(read("PLANS.md")).toContain("R36");
  });

  it("source does not read env, import network/provider frameworks, or write provider side effects", () => {
    const source = [
      read("src/providers/livePrerequisitesTypes.ts"),
      read("src/providers/oneProviderAdapterLivePrerequisitesEvaluator.ts")
    ].join("\n");
    const importLines = source.split(/\r?\n/).filter((line) => line.trim().startsWith("import "));
    expect(source).not.toMatch(/process\.env/);
    expect(importLines.join("\n")).not.toMatch(/node:http|node:https|fetch|XMLHttpRequest/);
    expect(importLines.join("\n")).not.toMatch(/openai|anthropic|gemini|grok|langchain|langgraph|autogen|crewai|@ai-sdk|google/i);
    expect(source).not.toMatch(/ledger\.append|recordInvocation|createLedgerEntry|writeLedger/i);
    expect(source).not.toMatch(/writeFile|appendFile|createWriteStream/);
  });

  it("does not add provider SDK dependencies", () => {
    const pkg = JSON.parse(read("package.json")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const dependencyNames = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})].join(
      "\n"
    );
    expect(dependencyNames).not.toMatch(/openai|anthropic|gemini|grok|langchain|langgraph|autogen|crewai|@ai-sdk|google-generative-ai|vertexai/i);
  });

  it("keeps production catalog counts unchanged", async () => {
    const v1 = await handleCliCommand(parseCliArgs(["list-hollows", "--json"]));
    const hollowcut = await handleCliCommand(parseCliArgs(["list-hollowcut-hollows", "--json"]));
    const v1Data = v1.data as { hollows: unknown[] };
    const hollowcutData = hollowcut.data as { hollows: unknown[] };
    expect(v1.ok).toBe(true);
    expect(v1Data.hollows).toHaveLength(13);
    expect(hollowcut.ok).toBe(true);
    expect(hollowcutData.hollows).toHaveLength(9);
  });
});

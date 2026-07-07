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

describe("one provider adapter live test harness contract acceptance", () => {
  it("creates the R30 contract document", () => {
    expect(existsSync(file("docs/ONE_PROVIDER_ADAPTER_LIVE_TEST_HARNESS_CONTRACT.md"))).toBe(true);
  });

  it("documents the required title and contract-only status", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_LIVE_TEST_HARNESS_CONTRACT.md");
    expect(doc).toContain("# One Provider Adapter Live Test Harness Contract");
    expect(doc).toContain("Status: Contract-only boundary");
  });

  it("documents non-implementation boundaries", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_LIVE_TEST_HARNESS_CONTRACT.md");
    const phrases = [
      "R30 adds no provider implementation.",
      "R30 adds no live adapter.",
      "R30 adds no provider-specific runtime behavior.",
      "R30 adds no SDK/package changes.",
      "R30 adds no API-key read.",
      "R30 adds no process.env read.",
      "R30 performs no network calls.",
      "R30 performs no live execution.",
      "R30 adds no fake provider success.",
      "R30 adds no provider output."
    ];

    for (const phrase of phrases) expect(doc).toContain(phrase);
  });

  it("documents future harness gating and default execution blocks", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_LIVE_TEST_HARNESS_CONTRACT.md");
    const phrases = [
      "The live harness must be skipped by default.",
      "The live harness must require explicit opt-in.",
      "The live harness must require an explicit live command or explicit live flag.",
      "The live harness must not run under `npx vitest run`.",
      "The live harness must not run under `npx vitest run tests/acceptance`.",
      "The live harness must not run in default CI.",
      "The live harness must report not-run/skipped state when not opted in.",
      "The live harness must report blocked state when prerequisites are missing."
    ];

    for (const phrase of phrases) expect(doc).toContain(phrase);
  });

  it("locks provider output trust tiers and VRP requirement", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_LIVE_TEST_HARNESS_CONTRACT.md");
    expect(doc).toContain("The live harness must never treat provider output as Hollow evidence.");
    expect(doc).toContain("The live harness must never promote provider output to T2.");
    expect(doc).toContain("Raw provider output remains T0.");
    expect(doc).toContain("Schema-valid provider output may reach T1 maximum.");
    expect(doc).toContain("T2 requires VRP-verified deterministic Hollow evidence.");
  });

  it("contains all future report fields", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_LIVE_TEST_HARNESS_CONTRACT.md");
    const fields = ["harness_id", "provider_adapter_id", "opt_in_state", "live_execution_state", "skip_reason", "block_reason", "network_attempted", "provider_response_received", "provider_output_trust_tier", "vrp_evidence_required_for_T2", "ledger_write_policy", "created_at"];
    for (const field of fields) expect(doc).toContain(`\`${field}\``);
  });

  it("contains the exact final verdict block", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_LIVE_TEST_HARNESS_CONTRACT.md");
    expect(doc).toContain("One Provider Adapter Live Test Harness Contract: Accepted");
    expect(doc).toContain("Status: Live harness contract locked; no live execution added");
    expect(doc).toContain("Next phase: One provider adapter implementation skeleton behind explicit opt-in");
  });

  it("updates PLANS.md with R30", () => {
    expect(read("PLANS.md")).toContain("ExecPlan - One Provider Adapter Live Test Harness Contract");
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
    expect(v1Data.hollows).toHaveLength(13);
    expect(hollowcut.ok).toBe(true);
    expect(hollowcutData.hollows).toHaveLength(9);
  });
});

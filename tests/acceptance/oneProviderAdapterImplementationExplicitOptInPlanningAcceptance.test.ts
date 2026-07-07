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

describe("one provider adapter implementation explicit opt-in planning acceptance", () => {
  it("creates the R29 planning document", () => {
    expect(existsSync(file("docs/ONE_PROVIDER_ADAPTER_IMPLEMENTATION_EXPLICIT_OPT_IN_PLANNING.md"))).toBe(true);
  });

  it("documents the required title and planning-only status", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_IMPLEMENTATION_EXPLICIT_OPT_IN_PLANNING.md");
    expect(doc).toContain("# One Provider Adapter Implementation Behind Explicit Opt-In Planning");
    expect(doc).toContain("Status: Planning-only boundary");
  });

  it("documents non-implementation boundaries", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_IMPLEMENTATION_EXPLICIT_OPT_IN_PLANNING.md");
    const phrases = [
      "No provider implementation is added in R29.",
      "No live adapter is added in R29.",
      "No provider-specific runtime behavior is added in R29.",
      "No SDK or package change is allowed in R29.",
      "No API-key read is allowed in R29.",
      "No process.env read is allowed in R29.",
      "No network calls are allowed in R29.",
      "No live tests are allowed in R29.",
      "No live execution is allowed in R29.",
      "No fake provider success is allowed in R29.",
      "No provider output is allowed in R29."
    ];

    for (const phrase of phrases) expect(doc).toContain(phrase);
  });

  it("locks provider output trust tiers and VRP requirement", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_IMPLEMENTATION_EXPLICIT_OPT_IN_PLANNING.md");
    expect(doc).toContain("Raw provider output = T0.");
    expect(doc).toContain("Schema-valid provider output = T1 maximum.");
    expect(doc).toContain("T2 requires VRP-verified deterministic Hollow evidence.");
    expect(doc).toContain("Provider/model output is not deterministic Hollow evidence.");
  });

  it("locks non-promotion rules", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_IMPLEMENTATION_EXPLICIT_OPT_IN_PLANNING.md");
    const phrases = [
      "Explicit opt-in does not promote trust.",
      "API key presence does not promote trust.",
      "Network success does not promote trust.",
      "Provider identity does not promote trust.",
      "Successful provider response does not promote trust.",
      "Ledger presence does not promote trust.",
      "Storage does not increase trust.",
      "Opt-in, API key presence, network success, provider identity, successful provider response, Ledger presence, and storage do not promote trust."
    ];

    for (const phrase of phrases) expect(doc).toContain(phrase);
  });

  it("documents future implementation boundary", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_IMPLEMENTATION_EXPLICIT_OPT_IN_PLANNING.md");
    const phrases = [
      "Future adapter implementation must be behind explicit opt-in.",
      "Future live harness must remain skipped by default.",
      "Future live harness must not run in normal test commands.",
      "Future live harness must not run in default CI commands.",
      "Future live harness must not run in default acceptance commands.",
      "Future provider output must be treated as model/provider evidence, not Hollow evidence."
    ];

    for (const phrase of phrases) expect(doc).toContain(phrase);
  });

  it("contains the exact final verdict block", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_IMPLEMENTATION_EXPLICIT_OPT_IN_PLANNING.md");
    expect(doc).toContain("One Provider Adapter Implementation Behind Explicit Opt-In Planning: Accepted");
    expect(doc).toContain("Status: Provider implementation boundary locked; no provider implementation added");
    expect(doc).toContain("Next phase: One provider adapter live test harness contract");
  });

  it("updates PLANS.md with R29", () => {
    expect(read("PLANS.md")).toContain("ExecPlan - One Provider Adapter Implementation Behind Explicit Opt-In Planning");
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

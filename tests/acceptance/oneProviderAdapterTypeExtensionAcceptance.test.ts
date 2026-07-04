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

describe("one provider adapter type extension acceptance", () => {
  it("creates the required R23 files", () => {
    const requiredFiles = [
      "src/modelBoundary/types/oneProviderAdapterTypeExtensionTypes.ts",
      "src/modelBoundary/oneProviderAdapterTypeExtensionValidator.ts",
      "tests/modelBoundary/oneProviderAdapterTypeExtensionValidator.test.ts",
      "tests/acceptance/oneProviderAdapterTypeExtensionAcceptance.test.ts",
      "examples/modelBoundary/one-provider-adapter-config.valid.json",
      "examples/modelBoundary/one-provider-adapter-opt-in-gate.valid.json",
      "examples/modelBoundary/one-provider-adapter-mapping.valid.json",
      "examples/modelBoundary/one-provider-adapter-config.invalid.trust-promotion.json",
      "docs/ONE_PROVIDER_ADAPTER_TYPE_EXTENSION.md"
    ];

    for (const path of requiredFiles) {
      expect(existsSync(file(path)), path).toBe(true);
    }
  });

  it("exports the R23 type extension from the model boundary barrel", () => {
    const index = read("src/modelBoundary/index.ts");
    expect(index).toContain('export * from "./types/oneProviderAdapterTypeExtensionTypes.js";');
    expect(index).toContain('export * from "./oneProviderAdapterTypeExtensionValidator.js";');
  });

  it("documents the exact acceptance verdict", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_TYPE_EXTENSION.md");
    expect(doc).toContain("One Provider Adapter Type Extension: Accepted");
    expect(doc).toContain("Status: First-provider type extension complete; no provider implementation");
    expect(doc).toContain("Next phase: One provider adapter config contract");
  });

  it("documents non-implementation boundaries", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_TYPE_EXTENSION.md");
    const phrases = [
      "No live adapter is implemented.",
      "No provider-specific behavior is implemented.",
      "No real Model API Layer is implemented.",
      "No provider SDK is imported.",
      "No API key or secret is required.",
      "No network call is performed.",
      "No live provider test is added.",
      "No provider dependency is added.",
      "No runtime behavior is changed.",
      "No real provider is selected unless explicitly authorized by the user."
    ];

    for (const phrase of phrases) {
      expect(doc).toContain(phrase);
    }
  });

  it("documents trust guardrails", () => {
    const doc = read("docs/ONE_PROVIDER_ADAPTER_TYPE_EXTENSION.md");
    const phrases = [
      "Provider slot selection does not promote trust.",
      "Explicit opt-in does not promote trust.",
      "API key presence does not promote trust.",
      "Network success does not promote trust.",
      "Provider identity does not promote trust.",
      "Successful provider response does not promote trust.",
      "Raw provider output starts at T0.",
      "Schema-valid provider output may reach T1 only.",
      "Provider output is not deterministic Hollow evidence.",
      "T2 requires verified deterministic Hollow evidence through VRP."
    ];

    for (const phrase of phrases) {
      expect(doc).toContain(phrase);
    }
  });

  it("does not add provider SDK or Model API implementation imports", () => {
    const source = [
      read("src/modelBoundary/types/oneProviderAdapterTypeExtensionTypes.ts"),
      read("src/modelBoundary/oneProviderAdapterTypeExtensionValidator.ts")
    ].join("\n");
    const importLines = source.split(/\r?\n/).filter((line) => line.trim().startsWith("import "));

    expect(importLines.join("\n")).not.toMatch(/node:http|node:https|fetch|XMLHttpRequest/);
    expect(importLines.join("\n")).not.toMatch(/openai|anthropic|google|langchain|ai-sdk|@ai-sdk/i);
  });

  it("does not add provider dependencies to package.json", () => {
    const pkg = JSON.parse(read("package.json")) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    const dependencyNames = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.devDependencies ?? {})].join("\n");

    expect(dependencyNames).not.toMatch(/openai|anthropic|langchain|@ai-sdk|google-generative-ai|vertexai/i);
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

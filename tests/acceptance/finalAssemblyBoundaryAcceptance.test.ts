import { access, readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";
import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";

const docPath = "docs/FINAL_ASSEMBLY_BOUNDARY.md";
const boundaryPath = "src/finalAssembly/finalAssemblyBoundary.ts";
const validatorPath = "src/finalAssembly/finalAssemblyBoundaryValidator.ts";
const typesPath = "src/finalAssembly/types/finalAssemblyBoundaryTypes.ts";
const exactVerdict = `Final Assembly Boundary: Accepted
Status: User-facing assembly packet boundary complete; verified final truth not claimed
Next phase: Ledgered route event write`;

describe("Final Assembly Boundary acceptance lock", () => {
  it("required files exist", async () => {
    for (const path of [
      docPath,
      typesPath,
      boundaryPath,
      validatorPath,
      "src/finalAssembly/index.ts",
      "examples/finalAssembly/final-assembly-request.valid.json",
      "examples/finalAssembly/final-assembly-packet.valid.json",
      "examples/finalAssembly/final-assembly-packet.invalid.trust-promotion.json"
    ]) {
      await expect(access(path)).resolves.toBeUndefined();
    }
  });

  it("doc contains exact verdict block", async () => {
    expect(await readFile(docPath, "utf8")).toContain(exactVerdict);
  });

  it("doc locks non-implementation statements", async () => {
    const doc = await readFile(docPath, "utf8");
    for (const statement of [
      "No live model provider is implemented.",
      "No real Model API Layer is implemented.",
      "No provider SDK is imported.",
      "No API key or secret is required.",
      "No network call is performed.",
      "No persistent storage is implemented.",
      "No real Ledger write is performed.",
      "No Hollow execution is implemented.",
      "No full role rotation runtime is implemented.",
      "No verified final truth is claimed."
    ]) {
      expect(doc).toContain(statement);
    }
  });

  it("doc locks trust statements", async () => {
    const doc = await readFile(docPath, "utf8");
    for (const statement of [
      "Route completion does not promote trust.",
      "Final assembly does not promote trust.",
      "Final packet does not claim verified final truth.",
      "Hollow verification is required before deterministic evidence can reach T2."
    ]) {
      expect(doc).toContain(statement);
    }
  });

  it("source does not import fs, network, provider SDKs, or ledger writer", async () => {
    const source = `${await readFile(boundaryPath, "utf8")}\n${await readFile(validatorPath, "utf8")}`;
    expect(source).not.toMatch(/from\s+["'](?:node:fs|fs|node:http|http|node:https|https)["']/);
    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toMatch(/openai|anthropic|gemini|grok|langchain|langgraph|autogen|crewai/i);
    expect(source).not.toMatch(/writeLedger|appendLedger|ledgerWriter|createLedgerEntry/);
  });

  it("keeps V1 Hollow catalog count locked at 14", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(14);
  });

  it("keeps Hollowcut catalog count locked at 9", () => {
    expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9);
  });
});

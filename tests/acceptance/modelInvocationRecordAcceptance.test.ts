import { access, readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";
import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";

const docPath = "docs/LEDGERED_MODEL_INVOCATION_RECORD.md";
const exactVerdict = `Ledgered Model Invocation Record: Accepted
Status: Model invocation provenance contract complete; no live provider integration
Next phase: single_pass route MVP`;

const sourcePaths = [
  "src/modelBoundary/types/modelInvocationRecordTypes.ts",
  "src/modelBoundary/modelInvocationRecordValidator.ts",
  "src/modelBoundary/modelInvocationRecordBuilder.ts"
] as const;

describe("Ledgered Model Invocation Record acceptance lock", () => {
  it("required files exist", async () => {
    for (const path of [
      docPath,
      ...sourcePaths,
      "examples/modelBoundary/model-invocation-record.valid.json",
      "examples/modelBoundary/model-invocation-record.invalid.trust-promotion.json"
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
      "No single_pass route MVP is implemented."
    ]) {
      expect(doc).toContain(statement);
    }
  });

  it("doc locks trust statements", async () => {
    const doc = await readFile(docPath, "utf8");
    for (const statement of [
      "Model invocation provenance does not verify model truth.",
      "Ledger presence does not promote trust.",
      "Raw model output starts at T0.",
      "Schema-valid model output may reach T1 only.",
      "Model output never becomes T2 deterministic Hollow evidence.",
      "Storage does not increase trust.",
      "Retrieval is not trust promotion."
    ]) {
      expect(doc).toContain(statement);
    }
  });

  it("source does not import fs, network, provider SDKs, or ledger writer", async () => {
    for (const path of sourcePaths) {
      const source = await readFile(path, "utf8");
      expect(source, path).not.toMatch(/from\s+["'](?:node:fs|fs|node:http|http|node:https|https)["']/);
      expect(source, path).not.toMatch(/\bfetch\s*\(/);
      expect(source, path).not.toMatch(/openai|anthropic|gemini|grok|langchain|langgraph|autogen|crewai/i);
      expect(source, path).not.toMatch(/writeLedger|appendLedger|ledgerWriter|createLedgerEntry/);
    }
  });

  it("keeps V1 Hollow catalog count locked at 12", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(12);
  });

  it("keeps Hollowcut catalog count locked at 9", () => {
    expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9);
  });
});

import { access, readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";
import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";

const docPath = "docs/MOCKED_SINGLE_PASS_MODEL_BOUNDARY.md";
const exactVerdict = `Mocked single_pass Model Boundary: Accepted
Status: Model-shaped single_pass boundary complete; no live provider integration
Next phase: Ledgered model invocation record or single_pass route MVP`;

const sourcePaths = [
  "src/modelBoundary/types/singlePassModelBoundaryTypes.ts",
  "src/modelBoundary/mockSinglePassModelAdapter.ts",
  "src/modelBoundary/mockSinglePassModelBoundary.ts",
  "src/modelBoundary/singlePassModelBoundaryValidator.ts"
] as const;

describe("Mocked single_pass Model Boundary acceptance lock", () => {
  it("required files exist", async () => {
    for (const path of [
      docPath,
      ...sourcePaths,
      "examples/modelBoundary/mock-single-pass-request.valid.json",
      "examples/modelBoundary/mock-single-pass-response.valid.json",
      "examples/modelBoundary/mock-single-pass-storage-records.valid.json"
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
      "No Model API Layer is implemented.",
      "No provider SDK is imported.",
      "No API key or secret is required.",
      "No network call is performed.",
      "No persistent storage is implemented.",
      "No Ledger write is performed by this boundary."
    ]) {
      expect(doc).toContain(statement);
    }
  });

  it("doc locks trust rules", async () => {
    const doc = await readFile(docPath, "utf8");
    for (const statement of [
      "Raw model output starts at T0.",
      "Schema-valid model output may reach T1 only.",
      "Mocked model output never reaches T2.",
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

  it("keeps V1 Hollow catalog count locked at 13", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(13);
  });

  it("keeps Hollowcut catalog count locked at 9", () => {
    expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9);
  });
});

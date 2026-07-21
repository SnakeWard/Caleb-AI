import { access, readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";
import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";

const docPath = "docs/IN_MEMORY_ARTIFACT_STORE.md";
const sourcePath = "src/storage/inMemoryArtifactStore.ts";
const exactVerdict = `In-Memory Artifact Store Prototype: Accepted
Status: Non-persistent runtime store prototype complete; trust promotion blocked
Next phase: Mocked single_pass model boundary`;

describe("In-Memory Artifact Store acceptance lock", () => {
  it("required files exist", async () => {
    for (const path of [
      docPath,
      sourcePath,
      "examples/storage/in-memory-artifact-store-seed.valid.json"
    ]) {
      await expect(access(path)).resolves.toBeUndefined();
    }
  });

  it("contains the exact acceptance verdict", async () => {
    const doc = await readFile(docPath, "utf8");

    expect(doc).toContain(exactVerdict);
  });

  it("documents non-persistence boundaries", async () => {
    const doc = await readFile(docPath, "utf8");

    for (const statement of [
      "No filesystem storage is implemented.",
      "No database is implemented.",
      "No JSONL artifact store is implemented.",
      "No cloud persistence is implemented.",
      "No model adapter is implemented.",
      "No role runtime is implemented.",
      "process-memory only"
    ]) {
      expect(doc).toContain(statement);
    }
  });

  it("documents trust guardrails", async () => {
    const doc = await readFile(docPath, "utf8");

    for (const statement of [
      "Storage does not increase trust.",
      "Retrieval is not trust promotion.",
      "VRP remains the trust gate."
    ]) {
      expect(doc).toContain(statement);
    }
  });

  it("source does not import fs/node:fs", async () => {
    const source = await readFile(sourcePath, "utf8");

    expect(source).not.toMatch(/from\s+["']node:fs|from\s+["']fs/);
  });

  it("source does not import ledger writer", async () => {
    const source = await readFile(sourcePath, "utf8");

    expect(source).not.toMatch(/ledgerWriter|writeLedger|appendLedger|createLedgerEntry/);
  });

  it("source does not import provider SDKs", async () => {
    const source = await readFile(sourcePath, "utf8");

    expect(source).not.toMatch(/from\s+["'][^"']*(openai|anthropic|gemini|grok|provider|model-api|modelApi)[^"']*["']/i);
  });

  it("source does not call model/provider APIs", async () => {
    const source = await readFile(sourcePath, "utf8");

    expect(source).not.toMatch(/completion|chat\.completions|generateContent|invokeModel|provider\./i);
  });

  it("keeps V1 Hollow catalog count locked at 14", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(14);
  });

  it("keeps Hollowcut catalog count locked at 9", () => {
    expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9);
  });
});

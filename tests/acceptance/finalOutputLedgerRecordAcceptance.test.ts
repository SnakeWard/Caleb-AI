import { access, readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";
import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";

const docPath = "docs/FINAL_OUTPUT_LEDGER_RECORD.md";
const exactVerdict = `Final Output Ledger Record: Accepted
Status: Final output provenance record complete; recorded does not mean verified
Next phase: Live adapter boundary planning`;

describe("Final Output Ledger Record acceptance lock", () => {
  it("required files exist", async () => {
    for (const path of [
      docPath,
      "src/finalAssembly/types/finalOutputLedgerRecordTypes.ts",
      "src/finalAssembly/finalOutputLedgerRecordValidator.ts",
      "src/finalAssembly/finalOutputLedgerRecordBuilder.ts",
      "src/finalAssembly/finalOutputLedgerRecordWriter.ts",
      "examples/finalAssembly/final-output-ledger-record.valid.json",
      "examples/finalAssembly/final-output-ledger-record.invalid.trust-promotion.json"
    ]) await expect(access(path)).resolves.toBeUndefined();
  });

  it("doc contains exact verdict block", async () => expect(await readFile(docPath, "utf8")).toContain(exactVerdict));

  it("doc locks non-implementation statements", async () => {
    const doc = await readFile(docPath, "utf8");
    for (const statement of [
      "No live model provider is implemented.",
      "No real Model API Layer is implemented.",
      "No provider SDK is imported.",
      "No API key or secret is required.",
      "No network call is performed.",
      "No persistent artifact store is implemented.",
      "No Hollow execution is implemented.",
      "No full role rotation runtime is implemented.",
      "No verified final truth is claimed.",
      "No live adapter boundary is implemented."
    ]) expect(doc).toContain(statement);
  });

  it("doc locks trust and content statements", async () => {
    const doc = await readFile(docPath, "utf8");
    for (const statement of [
      "Final output ledger write does not promote trust.",
      "Ledger presence does not promote trust.",
      "Final output record means recorded, not verified.",
      "Final output ledger record must not store raw prompt text.",
      "Final output ledger record must not store raw model output text.",
      "Final output ledger record must not store API keys, secrets, or environment values."
    ]) expect(doc).toContain(statement);
  });

  it("source does not import network APIs or provider SDKs", async () => {
    const source = `${await readFile("src/finalAssembly/finalOutputLedgerRecordValidator.ts", "utf8")}\n${await readFile("src/finalAssembly/finalOutputLedgerRecordBuilder.ts", "utf8")}\n${await readFile("src/finalAssembly/finalOutputLedgerRecordWriter.ts", "utf8")}`;
    expect(source).not.toMatch(/from\s+["'](?:node:http|http|node:https|https)["']/);
    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toMatch(/openai|anthropic|gemini|grok|langchain|langgraph|autogen|crewai/i);
  });

  it("keeps V1 Hollow catalog count locked at 13", () => expect(V1_HOLLOW_MANIFESTS).toHaveLength(13));
  it("keeps Hollowcut catalog count locked at 9", () => expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9));
});

import { access, readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";
import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";

const docPath = "docs/LEDGERED_ROUTE_EVENT_WRITE.md";
const exactVerdict = `Ledgered Route Event Write: Accepted
Status: Route-level provenance event write complete; Ledger presence does not promote trust
Next phase: Final output ledger record or live adapter boundary planning`;

describe("Ledgered Route Event Write acceptance lock", () => {
  it("required files exist", async () => {
    for (const path of [
      docPath,
      "src/logicEngine/types/routeLedgerEventTypes.ts",
      "src/logicEngine/routeLedgerEventValidator.ts",
      "src/logicEngine/routeLedgerEventBuilder.ts",
      "src/logicEngine/routeLedgerEventWriter.ts",
      "examples/logicEngine/route-ledger-event.valid.json",
      "examples/logicEngine/route-ledger-event.invalid.trust-promotion.json"
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
      "No persistent artifact store is implemented.",
      "No Hollow execution is implemented.",
      "No full role rotation runtime is implemented.",
      "No verified final truth is claimed."
    ]) {
      expect(doc).toContain(statement);
    }
  });

  it("doc locks trust and content statements", async () => {
    const doc = await readFile(docPath, "utf8");
    for (const statement of [
      "Ledger write does not promote trust.",
      "Ledger presence does not promote trust.",
      "Ledger records provenance; it does not certify truth.",
      "Ledger event must not store raw prompt text.",
      "Ledger event must not store raw model output text."
    ]) {
      expect(doc).toContain(statement);
    }
  });

  it("source does not import network APIs or provider SDKs", async () => {
    const source = `${await readFile("src/logicEngine/routeLedgerEventValidator.ts", "utf8")}\n${await readFile("src/logicEngine/routeLedgerEventBuilder.ts", "utf8")}\n${await readFile("src/logicEngine/routeLedgerEventWriter.ts", "utf8")}`;
    expect(source).not.toMatch(/from\s+["'](?:node:http|http|node:https|https)["']/);
    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toMatch(/openai|anthropic|gemini|grok|langchain|langgraph|autogen|crewai/i);
  });

  it("keeps V1 Hollow catalog count locked at 13", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(13);
  });

  it("keeps Hollowcut catalog count locked at 9", () => {
    expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9);
  });
});

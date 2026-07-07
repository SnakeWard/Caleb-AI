import { access, readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";
import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";

const docPath = "docs/SINGLE_PASS_ROUTE_MVP.md";
const sourcePath = "src/logicEngine/singlePassRouteMvp.ts";
const exactVerdict = `single_pass Route MVP: Accepted
Status: Mocked single_pass route execution complete; model output capped at T1
Next phase: Final assembly boundary or ledgered route event write`;

describe("single_pass Route MVP acceptance lock", () => {
  it("required files exist", async () => {
    for (const path of [
      docPath,
      sourcePath,
      "src/logicEngine/types/singlePassRouteMvpTypes.ts",
      "examples/logicEngine/single-pass-route-request.valid.json",
      "examples/logicEngine/single-pass-route-result.valid.json"
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
      "No real Ledger write is performed by the route.",
      "No Hollow execution is implemented in this route.",
      "No full role rotation runtime is implemented.",
      "No user-facing final answer trust is claimed."
    ]) {
      expect(doc).toContain(statement);
    }
  });

  it("doc locks trust statements", async () => {
    const doc = await readFile(docPath, "utf8");
    for (const statement of [
      "Raw model output starts at T0.",
      "Schema-valid model output may reach T1 only.",
      "Model output never reaches T2/T3/T4 in this pass.",
      "Route completion does not promote trust.",
      "Model output is not deterministic Hollow evidence."
    ]) {
      expect(doc).toContain(statement);
    }
  });

  it("source does not import fs, network, provider SDKs, or ledger writer", async () => {
    const source = await readFile(sourcePath, "utf8");
    expect(source).not.toMatch(/from\s+["'](?:node:fs|fs|node:http|http|node:https|https)["']/);
    expect(source).not.toMatch(/\bfetch\s*\(/);
    expect(source).not.toMatch(/openai|anthropic|gemini|grok|langchain|langgraph|autogen|crewai/i);
    expect(source).not.toMatch(/writeLedger|appendLedger|ledgerWriter|createLedgerEntry/);
  });

  it("keeps V1 Hollow catalog count locked at 13", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(13);
  });

  it("keeps Hollowcut catalog count locked at 9", () => {
    expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9);
  });
});

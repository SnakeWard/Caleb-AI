import { access, readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";
import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";

const docPath = "docs/PROVIDER_ADAPTER_STUB_NO_NETWORK.md";
const exactVerdict = `Provider Adapter Stub With No Network: Accepted
Status: Offline provider adapter stub complete; no live provider behavior implemented
Next phase: One provider adapter behind explicit opt-in planning`;

describe("Provider Adapter Stub With No Network acceptance lock", () => {
  it("required files exist", async () => {
    for (const path of [
      docPath,
      "src/modelBoundary/providerAdapterNoNetworkStub.ts",
      "src/modelBoundary/types/providerAdapterNoNetworkStubTypes.ts",
      "examples/modelBoundary/provider-adapter-no-network-capabilities.valid.json",
      "examples/modelBoundary/provider-adapter-no-network-health.valid.json",
      "examples/modelBoundary/provider-adapter-no-network-result.valid.json",
      "examples/modelBoundary/provider-adapter-no-network-result.invalid.trust-promotion.json"
    ]) await expect(access(path)).resolves.toBeUndefined();
  });
  it("doc contains exact verdict block", async () => expect(await readFile(docPath, "utf8")).toContain(exactVerdict));
  it("doc locks non-implementation statements", async () => {
    const doc = await readFile(docPath, "utf8");
    for (const statement of [
      "No live adapter is implemented.",
      "No provider-specific behavior is implemented.",
      "No real Model API Layer is implemented.",
      "No provider SDK is imported.",
      "No API key or secret is required.",
      "No network call is performed.",
      "No provider dependency is added.",
      "No fake live-provider success is returned.",
      "No successful provider response is produced."
    ]) expect(doc).toContain(statement);
  });
  it("doc locks invocation and trust statements", async () => {
    const doc = await readFile(docPath, "utf8");
    for (const statement of [
      "invoke always refuses live execution.",
      "invoke returns ok false.",
      "Stub execution does not promote trust.",
      "Stub availability does not promote trust.",
      "Stub refusal is not model evidence.",
      "Provider output is not deterministic Hollow evidence.",
      "T2 requires verified deterministic Hollow evidence through VRP."
    ]) expect(doc).toContain(statement);
  });
  it("source does not import network APIs, provider SDKs, or write Ledger", async () => {
    const source = `${await readFile("src/modelBoundary/providerAdapterNoNetworkStub.ts", "utf8")}\n${await readFile("src/modelBoundary/types/providerAdapterNoNetworkStubTypes.ts", "utf8")}`;
    const importLines = source.split(/\r?\n/).filter((line) => /^\s*import\b/.test(line)).join("\n");
    expect(source).not.toMatch(/from\s+["'](?:node:http|http|node:https|https)["']|\bfetch\s*\(/);
    expect(importLines).not.toMatch(/openai|anthropic|gemini|grok/i);
    expect(importLines).not.toMatch(/langchain|langgraph|autogen|crewai/i);
    expect(source).not.toMatch(/writeLedger|appendLedger|ledgerWriter|createLedgerEntry|JsonlLedger/);
  });
  it("package.json was not modified to add provider SDK dependencies", async () => {
    const pkg = await readFile("package.json", "utf8");
    expect(pkg).not.toMatch(/openai|anthropic|gemini|grok|langchain|langgraph|autogen|crewai/i);
  });
  it("keeps V1 Hollow catalog count locked at 14", () => expect(V1_HOLLOW_MANIFESTS).toHaveLength(14));
  it("keeps Hollowcut catalog count locked at 9", () => expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9));
});

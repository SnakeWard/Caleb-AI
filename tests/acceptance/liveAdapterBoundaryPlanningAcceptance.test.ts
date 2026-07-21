import { readFile, access } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";
import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";

const docPath = "docs/LIVE_ADAPTER_BOUNDARY_PLANNING.md";
const exactVerdict = `Live Adapter Boundary Planning: Accepted
Status: Live provider boundary locked; no live adapter implemented
Next phase: Live adapter type contracts`;

async function readProjectSources(): Promise<string> {
  const paths = [
    "src/modelBoundary/index.ts",
    "src/modelBoundary/mockSinglePassModelAdapter.ts",
    "src/modelBoundary/mockSinglePassModelBoundary.ts",
    "src/modelBoundary/modelInvocationRecordBuilder.ts",
    "src/modelBoundary/modelInvocationRecordValidator.ts",
    "src/modelBoundary/singlePassModelBoundaryValidator.ts",
    "src/logicEngine/singlePassRouteMvp.ts",
    "src/finalAssembly/finalAssemblyBoundary.ts",
    "src/finalAssembly/finalOutputLedgerRecordBuilder.ts",
    "src/finalAssembly/finalOutputLedgerRecordWriter.ts"
  ];
  return (await Promise.all(paths.map((path) => readFile(path, "utf8")))).join("\n");
}

describe("Live Adapter Boundary Planning acceptance lock", () => {
  it("doc exists", async () => {
    await expect(access(docPath)).resolves.toBeUndefined();
  });

  it("doc contains exact verdict block", async () => {
    expect(await readFile(docPath, "utf8")).toContain(exactVerdict);
  });

  it("doc locks non-implementation statements", async () => {
    const doc = await readFile(docPath, "utf8");
    for (const statement of [
      "This pass does not implement a live adapter.",
      "This pass does not implement a real Model API Layer.",
      "This pass does not add provider SDKs.",
      "This pass does not require API keys.",
      "This pass does not perform network calls."
    ]) {
      expect(doc).toContain(statement);
    }
  });

  it("doc locks secret and test isolation statements", async () => {
    const doc = await readFile(docPath, "utf8");
    for (const statement of [
      "API keys must never be hardcoded.",
      "API keys must never be written to Ledger.",
      "Unit tests must not call live providers.",
      "Unit tests must not require API keys.",
      "Live adapter tests must be opt-in."
    ]) {
      expect(doc).toContain(statement);
    }
  });

  it("doc locks trust statements", async () => {
    const doc = await readFile(docPath, "utf8");
    for (const statement of [
      "Live model output starts at T0.",
      "Schema-valid live model output may reach T1 only.",
      "Live model output does not become T2 deterministic Hollow evidence.",
      "Provider identity does not promote trust.",
      "Successful provider response does not promote trust.",
      "Ledger presence does not promote trust.",
      "Storage does not increase trust.",
      "Raw prompt text should not be written to Ledger by default.",
      "Raw model output text should not be written to Ledger by default."
    ]) {
      expect(doc).toContain(statement);
    }
  });

  it("doc lists failure taxonomy entries", async () => {
    const doc = await readFile(docPath, "utf8");
    for (const failureKind of [
      "adapter_unavailable",
      "missing_api_key",
      "invalid_request",
      "provider_timeout",
      "provider_rate_limited",
      "provider_auth_failed",
      "provider_rejected_request",
      "provider_malformed_response",
      "response_validation_failed",
      "safety_profile_blocked",
      "network_failure",
      "unknown_provider_error"
    ]) {
      expect(doc).toContain(failureKind);
    }
  });

  it("doc lists first live adapter implementation sequence", async () => {
    const doc = await readFile(docPath, "utf8");
    for (const step of [
      "Live Adapter Boundary Planning",
      "Live Adapter Type Contracts",
      "Live Adapter Redaction Contract",
      "Live Adapter Mock-Compatible Interface",
      "Provider Adapter Stub With No Network",
      "One Provider Adapter Behind Explicit Opt-In",
      "Ledgered Live Invocation Record",
      "Live single_pass Adapter MVP",
      "Hollow-verified Final Answer Path",
      "Role Rotation Runtime Planning"
    ]) {
      expect(doc).toContain(step);
    }
  });

  it("source files do not import provider SDKs", async () => {
    const source = await readProjectSources();
    expect(source).not.toMatch(/openai/i);
    expect(source).not.toMatch(/anthropic/i);
    expect(source).not.toMatch(/gemini|grok/i);
    expect(source).not.toMatch(/langchain|langgraph|autogen|crewai/i);
  });

  it("package.json was not modified to add provider SDK dependencies", async () => {
    const pkg = await readFile("package.json", "utf8");
    expect(pkg).not.toMatch(/openai|anthropic|gemini|grok|langchain|langgraph|autogen|crewai/i);
  });

  it("keeps V1 Hollow catalog count locked at 14", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(14);
  });

  it("keeps Hollowcut catalog count locked at 9", () => {
    expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9);
  });
});

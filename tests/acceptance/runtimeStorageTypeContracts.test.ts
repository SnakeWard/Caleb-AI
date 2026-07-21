import { access, readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";
import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";

const docPath = "docs/RUNTIME_STORAGE_TYPE_CONTRACTS.md";
const exactVerdict = `Runtime Storage Type Contracts: Accepted
Status: Static runtime storage type layer complete; no runtime storage implemented
Next phase: In-memory artifact store prototype or mocked single_pass model boundary`;

const expectedPaths = [
  "docs/RUNTIME_STORAGE_TYPE_CONTRACTS.md",
  "src/storage/types/runtimeStorageTypes.ts",
  "src/storage/runtimeStorageContractValidator.ts",
  "examples/storage/runtime-storage-record.valid.json",
  "examples/storage/runtime-storage-record.invalid.trust-promotion.json"
] as const;

describe("Runtime Storage Type Contracts acceptance lock", () => {
  it("required files exist", async () => {
    for (const path of expectedPaths) {
      await expect(access(path)).resolves.toBeUndefined();
    }
  });

  it("contains the exact acceptance verdict", async () => {
    const doc = await readFile(docPath, "utf8");

    expect(doc).toContain(exactVerdict);
  });

  it("documents non-implementation boundaries", async () => {
    const doc = await readFile(docPath, "utf8");

    for (const statement of [
      "No runtime store is implemented.",
      "No persistence layer is implemented.",
      "No database is implemented.",
      "No model adapter is implemented.",
      "No role runtime is implemented."
    ]) {
      expect(doc).toContain(statement);
    }
  });

  it("lists all record kinds", async () => {
    const doc = await readFile(docPath, "utf8");

    for (const kind of [
      "task_frame_ref",
      "signal_frame_ref",
      "route_decision_ref",
      "work_graph_ref",
      "role_artifact",
      "role_handoff",
      "artifact_bundle",
      "evidence_packet",
      "execution_context",
      "telemetry_trace",
      "ledger_ref",
      "snapshot_ref",
      "final_output"
    ]) {
      expect(doc).toContain(kind);
    }
  });

  it("validator source does not import provider SDKs", async () => {
    const source = await readFile("src/storage/runtimeStorageContractValidator.ts", "utf8");

    expect(source).not.toMatch(/from\s+["'][^"']*(openai|anthropic|gemini|grok|provider|model-api|modelApi)[^"']*["']/i);
    expect(source).not.toMatch(/require\(["'][^"']*(openai|anthropic|gemini|grok|provider|model-api|modelApi)[^"']\)/i);
  });

  it("validator source does not write to fs", async () => {
    const source = await readFile("src/storage/runtimeStorageContractValidator.ts", "utf8");

    expect(source).not.toMatch(/node:fs|writeFile|appendFile|mkdir|rm\(/);
  });

  it("validator source does not write to ledger", async () => {
    const source = await readFile("src/storage/runtimeStorageContractValidator.ts", "utf8");

    expect(source).not.toMatch(/writeLedger|appendLedger|ledgerWriter|createLedgerEntry/);
  });

  it("keeps V1 Hollow catalog count locked at 14", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(14);
  });

  it("keeps Hollowcut catalog count locked at 9", () => {
    expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9);
  });
});

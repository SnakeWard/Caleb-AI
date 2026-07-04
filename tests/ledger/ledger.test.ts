import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { describe, expect, it } from "vitest";

import {
  JsonlLedger,
  LedgerEntryNotFoundError,
  LedgerParseError,
  LedgerValidationError
} from "../../src/ledger/index.js";
import type { LedgerEntry } from "../../src/types/index.js";

describe("JsonlLedger", () => {
  it("readAll returns [] for missing file", async () => {
    const ledger = await createTestLedger();

    await expect(ledger.readAll()).resolves.toEqual([]);
  });

  it("append writes one valid LedgerEntry", async () => {
    const ledger = await createTestLedger();
    const appended = await ledger.append(createLedgerEntry("ledger_001"));

    expect(appended.ledger_id).toBe("ledger_001");
    expect(await readFile(ledger.ledgerPath, "utf8")).toContain("\"ledger_id\":\"ledger_001\"");
  });

  it("readAll reads appended entry", async () => {
    const ledger = await createTestLedger();
    await ledger.append(createLedgerEntry("ledger_001"));

    expect((await ledger.readAll())[0]?.ledger_id).toBe("ledger_001");
  });

  it("appendMany writes entries in order", async () => {
    const ledger = await createTestLedger();
    await ledger.appendMany([
      createLedgerEntry("ledger_001"),
      createLedgerEntry("ledger_002", { run_id: "run_002" })
    ]);

    expect((await ledger.readAll()).map((entry) => entry.ledger_id)).toEqual([
      "ledger_001",
      "ledger_002"
    ]);
  });

  it("findByLedgerId returns matching entry", async () => {
    const ledger = await createTestLedger();
    await ledger.appendMany([createLedgerEntry("ledger_001"), createLedgerEntry("ledger_002")]);

    expect((await ledger.findByLedgerId("ledger_002"))?.ledger_id).toBe("ledger_002");
  });

  it("getByLedgerId throws LedgerEntryNotFoundError for missing entry", async () => {
    const ledger = await createTestLedger();

    await expect(ledger.getByLedgerId("missing")).rejects.toThrow(LedgerEntryNotFoundError);
  });

  it("listByRunId filters entries", async () => {
    const ledger = await createTestLedger();
    await ledger.appendMany([
      createLedgerEntry("ledger_001", { run_id: "run_a" }),
      createLedgerEntry("ledger_002", { run_id: "run_b" })
    ]);

    expect((await ledger.listByRunId("run_b")).map((entry) => entry.ledger_id)).toEqual([
      "ledger_002"
    ]);
  });

  it("listByTraceId filters entries", async () => {
    const ledger = await createTestLedger();
    await ledger.appendMany([
      createLedgerEntry("ledger_001", { trace_id: "trace_a" }),
      createLedgerEntry("ledger_002", { trace_id: "trace_b" })
    ]);

    expect((await ledger.listByTraceId("trace_a")).map((entry) => entry.ledger_id)).toEqual([
      "ledger_001"
    ]);
  });

  it("listByTaskId filters entries", async () => {
    const ledger = await createTestLedger();
    await ledger.appendMany([
      createLedgerEntry("ledger_001", { task_id: "task_a" }),
      createLedgerEntry("ledger_002", { task_id: "task_b" })
    ]);

    expect((await ledger.listByTaskId("task_b")).map((entry) => entry.ledger_id)).toEqual([
      "ledger_002"
    ]);
  });

  it("listByActorType filters entries", async () => {
    const ledger = await createTestLedger();
    await ledger.appendMany([
      createLedgerEntry("ledger_001", { actor_type: "hollow" }),
      createLedgerEntry("ledger_002", { actor_type: "verified_return_path" })
    ]);

    expect((await ledger.listByActorType("verified_return_path")).map((entry) => entry.ledger_id)).toEqual([
      "ledger_002"
    ]);
  });

  it("append rejects invalid entries before writing", async () => {
    const ledger = await createTestLedger();

    await expect(ledger.append({} as LedgerEntry)).rejects.toThrow(LedgerValidationError);
    await expect(ledger.readAll()).resolves.toEqual([]);
  });

  it("readAll throws LedgerParseError for malformed JSON line", async () => {
    const ledger = await createTestLedger();
    await writeFile(ledger.ledgerPath, "{not json}\n", "utf8");

    await expect(ledger.readAll()).rejects.toThrow(LedgerParseError);
  });

  it("clearForTestOnly clears only the test ledger file", async () => {
    const ledger = await createTestLedger();
    await ledger.append(createLedgerEntry("ledger_001"));

    await ledger.clearForTestOnly();

    await expect(ledger.readAll()).resolves.toEqual([]);
  });

  it("append does not mutate caller-owned entry", async () => {
    const ledger = await createTestLedger();
    const entry = createLedgerEntry("ledger_001");
    const before = JSON.stringify(entry);

    await ledger.append(entry);

    expect(JSON.stringify(entry)).toBe(before);
  });
});

async function createTestLedger(): Promise<JsonlLedger> {
  const dir = await mkdtemp(join(tmpdir(), "caleb-ledger-test-"));
  return new JsonlLedger(join(dir, "ledger.jsonl"));
}

function createLedgerEntry(ledger_id: string, overrides: Partial<LedgerEntry> = {}): LedgerEntry {
  return {
    ledger_id,
    schema_version: "1.0.0",
    timestamp: "2026-06-06T00:00:00.000Z",
    task_id: "task_001",
    run_id: "run_001",
    trace_id: "trace_001",
    actor_type: "hollow",
    actor_id: "hollow.text.character_count",
    actor_version: "0.1.0",
    activity: "hollow_invocation",
    invocation_id: "invocation_001",
    hollow_id: "hollow.text.character_count",
    status: "completed",
    result: { count: 5 },
    warnings: [],
    errors: [],
    artifact_hashes: [],
    provenance: { source: "test" },
    retryable: false,
    verification_status: "verified",
    trust_tier: "T2",
    parent_refs: [],
    artifact_refs: [],
    ...overrides
  };
}

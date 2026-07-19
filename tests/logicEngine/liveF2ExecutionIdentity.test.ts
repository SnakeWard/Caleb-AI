import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { validateLedgerEntry } from "../../src/ledger/ledgerValidation.js";
import {
  executeBridgedRotationAtSeam,
  reconstructRotationChainFromLedgerJsonl
} from "../../src/logicEngine/rotationExecutionSeam.js";
import { createInMemoryRawOutputStore } from "../../src/rawOutput/inMemoryRawOutputStore.js";
import type { ContentAddressedRawOutputStore } from "../../src/rawOutput/contentAddressedRawOutputStore.js";
import type { RoleRuntimeAdapter } from "../../src/roleRuntime/types/roleRuntimeAdapter.js";
import type { LedgerEntry } from "../../src/types/ledger.js";
import {
  createBridgedPlannerCriticFixture,
  createPlannerCriticExecutionAdapters,
  LE3_NOW
} from "./rotationExecutionTestHelpers.js";

const FIXTURE_PATH = "tests/fixtures/live-f2/repeated-plan-attempts.false-ok.jsonl";
const PLAN_ID = "rp_live_f2_shared_plan";
const EXECUTION_1 = "execution_11111111-1111-4111-8111-111111111111";
const EXECUTION_2 = "execution_22222222-2222-4222-8222-222222222222";

describe("LIVE-F2 execution-instance reconstruction", () => {
  it("reproduces the historical first-start/last-terminal false-ok and refuses plan-only ambiguity", async () => {
    const contents = await readFile(FIXTURE_PATH, "utf8");
    const entries = parseFixture(contents);

    const legacyStart = entries.find((entry) => entry.activity === "rotation_execution_started");
    const legacyTerminal = [...entries]
      .reverse()
      .find((entry) => entry.activity === "rotation_execution_failed");
    expect(resultString(legacyStart, "execution_id")).toBe(EXECUTION_1);
    expect(resultString(legacyTerminal, "execution_id")).toBe(EXECUTION_2);

    const reconstructed = reconstructRotationChainFromLedgerJsonl(contents, PLAN_ID);
    expect(reconstructed).toEqual({
      ok: false,
      chain: null,
      refusal_code: "reconstruction_ambiguous",
      errors: ["reconstruction_ambiguous"]
    });
  });

  it.each([
    [EXECUTION_1, "rotation_fixture_attempt_1_start", "rotation_fixture_attempt_1_terminal"],
    [EXECUTION_2, "rotation_fixture_attempt_2_start", "rotation_fixture_attempt_2_terminal"]
  ])("reconstructs only explicit identity %s", async (executionId, startId, terminalId) => {
    const contents = await readFile(FIXTURE_PATH, "utf8");
    const reconstructed = reconstructRotationChainFromLedgerJsonl(contents, PLAN_ID, executionId);
    expect(reconstructed.ok).toBe(true);
    if (!reconstructed.ok) {
      return;
    }
    expect(reconstructed.chain.execution_id).toBe(executionId);
    expect(reconstructed.chain.execution_start_ledger_id).toBe(startId);
    expect(reconstructed.chain.terminal_ledger_id).toBe(terminalId);
    expect(reconstructed.chain.final_status).toBe("failed");
  });

  it("fails closed instead of joining identified and legacy-unidentified records", async () => {
    const entries = parseFixture(await readFile(FIXTURE_PATH, "utf8"));
    const mixed = entries.map((entry, index) =>
      index < 2 ? entry : removeExecutionIdentity(entry)
    );
    const reconstructed = reconstructRotationChainFromLedgerJsonl(toJsonl(mixed), PLAN_ID);
    expect(reconstructed.ok).toBe(false);
    expect(reconstructed.refusal_code).toBe("reconstruction_ambiguous");
  });

  it("rejects a result/provenance identity disagreement inside one selected attempt", async () => {
    const entries = parseFixture(await readFile(FIXTURE_PATH, "utf8")).slice(0, 2);
    const terminal = entries[1] as LedgerEntry;
    entries[1] = {
      ...terminal,
      provenance: { ...terminal.provenance, execution_id: EXECUTION_2 }
    };
    const reconstructed = reconstructRotationChainFromLedgerJsonl(
      toJsonl(entries),
      PLAN_ID,
      EXECUTION_1
    );
    expect(reconstructed.ok).toBe(false);
    expect(reconstructed.errors).toEqual(["rotation_chain_terminal_invalid"]);
  });

  it("preserves compatibility for one complete legacy pre-LIVE-F2 chain", async () => {
    const entries = parseFixture(await readFile(FIXTURE_PATH, "utf8"))
      .slice(0, 2)
      .map(removeExecutionIdentity);
    const reconstructed = reconstructRotationChainFromLedgerJsonl(toJsonl(entries), PLAN_ID);
    expect(reconstructed.ok).toBe(true);
    if (reconstructed.ok) {
      expect(reconstructed.chain.execution_id).toBeNull();
      expect(reconstructed.chain.execution_start_ledger_id).toBe(
        "rotation_fixture_attempt_1_start"
      );
    }
  });

  it("mints distinct IDs for repeated attempts and carries each ID through every Ledger entry", async () => {
    const first = await runAttempt();
    const second = await runAttempt();
    expect(first.result.execution_id).toMatch(/^execution_[0-9a-f-]{36}$/);
    expect(second.result.execution_id).toMatch(/^execution_[0-9a-f-]{36}$/);
    expect(first.result.execution_id).not.toBe(second.result.execution_id);
    expectAttemptIdentity(first.result.execution_id, first.entries);
    expectAttemptIdentity(second.result.execution_id, second.entries);
  });

  it("carries identity through a pre-execution refusal and a runtime failure", async () => {
    const refused = await runAttempt({
      human_confirmed: false,
      execution_id: "execution_33333333-3333-4333-8333-333333333333"
    });
    expect(refused.result.status).toBe("refused");
    expectAttemptIdentity(refused.result.execution_id, refused.entries);

    const failed = await runAttempt({
      adapters: createPlannerCriticExecutionAdapters({ critic_should_fail: true }),
      execution_id: "execution_44444444-4444-4444-8444-444444444444"
    });
    expect(failed.result.status).toBe("failed");
    expectAttemptIdentity(failed.result.execution_id, failed.entries);
  });
});

async function runAttempt(options: {
  readonly human_confirmed?: boolean;
  readonly adapters?: ReadonlyMap<string, RoleRuntimeAdapter>;
  readonly execution_id?: string;
} = {}) {
  const fixture = await createBridgedPlannerCriticFixture();
  const entries: LedgerEntry[] = [];
  const result = await executeBridgedRotationAtSeam({
    plan: fixture.plan,
    human_confirmed: options.human_confirmed ?? true,
    bridge_ledger_entries: [fixture.bridge_entry],
    adapters: options.adapters ?? createPlannerCriticExecutionAdapters(),
    store: createInMemoryRawOutputStore() as unknown as ContentAddressedRawOutputStore,
    append_ledger_entry: (entry) => {
      entries.push(entry);
      return true;
    },
    now: () => LE3_NOW,
    ...(options.execution_id === undefined
      ? {}
      : { execution_id_factory: () => options.execution_id as string })
  });
  return { result, entries };
}

function expectAttemptIdentity(executionId: string, entries: readonly LedgerEntry[]): void {
  expect(entries.length).toBeGreaterThan(0);
  for (const entry of entries) {
    expect(resultString(entry, "execution_id")).toBe(executionId);
    expect(entry.provenance["execution_id"]).toBe(executionId);
  }
}

function parseFixture(contents: string): LedgerEntry[] {
  return contents
    .trim()
    .split(/\r?\n/)
    .map((line) => JSON.parse(line) as unknown)
    .map((entry) => {
      const validation = validateLedgerEntry(entry);
      expect(validation.valid).toBe(true);
      if (validation.entry === undefined) {
        throw new Error("LIVE-F2 fixture entry is invalid.");
      }
      return validation.entry;
    });
}

function removeExecutionIdentity(entry: LedgerEntry): LedgerEntry {
  const result = { ...(entry.result as Record<string, unknown>) };
  const provenance = { ...entry.provenance };
  delete result["execution_id"];
  delete provenance["execution_id"];
  return { ...entry, result, provenance } as LedgerEntry;
}

function resultString(entry: LedgerEntry | undefined, key: string): string | null {
  if (entry === undefined || typeof entry.result !== "object" || entry.result === null) {
    return null;
  }
  const value = (entry.result as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

function toJsonl(entries: readonly LedgerEntry[]): string {
  return entries.map((entry) => JSON.stringify(entry)).join("\n");
}

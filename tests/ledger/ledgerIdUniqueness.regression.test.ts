import { describe, expect, it } from "vitest";

import {
  characterCountImplementation,
  characterCountManifest,
  HollowRegistry,
  HollowRunner
} from "../../src/hollows/index.js";
import {
  createLedgerEntryFromEvidence,
  createLedgerEntryFromInvocation
} from "../../src/ledger/index.js";
import { VerifiedReturnPath } from "../../src/verification/index.js";

const ID_FORMAT = {
  ledger: /^ledger_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  task: /^task_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  run: /^run_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  trace: /^trace_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  invocation:
    /^invocation_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
};

async function runInvocationChain() {
  const registry = new HollowRegistry([characterCountManifest]);
  const runner = new HollowRunner(registry, {
    [characterCountManifest.hollow_id]: characterCountImplementation
  });

  const record = await runner.run({
    hollow_id: characterCountManifest.hollow_id,
    input_payload: { text: "Caleb" }
  });

  const verification = new VerifiedReturnPath().verifyInvocation(record);
  expect(verification.evidence_packet).toBeDefined();

  const invocationEntry = createLedgerEntryFromInvocation(record);
  const evidenceEntry = createLedgerEntryFromEvidence(verification.evidence_packet!);

  return { record, verification, invocationEntry, evidenceEntry };
}

describe("ledger ID uniqueness regression (LG-1)", () => {
  it("two hollow invocations in one process produce distinct ledger and correlation ids", async () => {
    const first = await runInvocationChain();
    const second = await runInvocationChain();

    expect(first.invocationEntry.ledger_id).toMatch(ID_FORMAT.ledger);
    expect(second.invocationEntry.ledger_id).toMatch(ID_FORMAT.ledger);
    expect(first.evidenceEntry.ledger_id).toMatch(ID_FORMAT.ledger);
    expect(second.evidenceEntry.ledger_id).toMatch(ID_FORMAT.ledger);

    expect(first.invocationEntry.ledger_id).not.toBe(second.invocationEntry.ledger_id);
    expect(first.evidenceEntry.ledger_id).not.toBe(second.evidenceEntry.ledger_id);

    expect(first.record.task_id).toMatch(ID_FORMAT.task);
    expect(first.record.run_id).toMatch(ID_FORMAT.run);
    expect(first.record.trace_id).toMatch(ID_FORMAT.trace);
    expect(first.record.invocation_id).toMatch(ID_FORMAT.invocation);

    expect(first.record.task_id).not.toBe(second.record.task_id);
    expect(first.record.run_id).not.toBe(second.record.run_id);
    expect(first.record.trace_id).not.toBe(second.record.trace_id);
    expect(first.record.invocation_id).not.toBe(second.record.invocation_id);
  });

  it("preserves invocation-to-evidence correlation within each run", async () => {
    const { record, verification, invocationEntry, evidenceEntry } = await runInvocationChain();
    const packet = verification.evidence_packet!;

    expect(packet.task_id).toBe(record.task_id);
    expect(packet.run_id).toBe(record.run_id);
    expect(packet.trace_id).toBe(record.trace_id);
    expect(packet.invocation_id).toBe(record.invocation_id);

    expect(invocationEntry.task_id).toBe(record.task_id);
    expect(invocationEntry.run_id).toBe(record.run_id);
    expect(invocationEntry.trace_id).toBe(record.trace_id);
    expect(invocationEntry.invocation_id).toBe(record.invocation_id);

    expect(evidenceEntry.task_id).toBe(record.task_id);
    expect(evidenceEntry.run_id).toBe(record.run_id);
    expect(evidenceEntry.trace_id).toBe(record.trace_id);
    expect(evidenceEntry.invocation_id).toBe(record.invocation_id);

    expect(packet.provenance.source_invocation_id).toBe(record.invocation_id);
  });
});
import { describe, expect, it, vi } from "vitest";

import { createLedgerEntryFromEvidence, createLedgerId } from "../../src/ledger/index.js";
import type { EvidencePacket } from "../../src/types/index.js";

const UUID_SUFFIX = /_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function createEvidence(): EvidencePacket {
  return {
    invocation_id: "invocation_001",
    task_id: "task_001",
    run_id: "run_001",
    trace_id: "trace_001",
    hollow_id: "hollow.text.character_count",
    hollow_version: "1.0.0",
    result: { count: 5 },
    result_units: "characters",
    checks: [],
    warnings: [],
    errors: [],
    artifact_hashes: [],
    provenance: { verified_return_path: true },
    ledger_refs: [],
    confidence_level: "verified_local_execution",
    verification_status: "verified",
    trust_tier: "T2",
    can_model_consume: true,
    can_persist_as_truth: true,
    can_trigger_side_effect: false
  };
}

describe("ledger entry id integrity (H4)", () => {
  it("generates UUID-format ids with the default prefix preserved", () => {
    const id = createLedgerId();

    expect(id.startsWith("ledger_")).toBe(true);
    expect(id).toMatch(UUID_SUFFIX);
  });

  it("preserves custom prefixes (route entries keep their prefix)", () => {
    const id = createLedgerId("route");

    expect(id.startsWith("route_")).toBe(true);
    expect(id).toMatch(UUID_SUFFIX);
  });

  it("generates unique ids across many calls in one process", () => {
    const ids = Array.from({ length: 500 }, () => createLedgerId());

    expect(new Set(ids).size).toBe(500);
  });

  it("generates unique ids across simulated separate runs (fresh module state)", async () => {
    const firstRun = Array.from({ length: 50 }, () => createLedgerId());

    vi.resetModules();
    const freshModule = await import("../../src/ledger/ledgerEntryFactory.js");
    const secondRun = Array.from({ length: 50 }, () => freshModule.createLedgerId());

    const combined = new Set([...firstRun, ...secondRun]);
    expect(combined.size).toBe(100);
  });

  it("uses an injected generator on createLedgerId", () => {
    const id = createLedgerId("ledger", (prefix) => `${prefix}_fixed_for_test`);

    expect(id).toBe("ledger_fixed_for_test");
  });

  it("uses an injected id_generator through LedgerEntryFactoryOptions", () => {
    const entry = createLedgerEntryFromEvidence(createEvidence(), {
      id_generator: (prefix) => `${prefix}_deterministic_001`
    });

    expect(entry.ledger_id).toBe("ledger_deterministic_001");
  });

  it("explicit ledger_id still wins over the injected generator", () => {
    const entry = createLedgerEntryFromEvidence(createEvidence(), {
      ledger_id: "ledger_explicit",
      id_generator: (prefix) => `${prefix}_should_not_be_used`
    });

    expect(entry.ledger_id).toBe("ledger_explicit");
  });

  it("factory entries carry UUID-format ids by default", () => {
    const first = createLedgerEntryFromEvidence(createEvidence());
    const second = createLedgerEntryFromEvidence(createEvidence());

    expect(first.ledger_id).toMatch(UUID_SUFFIX);
    expect(second.ledger_id).toMatch(UUID_SUFFIX);
    expect(first.ledger_id).not.toBe(second.ledger_id);
  });
});

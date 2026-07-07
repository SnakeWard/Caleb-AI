import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import { createLedgerId } from "../../src/ledger/index.js";
import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";
import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";

// H4 historical-region freeze constants, captured 2026-07-04 after the
// h4_ledger_id_integrity_prechange snapshot wrote its ledger entry. The live
// ledger is append-only: lines 1..K are frozen forever; later suite runs and
// passes may only append after K.
const FROZEN_LINE_COUNT = 296;
const FROZEN_REGION_SHA256 = "b689af123d307b46828db11011a02ff40584d1b391c314ffaceb1c4384893a4a";
// Known pre-H4 counter-era state, documented (never mutated): 296 entries,
// 256 unique ids, 2 duplicated id values.
const KNOWN_PRE_H4_UNIQUE_IDS = 256;
const KNOWN_PRE_H4_DUPLICATED_ID_VALUES = 2;

// Post-H4 format: any prefix followed by a UUID. Counter-era ids
// (e.g. ledger_000001) do not match and are exempt from the gate.
const POST_H4_ID_FORMAT = /^.+_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

interface GateResult {
  readonly ok: boolean;
  readonly post_h4_entry_count: number;
  readonly duplicated_ids: readonly string[];
}

// The post-H4 uniqueness gate: forward-only by construction — it inspects only
// ids in the new format and asserts nothing about historical counter-era ids.
function runPostH4UniquenessGate(ledgerIds: readonly string[]): GateResult {
  const postH4Ids = ledgerIds.filter((id) => POST_H4_ID_FORMAT.test(id));
  const seen = new Set<string>();
  const duplicated = new Set<string>();
  for (const id of postH4Ids) {
    if (seen.has(id)) {
      duplicated.add(id);
    }
    seen.add(id);
  }
  return {
    ok: duplicated.size === 0,
    post_h4_entry_count: postH4Ids.length,
    duplicated_ids: [...duplicated]
  };
}

async function readLiveLedgerLines(): Promise<string[]> {
  const raw = await readFile(".caleb/ledger/ledger.jsonl", "utf8");
  return raw.split(/\r?\n/).filter((line) => line.trim().length > 0);
}

describe("ledger entry id integrity acceptance (H4)", () => {
  it("new ids carry the post-H4 UUID format with preserved prefixes", () => {
    expect(POST_H4_ID_FORMAT.test(createLedgerId())).toBe(true);
    expect(POST_H4_ID_FORMAT.test(createLedgerId("route"))).toBe(true);
    expect(POST_H4_ID_FORMAT.test("ledger_000001")).toBe(false);
  });

  it("uniqueness gate passes on a clean synthetic post-H4 ledger", () => {
    const clean = [
      "ledger_000001", // historical counter-era id: exempt
      "ledger_000001", // historical duplicate: exempt (forward-only rule)
      createLedgerId(),
      createLedgerId(),
      createLedgerId("route")
    ];

    const gate = runPostH4UniquenessGate(clean);

    expect(gate.ok).toBe(true);
    expect(gate.post_h4_entry_count).toBe(3);
  });

  it("DETECTOR: uniqueness gate fails on the M2 duplicate pattern in post-H4 format", () => {
    const duplicatedId = createLedgerId();
    const poisoned = [createLedgerId(), duplicatedId, createLedgerId("route"), duplicatedId];

    const gate = runPostH4UniquenessGate(poisoned);

    expect(gate.ok).toBe(false);
    expect(gate.duplicated_ids).toEqual([duplicatedId]);
  });

  it("live ledger passes the post-H4 uniqueness gate", async () => {
    const lines = await readLiveLedgerLines();
    const ids = lines.map((line) => (JSON.parse(line) as { ledger_id: string }).ledger_id);

    const gate = runPostH4UniquenessGate(ids);

    expect(gate.ok).toBe(true);
  });

  it("historical ledger region is untouched: frozen prefix hash matches", async () => {
    const lines = await readLiveLedgerLines();

    expect(lines.length).toBeGreaterThanOrEqual(FROZEN_LINE_COUNT);
    const region = lines.slice(0, FROZEN_LINE_COUNT).join("\n") + "\n";
    const hash = createHash("sha256").update(region, "utf8").digest("hex");
    expect(hash).toBe(FROZEN_REGION_SHA256);
  });

  it("documents (never mutates) the known pre-H4 duplicate state", async () => {
    const lines = await readLiveLedgerLines();
    const frozenIds = lines
      .slice(0, FROZEN_LINE_COUNT)
      .map((line) => (JSON.parse(line) as { ledger_id: string }).ledger_id);

    const unique = new Set(frozenIds);
    const duplicatedValues = new Set(
      frozenIds.filter((id, index) => frozenIds.indexOf(id) !== index)
    );

    expect(unique.size).toBe(KNOWN_PRE_H4_UNIQUE_IDS);
    expect(duplicatedValues.size).toBe(KNOWN_PRE_H4_DUPLICATED_ID_VALUES);
  });

  it("keeps catalog invariants: V1 = 13, Hollowcut = 9", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(13);
    expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9);
  });
});

# Ledger Entry ID Integrity (Pass H4)

Status: Accepted — cross-run referential integrity restored forward-only
Date: 2026-07-04
Pre-change snapshot: `snap_20260704T233909537Z_000304_milestone` (verified on disk)
Protected-file exception: `src/ledger/ledgerEntryFactory.ts` only, scoped to ID generation
Authorization: H4 protocol (external reviewer), owner-approved diagnostic

## 1. The M2 Discovery

Ledger entry IDs were generated from a module-level counter
(`ledgerIdCounter`, `padStart(6)`), which restarts in every process. Unit tests
never surfaced this because each test process starts fresh; **live use did**:
after M2's first live call, the git-tracked ledger held **296 entries with only
256 unique IDs (2 duplicated ID values)** — `ledger_000001` and
`ledger_000002` had been minted independently by multiple CLI processes over
the project's history. Within a single run, `parent_refs` chains remained
unambiguous; across runs, references to counter-era IDs are ambiguous.

This is the second instance of the defect class fixed in Pass H3 (the runner's
`createLocalId` counter).

## 2. Third-Instance Audit (mandated by the H4 protocol; answered affirmatively)

A codebase-wide audit for counter-based or module-state ID generation found:

- **One additional instance: `src/reports/reportBuilder.ts:23-27`** —
  `reportCounter` module counter with `padStart(6)`. Partially mitigated by an
  embedded `Date.now().toString(36)` component (cross-process collision
  requires same-millisecond generation), but it is the same class. **Outside
  the granted exception scope → reported, not fixed.** `reportBuilder.ts` is
  not a protected file; the fix needs only an ordinary future pass
  (recommended: fold into Q1 hardening or a micro-pass).
- **Examined and cleared:** `src/logicEngine/workGraphBuilder.ts:20`
  (positional node IDs, deterministic by design, scoped to one graph — not a
  cross-run identity) and `src/changeGuard/snapshotManifest.ts:10` (sequence
  derived from existing snapshot directories on disk plus a timestamp —
  persistent state, not module state).

## 3. The New ID Scheme

`createLedgerId(prefix = "ledger", generator?)` now returns
`` `${prefix}_${crypto.randomUUID()}` `` — the H3 pattern exactly. Prefixes are
preserved (`ledger_`, `route_`). Determinism for tests is injectable in both
positions: an optional generator parameter on `createLedgerId`, and an
`id_generator?: (prefix: string) => string` field on
`LedgerEntryFactoryOptions` (resolution order: explicit `ledger_id` >
`id_generator` > default UUID). Zero new dependencies.

## 4. Forward-Only Rule and Historical Disambiguation

The ledger is append-only and git-tracked. **No historical entry was modified,
reordered, or repaired.** The acceptance gate asserts global uniqueness only
over post-H4 entries, identified by the format
`^.+_<uuid>` — counter-era IDs (`ledger_000001`) do not match and are exempt.

The frozen historical region is lines 1–296 of `.caleb/ledger/ledger.jsonl`
(SHA-256 `b689af123d307b46828db11011a02ff40584d1b391c314ffaceb1c4384893a4a`),
asserted byte-identical by the acceptance suite on every run.

Disambiguation note for the ~40 duplicated historical IDs: within a single
run, duplicates are resolvable by file position and timestamp adjacency;
**cross-run references to pre-H4 counter-era IDs are ambiguous and must not be
relied upon.** M3's lineage contract (M3-C) builds only on post-H4 IDs.

## 5. Detector-Test Evidence (R37 discipline)

The post-H4 uniqueness gate is proven against both polarities in
`tests/acceptance/ledgerEntryIdIntegrityAcceptance.test.ts`:

- Clean synthetic fixture (historical duplicates present but exempt; unique
  new-format IDs) → gate passes.
- Poisoned fixture reproducing the M2 pattern in new-format IDs (one UUID
  minted twice) → gate fails and names the duplicated ID.

Additional unit evidence (`tests/ledger/ledgerEntryIdIntegrity.test.ts`):
uniqueness across 500 in-process calls, and across simulated separate runs via
module-state reset (`vi.resetModules` + fresh import) — the exact failure mode
the counter had.

## 6. Boundaries

No changes to entry schema, write path, append-only semantics, or
`src/ledger/ledger.ts`. No network, no provider behavior. V1 Hollow catalog
remains 12; Hollowcut catalog remains 9.

## 7. Acceptance Verdict

Ledger Entry ID Integrity: Accepted — cross-run referential integrity restored
forward-only; historical duplicates documented, not mutated.
Next phase: H5 — Network Egress Proof

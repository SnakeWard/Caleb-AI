# Report ID Integrity (Pass H6)

Status: Accepted — per-process counter defect class extinct
Date: 2026-07-05
Pre-change snapshot: `snap_20260705T150745922Z_000321_milestone` (verified on disk)
Authorization: `docs/protocols/PASS_PROTOCOL_H5_H6.md` (committed before the work)
`reportBuilder.ts` is not a protected file; no exception required. Scope: ID generation only.

## 1. The Fix

`createReportId(prefix = "report", generator?)` now returns
`` `${prefix}_${crypto.randomUUID()}` `` — the same pattern as H3 (runner) and
H4 (ledger). The module-level `reportCounter` is deleted. Zero new dependencies.

**Resolution order (stated in a code comment, asserted by one test):**
explicit `report_id` on `ReportInput` > injected `id_generator` > default UUID.

## 2. Timestamp-Component Decision

The former ID embedded `Date.now().toString(36)`. It was **dropped** in favor
of pure UUID:

- Every report carries `generated_at`, and every ledger entry referencing a
  report carries its own timestamp — the embedded time added no integrity.
- The sortability argument fails on inspection: the base-36 prefix sorts IDs
  by process start moment, then counter — an ordering no test or consumer
  uses (the report writer uses IDs only as filename bases).
- Uniformity: all three resolved instances now share the identical
  `prefix_<uuid>` shape, so the post-H4 UUID-format gate generalizes to any
  future cross-artifact integrity work (M3-C lineage).

Filename-safety verified: `assertSafeFilenameBase` denylists only traversal
characters (`..`, `/`, `\`, `:`); UUID hyphens pass unchanged.

## 3. Test-Impact Survey (affirmative)

Exactly one pre-existing test touched generator format —
`reportBuilder.test.ts` asserts `/^report_/u`, prefix-only, UUID-compatible.
All other `report_id` values in the suite are explicit fixture strings.
Forced breakage: zero (confirmed by the suite at pass close).

## 4. Detector Evidence

`tests/reports/reportIdIntegrity.test.ts` reproduces the counter-collision
pattern synthetically (two counter-era "runs" mint the same ID — the defect
demonstrated), then proves the post-H6 scheme yields distinct IDs on the same
shape, including across simulated separate runs via module-state reset.

## 5. Defect-Class Closure Statement

The per-process counter ID defect class now has **zero known instances**:

| Instance | Identified by | Resolved in |
| --- | --- | --- |
| `src/hollows/runner.ts` (`createLocalId`) | incident (review) | **H3** |
| `src/ledger/ledgerEntryFactory.ts` (`createLedgerId`) | incident (M2 live ledger: 296 entries / 256 unique) | **H4** |
| `src/reports/reportBuilder.ts` (`createReportId`) | audit (H4 third-instance mandate) | **H6** |

The two look-alikes cleared in H4's audit remain cleared with unchanged
reasoning: `workGraphBuilder` node IDs are positional and graph-scoped by
design; `snapshotManifest` sequences are disk-derived persistent state plus a
timestamp, not module state.

## 6. Boundaries

Report schema, content, renderers, writer, and consumers untouched (one
additive optional field on `ReportInput`). No network. Suite runs under the
permanent H5 traps. V1 catalog remains 12; Hollowcut catalog remains 9.

## 7. Acceptance Verdict

Report ID Integrity: Accepted — per-process counter defect class extinct; all
three instances resolved (H3, H4, H6).
Next phase: M3-C — Raw Output Boundary Contract (design only), under its
existing protocol, unamended.

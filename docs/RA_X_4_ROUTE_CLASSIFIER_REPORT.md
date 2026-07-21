# RA-X-4 — Route-Classifier Hollow + Dynamic Selection + Request-Only Seam

**Pass ID:** RA-X-4  
**Seat:** Implementer (Grok 4.3, Grok Build TUI) — **`F:\Caleb AI`**  
**Authorized by:** Pat (T4) — relay constitutes authorization  
**Reviewer/planner:** Claude Fable 5  
**Date:** 2026-07-21  
**Base HEAD (pre-pass):** `a32836f` (RA-X-3)

A recap is not a report.

## Summary

RA-X-4 delivers all five authorized deliverables on mocks:

1. Version-locked immutable eight-row routing table (`rax4.1.0`) as pure data.
2. Build-time matrix-walkability (T3) and acyclicity (T6) proofs over that table.
3. Route-classifier Hollow `hollow.routing.route_classifier` — pure lookup, fail-closed, reads RA-X-3 single-source capability set.
4. LE-2 additive dynamic selection: gated decision-facing record → classifier; fixed TaskFrame+SignalFrame path unchanged.
5. Request-only `hollow_evidence_request` seam: Analyst emits request; orchestrator runs Hollow; VRP gates before Analyst sees anything.

## Suite / catalogs / digests

| Check | Result |
| --- | --- |
| Before (RA-X-3 close) | **210 files / 3,266 tests**, exit 0 |
| After | **211 files / 3,278 tests**, exit **0** |
| tsc / build | exit **0** / exit **0** |
| Catalogs **before** | **V1 = 13**, **Hollowcut = 9** |
| Catalogs **after** | **V1 = 14**, **Hollowcut = 9** |
| Planner digest | `sha256:f32675859e07243a7cf0cd8e743537f4c975826ea7bf684348ed128792489003` **unchanged** |
| Critic digest | `sha256:8074e98c3317f24cfe4f5bd1b94e9328ffe75e1f390a81f776badb759d3b8e8f` **unchanged** |

Prompt files hashed at close: `examples/live-rotation/prompts/planner.prompt.txt`, `examples/live-rotation/prompts/critic.prompt.txt`.

## D8 — Classifier catalog placement

**Decision: register in V1 catalog.**  
`hollow.routing.route_classifier` is the 14th V1 Hollow. Catalog change **13 → 14** is authorized and reported. Hollowcut remains **9**.

## Eight-row table (committed) — version `rax4.1.0`

| # | stakes | ambiguity | evidence_need | → route |
|---|---|---|---|---|
| 1 | low | bounded | none | `[planner, critic]` |
| 2 | low | bounded | required | `[planner, analyst, critic]` |
| 3 | low | ambiguous | none | `[planner, critic, synthesizer]` |
| 4 | low | ambiguous | required | `[planner, analyst, critic, synthesizer]` |
| 5 | high | bounded | none | `[planner, critic, synthesizer]` |
| 6 | high | bounded | required | `[planner, analyst, critic, synthesizer]` |
| 7 | high | ambiguous | none | `[planner, analyst, critic, synthesizer]` |
| 8 | high | ambiguous | required | `[planner, analyst, critic, synthesizer]` |

Source of truth: `src/logicEngine/routeClassificationTable.ts` — `Object.freeze` on table and each row. Off-table feature values refuse fail-closed (no fallthrough).

## Build-time legality proofs

| Detector | Result |
| --- | --- |
| **T3 matrix-walkability** | **Pass** — `proveRoutingTableLegal()` all eight routes walk the 39-transition consumption matrix; synthetic `planner→reporter` fails |
| **T6 acyclicity** | **Pass** — every route finite, single-cycle, non-repeating; synthetic `planner→critic→planner` rejected (`repeat_role`) |

## Detectors T1–T10

| Detector | Result |
| --- | --- |
| T1 table correctness | Pass — eight combos + off-table refuse |
| T2 pure lookup | Pass — table data + `findIndex`; no route-computing `if (features.stakes…)` |
| **T3 matrix-walkability** | **Pass** (build-time) |
| T4 determinism/replay | Pass — identical features → identical route + `rax4.1.0` |
| T5 version-lock + immutability | Pass — version on decision; frozen table rejects mutation |
| **T6 acyclicity** | **Pass** (build-time) |
| **T7 request-only seam** | **Pass** — gate is between Hollow result and Analyst (see below) |
| T8 non-promoter | Pass — longer route does not embed trust tiers |
| **T9 single-source capability** | **Pass** — classifier imports `getRoleCapabilityCatalog()` from `roleCapabilitySet.ts`; no duplicate list |
| T10 LE-2 additive | Pass — fixed path still requires SignalFrame; decision-record uses classifier |

### T7 — request-only seam (defining)

- Analyst emits `hollow_evidence_request` only (`hollow_id` + `evidence_sought`; no result field).
- `fulfillAnalystHollowEvidenceRequest` is **orchestrator-owned**: runs Hollow via runner, then **VRP** (`VerifiedReturnPath.verifyInvocation`).
- On VRP accept above T0, returns `GatedHollowEvidence` with `executed_by: "orchestrator"`, `analyst_held_ungated: false`.
- On VRP reject or T0: Analyst receives **nothing** (`vrp_rejected_or_ungated`).
- Request carrying `result`/`output`/`raw_output` is refused.
- **Gate location:** between Hollow invocation result and Analyst-visible evidence.

### T9 — single-source (RA-X-3 → RA-X-4 seam held)

Classifier Hollow and classification entry both call `getRoleCapabilityCatalog()` from `src/roles/roleCapabilitySet.ts` (RA-X-3 module). Capability module not duplicated or modified this pass.

## D6 — LE-2 fixed vs dynamic selection

`selectRouteFromRouteInputs` (`src/logicEngine/routeInputGate.ts`):

1. **Dynamic (classifier) path — first:** if any accepted input is `lineage_resolved_decision_facing_record` (already verifier-gated at L1), call `classifyDecisionFacingRecord` → pure table lookup → `RouteDecision` with `selection_path: "classifier"`, `role_sequence`, `table_version`, `classification_features`.
2. **Fixed path — unchanged fallback:** require `contract_validated_task_frame` + `verified_signal_frame`, call existing `selectRoute(task, signal)` → `selection_path: "fixed_signal"`.

Dynamic is **additive**. Fixed paths are not removed or weakened.

## Untouched surfaces (declarations)

| Surface | Declaration |
| --- | --- |
| Consumption matrix | **39 transitions — not touched** |
| L1 allowlist | **eight entries — not touched** |
| Five-check verifier | **not touched** |
| `roleCapabilitySet.ts` | **read only, not modified** |
| Planner/Critic prompts | digests verified unchanged |
| LE-3 execution seam | not touched |
| Live fixtures | not touched |
| Ledger history rewrite | not done (append-only ledger file only if present) |

## AUD-2

**compliant / T2**, **81 paths** (7 create / 74 modify), **0 violations**  
(base-ref RA-X-3 `a32836f`). Manifest: `examples/audit/ra-x-4-pass-manifest.valid.json`.

## Flake rate on F:

**0 timeout flakes** on the green full suite run (211 files / 3,278 tests, ~76s).

## Files created

- `docs/protocols/PASS_PROTOCOL_RA_X_4.md`
- `docs/RA_X_4_ROUTE_CLASSIFIER_REPORT.md`
- `examples/audit/ra-x-4-pass-manifest.valid.json`
- `src/logicEngine/routeClassificationTable.ts`
- `src/logicEngine/analystHollowEvidenceRequestSeam.ts`
- `src/hollows/categories/routing/routeClassifierHollow.ts`
- `tests/acceptance/raX4RouteClassifierAcceptance.test.ts`

## Files changed

- `src/hollows/v1HollowCatalog.ts` — register classifier (13→14)
- `src/logicEngine/routeInputGate.ts` — additive classifier path
- `src/logicEngine/types/routeDecision.ts` — selection_path / role_sequence / table_version
- `src/logicEngine/index.ts` — export table + seam
- Catalog lock tests across acceptance/cli/hollows/logicEngine/roles updated **13→14** (authorized D8)
- `docs/STATUS_LOG.md`
- `.caleb/ledger/ledger.jsonl` (append-only if present)

## Files intentionally not changed

- `src/roles/roleHandoffGate.ts` (matrix 39)
- `src/roles/roleCapabilitySet.ts` (single-source read)
- L1 allowlist shape / five-check verifier
- LE-3, live fixtures, prompts
- package.json / package-lock.json

## Honest deviations

**Honest deviations: none.**

## Roadmap

**RA-X-5** — full mock rehearsals across all eight routes end-to-end (classifier → route → execution → reconstruction from ledger).  
No live event authorized in RA-X-1 through RA-X-5.

## Verdict

**RA-X-4 accepted offline:** deterministic version-locked classifier; matrix-walkable and acyclic table; LE-2 dynamic path additive; request-only Hollow evidence seam with gate between Hollow and Analyst; V1 catalog **14**.

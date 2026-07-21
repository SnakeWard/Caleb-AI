# RA-X-2 — Analyst Consumption-Matrix Transitions

**Pass ID:** RA-X-2  
**Seat:** Grok 4.3, Grok Build TUI — **`F:\Caleb AI`**  
**Authorized by:** Pat (T4)  
**Reviewer/planner:** Claude Fable 5  
**Date:** 2026-07-21  

A recap is not a report.

## Summary

RA-X-2 grows the consumption matrix **33 → 39** with exactly six Analyst
transitions, each fail-closed under F7 check-11 discipline. Registry
`allowed_next_roles` updated so LE-2 bridge legality honors those adjacencies
without adding dynamic route selection. **`hollow_evidence_request` is not a
matrix row** (defining exclusion).

## Suite / catalogs / digests

| Check | Result |
| --- | --- |
| Before | **208 files / 3,248 tests**, exit 0 |
| After | **209 files / 3,256 tests**, exit **0** |
| tsc / build | exit **0** / exit **0** |
| Catalogs | **V1 = 13**, **Hollowcut = 9** |
| Planner digest | `sha256:f32675859e07243a7cf0cd8e743537f4c975826ea7bf684348ed128792489003` **unchanged** |
| Critic digest | `sha256:8074e98c3317f24cfe4f5bd1b94e9328ffe75e1f390a81f776badb759d3b8e8f` **unchanged** |
| L1 | **seven entries**, not touched |

## Six transitions as committed (D1)

| Transition | Consumable statuses |
| --- | --- |
| `planner → analyst` | `{accepted, needs_revision}` |
| `analyst → critic` | `{accepted}` |
| `analyst → synthesizer` | `{accepted}` |
| `analyst → planner` | `{accepted, needs_revision}` |
| `analyst → human_operator` | `{accepted, needs_revision}` |
| `analyst → recovery` | `{accepted, needs_revision}` |

Matrix count: **33 → 39**. `blocked` / `rejected` appear in **no** Analyst transition.

## Defining exclusion (T4)

**`hollow_evidence_request` is not in the matrix.** No row contains `hollow` or
`orchestrator`. Analyst outbound matrix keys are exactly the five non-planner
targets above; entry is only `planner->analyst`.

## LE-2 / bridge legality (D6)

**Exact change:**

1. `roleContractRegistry`: planner `allowed_next_roles` gains `analyst`; Analyst
   `allowed_next_roles` = `critic | synthesizer | planner | human_operator | recovery`
   (and `can_handoff_to_human: true`).
2. Bridge continues to use **only** `getRoleContract(from).allowed_next_roles.includes(to)`
   in `findForbiddenTransition` — no route-selection / classifier logic added.

Legal mock: `planner_analyst_synthesizer` with max_cycles=1.  
Illegal mock: full_rotation role order inducing `critic→analyst`.

## Detectors T1–T7

| Detector | Result |
| --- | --- |
| T1 six transitions pass | Pass |
| T2 blocked/rejected F7 issue | Pass |
| T3 default-deny undeclared | Pass |
| T4 hollow_evidence_request absent | Pass |
| T5 39 count + pre-33 enums | Pass |
| T6 LE-2 legal/illegal | Pass |
| T7 no trust promotion | Pass |

## AUD-2

**compliant / T2**, 13 paths, **0 violations** (base-ref RA-X-1 `72c024a`).

## Flake rate on F:

**0 timeout flakes** on the green full suite run.

## Files created

- `docs/protocols/PASS_PROTOCOL_RA_X_2.md`
- `docs/RA_X_2_ANALYST_MATRIX_WIRING_REPORT.md`
- `tests/acceptance/raX2AnalystMatrixWiringAcceptance.test.ts`
- `examples/audit/ra-x-2-pass-manifest.valid.json`

## Files changed

- `src/roles/roleHandoffGate.ts` (six matrix rows)
- `src/roles/roleContractRegistry.ts` (planner + analyst allowed_next_roles)
- `tests/roles/roleHandoffGate.test.ts` (count 39)
- `tests/acceptance/liveF7HandoffGateEvidenceAcceptance.test.ts` (expected matrix)
- `tests/acceptance/raX1AnalystIsolationAcceptance.test.ts` (T3 supersession note)
- `tests/acceptance/le2RotationPlanBridgeAcceptance.test.ts`
- `tests/logicEngine/rotationPlanBridge.test.ts`
- `docs/STATUS_LOG.md`
- `.caleb/ledger/ledger.jsonl` (append-only if present)

## Files intentionally not changed

- L1 allowlist; prompts; LE-3; live fixtures; classifier; hollow request execution seam

## Honest deviations

**Honest deviations: none.**

## Roadmap

RA-X-3 L1 eighth type → RA-X-4 classifier + hollow request seam → RA-X-5 mock
rehearsals. No live event authorized.

## Verdict

**RA-X-2 accepted offline:** Analyst reachable via six proven transitions;
request-only Hollow path remains outside the matrix.

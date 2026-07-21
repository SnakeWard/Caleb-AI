# RA-X-3 — Eighth L1 Route-Input Type + Verifier

**Pass ID:** RA-X-3  
**Seat:** Grok 4.3, Grok Build TUI — **`F:\Caleb AI`**  
**Authorized by:** Pat (T4)  
**Reviewer/planner:** Claude Fable 5  
**Date:** 2026-07-21  

A recap is not a report.

## Summary

RA-X-3 returns `lineage_resolved_decision_facing_record` to the L1 allowlist
(**7 → 8**) **atomically with** a five-check verifier. The type is never
reachable as a route input unless the verifier passes. Nothing consumes the
record for routing yet (classifier is RA-X-4). Single-source role-capability
data lives in `src/roles/roleCapabilitySet.ts`.

## Suite / catalogs / digests

| Check | Result |
| --- | --- |
| Before | **209 files / 3,256 tests**, exit 0 |
| After | **210 files / 3,266 tests**, exit **0** |
| tsc / build | exit **0** / exit **0** |
| Catalogs | **V1 = 13**, **Hollowcut = 9** |
| Planner digest | `sha256:f32675859e07243a7cf0cd8e743537f4c975826ea7bf684348ed128792489003` **unchanged** |
| Critic digest | `sha256:8074e98c3317f24cfe4f5bd1b94e9328ffe75e1f390a81f776badb759d3b8e8f` **unchanged** |

## L1 allowlist — eight entries verbatim

1. `contract_validated_task_frame`  
2. `verified_signal_frame`  
3. `engine_internal_state`  
4. `deterministic_hollow_signal`  
5. `accepted_gate_policy_result`  
6. `human_pat_approval_record`  
7. `snapshot_change_guard_state`  
8. **`lineage_resolved_decision_facing_record`** — gated on five-check verifier  

## Five checks (D2)

| # | Check | Refusal codes (examples) |
| --- | --- | --- |
| 1 | Lineage completeness | `lineage_incomplete`, `lineage_orphan_ref`, `lineage_untrusted_root` |
| 2 | Decision-field well-formedness | `missing_required_field`, `cardinality_overflow`, `string_length_overflow`, `unexpected_field` |
| 3 | No trust-tier assertion | `tier_assertion_forbidden` |
| 4 | No route pre-commitment | `route_precommitment_forbidden` |
| 5 | Satisfiability vs registry capabilities | `capability_unsatisfiable` |

Bounds: summary **200**, capability/id **160**, constraints/open_questions **200**, arrays max **6/4/4**, lineage_refs max **8**.

## Single-source capability data (D3) — drift prevention

**Lives at:** `src/roles/roleCapabilitySet.ts` → `getRoleCapabilityCatalog()`.

**Derivation:** only from `listRoleContracts()` — each role contributes:

- its `role_class` (e.g. `reasoning`, `synthesis`)
- `artifact:<allowed_artifact_type>` for each allowed artifact type
- `hollow_request_only` when `execution_authority === "request_only"`

**Verifier read path:** `validateLineageResolvedDecisionFacingRecord` →  
`options.capability_catalog ?? getRoleCapabilityCatalog()`.

**Future classifier (RA-X-4):** must import the same module; T9 proves that
removing Analyst from a catalog snapshot makes `artifact:analysis` unsatisfiable.

## Detectors T1–T9

| Detector | Result |
| --- | --- |
| T1 lineage | Pass |
| T2 well-formedness | Pass |
| T3 no tier assertion | Pass |
| **T4 no route pre-commitment** | **Pass** (defining) |
| T5 satisfiability | Pass |
| T6 no consumer yet | Pass |
| T7 atomic addition | Pass |
| T8 masquerade | Pass |
| **T9 single-source** | **Pass** |

## Nothing consumes the eighth type yet (T6)

`selectRouteFromRouteInputs` still requires only TaskFrame + SignalFrame.
No classifier / dynamic route module exists.

## AUD-2

**compliant / T2**, 21 paths, **0 violations** (base-ref RA-X-2 `8c3efb1`).

## Flake rate on F:

**0 timeout flakes** on the green full suite run.

## Files created

- `docs/protocols/PASS_PROTOCOL_RA_X_3.md`
- `docs/RA_X_3_DECISION_FACING_L1_REPORT.md`
- `src/roles/roleCapabilitySet.ts`
- `src/logicEngine/types/lineageResolvedDecisionFacingRecord.ts`
- `src/logicEngine/lineageResolvedDecisionFacingVerifier.ts`
- `tests/acceptance/raX3DecisionFacingL1Acceptance.test.ts`
- `examples/audit/ra-x-3-pass-manifest.valid.json`

## Files changed

- `src/logicEngine/types/routeInput.ts`
- `src/logicEngine/routeInputGate.ts`
- `src/logicEngine/index.ts`
- `src/roles/index.ts`
- L1/LE lock tests updated to eight-entry allowlist
- `docs/STATUS_LOG.md`
- `.caleb/ledger/ledger.jsonl` (append-only if present)

## Files intentionally not changed

- Consumption matrix (39)
- Prompts / live fixtures
- LE-2/LE-3 route-selection/execution
- Catalogs

## Honest deviations

**Honest deviations: none.**

## Roadmap

RA-X-4 classifier + hollow request seam; RA-X-5 mock rehearsals. No live event.

## Verdict

**RA-X-3 accepted offline:** eighth L1 type returned **with** verifier; gated-and-ready, not gated-and-consumed.

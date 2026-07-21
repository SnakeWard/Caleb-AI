# RA-X-4 — Route-Classifier Hollow + Dynamic Selection + Request-Only Seam

**Pass ID:** RA-X-4  
**Seat:** Implementer (Grok), `F:\Caleb AI`.  
**Authorized by:** Pat (T4).  
**Reviewer/planner:** Claude Fable 5.  
**Status:** implemented offline (mocks only).

## Objective

Five deliverables: version-locked pure-lookup routing table; build-time matrix
walkability + acyclicity proofs; classifier Hollow (V1 catalog 13→14); additive
LE-2 dynamic selection; request-only hollow_evidence_request seam.

## Doctrine

Pure table lookup — no route-computing branching. Classifier reads
`getRoleCapabilityCatalog()` (RA-X-3 single source). Analyst never executes
Hollows or holds T0 output. Gate sits between Hollow result and Analyst.

## Deliverables (committed)

| # | Item | Location |
|---|---|---|
| 1 | Table `rax4.1.0` | `src/logicEngine/routeClassificationTable.ts` |
| 2 | T3/T6 proofs | `proveRoutingTableLegal`, `assertRouteMatrixWalkable`, `assertRouteAcyclicSingleCycle` |
| 3 | Classifier Hollow | `src/hollows/categories/routing/routeClassifierHollow.ts` → V1 id `hollow.routing.route_classifier` |
| 4 | LE-2 dynamic | `selectRouteFromRouteInputs` classifier branch in `routeInputGate.ts` |
| 5 | Request-only seam | `src/logicEngine/analystHollowEvidenceRequestSeam.ts` |

## Detectors

T1–T10 in `tests/acceptance/raX4RouteClassifierAcceptance.test.ts`.  
T7 defines the request-only doctrine operationally.

## Forbidden (held)

Rule-engine routing; fallthrough route; runtime table mutation; Analyst Hollow
execution; duplicate capability list; matrix/allowlist/verifier/prompt/live edits.

## Report

`docs/RA_X_4_ROUTE_CLASSIFIER_REPORT.md`

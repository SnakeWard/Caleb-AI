# RA-X-5 — Exhaustive Dynamic-Rotation Mock Rehearsal

**Pass ID:** RA-X-5  
**Seat:** Implementer (Grok 4.3, Grok Build TUI) — **`F:\Caleb AI`**  
**Authorized by:** Pat (T4) — relay constitutes authorization  
**Reviewer/planner:** Claude Fable 5  
**Date:** 2026-07-21  
**Base HEAD (pre-pass):** `f9d0eaa` (RA-X-4)

A recap is not a report.

## Summary

RA-X-5 **proves** the RA-X-1–4 dynamic-rotation chain end-to-end on mocks for
**all eight** ratified classifier routes. No new classifier/table/matrix/Hollow
capability. Campaign-certifying: gated decision-facing → five-check verifier →
classifier (`rax4.1.0`) → LE-2 dynamic selection → mock role execution → ledger →
**execution-keyed reconstruction from ledger.jsonl alone**.

## Suite / catalogs / digests

| Check | Result |
| --- | --- |
| Before (RA-X-4 close) | **211 files / 3,278 tests**, exit 0 |
| After | **212 files / 3,284 tests**, exit **0** |
| tsc / build | exit **0** / exit **0** |
| Catalogs | **V1 = 14**, **Hollowcut = 9** (unchanged) |
| Planner digest | `sha256:f32675859e07243a7cf0cd8e743537f4c975826ea7bf684348ed128792489003` **unchanged** |
| Critic digest | `sha256:8074e98c3317f24cfe4f5bd1b94e9328ffe75e1f390a81f776badb759d3b8e8f` **unchanged** |

## Not-touched declarations

| Surface | Declaration |
| --- | --- |
| L1 allowlist | **eight entries — not touched** |
| Consumption matrix | **39 transitions — not touched** |
| Routing table | **`rax4.1.0` — not touched** |
| Classifier lookup logic | not modified (read only) |
| Five-check verifier | not touched |
| `roleCapabilitySet.ts` | not touched |
| Prompts / live fixtures / LE-3 seam core | not touched |
| Catalogs | 14/9 unchanged |

## Enablement (honest, minimal)

RA-R2 gains route_mode **`planner_analyst_critic`** so classifier row 2
`[planner, analyst, critic]` can bridge/execute. This aligns plan modes with the
existing `rax4.1.0` table; it does not change the table, matrix, or classifier
lookup. Mock adapter accepts `analysis` artifact type for Analyst.

## Per-route results (T1 + T2)

| # | features | selected route | execute | reconstruct (ledger alone) |
|---|---|---|---|---|
| 1 | low / bounded / none | `[planner, critic]` | completed | completed; table `rax4.1.0`; digests+lineage |
| 2 | low / bounded / required | `[planner, analyst, critic]` | completed | completed; table `rax4.1.0` |
| 3 | low / ambiguous / none | `[planner, critic, synthesizer]` | completed | completed; table `rax4.1.0` |
| 4 | low / ambiguous / required | `[planner, analyst, critic, synthesizer]` | completed | completed; table `rax4.1.0` |
| 5 | high / bounded / none | `[planner, critic, synthesizer]` | completed | completed; table `rax4.1.0` |
| 6 | high / bounded / required | `[planner, analyst, critic, synthesizer]` | completed | completed; table `rax4.1.0` |
| 7 | high / ambiguous / none | `[planner, analyst, critic, synthesizer]` | completed | completed; table `rax4.1.0` |
| 8 | high / ambiguous / required | `[planner, analyst, critic, synthesizer]` | completed | completed; table `rax4.1.0` |

Fixtures: `tests/fixtures/ra-x-5/rax5-rehearsal-route-{1..8}.json`.

## Detectors T1–T7

| Detector | Result |
| --- | --- |
| T1 eight-route correctness | **Pass** |
| T2 reconstruction all eight | **Pass** — role order, digests, context lineage, table version, terminal from ledger.jsonl only |
| **T3 request-only seam in-route** | **Pass** — route 2 Analyst path: orchestrator VRP-gated evidence; Analyst never holds T0 |
| T4 non-promoter exhaustive | **Pass** — short (2) and long (4) routes both ≤ T1 on role invocations |
| **T5 negative mid-route** | **Pass** — route 8 Critic step 2 fails; ledger reconstructs failed step with F8-shaped detail |
| T6 legality in-route | **Pass** — every handoff matrix-walkable on 39-transition set |
| T7 determinism | **Pass** — re-run route 1: identical route + digests + reconstruction shape |

### T3 called out

Inside full route 2 (`planner → analyst → critic`), Analyst mock emits
`hollow_evidence_request`; `fulfillAnalystHollowEvidenceRequest` runs Hollow under
orchestrator ownership and VRP-gates before return. Assertions:
`executed_by === "orchestrator"`, `analyst_held_ungated === false`, trust ≠ T0.

### T5 called out

Route 8 four-role rehearsal with Critic failing at step index 2. Reconstruction
from ledger alone yields `final_status: failed`, `failed_step_index: 2`,
`completed_steps: 2`, `role_invocation_failed` present, F8 taxonomy
`live_observer_output_truncated` recoverable.

## AUD-2

**compliant / T2**, **17 paths** (12 create / 5 modify), **0 violations**
(base-ref RA-X-4 `f9d0eaa`). Manifest: `examples/audit/ra-x-5-pass-manifest.valid.json`.

## Flake rate on F:

**0 timeout flakes** on the green full suite run (212 / 3,284, ~77s) with
RA-X-5 suite timeout raised to 60s for eight-route rehearse.

## Honest deviations

**Honest deviations: none** beyond the documented RA-R2 `planner_analyst_critic`
enablement (required so row 2 is bridgeable; table unchanged).

## Campaign-completion line

**Dynamic rotation is proven whole on mocks across all eight routes.** Gated
decision-facing input selects a deterministic version-locked route; LE-2 executes
it under mocks; every chain reconstructs from ledger.jsonl alone; the Analyst’s
request-only Hollow seam holds inside a full route; mid-route failure evidence
reconstructs. **The only remaining unknown is provider-side.** The first live
dynamic rotation remains a separate Pat-authorized event (AUTH-2/AUTH-3, host-shell,
credential runbook, evidence commit). No live event is authorized by RA-X-5.

## Files created

- `docs/protocols/PASS_PROTOCOL_RA_X_5.md`
- `docs/RA_X_5_MOCK_REHEARSAL_REPORT.md`
- `examples/audit/ra-x-5-pass-manifest.valid.json`
- `tests/acceptance/raX5MockRotationRehearsalAcceptance.test.ts`
- `tests/fixtures/ra-x-5/rax5-rehearsal-route-{1..8}.json`

## Files changed

- `src/roles/types/runtimeRotationPlan.ts` — `planner_analyst_critic` mode
- `src/roles/runtimeRotationPlanValidator.ts` — mode → roles map
- `src/roleRuntime/mockRoleRuntimeAdapter.ts` — `analysis` artifact type
- `docs/STATUS_LOG.md`

## Verdict

**RA-X-5 accepted offline. RA-X campaign complete on mocks.**

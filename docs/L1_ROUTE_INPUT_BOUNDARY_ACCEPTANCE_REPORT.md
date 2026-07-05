# L1-A Route-Input Boundary Acceptance Report

Status: Accepted - acceptance lock
Date: 2026-07-05
Protocol: `docs/protocols/PASS_PROTOCOL_L1A_RAC.md`
Implementation doc: `docs/L1_LOGIC_ENGINE_ROUTE_INPUT_HARDENING_IMPLEMENTATION.md`
Implementation commit: `014bec4`
Lock test: `tests/acceptance/l1RouteInputBoundaryAcceptanceLock.test.ts`
Pre-change snapshot: `snap_20260705T214419613Z_000340_milestone` (verified on disk before recording)

## Purpose

L1-A locks the L1 Logic Engine route-input boundary as an accepted steering boundary.

Model output may enter Caleb.

Model output may not steer Caleb.

Only approved decision-facing records may move Caleb's route/state surface.

## Locked Boundary Claims

- L1 is allowlist-based, not denylist-based.
- Unknown record types are rejected by construction.
- `selectRouteFromRouteInputs` is the sole hardened route-input entrypoint.
- `selectRoute` remains deterministic inner route logic, not the hardened boundary.
- Decision-facing route records may expose `effective_tier` only.
- `measurement_tier` and `subject_tier` are provenance-only and never route inputs.
- Raw model output, T1 provider/model output, role artifact prose, report text, display summaries, digest presence, storage presence, provider identity, and model confidence do not grant route authority.
- Allowlist growth requires a protocol-governed pass amending this lock test in a visible diff.

## Verbatim Allowlist Lock

The L1 route-input allowlist is locked to exactly these record kinds:

1. `contract_validated_task_frame`
2. `verified_signal_frame`
3. `engine_internal_state`
4. `deterministic_hollow_signal`
5. `accepted_gate_policy_result`
6. `human_pat_approval_record`
7. `snapshot_change_guard_state`

No record kind may be added, renamed, or removed without a future protocol-governed pass that edits `tests/acceptance/l1RouteInputBoundaryAcceptanceLock.test.ts` in a visible diff.

## Detector Lock

The lock test exercises the public gate surface and proves rejection of:

- synthetic T1 provider/model record presented as route input
- raw model output presented as route input
- `measurement_tier` presented as route input
- `subject_tier` presented as route input
- display/report text presented as route input
- unknown record type presented as route input
- digest presence used as route authority
- storage presence used as route authority
- provider identity used as route authority
- model confidence used as route authority
- role artifact prose used as route authority

## Entrypoint Uniqueness Lock

The accepted hardened entrypoint is:

- `selectRouteFromRouteInputs`

The lock test scans the Logic Engine source surface and fails if another exported `selectRouteFrom...` entrypoint appears without amending the lock. The existing `selectRoute(frame, signals)` function is allowed only as deterministic inner route logic reached after route-input validation.

## Lock-Fires Evidence

The acceptance lock demonstrates that it fires by using synthetic weakening fixtures:

- a fake unprotocolled allowlist entry named `future_unprotocolled_route_input`
- a fake bypassing entrypoint signature named `selectRouteFromRawModelOutput`
- synthetic non-authority records carrying raw model output, T1 provider/model output, tier provenance fields, display/report prose, digest/storage/provider identity, model confidence, and role artifact prose

The lock test proves each synthetic weakening is caught and then leaves no runtime weakening in the repo.

## Absence Assertions

L1-A does not implement:

- role rotation
- routing behavior changes
- UI or display flow
- provider adapters
- egress expansion
- package changes
- catalog changes
- M3 runtime changes
- trust promotion
- side effects
- new route-input record types

## Acceptance Coverage Map

Required L1-A categories locked by report and tests:

1. Allowlist contents acceptance
2. Fail-closed unknown record acceptance
3. Hardened entrypoint uniqueness acceptance
4. Synthetic T1 provider/model route-input detector acceptance
5. Raw model output route-input detector acceptance
6. `measurement_tier` route-input detector acceptance
7. `subject_tier` route-input detector acceptance
8. Display/report text route-input detector acceptance
9. Digest/storage/provider identity route-authority detector acceptance
10. Model confidence route-authority detector acceptance
11. Role artifact prose route-authority detector acceptance
12. Lock-fires evidence acceptance
13. H5 trap preservation acceptance
14. V1 Hollow catalog count acceptance: exactly 12
15. Hollowcut catalog count acceptance: exactly 9
16. Existing suite acceptance

## Final Verdict

L1-A Route-Input Boundary Acceptance Lock: Accepted - steering boundary locked; allowlist growth now requires a visible protocol-governed diff.

## 2026-07-05 Amendment - L1-B Allowlist Correction

Review chain: L1-A required the route-input allowlist to be stated verbatim; that transparency exposed that `lineage_resolved_decision_facing_record` had been admitted before its verifier existed. Post-L1-A implementer analysis confirmed that the gate validated `lineage_refs` shape only: it did not dereference lineage, detect role-artifact ancestry, or verify deterministic extraction. The transparency machinery worked within one pass of being built.

Removed record kind:

- `lineage_resolved_decision_facing_record`

Reason:

- The verifier promised by the type name does not exist yet.
- A structurally well-formed record could self-declare `effective_tier: "T2"` and hide role-artifact ancestry in opaque lineage strings.
- RA-C explicitly deferred the deterministic extraction path to `RA-X-DETERMINISTIC-EXTRACTION`.

The L1 route-input allowlist is now locked to exactly these seven record kinds:

1. `contract_validated_task_frame`
2. `verified_signal_frame`
3. `engine_internal_state`
4. `deterministic_hollow_signal`
5. `accepted_gate_policy_result`
6. `human_pat_approval_record`
7. `snapshot_change_guard_state`

Re-admission condition:

`lineage_resolved_decision_facing_record` may be re-admitted only by a future protocol-governed RA-X pass that attaches the verifier in the same visible diff. That verifier must dereference lineage through the M3 lineage-resolution gate, reject role-artifact ancestry absent a ledgered deterministic-extraction step, and reject self-declared tiers unsupported by resolved lineage.

Standing masquerade detector:

- `l1b masquerade fixture: decision record with unverified role-artifact lineage is rejected`

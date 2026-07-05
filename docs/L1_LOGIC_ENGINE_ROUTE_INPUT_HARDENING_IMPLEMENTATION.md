# L1 Logic Engine Route-Input Hardening Implementation

## Status

L1 implements an allowlist-based Logic Engine route-input gate.

Core rule:

Model output may enter Caleb. Model output may not steer Caleb.

Only approved decision-facing records may move Caleb's route/state surface.

## Implemented Boundary

The L1 route-input boundary is implemented by:

- `src/logicEngine/types/routeInput.ts`
- `src/logicEngine/routeInputGate.ts`

The gate uses a closed discriminated union keyed by `record_kind`. Unknown or unregistered record kinds are rejected by construction.

Approved route-input kinds:

- `contract_validated_task_frame`
- `verified_signal_frame`
- `engine_internal_state`
- `deterministic_hollow_signal`
- `accepted_gate_policy_result`
- `human_pat_approval_record`
- `snapshot_change_guard_state`
- `lineage_resolved_decision_facing_record`

The deterministic `selectRoute(frame, signals)` function remains the inner selector. `selectRouteFromRouteInputs(inputs)` is the hardened route-input entrypoint: it validates route-input records first and calls the selector only after approved TaskFrame and SignalFrame records pass the gate.

## Rejected Non-Authority Inputs

The gate rejects:

- raw model output
- raw provider output
- T1 provider/model output as route authority
- report text
- display summaries
- role artifact prose
- provider identity
- model confidence
- digest presence
- storage presence
- `measurement_tier`
- `subject_tier`
- provenance-only fields
- unknown record types

Digest presence, storage presence, provider identity, model confidence, report inclusion, display text, and provenance metadata do not grant route authority.

## M3 Connection

L1 preserves the M3 structural split:

- provenance-facing records may carry `measurement_tier`, `subject_tier`, and `effective_tier`
- decision-facing route inputs may expose `effective_tier` only
- `measurement_tier` and `subject_tier` are never route inputs

`effective_tier` is not globally sufficient. It is route-relevant only on an approved decision-facing `record_kind`, and L1 requires approved route tiers for deterministic Hollow and lineage-resolved decision-facing records.

## Scope Not Implemented

L1 does not implement:

- role rotation
- UI or display flow
- provider adapters
- egress expansion
- provider/model trust promotion
- M3 runtime changes beyond the approved L1 integration surface
- catalog changes

V1 Hollow catalog remains exactly 12. Hollowcut catalog remains exactly 9.

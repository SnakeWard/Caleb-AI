# One Provider Adapter Disabled-By-Default Live Harness Scaffold

Status: Inert scaffold only
Prior pass: R31 — One Provider Adapter Implementation Skeleton Behind Explicit Opt-In

## 1. Purpose

R32 creates an inert, disabled-by-default live harness scaffold for the one-provider adapter path.

No live provider adapter is added.
No provider SDK/package changes are added.
No API-key or process.env reads are added.
No network calls or live execution are added.
No fake provider success, provider response simulation, or provider output is added.

## 2. Scaffold Behavior

The scaffold is disabled by default.
The scaffold requires explicit opt-in passed as input data.
The scaffold requires explicit live harness request passed as input data.
The scaffold returns skipped/not-run when not opted in.
The scaffold returns blocked/not-run when opt-in is present but live execution is unavailable.
The scaffold never attempts network.
The scaffold never returns provider content.
The scaffold never simulates provider success.
The scaffold exposes a report object only.

## 3. Required Future Report Fields

- harness_id
- provider_adapter_id
- opt_in_state
- explicit_live_request_state
- live_execution_state
- skip_reason
- block_reason
- network_attempted
- provider_response_received
- provider_output_present
- provider_output_trust_tier
- vrp_evidence_required_for_T2
- ledger_write_policy
- created_at

## 4. Trust Lock

Raw provider output = T0.
Schema-valid provider output = T1 maximum.
T2 requires VRP-verified deterministic Hollow evidence.

Explicit opt-in does not promote trust.
Explicit live request does not promote trust.
Blocked scaffold state does not promote trust.
Ledger presence does not promote trust.
Storage does not increase trust.

## 5. Non-Implementation Boundary

R32 does not add live provider behavior, provider calls, SDK imports, package dependency changes, API-key reads, process.env reads, fetch/http/network calls, live tests that run by default, live execution, fake provider success, provider response simulation, provider output, provider-response trust promotion, Ledger writes from provider behavior, or storage-backed trust promotion.

## 6. Catalog Invariants

V1 Hollow catalog remains 12.
Hollowcut catalog remains 9.

## 7. Acceptance Verdict

One Provider Adapter Disabled-By-Default Live Harness Scaffold: Accepted
Status: Live harness scaffold locked disabled-by-default; no live execution added
Next phase: One provider adapter dry-run report contract

R33 forward reference: The next pass may add a dry-run report contract, but it must not add live provider behavior, SDKs, API-key reads, process.env reads, network calls, fake provider success, provider response simulation, provider output, provider content fields, Ledger writes from provider behavior, storage writes, or trust promotion.

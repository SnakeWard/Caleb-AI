# One Provider Adapter Live Prerequisites Contract

Status: Contract-only boundary
Prior pass: R34 — One Provider Adapter Dry-Run CLI Surface Behind Explicit Opt-In

## 1. Purpose

R35 defines what must be true before any future live provider execution may run. This is a contract-only boundary. It does not implement live provider execution.

No live provider adapter is added.
No provider SDK/package changes are added.
No API-key or process.env reads are added.
No network calls or live execution are added.
No fake provider success, provider response simulation, provider output, or provider content is added.

## 2. Required Future Prerequisite Fields

A future live prerequisites evaluator must expose exactly these fields before any live provider execution may be considered:

- `repo_root_confirmed`
- `explicit_opt_in`
- `explicit_live_request`
- `provider_adapter_allowlisted`
- `live_harness_allowlisted`
- `credential_source_declared_by_caller`
- `credential_auto_read`
- `network_permission_granted_by_caller`
- `explicit_live_command_or_flag`
- `dry_run_report_completed`
- `default_tests_non_live`
- `default_acceptance_non_live`
- `default_ci_non_live`
- `provider_output_trust_ceiling`
- `vrp_evidence_required_for_T2`
- `created_at`

## 3. Required Locked Values

The following values are locked for R35 and for any future prerequisites evaluator built on this contract:

- `credential_auto_read` must be `false`.
- `default_tests_non_live` must be `true`.
- `default_acceptance_non_live` must be `true`.
- `default_ci_non_live` must be `true`.
- `provider_output_trust_ceiling` must be `T1`.
- `vrp_evidence_required_for_T2` must be `true`.

## 4. Trust Lock

Raw provider output = T0.
Schema-valid provider output = T1 maximum.
Explicit opt-in does not promote trust.
Explicit live request does not promote trust.
Provider identity does not promote trust.
Network success does not promote trust.
Provider response does not promote trust.
Ledger presence does not promote trust.
Storage does not increase trust.
T2 requires VRP-verified deterministic Hollow evidence.

## 5. Non-Implementation Boundary

R35 does not add a live provider adapter, provider SDK, package dependency change, API-key read, process.env read, fetch/http/network call, live execution, live test that runs by default, fake provider success, provider response simulation, provider output, provider content field, trust promotion from provider response, or storage-backed trust promotion.

## 6. Catalog Invariants

V1 Hollow catalog remains 12.
Hollowcut catalog remains 9.

## 7. Acceptance Verdict

One Provider Adapter Live Prerequisites Contract: Accepted
Status: Live prerequisites contract locked; no live provider behavior added
Next phase: One provider adapter live prerequisites evaluator

# One Provider Adapter Live Prerequisites Evaluator

Status: Pure evaluator only
Prior pass: R35 — One Provider Adapter Live Prerequisites Contract

## 1. Purpose

R36 adds a pure, inert evaluator for the R35 live prerequisites contract. The evaluator accepts prerequisite state as explicit input data and returns an evaluation report only.

No live provider adapter is added.
No provider SDK/package changes are added.
No API-key or process.env reads are added.
No network calls or live execution are added.
No fake provider success, provider response simulation, provider output, or provider content is added.

## 2. Required Evaluator Input Fields

The evaluator accepts the full set of R35 prerequisite fields as explicit input data:

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

## 3. Required Evaluator Output Fields

The evaluator returns an evaluation report containing:

- `evaluator_id`
- `evaluation_mode`
- `prerequisites_met`
- `missing_prerequisites`
- `blocking_reasons`
- `live_execution_state`
- `network_attempted`
- `provider_execution_attempted`
- `provider_response_received`
- `provider_output_present`
- `provider_content_present`
- `provider_output_trust_ceiling`
- `vrp_evidence_required_for_T2`
- `credential_auto_read_allowed`
- `default_tests_non_live`
- `default_acceptance_non_live`
- `default_ci_non_live`
- `created_at`

## 4. Locked Output Values

- `evaluation_mode` is `prerequisites_evaluation` or `contract_only`.
- `live_execution_state` is `not_run` or `blocked`.
- `network_attempted` is `false`.
- `provider_execution_attempted` is `false`.
- `provider_response_received` is `false`.
- `provider_output_present` is `false`.
- `provider_content_present` is `false`.
- `provider_output_trust_ceiling` is `T1`.
- `vrp_evidence_required_for_T2` is `true`.
- `credential_auto_read_allowed` is `false`.

## 5. Evaluation Behavior

The evaluator identifies missing prerequisites and blocking reasons from the supplied input. `credential_auto_read=true`, `default_tests_non_live=false`, `default_acceptance_non_live=false`, and `default_ci_non_live=false` are each treated as a blocker.

Even if all prerequisite input fields are true/valid, the evaluator does not perform live execution. It may return `prerequisites_met=true`, but `live_execution_state` remains `not_run`, because this evaluator never attempts execution of any kind.

Evaluator success does not execute provider behavior.
Evaluator success does not promote provider output trust.

## 6. Trust Lock

Raw provider output = T0.
Schema-valid provider output = T1 maximum.
T2 requires VRP-verified deterministic Hollow evidence.

## 7. Non-Implementation Boundary

R36 does not add a live provider adapter, provider SDK, package dependency change, API-key read, process.env read, fetch/http/network call, live execution, live test that runs by default, fake provider success, provider response simulation, provider output, provider content field, trust promotion from provider response, storage-backed trust promotion, or Ledger writes from provider behavior.

## 8. Catalog Invariants

V1 Hollow catalog remains 12.
Hollowcut catalog remains 9.

## 9. Acceptance Verdict

One Provider Adapter Live Prerequisites Evaluator: Accepted
Status: Live prerequisites evaluator locked; no live provider behavior added
Next phase: One provider adapter live prerequisites CLI surface

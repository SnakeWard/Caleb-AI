# One Provider Adapter Live Test Harness Contract

Status: Contract-only boundary
Prior pass: R29 — One Provider Adapter Implementation Behind Explicit Opt-In Planning

## 1. Purpose

R30 creates the contract boundary for a future live test harness for one provider adapter. It defines how a future live harness must be gated, skipped by default, reported, and prevented from promoting provider output trust.

R30 adds no provider implementation.
R30 adds no live adapter.
R30 adds no provider-specific runtime behavior.
R30 adds no SDK/package changes.
R30 adds no API-key read.
R30 adds no process.env read.
R30 performs no network calls.
R30 performs no live execution.
R30 adds no fake provider success.
R30 adds no provider output.

## 2. Future Harness Contract Requirements

The live harness must be skipped by default.
The live harness must require explicit opt-in.
The live harness must require an explicit live command or explicit live flag.
The live harness must not run under `npx vitest run`.
The live harness must not run under `npx vitest run tests/acceptance`.
The live harness must not run in default CI.
The live harness must report not-run/skipped state when not opted in.
The live harness must report blocked state when prerequisites are missing.
The live harness must never treat provider output as Hollow evidence.
The live harness must never promote provider output to T2.
Raw provider output remains T0.
Schema-valid provider output may reach T1 maximum.
T2 requires VRP-verified deterministic Hollow evidence.

R31 adds an inert provider adapter skeleton behind explicit opt-in only. It does not add live provider behavior, SDKs, API-key reads, process.env reads, network calls, fake provider success, or provider output.

## 3. Opt-In And Skip Gates

A future harness must require explicit user opt-in, explicit live-harness command or flag, provider allowlist, human approval, kill-switch open state, redaction readiness, safety profile readiness, cost guard readiness, and API key availability evidence without reading the API key value in default paths.

When these conditions are absent, the harness must report not-run or blocked status instead of attempting provider execution.

## 4. Default Execution Blocks

Future live harness execution must be absent from normal unit tests, default acceptance tests, and default CI. Default `npx vitest run`, default `npx vitest run tests/acceptance`, and default CI must remain offline and must not require API keys, network access, provider SDKs, or live provider availability.

## 5. Future Report Fields

Future live harness reports must include:

- `harness_id`
- `provider_adapter_id`
- `opt_in_state`
- `live_execution_state`
- `skip_reason`
- `block_reason`
- `network_attempted`
- `provider_response_received`
- `provider_output_trust_tier`
- `vrp_evidence_required_for_T2`
- `ledger_write_policy`
- `created_at`

## 6. Trust Rules

Provider output remains model/provider evidence, not Hollow evidence.
Provider output is not deterministic Hollow evidence.
Network success does not promote trust.
Provider identity does not promote trust.
Successful provider response does not promote trust.
Live harness execution does not promote trust.
Raw provider output remains T0.
Schema-valid provider output may reach T1 maximum.
T2 requires VRP-verified deterministic Hollow evidence.

## 7. Catalog Invariants

V1 Hollow catalog remains 12.
Hollowcut catalog remains 9.

## 8. Acceptance Verdict

One Provider Adapter Live Test Harness Contract: Accepted
Status: Live harness contract locked; no live execution added
Next phase: One provider adapter implementation skeleton behind explicit opt-in

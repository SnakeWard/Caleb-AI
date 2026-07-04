# One Provider Adapter Opt-In Harness Implementation

## 1. Purpose

R27 implements the offline opt-in harness evaluator after R26. The evaluator consumes explicit gate evidence as data and returns either the first blocking refusal or `ready_but_live_execution_disabled`.

This pass does not implement live execution.
This pass does not implement a live adapter.
This pass does not implement provider-specific behavior.
This pass does not implement a real Model API Layer.
This pass does not import a provider SDK.
This pass does not require API keys.
This pass does not read API key values.
This pass does not read process.env.
This pass does not perform a network call.
This pass does not add a live provider test.
This pass does not return fake live-provider success.
This pass does not return provider output.

## 2. Relationship To R26

R26 created the static opt-in harness contract. R27 adds an offline evaluator for explicit evidence gates. R27 still does not authorize live execution, provider calls, SDK use, environment reads, API key value reads, network calls, Ledger writes, file writes, fake success, or provider output.

## 3. Runtime Capabilities

The harness reports:

- evaluates opt-in evidence: true
- reads process env: false
- reads API key value: false
- performs network call: false
- imports provider SDK: false
- enables live execution: false
- writes Ledger: false
- writes files: false
- returns provider output: false
- returns fake success: false

## 4. Runtime Health

The harness reports contract available and runtime enabled, while live execution, process env reads, API key value reads, network availability, and provider SDK availability remain false.

## 5. Deterministic Gate Order

The evaluator checks gates in this order:

1. config
2. kill_switch
3. env_flag
4. command_flag
5. provider_allowlist
6. adapter_id
7. human_approval
8. api_key_availability
9. redaction_readiness
10. safety_profile_readiness
11. cost_guard_readiness
12. live_test_gate
13. r27_live_execution_disabled

The evaluator returns the first blocking refusal. It does not continue past a blocker.

## 6. Refusal Rules

Missing opt-in returns `missing_opt_in`.
Missing command flag returns `command_flag_missing`.
Kill switch block returns `kill_switch_blocks_live_execution`.
Provider not allowlisted returns `provider_not_allowlisted`.
Adapter missing returns `adapter_id_missing`.
Adapter disallowed returns `adapter_id_not_allowed`.
Human approval missing returns `human_approval_missing`.
API key unavailable by reference returns `api_key_unavailable`.
Redaction not ready returns `redaction_not_ready`.
Safety profile not ready returns `safety_profile_not_ready`.
Cost guard not ready returns `cost_guard_not_ready`.
Live tests disabled returns `live_tests_disabled`.
Invalid input returns `validation_failed`.

## 7. Ready-Disabled Rule

If all supplied evidence gates pass, the evaluator may only return `ready_but_live_execution_disabled`.

Ready-disabled does not mean live execution occurred.
Ready-disabled does not promote trust.
Ready-disabled does not return provider output.
Ready-disabled does not call a provider.
Ready-disabled does not enable live execution.

## 8. Trust Guardrails

Harness evaluation does not promote trust.
Harness decision does not promote trust.
Opt-in evidence does not promote trust.
Human approval evidence does not promote trust.
Kill switch state does not promote trust.
API key availability does not promote trust.
Provider allowlist presence does not promote trust.
Network permission does not promote trust.
Provider output is not deterministic Hollow evidence.
Raw provider output starts at T0.
Schema-valid provider output may reach T1 only.
T2 requires VRP-verified deterministic Hollow evidence.

## 9. Safety Summary

The harness reports live execution blocked, live adapter blocked, provider call blocked, provider-specific behavior blocked, real Model API Layer blocked, process env read blocked, API key value read blocked, network call blocked, provider SDK blocked, Ledger write blocked, file write blocked, fake success blocked, and provider output blocked.

## 10. Future Use

The next phase may plan live provider tests, but only behind explicit future approval. R27 does not create live tests or provider execution paths.

R28 creates the live-test planning boundary only. It does not create live tests, enable provider execution, add SDKs, read API key values, read process.env, or perform network calls.

## 11. Acceptance Verdict

One Provider Adapter Opt-In Harness Implementation: Accepted
Status: Offline opt-in harness evaluator complete; live execution still disabled
Next phase: One provider adapter live test plan

# One Provider Adapter Live Test Plan

## 1. Purpose

R28 defines the future live-test boundary only. It documents how later live provider tests may be structured, gated, skipped, cost-limited, and audited before any live test or provider implementation exists.

No live tests are implemented.
No live adapter is implemented.
No provider-specific behavior is implemented.
No real Model API Layer is implemented.
No provider SDK is imported.
No API key or secret is required.
No API key value is read.
process.env is not read.
No network call is performed.
No live provider execution is enabled.

## 2. Relationship To R8-R27

R8 locked Runtime/Storage Planning Boundary. R9 created Runtime Storage Type Contracts. R10 created the In-Memory Artifact Store. R11 created the Mocked single_pass Model Boundary. R12 created the Model Invocation Provenance Record. R13 created the mocked single_pass Route MVP. R14 created the Final Assembly Boundary. R15 created the Ledgered Route Event Write. R16 created the Final Output Ledger Record. R17 locked Live Adapter Boundary Planning. R18 created Live Adapter Type Contracts. R19 created Live Adapter Redaction Contracts. R20 created the Live Adapter Mock-Compatible Interface. R21 created the Provider Adapter Stub With No Network. R22 locked One Provider Adapter Behind Explicit Opt-In Planning. R23 created the One Provider Adapter Type Extension. R24 created the One Provider Adapter Config Contract. R25 created the One Provider Adapter No-Network Implementation Stub. R26 created the One Provider Adapter Opt-In Harness Contract. R27 created the offline opt-in harness evaluator. R28 creates the live-test planning boundary.

## 3. Live Test Boundary

Future live provider tests must be opt-in only. Future live tests are opt-in only.
Future live tests must be skipped by default. Future live tests are skipped by default.
Future live tests must never run in normal npx vitest run. Live tests must not run in normal npx vitest run.
Future live tests require an explicit live-test label.
Future live tests require explicit command flag.
Future live tests require explicit provider allowlist.
Future live tests require explicit human approval.
Future live tests require kill switch open.
Future live tests require redaction readiness.
Future live tests require safety profile readiness.
Future live tests require cost guard readiness.
Future live tests require API key availability as evidence only, never value in fixtures, logs, Ledger, or storage.

## 4. Test Naming and Isolation Rules

Live tests must use `.live.test.ts` or equivalent explicit naming.
Live tests must live in a clearly separated folder or be clearly labeled.
Live tests must be excluded from default test runs.
Live tests must not run in CI by default.
Live tests must not be included in acceptance suite by default.
Default unit tests remain offline.
Default acceptance tests remain offline.

## 5. Environment and API Key Rules

R28 does not read process.env.
R28 does not read API key values.
Future live tests may document env var names only.
API key values must never appear in fixtures.
API key values must never appear in logs.
API key values must never appear in Ledger.
API key values must never appear in storage.
API key values must never appear in fixtures/logs/Ledger/storage.
API key values must never be logged.
API key values must never be written to Ledger.
API key values must never be written to storage.
API key presence does not promote trust.

## 6. Network Rules

R28 performs no network calls.
Future live tests require explicit opt-in.
Network calls must be bounded.
Timeouts must be explicit.
Retries must be bounded.
Network success does not promote trust.
Network failure must normalize into structured failure.

## 7. Cost and Rate-Limit Rules

Future live tests must define max live requests per test.
Future live tests must define max live requests per run.
Future live tests must define max output tokens.
Future live tests must define `timeout_ms`.
Future live tests must define `retry_count`.
Future live tests must emit cost warning.
Future live tests must define cost stop condition.
Future live tests must allow no background live calls.
Future live tests must allow no unbounded loops.

## 8. Redaction and Safety Rules

Redaction policy required.
Redaction manifest required.
Redaction result required.
Safety profile required.
Raw prompt text excluded from Ledger by default.
Raw output text excluded from Ledger by default.
Secrets, env values, and API key values excluded from all records.
Redaction does not verify truth.
Redaction does not promote trust.

## 9. Ledger and Storage Rules

Future live tests may record refs, digests, ids, statuses, timing, token usage if available, failure kind, trust summary, warnings, and errors.

Future live tests must not record raw prompt text by default, raw model output by default, API keys, secrets, env values, credentials, or private keys.

Ledger write does not promote trust.
Storage does not increase trust.
Retrieval is not trust promotion.

## 10. Trust Rules

Live test execution does not promote trust.
Live test success does not promote trust.
Provider identity does not promote trust.
API key presence does not promote trust.
Network success does not promote trust.
Successful provider response does not promote trust.
Raw provider output starts at T0.
Schema-valid provider output may reach T1 only.
Provider output is not deterministic Hollow evidence.
T2 requires verified deterministic Hollow evidence through VRP.

## 11. Stop Conditions

Future live testing must stop if a provider call occurs without opt-in.
Future live testing must stop if a default test performs network.
Future live testing must stop if a default test requires API keys.
Future live testing must stop if an API key value appears in logs, fixtures, Ledger, or storage.
Future live testing must stop if raw prompt text appears in Ledger.
Future live testing must stop if raw output text appears in Ledger.
Future live testing must stop if provider output is promoted above T1.
Future live testing must stop if fake live-provider success is returned.
Future live testing must stop if package dependencies change without approval.
Future live testing must stop if SDK import appears without approval.

## 12. Future Implementation Sequence

1. One Provider Adapter Live Test Plan
2. One Provider Adapter Implementation Behind Explicit Opt-In Planning
3. One Provider Adapter Live Test Harness Contract
4. One Provider Adapter Live Test Harness Implementation
5. One Provider Adapter Implementation Behind Explicit Opt-In
6. Ledgered Live Invocation Record
7. Live single_pass Adapter MVP
8. Hollow-Verified Final Answer Path

R29 creates the provider implementation behind explicit opt-in planning boundary only. It does not add provider implementation, live adapter behavior, SDKs, API-key reads, process.env reads, network calls, live tests, fake provider success, or provider output.

## 13. Acceptance Verdict

One Provider Adapter Live Test Plan: Accepted
Status: Live test planning boundary complete; no live tests implemented
Next phase: One provider adapter implementation behind explicit opt-in planning

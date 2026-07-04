# One Provider Adapter Opt-In Harness Contract

## 1. Purpose

R26 creates the static opt-in harness contract for one future provider adapter. It defines how explicit opt-in may be represented as data while live execution remains disabled.

This pass does not implement an opt-in harness runtime.
This pass does not implement a live adapter.
This pass does not implement provider-specific behavior.
This pass does not implement a real Model API Layer.
This pass does not add provider SDKs.
This pass does not require API keys.
This pass does not read API key values.
This pass does not read process.env.
This pass does not perform network calls.
This pass does not create live provider tests.
This pass does not enable live provider execution.

## 2. Relationship To R8-R25

R8 locked Runtime/Storage Planning Boundary. R9 created Runtime Storage Type Contracts. R10 created the In-Memory Artifact Store. R11 created the Mocked single_pass Model Boundary. R12 created the Model Invocation Provenance Record. R13 created the mocked single_pass Route MVP. R14 created the Final Assembly Boundary. R15 created the Ledgered Route Event Write. R16 created the Final Output Ledger Record. R17 locked Live Adapter Boundary Planning. R18 created Live Adapter Type Contracts. R19 created Live Adapter Redaction Contracts. R20 created the Live Adapter Mock-Compatible Interface. R21 created the Provider Adapter Stub With No Network. R22 locked One Provider Adapter Behind Explicit Opt-In Planning. R23 created the One Provider Adapter Type Extension. R24 created the One Provider Adapter Config Contract. R25 created the One Provider Adapter No-Network Implementation Stub. R26 creates the One Provider Adapter Opt-In Harness Contract.

## 3. Non-Implementation Statement

No opt-in harness runtime is implemented.
No live adapter is implemented.
No provider-specific behavior is implemented.
No real Model API Layer is implemented.
No provider SDK is imported.
No API key or secret is required.
No API key value is read.
process.env is not read.
No network call is performed.
No live provider test is added.
No provider dependency is added.
No live provider execution is enabled.
No fake live-provider success is returned.
No successful provider response is produced.

## 4. Harness Contract Shape

The contract defines opt-in evidence, command flag evidence, env flag ref, provider allowlist evidence, adapter id evidence, human approval record, kill switch state, API key availability evidence, redaction readiness evidence, safety profile readiness evidence, cost guard readiness evidence, live test gate evidence, harness decision, harness refusal, audit summary, and trust summary.

## 5. Opt-In Evidence Rules

Opt-in must be represented as explicit data. Env var names may be documented as names only. Env var values are not read. process.env is not read. Command flag presence does not promote trust. Explicit opt-in does not promote trust. Missing opt-in returns structured refusal. Missing opt-in cannot fall back to fake success.

## 6. Human Approval Rules

Human approval may be represented as data. Human approval evidence does not promote trust. Approval evidence does not allow live execution in R26. Future approval records need scope, timestamp, and expiration. Missing approval returns structured refusal.

## 7. Kill Switch Rules

Kill switch is required. Kill switch value is not read from environment in R26. Kill switch is disabled by default for live execution. Kill switch blocks live execution in R26. Kill switch state does not promote trust. Disabled kill switch returns structured refusal.

## 8. API Key Rules

API key env var names may appear as names only. API key values must not be present. API key values must not be read. API key values must not be stored. API key values must not be logged. API key values must not be written to Ledger. API key values must not be written to runtime storage. API key availability does not promote trust. Missing API key returns structured refusal.

## 9. Redaction, Safety, And Cost Rules

Redaction policy required. Redaction manifest required. Redaction result required. Safety profile required. Cost guard required. Raw prompt not allowed. Raw output not allowed. Background live calls not allowed. Redaction metadata does not promote trust. Safety profile presence does not promote trust. Cost guard presence does not promote trust.

## 10. Live Test Gate Rules

Live tests are not created in R26. Live tests are not allowed in default run. Live tests are opt-in only. Live tests are skipped by default. Live tests cannot run in CI by default. Fixtures contain no secrets. Fixtures contain no API keys. Fixtures contain no raw prompt. Fixtures contain no raw output.

## 11. Decision And Refusal Rules

R26 decisions cannot enable live execution. Live execution attempted false. Provider call attempted false. Network call attempted false. API key value read false. process.env read false. Provider SDK used false. Ledger write attempted false. File write attempted false. Fake success returned false. Provider output returned false. Refusal is structured and explicit.

## 12. Trust Rules

Opt-in evidence does not promote trust.
Command flag presence does not promote trust.
Env flag name does not promote trust.
Human approval evidence does not promote trust.
Human approval does not promote trust.
Kill switch state does not promote trust.
API key presence does not promote trust.
Provider allowlist presence does not promote trust.
Provider allowlist does not promote trust.
Network permission does not promote trust.
Harness decision does not promote trust.
Live execution is not allowed in R26.
Provider identity does not promote trust.
Successful provider response does not promote trust.
Provider output is not deterministic Hollow evidence.
Raw provider output starts at T0.
Schema-valid provider output may reach T1 only.
Max provider output trust tier is T1.
Verified final truth is not claimed from provider output alone.
T2 requires verified deterministic Hollow evidence through VRP.

## 13. Future Use

This prepares for One Provider Adapter Opt-In Harness Implementation, One Provider Adapter Live Test Plan, One Provider Adapter Implementation Behind Explicit Opt-In, Ledgered Live Invocation Record, Live single_pass Adapter MVP, and Hollow-Verified Final Answer Path.

R27 implements the offline opt-in harness evaluator only. It does not enable live execution, provider calls, provider SDKs, API key value reads, process.env reads, network calls, live provider tests, fake live-provider success, or provider output.

## 14. Acceptance Verdict

One Provider Adapter Opt-In Harness Contract: Accepted
Status: Opt-in harness contract complete; live execution still disabled
Next phase: One provider adapter opt-in harness implementation

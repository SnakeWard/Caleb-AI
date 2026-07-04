# One Provider Adapter Config Contract

## 1. Purpose

R24 defines the static One Provider Adapter Config Contract. It explains how a future one-provider adapter configuration is represented, validated, and safely rejected before any live adapter implementation exists.

This contract is a configuration boundary only. It is not a provider implementation, not a live adapter, not a Model API Layer, and not permission to select or call a provider.

R25 consumes this contract in `docs/ONE_PROVIDER_ADAPTER_NO_NETWORK_IMPLEMENTATION_STUB.md` while live execution remains disabled.

## 2. Prior Chain

- R8 created Runtime / Storage Planning Boundary Lock.
- R9 created Runtime Storage Type Contracts.
- R10 created the In-Memory Artifact Store.
- R11 created the Mocked single_pass Model Boundary.
- R12 created the Model Invocation Provenance Record.
- R13 created the mocked single_pass Route MVP.
- R14 created the Final Assembly Boundary.
- R15 created the Ledgered Route Event Write.
- R16 created the Final Output Ledger Record.
- R17 locked Live Adapter Boundary Planning.
- R18 created Live Adapter Type Contracts.
- R19 created Live Adapter Redaction Contracts.
- R20 created the Live Adapter Mock-Compatible Interface.
- R21 created the Provider Adapter Stub With No Network.
- R22 locked One Provider Adapter Behind Explicit Opt-In Planning.
- R23 created the One Provider Adapter Type Extension.
- R24 creates the One Provider Adapter Config Contract.

## 3. Non-Implementation Statement

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
No runtime behavior is changed.
No real provider is selected unless explicitly authorized by the user.

## 4. Config Shape

The config document contains identity, status, source kind, provider slot, opt-in, allowlist, API key ref, network, timeout/retry, cost guard, live test gate, redaction, safety profile, ledger, runtime storage, trust cap, kill switch, refusal, creation time, and notes.

Provider slot config identifies the future first provider slot while keeping real provider selection disabled. Opt-in config names required gates without treating names or presence as authorization. Allowlist config records future allowed identifiers without treating them as secrets or trust. API key ref config documents environment variable names only, never values.

Network, timeout/retry, cost guard, and live test config define future safety gates while keeping R24 offline. Redaction, ledger, and runtime storage config preserve raw-content exclusion and provenance-only records. Trust cap config prevents config validity, config presence, provider identity, API key presence, opt-in, network success, and provider response success from increasing trust. Kill switch config requires safe refusal gates. Refusal config is an explicit `ok: false` result.

## 5. Config Source Rules

R24 uses static fixtures/examples only.
Future external config requires a later boundary.
Config presence does not enable live provider behavior.
Config presence does not promote trust.
Config validity does not promote trust.
Config validity does not prove opt-in.
Config must not contain secret values.

## 6. Provider Slot Rules

`provider_slot_id` is `first_provider_slot`.
No real provider selected in R24 unless explicitly user-authorized.
Provider-specific behavior disabled.
Provider slot selection does not promote trust.

## 7. Opt-In Rules

Explicit opt-in required.
Opt-in not present in R24 examples.
Default runtime disabled.
Command flag required.
Human approval required.
Missing opt-in returns structured refusal.
Missing opt-in cannot fall back to fake success.
Explicit opt-in does not promote trust.

## 8. API Key Rules

API key env var names may be documented as names only.
API key values must not be present.
API key values must not be read.
API key values must not be stored.
API key values must not be logged.
API key values must not be written to Ledger.
API key values must not be written to runtime storage.
API key values must not appear in fixtures.
API key env var name does not promote trust.
API key presence does not promote trust.

## 9. Network And Live Test Rules

No network call in R24.
Network unavailable in R24.
Network disabled by default.
Future network requires opt-in.
Default unit tests offline.
Default acceptance tests offline.
Live tests not created in R24.
Live tests skipped by default.
Live tests cannot run in CI by default.
Network success does not promote trust.

## 10. Redaction, Ledger, And Storage Rules

Redaction policy required.
Redaction manifest required.
Redaction result required.
Raw prompt not allowed.
Raw output not allowed.
Raw transcript storage not allowed.
Ledger write not allowed in config contract.
Raw prompt not written to Ledger.
Raw output not written to Ledger.
API keys/secrets/env values not written to Ledger.
Storage write not allowed in config contract.
Persistent transcript storage not allowed.
Storage does not promote trust.
Retrieval does not promote trust.
Persistence is not verification.

## 11. Trust Rules

Raw provider output starts at T0.
Schema-valid provider output may reach T1 only.
Max provider output trust tier is T1.
Config validity does not promote trust.
Config presence does not enable opt-in.
Provider slot selection does not promote trust.
Explicit opt-in does not promote trust.
API key env var name does not promote trust.
API key presence does not promote trust.
Network success does not promote trust.
Provider identity does not promote trust.
Successful provider response does not promote trust.
Provider output is not deterministic Hollow evidence.
Verified final truth is not claimed from provider output alone.
T2 requires verified deterministic Hollow evidence through VRP.

## 12. Refusal Rules

Refusal `ok` is false.
Fake success is false.
Provider call is not attempted.
Network call is not attempted.
API key value is not read.
Trust is not promoted.
Refusal is structured and explicit.

## 13. Future Use

This prepares for One Provider Adapter No-Network Implementation Stub, One Provider Adapter Opt-In Harness, One Provider Adapter Live Test Plan, One Provider Adapter Implementation Behind Explicit Opt-In, Ledgered Live Invocation Record, Live single_pass Adapter MVP, and Hollow-Verified Final Answer Path.

## 14. Acceptance Verdict

One Provider Adapter Config Contract: Accepted
Status: First-provider config contract complete; no provider implementation
Next phase: One provider adapter no-network implementation stub

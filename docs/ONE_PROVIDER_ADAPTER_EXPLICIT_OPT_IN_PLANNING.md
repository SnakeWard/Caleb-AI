# One Provider Adapter Behind Explicit Opt-In Planning

## 1. Purpose

R22 defines the planning boundary for introducing exactly one future live provider adapter behind explicit opt-in controls.

This pass does not implement a live adapter.
This pass does not implement provider-specific behavior.
This pass does not implement a real Model API Layer.
This pass does not add provider SDKs.
This pass does not require API keys.
This pass does not perform network calls.
This pass does not create live provider tests.
This pass does not change runtime behavior.

## 2. Relationship To R8-R21

- R8 locked Runtime/Storage Planning Boundary.
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
- R22 defines the explicit opt-in planning boundary for one future provider adapter.

## 3. Boundary Statement

A future live provider adapter may only be introduced after this boundary is accepted and a separate implementation pass is approved.

Only one provider adapter may be introduced first.

That provider adapter must be behind explicit opt-in controls.

Default unit tests must remain offline.

Default runtime must not call a provider.

No provider output may exceed T1 without future VRP-verified deterministic Hollow evidence.

Explicit opt-in enables controlled execution only; it does not promote trust.

## 4. Why One Provider First

One provider reduces blast radius, simplifies failure taxonomy, simplifies cost control, simplifies redaction validation, simplifies provenance review, and simplifies rollback. Multiple providers must wait for a later boundary because provider differences would expand the first live surface too quickly.

## 5. Provider Selection Criteria

The first provider should be selected based on:

- simple API shape
- reliable structured response behavior
- clear timeout behavior
- clear token/cost reporting
- stable authentication pattern
- ability to run behind opt-in
- compatibility with Caleb live adapter type contracts
- compatibility with Caleb redaction contracts
- compatibility with Caleb no-raw-ledger policy
- ability to remain skipped in default tests

R22 does not hardcode a provider choice.

## 6. Explicit Opt-In Requirements

Future live provider execution must require:

- explicit environment flag such as `CALEB_ENABLE_LIVE_PROVIDER=true`
- explicit provider allowlist value
- explicit adapter id
- explicit command/test flag
- explicit human approval in the pass instructions
- tests skipped by default unless opt-in flag is present
- safe refusal when opt-in is missing
- safe refusal when provider is not allowlisted
- safe refusal when API key is missing
- safe refusal when redaction contract is missing
- safe refusal when safety profile is missing

Missing opt-in must produce structured `live_provider_not_enabled` or `adapter_unavailable` results.
Missing opt-in must not silently fall back to fake success.

## 7. API Key and Secret Rules

- API keys must never be hardcoded.
- API keys must never be committed.
- API key values must never be printed.
- API key values must never be written to Ledger.
- API key values must never be written to runtime storage.
- API key values must never appear in test fixtures.
- Environment variable names may be documented, but values must never be stored.
- Missing API key must return a structured `missing_api_key` or `adapter_unavailable` result.
- API key presence does not promote trust.
- API key presence does not prove provider output is true.

## 8. Network Access Rules

- R22 performs no network calls.
- Future live adapter network calls require a separate approved implementation pass.
- Default unit tests must perform no network calls.
- Default acceptance tests must perform no network calls.
- Live provider tests must be opt-in only.
- Live provider tests must be skipped by default.
- Network success does not promote trust.
- Network failure must be normalized.
- Timeouts must be explicit.
- Retries must be bounded.
- Costs must be bounded.

## 9. Provider SDK and Dependency Rules

- R22 adds no provider SDK.
- A future provider SDK may only be added in a separate approved implementation pass.
- package.json and lockfiles must not change in R22.
- Future SDK addition must include dependency justification.
- Future SDK addition must include rollback instructions.
- Future SDK addition must include test isolation.
- Direct fetch/no-SDK implementation must also be explicitly approved before use.

## 10. Redaction and Content Safety Requirements

A future live provider adapter must require:

- redaction policy
- redaction manifest
- redaction result
- safety profile
- prompt digest/ref
- output digest/ref
- raw prompt excluded from Ledger by default
- raw output excluded from Ledger by default
- API keys excluded from all records
- secrets excluded from all records
- env values excluded from all records
- raw transcript storage disabled unless separately approved

Redaction reduces exposure risk; it does not verify truth.
Redaction metadata does not promote trust.

## 11. Ledger and Provenance Requirements

Future live provider provenance may record:

- provider_id
- provider_kind
- adapter_id
- adapter_version
- request_id
- response_id
- prompt_digest
- output_digest
- evidence_refs
- context_refs
- token usage if available
- latency_ms
- finish_reason
- failure_kind if any
- trust summary
- warnings/errors

Future live provider provenance must not record:

- API keys
- secrets
- env values
- raw prompt text by default
- raw model output text by default
- private credentials
- unredacted sensitive content

Ledger write does not promote trust.
Ledger presence does not promote trust.
Ledger records provenance; it does not certify truth.

## 12. Runtime Storage Requirements

Future live provider records must use RuntimeStorageRecord contracts or future approved extensions.
Storage does not increase trust.
Persistence is not verification.
Retrieval is not trust promotion.
Raw provider output starts at T0.
Schema-valid provider output may reach T1 only.
Persistent transcript storage requires a separate boundary.

## 13. Trust Tier Rules

- Live provider output starts at T0.
- Schema-valid live provider output may reach T1 only.
- Provider identity does not promote trust.
- API key presence does not promote trust.
- Explicit opt-in does not promote trust.
- Network success does not promote trust.
- Successful provider response does not promote trust.
- Ledger presence does not promote trust.
- Storage does not increase trust.
- Retrieval is not trust promotion.
- Provider output is not deterministic Hollow evidence.
- Verified final truth is not claimed from provider output alone.
- T2 requires verified deterministic Hollow evidence through VRP.
- T3 requires verified output with provenance and policy clearance.
- T4 requires human approval or external authority with provenance.

## 14. Failure and Refusal Rules

Future failure/refusal kinds:

- live_provider_not_enabled
- provider_not_allowlisted
- missing_api_key
- invalid_api_key_configuration
- redaction_required
- safety_profile_required
- network_disabled
- provider_timeout
- provider_rate_limited
- provider_auth_failed
- provider_rejected_request
- provider_malformed_response
- response_validation_failed
- cost_limit_exceeded
- unknown_provider_error

Each failure must normalize to:

- ok false
- failure_kind
- retryable
- warnings
- errors
- trust tier no higher than T0
- no verified truth claim
- no fake success

## 15. Cost and Rate-Limit Rules

Future live adapter implementation must define:

- max request count per live test
- max output tokens
- timeout_ms
- retry_count
- cost warning
- cost stop condition
- rate limit handling
- no unbounded loops
- no background live calls

## 16. Rollback and Kill Switch Rules

Future live adapter implementation must include:

- kill switch env flag
- provider allowlist
- live tests skipped by default
- rollback instructions
- safe refusal path
- no live call when kill switch disabled
- no live call when provider not allowlisted
- no live call when API key missing
- no live call when redaction/safety profile missing

## 17. Test Isolation Rules

- Unit tests remain offline.
- Acceptance tests remain offline unless specifically live-labeled in a future pass.
- Live provider tests must be opt-in only.
- Live provider tests must be skipped by default.
- Live provider tests must not run in normal `npx vitest run`.
- Test fixtures must contain no secrets.
- Test fixtures must contain no raw prompt text.
- Test fixtures must contain no raw output text.
- Test fixtures must contain no API keys.
- Test fixtures must contain no env values.

## 18. First Provider Adapter Implementation Sequence

1. One Provider Adapter Behind Explicit Opt-In Planning
2. One Provider Adapter Type Extension
3. One Provider Adapter Config Contract
4. One Provider Adapter No-Network Implementation Stub
5. One Provider Adapter Opt-In Harness
6. One Provider Adapter Live Test Plan
7. One Provider Adapter Implementation Behind Explicit Opt-In
8. Ledgered Live Invocation Record
9. Live single_pass Adapter MVP
10. Hollow-Verified Final Answer Path
11. Role Rotation Runtime Planning

## 19. Stop Conditions

Future live adapter implementation must stop immediately if:

- provider SDK import appears unexpectedly
- network call appears outside approved adapter file
- API key value appears in logs, ledger, fixtures, or storage
- raw prompt text appears in ledger record
- raw output text appears in ledger record
- provider output is promoted above T1
- default tests require network
- default tests require API keys
- provider call occurs without opt-in
- fake live-provider success is returned when provider is disabled

## 20. Acceptance Verdict

One Provider Adapter Behind Explicit Opt-In Planning: Accepted
Status: First-provider opt-in boundary locked; no live provider implementation
Next phase: One provider adapter type extension

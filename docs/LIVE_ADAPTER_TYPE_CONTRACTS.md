# Live Adapter Type Contracts

## 1. Purpose

This pass creates provider-neutral live adapter type contracts and validators before any live adapter implementation.

This pass does not implement a live adapter.
This pass does not implement a provider stub.
This pass does not implement a real Model API Layer.
This pass does not add provider SDKs.
This pass does not require API keys.
This pass does not perform network calls.

## 2. Relationship To R8-R17

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
- R18 creates Live Adapter Type Contracts.

## 3. Non-Implementation Statement

- No live adapter is implemented.
- No provider stub is implemented.
- No real Model API Layer is implemented.
- No provider SDK is imported.
- No API key or secret is required.
- No network call is performed.
- No live provider test is added.
- No provider dependency is added.

## 4. Provider-Neutral Contract Shape

- LiveAdapterRequest
- LiveAdapterResponse
- LiveAdapterFailure
- LiveAdapterResult
- Provider-neutral limits
- Safety profile ref
- Prompt ref
- Output ref
- Redaction summary
- Token usage
- Timing summary
- Retry summary
- Provider error normalization
- Trust summary

## 5. Request Rules

- `route_mode` is `single_pass` only for R18.
- Prompt ref/digest only.
- No raw prompt text.
- No API key.
- No secret/env value.
- Provider-neutral limits required.
- Safety profile required.

## 6. Response Rules

- Raw provider output starts T0.
- Schema-valid provider output may reach T1 only.
- No raw output text by default.
- Output ref/digest only.
- Provider identity does not promote trust.
- Successful provider response does not promote trust.

## 7. Failure Rules

- adapter_unavailable
- missing_api_key
- invalid_request
- provider_timeout
- provider_rate_limited
- provider_auth_failed
- provider_rejected_request
- provider_malformed_response
- response_validation_failed
- safety_profile_blocked
- network_failure
- unknown_provider_error

Every failure normalizes to:

- ok false
- failure_kind
- retryable
- warnings
- errors
- trust tier no higher than T0
- no verified truth claim

## 8. Trust Rules

- Live provider output starts at T0.
- Schema-valid live provider output may reach T1 only.
- Live provider output does not become T2 deterministic Hollow evidence.
- Provider identity does not promote trust.
- Successful provider response does not promote trust.
- Ledger presence does not promote trust.
- Storage does not increase trust.
- Retrieval is not trust promotion.
- Verified final truth is not claimed from provider output alone.
- T2 requires verified deterministic Hollow evidence through VRP.

## 9. Content Safety Rules

- Raw prompt text must not be present in R18 live adapter contracts.
- Raw model output text must not be present in R18 live adapter contracts.
- API keys must not be present.
- Secrets must not be present.
- Environment values must not be present.
- Ledger records should prefer refs, digests, IDs, statuses, summaries, and trust metadata.

## 10. Future Use

This prepares for:

- Live adapter redaction contract
- Live adapter mock-compatible interface
- Provider adapter stub with no network
- One provider adapter behind explicit opt-in
- Ledgered live invocation record
- Live single_pass adapter MVP
- Hollow-verified final answer path
- Role rotation runtime planning

## 11. Acceptance Verdict

Live Adapter Type Contracts: Accepted
Status: Provider-neutral live adapter contracts complete; no live adapter implemented
Next phase: Live adapter redaction contract

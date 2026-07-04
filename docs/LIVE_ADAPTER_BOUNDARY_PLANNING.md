# Live Adapter Boundary Planning

## 1. Purpose

This document defines the safety boundary for future live model adapter implementation.

This pass does not implement a live adapter.
This pass does not implement a real Model API Layer.
This pass does not add provider SDKs.
This pass does not require API keys.
This pass does not perform network calls.

## 2. Relationship To R8-R16

- R8 locked Runtime/Storage Planning Boundary.
- R9 created Runtime Storage Type Contracts.
- R10 created the In-Memory Artifact Store.
- R11 created the Mocked single_pass Model Boundary.
- R12 created the Model Invocation Provenance Record.
- R13 created the mocked single_pass Route MVP.
- R14 created the Final Assembly Boundary.
- R15 created the Ledgered Route Event Write.
- R16 created the Final Output Ledger Record.
- R17 defines the boundary for future live model adapter implementation.

## 3. Boundary Statement

The live adapter boundary is the edge between Caleb's deterministic orchestration system and external model providers.

The adapter may send a bounded request to a provider only in a future approved implementation pass.

The adapter may receive model output only as raw untrusted output.

The adapter may not promote trust.

The adapter may not bypass VRP.

The adapter may not write raw prompt or raw output into Ledger by default.

The adapter may not expose provider-specific behavior to the internal Caleb route contract unless normalized.

## 4. Provider-Neutral Adapter Shape

Future live adapter request should include:

- schema_version
- task_id
- run_id
- request_id
- route_mode
- provider_id
- adapter_id
- adapter_version
- prompt_ref or redacted_prompt_digest
- context_refs
- evidence_refs
- constraints
- timeout_ms
- max_output_tokens or equivalent neutral limit
- safety_profile_id
- created_at

Future live adapter response should include:

- schema_version
- task_id
- run_id
- request_id
- response_id
- provider_id
- adapter_id
- adapter_version
- provider_response_id if available
- raw_output_ref or redacted_output_digest
- output_text only if explicitly allowed by future policy
- finish_reason
- token_usage if available
- latency_ms
- warnings
- errors
- raw_trust_tier
- validation_status
- created_at

## 5. Secret and API Key Rules

- API keys must never be hardcoded.
- API keys must never be committed.
- API keys must never be written to Ledger.
- API keys must never be written to runtime storage.
- API keys must never appear in test fixtures.
- Environment variable names may be documented, but values must never be printed.
- Missing API keys must produce structured adapter_unavailable results.
- Future tests must use mocks unless a human explicitly approves live integration tests.

## 6. Network Access Rules

- R17 performs no network calls.
- Future live adapter calls require an explicit approved pass.
- Live network calls must be isolated from default unit tests.
- Unit tests must remain offline.
- Live tests, if ever added, must be opt-in and skipped by default.
- Timeouts must be explicit.
- Retries must be bounded.
- Provider failures must be normalized.

## 7. Prompt and Output Content Safety

- Raw prompt text should not be written to Ledger by default.
- Raw model output text should not be written to Ledger by default.
- Ledger records should prefer refs, digests, IDs, statuses, summaries, and trust metadata.
- Sensitive input must be redacted before provider calls if the future safety profile requires it.
- Prompt digests must not include secrets.
- Output digests must not include secrets.
- Future raw transcript storage requires a separate approved boundary.

## 8. Trust Tier Rules

- Live model output starts at T0.
- Schema-valid live model output may reach T1 only.
- Live model output does not become T2 deterministic Hollow evidence.
- Provider identity does not promote trust.
- Successful provider response does not promote trust.
- Ledger presence does not promote trust.
- Storage does not increase trust.
- Retrieval is not trust promotion.
- Final assembly does not promote trust.
- Verified final truth is not claimed from model output alone.
- T2 requires verified deterministic Hollow evidence through VRP.
- T3 requires verified output with provenance and policy clearance.
- T4 requires human approval or external authority with provenance.

## 9. Failure Taxonomy

Future live adapter failure kinds:

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

Each failure must normalize to:

- ok false
- failure_kind
- retryable
- status
- warnings
- errors
- trust_tier no higher than T0
- no final truth claim

## 10. Timeout and Retry Policy

- Timeouts must be explicit.
- Retries must be bounded.
- Retry policy must be deterministic.
- Retry count must be recorded.
- A failed live adapter call must not silently fall back to fake success.
- A failed provider response must not produce verified output.
- Human approval is required before increasing retry limits for costly providers.

## 11. Ledger and Provenance Rules

Future live adapter provenance may record:

- provider_id
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

Future live adapter provenance must not record:

- API keys
- secrets
- env values
- raw prompt text by default
- raw output text by default
- private provider credentials
- unredacted sensitive data unless separately approved

## 12. Storage Rules

- Live adapter storage must use RuntimeStorageRecord contracts or future approved extensions.
- Storage does not increase trust.
- Persistence is not verification.
- Retrieval is not trust promotion.
- Raw provider output can be stored only as T0 unless schema-valid T1 path is explicitly applied.
- Future persistent transcript storage requires separate approval.

## 13. Test Isolation Rules

- Unit tests must not call live providers.
- Unit tests must not require API keys.
- Unit tests must not require network.
- Live adapter tests must be opt-in.
- Live adapter tests must be skipped by default.
- Mock tests must prove trust caps.
- Acceptance tests must prove no provider SDK imports until implementation pass.

## 14. First Live Adapter Implementation Sequence

1. Live Adapter Boundary Planning
2. Live Adapter Type Contracts
3. Live Adapter Redaction Contract
4. Live Adapter Mock-Compatible Interface
5. Provider Adapter Stub With No Network
6. One Provider Adapter Behind Explicit Opt-In
7. Ledgered Live Invocation Record
8. Live single_pass Adapter MVP
9. Hollow-verified Final Answer Path
10. Role Rotation Runtime Planning

## 15. Acceptance Verdict

Live Adapter Boundary Planning: Accepted
Status: Live provider boundary locked; no live adapter implemented
Next phase: Live adapter type contracts

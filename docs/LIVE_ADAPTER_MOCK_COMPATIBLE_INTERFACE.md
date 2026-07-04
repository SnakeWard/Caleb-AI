# Live Adapter Mock-Compatible Interface

## 1. Purpose

R20 creates the provider-neutral adapter interface seam that can work with mock-compatible flows before any live provider implementation. It defines the capabilities, context, input/output, health, safety, redaction, trust-cap, test-isolation, and mock compatibility metadata that future adapters must satisfy.

This pass does not implement a live adapter.
This pass does not implement provider stub behavior.
This pass does not implement provider-specific behavior.
This pass does not implement a real Model API Layer.
This pass does not add provider SDKs.
This pass does not require API keys.
This pass does not perform network calls.

## 2. Relationship To R8-R19

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
- R20 creates the Live Adapter Mock-Compatible Interface.

## 3. Non-Implementation Statement

- No live adapter is implemented.
- No provider stub is implemented.
- No provider-specific behavior is implemented.
- No real Model API Layer is implemented.
- No provider SDK is imported.
- No API key or secret is required.
- No network call is performed.
- No live provider test is added.
- No provider dependency is added.

## 4. Interface Shape

The R20 interface shape includes interface capabilities, invocation context, invocation input, invocation output, invocation result, health status, unavailable result, safety requirements, redaction requirements, trust-cap requirements, test isolation requirements, and mock compatibility summary.

Capabilities describe what the interface may do. Invocation context carries refs, safety profile IDs, redaction contract IDs, and route identity. Invocation input/output describe the future handoff shape without raw prompt/output text, API keys, SDK usage, or network usage. Invocation result records whether the seam is mock-interface-ready and carries the safety, redaction, trust, test-isolation, and mock compatibility requirements.

## 5. Capability Rules

- supports_live_network false for R20.
- supports_mock_invocation true.
- requires_api_key false.
- imports_provider_sdk false.
- performs_network_call false.
- stores_raw_prompt false.
- stores_raw_output false.
- writes_ledger_directly false.
- max_output_trust_tier T1.

## 6. Invocation Rules

- route_mode single_pass only for R20.
- Raw prompt not included.
- API key not included.
- Network not allowed.
- Raw output not included.
- Provider SDK not used.
- Refs/digests/redaction refs preferred.

## 7. Health and Unavailable Rules

- Live network unavailable for R20.
- API key unavailable for R20.
- Provider SDK unavailable for R20.
- Mock invocation available.
- Unavailable/future_live_not_enabled states are valid.
- Unavailable does not promote trust.

## 8. Trust Rules

- Interface validation does not promote trust.
- Adapter availability does not promote trust.
- Mock compatibility does not promote trust.
- Provider identity does not promote trust.
- Successful provider response does not promote trust.
- Raw provider output starts at T0.
- Schema-valid provider output may reach T1 only.
- Provider output is not deterministic Hollow evidence.
- T2 requires verified deterministic Hollow evidence through VRP.

## 9. Safety and Redaction Rules

- Redaction policy is required.
- Redaction manifest is required.
- Redaction result is required.
- Raw prompt text must not be present.
- Raw model output text must not be present.
- API keys must not be present.
- Secrets must not be present.
- Environment values must not be present.
- Refs, digests, and summaries are preferred.

## 10. Test Isolation Rules

- Unit tests remain offline.
- Unit tests require no API keys.
- Unit tests require no provider SDK.
- Unit tests perform no network call.
- Live tests are opt-in only.
- Live tests are skipped by default.
- Test fixtures contain no secrets.
- Test fixtures contain no raw prompt text.
- Test fixtures contain no raw output text.

## 11. Future Use

This prepares for a provider adapter stub with no network, one provider adapter behind explicit opt-in, ledgered live invocation record, live single_pass adapter MVP, Hollow-verified final answer path, and role rotation runtime planning.

## 12. Acceptance Verdict

Live Adapter Mock-Compatible Interface: Accepted
Status: Mock-compatible adapter interface seam complete; no live adapter implemented
Next phase: Provider adapter stub with no network

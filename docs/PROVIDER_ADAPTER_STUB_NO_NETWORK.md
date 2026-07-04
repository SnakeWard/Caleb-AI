# Provider Adapter Stub With No Network

## 1. Purpose

R21 creates an offline provider adapter stub that satisfies the mock-compatible interface seam without live provider behavior. The stub is adapter-shaped, deterministic, and always refuses live execution.

This pass does not implement a live adapter.
This pass does not implement provider-specific behavior.
This pass does not implement a real Model API Layer.
This pass does not add provider SDKs.
This pass does not require API keys.
This pass does not perform network calls.
This pass does not produce fake live-provider success.

## 2. Relationship To R8-R20

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
- R21 creates the Provider Adapter Stub With No Network.

## 3. Non-Implementation Statement

- No live adapter is implemented.
- No provider-specific behavior is implemented.
- No real Model API Layer is implemented.
- No provider SDK is imported.
- No API key or secret is required.
- No network call is performed.
- No live provider test is added.
- No provider dependency is added.
- No fake live-provider success is returned.
- No successful provider response is produced.

## 4. Stub Behavior

- `capabilities()` returns no-network capabilities.
- `health()` returns no-network health.
- `invoke(input)` validates input and returns a structured refusal.
- invoke always refuses live execution.
- invoke returns `future_live_not_enabled` or `unavailable`.
- invoke returns ok false.
- invoke does not return provider output.
- invoke does not return fake model text.
- invoke does not write Ledger.
- invoke does not write files.

## 5. Capability Rules

- supports_live_network false.
- supports_mock_compatible_interface true.
- requires_api_key false.
- imports_provider_sdk false.
- performs_network_call false.
- stores_raw_prompt false.
- stores_raw_output false.
- writes_ledger_directly false.
- max_output_trust_tier T1.

## 6. Health Rules

- Live network unavailable.
- Provider SDK unavailable.
- API key unavailable.
- Mock-compatible interface available.
- Status future_live_not_enabled, disabled, or unavailable.

## 7. Invocation Rules

- Input must use refs/digests.
- Raw prompt not included.
- API key not included.
- Network not allowed.
- Provider SDK not allowed.
- No raw output returned.
- No successful provider result returned.
- No fake live-provider success.

## 8. Trust Rules

- Stub execution does not promote trust.
- Stub availability does not promote trust.
- Provider identity does not promote trust.
- Successful provider response does not promote trust.
- Raw provider output starts at T0.
- Schema-valid provider output may reach T1 only.
- Provider output is not deterministic Hollow evidence.
- Stub refusal is not model evidence.
- T2 requires verified deterministic Hollow evidence through VRP.

## 9. Safety Rules

- Raw prompt text must not be present.
- Raw model output text must not be present.
- API keys must not be present.
- Secrets must not be present.
- Environment values must not be present.
- Credentials must not be present.
- Auth tokens must not be present.
- Private keys must not be present.
- No network is enforced.
- No provider SDK is enforced.
- No Ledger write is enforced.
- No file write is enforced.

## 10. Future Use

This prepares for one provider adapter behind explicit opt-in, ledgered live invocation record, live single_pass adapter MVP, Hollow-verified final answer path, and role rotation runtime planning.

## 11. Acceptance Verdict

Provider Adapter Stub With No Network: Accepted
Status: Offline provider adapter stub complete; no live provider behavior implemented
Next phase: One provider adapter behind explicit opt-in planning

# One Provider Adapter Type Extension

R23 adds a static type extension, deterministic validators, examples, and acceptance checks for a future first provider adapter boundary.

R24 extends this surface with the dedicated One Provider Adapter Config Contract in `docs/ONE_PROVIDER_ADAPTER_CONFIG_CONTRACT.md`.

## Scope

This pass defines the shape of a one-provider adapter contract. It does not implement a live adapter, provider-specific runtime behavior, provider SDK integration, or live test path.

No live adapter is implemented.
No provider-specific behavior is implemented.
No real Model API Layer is implemented.
No provider SDK is imported.
No API key or secret is required.
No network call is performed.
No live provider test is added.
No provider dependency is added.
No runtime behavior is changed.
No real provider is selected unless explicitly authorized by the user.

## Trust Guardrails

Provider slot selection does not promote trust.
Explicit opt-in does not promote trust.
API key presence does not promote trust.
Network success does not promote trust.
Provider identity does not promote trust.
Successful provider response does not promote trust.
Raw provider output starts at T0.
Schema-valid provider output may reach T1 only.
Provider output is not deterministic Hollow evidence.
T2 requires verified deterministic Hollow evidence through VRP.

## Safety And Storage

The contract names environment variables, allowlist identifiers, status refs, digests, and provenance requirements only. It rejects API key values, raw prompt text, raw output text, secrets, credentials, private keys, and environment values at the top level of validated R23 objects.

Ledger compatibility is provenance-only. Storage compatibility preserves the runtime storage boundary and does not treat persistence or retrieval as verification.

## Acceptance Verdict

One Provider Adapter Type Extension: Accepted
Status: First-provider type extension complete; no provider implementation
Next phase: One provider adapter config contract

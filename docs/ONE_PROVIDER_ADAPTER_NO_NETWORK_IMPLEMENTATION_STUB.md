# One Provider Adapter No-Network Implementation Stub

## 1. Purpose

This pass creates a no-network implementation stub for the first-provider adapter lane that consumes the R24 config contract and refuses live execution deterministically.

R26 defines the future opt-in evidence contract in `docs/ONE_PROVIDER_ADAPTER_OPT_IN_HARNESS_CONTRACT.md`; live execution remains disabled.

This pass does not implement a live adapter.
This pass does not implement provider-specific behavior.
This pass does not implement a real Model API Layer.
This pass does not add provider SDKs.
This pass does not require API keys.
This pass does not read API key values.
This pass does not read process.env.
This pass does not perform network calls.
This pass does not create live provider tests.
This pass does not return fake live-provider success.
This pass does not return successful provider output.

## 2. Relationship To R8-R24

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
- R22 locked One Provider Adapter Behind Explicit Opt-In Planning.
- R23 created the One Provider Adapter Type Extension.
- R24 created the One Provider Adapter Config Contract.
- R25 creates the One Provider Adapter No-Network Implementation Stub.

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
No runtime provider behavior is enabled.
No real provider is selected unless explicitly authorized by the user.
No fake live-provider success is returned.
No successful provider response is produced.

## 4. Stub Behavior

`createOneProviderAdapterNoNetworkImplementationStub(configDocument)` validates the supplied R24 config document and returns deterministic `capabilities()`, `health()`, and `invoke(invocation)` functions. Invocation validates config before invocation and returns deterministic refusal.

The stub performs no env read, no API key read, no provider call, no network call, no provider SDK use, no Ledger write, no file write, no fake success, and no provider output.

## 5. Config Consumption Rules

The stub consumes R24 config document data only. Config validity does not promote trust. Config presence does not enable opt-in. Config is data only. Config does not cause process.env reads, network behavior, or API key reads.

## 6. Capabilities Rules

`consumes_config_contract` true.
`supports_no_network_invocation` true.
`supports_live_network` false.
`supports_provider_sdk` false.
`requires_api_key_value` false.
`reads_process_env` false.
`reads_api_key_value` false.
`performs_network_call` false.
`writes_ledger` false.
`writes_files` false.
`returns_provider_output` false.
`returns_fake_success` false.
`max_output_trust_tier` T1.

## 7. Health Rules

Live provider disabled.
Network unavailable.
Provider SDK unavailable.
API key value unavailable.
process.env not read.
Opt-in absent unless passed as explicit data.
Health status does not promote trust.

## 8. Invocation Rules

Route mode is `single_pass`.
Config document required.
Request digest/ref required.
Redaction result ref required.
Safety profile id required.
Opt-in absent returns refusal.
Missing opt-in cannot fall back to fake success.
Provider call not attempted.
Network call not attempted.
Provider SDK not used.
process.env not read.
API key value not read.
No provider output returned.
No successful LiveAdapterResponse returned.

## 9. Trust Rules

Config validity does not promote trust.
Config presence does not enable opt-in.
Stub execution does not promote trust.
Stub refusal is not model evidence.
Provider slot selection does not promote trust.
Explicit opt-in does not promote trust.
API key env var name does not promote trust.
API key presence does not promote trust.
Network success does not promote trust.
Provider identity does not promote trust.
Successful provider response does not promote trust.
Raw provider output starts at T0.
Schema-valid provider output may reach T1 only.
Max provider output trust tier is T1.
Provider output is not deterministic Hollow evidence.
Verified final truth is not claimed from provider output alone.
T2 requires verified deterministic Hollow evidence through VRP.

## 10. Safety Rules

Raw prompt text must be blocked.
Raw output text must be blocked.
API key values must be blocked.
Secrets must be blocked.
Env values must be blocked.
Credentials must be blocked.
Auth tokens must be blocked.
Private keys must be blocked.
process.env reads are blocked.
Network calls are blocked.
Provider SDK usage is blocked.
Ledger writes are blocked.
File writes are blocked.
Fake success is blocked.
Provider output is blocked.

## 11. Future Use

This prepares for One Provider Adapter Opt-In Harness Contract, One Provider Adapter Opt-In Harness, One Provider Adapter Live Test Plan, One Provider Adapter Implementation Behind Explicit Opt-In, Ledgered Live Invocation Record, Live single_pass Adapter MVP, and Hollow-Verified Final Answer Path.

## 12. Acceptance Verdict

One Provider Adapter No-Network Implementation Stub: Accepted
Status: Config-consuming no-network provider stub complete; live execution still disabled
Next phase: One provider adapter opt-in harness contract

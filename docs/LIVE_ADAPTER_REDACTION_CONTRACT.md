# Live Adapter Redaction Contract

## 1. Purpose

R19 creates the redaction contract for future live adapter requests and responses before any live provider implementation exists. It defines policy, manifest, digest/ref, audit, safety compatibility, and trust metadata shapes so future adapter work has a strict boundary.

This pass does not implement a live adapter.
This pass does not implement provider stub behavior.
This pass does not implement a full redaction engine.
This pass does not implement a real Model API Layer.
This pass does not add provider SDKs.
This pass does not require API keys.
This pass does not perform network calls.

## 2. Relationship To R8-R18

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
- R19 creates Live Adapter Redaction Contracts.

## 3. Non-Implementation Statement

- No live adapter is implemented.
- No provider stub is implemented.
- No full redaction engine is implemented.
- No real Model API Layer is implemented.
- No provider SDK is imported.
- No API key or secret is required.
- No network call is performed.
- No live provider test is added.
- No provider dependency is added.

## 4. Redaction Contract Shape

The R19 contract shape includes redaction policy, redaction scope, sensitive categories, redaction actions, redaction manifest, redaction result, redaction audit summary, digest refs, allowed content declaration, blocked content declaration, safety profile compatibility, and trust summary.

The policy states what is allowed, what is blocked, which scopes it applies to, which sensitive categories it recognizes, and what default action applies. The manifest records refs, digests, field names, blocked fields, allowed fields, and detected categories. The result carries digest refs, audit metadata, compatibility metadata, warnings, errors, and trust summary only.

## 5. Policy Rules

- Raw prompt disallowed.
- Raw output disallowed.
- Ledger raw prompt disallowed.
- Ledger raw output disallowed.
- Runtime storage raw prompt disallowed.
- Runtime storage raw output disallowed.
- Raw transcript storage requires future boundary.
- Default action must block/remove/ref/digest/summarize only.

## 6. Manifest Rules

- Manifest records refs/digests/field names/categories only.
- Manifest does not store raw prompt.
- Manifest does not store raw output.
- Manifest does not store API keys.
- Manifest does not store secrets.
- Manifest does not store env values.
- Manifest records removed/blocked field names and sensitive categories.

## 7. Result Rules

- Redaction result does not carry raw prompt text.
- Redaction result does not carry raw output text.
- Redaction result does not carry API keys/secrets/env values.
- Redaction result may carry digest refs, warnings, errors, audit summary, and trust summary.
- Redaction result does not verify truth.

## 8. Trust Rules

- Redaction reduces exposure risk; it does not verify truth.
- Redaction does not promote trust.
- Redaction metadata does not promote trust.
- Provider identity does not promote trust.
- Successful provider response does not promote trust.
- Ledger presence does not promote trust.
- Storage does not increase trust.
- Retrieval is not trust promotion.
- Redacted output is not deterministic Hollow evidence.
- Redacted output is not verified truth.
- Live provider output remains capped at T1.
- Live provider output remains capped at T1 unless future Hollow verification through VRP changes it.
- T2 requires verified deterministic Hollow evidence through VRP.

## 9. Content Safety Rules

- Raw prompt text must not be present.
- Raw model output text must not be present.
- API keys must not be present.
- Secrets must not be present.
- Environment values must not be present.
- Credentials must not be present.
- Auth tokens must not be present.
- Private keys must not be present.
- Refs/digests/summaries are preferred.

## 10. Future Use

This contract prepares for a live adapter mock-compatible interface, provider adapter stub with no network, one provider adapter behind explicit opt-in, ledgered live invocation record, live single_pass adapter MVP, Hollow-verified final answer path, and role rotation runtime planning.

## 11. Acceptance Verdict

Live Adapter Redaction Contract: Accepted
Status: Redaction policy and metadata contracts complete; no live adapter implemented
Next phase: Live adapter mock-compatible interface

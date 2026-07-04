# One Provider Adapter Implementation Skeleton Behind Explicit Opt-In

Status: Inert skeleton only
Prior pass: R30 — One Provider Adapter Live Test Harness Contract

## 1. Purpose

R31 creates an inert provider adapter skeleton and explicit opt-in gate contract in code.

No live provider adapter is added.
No provider SDK/package changes are added.
No API-key or process.env reads are added.
No network calls or live execution are added.
No fake provider success or provider output is added.

## 2. Skeleton Behavior

The skeleton is disabled by default.
The skeleton requires explicit opt-in passed as input data.
The skeleton returns disabled, blocked, or not-run states only.
The skeleton never returns provider content.
The skeleton never simulates provider success.

The explicit opt-in gate evaluates supplied input data only. It does not read environment variables, API key values, files, Ledger records, storage, network state, or provider SDK state.

## 3. Trust Lock

Raw provider output = T0.
Schema-valid provider output = T1 maximum.
T2 requires VRP-verified deterministic Hollow evidence.

Provider/model output is not deterministic Hollow evidence.
Explicit opt-in does not promote trust.
API key presence does not promote trust.
Network success does not promote trust.
Provider identity does not promote trust.
Successful provider response does not promote trust.

## 4. Non-Implementation Boundary

R31 does not add live provider behavior, provider calls, SDK imports, package dependency changes, API-key reads, process.env reads, fetch/http/network calls, live tests, live execution, fake provider success, provider output, provider-response trust promotion, Ledger writes from provider behavior, or storage-backed trust promotion.

## 5. Catalog Invariants

V1 Hollow catalog remains 12.
Hollowcut catalog remains 9.

## 6. Acceptance Verdict

One Provider Adapter Implementation Skeleton Behind Explicit Opt-In: Accepted
Status: Inert provider adapter skeleton locked; no live provider behavior added
Next phase: One provider adapter disabled-by-default live harness scaffold

R32 forward reference: The next pass may add an inert disabled-by-default live harness scaffold, but it must not add live provider behavior, SDKs, API-key reads, process.env reads, network calls, fake provider success, provider response simulation, provider output, or trust promotion.

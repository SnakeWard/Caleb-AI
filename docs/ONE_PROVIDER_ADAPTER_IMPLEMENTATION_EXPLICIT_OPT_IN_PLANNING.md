# One Provider Adapter Implementation Behind Explicit Opt-In Planning

Status: Planning-only boundary
Prior pass: R28 — One Provider Adapter Live Test Plan

## 1. Purpose

R29 creates a planning-only boundary for a future one-provider adapter implementation behind explicit opt-in.

No provider implementation is added in R29.
No live adapter is added in R29.
No provider-specific runtime behavior is added in R29.
No SDK or package change is allowed in R29.
No API-key read is allowed in R29.
No process.env read is allowed in R29.
No network calls are allowed in R29.
No live tests are allowed in R29.
No live execution is allowed in R29.
No fake provider success is allowed in R29.
No provider output is allowed in R29.

## 2. Prior State

R28 completed the One Provider Adapter Live Test Plan. Live-test planning is locked, no live tests are implemented, and all default test and acceptance paths remain offline.

## 3. Non-Implementation Boundary

R29 must not add provider implementation, live adapter behavior, provider-specific runtime behavior, SDK imports, provider dependencies, package changes, API-key handling, process.env reads, network calls, live tests, live execution, fake provider success, provider output handling, provider-output trust promotion logic, provider Ledger runtime writes, or storage-backed trust promotion.

## 4. Trust Tier Lock

Raw provider output = T0.
Schema-valid provider output = T1 maximum.
T2 requires VRP-verified deterministic Hollow evidence.

Provider/model output is not deterministic Hollow evidence.

## 5. Non-Promotion Lock

Explicit opt-in does not promote trust.
API key presence does not promote trust.
Network success does not promote trust.
Provider identity does not promote trust.
Successful provider response does not promote trust.
Ledger presence does not promote trust.
Storage does not increase trust.

Opt-in, API key presence, network success, provider identity, successful provider response, Ledger presence, and storage do not promote trust.

## 6. Future Implementation Boundary

Future adapter implementation must be behind explicit opt-in.
Future live harness must remain skipped by default.
Future live harness must not run in normal test commands.
Future live harness must not run in default CI commands.
Future live harness must not run in default acceptance commands.
Future provider output must be treated as model/provider evidence, not Hollow evidence.

Future implementation must preserve the R28 live-test boundary and the R27 offline opt-in harness boundary until a later pass explicitly authorizes implementation.

R30 creates the live test harness contract only. It does not add provider implementation, live adapter behavior, SDKs, API-key reads, process.env reads, network calls, live execution, fake provider success, or provider output.

## 7. Catalog Invariants

V1 Hollow catalog remains 12.
Hollowcut catalog remains 9.

## 8. Acceptance Verdict

One Provider Adapter Implementation Behind Explicit Opt-In Planning: Accepted
Status: Provider implementation boundary locked; no provider implementation added
Next phase: One provider adapter live test harness contract

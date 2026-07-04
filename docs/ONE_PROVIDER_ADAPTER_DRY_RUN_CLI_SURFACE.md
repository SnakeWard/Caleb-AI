# One Provider Adapter Dry-Run CLI Surface Behind Explicit Opt-In

Status: Inert CLI dry-run surface only
Prior pass: R33 — One Provider Adapter Dry-Run Report Contract

## 1. Purpose

R34 adds a CLI-accessible dry-run surface for the one-provider adapter path.

No live provider adapter is added.
No provider SDK/package changes are added.
No API-key or process.env reads are added.
No network calls or live execution are added.
No fake provider success, provider response simulation, provider output, or provider content is added.

## 2. CLI Command

```text
npm run --silent cli -- one-provider-adapter-dry-run --json
npm run --silent cli -- one-provider-adapter-dry-run --explicit-opt-in true --explicit-live-request true --json
```

The command exposes explicit opt-in as CLI input data only.
The command exposes explicit live request as CLI input data only.

## 3. CLI States

The CLI returns skipped/not-run without explicit opt-in.
The CLI returns skipped/not-run without explicit live request.
The CLI returns blocked/not-run when opt-in and live request are present but live execution is unavailable.
The CLI returns report-only output.
The CLI performs no provider execution.
The CLI returns no provider content.
The CLI performs no trust promotion.

Expected dry-run states exit 0. Invalid CLI usage or malformed dry-run flags may exit nonzero.

## 4. Locked Report Fields

network_attempted is false.
provider_execution_attempted is false.
provider_response_received is false.
provider_output_present is false.
provider_content_present is false.
provider_output_trust_ceiling is T1.
vrp_evidence_required_for_T2 is true.

## 5. Trust Lock

Raw provider output = T0.
Schema-valid provider output = T1 maximum.
Dry-run CLI report presence does not promote trust.
Explicit opt-in does not promote trust.
Explicit live request does not promote trust.
Ledger presence does not promote trust.
Storage does not increase trust.
T2 requires VRP-verified deterministic Hollow evidence.

## 6. Non-Implementation Boundary

R34 does not add live provider behavior, provider calls, SDK imports, package dependency changes, API-key reads, process.env reads, fetch/http/network calls, live tests that run by default, live execution, fake provider success, provider response simulation, provider output, provider content fields, provider-response trust promotion, Ledger writes from provider behavior, storage writes, or storage-backed trust promotion.

## 7. Catalog Invariants

V1 Hollow catalog remains 12.
Hollowcut catalog remains 9.

## 8. Acceptance Verdict

One Provider Adapter Dry-Run CLI Surface Behind Explicit Opt-In: Accepted
Status: Dry-run CLI surface locked; no live provider behavior added
Next phase: One provider adapter live prerequisites contract

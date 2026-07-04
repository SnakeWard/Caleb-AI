# V1 Test and Fixture Plan

This file defines tests and fixtures before coding.

## Testing Philosophy

Tests MUST prove existing behavior remains intact, not only that new behavior exists. V1 tests SHOULD be deterministic, local, fast, and focused on contracts, validation, Ledger behavior, and Verified Return Path behavior.

Tests MUST NOT be fake tests that only assert placeholders exist. Tests MUST fail when schemas drift, Ledger entries are missing, or raw Hollow output bypasses verification.

## Required Test Commands

Use these once the project has scripts:

- `npm test`
- `npm run typecheck`
- `npm run build`

If scripts do not exist yet, Pass 00 MUST add them.

## First 12 Hollow Test Fixtures

| # | Hollow | Fixture Purpose |
| --- | --- | --- |
| 1 | Character Count Hollow | Verify deterministic text measurement. |
| 2 | Prompt Limit Hollow | Verify prompt length limits and boundary handling. |
| 3 | Section Balance Hollow | Verify section counting and imbalance warnings. |
| 4 | Repetition Scan Hollow | Verify repeated phrase detection. |
| 5 | File Hash Hollow | Verify scoped file hashing. |
| 6 | JSON Schema Validator Hollow | Verify schema pass and fail cases. |
| 7 | Line Count Hollow | Verify deterministic line counting. |
| 8 | Placeholder Detector Hollow | Verify detection of placeholders, stubs, fake TODO completion, and empty implementations. |
| 9 | Audio Duration Hollow | Verify media duration extraction when authorized. |
| 10 | Video Duration Hollow | Verify video duration extraction when authorized. |
| 11 | Aspect Ratio Hollow | Verify media dimensions and ratio reporting when authorized. |
| 12 | Ledger Provenance Hollow | Verify Ledger provenance and reference consistency. |

## Schema Validation Fixtures

- Valid `HollowManifest`.
- Missing required `hollow_id`.
- Invalid `permissions` value.
- Invalid `trust_tier`.
- Valid `EvidencePacket`.
- Evidence packet with unverified raw output incorrectly marked as `T2`.
- Valid `LedgerEntry`.
- Ledger entry missing `run_id`, `trace_id`, or `status`.

## Verified Return Path Fixtures

- Raw Hollow output enters as `T0`.
- Schema-valid output can rise to `T1`.
- Deterministic checked output can rise to `T2`.
- Provenance and policy-cleared output can rise to `T3`.
- Human-approved authoritative output can rise to `T4`.
- Failed validation MUST block trusted return.
- Warning-bearing output MUST preserve warnings in the return packet and Ledger.

## Ledger Fixtures

- Every Hollow invocation creates one Ledger entry.
- Failed Hollow invocation creates a Ledger entry with errors.
- Warning-only Hollow invocation creates a Ledger entry with warnings.
- Artifact-producing Hollow records artifact hashes.
- Snapshot creation creates a Ledger entry after Auto Snapshot and Change Guard exists.
- Rollback creates a Ledger entry after Auto Snapshot and Change Guard exists.

## Report Builder Fixtures

- Report includes run summary.
- Report includes Hollow invocation statuses.
- Report includes warnings and errors.
- Report includes trust tiers.
- Report includes artifact references.
- Report includes Ledger references.

## Regression Rules

- New Hollows MUST include schema validation tests.
- New permissions MUST include denial tests.
- Ledger format changes MUST include migration or compatibility tests.
- Verified Return Path changes MUST include trust-tier transition tests.
- Bug fixes MUST include regression coverage when code exists.

## Placeholder Detection Rules

Tests and implementation MUST detect and reject work presented as complete when it contains:

- placeholder modules
- empty stubs
- fake passing tests
- TODO-only implementation
- hardcoded fixture answers presented as real logic
- missing Ledger writes
- missing schema validation

## Definition of Done

V1 work is done only when:

- contracts are implemented using canonical field names
- Hollow output passes through the Verified Return Path
- every Hollow invocation creates a Ledger entry
- permissions are declared and enforced
- tests cover success, failure, and regression cases
- `npm test`, `npm run typecheck`, and `npm run build` pass once scripts exist

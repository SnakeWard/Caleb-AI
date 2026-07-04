# Snapshot Claim Integrity Gate

Status: Deterministic integrity gate
Prior incident: R36 fabricated snapshot claim caught and corrected

## 1. Purpose

R37 validates snapshot IDs claimed in PLANS.md against actual `.caleb/snapshots` records. During R36, a pre-change snapshot ID was written into PLANS.md before the corresponding `create-milestone-snapshot` command was run, producing a claimed snapshot ID that did not exist on disk. It was caught by manual cross-checking and corrected. R37 converts that manual check into a deterministic, repeatable gate.

This is not a provider feature.

## 2. What This Gate Enforces

The Ledger records provenance for snapshot-creating actions, but it does not, by itself, verify that every snapshot ID *referenced in prose* (for example, inside a PLANS.md ExecPlan entry) actually exists as a snapshot on disk. This gate enforces that referential integrity: it checks the claim against the record, rather than trusting the claim.

This converts manual validation into deterministic acceptance. A human (or an agent) no longer needs to remember to cross-check every claimed snapshot ID by hand; the gate does it the same way every time, given the same PLANS.md content and the same `.caleb/snapshots` directory listing.

## 3. Validator Behavior

The validator parses snapshot-like IDs claimed in PLANS.md, identifies IDs matching the canonical `snap_..._milestone` pattern, and compares them against the actual entries in `.caleb/snapshots`. It reports:

- `missing_snapshot_ids` — canonically formatted claims that do not exist on disk (the R36 failure mode).
- `invalid_snapshot_claims` — snapshot-like tokens that do not match the canonical ID format.
- `duplicate_snapshot_claims` — IDs claimed more than once in the checked file (informational only; does not fail the gate).
- `allowed_missing_snapshot_ids` — an explicit, caller-supplied list of documented historical exceptions (for example, pre-sequencing manual snapshots) that are not treated as failures.

The validator is a pure, deterministic function over its inputs (file content plus a snapshot ID list). A thin wrapper performs the only real I/O: reading `PLANS.md` and listing `.caleb/snapshots`. The validator never mutates `PLANS.md`, never creates a snapshot, and never writes a Ledger entry.

## 4. Non-Implementation Boundary

R37 does not add live execution, network calls, API-key reads, `process.env` reads, a provider SDK, a package dependency change, or a UI. This is a local, deterministic, read-only integrity check.

V1 Hollow catalog remains 12.
Hollowcut catalog remains 9.

## 5. Required Report Fields

- `report_id`
- `validator_id`
- `checked_file`
- `snapshot_root`
- `claimed_snapshot_ids`
- `existing_snapshot_ids`
- `missing_snapshot_ids`
- `invalid_snapshot_claims`
- `duplicate_snapshot_claims`
- `allowed_missing_snapshot_ids`
- `passed`
- `errors`
- `warnings`
- `created_at`

## 6. Future Note

This gate may later become a registered Change Guard Hollow, invoked automatically as part of the snapshot/rollback discipline. R37 does not register it into any catalog: it adds no V1 Hollow and no Hollowcut Hollow. V1 catalog remains 12 and Hollowcut catalog remains 9.

## 7. Acceptance Verdict

Snapshot Claim Integrity Gate: Accepted
Status: Snapshot reference integrity locked; fabricated snapshot claims are structurally detectable
Next phase: One provider adapter live prerequisites CLI surface

# Storage and Ledger Decisions

This file freezes V1 storage decisions.

## V1 Decisions

- V1 Ledger uses JSONL.
- V1 snapshots use the filesystem under `.caleb/snapshots/`.
- V1 schemas are local repo files.
- V1 reports are local generated text and JSON.
- V1 artifacts are local references.
- V1 does not require Postgres, cloud storage, or an external database.
- V1 MAY later migrate to SQLite, Postgres, or Merkle logs, but not during the first Hollow Server MVP unless explicitly authorized.

## Required Folder Proposal

```text
.caleb/
  ledger/
    ledger.jsonl
    snapshots.jsonl
  snapshots/
  reports/
```

## Ledger Properties

- The V1 Ledger MUST be append-only.
- Every Hollow invocation MUST create a Ledger entry.
- Snapshot creation and rollback MUST create Ledger entries after Auto Snapshot and Change Guard exists.
- Ledger entries MUST record hashes, status, trust tier, warnings, errors, and artifact refs.
- Ledger writes are allowed in V1 as part of the local deterministic foundation.
- Ledger records MUST NOT treat raw Hollow output as trusted.

## Storage Boundaries

- V1 MUST keep storage local.
- V1 MUST NOT require cloud storage.
- V1 MUST NOT require production auth.
- V1 MUST NOT introduce external database dependencies unless explicitly authorized.

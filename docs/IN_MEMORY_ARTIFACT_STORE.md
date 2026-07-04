# In-Memory Artifact Store Prototype

## 1. Purpose

This is the first runtime store prototype for RuntimeStorageRecord objects. It provides deterministic process-memory insert, read, query, replace, delete, snapshot, restore, and stats behavior using the R9 runtime storage type contracts.

The store validates records before insertion and replacement. It does not decide truth, promote trust, call models, run roles, invoke Hollows, write Ledger entries, or persist artifacts.

## 2. Relationship To R8 And R9

- R8 locked the Runtime/Storage Planning Boundary.
- R9 created static Runtime Storage Type Contracts.
- R10 implements a non-persistent in-memory prototype using those contracts.

## 3. Non-Persistence Statement

- No filesystem storage is implemented.
- No database is implemented.
- No JSONL artifact store is implemented.
- No cloud persistence is implemented.
- No vector database is implemented.
- No model adapter is implemented.
- No role runtime is implemented.
- No UI storage is implemented.
- This store is process-memory only.

## 4. Trust Rules

- Storage does not increase trust.
- Persistence is not verification.
- Retrieval is not trust promotion.
- In-memory storage is not verification.
- Store insertion does not promote trust.
- Store retrieval does not promote trust.
- Store queries do not promote trust.
- VRP remains the trust gate.

The store preserves existing trust_tier and validation_status fields after validator acceptance. It does not generate trust, ledger refs, verification refs, or authority claims.

## 5. Store Capabilities

- insert
- get
- has
- query
- list
- replace
- delete
- clear
- snapshot
- restoreFromSnapshot
- stats
- getByTask
- getByRun
- getEvidenceUsableForFinal

The snapshot capability returns an in-memory store snapshot object only. It is not an Auto Snapshot / Change Guard filesystem snapshot and does not write to `.caleb`.

## 6. Guardrails

- validates every insert
- rejects invalid trust promotion
- rejects duplicate IDs
- uses defensive copies
- does not write ledger
- does not write files
- does not create snapshots in .caleb
- does not call models
- does not call Hollows

Replacement is explicit and must pass the same validator as insertion. Queries and retrieval return copies so callers cannot mutate the store's internal state.

## 7. Future Use

This store prepares for:

- mocked single_pass model boundary
- ledgered model invocation record
- persistent artifact store
- full role rotation runtime
- Thinking Mode trace display

Future passes must continue to prove that storage, retrieval, and persistence do not promote trust.

## 8. Acceptance Verdict

In-Memory Artifact Store Prototype: Accepted
Status: Non-persistent runtime store prototype complete; trust promotion blocked
Next phase: Mocked single_pass model boundary

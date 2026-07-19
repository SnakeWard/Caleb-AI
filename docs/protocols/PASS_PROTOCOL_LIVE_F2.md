# Caleb AI — Pass Protocol LIVE-F2

**Authorized by:** Pat, 2026-07-19  
**Origin:** Two LIVE-R2 E1 attempts shared one deterministic `plan_id`. The
existing Ledger reconstruction selected the first matching execution start and
the last matching terminal record, allowing records from separate attempts to
be stitched into a false successful reconstruction.

## Purpose

1. Mint one unique post-H4 `execution_id` at the LE-3 seam entry for every
   execution attempt. `plan_id` identifies what is being executed;
   `execution_id` identifies which attempt.
2. Carry that `execution_id` through every Ledger entry created for the attempt.
3. Reconstruct execution chains by execution identity and never combine records
   from different identities.
4. Refuse with the distinct code `reconstruction_ambiguous` when reconstruction
   is requested by `plan_id` alone and more than one execution attempt exists.
5. Preserve the LE-3-A reconstructability lock under execution-keyed lookup.
6. Record the standing live-event doctrine: humans execute live events from a
   host shell; agents build and validate offline only.

## Binding implementation envelope

- Add `execution_id` through the central post-H4 identifier factory. Production
  IDs are unique and non-deterministic; tests may inject a bounded factory.
- Mint the ID at seam entry so success, refusal, and runtime-failure attempts all
  have an identity. Every start, invocation, terminal, and refusal Ledger entry
  written by that attempt carries the same identity.
- Reconstruction with an explicit `execution_id` considers only records carrying
  both that `plan_id` and that `execution_id` and verifies the existing lineage
  pins inside that identity.
- Reconstruction without an `execution_id` remains valid only when the plan has
  exactly one identifiable execution attempt. Multiple identities refuse with
  `reconstruction_ambiguous`; they are never guessed, ordered, or stitched.
- Preserve compatibility for a single historical pre-LIVE-F2 chain without an
  `execution_id`; mixed identified/unidentified or multi-attempt historical
  records fail closed rather than being combined.
- Add a permanent fixture reproducing the E1 false-ok shape: the first attempt's
  start precedes the second attempt's terminal for one shared `plan_id`. Detectors
  must prove plan-only lookup refuses and explicit lookups reconstruct only their
  own attempt.
- Amend the LE-3-A acceptance lock visibly so reconstructability remains pinned
  under execution-keyed lookup.
- Amend `docs/01_CODEX_OPERATING_CONTRACT.md` to state that live events are run by
  the human from a host shell. Agent processes may prepare, validate, and inspect
  results offline but do not execute provider calls. The doctrine records the E1
  sandbox/process-tree findings without treating either failure as provider
  evidence.

## Expected files

- `src/ledger/idFactory.ts` and its barrel/tests for the post-H4 ID.
- `src/logicEngine/rotationExecutionSeam.ts` for seam identity and reconstruction.
- Focused logic, fixture, and acceptance tests, including the LE-3-A lock.
- `docs/01_CODEX_OPERATING_CONTRACT.md`, a LIVE-F2 report/audit manifest,
  `PLANS.md`, `docs/STATUS_LOG.md`, and the append-only snapshot Ledger.

## Prohibited changes

- No live provider calls.
- No provider adapter, provider transport, fetch, endpoint, header, credential
  closure, retry, prompt, model, budget, CLI, route, registry, or configuration
  changes.
- No edits to historical Ledger records. Snapshot tooling may append its normal
  record only.
- No reinterpretation of either LIVE-R2 E1 failure and no acceptance claim for a
  live rotation.

## Required detectors

1. Two attempts for one `plan_id` receive distinct `execution_id` values.
2. Every Ledger record for an attempt carries its exact `execution_id`, including
   pre-execution refusal and runtime failure paths.
3. Explicit reconstruction returns only the selected attempt and verifies its
   start, invocation, terminal, and parent-reference lineage.
4. Plan-only reconstruction of the permanent two-attempt fixture returns
   `reconstruction_ambiguous` and no chain.
5. Identified and legacy-unidentified records cannot be cross-stitched.
6. Existing single-attempt behavior and the LE-3-A reconstructability pin remain
   green.
7. The operating-contract lock states human host-shell execution, agent offline
   build/validation, and the E1 rationale.
8. Provider/CLI/transport/prompt/config diffs are empty.

## Validation and stop

Commit and push this protocol, then create and verify a pre-change snapshot.
Run focused LIVE-F2, seam, LE-3, and LE-3-A detectors; canonical offline tests;
canonical governed-pass typecheck; build; AUD-2; and prohibited-surface diffs.
Commit and push on a clean synchronized tree, report the offline verdict, and
STOP. LIVE-F2 does not authorize a live event.

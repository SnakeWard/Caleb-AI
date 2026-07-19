# LIVE-F2 Execution-Instance Ledger Identity Report

- Status: Accepted offline
- Date: 2026-07-19
- Protocol commit: `6a61d90`
- Pre-change snapshot: `snap_20260719T062326038Z_000420_milestone`

## Result

Every call to the guarded rotation seam now mints one post-H4
`execution_<uuid>` before the first gate. `plan_id` remains the deterministic
identity of what Caleb should execute; `execution_id` is the identity of which
attempt entered the seam. Success, refusal, start-write suppression, runtime
failure, and terminal-write failure results retain that ID.

Every start, role-invocation, terminal, and refusal Ledger record produced by an
attempt carries the same `execution_id` in both its bounded result and
provenance. The seam schema version is `1.1.0`. The central ID contract now
includes `createExecutionId()` and locks UUID format, process uniqueness, and
restart independence; the canonical naming contract registers the field and its
no-cross-identity rule.

## Reconstruction repair

Reconstruction now selects an execution identity before it selects a start,
invocations, or terminal. With an explicit ID, records from every other identity
are excluded. Without one, a plan is reconstructable only when it has exactly one
identifiable attempt (or one complete legacy pre-LIVE-F2 chain). Multiple IDs,
mixed identified/unidentified records, or multiple legacy attempt markers return:

```json
{"ok":false,"chain":null,"refusal_code":"reconstruction_ambiguous","errors":["reconstruction_ambiguous"]}
```

Within the selected attempt, result/provenance identity agreement, one start,
one terminal, bridge/start/invocation parent references, terminal invocation-ID
order, and completed-step count are verified before `ok:true`.

## Historical false-ok detector

Permanent fixture:
`tests/fixtures/live-f2/repeated-plan-attempts.false-ok.jsonl`.

The fixture proves the pre-LIVE-F2 first/last algorithm would select attempt 1's
start and attempt 2's terminal for one shared plan. Plan-only reconstruction now
refuses `reconstruction_ambiguous`; explicit reconstruction returns exactly the
selected attempt. A direct offline check against the original E1 records in the
project Ledger also returns `reconstruction_ambiguous` for
`plan_af0be112-cce8-52f5-a80c-ce4511590832`.

## LE-3-A and operating doctrine

The LE-3 golden-chain acceptance now passes its seam-minted `execution_id` to
reconstruction and asserts the reconstructed identity. The LE-3-A lock visibly
pins that call, the ambiguity refusal, and result/provenance agreement. Its
original guarded-execution verdict remains accepted.

The operating contract now assigns every live event to the human operator in a
host shell. Agents build and validate offline, prepare bounded commands and
fixtures, and inspect safe records; they do not execute provider calls. The rule
cites E1's inherited credential-shaped variable and non-diagnostic network
failure findings without treating either as provider evidence.

## Validation

- Focused LIVE-F2/ID/seam/LE-3/LE-3-A: 6 files / 59 tests, exit 0.
- Widened LIVE-R1/LIVE-F1 regression matrix: 9 files / 69 tests, exit 0.
- Canonical offline suite: 195 files / 3,157 tests, exit 0, 92.77 seconds.
- Canonical governed typecheck: exit 0.
- Build: exit 0.
- Catalog locks: V1 13; Hollowcut 9.
- Canonical validation snapshot:
  `snap_20260719T064506468Z_000422_milestone`, Ledgered and verified.
- AUD-2 self-smoke: compliant/T2 across 19 changed paths, zero violations,
  forbidden hits, or unlisted changes.

## Scope proof

No live provider call occurred. No provider adapter, provider transport, fetch,
endpoint, header, credential closure, retry, prompt, model, budget, CLI, route,
registry, package, lockfile, TypeScript config, or Vitest config changed.

## Verdict

LIVE-F2: Accepted offline — execution instances are independently identified;
reconstruction never spans identities; ambiguous multi-attempt plan lookup fails
closed; LE-3-A remains locked under the new keying. STOP before any live event.

# Ledger ID Format Contract (LG-1)

- Status: Accepted
- Date: 2026-07-07
- Amended: LIVE-F2, 2026-07-19

## Scope

This contract governs the correlation and execution ID kinds produced for Hollow
invocation, Verified Return Path evidence, their ledger entries, and guarded Role
Rotation attempts. Snapshot IDs and live provider adapter IDs are governed
separately.

## ID kinds

| Function | Format | Example shape |
| --- | --- | --- |
| `createLedgerId()` | `ledger_<uuid>` | `ledger_010befa8-...` |
| `createTaskId()` | `task_<uuid>` | `task_...` |
| `createRunId()` | `run_<uuid>` | `run_...` |
| `createTraceId()` | `trace_<uuid>` | `trace_...` |
| `createInvocationId()` | `invocation_<uuid>` | `invocation_...` |
| `createExecutionId()` | `execution_<uuid>` | `execution_...` |

`<uuid>` is a lowercase RFC-4122 UUID from Node built-in `crypto.randomUUID()`.

Regex (per kind):

```text
^<prefix>_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$
```

## Uniqueness guarantee

- No module-level counters or in-memory sequence state.
- Each factory call is independent; IDs are unique across process restarts.
- Historical counter-era ledger entries (e.g. `ledger_000001`) remain in
  `ledger.jsonl` and are not rewritten.

## Correlation rule

Within one Hollow invocation run:

- The invocation record, VRP evidence packet, and ledger entries share the same
  `task_id`, `run_id`, `trace_id`, and `invocation_id`.
- Each ledger write still receives its own distinct `ledger_id`.
- Evidence provenance carries `source_invocation_id` equal to the invocation's
  `invocation_id`.

Within guarded Role Rotation (LIVE-F2):

- Every seam entry mints one `execution_id`.
- `plan_id` identifies what is executed; `execution_id` identifies which attempt.
- Every Ledger record produced by that attempt carries the same `execution_id` in
  its bounded result and provenance.
- Reconstruction keys by `execution_id` and never combines attempt identities.

## Implementation

- Factory: `src/ledger/idFactory.ts`
- Wired from: `src/hollows/runner.ts`, `src/ledger/ledgerEntryFactory.ts`

## Out of scope

- Snapshot ID generation (`snap_<timestamp>_<sequence>_milestone`)
- Live provider adapter request/response IDs
- Logic Engine route ledger IDs (`route_<uuid>` via `createLedgerId("route")`)

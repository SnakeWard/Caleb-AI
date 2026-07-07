# Ledger ID Format Contract (LG-1)

Status: Accepted  
Date: 2026-07-07

## Scope

This contract governs the five correlation ID kinds produced for Hollow invocation,
Verified Return Path evidence, and their ledger entries. Snapshot IDs and live
provider adapter IDs are governed separately and are unchanged by LG-1.

## ID kinds

| Function | Format | Example shape |
| --- | --- | --- |
| `createLedgerId()` | `ledger_<uuid>` | `ledger_010befa8-...` |
| `createTaskId()` | `task_<uuid>` | `task_...` |
| `createRunId()` | `run_<uuid>` | `run_...` |
| `createTraceId()` | `trace_<uuid>` | `trace_...` |
| `createInvocationId()` | `invocation_<uuid>` | `invocation_...` |

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

## Implementation

Factory: `src/ledger/idFactory.ts`  
Wired from: `src/hollows/runner.ts`, `src/ledger/ledgerEntryFactory.ts`

## Out of scope

- Snapshot ID generation (`snap_<timestamp>_<sequence>_milestone`)
- Live provider adapter request/response IDs
- Logic Engine route ledger IDs (`route_<uuid>` via `createLedgerId("route")`)
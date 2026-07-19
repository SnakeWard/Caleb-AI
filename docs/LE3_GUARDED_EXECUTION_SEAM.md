# LE-3 Guarded Execution Seam

Status: Accepted

Date: 2026-07-18

Protocol: `docs/protocols/PASS_PROTOCOL_LE3.md` (`fd3663c`)

Pre-change snapshot: `snap_20260718T205307165Z_000390_milestone` (verified on disk)

## Purpose and boundary

LE-3 is Caleb AI's first authorized Role Rotation execution surface. It executes
an LE-2 `BridgedExecutablePlan` through the existing RA-R1 static executor only
after an explicit human CLI confirmation, bridge-Ledger proof, structural
revalidation, authorship recheck, mock-only binding check, and mandatory Ledger
start record.

The seam does not choose a route. It does not accept a Logic Engine route input,
invoke a provider, select a model, sequence roles dynamically, execute
capability-bearing plans, or change the RA-R1 executor. The production caller is
the explicit CLI command:

```text
caleb execute-rotation-plan --plan-file <bridged-plan.json> --confirm [--ledger-path <path>] [--json]
```

The Ledger path defaults to `.caleb/ledger/ledger.jsonl`. A custom Ledger path
keeps its role-artifact content store beside that Ledger for isolated testing.

## Entry contract

`executeBridgedRotationAtSeam()` requires:

- `human_confirmed: true`;
- an artifact carrying the complete LE-2 bridge markers;
- the successful LE-2 bridge Ledger entry;
- a `ReadonlyMap` of mock `RoleRuntimeAdapter` bindings;
- an M3 `ContentAddressedRawOutputStore`;
- a non-optional `append_ledger_entry` callback.

The matching bridge entry must be a completed
`runtime_rotation_plan_bridge` record from
`logic_engine.rotation_plan_bridge`. Its derived-plan digest, source-plan digest,
source `rrp_` reference, artifact hash/ref, parent ref, and provenance lineage must
all match the supplied plan. A plan that merely looks like RA-R1 cannot pass.

## Refusal and failure codes

| Code | Structural cause | Roles executed |
| --- | --- | --- |
| `seam_rejected_human_confirmation_required` | Human confirmation flag is not true | 0 |
| `seam_rejected_unbridged_plan` | Missing bridge markers or no exact successful bridge Ledger proof | 0 |
| `seam_rejected_invalid_plan` | RA-R1 or LE-2 structural revalidation fails | 0 |
| `seam_rejected_authorship` | Derived/source authorship is not human or fixture | 0 |
| `seam_rejected_non_mock_binding` | Plan, bridge provenance, or supplied adapter is not mock | 0 |
| `seam_rejected_mock_adapter_unavailable` | A declared mock adapter ID is absent | 0 |
| `seam_rejected_ledger_unavailable` | Required callback is absent, throws, or refuses the start record | 0 |
| RA-R1 `RoleRuntimeFailureCode` | Executor halts at an existing structural failure boundary | Completed prefix only |
| `seam_terminal_ledger_write_failed` | Terminal completion/failure record cannot be persisted | Executor result retained as failed seam output |

Refusals are Ledgered when the callback is available. Ledger unavailability itself
cannot be Ledgered, but it occurs before the first adapter invocation.

## Decision inventory

| Branch | Structural driver | Result |
| --- | --- | --- |
| Ledger callback not callable | Function type check | Refuse unavailable Ledger |
| Confirmation absent | Boolean flag | Refuse human authority |
| Bridge markers absent | Bridge schema/lineage/mandatory flags | Refuse unbridged |
| Matching bridge record absent | Stable digest plus Ledger fields | Refuse unbridged |
| Author not human/fixture | Authorship enum | Refuse authorship |
| RA-R1/bridge obligations invalid | Existing validator plus bridge fields | Refuse invalid plan |
| Any live binding | Sequence, bridge binding, adapter kind | Refuse non-mock |
| Declared adapter missing | Sequence adapter IDs versus map | Refuse unavailable mock |
| Start Ledger append fails | Required callback result | Refuse before execution |
| Adapter/artifact/store/handoff/context/record failure | Existing RA-R1 result | Halt and terminal failure entry |
| Terminal append fails | Required callback result | Fail seam result |
| All declared steps complete | Static sequence exhaustion | Terminal completion entry |

No branch reads artifact summaries, recommendations, claims, confidence meaning,
or inert RA-R2 `stop_criteria` prose.

## Ledger record set

One legal execution produces:

1. `rotation_execution_started` — bridge ID/digest, source `rrp_`, plan ID,
   sequence length, human confirmation, and mock-only declaration.
2. One `rotation_role_invocation` per completed role — role, step, adapter,
   context refs, artifact ID/digest, validation and handoff status, timestamps,
   bridge/plan/source lineage. Artifact records remain T1 and point to M3-stored
   content whose raw/schema-valid tiers are T0/T1.
3. `rotation_execution_completed` or `rotation_execution_failed` — completed
   count, failure point/code, invocation Ledger IDs, runtime record IDs, and
   terminal lineage.

Every successful run therefore has `role invocation count + 2` seam Ledger
entries. A failure after a completed prefix has that prefix's invocation entries
plus the terminal failure entry.

## Canonical worked example — the first complete legal rotation

Source fixture:
`examples/roles/runtime-rotation-plan.valid.planner-critic.json`.

LE-2 deterministically derives a two-cycle sequence:

| Step | Role | Context digest obligation | Result |
| --- | --- | --- | --- |
| 0 | Planner | none | validated T1 plan artifact, digest stored |
| 1 | Critic | step 0 Planner digest | validated T1 critique artifact, digest stored |
| 2 | Planner | steps 0–1 digests | validated T1 plan artifact, digest stored |
| 3 | Critic | steps 0–2, including both Planner digests | validated T1 critique artifact, digest stored |

The acceptance test writes the bridge record and all six seam records into an
isolated file named `ledger.jsonl`. It then discards runtime objects and calls
`reconstructRotationChainFromLedgerJsonl()` over file content. The reconstructed
role order, invocation IDs, context digests, artifact digests, source-plan lineage,
completed count, and terminal status must equal the execution result.

## Four audit detectors

The acceptance file pins these exact test names:

1. `Detector 1 — no L1 widening: derived plans and execution results are rejected as route inputs`
2. `Detector 2 — no provider path: seam/executor module graph contains only mock role binding`
3. `Detector 3 — no prose-driven branching: prose-only variants preserve execution structure`
4. `Detector 4 — no unledgered execution: suppression runs zero roles and completed runs account for every role`

The L1 allowlist remains exactly:

1. `contract_validated_task_frame`
2. `verified_signal_frame`
3. `engine_internal_state`
4. `deterministic_hollow_signal`
5. `accepted_gate_policy_result`
6. `human_pat_approval_record`
7. `snapshot_change_guard_state`

## Mid-rotation failure

The failing-Critic fixture lets Planner step 0 complete and Ledger successfully,
then returns the mock adapter's failure at Critic step 1. RA-R1 halts without retry,
skip, or substitution. LE-3 writes `rotation_execution_failed` with
`completed_steps: 1`, `failed_step_index: 1`, and
`failure_code: adapter_invocation_failed`; no later role entry exists.

## `LE1-LEDGER-1` disposition

`LE1-LEDGER-1` remains named-deferred. The LE-1 classifier is synchronous and pure;
adding this execution seam's asynchronous append callback and failure semantics
would broaden the accepted read-only classification contract rather than cheaply
reuse shared machinery. A dedicated record-contract pass must decide whether to
write that artifact or retire it in favor of LE-2/LE-3 records.

## What the live-rotation pass inherits

- A separately argued live-adapter gate chain with H5-preserving network and
  credential boundaries.
- Explicit per-role live bindings; no global provider fallback or implicit model
  selection.
- Execution budgets: token, cost, duration, invocation, and retry limits.
- Approval/snapshot gates before any capability-bearing plan can cross LE-2.
- AUTH-1 if `orchestration_core` or `logic_engine` source authorship is proposed.
- A dedicated route-selection integration pass before Caleb's engine may choose to
  call this seam.
- A separate dynamic-sequencing contract if static declared sequences ever change.
- `LE1-LEDGER-1` and `GIT-HYG-1` remain named debts.

`CODEX.md` still describes GOV-1+LE-2 as current and forbids execution. Current
explicit user authority and the committed LE-3 protocol outrank that stale phase
paragraph. LE-3 leaves it unchanged because the protocol does not authorize a
governance edit.

## Validation record

Focused seam/acceptance/CLI validation passed 3 files / 26 tests. The widened
LE-3/LE-2/RA-R1/LE-1/CLI matrix passed 8 files / 100 tests. Canonical typecheck
and build both exited 0. AUD-2 self-smoke was compliant/T2 across all 14 declared
paths with zero violations.

The seam did not clear the mandatory canonical-suite gate. The first completed
run passed 3,116 of 3,120 tests and timed out four unchanged tests. A second
completed run passed 3,119 of 3,120 and timed out only
`tests/cli/auditPassComplianceCli.test.ts:87`. A final unmodified run passed 3,112
of 3,120 and timed out eight unchanged tests across five files. All failures were
the existing 5-second timeout boundary; no LE-3 assertion failed. A serial
diagnostic over those five files passed 47 of 48 tests and reproduced only the
AUD-2 CLI timeout (about 6.1 seconds).

The separately authorized TIME-1 micro-pass preserved every assertion, left
`vitest.config.ts` byte-identical, and supplied measured local budgets to seven
guarded tests. Its clean canonical rerun passed 187/187 files and 3,120/3,120
tests, exit 0, in 317.41 seconds. Canonical typecheck and build exited 0; catalogs
remain 13/9; AUD-2 was compliant/T2.

LE-3 Guarded Execution Seam: Accepted — Caleb rotates: bridged plans only,
human-initiated, every step ledgered, the chain reconstructs from the record
alone.

The `le3a_lock_prechange` snapshot, acceptance report, and lock test have not yet
been created.

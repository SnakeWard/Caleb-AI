# LE-3 / LE-3-A Execution Boundary Acceptance Report

Status: Accepted

Date: 2026-07-19

Protocol: `docs/protocols/PASS_PROTOCOL_LE3.md`

LE-3 implementation commit: `56544f4`

TIME-1 acceptance commit: `309873b`

LE-3 acceptance commit: `f7165d6`

LE-3-A pre-change snapshot: `snap_20260719T000403360Z_000404_milestone`
(Ledgered and verified on disk)

Aggregate-run snapshots: `snap_20260719T001810822Z_000405_milestone`,
`snap_20260719T002757874Z_000406_milestone`, and
`snap_20260719T003746643Z_000407_milestone` (Ledgered and verified on disk; the
last belongs to the accepted canonical run)

## Boundary locked

- Bridged plans only: execution requires an exact successful LE-2 bridge Ledger
  record whose derived/source digests, artifact refs, parent refs, and lineage
  match the supplied plan.
- Human-initiated only: `human_confirmed: true` is mandatory, and the only
  production caller is `src/cli/commandHandlers.ts` through the explicit
  `execute-rotation-plan --plan-file ... --confirm` command. There is no non-CLI
  production caller.
- Mandatory Ledger: the seam requires `append_ledger_entry`; a missing, throwing,
  or refusing callback executes zero roles. Successful execution writes start,
  per-invocation, and terminal records.
- Mock-only binding: every plan binding, bridge binding, and runtime adapter must
  declare `adapter_kind: "mock"`.
- Static declared sequence only: the seam composes the unchanged RA-R1 executor.

Live execution, dynamic sequencing, capability-bearing plans, and route-selection
integration are ABSENT; each may return only via its own named future pass with a
visible amendment to this lock.

## Golden rotation and reconstruction

Golden rotation result: passed with exactly 4 invocations in declared order,
Planner → Critic → Planner → Critic. Each artifact entered as T0, validated to T1,
was digest-stored in M3, and retained derived/source/bridge lineage. Critic context
refs contained the required prior Planner artifact digests.

Reconstructability result: passed. From isolated `ledger.jsonl` content alone,
with runtime objects discarded, the acceptance suite reconstructed role order,
invocation IDs, context digests, artifact digests, completed count, terminal
status, and lineage exactly.

Fail-closed result: passed. A failing Critic halted after the first Planner,
Ledgered `adapter_invocation_failed`, and executed no later role.

## Four detector locks

1. `Detector 1 — no L1 widening: derived plans and execution results are rejected as route inputs`
2. `Detector 2 — no provider path: seam/executor module graph contains only mock role binding`
3. `Detector 3 — no prose-driven branching: prose-only variants preserve execution structure`
4. `Detector 4 — no unledgered execution: suppression runs zero roles and completed runs account for every role`

## Refusal surface exercised

- `seam_rejected_human_confirmation_required`
- `seam_rejected_unbridged_plan` — raw RA-R2, hand-built RA-R1 shape, and missing
  bridge Ledger entry all covered
- `seam_rejected_invalid_plan`
- `seam_rejected_authorship`
- `seam_rejected_non_mock_binding`
- `seam_rejected_mock_adapter_unavailable`
- `seam_rejected_ledger_unavailable`

## `LE1-LEDGER-1` disposition

`LE1-LEDGER-1` remains named-deferred. LE-1 is a synchronous pure classifier;
adding asynchronous append/failure semantics would broaden its accepted read-only
contract rather than cheaply reuse LE-3 machinery.

## L1 allowlist remains seven verbatim

1. `contract_validated_task_frame`
2. `verified_signal_frame`
3. `engine_internal_state`
4. `deterministic_hollow_signal`
5. `accepted_gate_policy_result`
6. `human_pat_approval_record`
7. `snapshot_change_guard_state`

## Lock-fires evidence

The LE-3-A test applies an in-memory synthetic weakening that replaces the
bridged-plans-only clause. `assertLockedReport` rejects the weakened text. The
synthetic value is then discarded; it is never written, and the canonical report
is re-read unchanged. This is the required lock-fires demonstration under R37
discipline.

## Validation record

- Focused LE-3 seam/acceptance/CLI: 3 files / 26 tests passed.
- Widened LE-3/LE-2/RA-R1/LE-1/CLI matrix: 8 files / 100 tests passed.
- TIME-1 integrity guard: 7 adjusted tests, assertion changes 0, global config
  unchanged.
- LE-3 canonical suite: 187/187 files, 3,120/3,120 tests, exit 0, 317.41 seconds.
- LE-3-A lock: 1/1 file, 7/7 tests passed.
- LE-3-A final canonical suite: 188/188 files, 3,127/3,127 tests, exit 0,
  125.69 seconds.
- Two preceding aggregate diagnostics ended at 3,124/3,127 and 3,125/3,127
  under host contention. Every affected file passed serially (41/41 and 27/27);
  no timeout or assertion scope was widened from those samples.
- Canonical TypeScript check: exit 0.
- Build: exit 0.
- V1 Hollow catalog: 13.
- Hollowcut Hollow catalog: 9.
- AUD-2: compliant/T2; TIME-1 12-path self-smoke had zero violations. LE-3 seam
  self-smoke was compliant/T2 across 14 paths with zero violations. LE-3-A
  self-smoke was compliant/T2 across 6 paths with zero violations.

## RA-R1-D Deliverable 1 — roleHandoffGate classification (verbatim)

| # | Check | Code location | Classification |
| --- | --- | --- | --- |
| 1 | Handoff envelope structural validation via `validateRoleHandoffEnvelope` | `roleHandoffGate.ts:57-61` → `roleArtifactValidator.ts:162-213` | STRUCTURE |
| 2 | Source artifact structural validation via `validateRoleArtifact` (structural errors only; content-key errors deferred) | `roleHandoffGate.ts:63-67`, `258-260` → `roleArtifactValidator.ts:91-130` | STRUCTURE |
| 3 | Registry entry contract validation during map build | `roleHandoffGate.ts:72-73`, `118-136` → `roleArtifactValidator.ts:132-160` | STRUCTURE |
| 4 | `source_role` exists in registry | `roleHandoffGate.ts:75-82` | STRUCTURE |
| 5 | `target_role` exists in registry | `roleHandoffGate.ts:84-91` | STRUCTURE |
| 6 | Transition allowed per `sourceContract.allowed_next_roles` | `roleHandoffGate.ts:94`, `138-150` | STRUCTURE |
| 7 | `source_artifact.role_id` matches `handoff.source_role` | `roleHandoffGate.ts:95-96`, `152-164` | STRUCTURE |
| 8 | Handoff references `source_artifact.artifact_id` (via `artifact_id` or `artifact_refs`) | `roleHandoffGate.ts:96-97`, `166-182` | STRUCTURE |
| 9 | `source_artifact.required_next_role` is null or matches `handoff.target_role` | `roleHandoffGate.ts:97-98`, `184-196` | STRUCTURE |
| 10 | Identity fields (`task_id`, `run_id`, `trace_id`, `context_id`) match across handoff and artifact | `roleHandoffGate.ts:98-99`, `198-212` | STRUCTURE |
| 11 | `acceptance_status` policy (enum-based; see note below) | `roleHandoffGate.ts:99-100`, `214-233` | STRUCTURE |
| 12 | `handoff_status` must be `"ready"` | `roleHandoffGate.ts:100-101`, `235-244` | STRUCTURE |
| 13 | Forbidden reasoning/raw-input key names in handoff input tree | `roleHandoffGate.ts:104`, `262-343` | STRUCTURE |
| 14 | Forbidden reasoning/raw-input key names in source artifact input tree | `roleHandoffGate.ts:105`, `262-343` | STRUCTURE |
| 15 | Embedded `telemetry_trace` / `execution_context` key prohibition in input trees | `roleHandoffGate.ts:294-313` | STRUCTURE |

## Verdicts

LE-3 Guarded Execution Seam: Accepted — Caleb rotates: bridged plans only,
human-initiated, every step ledgered, the chain reconstructs from the record
alone.

LE-3-A Execution Boundary Lock: Accepted — the first rotation's guardrails are
now a protected surface.

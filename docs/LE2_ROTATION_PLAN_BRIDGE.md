# LE-2 Runtime Rotation Plan Bridge

Status: Accepted

Date: 2026-07-18

Bridge schema version: `1.0.0`

Source protocol: `docs/protocols/PASS_PROTOCOL_GOV1_LE2.md`, including Amendments A–C

## Purpose and boundary

LE-2 adds a deterministic, total-function bridge from a validated RA-R2
`RuntimeRotationPlan` to an RA-R1 `StaticRotationPlan`. A bridge call either
returns a structurally valid plan or returns a structured rejection. It does not
select a Logic Engine route, invoke a Hollow, dispatch a role, call a model,
mutate code, perform a side effect, or execute the resulting plan.

The pre-change snapshot is
`snap_20260718T201841128Z_000388_milestone`, verified on disk before the
implementation record was written.

## Authorized success surface

Amendment A adds two RA-R2 route modes:

- `planner_critic`: Planner→Critic is registry-legal. Its human-authored
  acceptance fixture uses two cycles and derives Planner, Critic, Planner,
  Critic; Critic→Planner is also registry-legal.
- `planner_critic_synthesizer`: Planner→Critic and Critic→Synthesizer are both
  registry-legal. Its fixture-authored acceptance fixture uses one cycle. A
  later cycle would require Synthesizer→Planner, which the current registry does
  not allow, so `max_cycles > 1` for this route still rejects rather than
  bypassing the registry.

Both fixtures are mock-bound, have no side-effect or code-mutation intent, use
the mandatory RA-R2 gates, and remain within the `max_cycles` bound of 1–3.

## Eight decision-envelope rules

1. Any plan containing unregistered Analyst rejects with
   `bridge_rejected_unknown_role`; LE-2 does not add or map roles.
2. Any expanded sequence containing a registry-forbidden transition rejects
   with `bridge_rejected_forbidden_transition`; `planner_synthesizer` remains a
   rejection fixture.
3. Role order repeated by `max_cycles` deterministically becomes RA-R1
   `sequence`; `max_invocations` equals sequence length exactly; deterministic
   UUID-shaped plan, trace, and context IDs derive from structural input; lineage
   points to the source `rrp_` ID.
4. `stop_criteria` prose is copied only into inert provenance and cannot alter
   IDs, sequence, limits, gates, or structural digest.
5. Mandatory role-handoff/final-verification gates become explicit obligations.
   Side-effect or code-mutation intent rejects with
   `bridge_rejected_ungated_capability` until the required runtime gate machinery
   exists.
6. Every successful or rejected bridge decision must be written to the Ledger.
   If the write returns false or throws, the bridge withholds both success and
   rejection output as `bridge_ledger_write_failed`.
7. A derived plan has `ledger_mandatory: true`; the only bridge-provided
   executor handoff constructor requires an `append_record` callback and refuses
   a missing callback.
8. A `live` adapter binding rejects with
   `bridge_rejected_live_adapter_unavailable`; LE-2 accepts mock bindings only.

## Derivation algorithm

1. Hash the received RA-R2 value for source provenance.
2. Run the strict RA-R2 validator. Map model authorship, invalid ID references,
   and other schema errors to their bridge rejection codes.
3. Require target-representable authorship (`human` or `fixture`) and exact
   carrier task/run/lineage linkage.
4. Require every declared role to exist in the current role registry.
5. Expand declared role order by `max_cycles`, then check every adjacent
   transition—including cycle boundaries—against that registry.
6. Reject side-effect, code-mutation, or snapshot-required plans.
7. Require one unique, non-empty mock adapter binding for every declared role
   and no extra role binding.
8. Hash only structural source fields and normalized bindings. Derive stable
   UUID-shaped `plan_id`, `trace_id`, and `context_id` values from that digest.
9. Build the exact RA-R1 sequence, exact `max_invocations`, fail-on-first-failure
   stop rule, explicit gate obligations, lineage, Hollow requirements, and inert
   prose provenance.
10. Validate the result with the existing RA-R1 validator.
11. Build and append a T2/verified Ledger entry. Return the plan or rejection
    only after the append callback confirms success.

For the same structural input and bindings, the derived plan is byte-identical.
The call timestamp and Ledger ID belong only to the Ledger record and cannot
change the derived plan.

## Decision inventory

| Branch | Outcome | Structural driver |
| --- | --- | --- |
| RA-R2 model authorship error | `bridge_rejected_authorship` | Validator error code |
| RA-R2 invalid ID | `bridge_rejected_reference_format` | Validator error code |
| Other RA-R2 validation error | `bridge_rejected_invalid_schema` | Validator error codes |
| Valid but RA-R1-unrepresentable author | `bridge_rejected_authorship` | `authored_by` enum |
| Carrier identity or lineage mismatch | `bridge_rejected_reference_format` | Record kind, task/run IDs, `lineage_refs` |
| Role absent from registry | `bridge_rejected_unknown_role` | `roles_required` plus registry |
| Adjacent transition disallowed | `bridge_rejected_forbidden_transition` | Expanded sequence plus registry |
| Side effect, mutation, or snapshot requested | `bridge_rejected_ungated_capability` | Capability policy fields |
| Malformed/missing/extra/duplicate binding | `bridge_rejected_invalid_schema` | Adapter binding records |
| Any live binding | `bridge_rejected_live_adapter_unavailable` | `adapter_kind` |
| RA-R1 target validation failure | `bridge_rejected_invalid_schema` | Existing RA-R1 validator result |
| All checks pass | `derived` | Normalized structural fields |
| Ledger append false or throws | `bridge_ledger_write_failed` | Required append callback result |
| Executor callback missing | `bridge_executor_ledger_callback_required` | Required handoff callback |

No branch is driven by a prose summary, description, or `stop_criteria` value.

## Ledger contract

Each completed/rejected invocation creates a `runtime_rotation_plan_bridge`
entry with actor `logic_engine.rotation_plan_bridge`, source plan digest and
reference, structural decision inputs, outcome, derived-plan digest or rejection
code, artifact hash on success, and lineage provenance. Entries are T2 and
`verified`. A Ledger failure produces no consumable derived plan.

LE-1's classification artifact Ledger write is named-deferred as
**LE1-LEDGER-1**. Changing the already accepted LE-1 seam was not cheap because
it would add a new write callback and failure surface to that read-only contract.
LE-2 does not silently treat its empty `ledger_refs` as complete; the future
pass must either implement that write under a dedicated contract or retire the
artifact in favor of the bridge record.

## Acceptance locks

`tests/acceptance/le2RotationPlanBridgeAcceptance.test.ts` pins these named
detectors:

1. `Envelope 1: unregistered Analyst is rejected without changing the registry`
2. `Envelope 2: planner_synthesizer remains a registry-governed rejection`
3. `Envelope 3: authorized routes derive exact deterministic RA-R1 structure`
4. `Envelope 4: stop_criteria prose is inert to every derived structural field`
5. `Envelope 5: unavailable approval and snapshot capabilities reject before derivation`
6. `Envelope 6: success and rejection are ledgered and suppressed Ledger writes fail closed`
7. `Envelope 7: bridged executor handoff cannot omit its Ledger callback`
8. `Envelope 8: live bindings and all inherited LE-1 failures reject; scope locks remain intact`

The last detector also pins the L1 allowlist at exactly:

1. `contract_validated_task_frame`
2. `verified_signal_frame`
3. `engine_internal_state`
4. `deterministic_hollow_signal`
5. `accepted_gate_policy_result`
6. `human_pat_approval_record`
7. `snapshot_change_guard_state`

It also pins V1/Hollowcut catalogs at 13/9 and proves the bridge has no executor,
provider, or route-selection consumer.

## What the guarded-execution pass inherits

- Mandatory Ledger coverage must remain end-to-end. The RA-R1 executor's optional
  `appendRecord` parameter is unchanged; guarded execution must consume bridged
  plans only through the required-callback handoff or strengthen the executor
  boundary itself.
- Approval and snapshot gate machinery does not yet exist behind the executor.
  Side-effect and code-mutation plans remain unbridgeable until it does.
- The live-adapter gate chain does not yet exist. Live bindings remain
  unbridgeable until a separate pass establishes and tests that chain.
- **Analyst registration and the `planner_synthesizer` transition are open design
  questions deliberately not resolved by LE-2. Plans requiring either remain
  unbridgeable until a dedicated registry pass argues them on their merits.**
- `orchestration_core` and `logic_engine` are valid RA-R2 authors but not valid
  RA-R1 authors. The current bridge therefore refuses them; a future contract
  pass must decide whether to align authorship enums or retain that wall.
- `LE1-LEDGER-1` remains a named record debt for the read-only LE-1
  classification artifact.
- `planner_critic_synthesizer` with more than one cycle requires a future
  Synthesizer→Planner transition decision; LE-2 does not infer one.

## Validation record

- Focused bridge/RA-R2/LE-1 validation: 5 files / 57 tests.
- Canonical `node ./node_modules/typescript/bin/tsc --noEmit`: exit 0.
- `npm run build`: exit 0.
- Canonical `npx vitest run`: 184 files / 3,094 tests, all passed.
- Validation snapshot: `snap_20260718T203939996Z_000389_milestone`, verified on
  disk.
- Catalogs: V1 13; Hollowcut 9.
- AUD-2 self-smoke against `examples/audit/le2-pass-manifest.valid.json` and base
  `960ade1`: compliant, T2 verified, 15 changed paths, zero violations.
- Credential variables and `VITEST_DEBUG_DUMP`: unset/empty before validation.

`LE-2 Rotation Plan Bridge: Accepted — RA-R2 plans derive deterministically or refuse loudly; every incompatibility is now a rule; nothing runs yet.`

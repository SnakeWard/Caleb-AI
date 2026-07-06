# RA-R1 Static Role Rotation Runtime Implementation

Status: Accepted
Date: 2026-07-06
Protocol: `docs/protocols/PASS_PROTOCOL_RA_R1.md`
Diagnostic: `docs/RA_R1_STATIC_ROTATION_DIAGNOSTIC.md`
Pre-change snapshot: `snap_20260706T154747284Z_000362_milestone` (verified on disk before recording)

## Pre-change snapshot

`snap_20260706T154747284Z_000362_milestone` created via `npm run --silent cli -- create-milestone-snapshot --name ra_r1_implementation_prechange --json` and verified present at `D:\Caleb AI\.caleb\snapshots\snap_20260706T154747284Z_000362_milestone` before any implementation edit.

## Files created

- `src/roleRuntime/types/staticRotationPlan.ts`
- `src/roleRuntime/types/roleRuntimeAdapter.ts`
- `src/roleRuntime/types/roleRuntimeTypes.ts`
- `src/roleRuntime/rotationPlanValidator.ts`
- `src/roleRuntime/contextAssembly.ts`
- `src/roleRuntime/roleRuntimeExecutor.ts`
- `src/roleRuntime/mockRoleRuntimeAdapter.ts`
- `src/roleRuntime/index.ts`
- `tests/roleRuntime/rotationPlanValidator.test.ts`
- `tests/roleRuntime/testHelpers.ts`
- `tests/acceptance/raR1StaticRotationAcceptance.test.ts`
- `docs/RA_R1_STATIC_ROLE_ROTATION_RUNTIME_IMPLEMENTATION.md`

## Files modified

- `PLANS.md`
- `docs/STATUS_LOG.md`
- `.caleb/ledger/ledger.jsonl` (append-only snapshot entry)

## Decision inventory (finalized)

Branch count: **18**. Every branch is structurally annotated below.

| # | Branch | Structural input |
| --- | --- | --- |
| 1 | Reject rotation plan at validation | `validateStaticRotationPlan` verdict |
| 2 | Reject `authored_by: "model"` | `plan.authored_by` enum |
| 3 | Reject malformed sequence | `plan.sequence[]` shape/order |
| 4 | Initialize rotation state | `plan.sequence[0]`, `plan.stop_conditions` |
| 5 | Halt: sequence exhausted | loop exit when `currentStepIndex >= plan.sequence.length` |
| 6 | Halt: max invocations reached | `invocationCount >= plan.stop_conditions.max_invocations` |
| 7 | Select current role | `plan.sequence[currentStepIndex].role_id` |
| 8 | Resolve adapter binding | `plan.sequence[currentStepIndex].adapter_id` + `adapter_kind` |
| 9 | Fail-closed: adapter not found | adapter map lookup miss |
| 10 | Fail-closed: adapter invocation error | adapter result `ok: false` |
| 11 | Fail-closed: raw storage failure | `ContentAddressedRawOutputStore.store` `ok: false` |
| 12 | Fail-closed: artifact schema validation failure | `validateRoleArtifact` `ok: false` |
| 13 | Proceed: artifact schema-valid (T1 cap) | `validateRoleArtifact` `ok: true` |
| 14 | Evaluate handoff gate | `validateRoleHandoffGate` when next step exists |
| 15 | Halt: handoff gate blocked/invalid | gate `status !== "allowed"` |
| 16 | Assemble context for next role | prior-step digests ordered by `step_index` |
| 17 | Write runtime rotation record | append callback / record object |
| 18 | Complete rotation successfully | all steps consumed without fail-closed branches |

## Golden rotation result

Test `golden static rotation succeeds with declared planner -> critic sequence` — **passed**. Declared planner → critic sequence completed with digest storage and ordered `context_refs`.

## Chain reconstructability result

Test `chain reconstructability from runtime records alone` — **passed**. `reconstructChainFromRecords` rebuilt the chain from records with no hidden executor memory.

## Detector tests

| Detector | Test name | Result |
| --- | --- | --- |
| Model-authored plan rejected | `model-authored plan rejected with no invocation` | passed |
| Content-inspection-for-routing inert | `content-inspection-for-routing is inert and declared sequence still executes` | passed |
| defects_found-as-authority caught | `defects_found-as-authority cannot steer runtime sequencing` | passed |
| confidence-as-authority caught | `confidence-as-authority cannot steer runtime sequencing` | passed |
| Handoff gate blocked local halt | `handoff gate blocked halts executor locally without Logic Engine routing` | passed |
| Mid-rotation fail-closed halt | `mid-rotation ledger record write failure fail-closed halt` | passed |
| Adapter missing | `adapter missing fail-closed halt` | passed |
| Adapter error | `adapter error fail-closed halt` | passed |
| Raw storage failure | `raw storage failure fail-closed halt` | passed |
| Artifact validation failure | `artifact schema validation failure fail-closed halt` | passed |
| Context refs ordering | `context refs list prior artifact digests in ascending step_index` | passed |
| L1 allowlist unchanged | `L1 allowlist unchanged at exactly seven entries` | passed |
| M3 compose unchanged | `runtime composes with ContentAddressedRawOutputStore without modifying M3 modules` | passed |
| No prose sequencing branch | `executor source does not branch on artifact prose for sequencing` | passed |

## Boundary confirmations

- `context_refs` are digest references ordered by ascending `step_index`.
- Context is inert transport via `assembleInertContextText` (digest resolution + fixed delimiter template only).
- Runtime does not inspect artifact content for sequencing (`roleRuntimeExecutor.ts` has no prose-field branching).
- `validateRoleHandoffGate` is executor-local only between declared steps.
- `RoleHandoffGateResult` is not L1 route input.
- `accepted_gate_policy_result` was not used.
- L1 allowlist unchanged at seven entries.
- No M3 raw-output modules were modified.
- No live provider call, ambient credential read, or network egress path introduced.

## Validation results

| Command | Result |
| --- | --- |
| `npx tsc --noEmit` | passed (exit 0) |
| `npm run build` | passed (exit 0; `dist/src/roleRuntime/` emitted) |
| `npx vitest run` | passed — 170 files / 2,966 tests |
| `npm run --silent cli -- list-hollows --json` | 12 V1 Hollows |
| `npm run --silent cli -- list-hollowcut-hollows --json` | 9 Hollowcut Hollows |

**Observation:** `git status --short` emits `warning: could not open directory 'true /': No such file or directory` (non-dirty; pre-existing).

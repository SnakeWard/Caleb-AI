# GOV-1 Governance and Handoff Reconciliation

Status: Accepted
Date: 2026-07-18
Protocol: `docs/protocols/PASS_PROTOCOL_GOV1_LE2.md`
Pre-change snapshot: `snap_20260718T194507575Z_000386_milestone` (verified on disk)

## Baseline and push result

- The inherited working tree contained exactly one uncommitted append:
  `ledger_snap_20260707T213848375Z_000385_milestone`.
- Housekeeping commit `3261ac4` recorded that append separately.
- Push result: the nine previously local commits plus the housekeeping commit were
  pushed successfully to `origin/main`.
- Local and remote both resolved to `3261ac454ea8e69ea8e1342c8c84165e98fe18b9`
  before GOV-1 mutation.
- Git emitted a geometric-repack maintenance error during the housekeeping commit;
  the commit and push succeeded. `git fsck --full` found no corruption, Git reported
  zero garbage objects, and local/remote commit IDs matched.

## Current-fact corrections

| File | Reason |
| --- | --- |
| `CODEX.md` | Replaced the original documentation-only phase with the explicit GOV-1 + LE-2 authorization and its non-execution boundaries. |
| `README.md` | Corrected V1 catalog 12→13, recorded both accepted live-call milestones, and recorded RA-R1/RA-R2/LE-1 current state. |
| `docs/01_CODEX_OPERATING_CONTRACT.md` | Adopted the canonical typecheck command and mandatory completion/exit-code reporting. |
| `docs/CALEB_AI_ROADMAP_TO_LIVE_BOUNDARY.md` | Marked the partially superseded roadmap historical/non-authorizing and corrected its current catalog count. |
| `docs/CALEB_LOGIC_ENGINE_CONTRACT.md` | Corrected the current protected catalog count to 13 after AUD-1. |
| `docs/HOLLOWCUT_BOUNDARY_LOCK.md` | Corrected current protected V1 catalog count; Hollowcut boundary unchanged. |
| `docs/HOLLOWCUT_CALEB_BOUNDARY.md` | Corrected current protected V1 catalog count; Hollowcut boundary unchanged. |
| `docs/HOLLOWCUT_EXPORT_READINESS_RESULT_CONTRACT.md` | Corrected current protected V1 catalog count; result contract unchanged. |
| `docs/HOLLOWCUT_EXPORT_RUNTIME_BOUNDARY_PLAN.md` | Corrected current protected V1 catalog count; export remains unimplemented. |
| `docs/HOLLOWCUT_IMPLEMENTATION_READINESS_CHECKLIST.md` | Corrected current protected V1 catalog count; readiness scope unchanged. |
| `docs/HOLLOWCUT_PROJECT_CONTRACT.md` | Corrected current protected V1 catalog count; project contract unchanged. |
| `docs/RA_R1_STATIC_ROTATION_DIAGNOSTIC.md` | Corrected status from awaiting review to historical/accepted/implemented. |
| `docs/RUNTIME_ROTATION_PLAN_CONTRACT.md` | Recorded LE-1 read-only consumption while preserving the no-execution fact. |
| `docs/STATUS_LOG.md` | Added GOV-1 reconciliation, provenance-gap, and LE-2 stop records. |
| `PLANS.md` | Added living GOV-1 and blocked LE-2 ExecPlans. |

Historical acceptance reports and historical category strings that correctly state
their then-current count of 12 were intentionally not rewritten.

## Protocol provenance gaps — recorded, not backfilled

The following passes were executed under chat-issued instruction; protocol not
committed at the time. GOV-1 does not create retroactive protocol files for them.

| Pass | Commit | Provenance record |
| --- | --- | --- |
| LG-1 | `4ab5b4e` | Executed under chat-issued instruction; protocol not committed at the time. |
| RA-R2 | `53f7e37` | Executed under chat-issued instruction; protocol not committed at the time. |
| AUD-1 | `97b3b8c` | Executed under chat-issued instruction; protocol not committed at the time. |
| AUD-1 Amendment A2 | `cea7daf` | Executed under chat-issued instruction; protocol not committed at the time. |
| AUD-2 | `ec8309c` | Executed under chat-issued instruction; protocol not committed at the time. |
| TRUE-2 | `3711cea` | Executed under chat-issued instruction; protocol not committed at the time. |

## P2 debt payment — RA-R1-D Deliverable 1 table (verbatim)

The source table contains file:line citations for all 15 checks, so no citation
repair was required.

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

## Validation

- `npx vitest run`: exit 0; **182 files / 3,069 tests passed**.
- The full suite created validation snapshot
  `snap_20260718T195549192Z_000387_milestone`, verified on disk.
- `node ./node_modules/typescript/bin/tsc --noEmit`: **exit 0**, completed.
- `npm run build`: exit 0.
- V1 catalog: **13**.
- Hollowcut catalog: **9**.
- AUD-2 GOV-1 self-smoke: exit 0; **compliant**, T2 verified; 19 changed paths,
  zero violations, zero forbidden hits, and zero unlisted changes.

## LE-2 pre-stage deviation

LE-2 did not begin and no LE-2 snapshot was created. The combined rejection rules
make every current valid RA-R2 route unbridgeable:

- `planner_synthesizer` requires Planner→Synthesizer, which the locked handoff
  registry forbids.
- `planner_analyst_synthesizer` and `full_rotation` require Analyst, which is absent
  from the locked role registry.
- The LE-2 acceptance requirements demand at least one successful derived-plan
  determinism path, so an implementation that rejects every plan is not compliant.

Resolving this requires an RA-R2 route-mode amendment, a role/handoff-registry
amendment, or an explicitly revised acceptance envelope. All are outside GOV-1 and
the current LE-2 authorization.

## Verdict

**GOV-1 Governance Reconciliation: Accepted — baseline restored, record debts paid.**

LE-2 remains stopped before snapshot or implementation pending a corrected
decision envelope.

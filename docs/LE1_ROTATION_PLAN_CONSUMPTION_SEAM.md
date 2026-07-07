# LE-1 Rotation Plan Consumption Seam

Status: Accepted (read-only integration)  
Date: 2026-07-07  
Schema version: `1.0.0`  
Diagnostic: `docs/LE1_ROTATION_PLAN_CONSUMPTION_SEAM_DIAGNOSTIC.md`  
Protocol: `docs/protocols/PASS_PROTOCOL_LE1.md`

## Purpose

Read-only Logic Engine seam that validates and classifies a RA-R2 `RuntimeRotationPlan` at the route-selection boundary and emits a deterministic `RotationPlanRouteDecisionArtifact`. No rotation execution, no provider calls, no L1 allowlist change.

## Preconditions (P1–P3)

- **P1:** V1 catalog **13**; Hollowcut **9**; AUD-1 Auditor in V1 via AUD-1 Amendment A1/A2 (`hollow.audit.pass_compliance_check`).
- **P2:** RA-R1-D handoff-gate classification **clean** (structure-only); re-confirmed in diagnostic.
- **P3:** RA-R1 static rotation runtime **implemented** at `src/roleRuntime/`; RA-R2 contract **defined**; LE-1 adds Logic Engine **read-only consumption** only.

## Allowlisted carrier type

**`contract_validated_task_frame`** with `task_frame.task_type: "planning"`.

The plan body is a **sibling payload** to the carrier (not a new route-input kind). Structural linkage: `carrier.lineage_refs` MUST include `rotation_plan.runtime_rotation_plan_id`.

## API

```typescript
classifyRotationPlanAtSeam({
  carrier: ContractValidatedTaskFrameRouteInput,
  rotation_plan: unknown,
  decided_at?: string
}): { artifact: RotationPlanRouteDecisionArtifact }
```

Entry point: `src/logicEngine/rotationPlanSeam.ts`

## Classification enum

| Value | Structural driver |
| --- | --- |
| `valid_rotation_plan` | RA-R2 validator passes; seam authorship re-check passes; lineage ref present |
| `invalid_schema` | RA-R2 validator errors excluding authorship/ID-format codes |
| `rejected_authorship` | `RRP_MODEL_AUTHORED_FORBIDDEN` or seam authorship re-check failure |
| `rejected_reference_format` | Counter-era ID pattern, `RRP_INVALID_ID_FORMAT`, or missing lineage ref |
| `unknown` | Non-object plan or carrier kind mismatch |

## Route-decision artifact

| Field | Notes |
| --- | --- |
| `artifact_id` | `rpd_<uuid>` |
| `plan_digest` | `sha256:` stable digest — no plan prose |
| `plan_ref` | `runtime_rotation_plan_id` or null |
| `carrier_record_id` | From allowlisted carrier |
| `structural_inputs` | Validator codes / branch labels only |
| `trust_tier` | **T2** — deterministic engine measurement over structural plan fields |
| `verification_status` | `verified` |
| `ledger_refs` | Empty in LE-1 (artifact is ledger-ready, not auto-written) |

## Decision inventory (12 branches)

| # | Branch | Structural? |
| --- | --- | --- |
| 1 | Carrier `record_kind` !== `contract_validated_task_frame` | Yes |
| 2 | `rotation_plan` not a JSON object | Yes |
| 3 | Counter-era ID pattern on plan IDs | Yes |
| 4 | RA-R2 validator fails with `RRP_MODEL_AUTHORED_FORBIDDEN` | Yes |
| 5 | RA-R2 validator fails with `RRP_INVALID_ID_FORMAT` | Yes |
| 6 | RA-R2 validator fails with other `RRP_*` codes | Yes |
| 7 | Seam authorship re-check fails | Yes |
| 8 | Carrier `lineage_refs` missing `runtime_rotation_plan_id` | Yes |
| 9 | Post-validation `runtime_rotation_plan_id` format re-check | Yes |
| 10 | Valid plan → `valid_rotation_plan` | Yes |
| 11 | Artifact built with digests/refs only (no prose) | Yes |
| 12 | Seam module has no `executeStaticRotation` / executor import | Yes (absence) |

## Read-only proof

- `classifyRotationPlanAtSeam` is **not** called from `routeInputGate.ts` or `selectRoute`.
- Acceptance test: `selectRouteFromRouteInputs` output unchanged with seam module present.
- `roleRuntimeExecutor.ts` does not import seam types.

## L1 allowlist (unchanged, seven entries)

1. `contract_validated_task_frame`
2. `verified_signal_frame`
3. `engine_internal_state`
4. `deterministic_hollow_signal`
5. `accepted_gate_policy_result`
6. `human_pat_approval_record`
7. `snapshot_change_guard_state`

## Operator notes

- Do not set `VITEST_DEBUG_DUMP` with trailing whitespace (`"true "`).
- `server.debug.dump: false` does **not** override truthy `process.env.VITEST_DEBUG_DUMP`.
# Runtime Rotation Plan Contract (RA-R2)

Status: Accepted  
Date: 2026-07-07  
Schema version: `1.0.0`

## Purpose

The Runtime Rotation Plan is the authorization artifact for bounded future role
rotation. RA-R2 defined the type, validator, fixtures, and tests. LE-1 now consumes
the contract through a read-only Logic Engine classification seam; no runtime
executes it.

## Strictness

`validateRuntimeRotationPlan` is **strict**: unknown root fields are rejected
with `RRP_UNKNOWN_FIELD`. Existing role artifact validators (R1/R3) are
**permissive** — they validate required fields and forbidden embedded keys but
do not reject unknown root properties. RA-R2 intentionally diverges.

## Model authorship doctrine

`authored_by: "model"` is excluded from the type union and rejected with
`RRP_MODEL_AUTHORED_FORBIDDEN`. Rotation authorization must not originate from
model output; only `orchestration_core`, `logic_engine`, or `human` may author
plans.

## max_cycles doctrine bound

`max_cycles` is capped at **3** inclusive (minimum 1). This bounds rotation
depth before runtime wiring.

## ID format

ID fields validate `prefix_uuid` format per `docs/LEDGER_ID_FORMAT_CONTRACT.md`.
RA-R2 validates format only; **no ID generators are added** in this pass.

| Field | Prefix |
| --- | --- |
| `runtime_rotation_plan_id` | `rrp_` |
| `task_id` | `task_` |
| `run_id` | `run_` |

## Fields

| Field | Type | Rules |
| --- | --- | --- |
| `runtime_rotation_plan_id` | string | `^rrp_<uuid>$` |
| `schema_version` | `"1.0.0"` | required constant |
| `task_id` | string | `^task_<uuid>$` |
| `run_id` | string | `^run_<uuid>$` |
| `authored_by` | enum | `orchestration_core` \| `logic_engine` \| `human`; `model` forbidden |
| `route_mode` | enum | `planner_synthesizer` \| `planner_analyst_synthesizer` \| `full_rotation` |
| `roles_required` | array | non-empty; values from `planner`, `analyst`, `critic`, `synthesizer`; no duplicates; must match `route_mode` set |
| `hollows_required` | array | may be empty; each `^hollow\.[a-z0-9_]+(\.[a-z0-9_]+)*$`; no duplicates |
| `gates_required` | array | from `role_handoff_gate`, `approval_gate`, `snapshot_gate`, `final_verification_gate`; no duplicates; `role_handoff_gate` and `final_verification_gate` mandatory |
| `max_cycles` | integer | 1..3 inclusive |
| `stop_criteria` | string[] | non-empty; each entry non-empty after trim |
| `side_effect_policy` | enum | `none` \| `requires_approval` |
| `code_mutation_policy` | enum | `none` \| `requires_snapshot` |
| `snapshot_requirement` | boolean | required |
| `ledger_policy` | enum | `record_all_passes` only in 1.0.0 |
| `created_at` | string | valid ISO 8601 |

## Route mode ↔ roles_required invariants

| `route_mode` | Required role set (order-insensitive) |
| --- | --- |
| `planner_synthesizer` | planner, synthesizer |
| `planner_analyst_synthesizer` | planner, analyst, synthesizer |
| `full_rotation` | planner, analyst, critic, synthesizer |

## Cross-field invariants

1. `side_effect_policy: "requires_approval"` ⇒ `approval_gate` ∈ `gates_required`
2. `code_mutation_policy: "requires_snapshot"` ⇒ `snapshot_gate` ∈ `gates_required` **and** `snapshot_requirement === true`
3. `role_handoff_gate` and `final_verification_gate` mandatory in every plan

## Error codes

| Code | Meaning |
| --- | --- |
| `RRP_MISSING_FIELD` | Required field absent |
| `RRP_INVALID_SCHEMA_VERSION` | `schema_version` ≠ `1.0.0` |
| `RRP_INVALID_ID_FORMAT` | `rrp_`, `task_`, or `run_` format invalid |
| `RRP_MODEL_AUTHORED_FORBIDDEN` | `authored_by: "model"` |
| `RRP_INVALID_AUTHOR` | `authored_by` not in allowed union |
| `RRP_UNKNOWN_ROUTE_MODE` | Invalid `route_mode` |
| `RRP_UNKNOWN_ROLE` | Invalid or malformed `roles_required` entry |
| `RRP_DUPLICATE_ROLE` | Duplicate entry in `roles_required` |
| `RRP_ROLES_ROUTE_MODE_MISMATCH` | `roles_required` set ≠ `route_mode` implication |
| `RRP_INVALID_HOLLOW_ID` | Invalid or duplicate `hollows_required` entry |
| `RRP_UNKNOWN_GATE` | Invalid or duplicate `gates_required` entry |
| `RRP_MISSING_MANDATORY_GATE` | Missing `role_handoff_gate` or `final_verification_gate` |
| `RRP_MAX_CYCLES_OUT_OF_BOUNDS` | `max_cycles` not integer 1..3 |
| `RRP_EMPTY_STOP_CRITERIA` | Empty array or whitespace-only entry |
| `RRP_SIDE_EFFECT_WITHOUT_APPROVAL_GATE` | `requires_approval` without `approval_gate` |
| `RRP_CODE_MUTATION_WITHOUT_SNAPSHOT_GATE` | `requires_snapshot` without `snapshot_gate` |
| `RRP_SNAPSHOT_REQUIREMENT_INCONSISTENT` | `requires_snapshot` with `snapshot_requirement` false or non-boolean |
| `RRP_INVALID_LEDGER_POLICY` | `ledger_policy` ≠ `record_all_passes` |
| `RRP_INVALID_CREATED_AT` | Invalid ISO 8601 `created_at` |
| `RRP_UNKNOWN_FIELD` | Unknown root property (strict object) |
| `RRP_INVALID_ROOT` | Input not a JSON object |

Validator result shape matches role validators: `{ ok: boolean, errors: { code, path, message }[] }`.

## Fixtures

Located in `examples/roles/`:

- `runtime-rotation-plan.valid.json`
- `runtime-rotation-plan.valid.minimal.json`
- `runtime-rotation-plan.invalid.model-authored.json`
- `runtime-rotation-plan.invalid.unbounded-cycles.json`
- `runtime-rotation-plan.invalid.missing-gates.json`

## Runtime consumption

RA-R2 itself added no consumer. LE-1 later added read-only structural consumption
through `classifyRotationPlanAtSeam()`. The seam is not wired into routing, performs
no Hollow dispatch or model call, writes no Ledger entry, and executes no rotation.

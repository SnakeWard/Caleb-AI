# RA-R1 Static Rotation Diagnostic

Status: Diagnostic complete — awaiting Pat and Fable review
Date: 2026-07-06
Protocol: `docs/protocols/PASS_PROTOCOL_H8_RAR1D.md` (RA-R1-D section)
Parent protocol: `docs/protocols/PASS_PROTOCOL_RA_R1.md` (commit `82df49c`)
Pre-change snapshot: `snap_20260706T032542674Z_000360_milestone` (verified on disk before recording)
Authority: RA-C (`docs/ROLE_ARTIFACT_CONSUMPTION_BOUNDARY_CONTRACT.md`) outranks this document on conflict.

This document is investigation and proposal only. It authorizes no implementation.

---

## Deliverable 1 — roleHandoffGate Classification

### Bottom line

**Clean.** Every check performed by `validateRoleHandoffGate` is deterministic over artifact STRUCTURE (schema shape, required fields, enum membership, reference validity, forbidden key names, registry contract shape). **No judgment-shaped checks** were found — nothing evaluates content quality, argument quality, completeness of reasoning, or defect truth. The gate may be proposed as a structural stop condition within a declared rotation sequence under RA-R1 §4D; it does not route Caleb's Logic Engine today.

### 1A. Every check enumerated

The gate entry point is `validateRoleHandoffGate` at `src/roles/roleHandoffGate.ts:53-116`. Checks occur in this order:

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

**Note on check 11 (`validateAcceptanceStatus`):** At `roleHandoffGate.ts:214-233`, the gate permits handoff when `acceptance_status === "accepted"`, or when `acceptance_status === "needs_revision"` **and** `target_role` is `"recovery"` or `"human_operator"`. All other enum values block. This branches on declared enum fields and registered role IDs — not on prose meaning, claim truth, or defect counts.

**Note on checks 1–2 sub-validators:** `validateRoleHandoffEnvelope` (`roleArtifactValidator.ts:162-213`) validates root object shape, schema version, required fields, non-empty strings, role/handoff-status enums, artifact reference presence (`421-436`), optional arrays, ISO datetime, and string/array bounds. `validateRoleArtifact` (`roleArtifactValidator.ts:91-130`) validates the parallel artifact contract including `confidence` numeric range (`348-356`), `required_next_role` null-or-enum (`358-370`), and ref object shapes (`382-404`). The gate filters `forbidden_key` and `embedded_telemetry_events_forbidden` from the structural error bucket (`roleHandoffGate.ts:58-58`, `64-64`, `258-260`) and re-applies forbidden-key detection structurally via `scanContent` (`270-317`).

### 1B. Judgment-shaped checks

**None found.** No code path reads `summary`, `claims[].text`, `recommendations`, `handoff_notes`, or any prose field to judge quality, completeness, or truth. `confidence` is range-validated as a number (`roleArtifactValidator.ts:348-356`), not interpreted as a routing signal inside the gate.

### 1C. Tier the gate's verdict carries

The gate returns `RoleHandoffGateResult` with `status: "allowed" | "blocked" | "invalid"` (`roleHandoffGate.ts:17`, `41-45`). This is a **consumption-gate status**, not a trust tier. It does not emit `T0`/`T1`/`T2`. RA-C Section 1 lists `handoff-gate acceptance` as a formal **non-promoter** (`docs/ROLE_ARTIFACT_CONSUMPTION_BOUNDARY_CONTRACT.md:63-64`). Artifact trust remains whatever `validateRoleArtifact` conferred (T1 maximum when schema-valid) independently of gate status.

### 1D. Current consumers of the verdict

| Consumer | Location | How verdict is consumed |
| --- | --- | --- |
| `validateRoleArtifactReferenceBundle` | `src/roles/roleArtifactBundleValidator.ts:74-76`, `218-253` | Validates `handoff_gate_refs[]` record `allowed`, `status`, and `error_codes` against structural consistency rules |
| `validateRoleArtifactBundleConsistencyReport` | `src/roles/roleArtifactBundleReportValidator.ts:78` | Requires `handoff_gate_summary` field in report schema |
| Type imports | `src/roles/types/roleArtifactBundle.ts:11`, `roleArtifactBundleReport.ts:9` | `RoleHandoffGateStatus` type used in bundle contracts |
| Public export | `src/roles/index.ts:4` | Re-export for contract-layer consumers |
| Contract lock tests | `tests/roles/roleHandoffGate.test.ts` | Direct gate behavior assertions |

**No production runtime consumer** invokes `validateRoleHandoffGate` outside the R1–R6 contract/bundle layer. The Logic Engine (`src/logicEngine/`) does not import or call the gate.

### 1E. Can the verdict move Caleb's state machine?

**No — not through any of the seven L1-approved route-input types.**

The closed allowlist at `src/logicEngine/routeInputGate.ts:14-22`:

1. `contract_validated_task_frame`
2. `verified_signal_frame`
3. `engine_internal_state`
4. `deterministic_hollow_signal`
5. `accepted_gate_policy_result`
6. `human_pat_approval_record`
7. `snapshot_change_guard_state`

`RoleHandoffGateResult` is none of these. RA-C Section 2 states explicitly: "`allowed` does not mean 'route Caleb.'" (`docs/ROLE_ARTIFACT_CONSUMPTION_BOUNDARY_CONTRACT.md:99-100`).

**Implication for RA-R1 §4D:** The verdict is **currently non-routing**. For static rotation V1, a clean structure-only gate **may** serve as a **structural stop condition within the declared sequence** — e.g., `status !== "allowed"` halts rotation and records a coded failure — without becoming Logic Engine route authority. The gate verdict must not be added to the L1 allowlist; rotation halt is executor-local, driven by the gate's boolean `allowed` field and `status` enum, not by prose.

---

## Deliverable 2 — R1–R6 Role Contract Layer Survey

### Module inventory

| Module | Role in stack | Post-M3/L1 vocabulary |
| --- | --- | --- |
| `src/roles/types/roleArtifact.ts` | Canonical artifact types, enums, schema version | Composes cleanly; types are pre-M3 but map directly to RA-C T0/T1 identity |
| `src/roles/types/roleHandoff.ts` | Handoff envelope types | Composes cleanly; envelope is reference-only (IDs, roles, status enums) |
| `src/roles/types/roleContract.ts` | Per-role contract shape | Composes cleanly; static registry vocabulary |
| `src/roles/roleArtifactValidator.ts` | `validateRoleArtifact`, `validateRoleContract`, `validateRoleHandoffEnvelope` | Restate as "schema-valid → T1 max" per RA-C; validators are consumption gates, not promoters |
| `src/roles/roleContractRegistry.ts` | Static R1–R8 registry with `allowed_next_roles` | Restate: registry defines static shapes and handoff targets; does not execute rotation |
| `src/roles/roleHandoffGate.ts` | Handoff eligibility gate (Deliverable 1) | Restate: contract handoff candidate acceptance; non-routing |
| `src/roles/roleArtifactBundleValidator.ts` | Reference-only bundle validation | Composes cleanly; forbids embedding raw artifacts/handoffs in bundles |
| `src/roles/roleArtifactBundleReportValidator.ts` | Bundle consistency report schema | Composes cleanly; summary fields are structural aggregates |

### Composition with M3 content-addressed store

**M3 store composes without modification: yes.**

`ContentAddressedRawOutputStore` (`src/rawOutput/contentAddressedRawOutputStore.ts:22-51`) accepts `output_text: string`, computes a digest, and writes under `.caleb/artifacts/`. Role artifact raw JSON can be stored by passing serialized artifact text through this store from the future runtime without editing M3 modules. RA-C Section 2 storage doctrine requires this composition (`docs/ROLE_ARTIFACT_CONSUMPTION_BOUNDARY_CONTRACT.md:90-95`).

### T1 terms match

**T1 terms match: yes.**

`validateRoleArtifact` schema validation confers the same trust class as M3 schema-valid provider output: **T1 maximum, non-promoting**. RA-C Section 2 states this explicitly (`docs/ROLE_ARTIFACT_CONSUMPTION_BOUNDARY_CONTRACT.md:85-86`). The mock model boundary uses identical trust summary language (`src/modelBoundary/mockSinglePassModelBoundary.ts:18-28`). No difference is a finding; none was found.

### Pre-M3 judgment-shaped evaluation in exercised paths

**No standing finding.** Survey of `roleArtifactValidator.ts`, `roleContractRegistry.ts`, `roleHandoffGate.ts`, and bundle validators found no judgment-shaped evaluation in code paths exercised by current tests. All exercised validation is structural.

---

## Deliverable 3 — Rotation-Plan Schema Proposal

Per RA-R1 §4B. The validator must reject `authored_by: "model"`.

### Schema (proposed)

```typescript
// Proposed — not implemented in this pass
interface StaticRotationPlan {
  readonly schema_version: "ra-r1.0.0";
  readonly plan_id: string;
  readonly authored_by: "human" | "fixture";  // "model" → validator rejection
  readonly task_id: string;
  readonly run_id: string;
  readonly sequence: readonly RotationPlanStep[];
  readonly stop_conditions: RotationStopConditions;
  readonly created_at: string;  // ISO-8601
}

interface RotationPlanStep {
  readonly step_index: number;           // 0-based position in declared sequence
  readonly role_id: RoleId;            // from VALID_ROLE_IDS
  readonly adapter_id: string;         // injected adapter binding
  readonly adapter_kind: "mock" | "live"; // V1 default tests: mock only
}

interface RotationStopConditions {
  readonly max_invocations: number;    // structural ceiling
  readonly halt_on_first_failure: true; // V1: always true, fail-closed
}
```

### Field rationale

| Field | Rationale |
| --- | --- |
| `authored_by` | Provenance gate. `human` for operator-authored plans; `fixture` for test fixtures. `model` rejected — a model-emitted plan is T1 prose and illegal until RA-X extraction exists (RA-R1 §4B). |
| `sequence[].step_index` | Structural position driver for executor branching; must match array order. |
| `sequence[].role_id` | Declared role identity; executor does not infer from artifact content. |
| `sequence[].adapter_id` / `adapter_kind` | Per-role injected adapter binding; live kind exists in schema but default tests inject mock only (RA-R1 §4F). |
| `stop_conditions.max_invocations` | Structural ceiling independent of artifact prose. |
| `stop_conditions.halt_on_first_failure` | V1 fail-closed semantics (RA-R1 §4G); fixed `true` in V1 validator. |

Structural stop conditions encoded: **sequence exhaustion** (implicit — executor stops when `step_index` exceeds `sequence.length - 1`), **max-invocation ceiling** (`max_invocations`), **fail-closed halt** (`halt_on_first_failure` + validation/adapter/storage failure codes).

### Example fixture plan (Planner → Critic)

```json
{
  "schema_version": "ra-r1.0.0",
  "plan_id": "fixture_plan_planner_critic_001",
  "authored_by": "fixture",
  "task_id": "task_ra_r1_golden_001",
  "run_id": "run_ra_r1_golden_001",
  "sequence": [
    {
      "step_index": 0,
      "role_id": "planner",
      "adapter_id": "mock.role_runtime.planner",
      "adapter_kind": "mock"
    },
    {
      "step_index": 1,
      "role_id": "critic",
      "adapter_id": "mock.role_runtime.critic",
      "adapter_kind": "mock"
    }
  ],
  "stop_conditions": {
    "max_invocations": 2,
    "halt_on_first_failure": true
  },
  "created_at": "2026-07-06T00:00:00.000Z"
}
```

---

## Deliverable 4 — Module Layout and Decision Inventory

### Proposed `src/roleRuntime/` module set

| Module | Responsibility |
| --- | --- |
| `types/staticRotationPlan.ts` | Rotation plan types (Deliverable 3) |
| `types/roleRuntimeTypes.ts` | Executor input/output, failure records, rotation state |
| `types/roleRuntimeAdapter.ts` | Injected adapter interface (mock default) |
| `rotationPlanValidator.ts` | Plan schema + `authored_by` gate + sequence integrity |
| `contextAssembly.ts` | Inert digest-resolution and fixed-template concatenation |
| `roleRuntimeExecutor.ts` | Deterministic sequence walker |
| `roleRuntimeLedgerWriter.ts` | Ledger entries: digests, context_refs, coded failures |
| `mockRoleRuntimeAdapter.ts` | Default-test adapter implementations |
| `index.ts` | Public exports |

No module reads artifact prose for branching. `contextAssembly.ts` resolves digests through `ContentAddressedRawOutputStore` and formats with a fixed delimiter template ordered by `step_index`.

### Decision inventory (18 branches — all structurally annotated)

| # | Branch | Structural input driving it |
| --- | --- | --- |
| 1 | Reject rotation plan at validation | `rotationPlanValidator` verdict (`ok: false`, error codes on plan fields) |
| 2 | Reject `authored_by: "model"` | `plan.authored_by` enum value |
| 3 | Reject malformed sequence (index gaps, duplicate `step_index`, empty sequence) | `plan.sequence[]` shape and ordering |
| 4 | Initialize rotation state | `plan.sequence[0].step_index`, `plan.stop_conditions` |
| 5 | Halt: sequence exhausted | `current_step_index >= plan.sequence.length` |
| 6 | Halt: max invocations reached | `invocation_count >= plan.stop_conditions.max_invocations` |
| 7 | Select current role | `plan.sequence[current_step_index].role_id` |
| 8 | Resolve adapter binding | `plan.sequence[current_step_index].adapter_id` + `adapter_kind` |
| 9 | Fail-closed: adapter not found in injection map | `adapter_id` lookup miss in provided `Map<string, RoleRuntimeAdapter>` |
| 10 | Fail-closed: adapter invocation error | Adapter result `ok: false` status code |
| 11 | Fail-closed: raw storage failure | `ContentAddressedRawOutputStore.store` result `ok: false` |
| 12 | Fail-closed: artifact schema validation failure | `validateRoleArtifact` result `ok: false` |
| 13 | Proceed: artifact schema-valid (T1 cap) | `validateRoleArtifact` result `ok: true` |
| 14 | Evaluate handoff gate (when emitting handoff envelope for next step) | `validateRoleHandoffGate` result `allowed` boolean + `status` enum |
| 15 | Halt: handoff gate `blocked` or `invalid` | `validateRoleHandoffGate` result `status !== "allowed"` when next step exists |
| 16 | Assemble context for next role | Ordered list of prior-step artifact digests by ascending `step_index` |
| 17 | Write Ledger rotation record | Digest refs, `context_refs`, role_id, adapter_id, step_index, validation status fields |
| 18 | Complete rotation successfully | Branches 5 or 6 reached without branch 9–12 or 15 firing; final state `completed` |

**All 18 branches structurally annotated: yes.** No branch conditions on prose content, keyword checks, `defects_found`, or model confidence interpretation.

---

## Deliverable 5 — Open Items

| ID | Item | Recommendation | Argument |
| --- | --- | --- | --- |
| OI-1 | Context-assembly ordering for multiple prior artifacts | **Declared-sequence order** (ascending `step_index`) | Matches RA-R1 §4C "ordering by declared sequence position"; no prose-based reordering |
| OI-2 | Handoff-gate verdict as structural stop condition in V1 | **Include in V1** as executor-local halt on `allowed: false` | Deliverable 1 classifies gate as clean/structure-only; fits RA-R1 §4D as intra-sequence stop, not L1 routing |
| OI-3 | Mock adapter interface shape | **Reuse `SinglePassModelRequest`/`SinglePassModelResponse` fields; inject transport** | `src/modelBoundary/types/singlePassModelBoundaryTypes.ts:28-57` already defines request/response with `adapter_id`, `adapter_kind: "mock"`, evidence/context refs; role runtime wraps this with role_id binding from plan step |
| OI-4 | `RA-REGISTRY-ANALYST` (from RA-C) | **Defer to Pat-approved registry amendment before Analyst appears in any rotation plan** | `VALID_ROLE_IDS` at `roleArtifact.ts:17-26` has no `analyst`; plans referencing it must fail validation until registry amended |
| OI-5 | Live adapter in rotation default path | **Defer — mock only in default tests; live is separate gated event** | RA-R1 §4F; H5 traps remain armed |
| OI-6 | Handoff envelope emission timing | **Emit envelope structurally when advancing from step N to N+1** | Envelope fields are IDs and enums; executor constructs from plan sequence, not artifact prose |
| OI-7 | `required_next_role` field vs declared sequence | **Sequence wins; gate already checks consistency** | `roleHandoffGate.ts:184-196` blocks mismatch; executor uses plan `sequence[]`, not artifact `required_next_role`, for next-step selection |

---

## Findings

**No findings.** The handoff gate is structure-only. The R1–R6 layer composes with M3 storage without module modification. T1 terms match M3. No pre-M3 module performs judgment-shaped evaluation on exercised paths.

---

## Mandatory Report Lines (for pass close)

- **Classification bottom line:** Clean — no judgment-shaped checks found.
- **M3 store composes without modification:** yes
- **T1 terms match:** yes
- **Decision-inventory branches (18), all structurally annotated:** yes

---

## Verdict

**RA-R1 Diagnostic: Complete — handoff gate clean; runtime decision surface proposed; awaiting Pat and Fable review.**

Implementation does not begin without Pat's explicit approval.
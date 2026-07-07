# LE-1 Rotation Plan Consumption Seam — Diagnostic

Status: Diagnostic complete — **STOP for Pat approval before implementation**
Date: 2026-07-07
Protocol: `docs/protocols/PASS_PROTOCOL_LE1.md`
Tree at diagnostic open: `3711cea` (TRUE-2 committed; clean)
Pre-change snapshot: `snap_20260707T193901342Z_000378_milestone` (`le1_seam_diagnostic_prechange`, verified on disk)
Suite at diagnostic open: **180 test files / 3,055 tests** green; typecheck clean

This document is investigation and seam design only. It authorizes **no implementation** until Pat approves.

---

## Mandatory precondition resolutions

### P1 — Catalog disposition (affirmative)

| Catalog | Current count | Lock source |
| --- | --- | --- |
| **V1 production Hollows** | **13** | `src/hollows/v1HollowCatalog.ts` (`V1_HOLLOW_MANIFESTS.length`); pinned in `tests/acceptance/logicEngineBoundaryLock.test.ts` (`EXPECTED_V1_COUNT = 13`) and 50+ sibling lock tests |
| **Hollowcut Hollows** | **9** | `src/hollows/hollowcutHollowCatalog.ts`; pinned in `tests/acceptance/logicEngineBoundaryLock.test.ts` (`EXPECTED_HOLLOWCUT_COUNT = 9`) |

**AUD-1 Auditor Hollow placement: (a) added to V1 via visible protocol-governed amendment.**

- Hollow ID: `hollow.audit.pass_compliance_check`
- Registered in `src/hollows/v1HollowCatalog.ts` (manifest + implementation map)
- Amendment: **AUD-1 Pass** with **Amendment A1** (five named locks 12→13) and **Amendment A2** (exhaustive discovery re-key across `tests/`, 57 files). Documented in `PLANS.md` ExecPlan AUD-1 (`## ExecPlan - AUD-1 Pass Compliance Auditor Hollow`).
- **Not** a silent count change: catalog pin moved 12 → 13 with cited pass authority.
- **Not** outside catalog system; **not** a separate named catalog.

**Finding (non-blocking for LE-1 diagnostic):** `tests/acceptance/m3RawOutputBoundaryAcceptanceLock.test.ts` still contains historical category string `"V1 Hollow catalog count acceptance: exactly 12"` — intentionally left untouched per AUD-1 Amendment A2 (historical doc-content lock). Live catalog locks assert **13**.

### P2 — RA-R1-D classification review status

**Performed:** Yes — during **Pass RA-R1-D** (`b627ed3`), documented in `docs/RA_R1_STATIC_ROTATION_DIAGNOSTIC.md` (Deliverable 1).

**Reviewer/implementer:** Codex implementer under `docs/protocols/PASS_PROTOCOL_H8_RAR1D.md` (RA-R1-D section); outcome recorded for Pat/Fable review.

**Outcome (re-confirmed in this LE-1 diagnostic):**

| Criterion | Result |
| --- | --- |
| Structural vs judgment-shaped | **All checks structural** — schema shape, enums, registry refs, forbidden keys, identity field equality |
| Judgment-shaped checks | **None found** — no prose quality, claim truth, or defect-count routing |
| Citation spot-check | Gate entry `src/roles/roleHandoffGate.ts:53-116`; 15 enumerated checks with file:line in RA-R1-D doc §1A |
| L1 steering impact | **None** — `RoleHandoffGateResult` is not any of the seven allowlisted route-input kinds (`routeInputGate.ts:14-22`) |
| Load-bearing for LE-1 | **Acceptable** — gate remains executor-local (RA-R1); LE-1 seam does not import or invoke it |

**LE-1 diagnostic re-review verdict:** RA-R1-D "clean" classification **stands** for LE-1 seam design. No new judgment-shaped checks discovered in `roleHandoffGate.ts` since RA-R1-D.

### P3 — RA-R1 implementation status

**RA-R1 static rotation runtime: IMPLEMENTED** (not deferred).

| Evidence | Location |
| --- | --- |
| Runtime module | `src/roleRuntime/` (`roleRuntimeExecutor.ts`, validators, mock adapter) |
| Acceptance | `tests/acceptance/raR1StaticRotationAcceptance.test.ts` |
| Implementation doc | `docs/RA_R1_STATIC_ROLE_ROTATION_RUNTIME_IMPLEMENTATION.md` |
| STATUS_LOG | `2026-07-06 — Pass RA-R1` entry |
| PLANS | ExecPlan RA-R1 Final Report: accepted; L1 allowlist unchanged at seven |

**RA-R2 RuntimeRotationPlan contract: DEFINED, NOT CONSUMED at Logic Engine boundary.**

| Evidence | Location |
| --- | --- |
| Types + strict validator | `src/roles/types/runtimeRotationPlan.ts`, `src/roles/runtimeRotationPlanValidator.ts` |
| Contract doc | `docs/RUNTIME_ROTATION_PLAN_CONTRACT.md` — explicitly states no runtime consumption yet |
| Tests | `tests/roles/runtimeRotationPlanValidator.test.ts` |

**LE-1 scope relative to P3:** LE-1 adds **Logic Engine read-only consumption** of RA-R2 plans at the route-selection boundary. It does **not** extend `src/roleRuntime/` execution paths. RA-R1 rotation **execution** remains separate; LE-1 only records a classification **about** a plan.

---

## L1 boundary — seven-entry allowlist (verbatim)

From `src/logicEngine/routeInputGate.ts:14-22`:

1. `contract_validated_task_frame`
2. `verified_signal_frame`
3. `engine_internal_state`
4. `deterministic_hollow_signal`
5. `accepted_gate_policy_result`
6. `human_pat_approval_record`
7. `snapshot_change_guard_state`

**LE-1 will NOT add an eighth entry.** Masquerade and L1-B locks remain authoritative.

---

## Allowlisted carrier type for RuntimeRotationPlan

**Chosen carrier: `contract_validated_task_frame`**

**Argument:**

1. A RuntimeRotationPlan describes declared work (roles, gates, route mode, stop criteria) — semantically a **planning** task frame, not engine telemetry or a hollow signal.
2. `TaskFrame.task_type` already includes `"planning"` (`src/logicEngine/types/taskFrame.ts:13`).
3. The plan body is **not** a new route-input kind. LE-1 seam API accepts:
   - `carrier`: validated `ContractValidatedTaskFrameRouteInput` (allowlisted)
   - `rotation_plan`: unknown object validated structurally via `validateRuntimeRotationPlan`
4. **Linkage rule (structural):** `carrier.lineage_refs` MUST include the plan's `runtime_rotation_plan_id` (`rrp_<uuid>`). Seam rejects mismatch with `rejected_reference_format`.
5. **No TaskFrame schema widening** in LE-1 — plan is not embedded in `task_frame` fields (which have no rotation slot). Plan rides as a **sibling payload** keyed by lineage, not as an eighth allowlist entry.

**Rejected alternative:** `engine_internal_state` with `state_name: "runtime_rotation_plan"` — allowlisted but weaker semantics (internal telemetry vs declared work contract).

**Rejected alternative:** New allowlist entry — requires L1-A/L1-B style amendment pass; **STOP** if implementation discovers this is unavoidable.

---

## Proposed classification enum (LE-1 implementation)

Closed enum for seam output:

| Value | Structural driver |
| --- | --- |
| `valid_rotation_plan` | `validateRuntimeRotationPlan` returns valid; authorship allowed; IDs post-H4 format; lineage ref matches carrier |
| `invalid_schema` | RA-R2 validator errors (missing fields, bad enums, cross-field violations) |
| `rejected_authorship` | `authored_by: "model"` or other forbidden author (re-check at seam per RA-R2 `RRP_MODEL_AUTHORED_FORBIDDEN`) |
| `rejected_reference_format` | ID prefix/format failures; carrier `lineage_refs` missing `runtime_rotation_plan_id`; pre-H4/counter-era IDs |
| `unknown` | Non-object input; unexpected failure after structural checks exhausted |

**Authorship mapping (RA-R2 vs LE-1 protocol wording):**

- RA-R2 allowed: `orchestration_core | logic_engine | human`
- LE-1 protocol mentions `human | fixture` — **test fixtures** use `authored_by: "human"` (or `orchestration_core` where appropriate); `"fixture"` is a test-layer label, not an RA-R2 enum value.
- **Rejected at seam:** `model` (and any string not in RA-R2 union)

---

## Proposed route-decision artifact (read-only)

**Name:** `RotationPlanRouteDecisionArtifact` (implementation type TBD)

**Fields (digests/refs only — no plan prose in ledger):**

- `artifact_id` — post-H4 `rpd_<uuid>` or project-standard engine artifact ID
- `classification` — enum above
- `plan_digest` — structural hash/digest of normalized plan object
- `plan_ref` — `runtime_rotation_plan_id` from validated plan
- `carrier_record_id` — `contract_validated_task_frame.record_id`
- `structural_inputs` — codes/paths only (validator error codes, lineage check result)
- `created_at` — ISO timestamp
- `trust_tier` — **T2** (deterministic engine measurement over structural plan fields; plan authorship is non-model per RA-R2; no T1 subject cap on classification logic itself)

**Read-only guarantee:** Artifact has **no consumer** in `src/roleRuntime/` or dispatch paths. Absence assertion required in acceptance tests.

---

## Vitest config decision

**Do not add `server.debug.dump: false` as a fix.**

Vitest 4.1.8 resolves dump path when:

```javascript
if (resolved.server.debug?.dump || process.env.VITEST_DEBUG_DUMP)
```

(`node_modules/vitest/dist/chunks/coverage.DM_a_rWm.js:534-536`)

A truthy `process.env.VITEST_DEBUG_DUMP` enables dumping even if config sets `dump: false`. TRUE-2 addressed hygiene via `.gitignore` + AUD-2 path rejection; LE-1 does not touch `vitest.config.ts`.

---

## Proposed implementation inventory (on approval)

| Deliverable | Path |
| --- | --- |
| Seam module | `src/logicEngine/rotationPlanSeam.ts` |
| Unit tests | `tests/logicEngine/rotationPlanSeam.test.ts` |
| Acceptance | `tests/acceptance/le1RotationPlanSeamAcceptance.test.ts` |
| Implementation doc | `docs/LE1_ROTATION_PLAN_CONSUMPTION_SEAM.md` |

**Explicitly NOT modified in LE-1:** `src/logicEngine/types/routeInput.ts`, `routeInputGate.ts`, L1 lock tests, M3, providers, `v1HollowCatalog.ts`, `roleRuntime` execution paths, package files.

**Proposed decision-inventory branch count:** 12 branches (all structural) — to be enumerated in implementation doc with yes/no structural annotation per RA-R1 house standard.

---

## Proposed detectors (implementation stage)

| Detector | Test target (proposed name) |
| --- | --- |
| Model-authored plan rejected | `rejects model-authored plan at seam` |
| Invalid schema classified | `classifies missing required field as invalid_schema` |
| Counter-era ID rejected | `rejects pre-H4 ID format as rejected_reference_format` |
| Artifact not execution trigger | `route decision artifact has no execution consumer` |
| Read-only routing proof | `existing route selection outputs unchanged after seam module exists` |
| L1 lock verbatim | `L1 allowlist remains seven entries verbatim` |

---

## Read-only proof method (implementation stage)

1. Capture baseline outputs from existing routing tests (`tests/logicEngine/routeInputGate.test.ts`, `routeSelector` tests) **before** seam wiring.
2. Add seam module + tests without modifying `selectRouteFromInputs` / `selectRoute` signatures or behavior.
3. Re-run same corpus; assert byte-identical `RouteDecision` payloads for unchanged fixtures.
4. Seam exposed only via new explicit function (e.g. `classifyRotationPlanAtSeam`) — not hooked into default route pipeline.

---

## Environment notes (read-only)

- `VITEST_DEBUG_DUMP`: unset at Process/User/Machine in diagnostic shell (TRUE-2 hygiene in place).
- No external env mutation performed in LE-1 diagnostic.

---

## Validation performed (diagnostic stage)

| Command | Result |
| --- | --- |
| `git status --short` | Clean at open |
| Pre-change snapshot | `snap_20260707T193901342Z_000378_milestone` verified on disk |
| Catalog inspection | V1=13, Hollowcut=9 via `logicEngineBoundaryLock.test.ts` |
| L1 allowlist inspection | Seven entries verbatim in `routeInputGate.ts` |
| RA-R2 contract inspection | `validateRuntimeRotationPlan` strict; `model` forbidden |

**Implementation validation deferred** until Pat approves this diagnostic.

---

## STOP

**No `src/logicEngine/rotationPlanSeam.ts` or implementation tests until Pat authorizes LE-1 implementation stage.**

Next step on approval: snapshot `le1_seam_implementation_prechange`, implement seam per this diagnostic, run full acceptance matrix, commit implementation stage, STOP again before LE-2.
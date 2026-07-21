# RA-X-1 — Analyst Role Registration (Isolation Pass)

**Pass ID:** RA-X-1  
**Seat:** Grok 4.3, Grok Build TUI — **`F:\Caleb AI`**  
**Authorized by:** Pat (T4)  
**Reviewer/planner:** Claude Fable 5  
**Date:** 2026-07-21  

A recap is not a report.

## Summary

RA-X-1 registers the **Analyst** role in isolation: role contract + registry entry,
four-type bounded semantic payload schema + strict validator, fixtures, and
detectors. The consumption matrix remains **33 transitions, byte-for-byte
unchanged**. No route can hand to or from `analyst`. Request-only Hollow
interaction is encoded as payload shape only. Analyst-authored content cannot
assert trust above T1.

## Suite / catalogs / digests

| Check | Result |
| --- | --- |
| Before | **207 files / 3,241 tests**, exit 0 (DEBT-1 baseline) |
| After | **208 files / 3,248 tests**, exit **0** (+1 acceptance file, +7 RA-X-1 tests; bridge LE-2 expectations updated) |
| `tsc --noEmit` | exit **0** |
| `npm run build` | exit **0** |
| Catalogs | **V1 = 13**, **Hollowcut = 9** |
| Planner digest | `sha256:f32675859e07243a7cf0cd8e743537f4c975826ea7bf684348ed128792489003` **unchanged** |
| Critic digest | `sha256:8074e98c3317f24cfe4f5bd1b94e9328ffe75e1f390a81f776badb759d3b8e8f` **unchanged** |
| L1 | **seven entries** not touched |

## Analyst schema (D2) — four output types

Shared base fields (all types):  
`schema_version`, `role_id` (`analyst`), `output_type`, `summary`, `confidence`, `acceptance_status`

| Type | Type-specific fields |
| --- | --- |
| `finding` | `findings[]` → `finding_id`, `stance` (supports\|contradicts\|neutral), `claim_text`, `rationale`, `evidence_ref_ids[]` |
| `gap_analysis` | `gaps[]` → `gap_id`, `description` |
| `plan_revision_request` | `revision_reason`, `revision_targets[]` |
| `hollow_evidence_request` | `hollow_id`, `evidence_sought` (**request-only** — no result/output fields) |

### Per-string / cardinality bounds chosen (160–240 band)

| Bound | Value |
| --- | --- |
| `summary_max` | **200** |
| `id_max` | **160** |
| `claim_text_max` | **200** |
| `rationale_max` | **240** |
| `description_max` | **200** |
| `revision_reason_max` | **240** |
| `evidence_sought_max` | **240** |
| `findings_max` | **5** |
| `gaps_max` | **5** |
| `revision_targets_max` | **4** |
| `evidence_ref_ids_max` | **6** |

No field may assert trust tier > T1 (`trust_tier`, `max_allowed_trust_tier`, etc. rejected).

## Isolation confirmation (D5 / T3)

- Consumption matrix keys: **33**, exact pre-pass set (no `analyst` in any key).
- No registry `allowed_next_roles` includes `analyst`.
- Analyst `allowed_next_roles`: **[]**.
- Bridge routes that include Analyst still fail (`bridge_rejected_forbidden_transition`), not unknown-role — role exists, traffic denied.

## Detectors T1–T5

| Detector | Result |
| --- | --- |
| T1 four types + rejection classes | Pass |
| T2 never-self-verifying | Pass |
| T3 isolation (matrix + unreachable) | Pass |
| T4 request-only hollow shape | Pass |
| T5 registry uniformity | Pass |

## Registry contract (D1)

- `role_id`: `analyst`
- `role_class`: `reasoning`
- `permitted_input_kinds`: `planner_plan`, `contract_validated_task_frame`
- `execution_authority`: `request_only`
- `allowed_artifact_types`: `analysis`
- Uniform structural keys shared with Planner/Critic (T5).

## Flake rate on F:

This pass: **1 full suite run after green focus** — **0 timeout flakes**. Zero-flake baseline from DEBT-1 continues to hold in this sample.

## AUD-2

**compliant / T2**, 27 paths, **0 violations** (base-ref DEBT-1 `2bdfecb`).

## Files created

- `docs/protocols/PASS_PROTOCOL_RA_X_1.md`
- `docs/RA_X_1_ANALYST_ISOLATION_REPORT.md`
- `src/roles/types/roleClass.ts`
- `src/roles/types/analystSemanticPayload.ts`
- `src/roles/analystSemanticPayloadValidator.ts`
- `tests/acceptance/raX1AnalystIsolationAcceptance.test.ts`
- `examples/roles/analyst.valid-artifact.json`
- `examples/roles/analyst.valid-*.json` (4 types)
- `examples/roles/analyst.invalid-*.json` (6 rejection classes)
- `examples/audit/ra-x-1-pass-manifest.valid.json`

## Files changed

- `src/roles/types/roleArtifact.ts` (RoleId + analysis artifact type)
- `src/roles/roleContractRegistry.ts` (uniform class/input/authority + analyst)
- `src/roles/types/index.ts`, `src/roles/index.ts`
- `tests/roles/roleContractRegistry.test.ts`
- `tests/logicEngine/rotationPlanBridge.test.ts` (isolation rejection code)
- `tests/acceptance/le2RotationPlanBridgeAcceptance.test.ts` (same)
- `docs/STATUS_LOG.md`
- `.caleb/ledger/ledger.jsonl` (append-only if snapshot)

## Files intentionally not changed

- Consumption matrix (`roleHandoffGate.ts` transitions)
- L1 allowlist
- Live prompts / live fixtures
- LE-3, classifier (does not exist)
- Catalogs

## Honest deviations

1. **LE-2 / bridge tests** previously locked `hasRoleContract("analyst") === false` and `bridge_rejected_unknown_role`. RA-X-1 makes Analyst registered; routes still refuse via **`bridge_rejected_forbidden_transition`**. Tests updated to that honest isolation outcome — not a wiring pass.
2. **All RegisteredRoleContracts** gained `role_class`, `permitted_input_kinds`, `execution_authority` for T5 uniformity (not Analyst-only fields).

## Roadmap

RA-X-2 may add matrix transitions only under its own protocol. No live event authorized.

## Verdict

**RA-X-1 accepted offline:** Analyst registered, schema locked, unreachable. Boundaries before traffic.

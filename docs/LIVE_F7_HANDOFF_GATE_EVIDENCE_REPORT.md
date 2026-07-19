# LIVE-F7 Handoff Gate Modernization and Refusal Evidence Report

**Pass:** LIVE-F7  
**Date:** 2026-07-19  
**Verdict:** Accepted offline; E1 attempt seven remains unauthorized.

## Summary

Classified check 11 now evaluates one closed, default-deny consumption matrix.
`planner -> critic` accepts `needs_revision` as T1 context under RA-C without
routing authority or trust promotion. `blocked` and `rejected` are consumable by
no transition. Every legacy `accepted`, recovery, and human-operator allowance
is preserved explicitly.

The runtime no longer exits a refused handoff before evidence exists. It emits a
`gate_evaluation_refused` record before returning, and the execution seam turns
that record into append-only Ledger evidence keyed by `execution_id`. The record
contains only closed structural fields: classified issue code/path, safe
expected/actual enums, transition roles, canonical artifact digest and ID, and
the canonical artifact's `derived_from` T0 digest. Execution reconstruction now
returns that failed step from Ledger JSONL alone.

This closes the fourth cited telemetry-collapse instance: runner -> H3, seam ->
F1, observer -> F4, and **gate -> F7**. The permanent T2 detector is
`tests/acceptance/liveF7HandoffGateEvidenceAcceptance.test.ts`, test
`ledgers and reconstructs the refused attempt-six-shaped step with complete lineage`.

## Starting state and safety

- Evidence commit: `a17e134`, synchronized before LIVE-F7 began.
- Protocol/ExecPlan commit: `fc8eb5a`.
- Explicit pre-change snapshot:
  `snap_20260719T203614999Z_000438_milestone`, verified on disk, 18 files.
- Baseline: **200 files / 3,199 tests**, exit 0.
- Baseline governed typecheck: exit 0.
- Baseline build: exit 0.
- Attempt-six Ledger lines were not reordered, reformatted, or edited.
- No network call or credential use occurred.

## Implemented consumption matrix

Every entry below is explicit. Any missing transition has an empty expected set
and refuses. `blocked` and `rejected` occur in no value set.

| Source | Target and consumable status sets |
| --- | --- |
| `planner` | `implementer {accepted}`; `verifier {accepted}`; `critic {accepted, needs_revision}`; `human_operator {accepted, needs_revision}` |
| `implementer` | `verifier {accepted}`; `critic {accepted}`; `synthesizer {accepted}`; `human_operator {accepted, needs_revision}` |
| `verifier` | `critic {accepted}`; `synthesizer {accepted}`; `reporter {accepted}`; `human_operator {accepted, needs_revision}` |
| `critic` | `planner {accepted}`; `implementer {accepted}`; `verifier {accepted}`; `synthesizer {accepted}`; `recovery {accepted, needs_revision}`; `human_operator {accepted, needs_revision}` |
| `synthesizer` | `reporter {accepted}`; `verifier {accepted}`; `human_operator {accepted, needs_revision}` |
| `reporter` | `human_operator {accepted, needs_revision}` |
| `recovery` | `planner {accepted}`; `implementer {accepted}`; `verifier {accepted}`; `human_operator {accepted, needs_revision}` |
| `human_operator` | `planner {accepted}`; `implementer {accepted}`; `verifier {accepted}`; `critic {accepted}`; `synthesizer {accepted}`; `reporter {accepted}`; `recovery {accepted, needs_revision}` |

Total: 33 declared transitions. The matrix is detector-locked as an exact object.

## Check 11 result and trust boundary

An unconsumable status produces no free-text gate message. Its exact safe shape
is:

```json
{
  "code": "acceptance_status_not_consumable",
  "check_index": 11,
  "path": "$.source_artifact.acceptance_status",
  "expected": ["accepted", "needs_revision"],
  "actual": "blocked",
  "transition": {
    "source_role": "planner",
    "target_role": "critic"
  }
}
```

The successful `needs_revision` Planner -> Critic detector executes two mock
roles and asserts both runtime records remain exactly `T1`. Gate allowance is
context-consumption eligibility only; it performs no trust promotion and grants
no LE-3 bridge or execution authority.

## Failed-step evidence and reconstruction

On refusal, the executor constructs and appends the evidence record before its
halt return. The Ledger record contains:

- `record_type: gate_evaluation_refused`
- `stage: handoff_gate`
- terminal failure code (`handoff_gate_blocked` or fail-closed invalid variant)
- step index and source/target roles
- canonical artifact digest and artifact ID
- `derived_from` raw T0 digest(s)
- every refused classified check as a safe structured issue
- `execution_id` in both result and provenance

The attempt-six replay uses an F4 runtime-built canonical envelope with a legal
`needs_revision` status and target `critic`. A detector evaluates that shape
against the test-locked legacy matrix (`accepted` only) and proves refusal, then
against the production matrix and proves passage. Its `blocked` variant travels
through the complete executor/seam path and reconstructs a failed step from
Ledger bytes alone. No filesystem correlation is used.

The leak detector embeds the distinctive semantic sentinel
`LIVE_F7_PAYLOAD_PROSE_MUST_NOT_ENTER_LEDGER`; it is absent from every Ledger
entry and the reconstruction result. The issue objects are closed against extra
keys, so neither payload prose nor the old gate message can enter reconstruction.

The sequencing detector forces the later terminal write to throw. The start and
`gate_evaluation_refused` records remain persisted before the seam reports
`seam_terminal_ledger_write_failed`.

## Fifteen-check coverage map

All named tests below are in `tests/roles/roleHandoffGate.test.ts` unless another
file is named.

| Check | Detector carrying refusal behavior |
| ---: | --- |
| 1 | `rejects invalid handoff envelope` |
| 2 | `rejects invalid source artifact` |
| 3 | `treats invalid registry override entries as invalid` |
| 4 | `rejects unknown source_role from registry override` |
| 5 | `rejects unknown target_role from registry override` |
| 6 | `rejects disallowed target_role` |
| 7 | `rejects artifact.role_id mismatch with source_role` |
| 8 | `rejects handoff that does not reference source_artifact.artifact_id` |
| 9 | `rejects required_next_role mismatch with target_role`; LIVE-F7 multi-refusal detector |
| 10 | Four `rejects identity mismatch across ...` fixtures |
| 11 | Structured status tests plus all LIVE-F7 attempt-six/matrix detectors |
| 12 | `pending handoff returns blocked...`; `completed handoff returns blocked...` |
| 13 | `rejects forbidden raw-input fields in the handoff envelope` |
| 14 | `rejects forbidden fields such as chain_of_thought` |
| 15 | `rejects embedded telemetry_trace.events`; `rejects embedded execution_context object` |

The implementation bodies for checks 1–10 and 12–15 were not changed. Their
existing refusal status, paths, messages, and ordering remain intact.

## Mandatory pins

- Catalog counts: **V1 = 13, Hollowcut = 9**.
- L1 allowlist: **not touched**; it remains the existing seven-entry boundary.
- Planner prompt digest, verified from committed bytes and unchanged:
  `sha256:f32675859e07243a7cf0cd8e743537f4c975826ea7bf684348ed128792489003`.
- Critic prompt digest, verified from committed bytes and unchanged:
  `sha256:27d169bbc002d2bcdcab89ac6df60f481e6311c015600883ed000a1f8031dd54`.
- Prompt files, F6 normalization, live adapters, provider transports, credentials,
  L1 routing, package files, and Vitest configuration were not touched.

## Validation

| Command | Result |
| --- | --- |
| Baseline `npx vitest run` | exit 0; 200 files / 3,199 tests |
| Focused LIVE-F7 + identity/LE-3-A locks | exit 0; 5 files / 73 tests |
| Final `npx vitest run` | exit 0; **201 files / 3,210 tests** |
| `node ./node_modules/typescript/bin/tsc --noEmit` | exit 0 |
| `npm run build` | exit 0 |
| V1/Hollowcut catalog CLI checks | exit 0; 13 / 9 |
| Committed prompt SHA-256 verification | exact match for both prompts |
| AUD-2 self-smoke from `fc8eb5a` | compliant, T2, 12 paths, zero violations |

The canonical count delta is one test file and eleven tests, all attributable to
LIVE-F7 detectors. The canonical suite also created one valid append-only
Change Guard milestone record, `snap_20260719T205052348Z_000439_milestone`.

## Files

Created:

- `docs/LIVE_F7_HANDOFF_GATE_EVIDENCE_REPORT.md`
- `examples/audit/live-f7-pass-manifest.valid.json`
- `tests/acceptance/liveF7HandoffGateEvidenceAcceptance.test.ts`

Changed:

- `.caleb/ledger/ledger.jsonl` (one append-only validation snapshot record)
- `PLANS.md`
- `docs/STATUS_LOG.md`
- `src/roles/roleHandoffGate.ts`
- `src/roleRuntime/types/roleRuntimeTypes.ts`
- `src/roleRuntime/roleRuntimeExecutor.ts`
- `src/logicEngine/rotationExecutionSeam.ts`
- `tests/roles/roleHandoffGate.test.ts`
- `tests/acceptance/raR1StaticRotationAcceptance.test.ts` (type-only callback widening)

Intentionally not changed: prompts, providers, transports, raw-output store,
LIVE-F4 semantic/envelope validators, F6 normalizer, L1 allowlist, catalogs,
CLI, packages, build/test configuration, and historical attempt-six records.

## Honest deviations

None.

LIVE-F7 is complete offline. E1 attempt seven is not part of this pass and
requires Pat's fresh event-specific authorization and host-shell credential
runbook after reviewer acceptance.

# LIVE-F8 Adapter-Stage Failure Evidence and Reconstruction Report

**Pass:** LIVE-F8 with Amendment A1

**Date:** 2026-07-19

**Result:** Accepted offline

## Outcome

LIVE-F8 closes the fifth and sixth cited telemetry-collapse paths. Every
adapter-returned failure now emits a bounded `role_invocation_failed` record
before executor exit. Amendment A1 makes the executor the exception boundary
for rejected/thrown `adapter.invoke()` calls, emits the same sibling record, and
returns structurally so live-state capture and terminal construction still run.

The F7 `gate_evaluation_refused` path is unchanged. No seam-level catch-all was
added. No additional non-adapter exception escape was concretely surfaced.

## Implemented record

`role_invocation_failed` is execution-keyed by the seam and carries these
bounded result fields:

- `plan_id`, `record_type`, `record_id`, `execution_id`
- `step_index`, `role_id`, `adapter_id`, `adapter_kind`
- `stage`, `taxonomy`, `error_name`
- `input_tokens`, `output_tokens`, `total_tokens`, `stop_reason`
- `budget` (`max_tokens`, `timeout_ms`, `max_response_bytes`)
- `t0_digest`, `observer_normalization_stage`, `trust_tier`

The runtime record additionally carries canonical task/run/trace/context
identity before seam conversion. Stage, taxonomy, stop reason, error name,
counts, budget, digest, and normalization values are runtime-allowlisted or
structurally bounded before Ledger serialization. Unknown values become `null`.
The record is T0 and may reference only its digest-addressed raw witness.

For an adapter-originated exception the fixed shape is
`stage: "invocation_exception"`, `taxonomy: null`, and the bounded constructor
identifier in `error_name`. Message text, stack text, payload prose, and inferred
provider attribution are excluded.

## Reconstruction and compatibility

Execution-keyed reconstruction reads `role_invocation_failed` as a sibling of
F7 gate-refusal evidence. It returns role/step/stage/taxonomy, safe telemetry,
T0 digest, and lineage from Ledger JSONL alone. The terminal points to the failed
record and includes its Ledger ID as a parent. Multi-attempt ambiguity behavior
is unchanged.

Historical attempts without the new record continue to reconstruct honestly
with `failed_step: null`. Successful execution emits no failure record. Its full
reconstruction serialization remains byte-identical to the pre-F8 oracle:
3,779 bytes, digest
`sha256:1ca00993ee54ed54d40760d303e148af62be77a35783eea125bd0b31385bd56c`.

## Detectors

- **T1 PASS:** PRE-7 Critic truncation at step 1 records
  `output_truncated`, exact token/budget/stop/T0 evidence, and reconstructs beside
  the successful Planner. The production LIVE-F5 truncation path independently
  proves the same mapping.
- **T2 PASS:** Planner `json_parse` failure reconstructs at step 0.
- **T3 PASS:** the failure record survives a forced later terminal-write throw.
- **T4 PASS:** failing payload sentinel is absent from Ledger and reconstruction.
- **T5 PASS:** successful reconstruction is byte-identical to the pre-F8 oracle;
  no failure record is emitted.
- **T6 PASS:** attempt-six-era absence reconstructs as `failed_step: null`.
- **T7 PASS:** throwing Planner adapter at step 0 produces record + terminal +
  reconstructed failed step with null taxonomy and constructor name only.
- **T8 PASS:** throwing Critic at step 1 reconstructs alongside Planner success.
- **T9 PASS:** the seam receives structured failure and constructs its terminal;
  the pre-fix vaporized-attempt behavior is impossible.
- **T10 PASS:** exception message and stack sentinels are absent from every Ledger
  and reconstruction serialization.

**Telemetry-collapse class: citations five AND six closed.** Citation five is
detector-locked by T1-T6; citation six is detector-locked by T7-T10.

## Validation

| Check | Result |
| --- | --- |
| Starting suite | 201 files / 3,210 tests, exit 0 |
| Focused LIVE-F8/F7/F5/F1/seam | 5 files / 36 tests, exit 0 |
| Canonical `npm test` | 202 files / 3,220 tests, exit 0 |
| `node ./node_modules/typescript/bin/tsc --noEmit` | exit 0 |
| `npm run build` | exit 0 |
| V1 catalog | 13, exit 0 |
| Hollowcut catalog | 9, exit 0 |
| AUD-2 self-smoke | compliant / T2 across 17 paths; 0 violations; exit 0 |

Catalogs verbatim: **V1 = 13, Hollowcut = 9.**

Prompt digest line: Planner
`sha256:f32675859e07243a7cf0cd8e743537f4c975826ea7bf684348ed128792489003`;
Critic
`sha256:27d169bbc002d2bcdcab89ac6df60f481e6311c015600883ed000a1f8031dd54`.
Both were verified unchanged.

L1: not touched. The seven-entry allowlist file has zero diff from `5925e35`.

## Scope integrity

Gate matrix and all fifteen checks, prompts, L1, LE-3 bridge, F6 normalization,
provider transports, both live fixtures, package/config files, and historical
Ledger lines are unchanged. Ledger changes are append-only snapshot evidence.
No live call, credential use, or network attempt occurred.

Honest deviations: **none**.

Snapshots: prechange
`snap_20260720T001940267Z_000444_milestone`; validation
`snap_20260720T003952059Z_000446_milestone`. Both completed with 18 files
captured and Ledger entries written.

## Roadmap

PRE-7 may restart from Section 2 after this commit is accepted. Attempt seven
remains unauthorized until PRE-7 completes and Pat gives fresh event-specific
authorization from his host shell under the committed runbook.

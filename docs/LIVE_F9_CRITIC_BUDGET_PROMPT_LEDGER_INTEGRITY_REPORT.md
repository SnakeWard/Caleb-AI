# LIVE-F9 Critic Budget, Prompt Hardening, and Ledger Byte-Integrity Report

**Pass:** LIVE-F9

**Date:** 2026-07-19

**Result:** Accepted offline

## Outcome

The E1 Critic output budget is now 2,048 tokens while Planner remains capped at
1,536 and the run envelope remains 2 invocations / 8,192 tokens / $0.05. The
Critic prompt now binds exact JSON framing, complete semantic-field presence,
list cardinalities, and per-string lengths. Git resolves every path under
`.caleb/ledger/**` as `text: unset`, preventing line-ending conversion of
append-only Ledger evidence.

No live call, credential use, or provider network attempt occurred. Attempt
eight is not authorized by this pass.

## Prompt and digest pins

**New Critic digest, computed from committed bytes:**
`sha256:8074e98c3317f24cfe4f5bd1b94e9328ffe75e1f390a81f776badb759d3b8e8f`.

**Planner digest, verified byte-identical:**
`sha256:f32675859e07243a7cf0cd8e743537f4c975826ea7bf684348ed128792489003`.

The old Critic digest
`sha256:27d169bbc002d2bcdcab89ac6df60f481e6311c015600883ed000a1f8031dd54`
is retained only as historical test evidence and is absent from active source,
test, and live-fixture references.

Chosen Critic prompt bounds:

- `summary`: 200 characters.
- `claim_id` and each claim `evidence_ref_id`: 160 characters.
- claim `text`: one sentence, 200 characters.
- assumptions, constraints, open questions, recommendations, and handoff-note
  strings: 200 characters each.
- evidence `ref_id`: 160 characters; evidence `description`: one sentence,
  200 characters.
- cardinalities: 3 claims; 3 assumptions, constraints, and open questions each;
  4 recommendations; 6 evidence references; 2 handoff notes.

The prompt requires the first non-whitespace character to be `{`, the last to
be `}`, forbids backticks/preamble/trailing commentary, and requires all ten
semantic fields. Runtime-envelope ownership and digest-reference guidance are
retained.

## Budget and fixture findings

Fixture diff summary: the E1 runtime budget has exactly one changed value,
Critic `max_tokens` 1,536 → 2,048. Planner `max_tokens`, both timeouts and byte
caps, and every run-level budget are unchanged. E1 and E2 additionally carry
the required Critic prompt digest re-pin; E2 has no budget change.

Truncation-plumbing finding: observer truncation classification was already
fixture-tracked through the resolved invocation budget; no 1,536 equality
literal existed in production. The live-evidence validator did have a single
1,536 role ceiling. It now enforces a role-specific 1,536 Planner maximum and
a 2,048 Critic maximum. Detectors refuse Planner at 1,537 and Critic at 2,049,
so the amendment does not widen Planner.

The PRE-7 negative rehearsal now derives its truncation token count from the
resolved Critic budget and contains no literal 1,536.

## Detectors

- **T1 PASS:** every structural, cardinality, and string bound is present; the
  exact pre-LIVE-F9 prompt fixture fails the same detector.
- **T2 PASS:** Critic resolves 2,048 from E1; 2,048 / `end_turn` classifies
  `output_truncated`; 1,536 / `end_turn` succeeds.
- **T3 PASS:** PRE-7 runs against the resolved budget and the negative rehearsal
  remains generic.
- **T4 PASS:** Planner bytes retain their full digest, Critic recomputes to the
  new full digest, both live fixtures are re-pinned, and the old digest has no
  active reference.
- **T5 PASS:** `git check-attr text -- .caleb/ledger/ledger.jsonl` returns
  `text: unset`; an outside documentation path returns `text: unspecified`,
  proving the detector is non-vacuous.
- **T6 PASS:** the semantic validator remains byte-identical at
  `sha256:5ca62b263a48f9be3fd4d2014b7021efa3653f31add6e032b2c6c6691f7be292`
  and still accepts a schema-legal fourth claim. Prompt bounds remain guidance,
  not a validator contract change.

## Validation

| Check | Result |
| --- | --- |
| Starting canonical suite | 203 files / 3,224 tests; exit 0 |
| Focused LIVE-F9/PRE-7/F5/F6/F8/gate suite | 6 files / 37 tests; exit 0 |
| Post-change canonical `npm test` | 204 files / 3,230 tests; exit 0 |
| `node ./node_modules/typescript/bin/tsc --noEmit` | exit 0 |
| `npm run build` | exit 0 |
| V1 catalog | 13; exit 0 |
| Hollowcut catalog | 9; exit 0 |
| AUD-2 self-smoke | compliant / T2; 16 paths; 0 violations; exit 0 |

The first post-change canonical attempt timed out only the existing H5 stale-
allowlist detector at its 5-second budget under suite contention. Its serial
masking guard passed 1/1 in 95 ms with no assertion failure; a clean-process
canonical rerun then passed 3,230/3,230. No timeout or assertion was changed.

Catalogs verbatim: **V1 = 13, Hollowcut = 9.**

L1: **not touched**. The seven-entry route-input allowlist is unchanged.

## Scope and evidence integrity

Gate matrix and all fifteen handoff checks, L1, LE-3 bridge, Planner prompt,
semantic validator, F6 normalizer, F8 records/reconstruction, transports, and
provider adapters have empty diffs. The only production plumbing change is the
role-specific live-evidence token ceiling described above.

`.caleb/ledger/ledger.jsonl` is a pure three-record append from canonical test
runs: snapshots `snap_20260720T045308318Z_000452_milestone`,
`snap_20260720T045424235Z_000453_milestone`, and
`snap_20260720T045723805Z_000454_milestone`. No historical byte was changed;
the last is the green canonical validation snapshot. Prechange snapshot
`snap_20260720T044005823Z_000451_milestone` was committed before mutation.

Standing question for RA-X-adjacent design: whether prompt cardinality guidance
should ever become validator policy remains deliberately unresolved.

Honest deviations: **none**.

## Verdict

LIVE-F9 Critic Budget, Prompt Hardening, and Ledger Byte-Integrity: Accepted
offline — Critic has bounded room to complete, the prompt constrains that room,
and Git cannot rewrite the Ledger's bytes.

Attempt eight remains unauthorized pending Pat's fresh event-specific words and
host-shell execution under the committed runbook.

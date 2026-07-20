# PRE-7 Live-Event Runbook and Mock Full-Rotation Rehearsal Report

**Pass:** PRE-7 restart after LIVE-F8

**Date:** 2026-07-19

**Result:** Accepted offline

## Outcome

PRE-7 now proves the complete E1 single-cycle `planner_critic` path through the
production bridge, live runtime adapter, Anthropic adapter with its fetch
dependency injected, strict F4 runtime envelope construction, modernized check
11, M3 storage, JSONL Ledger, terminal writer, and execution-keyed
reconstruction. The xAI adapter is not exercised because E1 binds both roles to
Anthropic.

The rehearsal performs no live call and reads no credential. It runs two
successful Planner variants (`needs_revision` and `accepted`) and one negative
Critic-truncation variant. The negative now reconstructs honestly through the
`role_invocation_failed` evidence delivered by LIVE-F8.

## Runbook codification

Runbook document path: `docs/01_CODEX_OPERATING_CONTRACT.md`.

The amendment text as committed, verbatim:

> **Final step (mandatory):** After the unset proof, commit the event's ledger appends as a standalone commit containing only `.caleb/ledger/ledger.jsonl`, with the event label in the commit message (e.g. `LIVE-R2-E1-A7: attempt seven ledger evidence — <n> append-only records, <terminal status summary>`). Verify the diff is pure append before committing. Push and verify synchronization. A live event is not complete until this commit exists on the remote.

The codification was committed and synchronized in the first PRE-7 phase at
`5925e356ec824f5974bc7418200175ed13e5cf26`. No other runbook step was altered,
reordered, or paraphrased.

## Rehearsal identities

**Step index 1 executed under mock for the first time** with these rehearsal
execution IDs:

- `execution_77777777-7777-4777-8777-777777777701` — Planner
  `needs_revision`, Critic completed.
- `execution_77777777-7777-4777-8777-777777777702` — Planner `accepted`,
  Critic completed.
- `execution_77777777-7777-4777-8777-777777777703` — Planner
  `needs_revision`, Critic invoked and rejected as `output_truncated`.

“Under mock” means the real Anthropic adapter executed with its production
`fetch_impl` seam bound to a test response. The plan and Ledger correctly retain
`adapter_kind: live`; no global fetch or network transport was used.

## D3 assertion results

1. **Planner -> Critic gate passage — PASS.** Both `needs_revision` and
   `accepted` produce a step-0 Planner invocation with
   `handoff_gate_status: allowed`; no `gate_evaluation_refused` record exists;
   Critic executes at step 1.
2. **Step-index-1 identity — PASS.** Each run's Critic invocation/failure record
   carries step index 1, role `critic`, and the expected `execution_id`.
3. **Two-artifact Critic lineage — PASS.** The exact normalized Critic bytes are
   stored as T0 before validation. Each successful canonical Critic artifact has
   its own digest and exactly one `derived_from` raw T0 digest. The same proof is
   applied to Planner.
4. **Successful terminal — PASS.** Both positive seam results return `ok: true`;
   each terminal is `rotation_execution_completed`, status `completed`, with two
   completed steps and no failure code.
5. **Ledger-byte reconstruction — PASS.** Reconstruction receives only the
   test-scoped JSONL bytes and plan/execution identity. It rebuilds Planner and
   Critic in order, both T0/canonical lineages, and links the reconstructed
   Planner invocation to the Ledger record that carries the allowed gate
   evaluation. Reconstruction without an explicit execution ID selects the same
   unique chain, proving absence of ambiguity. No M3 or other filesystem
   correlation is used to reconstruct the chain.
6. **Absence proofs — PASS.** Every model Ledger entry remains T1 and every raw
   store record declares T0 with a T1 maximum; no trust promotion occurs. The
   injected Anthropic fetch is called exactly twice per run while the global
   egress trap records zero attempts. Both absence detectors have known-
   violation assertions proving they fail for T2 and a nonzero egress count.

## D4 negative rehearsal

**PASS.** The Critic response in execution
`execution_77777777-7777-4777-8777-777777777703` reports
`stop_reason: max_tokens` and `output_tokens: 1536`, equal to its declared
budget. The observer classifies `output_truncated` before parse/semantic
validation. The raw Critic T0 survives. `role_invocation_failed` records step 1,
role, taxonomy, token counts, stop reason, full numeric budget, T0 digest, and
null normalization stage without payload prose. Ledger-byte reconstruction
returns the successful Planner beside the fully populated failed Critic step.
The unique truncation sentinel is absent from Ledger and reconstruction output.

## Validation

| Check | Result |
| --- | --- |
| Starting canonical `npm test` | 202 files / 3,220 tests; exit 0 |
| Focused PRE-7 | 1 file / 4 tests; exit 0 |
| Final canonical `npm test` | 203 files / 3,224 tests; exit 0 |
| `npm run typecheck` | exit 0 |
| `npm run build` | exit 0 |
| V1 catalog | 13; exit 0 |
| Hollowcut catalog | 9; exit 0 |
| AUD-2 self-smoke | compliant / T2 across 10 paths; 0 violations; exit 0 |

Catalogs verbatim: **V1 = 13, Hollowcut = 9.**

Prompt digest line: Planner
`sha256:f32675859e07243a7cf0cd8e743537f4c975826ea7bf684348ed128792489003`;
Critic
`sha256:27d169bbc002d2bcdcab89ac6df60f481e6311c015600883ed000a1f8031dd54`.
Both were verified unchanged.

L1: **not touched**. The seven-entry allowlist remains exactly
`contract_validated_task_frame`, `verified_signal_frame`,
`engine_internal_state`, `deterministic_hollow_signal`,
`accepted_gate_policy_result`, `human_pat_approval_record`, and
`snapshot_change_guard_state`.

## Scope and evidence integrity

The gate matrix, all fifteen checks, prompts, L1, LE-3 bridge rules, F6
normalization, providers and transport, E1/E2 live fixtures, package/config
files, and historical Ledger lines are untouched. The provider transport diffs
are empty and the two production egress call sites remain the Anthropic and xAI
fetch invocations. The new rehearsal fixtures are all clearly named
`rehearsal-*`.

The Ledger working-tree diff is append-only: three milestone snapshot records,
zero modified/deleted historical lines. The explicit restart prechange snapshot
is `snap_20260720T032512227Z_000448_milestone`; the canonical baseline/final CLI
test records are `snap_20260720T032220137Z_000447_milestone` and
`snap_20260720T033506534Z_000449_milestone`.

No live call, credential, provider network attempt, prompt change, gate change,
or production source change occurred.

Honest deviations: **none**.

## Roadmap

PRE-7's residual unknowns for E1 attempt seven are now provider-side only.
Attempt seven is still unauthorized until Pat supplies fresh event-specific
authorization in his own words and executes from his host shell under the
committed runbook, including its mandatory final evidence-only commit.

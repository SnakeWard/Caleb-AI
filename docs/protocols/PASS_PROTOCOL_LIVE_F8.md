# LIVE-F8 — Adapter-Stage Failure Record + Failed-Step Reconstruction (Fifth Telemetry-Collapse Citation)

**Pass ID:** LIVE-F8
**Seat:** Implementer (Codex), sandboxed. No live calls, no credentials, no network egress.
**Authorized by:** Pat (T4), remote authorization, July 19, 2026.
**Reviewer/planner:** Claude Fable 5.
**Origin:** PRE-7 Section 9 STOP. The D4 negative rehearsal proved that an adapter-stage failure at step 1 reconstructs with Planner only and `failed_step: null`. Diagnosis confirmed by code citation: executor halts on `adapter_rejected` without creating a failed-step record (`roleRuntimeExecutor.ts:108`); reconstruction reads only successful `rotation_role_invocation` records and `gate_evaluation_refused` records (`rotationExecutionSeam.ts:598`).
**Protocol commit:** this file commits to `docs/protocols/` before or with the work.

---

## Section 1 — Objective

Close the **fifth cited instance** of the telemetry-collapse defect class (prior: runner→H3, seam→F1, observer→F4, gate→F7; now adapter/executor→F8). The defect is not step-specific: **every** adapter-stage failure at **any** step index currently fails to reconstruct as a failed step, because no per-step failure record is ledgered and reconstruction has no source to read. Fix: an additive, ledgered adapter-stage failure record plus execution-keyed reconstruction support, symmetric with F7's gate solution. No validation loosening; no behavior change on success paths.

## Section 2 — Verified starting state (STOP if any fails)

- Tree clean; `main` and `origin/main` synchronized at `5925e356ec824f5974bc7418200175ed13e5cf26` (or a later commit whose provenance is in the record).
- Suite baseline: **201 files / 3,210 tests green**; typecheck and build exit 0.
- Catalogs: **V1 = 13, Hollowcut = 9.**
- Prompt digests: Planner `sha256:f32675859e07243a7cf0cd8e743537f4c975826ea7bf684348ed128792489003`, Critic `sha256:27d169bbc002d2bcdcab89ac6df60f481e6311c015600883ed000a1f8031dd54`. Untouched this pass.
- PRE-7 runbook codification present at `docs/01_CODEX_OPERATING_CONTRACT.md` (from `5925e35`).

## Section 3 — Design decisions (pre-answered; deviation = STOP)

**D1 — New record type `role_invocation_failed`,** written by the executor **before** any adapter-stage failure return, keyed by `execution_id`, containing: step index; role identity of the failed step; failure stage and taxonomy **verbatim per LIVE-F1 conventions** (codes preserved exactly, `null` when unknown, never fabricated attribution — e.g. `output_truncated`, `json_parse`, `payload_validation`, `envelope_validation`, `identity_mismatch`, `network_failure`); safe telemetry (token counts, stop reason, budget values — numbers and enums only); the stored T0 digest for the failed step (T0-before-validation per F5 doctrine is already in force and unchanged); observer normalization stage if reached; **never payload prose, never free-text messages.**

**D2 — Symmetry, not refactor.** `gate_evaluation_refused` (F7) is untouched. `role_invocation_failed` is a sibling record, not a unification. Terminal-record telemetry preservation (`rotationExecutionSeam.ts:1136`) is untouched — the terminal record and the per-step record coexist; the per-step record is what reconstruction reads.

**D3 — Reconstruction.** Execution-keyed reconstruction is extended to read `role_invocation_failed` records and return a populated `failed_step` — step index, role, stage, taxonomy, safe telemetry, T0 digest — for a failure at **any** step index, from ledger bytes alone, no filesystem correlation. `reconstruction_ambiguous` semantics unchanged. Successful-chain reconstruction output is byte-identical to current behavior (prove by fixture).

**D4 — Historical records.** Attempts one through six's existing ledger lines are append-only history; no retro-editing (F7 D7 doctrine). Reconstruction of those historical executions may still return `failed_step: null` where no `role_invocation_failed` record exists — that is honest, and a detector documents it rather than papering over it.

**D5 — Untouched surfaces.** Gate matrix, all fifteen checks, prompts, L1 allowlist (seven entries), LE-3 bridge rules, F6 normalization, transport, both live fixtures. No live calls.

## Section 4 — Implementation scope (ordered)

1. Implement `role_invocation_failed` emission at the executor's adapter-failure path, evidence before exit.
2. Extend reconstruction per D3.
3. Detectors per Section 5.
4. Full suite, typecheck, build, AUD-2, report, commit.

## Section 5 — Detector requirements (R37: every detector proven against a known violation)

- **T1 — PRE-7 D4 shape as the known violation:** mocked Critic truncation at step 1 (tokens == budget) produces `role_invocation_failed` with stage `output_truncated`, and reconstruction returns the failed step with full detail. This is the exact shape that stopped PRE-7.
- **T2 — Step-0 parity:** a mocked Planner adapter failure (e.g. `json_parse`) produces the record and reconstructs at step 0 — proving the fix is step-general, not step-1-special.
- **T3 — Sequencing:** a post-record throw (terminal write forced to fail) leaves `role_invocation_failed` present in the ledger; the seam reports its own failure honestly (F7 T4 pattern).
- **T4 — Leak path:** sentinel string in the failing payload appears nowhere in the record or reconstruction output.
- **T5 — Success-path invariance:** a fully successful mocked chain reconstructs byte-identically to pre-F8 behavior; no new record is emitted on success.
- **T6 — Historical honesty:** reconstruction of an attempt-six-era fixture (no `role_invocation_failed` present) returns `failed_step: null` without error — the absence is reported, not fabricated.

## Section 6 — Forbidden actions

No loosening of any validator or gate; no speculative normalization; no payload prose in any record; no prompt/L1/LE-3/matrix edits; no retro-editing of ledger history; no live calls or credentials; no report fabrication.

## Section 7 — Mandatory report lines

Catalogs verbatim (13/9 expected); suite counts before/after with canonical-command exit codes; both full prompt digests verified unchanged; L1 not-touched declaration; the `role_invocation_failed` field list as implemented; telemetry-collapse class: **fifth citation closed**, with detector references; per-detector T1–T6 results; AUD-2 result; honest deviations (or "none").

## Section 8 — Commit and handoff discipline

`LIVE-F8` in every commit message; protocol to `docs/protocols/`; clean tree + synchronized remote before handoff; report rides the handoff.

## Section 9 — STOP conditions

Any Section 2 failure; the executor fix cannot be made without touching a forbidden surface; any additional evidence-losing exit path discovered in the executor/seam beyond the diagnosed one (report it — it may be citation six, and Pat hears it before scope grows); T5 invariance cannot be proven; any unexplained suite regression.

## Section 10 — Roadmap boundary

On acceptance, **PRE-7 restarts from its Section 2** against the post-F8 baseline; its D4 negative rehearsal must now pass honestly. Attempt seven remains unauthorized until PRE-7 completes and Pat gives fresh event-specific authorization from his host shell under the codified runbook. The rehearsal's purpose stands: attempt seven proceeds only when its residual unknowns are provider-side only.

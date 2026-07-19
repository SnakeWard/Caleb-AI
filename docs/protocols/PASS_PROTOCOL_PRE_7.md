# PRE-7 — Live-Event Runbook Codification + Mock Full-Rotation Rehearsal

**Pass ID:** PRE-7
**Seat:** Implementer (Codex), sandboxed. No network egress, no live calls, no credentials.
**Authorized by:** Pat (T4), remote authorization, July 19, 2026.
**Reviewer/planner:** Claude Fable 5.
**Protocol commit:** this file commits to `docs/protocols/` before or with the work.

---

## Section 1 — Objective

Two deliverables preparing E1 attempt seven without executing it:

**(1) Codify the live-event runbook amendment** (authorized by Pat during LIVE-F7's evidence-commit disposition) into the committed operating contract: *a live event is complete only when its ledger appends are committed under the event's own label.* The amendment currently exists only in session record; doctrine must live in the repo.

**(2) Mock full-rotation rehearsal detector.** Prove, on mocks, the complete E1 single-cycle `planner_critic` rotation end-to-end through the modernized gate: mocked Planner response → F4 canonical envelope construction → check-11 matrix passage → **Critic invocation (step index 1 executing for the first time anywhere, mock or live)** → mocked Critic response → canonical Critic artifact → terminal ledger chain → full execution-keyed reconstruction from ledger bytes alone. After this pass, attempt seven's residual unknowns are provider-side only.

## Section 2 — Verified starting state (STOP if any fails)

- Tree clean; `main` and `origin/main` synchronized at `73da1fb` (or a later commit whose provenance is in the record).
- Suite baseline: **201 files / 3,210 tests green**; typecheck and build clean.
- Catalogs: **V1 = 13, Hollowcut = 9.**
- Prompt digests: Planner `sha256:f32675859e07243a7cf0cd8e743537f4c975826ea7bf684348ed128792489003`, Critic `sha256:27d169bbc002d2bcdcab89ac6df60f481e6311c015600883ed000a1f8031dd54`. This pass must not touch prompt files.

## Section 3 — Design decisions (pre-answered; deviation = STOP)

**D1 — Runbook location and text.** The amendment is appended to the live-event runbook section of the operating contract document (wherever the credential runbook is committed; if the runbook exists only in protocol files, create `docs/LIVE_EVENT_RUNBOOK.md` consolidating the standing runbook verbatim plus the amendment). The amendment's normative text:

> **Final step (mandatory):** After the unset proof, commit the event's ledger appends as a standalone commit containing only `.caleb/ledger/ledger.jsonl`, with the event label in the commit message (e.g. `LIVE-R2-E1-A7: attempt seven ledger evidence — <n> append-only records, <terminal status summary>`). Verify the diff is pure append before committing. Push and verify synchronization. A live event is not complete until this commit exists on the remote.

No other runbook step may be altered, reordered, or paraphrased.

**D2 — Rehearsal fidelity.** The rehearsal uses the real production code path — real CLI entry or seam entry, real gate, real ledger writes to a test-scoped ledger file, real reconstruction — with mocks at exactly the two pinned egress call sites (Anthropic adapter; the xAI adapter is not exercised in E1 shape). Mock Planner payload: a valid 10-field semantic payload with `acceptance_status: needs_revision` (the attempt-six shape — rehearse the case that blocked us, not the easy one). A second variant with `accepted` also runs. Mock Critic payload: a valid semantic payload per the Critic's bounded payload contract.

**D3 — What the rehearsal must prove (each an explicit assertion):**
- Gate passes Planner→Critic for both `needs_revision` and `accepted` variants.
- Step index 1 (Critic) is invoked: the invocation record exists, keyed by `execution_id`, with correct role identity.
- Critic's raw T0 is stored before validation; canonical Critic artifact carries `derived_from` to its T0.
- Terminal record shows a completed single cycle with `ok: true`.
- Reconstruction from ledger bytes alone rebuilds the full two-step chain — both roles, both two-artifact lineages, gate evaluation — without filesystem correlation and without ambiguity.
- Absence assertions: no trust promotion occurred anywhere in the chain (all model artifacts remain ≤ T1); rehearsal made zero network attempts (H5 traps or equivalent proof).

**D4 — Negative rehearsal.** One variant where the mocked Critic returns a truncation-shaped response (tokens == budget), proving the LIVE-F5 `output_truncated` stage fires at step 1 and the failed step reconstructs with full detail — the F7 evidence guarantees proven at the second step, not just the first.

**D5 — Untouched surfaces.** Gate matrix untouched. Fourteen checks untouched. L1 allowlist untouched (seven entries). Prompt files untouched. LE-3 bridge rules untouched (`planner_critic` is already a legal route). No live fixture files altered; rehearsal fixtures are new, clearly named `rehearsal-*`.

## Section 4 — Implementation scope (ordered)

1. Commit runbook codification (D1).
2. Build rehearsal fixtures and mock adapters at the pinned call sites (D2).
3. Implement rehearsal detectors (D3), then the negative rehearsal (D4).
4. Full suite, typecheck, build, AUD-2, report, commit.

## Section 5 — Detector requirements

All D3 assertions and the D4 negative case are permanent suite members, not one-shot scripts. R37 discipline: the negative rehearsal is the known-violation proof; the absence assertions (no promotion, no egress) must each be provably capable of failing (e.g. sentinel-based, not vacuous).

## Section 6 — Forbidden actions

No live calls; no credentials in any environment; no gate/matrix/prompt/L1/LE-3 edits; no speculative normalization; no edits to existing live fixtures or ledger history; no report fabrication.

## Section 7 — Mandatory report lines

- Catalogs verbatim: V1 = 13, Hollowcut = 9 (unchanged expected).
- Suite counts before/after, canonical commands to completion with exit codes.
- Prompt digest line: both full hashes, verified unchanged.
- L1: not touched (declaration).
- Runbook document path and the amendment text as committed, verbatim.
- Explicit line: **"Step index 1 executed under mock for the first time"** with the rehearsal `execution_id`s.
- D3 assertion-by-assertion results; D4 result.
- AUD-2 result. Honest deviations (or "none").

## Section 8 — Commit and handoff discipline

`PRE-7` in every commit message; protocol committed to `docs/protocols/`; handoff complete only with clean tree and synchronized remote; report rides the handoff.

## Section 9 — STOP conditions

Any Section 2 precondition failure; any rehearsal assertion that cannot pass without touching a forbidden surface (that is a finding — the interior is not as clear as believed, and Pat hears it before attempt seven); any suite regression not explained by this pass; ambiguity in where the runbook canonically lives.

## Section 10 — Roadmap boundary

This pass does not authorize or execute attempt seven. On acceptance, attempt seven requires Pat's fresh event-specific authorization in his own words, from his own host shell, under the now-committed runbook including its final evidence-commit step. E2 remains behind attempt seven on Pat's separate word. RA-X remains parked at the fork.

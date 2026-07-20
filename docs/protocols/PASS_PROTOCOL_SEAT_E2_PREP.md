# SEAT-E2-PREP — Seat Doctrine Codification + E2 Readiness (Grok Seat Calibration Pass)

**Pass ID:** SEAT-E2-PREP
**Seat:** Implementer — **Grok 4.3, Grok Build TUI host** (first pass in seat; SEAT-ONBOARD-1 disclosure on record).
**Authorized by:** Pat (T4) — his relay constitutes authorization.
**Reviewer/planner:** Claude Fable 5.
**Protocol commit:** this file commits to `docs/protocols/` before or with the work.

---

## Section 1 — Objective

Five deliverables, all docs/fixtures/tests — no runtime-behavior source changes:

1. **Seat-binding clarification** in the operating contract.
2. **Honest-deviations rule codified** into the operating contract (closing the SEAT-ONBOARD-1 finding: the rule is enforced in practice but absent from the contract text).
3. **ENV-1: implementer seat record** — correct the historical seat-physics claim and establish per-seat environment disclosure as doctrine.
4. **E2 Critic budget parity:** 1,536 → 2,048 in the E2 fixture.
5. **Two-key credential runbook addendum** for cross-family live events.

This is also the seat's calibration: the report is judged at full house standard. A recap is not a report.

## Section 2 — Verified starting state (STOP if any fails)

- Tree clean; `main`/`origin/main` synchronized at `c7cd2dc` (or later with recorded provenance).
- Suite baseline: **205 files / 3,231 tests green**; typecheck and build exit 0.
- Catalogs: **V1 = 13, Hollowcut = 9.**
- Template digests: Planner `sha256:f32675859e07243a7cf0cd8e743537f4c975826ea7bf684348ed128792489003`; Critic `sha256:8074e98c3317f24cfe4f5bd1b94e9328ffe75e1f390a81f776badb759d3b8e8f`. Untouched this pass.
- Both credential variables ABSENT in the seat's environment (re-verify with the quote-free sibling check for `ANTHROPIC_API_KEY` and `XAI_API_KEY`; paste raw output in the report).

## Section 3 — Design decisions (pre-answered; deviation = STOP)

**D1 — Seat binding.** The operating contract gains, near its head, a short titled clause: the contract binds the **implementer seat**, whichever agent and host hold it; agent/host identity is a non-promoter and confers no trust; every seat holder operates under SEAT-ONBOARD disclosure before its first pass. The historical filename may stand (rename is optional and NOT authorized this pass — note it as housekeeping if desired).

**D2 — Honest-deviations rule (normative text, verbatim into the contract as a titled section):**

> **Honest deviations.** Any departure from a governing protocol — scope, sequence, method, or outcome — is reported as a deviation in the pass report, plainly labeled, whether or not it was beneficial. "Honest deviations: none" is an affirmative mandatory line; silence is not equivalent to "none". A deviation honestly reported is reviewable material; a deviation discovered unreported is a contract violation regardless of the deviation's merit. Deviations that survive review become gates.

**D3 — ENV-1 seat record.** Create `docs/IMPLEMENTER_SEAT_RECORD.md`, append-only, one section per seat tenure:
- **Correction entry first:** the campaign record described the Codex seat as sandboxed with no egress; Pat has disclosed the locally installed Codex app held the seat for much of the campaign. Record: the behavioral guarantees held (H5-trapped offline suite, credential field catches, live execution from Pat's shell only), but the enforcement class was configuration-and-discipline, not wall. Label honestly; no beautification. Attempts one/two's network-failure attribution ("sandbox egress") is annotated as superseded by this correction — the *finding* those failures produced (human-host live execution doctrine) stands on its own merits regardless.
- **Grok seat entry:** host (Grok Build TUI), reasoning locus (xAI cloud), workspace root, outside-root capability as disclosed, execution/approval mode as disclosed, network policy as disclosed (**indeterminate from inside**) plus the field for Pat's external verification result — filled with whatever Pat reports, including "host exposes no policy setting" if true, never left implicitly blank.
- **Doctrine line:** seat environment is disclosed and recorded per tenure via SEAT-ONBOARD; the seat record is a standing precondition reference for future passes.

**D4 — E2 budget parity.** In the E2 fixture: Critic `max_tokens` 1,536 → 2,048. Nothing else in the fixture changes (the Critic digest re-pin already landed in LIVE-F9). The live-evidence validator's role ceilings (F9) must be confirmed to govern by role, not by fixture — if E2's Critic would be refused at >1,536 by any remaining literal, fixing that plumbing is in scope; report either way.

**D5 — Two-key runbook addendum (normative, into the live-event runbook):** for cross-family events, the credential lifecycle runs per key — sibling-process check for **each** variable (`ANTHROPIC_API_KEY`, `XAI_API_KEY` per G2 convention) expecting ABSENT, set both, authorize (register entry per AUTH-2 step), execute, `Remove-Item` both, verify ABSENT for both, close window. Unset proofs for **both** keys ride the evidence. The quote-free check form is the committed form (field-proven; quoted forms fail Windows native argument passing).

**D6 — Seat-specific boundaries for this pass (binding on Grok):** no writes outside `D:\Caleb AI`; no network tool use of any kind; no live provider calls; no credential setting; every shell command it runs listed in the report. These are contract-plus-detector boundaries in the absence of a wall — the disclosure said the cage is wide, so the contract names the bars.

## Section 4 — Implementation scope (ordered)

1. Contract edits: D1 seat-binding, D2 honest-deviations.
2. ENV-1 seat record (D3).
3. E2 fixture parity + ceiling confirmation (D4).
4. Runbook addendum (D5).
5. Detectors (Section 5); full suite, typecheck, build, AUD-2, report, commit.

## Section 5 — Detector requirements (R37: proven against known violations)

- **T1:** static assertions that the contract contains the seat-binding clause and the honest-deviations section (D2 text); proven failing against the pre-pass contract text (fixture copy).
- **T2:** E2 fixture Critic budget resolves to 2,048; E1 unchanged at 2,048; Planner budgets unchanged at 1,536 in both.
- **T3:** validator role-ceiling check passes a 2,048-token Critic under the E2 fixture path and refuses at 2,049; Planner refused at 1,537 (existing F9 detectors may carry part of this — map them).
- **T4:** runbook contains the two-key lifecycle with both variable names and the quote-free check form; proven failing against pre-pass runbook text.
- **T5:** seat record file exists with the correction entry, the Grok entry, and the doctrine line; mandatory fields present (parseable-shape assertion in the AUTH-2 register-detector style).

## Section 6 — Forbidden actions

Everything in D6, plus: no speculative normalization; no prompt edits; no L1/gate/LE-3/ledger-history edits; no validator loosening; no report fabrication; no register entries invented.

## Section 7 — Mandatory report lines

Catalogs verbatim (13/9 expected); suite counts before/after with canonical-command exit codes; both template digests verbatim, verified unchanged; L1 not-touched declaration; Section 2 credential-check raw outputs; D4 ceiling finding (governed-by-role confirmed, or what was fixed); full list of shell commands executed (D6); the D2 and D5 texts as committed, verbatim; AUD-2 result; **honest deviations (or "none")** — this line is being written into the contract by this very pass; the pass that omits it fails poetically.

## Section 8 — Commit and handoff discipline

`SEAT-E2-PREP` in every commit message; protocol to `docs/protocols/`; clean tree + synchronized remote; report rides the handoff.

## Section 9 — STOP conditions

Any Section 2 failure; either credential variable PRESENT; any deliverable requiring a write outside the workspace root or a network action; D4 surfacing plumbing that cannot be fixed without touching runtime behavior beyond the ceiling table; contract text ambiguity about where a section belongs (report placement options rather than choosing silently); any unexplained suite regression.

## Section 10 — Roadmap boundary

This pass does not authorize E2. On acceptance: E2 — cross-family, Anthropic Planner, Grok (xAI) Critic — awaits Pat's separate event-specific words, recorded in the authorization register **before** the wire per the AUTH-2 step, executed from Pat's host shell under the two-key runbook this pass commits. The xAI adapter's first live exposure is expected to climb the ladder; the ladder is the product.

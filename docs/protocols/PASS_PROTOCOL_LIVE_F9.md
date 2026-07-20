# LIVE-F9 — Critic Budget Raise + Critic Prompt Hardening + Ledger Byte-Integrity

**Pass ID:** LIVE-F9
**Seat:** Implementer (Codex), sandboxed. No live calls, no credentials, no network egress.
**Authorized by:** Pat (T4), July 19, 2026.
**Reviewer/planner:** Claude Fable 5.
**Origin:** LIVE-F9 diagnostic (accepted) on attempt seven's `live_observer_output_truncated` at step 1. Classification (c): budget insufficiency proven by structural arithmetic (complete-payload lower bound ~1,543 tokens > 1,536 budget) AND prompt defect proven by field evidence (fence emitted despite line-10 instruction; unbounded list sizes).
**Protocol commit:** this file commits to `docs/protocols/` before or with the work.

---

## Section 1 — Objective

Three deliverables:

**(1) Critic budget raise:** `max_tokens` 1,536 → **2,048** for the Critic role in the E1 live fixture. Run-level ceilings (8,192 total tokens, $0.05 spend, 2 invocations) unchanged — the raised per-role budget fits within all of them.

**(2) Critic prompt hardening,** adopting the field-proven F6 Planner constraint style plus numeric bounds per the accepted diagnostic. This re-pins the Critic prompt digest.

**(3) Ledger byte-integrity:** a `.gitattributes` entry pinning `.caleb/ledger/**` against line-ending rewriting, closing the CRLF threat observed during attempt seven's evidence commit.

## Section 2 — Verified starting state (STOP if any fails)

- Tree clean; `main` and `origin/main` synchronized at `9c1bccc` (or later with recorded provenance).
- Suite baseline: **203 files / 3,224 tests green**; typecheck and build exit 0.
- Catalogs: **V1 = 13, Hollowcut = 9.**
- Template digests at baseline: Planner `sha256:f32675859e07243a7cf0cd8e743537f4c975826ea7bf684348ed128792489003`; Critic `sha256:27d169bbc002d2bcdcab89ac6df60f481e6311c015600883ed000a1f8031dd54`.
- Attempt seven's evidence commit present in history (`9c1bccc`); its ledger lines are append-only history — untouched.

## Section 3 — Design decisions (pre-answered; deviation = STOP)

**D1 — Budget change surface.** Only the Critic `max_tokens` value in `examples/live-rotation/event-e1.anthropic.fixture.json` changes: 1,536 → 2,048. Planner budget, timeouts, byte caps, and all run-level budgets unchanged. This is an explicitly authorized live-fixture edit; no other fixture field may change.

**D2 — Critic prompt constraints (exhaustive; the committed text is authoritative once written):** the hardened `critic.prompt.txt` must require, in explicit language:
- First non-whitespace character `{`; last character `}`. No backticks anywhere. No preamble, no trailing commentary. (Verbatim adoption of the Planner's F6-proven phrasing at `planner.prompt.txt:6` region, adapted to the Critic.)
- All ten schema fields present, including `acceptance_status`, even when arrays are empty.
- Numeric bounds: at most **3** claims; at most **3** items in each general string array (assumptions, constraints, open_questions); at most **4** recommendations; at most **6** evidence references; at most **2** handoff notes.
- Per-string length bounds in the 160–240 character range per field, as the implementer judges per field within that band (report the chosen numbers).
- Summary short; claims and evidence descriptions one sentence each.
The existing digest-reference guidance and role semantics are retained. Nothing in the prompt may instruct the model on envelope/identity fields — F4 doctrine: runtime owns the envelope, model supplies semantic payload only.

**D3 — Digest re-pin.** The new Critic template digest is computed from committed bytes and becomes the pinned reference. The old digest `27d169bb…dd54` retires into history (F6 precedent: old Planner digest retired the same way). Planner digest must remain byte-identical.

**D4 — Validator unchanged.** The bounded payload validator, F6 unwrap conditions, truncation detection (stop reason OR tokens==budget — which must now bind at 2,048), F8 records, and reconstruction are all untouched in behavior. The truncation detector's budget-equality signal must be proven to track the fixture value rather than a hardcoded 1,536 — if it is hardcoded, fixing that plumbing is in scope; report it either way.

**D5 — `.gitattributes`.** Add (or create) `.gitattributes` at repo root with an entry marking `.caleb/ledger/**` as `-text` (no EOL conversion, ever). If a broader repo EOL policy question surfaces, that is out of scope — STOP-report it as a GIT-HYG item rather than expanding.

**D6 — Untouched surfaces.** Gate matrix and all fifteen checks; L1 allowlist (seven entries); LE-3 bridge; Planner prompt and fixture budget; historical ledger lines; transport; providers.

## Section 4 — Implementation scope (ordered)

1. `.gitattributes` entry (D5).
2. Critic prompt hardening (D2); compute and pin new digest (D3).
3. Fixture budget change (D1); verify truncation-detection plumbing (D4).
4. Detectors (Section 5).
5. Full suite, typecheck, build, AUD-2, report, commit.

## Section 5 — Detector requirements (R37 discipline)

- **T1 — Prompt constraint presence:** static assertions that the committed Critic prompt contains the `{`/`}` rule, the no-backtick rule, the all-ten-fields requirement, and each numeric bound. Proven against a known violation: the assertion must fail against the *old* prompt text (fixture copy), demonstrating it actually detects absence.
- **T2 — Budget plumbing:** the adapter/observer budget for the Critic role resolves to 2,048 from the fixture; truncation detection fires at tokens==2,048 in a mocked run and does NOT fire at 1,536 tokens with `end_turn` (the old boundary is no longer a truncation signal).
- **T3 — Rehearsal update:** the PRE-7 mock rehearsal suite runs green under the new fixture budget; the D4-negative truncation rehearsal uses tokens==budget generically, not a literal.
- **T4 — Digest pins:** Planner digest byte-identical to `f3267585…9003`; new Critic digest recomputes from committed bytes; old Critic digest provably absent from all non-historical references (grep-style assertion across src/tests/fixtures excluding docs history).
- **T5 — Ledger EOL protection:** assertion that git attributes resolve `-text` for a path under `.caleb/ledger/` (e.g. via `git check-attr` in a test or an equivalent committed verification), proven against a known violation (a path outside the protection resolving differently).
- **T6 — Schema invariance:** the Critic payload schema itself is unchanged — the bounds live in the prompt, not the validator. (Bounding the validator would be a separate doctrine question: rejecting a 4th claim as invalid is stricter than instructing against it. Not this pass; note it as a standing question for Pat at RA-X-adjacent design time.)

## Section 6 — Forbidden actions

No speculative normalization; no repair of attempt seven's truncated T0; no validator loosening or tightening (T6); no Planner prompt/budget edits; no L1/gate/LE-3 edits; no retro-editing ledger history; no live calls or credentials; no report fabrication.

## Section 7 — Mandatory report lines

- Catalogs verbatim (13/9 expected); suite counts before/after with canonical-command exit codes.
- **New Critic digest, full hash, computed from committed bytes** — this line re-pins the reference for all future passes.
- Planner digest verbatim, verified byte-identical.
- The committed Critic prompt's chosen per-string bounds (D2).
- Fixture diff summary: exactly one changed value (1,536 → 2,048) — or the honest list if plumbing (D4) required more.
- Truncation-plumbing finding: fixture-tracked or hardcoded, and what was done.
- L1 not-touched declaration. AUD-2 result. Honest deviations (or "none").

## Section 8 — Commit and handoff discipline

`LIVE-F9` in every commit message; protocol to `docs/protocols/`; clean tree + synchronized remote; report rides the handoff.

## Section 9 — STOP conditions

Any Section 2 failure; the truncation-signal plumbing requires touching a forbidden surface; the prompt cannot express a D2 bound without contradicting F4 envelope doctrine; any additional evidence-integrity threat discovered while adding D5 (candidate GIT-HYG finding — report before acting); any unexplained suite regression.

## Section 10 — Roadmap boundary

This pass does not authorize attempt eight. On acceptance, attempt eight requires Pat's fresh event-specific authorization in his own words, host-shell execution under the committed runbook (including the evidence-commit final step, now field-proven), and the standard credential lifecycle with the corrected quote-free sibling-process check. Expected shape of attempt eight: Planner completes (third consecutive), Critic completes within 2,048 under the hardened prompt — the first complete live rotation, the founding milestone. If it fails instead, the failure will arrive fully evidenced; that is what the last nine passes purchased.

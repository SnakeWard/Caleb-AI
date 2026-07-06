# Caleb AI — Pass Protocols H8 and RA-R1-D (Diagnostic Stage Go-Order)

**Prepared by:** Claude Fable 5 (reviewer/planner), for execution by Grok (implementer)
**Convention:** commit this file to `docs/protocols/PASS_PROTOCOL_H8_RAR1D.md` before or with the H8 work. Handoff rule: first action `git status --short`; if dirty and not yours, STOP and report.
**Sequencing:** H8 → RA-R1-D. H8 is a five-minute docs-only pass; do not let it grow. RA-R1-D is the diagnostic stage of the committed RA-R1 protocol (`82df49c`) — investigation and proposal only. RA-R1 implementation remains gated on Pat's approval of the diagnostic, with the roleHandoffGate classification routed through Fable review first. Nothing herein authorizes implementation, src/tests/types changes, providers, egress, RA-X, allowlist changes, or UI.
**Environment precondition (from H7's lesson):** these passes are valid only in the environment configuration that produced the witnessed green run (PowerShell-launched, ambient keys empty). If `npx vitest run` cannot complete in your current shell, STOP and report — do not fall back to non-standard pools for validation.

---

## Pass H8 — Network Egress Proof Documentation Amendment

### 1. Pass name
H8 — Network Egress Proof Documentation Amendment (field-catch record)

### 2. Purpose
Amend `docs/NETWORK_EGRESS_PROOF.md` to record two facts proven in the field during the H7 episode: (a) the H5 credential-read trap's coverage extends into child-process environment enumeration (guardRunner and cliSmoke paths), which is BROADER than the doc's honest known-limits section claimed; (b) the trap achieved its first field catch — a real ambient `ANTHROPIC_API_KEY` detected in an implementer shell, remediated by Pat, and verified empty in the H7/RA-R1-commit report. A boundary that under-promised and over-delivered gets to say so, with dates and evidence.

### 3. Prior summary
H7 blocked correctly (dirty tree, runner failure, ambient key detected by trap); Pat repaired the environment, verified all four provider keys empty, witnessed the canonical suite green at 168 files / 2,945 tests, and committed Codex's stranded RA-R1 protocol as `82df49c`. Tree clean.

### 4. Core rules
- Docs-only. One dated amendment section appended to `docs/NETWORK_EGRESS_PROOF.md`; no changes to the traps, tests, config, or any src/. The amendment must not overstate: subprocess coverage was proven for env-enumeration paths exercised by guardRunner/cliSmoke, not for all conceivable child-process behavior — say exactly that.
- The amendment records: the original known-limits claim; the observed behavior (trap fired on child-process env enumeration when a real key was ambient); the remediation (keys unset from persistent environment; verified empty: ANTHROPIC_API_KEY, XAI_API_KEY, GROK_API_KEY, OPENAI_API_KEY); and the standing operational rule this establishes — **credentials are never ambient in implementer shells; they are set only in the moment of an explicitly authorized live call and unset after.** That rule also gets one line in the operating contract file (same file H5 amended) so it binds all future implementers, not just this doc's readers.
- STATUS_LOG entry; PLANS entry per house convention.

### 5. Files to create
- None.

### 6. Files to modify
- `docs/NETWORK_EGRESS_PROOF.md` — dated amendment section.
- `docs/01_CODEX_OPERATING_CONTRACT.md` (or the operative contract file H5 amended) — one line: the no-ambient-credentials rule.
- `docs/STATUS_LOG.md`, `PLANS.md` — H8 entries.

### 7. Documentation requirements
As in Core rules. Include the H7 report and the RA-R1 commit report as the evidence citations (by pass ID and date, not by re-narration).

### 8. Acceptance requirements
- Full suite green (docs-only; counts should match 168 / 2,945 or reflect only this pass's own PLANS/STATUS appends).
- Catalogs: V1 = 12, Hollowcut = 9.
- Tree clean after commit.

### 9. Validation commands
Pre-change snapshot `h8_egress_doc_amendment_prechange`, verified on disk before recording. `npx tsc --noEmit`; `npx vitest run` (canonical command, counts verbatim); both catalog commands. Commit with pass ID; push; clean tree.

### 10. Report format
House style, brief. Verdict: `H8 Egress Proof Documentation Amendment: Accepted — field catch recorded; subprocess coverage stated precisely; no-ambient-credentials rule now binds all implementers.`

---

## Pass RA-R1-D — Role Artifact Runtime Diagnostic (Go-Order)

### 1. Pass name
RA-R1-D — RA-R1 Diagnostic Stage (under the committed protocol at `82df49c`)

### 2. Purpose
Execute the diagnostic stage of PASS_PROTOCOL_RA_R1.md: classify the roleHandoffGate, survey the pre-M3 role contract layer, and propose the rotation-plan schema, module layout, and decision inventory — so that Pat approves the runtime's entire decision surface before a line of it exists. This is investigation and proposal only.

### 3. Prior summary
RA-R1 protocol committed (`82df49c`). Environment witnessed valid (H7 resolution). RA-C contract governs role artifacts; L1-B's seven-entry allowlist and masquerade fixture stand; M3-T proved the nine non-promoters under real attempts. H8 accepted (if sequenced first, per this document).

### 4. Core rules
- No implementation. No src/, tests/, or types/ changes. The deliverable is one diagnostic document plus PLANS/STATUS entries.
- The five deliverables, restated from the committed protocol so nothing is navigated from memory:

**Deliverable 1 — roleHandoffGate classification (centerpiece).** From the code of `src/roles/roleHandoffGate.ts` and its consumers, answer affirmatively: (a) every check the gate performs, enumerated one by one; (b) for each check: deterministic-over-STRUCTURE (schema, contract shape, required fields, reference validity) or judgment-shaped (content quality, argument quality, completeness of reasoning, defect truth, or anything requiring interpretation of prose meaning); (c) the tier the gate's verdict carries and the justification; (d) every current consumer of the verdict; (e) whether the verdict can move Caleb's state machine today, and if so through which of the seven L1-approved route-input types — if the answer is "none of the seven," state that the verdict is currently non-routing and what that implies for its use as a structural stop condition under RA-R1 §4D. If ANY check is judgment-shaped: name it precisely, present remove-vs-defer-to-RA-X as an open item with your recommendation, and do NOT propose carrying it into the runtime as deterministic gate evidence. This classification routes to Fable review before implementation regardless of outcome — write it to be reviewed, with code citations (file:line) for every claim.

**Deliverable 2 — R1–R6 role contract layer survey.** Inventory `roleArtifactValidator`, `roleContractRegistry`, `roleHandoffGate`, and related modules against the post-M3/L1 stack per RA-C Section 2: what composes cleanly; what needs restating in post-M3 vocabulary; whether role artifacts flow into the M3 content-addressed store WITHOUT modifying M3 modules (expected yes; a no is a finding); whether the R1–R6 validators' schema-validity confers T1 on the same terms as M3's schema-validity, or differs (a difference is a finding).

**Deliverable 3 — Rotation-plan schema proposal.** Per RA-R1 §4B: ordered role list; per-role adapter binding; structural stop conditions (sequence exhaustion, max-invocation ceiling, fail-closed halt); the authorship rule (`authored_by: human | fixture`; `model` rejected by the validator); field-level rationale. Show one complete example plan as it would appear in a test fixture.

**Deliverable 4 — Module layout + decision inventory sketch.** Proposed `src/roleRuntime/` module set, and the executor's decision inventory in draft: every branch the runtime will take, each annotated with the STRUCTURAL input that drives it (sequence position, validation verdict, tier field, stop-condition state). Any branch you cannot annotate with a structural input is a design error to resolve or an open item to raise — it may not survive into implementation unannotated.

**Deliverable 5 — Open items.** Each with a recommendation and a one-line argument. Known candidates you should address rather than discover: how the context-assembly template orders multiple prior artifacts (declared-sequence order is the expected answer); whether the handoff-gate verdict (if clean) serves as a structural stop condition in V1 or is deferred; what the mock adapter interface looks like relative to the existing live-adapter types (reuse the shape, inject the transport — expected).

- Code citations required throughout: every classification claim in Deliverable 1 carries file:line. This document will be reviewed line-by-line; write it accordingly.
- If the survey reveals that any pre-M3 role module ALREADY performs judgment-shaped evaluation in a path that current code exercises, that is a standing finding to flag prominently, not merely a diagnostic note.

### 5. Files to create
- `docs/RA_R1_STATIC_ROTATION_DIAGNOSTIC.md`

### 6. Files to modify
- `docs/STATUS_LOG.md`, `PLANS.md` — RA-R1-D entries.

### 7. Documentation requirements
The diagnostic document per the five deliverables, with code citations, an explicit "findings" section (even if empty — state "no findings" affirmatively), and the open-items table.

### 8. Acceptance requirements
- All five deliverables present and complete; Deliverable 1 cites code for every check classified.
- Full suite green (untouched — canonical command, counts verbatim); catalogs 12/9.
- Tree clean after commit.

### 9. Validation commands
Pre-change snapshot `ra_r1_diagnostic_prechange`, verified on disk before recording. `npx tsc --noEmit`; `npx vitest run`; both catalog commands. Commit with pass ID `RA-R1-D`; push; clean tree. Then STOP.

### 10. Report format
House style. Mandatory lines: the classification's bottom line (clean / judgment-shaped checks found, and if found, named); the two Deliverable-2 expected-answer confirmations (M3 store composes without modification: yes/no; T1 terms match: yes/no); count of decision-inventory branches, all structurally annotated: yes/no. Verdict options: `RA-R1 Diagnostic: Complete — handoff gate clean; runtime decision surface proposed; awaiting Pat and Fable review.` or `RA-R1 Diagnostic: Complete with findings — [named]; awaiting Pat and Fable review.` Implementation does not begin under either verdict without Pat's explicit approval.

---

## Standing rules (for Grok, restated)

The record outranks memory and stale documents. Canonical validation command only (`npx vitest run`); if it cannot complete in your shell, STOP — non-standard pools are diagnostic tools, never validation. Credentials are never ambient (H8's new standing rule; the trap that caught you is still armed). Snapshot verified on disk before recording. No fabricated references — every file:line citation in the diagnostic must be real; a fabricated citation in the classification document would be the R36 failure class in its most damaging possible location. Honest deviation reporting mandatory. Commit per pass with pass ID; push; clean tree. Catalogs 12/9. Locked surfaces amended only by protocol-governed visible diffs. Another implementer's uncommitted work is reported, never absorbed. After RA-R1-D: STOP; the classification goes to Fable review; implementation is Pat's call.
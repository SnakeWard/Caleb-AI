# Caleb AI — Pass Protocol H7 + RA-R1 Diagnostic Stage Authorization (for Grok)

**Prepared by:** Claude Fable 5 (reviewer/planner), for execution by Grok (incoming implementer)
**Convention:** commit this file to `docs/protocols/PASS_PROTOCOL_H7_RAR1_DIAG.md` before or with the H7 work. Handoff rule (operating contract, since H5): a handoff is complete only when the tree is clean — your literal first action is `git status --short`; if dirty and the work is not yours, STOP and report to Pat.
**Sequencing is strict:** H7 must be accepted before the RA-R1 diagnostic begins. The RA-R1 diagnostic must be accepted by Pat before any RA-R1 implementation. Nothing in this document authorizes implementation, src/ changes beyond H7's scope, role rotation, RA-X, providers, egress, UI, or allowlist changes.
**Context you are inheriting:** your own review session could not complete the full test suite (Vitest runtime error: `Cannot read properties of undefined (reading 'config')`), and your roadmap read cited H3 as upcoming when it completed ~15 passes ago. Neither is a criticism — your review honestly flagged the unverified suite, which is exactly the house standard. But both must be corrected before you are a valid implementer for a governed pass: an environment that cannot run the validation commands cannot validate, and an implementer navigating by a stale map cannot be trusted to know where the boundaries are.

---

## Pass H7 — Implementer Environment Reverification & Handoff Integrity

### 1. Pass name
H7 — Implementer Environment Reverification & Handoff Integrity

### 2. Purpose
Establish that the incoming implementer (Grok) is operating in a valid governed-pass environment: clean tree, correct repo position confirmed from the record (not from memory or older documents), working toolchain proven by a witnessed full-suite green run, and the RA-R1 protocol's commit status resolved. This is the GPT-era rule generalized: a shell without git is not a valid implementer environment, and neither is one that cannot execute the validation commands every pass's acceptance depends on.

### 3. Prior summary
Codex completed through M3-T (accepted: nine non-promoters hold under real attempts) and was handed the RA-R1 protocol for commit as a protocol-draft pass; usage limits ended its session and its final commit status is UNKNOWN to the record — resolving this is part of H7. Suite last verified by Codex at 168 files / 2,945 tests green under H5 traps; catalogs 12/9; all locked surfaces (M3, M3-A, L1, L1-A, L1-B) personally witnessed by Pat.

### 4. Core rules
- **Step 1 — Tree state:** `git status --short`. If dirty and not yours: STOP, report the dirty files verbatim, await Pat. If clean: proceed.
- **Step 2 — Position from the record:** resolve the actual current position from `git log --oneline -15`, the tail of `docs/STATUS_LOG.md`, and the newest entries of `PLANS.md`. State affirmatively in the report: the latest commit hash and message; whether `docs/protocols/PASS_PROTOCOL_RA_R1.md` exists and is committed; the last accepted pass. Your prior review's roadmap picture is DISCARDED — the record is authoritative, older roadmap documents are not.
- **Step 3 — RA-R1 protocol resolution (branching):**
  - If the RA-R1 protocol is committed: note the commit hash; no action.
  - If it exists in the tree but is uncommitted: STOP and report — Pat decides whether Codex's intended commit is completed by you (expected resolution: yes, commit it verbatim with the standard pass message, but the decision is Pat's because it is another implementer's unfinished work).
  - If it is absent entirely: report; Pat will supply the protocol file as written — you commit it verbatim as the RA-R1 protocol pass. You do NOT redraft, summarize, or improve it.
- **Step 4 — Environment repair:** diagnose the Vitest failure. Ordered candidates: (a) Node version drift — record `node --version` and compare against any engine hints (package.json engines, CI notes, or Codex-era reports); (b) stale or corrupted dependencies — `npm ci` from the lockfile (this is the expected fix; the lockfile is pinned by the H5 dependency-lock test, so `npm ci` cannot introduce drift); (c) H5 setup-file interaction with a mismatched Vitest — only investigated if (a) and (b) fail. You may NOT: modify `vitest.config.ts`, the H5 trap files, the lockfile, or package.json to make the suite pass. If the suite cannot be made green without touching any of those, STOP and report the full diagnosis — that decision is Pat's, because those files are locked boundaries, not tooling.
- **Step 5 — Witnessed green run:** one full `npx vitest run` under the H5 traps, completing without runtime error. Report the counts VERBATIM (files/tests). Expected: 168 / 2,945 — or higher if Step 3 added the RA-R1 protocol commit's PLANS/STATUS entries (docs-only, so counts should be unchanged). Any test failure (as opposed to the runner erroring) is a finding: report it, do not fix it inside H7.
- **Step 6 — Standard sweep:** `npx tsc --noEmit`; `npm run build`; both catalog commands (V1 = 12, Hollowcut = 9); final `git status --short` clean.
- **Zero-diff preference:** H7 ideally changes nothing but (possibly) the RA-R1 protocol commit and its PLANS/STATUS entries, plus H7's own protocol commit and STATUS_LOG line. `node_modules` repair is not a repo change. If Step 4 genuinely requires a repo diff, STOP and report first.
- Snapshot rule: if and only if H7 makes repo changes (Step 3 commit, STATUS_LOG entry), pre-change snapshot `h7_environment_reverification_prechange`, verified on disk before recording. A pure zero-diff verification requires no snapshot but the report says so explicitly.

### 5. Files to create
- None expected.

### 6. Files to modify
- `docs/STATUS_LOG.md` — H7 entry (environment reverified, suite witnessed green, position confirmed).
- `PLANS.md` — only if the RA-R1 protocol commit is performed in Step 3.
- Nothing else. Explicitly not: vitest.config.ts, H5 traps, lockfile, package.json, src/, tests/.

### 7. Documentation requirements
The H7 STATUS_LOG entry records: the Vitest failure's root cause as diagnosed, the fix (expected: `npm ci` / Node version alignment), the witnessed counts, and the RA-R1 protocol commit resolution.

### 8. Acceptance requirements
- Full suite green under H5 traps, counts verbatim, witnessed by the implementer in THIS environment.
- Typecheck, build, catalogs green.
- RA-R1 protocol commit status resolved (committed, or STOP was correctly triggered).
- Current position stated affirmatively from the record.
- Tree clean.

### 9. Validation commands
As embedded in Core rules Steps 1–6. Commit (if any changes) with pass ID `H7`; push; clean tree.

### 10. Report format
House style. Mandatory lines: root cause of the Vitest failure; `node --version`; witnessed suite counts verbatim; RA-R1 protocol commit hash (or the STOP branch taken); the affirmative position statement ("last accepted pass is X per STATUS_LOG/PLANS"). Verdict: `H7 Implementer Environment Reverification: Accepted — environment valid, suite witnessed green, position confirmed from the record; implementer is qualified for governed passes.`

---

## RA-R1 Diagnostic Stage — Authorization and Deliverables (begins only after H7 acceptance AND Pat's explicit go)

The RA-R1 protocol (`docs/protocols/PASS_PROTOCOL_RA_R1.md`) governs; this section restates the diagnostic stage's deliverables so nothing is navigated from memory. The diagnostic is investigation and proposal only — no implementation, no src/ changes, no tests.

**Deliverable 1 — roleHandoffGate classification (the centerpiece; RA-R1 §4D, binding).** Answer affirmatively, from the code, for the existing `src/roles/roleHandoffGate.ts`: every check it performs, enumerated; whether each is deterministic over artifact STRUCTURE (schema, contract shape, required fields) or evaluates anything judgment-shaped (content quality, argument quality, completeness of reasoning, defect truth); what tier its verdict carries; what currently consumes the verdict; whether the verdict can move Caleb's state machine, and if so through which of the seven L1-approved route-input types. If ANY check is judgment-shaped: name it, and present remove-vs-defer-to-RA-X as an open item for Pat — do not propose smuggling it into the runtime as deterministic gate evidence. This classification comes back to Pat and Fable for review before implementation regardless of outcome.

**Deliverable 2 — R1–R6 role contract layer survey.** Per RA-C Section 2's reconciliation obligation: inventory `roleArtifactValidator`, `roleContractRegistry`, `roleHandoffGate`, and related modules against the post-M3/L1 stack. State what composes cleanly, what needs restating in post-M3 vocabulary, and whether role artifacts route into the M3 content-addressed store without modification to M3 modules (expected: yes; if no, that is a finding).

**Deliverable 3 — Proposed rotation-plan schema.** Per RA-R1 §4B including the plan-authorship rule (`authored_by: human | fixture`, `model` rejected), ordered role list, per-role adapter binding, structural stop conditions. Present as a proposal with field-level rationale.

**Deliverable 4 — Proposed module layout and decision inventory sketch.** The `src/roleRuntime/` module set, and a first draft of the executor's decision inventory: every branch the runtime will take and the structural input driving it. The implementation doc will finalize this; the diagnostic sketches it so Pat approves the decision surface before it exists.

**Deliverable 5 — Open items.** Anything requiring Pat's choice, each with your recommendation and a one-line argument, per house convention.

**Diagnostic process:** pre-change snapshot `ra_r1_diagnostic_prechange` verified on disk; diagnostic doc at `docs/RA_R1_STATIC_ROTATION_DIAGNOSTIC.md`; PLANS/STATUS entries; full suite (should be untouched); commit with pass ID; push; clean tree; STOP. Implementation begins only on Pat's approval of the diagnostic, and the handoff-gate classification is expected to route through Fable review first.

---

## Standing rules (for Grok, restated)

The record outranks your memory and outranks older roadmap documents. Snapshot verified on disk before recording, wherever a snapshot is required. No fabricated references — every ID, hash, and count you write must exist at the moment you write it (the Snapshot Claim Integrity Gate and Pat's cross-checks are both watching, and this project's most famous incident is a fabricated snapshot ID). Honest deviation reporting is mandatory and historically becomes gates, not punishments. Absence assertions accompany every boundary. Commit per pass with the pass ID; push; verify clean tree. Catalogs 12/9 asserted every pass. The suite runs under permanent H5 traps — a tripped trap is a finding, not an obstacle. Locked surfaces (M3/M3-A, L1/L1-A/L1-B, the seven-entry allowlist, the H5 config-locks, the dependency pin) are amended only by protocol-governed visible diffs, never incidentally. Another implementer's uncommitted work is never silently completed, discarded, or absorbed — it is reported. After the diagnostic: stop and report; implementation is Pat's call.
# Caleb AI — Pass Protocol REP-1 (Implementer Report Artifacts)

**Prepared by:** Claude Fable 5 (reviewer/planner), for execution by Grok (implementer)
**Convention:** commit this file to `docs/protocols/PASS_PROTOCOL_REP1.md` with the work. Handoff rule: first action `git status --short`; if dirty and not yours, STOP and report to Pat.
**Pass type:** documentation/process only. No src/, no tests/, no catalog, configuration, or behavior changes.
**Origin:** Five consecutive implementer reports pasted into the reviewer chat arrived as empty documents (server-side extraction fault on the paste-to-attachment path), while file uploads arrived intact every time. Pat's resolution converts the transport failure into structure: reports become committed repository artifacts, delivered as files. This upgrades provenance — the full audit chain (protocol → implementation → report → review) becomes reconstructable from the repository alone, with no dependency on any chat transcript.

---

## 1. Pass name
REP-1 — Implementer Report Artifacts: the reports directory, naming convention, delivery rule, and inaugural report.

## 2. Purpose
Establish `docs/implementors-reports/` as the permanent home of every pass completion report; bind the delivery convention into the operating contract; and write the GVS-0 completion report as the directory's first file — the report that failed to arrive five times becomes the convention's founding artifact.

## 3. Core rules
- **Directory:** create `docs/implementors-reports/`. It lives under `docs/` so all record-bearing prose stays in one tree.
- **Naming convention (record verbatim in the contract):** `<PASS_ID>_<YYYYMMDD>_<implementer>.md` — e.g. `GVS0_20260708_grok.md`, `LIVE-F7_20260708_codex.md`. Reports sort chronologically within a pass and attribute their author at a glance. Date is the report's completion date; implementer is the seat that executed the pass (`grok`, `codex`, `gpt`, `claude`, `pat` for human-executed events).
- **Three standing rules, appended to the operating contract verbatim:**
  1. Every pass's completion report is written to `docs/implementors-reports/` and committed with the pass, or immediately upon acceptance for passes whose acceptance follows review.
  2. Reports are delivered to the reviewer as uploaded files, never pastes. Artifacts over testimony, in transport as in doctrine.
  3. A committed report is append-only: corrections and post-acceptance findings are dated addendum sections added below the original, never edits to accepted text. A report that can be quietly revised after acceptance is a draft, not a record.
- **Report content standard (also into the contract, one line):** a report file must contain the mandatory lines its governing protocol specifies — verdict verbatim, suite counts, catalogs, honest deviations — such that the report is reviewable standalone, with no chat context assumed.
- **Back-fill honesty rule:** reports from the chat-delivery era are NOT reconstructed from memory or transcripts into retroactive files — fabricating historical artifacts is the R36 failure class in archival costume. Instead, the STATUS_LOG entry for REP-1 records the convention's start date, stating explicitly: reports before this date live in session records and existing docs (the acceptance reports under docs/ remain authoritative where they exist); reports from this date forward live here. The boundary is explicit, dated, and honest.
- **Inaugural artifact:** the GVS-0 completion report (assuming GVS-0 is complete per its protocol — if GVS-0 is NOT yet complete, execute GVS-0 first under its own committed protocol, then REP-1, and write the report once, into the new folder). Filename per convention. Content: the full GVS-0 report satisfying every mandatory line in PASS_PROTOCOL_GVS0.md §8 — the roadmap file identified and the entry as written; the key-absence scan result on the reference HTML; the two reference-file digests as committed; suite counts verbatim; catalogs 13/9; the verdict line verbatim.
- **The REP-1 report itself** is the folder's second file (`REP1_<date>_grok.md`), reporting this pass per house style. Yes, the reports pass reports itself into its own folder — that is not a joke, it is the convention being load-bearing from birth.
- If the GVS-0 pass surfaced any deviation, STOP-condition, or finding not yet reviewed by Fable, the GVS-0 report must state it prominently — the reviewer has seen NOTHING of GVS-0's execution due to the delivery fault; the report file is the first and only channel, so it carries everything.

## 4. Files to create
- `docs/implementors-reports/` (directory)
- `docs/implementors-reports/GVS0_<YYYYMMDD>_grok.md` — the inaugural report
- `docs/implementors-reports/REP1_<YYYYMMDD>_grok.md` — this pass's own report

## 5. Files to modify
- The operating contract file (Grok identifies the operative file — the one H5/H8/F-era amendments live in — and states it in the report): the three standing rules + naming convention + content standard.
- `docs/STATUS_LOG.md`, `PLANS.md` — REP-1 entries, including the convention start date and the back-fill boundary statement.

## 6. Acceptance requirements
- Directory exists with both reports; filenames match the convention exactly.
- Operating contract carries the three rules verbatim.
- GVS-0 report satisfies every GVS-0 §8 mandatory line (standalone-reviewable).
- Canonical suite green (docs-only — counts verbatim, expected unchanged from current baseline), canonical typecheck exit 0, catalogs 13/9, AUD-2 self-smoke compliant/T2, tree clean, remote synchronized.

## 7. Validation commands
Pre-change snapshot `rep1_report_artifacts_prechange`, verified on disk before recording. Then: canonical typecheck; `npx vitest run` (counts verbatim); both catalog commands; AUD-2 self-smoke. Commit with pass ID `REP-1` (GVS-0 commits separately under its own ID if not already committed); push; clean tree.

## 8. Report format and delivery
House style, written to `docs/implementors-reports/REP1_<date>_grok.md`. **Delivery of BOTH reports to the reviewer: Pat drags the two files from the folder into the reviewer chat as file uploads.** No pastes. Verdict: `REP-1 Implementer Report Artifacts: Accepted — reports are repository citizens; the audit chain no longer depends on any conversation surviving.`

---

## Standing rules (for Grok, restated)

The record outranks memory. Docs/process only — any perceived need to touch code, tests, or configuration is a STOP. No fabricated references and no back-filled history; the boundary between chat-era and file-era reports is stated, not papered over. Snapshot verified on disk before recording. Canonical commands to completion with exit codes. Credentials never ambient. Honest deviations mandatory — and the GVS-0 report carries ALL of GVS-0's execution detail, because the reviewer has seen none of it. Catalogs 13/9. Nothing herein authorizes GVS integration, adapter work, or anything beyond the reports convention and the GVS-0 registration already protocolized. After REP-1: STOP; Pat drags both report files into the reviewer chat; the review fires on arrival. The active campaign remains LIVE-F7 in the parallel session — REP-1 must not delay it.

# Caleb AI — Pass Protocol SYNC-1 (Reviewer Context Synchronization Report)

**Prepared by:** Claude Fable 5 (reviewer/planner), for execution by Grok (implementer)
**Convention:** commit this file to `docs/protocols/PASS_PROTOCOL_SYNC1.md` with the work. Handoff rule applies as always — but SYNC-1 is expected to run AFTER GVS-0 and REP-1 in this session's authorized sequence, so the tree state should be clean at its start; if not, STOP per standing rule.
**Pass type:** documentation only — a report, not a change. Zero src/, tests/, config, or catalog changes. The deliverable is one file.
**Origin:** The reviewer seat (Fable) has a context gap. Last verified state on the reviewer's side: LIVE-F6 accepted (commit `46cf0c2`, 200 files / 3,199 tests, snapshot counter ~000435), live attempt six's JSON (Planner succeeded; `handoff_gate_blocked`), and the LIVE-F7 diagnostic AUTHORIZED but never received (six failed deliveries). Screenshots have since revealed: HEAD at `5490a1e` — "AUTH-3: register LIVE-R2-E2-A1 and lock authorization echo", snapshot counter at 000468, and an AUTH-series the reviewer has never heard of. Today's GVS-0/REP-1 reports (2026-08-04) further revealed: suite at 213 files / 3,294 tests, catalogs at 14/9, and nine remote commits spanning RA-X, LIVE-D1, and SEAL-D1 series. The reviewer has verified none of it. Roughly a month of campaign history exists only in a parallel session and the repository. This pass closes the gap FROM THE RECORD — the repository is the source; no session memory, no summaries from other chats, no reconstruction of anything not written down.

---

## 1. Pass name
SYNC-1 — Reviewer Context Synchronization Report

## 2. Purpose
Produce one standalone report file that brings a reviewer with the stated last-known state fully current using only committed artifacts — every claim cited to a commit hash, document path, or ledger entry, so the report is verification, not testimony.

## 3. Core rules
Record-only derivation. Sources: git log (from `46cf0c2` to HEAD), `docs/STATUS_LOG.md`, `PLANS.md`, `docs/protocols/`, `docs/implementors-reports/` (once REP-1 exists), acceptance/event reports under `docs/`, and `ledger.jsonl` milestones. FORBIDDEN sources: session memory, other chats, paraphrase of anything not in a committed file. If a question below cannot be answered from the record, the answer is written as "NOT IN RECORD" — that is a finding, not a failure, and it is exactly what the reviewer needs to know.
Citation per claim. Every pass, verdict, count, and doctrine change carries its source: commit hash, file path, or both. Verdict lines are quoted VERBATIM from their records, never paraphrased.
The report answers, in order, the six question blocks stated in the authorizing SYNC-1 brief (pass chronology; live campaign state; current verified state; doctrine and lock deltas; open items and debts; what awaits the reviewer), plus an honest-gap section.
File placement per REP-1 convention: `docs/implementors-reports/SYNC1_<YYYYMMDD>_grok.md`.

## 4. Files to create
- `docs/implementors-reports/SYNC1_<YYYYMMDD>_grok.md` — the report.

## 5. Files to modify
- `docs/STATUS_LOG.md`, `PLANS.md` — SYNC-1 entries (one line each relative density; this pass is small in the record even though its deliverable is dense).

## 6. Acceptance requirements
All six questions answered or marked NOT IN RECORD; every claim cited; verdicts verbatim.
Canonical suite green (docs-only; counts verbatim), canonical typecheck exit 0, catalogs asserted, AUD-2 self-smoke compliant/T2, tree clean, remote synchronized.

## 7. Validation commands
Pre-change snapshot `sync1_context_report_prechange`, verified on disk before recording. Canonical typecheck; `npx vitest run`; catalog commands; AUD-2 self-smoke. Commit with pass ID `SYNC-1`; push; clean tree.

## 8. Report format and delivery
The deliverable IS the report file. Delivery: Pat zips `docs/implementors-reports/` and drags the zip into the reviewer chat. Verdict: `SYNC-1 Context Synchronization: Complete — the reviewer's picture is rebuilt from the record alone; gaps are named, not papered.`

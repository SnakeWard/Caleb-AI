# DEBT-1 — Migration Reconciliation + Byte-Integrity Lock + Detector/Provenance Fixes

**Pass ID:** DEBT-1  
**Seat:** Grok 4.3, Grok Build TUI — working tree **`F:\Caleb AI`** (authoritative home)  
**Authorized by:** Pat (T4)  
**Reviewer:** Fable 5  
**Date:** 2026-07-21  

A recap is not a report. **D: is cold backup; receives nothing further.**

## Summary

DEBT-1 closes the two migration-surfaced suite failures without weakening gates:
byte-integrity `.gitattributes` for future clones, AUTH-2 evidence-commit
precision, PLANS snapshot-claim reconciliation under D3 read (i), E2-A1
provenance correction, and git hygiene status. Full suite green on F:.

## §2 Preconditions

| Check | Result |
| --- | --- |
| Working from `F:\Caleb AI` | Pass |
| `core.autocrlf` / `core.eol` | `false` / `lf` |
| HEAD / origin | `5490a1e` synchronized (pre-pass tip) |
| Suite before | **3,235 pass / 3,237 total** with exactly two known failures (AUTH-2 register history; snapshot claim gate) |
| Catalogs | **V1 = 13**, **Hollowcut = 9** |
| Planner digest | `sha256:f32675859e07243a7cf0cd8e743537f4c975826ea7bf684348ed128792489003` |
| Critic digest | `sha256:8074e98c3317f24cfe4f5bd1b94e9328ffe75e1f390a81f776badb759d3b8e8f` |

## D1 — `.gitattributes` patterns (as committed)

```
* text=auto eol=lf
.caleb/ledger/** -text
docs/** -text
src/** -text
examples/** -text
tests/** -text
*.md -text
*.ts -text
*.tsx -text
*.txt -text
examples/live-rotation/prompts/** -text
```

Last-match-wins: defaults first, then specific `-text` classes. **No bulk working-tree
byte rewrite.** Governs future checkouts only.

T1: `git check-attr text` → docs/src/prompts/fixture JSON: `text: unset`;
`package.json` control: `text: auto`.

## D2 — AUTH-2 evidence-commit match rule

**Rule:** count ledger commits whose **subject** matches
`^(LIVE-R2-E\d+-A\d+):` (label at start, followed by colon).  
**Not:** any subject merely *containing* the label (e.g. AUTH-3 message).

**Confirmation:** exactly **one** E2-A1 evidence commit counted:
`873276c767fa32783a820a69499d87215c82f798`  
(`LIVE-R2-E2-A1: cross-family showcase - first complete Anthropic+xAI rotation, first attempt`).

Synthetic genuine-duplicate history still fails (`duplicate_evidence_commit:…`).  
Synthetic missing register entry still fails (`missing_history_entry:…`).

## D3 — Snapshot claim reconciliation

**Confirmed read (i):**

| Question | Evidence |
| --- | --- |
| Is `.caleb/snapshots/` gitignored? | **Yes** — `.gitignore:10` → `.caleb/snapshots/` |
| Is the gate cross-machine? | **No** — `runSnapshotClaimIntegrityGate` lists **local** `.caleb/snapshots` and compares to claims in `PLANS.md`. Snapshots do not survive a fresh clone by design. |

**PLANS.md change:** every active historical `snap_*_milestone` token rewritten to
`pre_migration_D_cold_backup_snap_*_milestone` (breaks `\bsnap_` claim extraction
while remaining greppable). Migration banner section added under DEBT-1.

**Active claims remaining after rewrite:** 0.  
**Annotated occurrences:** 277 (includes multi-claim prose).  
**Gate NOT weakened:** synthetic missing id still fails pure evaluator; real-repo
wrapper returns `passed: true` with empty `missing_snapshot_ids`. Unit known-violation
paths in `snapshotClaimIntegrityValidator.test.ts` untouched.

F: local snapshot dirs present for this machine only (examples):
`snap_20260721T172400380Z_000001_milestone`,
`snap_20260721T172935276Z_000002_milestone` — not required as PLANS claims.

## D4 — E2-A1 provenance

**Mechanism:** field corrected **in place** on the LIVE-R2-E2-A1 entry so the
canonical register reads true, **plus** append-only `## Corrections log` entry
dated 2026-07-21 (event entries remain append-only; this is field-level repair).

**Corrected field text:**

```
- Recorded where first: implementer session, registered immediately
```

(Previous incorrect value: `conversation record with reviewer`.)

## D5 — Git hygiene

| Check | Result |
| --- | --- |
| `git repack -d` | exit 0; "Nothing new to pack." |
| `git fsck` | exit 0; no dangling/warning noise reported |
| GIT-HYG-1 repack warnings | **gone / not observed** on NTFS F: |
| `git` on PATH | **yes** — `C:\Program Files\Git\cmd\git.exe` |

## Suite counts

| Phase | Result |
| --- | --- |
| Before (migration inputs) | **3,235 / 3,237** green tests, **2 failing** (AUTH-2, snapshot gate); exit non-zero |
| Intermediate (attrs order bug) | 1 real failure (LIVE-F9 T5 outside path), not flake |
| After | **207 files / 3,241 tests**, exit **0** |
| `tsc --noEmit` | exit **0** |
| `npm run build` | exit **0** |

Test delta vs 3,237: + DEBT-1 detectors and AUTH-2 precision cases; both prior failures closed.

## Digests / L1 / catalogs

- Planner `sha256:f32675859e07243a7cf0cd8e743537f4c975826ea7bf684348ed128792489003` **unchanged**
- Critic `sha256:8074e98c3317f24cfe4f5bd1b94e9328ffe75e1f390a81f776badb759d3b8e8f` **unchanged**
- L1: **not touched**
- Catalogs: **13 / 9**

## Flake rate on F: (this pass)

Across DEBT-1 full-suite runs on F::

- **Timeout / spindle flakes: 0 observed**
- Failures seen were **deterministic** (known migration inputs; then LIVE-F9 attr contrast until fixed)

Spindle separation (F: vs prior D:) appears to have removed the contention-timeout class for this pass’s full runs. Sample size is small (two full canonical runs after edits); report as **0 flakes / 2 full suite executions** post-fix, not a lifetime SLA.

## AUD-2

**compliant / T2**, 11 paths, **0 violations**, 0 forbidden hits (base-ref `5490a1e`).

## Files created

- `docs/protocols/PASS_PROTOCOL_DEBT_1.md`
- `docs/DEBT_1_MIGRATION_RECONCILIATION_REPORT.md`
- `tests/acceptance/debt1MigrationReconciliationAcceptance.test.ts`
- `examples/audit/debt-1-pass-manifest.valid.json`

## Files changed

- `.gitattributes`
- `tests/acceptance/auth2LiveEventAuthorizationRegisterAcceptance.test.ts`
- `tests/acceptance/liveF9CriticBudgetPromptLedgerIntegrityAcceptance.test.ts` (outside control path → `package.json` under DEBT-1 docs lock)
- `PLANS.md` (pre-migration annotation only)
- `docs/LIVE_EVENT_AUTHORIZATIONS.md` (E2-A1 field + Corrections log)
- `docs/STATUS_LOG.md`
- `.caleb/ledger/ledger.jsonl` (append-only local snapshot evidence if present)

## Files intentionally not changed

- Prompts, L1, gate/LE-3/matrix, validator pure evaluator known-violation unit tests
- No bulk content EOL rewrite of already-committed blobs
- No ledger-history rewrite of past events

## Honest deviations

1. **D3 wording “two D:-origin snapshots”** vs reality: **143 distinct claimed IDs** (277 annotated occurrences) were D:-local and missing on F:. All neutralized the same way; not only two.
2. **LIVE-F9 T5 outside path** updated from `docs/STATUS_LOG.md` to `package.json` because DEBT-1 deliberately locks `docs/**` as `-text`. Ledger protection assertion unchanged (`text: unset`). Not a gate weaken.
3. **D4** used in-place field correction **plus** append-only Corrections log (not correction-only leaving a false canonical field).

## Verdict

DEBT-1: migration complete on **F:** — byte-integrity locked for future clones, both migration-surfaced failures closed honestly, gate not weakened. **No live event authorized.** Road returns to Pat’s fork: RA-X or investor write-up.

---

## Addendum — PATH-1 reconciliation (2026-08-04)

**This section is an annotation only.** Accepted DEBT-1 body above is not rewritten.

| Topic | DEBT-1 record (2026-07-21) | Operational reality at PATH-1 (2026-08-04) |
| --- | --- | --- |
| Authoritative working copy | `F:\Caleb AI` (authoritative home) | `D:\Caleb AI` holds live history through REC-1 (`4d926ca` = `origin/main`) |
| Other volume | “D: is cold backup; receives nothing further.” | `F:\Caleb AI` was a stale second clone at SEAL-D1 (`7002513`) with a dirty local ledger append |
| Filesystem | NTFS F: cited for hygiene success | D: = **exFAT**; F: = **NTFS** |

**Contradiction found:** yes. The migration record named F as home and D as cold backup; subsequent passes were committed on D without a recorded path flip. That silent divergence is the deeper cause of the wrong-tree incident that PATH-1 closes.

**Resolution (PATH-1, Pat-approved):** Canonical path is **`D:\Caleb AI` (`exFAT`)**, despite the protocol’s NTFS preference. F’s working clone is non-canonical and must not receive passes; archival rename target is `F:\Caleb AI.ARCHIVED-20260804` (operator completes rename when no process holds `F:\Caleb AI`). No second working clone is authorized. Accepted DEBT-1 text remains historical truth of what was believed at migration time.

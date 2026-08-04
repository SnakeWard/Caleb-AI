# Caleb AI — Pass Protocol PATH-1 (Canonical Repository Path)

**Prepared by:** Claude Fable 5 (reviewer/planner), for execution by Grok (implementer)
**Convention:** commit this file to `docs/protocols/PASS_PROTOCOL_PATH1.md` with the work. Handoff rule applies — and note that this pass exists precisely because the handoff rule had no way to catch the failure that occurred.
**Pass type:** documentation and process only, plus one filesystem archival action outside the repository (§4E). No `src/`, `tests/`, catalogs, configuration, or behavior changes.
**Origin:** After an unplanned machine restart, the implementer resumed work in `F:\Caleb AI` — a stale second clone four passes behind, with an uncommitted ledger append. Read-only diagnosis (five commands, no mutations) established that nothing was lost: the remote held every pass, `D:\Caleb AI` was clean and current at `4d926ca`, and `F:` was simply the wrong tree. The handoff rule caught a *dirty* tree; nothing in the standing rules would have caught a *wrong* one. Root cause: the canonical working path is not recorded anywhere in the operating contract, so neither operator nor implementer had anything to check against — and DEBT-1's migration record and operational reality had silently diverged.

---

## 1. Pass name
PATH-1 — Canonical Repository Path, Preflight Directory Assertion, and Mirror Backup Convention

## 2. Purpose
Establish one canonical working copy as a recorded fact, make wrong-tree work structurally detectable at preflight, retire the stale second clone, and (if adopted) record a backup convention that is incapable of becoming a second source of truth. This closes the wrong-tree failure class rather than managing it.

## 3. Prior summary
REC-1 accepted (`4d926ca`): crown event reports assembled, A8/E2-A1 reconstructions `ok: true / completed`, authorization-after-the-fact defect class named. Suite 213 files / 3,294 tests; catalogs 14/9. SEG-C was authorized, interrupted by the restart, and did not complete — it re-runs unchanged after PATH-1.

## 4. Core rules

**A. Determine and record the canonical path (evidence first).**
The diagnostic evidence names `D:\Caleb AI` as the working copy where all recent passes were committed. Before recording it as canonical, verify and report: `Get-Volume D` and `Get-Volume F` (drive letters, filesystems, sizes, free space); which drive DEBT-1's migration record names as the target; and whether `D:` is NTFS. **If DEBT-1 names `F:` as the migration target while `D:` holds the live history, that contradiction is a finding and must be reported prominently** — the record and reality disagreed, which is the deeper cause of this incident. Recommendation: canonical = the clone holding the live history and running on NTFS. If the evidence contradicts that recommendation (e.g. `D:` turns out to be the old exFAT volume), STOP and report before recording anything.

**Pat disposition (2026-08-04):** Keep canonical home on `D:\Caleb AI` despite `exFAT` (live history wins).

**B. Record the canonical path in the operating contract.**
Append to `docs/01_CODEX_OPERATING_CONTRACT.md`, in the standing-rules idiom:

> **Canonical repository path.** The single authoritative working copy of Caleb AI is `<PATH>` (`<FILESYSTEM>`, recorded PATH-1, 2026-08-04). All passes execute here. No second working clone may exist on this machine; a backup, if kept, is a bare mirror with no working tree (see Mirror backup). Any implementer finding itself outside this path STOPs and reports before touching anything — a wrong tree is a harder failure than a dirty one, because a dirty tree announces itself and a wrong tree does not.

**C. Preflight directory assertion (the structural fix).**
Amend the standing preflight sequence so it reads, in order: (1) confirm the working directory matches the canonical path; (2) `git status --short` for tree cleanliness; (3) `git log --oneline -3` and remote-sync state. The directory check comes **first**, because a clean tree in the wrong repository looks exactly like a clean tree in the right one. Record the check's concrete form for a PowerShell implementer (e.g. `(Get-Location).Path` compared against the recorded canonical path, plus `git rev-parse --show-toplevel`), and add the resulting path to the mandatory report lines of every future pass — one line, alongside catalogs and suite counts, so that a wrong-tree pass is visible in its own report even if the preflight were skipped.

**D. Reconcile DEBT-1's record.**
If §4A finds a contradiction, add a dated reconciliation note to DEBT-1's record (or the STATUS_LOG, per house convention for correcting an accepted pass's record — an addendum, never an edit to accepted text) stating what the migration record says, what operational reality is, and which is now canonical. Accepted history is not rewritten; it is annotated.

**E. Retire the stale clone (the one filesystem action).**
Rename `F:\Caleb AI` to `F:\Caleb AI.ARCHIVED-20260804`. Do not delete in this pass — a week of confirmed-normal operation should precede deletion, and the deletion itself is a later, trivial operator action. **Before renaming**, report: the F: clone's HEAD, its dirty file list, and whether its uncommitted ledger append is unique to F: or already present in the canonical clone's ledger (compare the append's snapshot ID against the canonical `ledger.jsonl`). If it is unique — i.e. an append that exists nowhere else — STOP and report before renaming; Pat decides its disposition. Expected finding: the append is a stale artifact of the old clone's own snapshot activity and is not needed, but that is a conclusion the evidence must support, not an assumption.

**Disposition (PATH-1 execution):** Unique append `ledger_snap_20260722T184249824Z_000023_milestone` preserved inside the archived tree by rename; not committed, not merged into canonical.

**F. Mirror backup convention (adopt or decline, argued).**
The safe local-backup form is a bare mirror, which has no working tree and therefore cannot become a second source of truth or host an accidental pass:

```
git clone --mirror https://github.com/SnakeWard/Caleb-AI.git F:\caleb-ai-mirror.git
# refresh after a pass:
git --git-dir=F:\caleb-ai-mirror.git remote update --prune
```

The implementer recommends adopting or declining this in one argued line; if adopted, record the convention and the refresh command in the operating contract alongside the canonical path. **File-copy or folder-sync mechanisms between working clones are forbidden and the contract says so explicitly** — two writers to an append-only ledger produce divergent tails, and a copy job cannot know whether it is mid-write. Git is the sync mechanism; the remote is the backup; a mirror is a redundancy, not a peer.

**G. Absence rules.** No commits into the F: clone under any circumstance. No merge, pull, reset, or cherry-pick between clones. No `src/`, `tests/`, catalog, or configuration changes. SEG-C is not started in this pass.

## 5. Files to create
- `docs/implementors-reports/PATH1_<YYYYMMDD>_grok.md`
- `examples/audit/path1-pass-manifest.valid.json`

## 6. Files to modify
- `docs/01_CODEX_OPERATING_CONTRACT.md` — canonical path, preflight amendment, mirror convention (or its declination), forbidden-sync rule.
- `docs/STATUS_LOG.md`, `PLANS.md` — PATH-1 entries, including the DEBT-1 reconciliation note if §4D applies.

## 7. Acceptance requirements
- Canonical path determined from evidence, recorded verbatim in the contract, with drive/filesystem facts reported.
- Preflight amendment in force, including the working-path mandatory report line.
- DEBT-1 contradiction reported and reconciled by addendum if present.
- F: clone archived by rename, with its HEAD, dirty list, and ledger-append disposition reported first.
- Mirror convention adopted or declined with reasoning.
- Canonical suite green (counts verbatim, expected 213/3,294), canonical typecheck exit 0, catalogs 14/9, AUD-2 self-smoke compliant/T2, tree clean, remote synchronized.

## 8. Validation commands
Run from the canonical clone only. Pre-change snapshot `path1_canonical_repository_path_prechange`, verified on disk before recording. Then: `node ./node_modules/typescript/bin/tsc --noEmit`; `npx vitest run`; both catalog commands; AUD-2 self-smoke. Commit with pass ID `PATH-1`; push; clean tree.

## 9. Report format and delivery
Per REP-1: `docs/implementors-reports/PATH1_<YYYYMMDD>_grok.md`. Mandatory lines: the canonical path and filesystem as recorded; the DEBT-1 reconciliation outcome (contradiction found: yes/no, and its resolution); the F: clone's pre-archival HEAD and ledger-append disposition; the mirror decision with its one-line argument; the preflight amendment text as committed; **the working path this pass itself executed from** (the new mandatory line, demonstrated on its own pass); suite counts; catalogs 14/9. **Delivery: Pat zips `docs/implementors-reports/` and uploads the archive.** Verdict: `PATH-1 Canonical Repository Path: Accepted — one truth, one dumb backup, and a preflight that catches the wrong tree before the wrong byte.`

---

## Standing rules (for Grok, restated)

Report before acting on every item in §4 that touches the filesystem; the F: archival is the only mutation outside the canonical repository, and it happens only after its evidence is reported. Never commit into a non-canonical clone. No fabricated references. Accepted history is annotated, never rewritten. Snapshot verified on disk before recording. Canonical commands to completion with exit codes. Catalogs 14/9 asserted. Nothing herein authorizes SEG-C, GVS integration, side-effect machinery, live execution, or any code change. After PATH-1: STOP and report; SEG-C re-runs unchanged from its existing protocol, from the canonical path, on a clean tree.

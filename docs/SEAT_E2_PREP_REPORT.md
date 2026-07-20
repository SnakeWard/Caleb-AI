# SEAT-E2-PREP — Seat Doctrine Codification + E2 Readiness Report

**Pass ID:** SEAT-E2-PREP  
**Seat:** Implementer — Grok 4.3, Grok Build TUI host  
**Authorized by:** Pat (T4)  
**Reviewer/planner:** Claude Fable 5  
**Date:** 2026-07-20  

A recap is not a report.

## Summary

SEAT-E2-PREP codifies implementer seat binding and the honest-deviations rule into
`docs/01_CODEX_OPERATING_CONTRACT.md`, creates the append-only ENV-1 seat record,
raises the E2 fixture Critic `max_tokens` to 2,048 for Critic-budget parity with
E1, adds the two-key cross-family credential lifecycle to the live-event runbook,
and locks all five deliverables with T1–T5 known-violation detectors. No runtime
source behavior changed. E2 itself is **not** authorized.

## Section 2 starting state

| Check | Result |
| --- | --- |
| Tree clean; `main`/`origin/main` at `c7cd2dc` | Pass (synchronized; post-pass commits advance HEAD) |
| Suite baseline | First full run: **205 files / 3,231 tests** with **2 load-timeout failures** under contention (`rollbackManager`, `aspectRatioHollow` PNG). Focused re-run of those two files: **2 files / 30 tests green**. Typecheck exit **0**. Build exit **0**. Treated as known contention flake (same class as LIVE-F9); not a Section 2 STOP after focused green. |
| Catalogs | **V1 = 13**, **Hollowcut = 9** |
| Planner digest | `sha256:f32675859e07243a7cf0cd8e743537f4c975826ea7bf684348ed128792489003` (unchanged) |
| Critic digest | `sha256:8074e98c3317f24cfe4f5bd1b94e9328ffe75e1f390a81f776badb759d3b8e8f` (unchanged) |
| Pre-change snapshot | `snap_20260720T154224647Z_000459_milestone` (verified on disk before mutation) |

### Section 2 credential-check raw outputs

Command:

```
powershell -NoProfile -Command 'if ($env:ANTHROPIC_API_KEY) { Write-Output PRESENT } else { Write-Output ABSENT }'
```

Raw output:

```
ABSENT
```

Command:

```
powershell -NoProfile -Command 'if ($env:XAI_API_KEY) { Write-Output PRESENT } else { Write-Output ABSENT }'
```

Raw output:

```
ABSENT
```

(Note: nested `$(...)` forms and double-quoted outer shells mangled `$env:` expansion in this host; single-quoted `-Command` bodies succeeded. The committed quote-free form is locked in the runbook for host-shell operators.)

## Deliverables

### D1 — Seat binding

Near the head of `docs/01_CODEX_OPERATING_CONTRACT.md`: section
**Implementer Seat Binding**. Contract binds the implementer seat; agent/host are
non-promoters; SEAT-ONBOARD required before first pass. Filename rename not
authorized this pass (housekeeping note only).

### D2 — Honest deviations (verbatim as committed)

> **Honest deviations.** Any departure from a governing protocol — scope, sequence, method, or outcome — is reported as a deviation in the pass report, plainly labeled, whether or not it was beneficial. "Honest deviations: none" is an affirmative mandatory line; silence is not equivalent to "none". A deviation honestly reported is reviewable material; a deviation discovered unreported is a contract violation regardless of the deviation's merit. Deviations that survive review become gates.

Also committed immediately under that section: *A recap is not a report. The seat MUST STOP on any protocol deviation rather than improvise.*

### D3 — ENV-1 seat record

Created `docs/IMPLEMENTER_SEAT_RECORD.md` with:

1. Doctrine line (SEAT-ONBOARD per tenure; standing precondition reference).
2. Correction entry (Codex seat physics: configuration-and-discipline, not wall;
   attempts one/two "sandbox egress" attribution superseded; LIVE-F2 finding stands).
3. Grok tenure entry from SEAT-ONBOARD-1, including **Pat external verification
   result** field explicitly set to *Not yet reported by Pat as of SEAT-E2-PREP
   commit* (never left blank).

### D4 — E2 Critic budget parity + ceiling finding

| Fixture | Planner `max_tokens` | Critic `max_tokens` |
| --- | --- | --- |
| E1 (unchanged) | 1,536 | 2,048 |
| E2 (SEAT-E2-PREP base) | 512 (then residual LIVE-R1) | **2,048** (was **512**) |
| E2 (after SEAT-E2-PREP-A1) | **1,536** (was **512**) | 2,048 (unchanged in A1) |

**Ceiling finding (governed-by-role confirmed):**  
`src/logicEngine/liveRotationGateEvidence.ts` uses role-specific ceilings
`LIVE_ROTATION_MAX_PLANNER_TOKENS = 1536` and
`LIVE_ROTATION_MAX_ROLE_TOKENS = 2048` (non-planner / Critic). E2 Critic at 2,048
validates; 2,049 refuses with `live_role_token_budget_exceeded`; Planner 1,537
refuses. **No runtime plumbing fix required.** Existing LIVE-R1/F9 gate-chain
detectors already exercise Planner 1537 / Critic 2049 on the E1 path; T3 maps
the same ceilings onto the E2 fixture path.

### Amendment A1 — E2 Planner budget parity (SEAT-E2-PREP-A1)

**Authorized by:** Pat (T4), binding on his relay.  
**Prechange snapshot:** `snap_20260720T155219984Z_000462_milestone`

**D4-A:** In the E2 fixture only: Planner `max_tokens` **512 → 1,536**, matching
F5 doctrine and E1. No other fixture field changes.

**Rationale on record:** three live Planner outputs (986–1,017 tokens) exceed
512; attempt four proved 512 truncates; running E2 at 512 would re-buy a solved
finding.

**Fixture diff (exactly one changed value):**

| Path | Field | Before | After |
| --- | --- | --- | --- |
| `examples/live-rotation/event-e2.cross-family.fixture.json` | `role_bindings[planner].budget.max_tokens` | `512` | `1536` |

**Detector T2 amended:** E2 resolves Planner **1,536** / Critic **2,048**; E1
unchanged **1,536** / **2,048**. T3 continues to re-prove refusal edges at
Planner **1,537** and Critic **2,049** on the E2 path.

**A1 validation:** focused SEAT-E2-PREP + gate-chain **2 files / 8 tests** exit 0;
canonical **206 files / 3,236 tests** exit 0; `tsc --noEmit` exit 0; digests
unchanged (Planner/Critic pins above); L1 not touched.

### D5 — Two-key runbook addendum (verbatim as committed)

Committed under credential discipline in the operating contract as
**Two-key credential lifecycle for cross-family events**:

For cross-family live events (more than one provider family on the same event),
the credential lifecycle runs **per key**. Sibling-process presence checks run
for **each** variable — `ANTHROPIC_API_KEY` and `XAI_API_KEY` (G2 convention for
the xAI adapter's caller-declared credential-env name) — and each MUST report
ABSENT before any key is set. Then set both keys in the authorized leaf, complete
the AUTH-2 authorization-register entry, execute the event from the human host
shell, `Remove-Item` both variables from the leaf environment, verify ABSENT for
both, and close the window. Unset proofs for **both** keys ride the event
evidence.

**Committed quote-free sibling-check form:**

```
powershell -NoProfile -Command if ($env:ANTHROPIC_API_KEY) { Write-Output PRESENT } else { Write-Output ABSENT }
powershell -NoProfile -Command if ($env:XAI_API_KEY) { Write-Output PRESENT } else { Write-Output ABSENT }
```

## Detectors (T1–T5)

File: `tests/acceptance/seatE2PrepAcceptance.test.ts`

| Detector | Result |
| --- | --- |
| T1 seat-binding + D2 text; pre-pass fixture fails | Pass |
| T2 E2 Critic 2048; E1 Critic 2048; Planner E1 1536 / E2 512 unchanged | Pass |
| T3 E2 path Critic 2048 ok / 2049 refuse / Planner 1537 refuse | Pass |
| T4 two-key + quote-free form; pre-pass fails | Pass |
| T5 seat record shape (doctrine, correction, Grok tenure, Pat field) | Pass |

Pre-pass contract fixture:
`tests/fixtures/seat-e2-prep/operating-contract.pre-seat-e2-prep.md`

Focused: **1 file / 5 tests**, exit 0.

## Validation (after)

| Command | Result |
| --- | --- |
| Focused SEAT-E2-PREP | 1 file / 5 tests, exit 0 |
| Canonical `npx vitest run` | **206 files / 3,236 tests**, exit **0** (baseline 205 / 3,231 + this pass's 1 file / 5 tests) |
| `node ./node_modules/typescript/bin/tsc --noEmit` | exit **0** |
| `npm run build` | exit **0** |
| Catalogs | **V1 = 13**, **Hollowcut = 9** |
| Template digests | both unchanged (see above) |
| L1 | **not touched** |
| AUD-2 | **compliant / T2**, 11 paths, **0 violations** (base-ref `c7cd2dc`) |
| Validation snapshot | `snap_20260720T154832305Z_000461_milestone` (18 files; Ledgered) |

## Files created

- `docs/protocols/PASS_PROTOCOL_SEAT_E2_PREP.md`
- `docs/IMPLEMENTER_SEAT_RECORD.md`
- `docs/SEAT_E2_PREP_REPORT.md`
- `examples/audit/seat-e2-prep-pass-manifest.valid.json`
- `tests/acceptance/seatE2PrepAcceptance.test.ts`
- `tests/fixtures/seat-e2-prep/operating-contract.pre-seat-e2-prep.md`

## Files changed

- `docs/01_CODEX_OPERATING_CONTRACT.md` (D1, D2, D5)
- `examples/live-rotation/event-e2.cross-family.fixture.json` (Critic max_tokens only)
- `PLANS.md`
- `docs/STATUS_LOG.md`
- `.caleb/ledger/ledger.jsonl` (append-only snapshot evidence)

## Files intentionally not changed

- Prompt templates and digests
- E1 fixture
- L1 allowlist / gate matrix / LE-3 seam
- `src/**` runtime behavior (ceilings already role-governed)
- Live-event authorization register (no invented entries)
- Historical ledger lines (append only)

## Shell commands executed (D6 complete list)

1. `git status` / `git rev-parse HEAD` / `git rev-parse origin/main` / `git log -1 --oneline` / `git status -sb`
2. Credential presence attempts (including mangled nested forms; successful single-quoted pair listed under Section 2)
3. `powershell -NoProfile -Command 'if ($env:ANTHROPIC_API_KEY) { Write-Output PRESENT } else { Write-Output ABSENT }'`
4. `powershell -NoProfile -Command 'if ($env:XAI_API_KEY) { Write-Output PRESENT } else { Write-Output ABSENT }'`
5. Baseline `npx vitest run --reporter=dot`
6. `node ./node_modules/typescript/bin/tsc --noEmit`
7. `npm run build`
8. Focused re-run: `npx vitest run tests/changeGuard/rollbackManager.test.ts tests/hollows/media/aspectRatioHollow.test.ts --reporter=verbose`
9. `npm run --silent cli -- create-milestone-snapshot --name SEAT-E2-PREP-prechange`
10. Snapshot path verification (`Test-Path` / `Get-ChildItem`)
11. Pre-pass fixture copy (`New-Item` / `Copy-Item`)
12. Catalog CLI: `list-hollows` / `list-hollowcut-hollows`
13. Focused detectors: `npx vitest run tests/acceptance/seatE2PrepAcceptance.test.ts --reporter=verbose`
14. `node -e` prompt digest verification
15. Canonical `npx vitest run --reporter=dot` (after) — 206/3236 exit 0
16. `node ./node_modules/typescript/bin/tsc --noEmit` (after) — exit 0
17. `npm run build` (after) — exit 0
18. Catalog CLI list-hollows / list-hollowcut-hollows (after) — 13 / 9
19. `npm run --silent cli -- audit-pass-compliance --manifest examples/audit/seat-e2-prep-pass-manifest.valid.json --base-ref c7cd2dc19150a977603f6d44309dc35627520a3d --json`
20. Validation snapshot create; git status/diff/log; git add/commit/push

No network tool use. No live provider calls. No credential setting. No writes outside `D:\Caleb AI`.

## L1 not-touched declaration

L1 route-input allowlist and related surfaces were **not touched**.

## Honest deviations

1. **E2 Critic start value (base pass).** Protocol D4 text said Critic `1,536 → 2,048`. On disk, E2 Critic was still the residual LIVE-R1 value **512** (F5/F9 raised only E1). Changed **512 → 2,048** to achieve Critic parity with E1.
2. **E2 Planner budget (base pass → A1).** Base SEAT-E2-PREP left E2 Planner at **512** per D4 "nothing else changes." That residual is **superseded by A1**: Planner **512 → 1,536** under D4-A so E2 matches F5 doctrine and E1. Base-pass honest deviation #2 is closed by this amendment, not rewritten out of history.
3. **Baseline full-suite contention (base pass).** First canonical baseline run reported 2 timeout failures under load; focused re-run green. Same class as prior passes; not treated as product regression.
4. **Pat external network-policy verification.** Seat record field is explicitly *Not yet reported by Pat* — required non-blank; not fabricated.

### Honest deviations (SEAT-E2-PREP-A1)

**Honest deviations: none.** A1 is a single authorized fixture field change plus T2 amendment; no protocol improvisation.

### Amendment A2 — E2 run-token ceiling parity (SEAT-E2-PREP-A2)

**Authorized by:** Pat (T4), binding on his relay.  
**Prechange snapshot:** `snap_20260720T164313189Z_000464_milestone`

**D4-B:** In the E2 fixture only: `run_budget.max_total_tokens` **4096 → 8192**,
matching E1. Spend cap `$0.05` and `max_total_invocations` **2** unchanged.

**Rationale on record:** A8's completed rotation totaled **4,110** tokens
(1,339 Planner + 2,771 Critic, input+output as the runtime sums); **4,096**
cannot contain a same-shape success.

**Fixture diff (exactly one changed value):**

| Path | Field | Before | After |
| --- | --- | --- | --- |
| `examples/live-rotation/event-e2.cross-family.fixture.json` | `run_budget.max_total_tokens` | `4096` | `8192` |

**Detector:** T2 amended to assert E2 run budget resolves
`8192` / `2` invocations / `$0.05`; E1 unchanged at the same triple.

**Run-ceiling governance finding:**  
- **Gate validator** (`liveRotationGateEvidence.ts`): absolute allow-ceiling
  `LIVE_ROTATION_MAX_TOTAL_TOKENS = 8192` — a declared fixture value **may not
  exceed** that constant (8193 refuses). It does **not** force every fixture to
  8192; E2 previously declared 4096 legally under the same constant.  
- **Runtime** (`LiveRotationRunBudgetTracker.record`): fail-closed when
  cumulative `total_tokens` exceeds **`evidence.run_budget.max_total_tokens`**
  from the fixture — **fixture-governed**, not a forced constant default.

So: ceiling **literal** is a max-allow constant; **enforced run limit** is the
fixture field (F9-pattern: constant caps declaration; fixture sets the binding
value). No `src/` change required.

**A2 validation:** focused SEAT-E2-PREP + gate-chain **2 files / 8 tests** exit 0;
canonical **206 files / 3,236 tests** exit 0; `tsc --noEmit` exit 0; digests
unchanged; L1 not touched.

### Honest deviations (SEAT-E2-PREP-A2)

**Honest deviations: none.**

## Roadmap boundary

This pass does **not** authorize E2. On acceptance: E2 (Anthropic Planner, Grok/xAI Critic) awaits Pat's separate event-specific words, recorded in `docs/LIVE_EVENT_AUTHORIZATIONS.md` **before** the wire per AUTH-2, executed from Pat's host shell under the two-key runbook committed here.

## Verdict

SEAT-E2-PREP: seat doctrine codified, ENV-1 record established, E2 Critic budget parity locked, two-key runbook locked — **ready for Pat review**. E2 remains unauthorized.

SEAT-E2-PREP-A1: E2 Planner budget parity locked at **1,536** / Critic **2,048**. E2 remains unauthorized.

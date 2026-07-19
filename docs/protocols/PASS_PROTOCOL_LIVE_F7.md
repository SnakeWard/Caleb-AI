# LIVE-F7 — Handoff Gate Check 11 Modernization + Gate-Refusal Evidence Preservation

**Pass ID:** LIVE-F7
**Seat:** Implementer (Codex), sandboxed, no network egress required or permitted for this pass.
**Authorized by:** Pat (T4), via approval of the LIVE-F7 diagnostic verdict with three reviewer amendments, July 19, 2026.
**Reviewer/planner:** Claude Fable 5.
**Protocol commit:** this file commits to `docs/protocols/` before or with the work it authorizes.

---

## Section 1 — Objective

Two coupled deliverables, one pass:

**(1) Modernize classified check 11 of the roleHandoffGate** (`src/roles/roleHandoffGate.ts`, legacy rule at line 214) from the R1–R6-era acceptance-status policy to a closed, declarative status/transition consumption matrix conforming to RA-C doctrine (`docs/ROLE_ARTIFACT_CONSUMPTION_BOUNDARY_CONTRACT.md`, lines 97–114): gate allowance is eligibility to consume T1 context — not routing, not trust promotion.

**(2) Preserve gate-refusal evidence in the Ledger** by eliminating the evidence-losing early return in `src/roleRuntime/roleRuntimeExecutor.ts` (return at ~line 174 precedes record creation at ~line 190). A gate refusal must produce a ledgered, reconstructable failed-step record **before** the executor returns. This closes the **fourth cited instance** of the telemetry-collapse defect class (prior citations: runner→H3, seam→F1, observer→F4).

This pass is code + tests only. It performs **no live provider calls**. E1 attempt seven is a separate event requiring Pat's fresh authorization in his own words with the standard credential runbook.

## Section 2 — Verified starting state (preconditions; STOP if any fails)

- Suite baseline: **200 files / 3,199 tests green** under permanent H5 traps; typecheck and build clean.
- Catalogs: **V1 = 13, Hollowcut = 9.**
- Tree clean at session start; `origin/main` synchronized.
- Attempt-six terminal records present in `.caleb/ledger/ledger.jsonl` (lines 446 and 450 as of the diagnostic) for `execution_a9ccb2e7-b11e-41f4-94a6-9923f75e03cb` and `execution_ade86bc3-c312-48f8-8630-1c7f6a1cab32`, both terminating `handoff_gate_blocked` at step 0.
- Prompt digests at baseline: Planner `f3267585…9003`, Critic `27d169bb…dd54`. This pass must not touch prompt files.

## Section 3 — Design decisions (pre-answered by reviewer under Pat's authority; deviation = STOP, not improvisation)

**D1 — Matrix shape.** Check 11 becomes a single closed declarative structure (const data, not branching logic scattered through the check body): keys are `(source_role, target_role)` transitions; values are explicit sets of consumable `acceptance_status` enum values. Any transition **not declared** in the matrix refuses. Any status **not listed** for a declared transition refuses. Default is deny; the matrix is the only source of allowance.

**D2 — Matrix contents (exhaustive; change nothing else implicitly):**
- `planner → critic`: `{ accepted, needs_revision }` ← the modernization.
- `blocked` and `rejected`: consumable by **no** target under any transition in this matrix.
- Existing `needs_revision → recovery` and `needs_revision → human_operator` allowances: preserved exactly as currently enforced.
- Every other transition currently accepted by check 11 with `accepted`: carried into the matrix verbatim with `{ accepted }` only. Enumerate them in the report.

**D3 — Refusal issue code.** Check 11 refusals emit structured issue code `acceptance_status_not_consumable` with fields: `check_index: 11`, `path: "$.source_artifact.acceptance_status"`, `expected` (the exact enum set from the matrix for that transition, or empty set if transition undeclared), `actual` (the enum value only), `transition` (`source_role`/`target_role`). Per LIVE-F1 conventions: codes verbatim, `null` when genuinely unknown, never fabricated attribution. **Never** payload prose, never the gate's free-text message.

**D4 — Failed-step ledger record.** New record type `gate_evaluation_refused`, written by the executor **before** any refusal return, keyed by `execution_id`, containing: the structured issues array (D3 shape, all refused checks — if multiple checks refuse, all are recorded), `stage`, terminal status `handoff_gate_blocked`, canonical artifact digest and artifact ID, the canonical artifact's `derived_from` link to its T0 digest, step index, and the roles of the attempted transition. Two-artifact lineage (raw T0 + canonical) must be recoverable from this record alone.

**D5 — Reconstruction.** Execution-keyed reconstruction (LIVE-F2 doctrine) must return the failed step — with its refusal issues and lineage — from `ledger.jsonl` alone, no filesystem correlation, no ambiguity between attempts. `reconstruction_ambiguous` refusal semantics unchanged.

**D6 — Untouched surfaces.** The other **fourteen classified checks are byte-for-byte behavior-identical**. Schema validation and bounded semantic-payload validation remain strict. F6 normalization logic untouched. LE-3/LE-3-A execution seam untouched — `needs_revision` plans gain Critic consumability as T1 context only; nothing here grants any path toward bridging or execution. Prompt files untouched. L1 allowlist untouched (seven entries).

**D7 — No retro-editing.** Attempt six's existing ledger records (lines 446, 450) are append-only history. The new record type applies to future evaluations. The proof that attempt six's blindness would have been cured is carried by detector, not by rewriting the ledger.

## Section 4 — Implementation scope (ordered)

1. Introduce the declarative consumption matrix and rewrite check 11 to consult it (D1, D2, D3).
2. Restructure the executor's gate-refusal path: evaluate gate → on refusal, construct and append the `gate_evaluation_refused` record (D4) → then return. Evidence before exit.
3. Extend execution-keyed reconstruction to surface the failed step from the new record (D5).
4. Implement all detectors in Section 5.
5. Full suite, typecheck, build, AUD-2 self-smoke, report, commit.

## Section 5 — Detector requirements (R37 discipline: every detector proven against a known violation, not merely absence of violation)

**T1 — Modernization detectors:**
- `needs_revision` Planner artifact → Critic: gate **passes**; consumed strictly as T1 context; assert **no trust promotion occurred** (absence assertion — the effective tier remains governed by `min(measurement, subject)` and the consumption event is a non-promoter).
- `accepted` Planner → Critic: still passes.
- `blocked` Planner → Critic: refused, code `acceptance_status_not_consumable`, expected set `{accepted, needs_revision}`, actual `blocked`.
- `rejected` Planner → Critic: refused likewise.
- `needs_revision` on a transition **not** declared for it (a masquerade-style fixture using a transition outside the matrix's `needs_revision` allowances): refused. Default-deny proven against a live violation.
- Recovery and human_operator `needs_revision` allowances: still pass.
- Each of the other fourteen checks: at least one existing or new fixture proving its refusal behavior is unchanged (existing suite coverage may satisfy this — enumerate which tests carry each check in the report).

**T2 — Attempt-six shape replay (Amendment 1, mandated).** A fixture reproducing attempt six's exact structural shape — F4 runtime-built envelope, valid canonical artifact, `acceptance_status: needs_revision`, target `critic` — run against the **legacy** matrix state to prove refusal at check 11, and against the modernized matrix to prove passage. Additionally, force a refusal (e.g. `blocked` variant of the same shape) through the full executor path and prove the `gate_evaluation_refused` record lands in the ledger with: issue code, path, expected set, actual enum, canonical digest + ID, `derived_from` T0 digest, and that execution-keyed reconstruction returns this failed step **from ledger bytes alone**. This detector is the proof that attempt six's blindness is cured.

**T3 — Leak-path detector (Amendment 2, mandated).** Assert the `gate_evaluation_refused` record contains **no payload prose and no gate free-text**: construct a refusing artifact whose semantic payload contains a distinctive sentinel string; prove the sentinel appears nowhere in the ledgered record or reconstruction output. The evidence-preservation fix must not become a new T0 leak path into the Ledger.

**T4 — Sequencing detector.** Prove the record is written before the refusal return: a refusal whose post-record path is made to throw still leaves the `gate_evaluation_refused` record in the ledger (evidence survives all failures — LIVE-F5 doctrine applied to the gate boundary).

## Section 6 — Forbidden actions

- No loosening of any check other than the declared check-11 modernization; no widening of the matrix beyond D2.
- No speculative normalization anywhere (standing contract prohibition; verbatim in the operating contract since LIVE-F6).
- No payload prose or free-text messages in any ledger record (T3 enforces).
- No prompt file edits; no L1 allowlist edits; no LE-3 seam edits; no live provider calls; no credentials in any shell.
- No retro-editing of existing ledger lines (D7).
- No fabricated report content; honest deviations declared as deviations.

## Section 7 — Mandatory report lines

- Catalog counts verbatim: **V1 = 13, Hollowcut = 9** (unchanged expected).
- Suite counts verbatim: files/tests before and after, exit codes from canonical commands run to completion (`npx vitest run`, `node ./node_modules/typescript/bin/tsc --noEmit`).
- L1 allowlist: declaration that it was **not touched**; if touched (it must not be), the seven entries verbatim and a STOP explanation.
- **Prompt digest line (Amendment 3, mandated):** Planner `f3267585…9003` and Critic `27d169bb…dd54`, both unchanged, verified against the committed prompt files.
- The full matrix contents as implemented (D2), including the enumerated carried-over transitions.
- Per-check coverage map: which test carries each of the fifteen checks' behavior.
- Telemetry-collapse defect class: fourth citation recorded (gate→F7), with the record-type name and the T2 detector reference.
- AUD-2 self-smoke result.
- Honest deviations (or "none").

## Section 8 — Commit and handoff discipline

- Single logical commit (or minimal series) with `LIVE-F7` in every commit message.
- This protocol file committed to `docs/protocols/` before or with the work.
- Handoff complete only when the working tree is clean and `origin/main` is synchronized.
- Report rides the handoff; a recap is not a report.

## Section 9 — STOP conditions

STOP and report without improvising if any of the following:
- Any precondition in Section 2 fails.
- The legacy check-11 code is found to enforce anything **beyond** acceptance-status policy (scope surprise → architectural question for Pat).
- Carrying the matrix over (D2) surfaces a currently-accepted transition whose correct enum set is ambiguous.
- The executor restructure cannot preserve evidence without touching the LE-3 seam or any other forbidden surface.
- Any detector in Section 5 cannot be made to prove its violation case honestly.
- Any suite regression not directly explained by this pass's intended behavior change.

## Section 10 — What this pass does not do (roadmap boundary)

This pass does not execute E1 attempt seven. Upon acceptance of the LIVE-F7 implementation report by the reviewer, attempt seven requires Pat's fresh authorization in his own words, the standard credential runbook (fresh leaf shell, sibling-process check, set key, authorize, run, remove key, verify, close window, unset proof with the JSON), and execution from Pat's own host shell — agents build and validate; humans execute live. Step index 1 — the Critic — executes for the first time on the other side of this gate.

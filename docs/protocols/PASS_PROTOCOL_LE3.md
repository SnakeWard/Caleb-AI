# Caleb AI — Pass Protocol LE-3 (Guarded Execution Seam + Acceptance Lock)

**Prepared by:** Claude Fable 5 (reviewer/planner), for execution by Codex (implementer)
**Convention:** commit to `docs/protocols/PASS_PROTOCOL_LE3.md` with the work. Handoff rule: `git status --short` first; dirty-and-not-yours = STOP.
**Combination:** LE-3 (execution seam) + LE-3-A (acceptance lock) in one protocol, GOV-1+LE-2 style, under a pre-approved decision envelope. Deviation from the envelope = STOP. The lock stage runs only after the seam stage's own validation is green.
**What this pass is:** the first time Caleb executes a rotation. A bridged plan (LE-2 output) runs through the RA-R1 executor under a guarded seam: mock adapters only, human-initiated, mandatorily ledgered, with the four audit detectors proving the guardrails. Nothing live, nothing dynamic, nothing capability-bearing — those remain unbridgeable upstream, which is exactly why this pass is safe to run.

---

## Stage LE-3 — Guarded Execution Seam

### 1. Pass name
LE-3 — Guarded Execution Seam: bridged-plan execution, mock-only, human-initiated, mandatorily ledgered.

### 2. Purpose
Wire LE-2's derived plans into the RA-R1 static rotation executor through a seam that enforces, at the execution boundary, everything the contracts promise: only bridged plans run; every execution is ledgered or refuses to start; no provider path exists; no prose influences any branch; the L1 allowlist is untouched. Success is Caleb's first complete rotation — Planner speaks, Critic answers, and the whole exchange reconstructs from `ledger.jsonl` alone.

### 3. Prior summary
LE-2 accepted (`1199298`, 184/3,094): deterministic bridge, two legal routes (`planner_critic` multi-cycle; `planner_critic_synthesizer` single-cycle), seven rejection walls, mandatory bridge-stage ledger. RA-R1 executor exists at `src/roleRuntime/` (mock adapters, static sequences). Named debts open: `LE1-LEDGER-1`, `GIT-HYG-1`. Capability-bearing and live-bound plans are unbridgeable upstream by LE-2 rules 5 and 8.

### 4. Pre-approved decision envelope

1. **Execution entry is human-initiated only.** The seam is invoked via an explicit CLI command (e.g., `execute-rotation-plan --plan-file <path> --confirm`), which constitutes the human command authority for V1. No engine-internal path may trigger execution; a detector asserts no non-CLI caller of the seam exists. Route-selection integration (the engine *choosing* to execute) is future work behind its own pass — the seam executes what a human hands it, nothing else.
2. **Only bridged plans execute.** The seam accepts ONLY LE-2 derived-plan artifacts, verified by: derived-plan digest present in the ledger (bridge entry lookup), lineage resolving to a source `rrp_` plan, and structural revalidation at the seam (defense in depth). A raw RA-R2 plan, a hand-built RA-R1-shaped plan, or a plan whose bridge ledger entry is absent → structured refusal `seam_rejected_unbridged_plan`. The bridge is the only door; this rule makes it so at the point of execution, not just by convention.
3. **Mandatory ledger, end-to-end, fail-closed.** The seam constructs the executor invocation with the ledger callback REQUIRED at the type level on the seam's path. Executing with a suppressed/absent ledger callback fails closed before the first role invocation (detector: synthetic suppression → refusal, zero roles executed). The RA-R1 executor's own optional parameter is not modified; the seam makes the optional impossible on the only path that matters. Every role invocation ledgers: role, adapter identity, context_refs (digests entering context, per RA-R1 doctrine), artifact digest produced, timestamps, lineage to the derived plan.
4. **The four audit detectors (Codex's step-4 requirements), each proven to fire:**
   - **No L1 widening:** allowlist seven entries verbatim, lock test green; a synthetic attempt to present a derived plan or execution result as a route input → rejected at the L1 gate.
   - **No provider path:** no provider adapter import reachable from the seam or executor path (static assertion over the module graph); H5 traps green across the full suite; the mock adapter interface is the only binding satisfied.
   - **No prose-driven branching:** two executions whose plans/artifacts differ only in prose content (artifact text, inert stop-criteria provenance) produce identical execution *structure* — same sequence walked, same halt point, same ledger record shapes (artifact digests differ, of course; the detector compares structural fields only).
   - **No unledgered execution:** covered by rule 3's detector, plus a post-run assertion that ledger entries exist for every invocation the run claims.
5. **Fail-closed mid-rotation, per RA-R1 doctrine:** a mock-adapter failure or artifact validation failure halts the run with a structured ledgered failure record (roles completed, failure point, code); no skip, no retry, no substitution. Detector: fixture with a failing Critic mock → halt after Planner, failure ledgered, nothing after.
6. **Golden rotation (the pass's headline):** the two-cycle `planner_critic` fixture executes end to end: four invocations (P→C→P→C), each artifact T0→validated T1→digest-stored in the M3 store→lineage-linked; Critic invocations' context_refs contain the prior Planner artifact digests; run-completion record written. Then the **chain reconstructability test**: from `ledger.jsonl` content alone — no runtime state — reconstruct role order, invocations, context digests, artifact digests, and lineage, and assert it matches the run. This is RA-C question 5, executable, at last.
7. **`LE1-LEDGER-1` debt:** resolved here if cheap (LE-1 classification artifacts gain their ledger write through the same machinery); otherwise it remains named with a stated reason. Implementer's one-line argument either way.
8. **Authorship at the seam:** derived plans carry provenance from bridging; the seam re-asserts source-plan authorship human/fixture (the LE-2 wall re-checked, defense in depth). `orchestration_core`/`logic_engine` authorship remains rejected; AUTH-1 is the named future pass if engine authorship is ever argued.

### 5. Files to create
- `src/logicEngine/rotationExecutionSeam.ts` (or argued equivalent) — verification, refusals, executor invocation with mandatory ledger.
- CLI command wiring (in the established command-handler location) — `execute-rotation-plan`, confirm-flag gated.
- `tests/logicEngine/rotationExecutionSeam.test.ts` — unit: every refusal code, ledger-mandatory fail-closed, revalidation.
- `tests/acceptance/le3GuardedExecutionAcceptance.test.ts` — golden rotation, reconstructability, the four detectors, mid-rotation fail-closed.
- `docs/LE3_GUARDED_EXECUTION_SEAM.md` — implementation doc: decision inventory (every branch, structural driver), refusal codes, the golden-rotation trace as the worked example, and "what the live-rotation pass inherits" (gate chain, budgets, per-role live bindings — named, not built).

### 6. Files to modify
- `docs/STATUS_LOG.md`, `PLANS.md` — LE-3 and LE-3-A entries. Barrel exports as needed.
- NOT: `routeInput.ts`, L1 locks, role/handoff registries, RA-R1 executor internals (the optional-parameter question is answered at the seam, not by modifying the executor), providers, vitest config, H5 traps, package files, catalog manifests, historical Ledger.

### 7. Documentation requirements
Per §5. The golden-rotation trace is written as the canonical worked example of a complete legal rotation — it supersedes RA-C's hypothetical as the reference every future implementer reads first.

### 8. Acceptance requirements (seam stage)
- Golden rotation green; reconstructability green; all four detectors fire; mid-rotation fail-closed proven; every refusal code exercised; `seam_rejected_unbridged_plan` proven against all three unbridged variants (raw RA-R2, hand-built RA-R1-shape, missing bridge ledger entry).
- AUD-2 self-smoke: compliant/T2. L1 seven verbatim. Catalogs 13/9. Canonical suite green (counts verbatim), canonical typecheck exit 0, build exit 0. Tree clean, remote synced.

---

## Stage LE-3-A — Execution Boundary Acceptance Lock

House lock pattern (M3-A / L1-A precedent): a dedicated acceptance report (`docs/LE3_EXECUTION_BOUNDARY_ACCEPTANCE_REPORT.md`) plus a lock test (`tests/acceptance/le3ExecutionBoundaryAcceptanceLock.test.ts`) pinning: the bridged-plans-only rule; the human-initiated-only rule (no non-CLI caller); the mandatory-ledger rule; the four detectors' continued presence by name; the mock-only binding; and the verbatim statement that live execution, dynamic sequencing, capability-bearing plans, and route-selection integration are ABSENT and each returns only via its own named future pass with a visible lock amendment. Lock-fires demonstration required (synthetic weakening caught, then removed — R37 discipline applied to locks, per L1-A precedent). No runtime changes in this stage; if writing the lock reveals a seam gap, STOP and report — locks lock, they don't fix.

### Report format (combined)
House style. Mandatory lines: golden-rotation result with invocation count; reconstructability result; the four detector test names; refusal codes exercised; `LE1-LEDGER-1` disposition with one-line argument; lock-fires evidence; L1 seven verbatim; catalogs 13/9; suite counts; canonical tsc exit code; AUD-2 verdict; **and riding alongside: the 15-line RA-R1-D Deliverable 1 table, verbatim — the debt rides this report or the report is incomplete.** Verdicts: `LE-3 Guarded Execution Seam: Accepted — Caleb rotates: bridged plans only, human-initiated, every step ledgered, the chain reconstructs from the record alone.` and `LE-3-A Execution Boundary Lock: Accepted — the first rotation's guardrails are now a protected surface.`

---

## Standing rules (restated)

Envelope deviations = STOP. Snapshots (`le3_execution_seam_prechange`, `le3a_lock_prechange`) verified on disk before recording. No fabricated references. Canonical commands to completion, exit codes reported. Credentials never ambient. Honest deviations mandatory. Locked surfaces change only by visible protocol-governed diffs; this pass changes none and locks one more. Nothing herein authorizes live rotation, dynamic sequencing, RA-X, registry changes, providers, capability-bearing execution, route-selection integration, or UI. `GIT-HYG-1` remains parked. After LE-3-A: STOP and report — the next protocol depends on whether Pat's priority is the live rotation gate chain or the RA-X design, and that fork is his to call.

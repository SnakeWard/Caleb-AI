# Caleb AI — Pass Protocol LIVE-R1 + LIVE-R2 (Live Rotation Gate Chain + First Live Rotation)

**Prepared by:** Claude Fable 5 (reviewer/planner), for execution by the current implementer
**Convention:** commit to `docs/protocols/PASS_PROTOCOL_LIVE_R1_R2.md` with the LIVE-R1 stage. Handoff rule: `git status --short` first; dirty-and-not-yours = STOP.
**Combination:** LIVE-R1 (gate chain, contracts, lock amendment) + LIVE-R2 (the manual live event) under a pre-approved envelope. Deviation = STOP. LIVE-R2 executes only after LIVE-R1's full validation is green AND Pat gives the explicit live go in his own words — the live event is never implied by protocol acceptance.
**What this pass is:** the M1→M2 pattern scaled from one call to a sequence. LIVE-R1 builds the gate chain that makes live role bindings bridgeable; LIVE-R2 is the M2 moment writ large — a real Planner and a real Critic exchanging real artifacts under full ledger discipline, manually initiated, budgeted, and honest about whatever reality breaks.

---

## Stage LIVE-R1 — Live Rotation Gate Chain

### 1. Pass name
LIVE-R1 — Live Rotation Gate Chain: contracts, per-role live bindings, budgets, and the visible lock amendment that re-admits live adapters to the bridge.

### 2. Purpose
Build the machinery that LE-2 rule 8 refused to proceed without: a complete gate chain for live rotation, so that `adapter_kind: "live"` stops being unbridgeable-by-rule and becomes bridgeable-with-evidence. This is the re-admission-with-verifier-attached pattern (the L1-B doctrine): the rejection was placed because the gate chain didn't exist; the gate chain now arrives, and the rejection is amended in a visible diff that the LE-2 acceptance lock must consciously confront.

### 3. Prior summary
LE-3/LE-3-A accepted (`3a6d5b2`, 188/3,127): Caleb rotates — bridged plans only, human-initiated, mandatorily ledgered, chain reconstructable. Live adapters exist for Anthropic and xAI behind the M1 gate chains, egress pinned to exactly two call sites, first live calls completed (M2, G2). LE-2 rule 8 rejects live bindings pending this pass. Host remediated (C: 52GB, F: 169GB free); TIME-1 budgets in force.

### 4. Pre-approved decision envelope

1. **Live bridgeability rule (the lock amendment).** The LE-2 bridge accepts `adapter_kind: "live"` if and only if the plan carries a complete `live_rotation_gate_evidence` block, validated structurally: explicit opt-in, explicit live request, network permission, named approver, per-role provider/model bindings restricted to the two egress-pinned adapters, and per-role + total budgets (below). Absent or incomplete evidence → the existing rejection `bridge_rejected_live_adapter_unavailable` fires unchanged. The LE-2 acceptance lock test is amended in the same visible diff — the L1-B masquerade precedent applied to its sibling: re-admission and verifier arrive together. A detector proves the old rejection still fires for evidence-free plans.
2. **Budgets are structural fields, enforced fail-closed at the seam.** Per role invocation: `max_tokens` (Planner 512, Critic 512 for the first event — enough to emit real artifacts, small enough to bound cost), `timeout_ms` 30,000, `max_response_bytes` 1 MiB. Per run: `max_total_invocations` (from the bridged plan, exact), `max_total_tokens`, and `max_spend_usd` (first event cap: $0.05 — two orders of magnitude above expected cost, three below caring). Any budget breach → fail-closed halt per LE-3 rule 5, structured ledgered failure, no continuation. Budgets live in the gate-evidence block, echoed into the derived plan, asserted at execution.
3. **Credentials per the standing doctrine, extended to sequences.** Never ambient (H8 rule; the trap is armed). The live CLI takes `--credential-env-var <NAME>` per provider through the single sanctioned env-read site; keys exist only in closures; a pre-run check asserts no OTHER credential-shaped vars are ambient. Cross-provider runs name two vars, read at the same single site, each scoped to its adapter's closure.
4. **Content handling: M3 machinery, at last used for its purpose.** Unlike M2's digest-only constraint, rotation REQUIRES consumption — and the consumption boundary now exists. Live artifacts: T0 on receipt → validated T1 → content-addressed into `.caleb/artifacts/` → digests and refs only in the ledger (the M2 redaction guarantee holds at sequence scale) → Critic's context assembled from digests per RA-R1 inert-transport rules, context_refs ledgered. Display remains deferred (M4): the run's output surfaces digests, tiers, timings, and verdicts — never artifact prose. The human may read artifacts directly from the store on disk; that is filesystem access, not a display flow, and the doc says so in one line.
5. **First event shape: minimal, then showcase.** LIVE-R2 Event E1: single-cycle `planner_critic`, both roles bound to `claude-haiku-4-5` via the Anthropic adapter — one provider, one credential, two invocations, minimum variance. Event E2 (runs only on Pat's separate word after E1's findings are recorded): cross-family — Planner on Anthropic Haiku, Critic on xAI `grok-3-mini` — the two-model exchange that is the project's founding image. Both events use human/fixture-authored plans, bridged, executed through the LE-3 seam via the confirm-gated CLI.
6. **Prompt discipline per role.** Role prompts are fixture-authored templates (committed, digest-recorded): Planner receives the task statement; Critic receives the task statement + Planner artifact as context per the assembly template. Prompt digests ledgered, M1-style integrity binding. No prompt engineering iterations during the live event — what's committed is what runs; improvements are findings for the next pass.
7. **Offline default preserved absolutely.** All LIVE-R1 tests run mock/injected; the live path exists only behind the gate evidence + CLI confirm + credentials-in-the-moment. `*.live.test.ts` exclusion untouched; H5 traps green across the canonical suite; egress remains pinned at the existing two call sites (no new fetch sites — the adapters already exist; this pass wires sequence plumbing, not transport).
8. **Findings doctrine for LIVE-R2.** The acceptance report's mandatory centerpiece: "assumptions reality broke," however short or long. History predicts at least one (capital-A, the 410, the ambient key). An empty list requires an affirmative sentence claiming it, which history suggests will not survive review.

### 5. Files to create (LIVE-R1)
- `src/logicEngine/liveRotationGateEvidence.ts` (or argued location) — evidence block types + structural validator.
- Seam/bridge extensions for evidence validation and budget enforcement (argued file placement; RA-R1 executor internals still untouched).
- Fixture prompt templates + E1/E2 plan fixtures under `examples/`.
- `tests/logicEngine/liveRotationGates.test.ts` — every gate miss refuses; budget breaches halt fail-closed (mock adapters returning oversized/slow responses); evidence-free live plans still rejected.
- `tests/acceptance/liveR1GateChainAcceptance.test.ts` — detectors + the amended LE-2 lock assertions in the same visible diff.
- `docs/LIVE_ROTATION_GATE_CHAIN.md` — the chain, budgets, credential flow, content handling, and what remains deferred (M4 display, dynamic sequencing, RA-X).
- Optional rider: `docs/HOST_BASELINE.md` (hardware profile, triage rubric, dated remediation note) — five minutes, long owed.

### 6. Files to modify
- `tests/acceptance/le2RotationPlanBridgeAcceptance.test.ts` — the visible lock amendment (rule 1).
- CLI handlers for the live-rotation command path; barrels; `docs/STATUS_LOG.md`, `PLANS.md`.
- NOT: `routeInput.ts`, L1 locks, role/handoff registries, H5 traps/config, vitest config, package files, catalog manifests, provider adapter transport code, historical Ledger.

### 7–8. LIVE-R1 documentation and acceptance
Per §5 doc. Acceptance: all gate-miss detectors fire; budget fail-closed proven; evidence-free rejection still fires; LE-2 lock amendment visible and green; canonical suite green (counts verbatim), canonical tsc exit 0, build exit 0; catalogs 13/9; AUD-2 self-smoke compliant/T2; L1 seven verbatim; tree clean, remote synced. STOP after LIVE-R1 validation — LIVE-R2 requires Pat's explicit live go.

---

## Stage LIVE-R2 — First Live Rotation (Manual Event)

**Preconditions:** LIVE-R1 green and committed; Pat's live go in his own words; credentials set in the moment (and unset after — the report confirms both); pre-run ambient-credential check clean; snapshot `live_r2_event_prechange` verified on disk.

**Event E1 (authorized by this protocol upon Pat's go):** single-cycle planner_critic, Haiku both roles, budgets per envelope. Execution: bridge the E1 fixture plan (gate evidence complete) → confirm-gated CLI → LE-3 seam → two live invocations → artifacts stored, ledgered, chain complete. Then, the crown assertion: **reconstruct the live rotation from `ledger.jsonl` alone** — role order, invocations, context digests, artifact digests, token usage, budgets honored — and verify the reconstruction against the run. The reconstructability test, first proven on mocks, now proven against reality.

**Event E2 (requires Pat's separate word after E1 findings are recorded):** cross-family per envelope rule 5. Same discipline, same report structure. This is the demonstration artifact: two model families, one governed exchange, every step on the record.

**LIVE-R2 report (mandatory lines):** full ledger trace summary (entry IDs, digests — no prose); token usage and spend per invocation and total vs. budgets; timings; credential lifecycle confirmation (set in the moment, unset after, trap-verified); the findings list per envelope rule 8; the live reconstructability result; AUD-2 self-smoke; canonical suite green post-event (the live event must not have altered any default-path behavior); tree clean. Verdicts: `LIVE-R1 Live Rotation Gate Chain: Accepted — live bindings are bridgeable with evidence and refused without it; budgets bind; nothing is ambient.` and `LIVE-R2 First Live Rotation: Completed — a real Planner spoke, a real Critic answered, and the record alone proves the whole exchange.`

---

## Amendment A — 2026-07-19 — Transient normalized-output observer

Amendment A is granted. LIVE-R1 may add a caller-supplied transient output
observer to the Anthropic and xAI adapter dependency/result plumbing so normalized
provider output can enter the M3 validation and content-addressed storage path.
This supersedes the "provider adapter transport code" exclusion for exactly this
scope. Transport and credential behavior remain frozen under these binding
conditions:

1. **A1 — Optional and bit-identical when absent.** No observer supplied means
   exact current digest-only behavior. Existing M1/M2 adapter tests run unchanged
   and green with zero edits; the proven single-call Anthropic and Grok paths must
   not know LIVE-R1 happened.
2. **A2 — Digest binding asserted.** The observer receives the same normalized
   text the adapter hashes. The M3 store's computed content address must equal the
   adapter-reported `output_digest`; mismatch fails closed with a distinct code.
   A synthetic mismatched-observer detector is mandatory.
3. **A3 — Observer failure is invocation failure.** Throwing or reported observer
   failure returns a distinct `observer_failure` class (or argued equivalent),
   halts rotation fail-closed, is Ledgered, and permits no later invocation. There
   is no digest-only fallback when the observer was supplied.
4. **A4 — Redaction extends to the observer.** The observer receives normalized
   output text only: never credentials, headers, or raw wire bodies. Text may
   enter memory and then the M3 store, but never a result envelope, failure
   message, or Ledger shape. The M1 serialization sweep is rerun with an observer
   wired. Grok `reasoning_content` remains excluded from normalized output and
   therefore never reaches the observer.
5. **A5 — Result plumbing only.** No fetch sites, endpoints, headers, credential
   closures, retries, or transport behavior change. The two-call-site egress pin
   remains verbatim. The report states that transport-function diffs are empty.
   Authorized adapter changes are limited to types, the two adapters' result
   paths, tests, and documentation.

Review note: the implementer's amendment request was minimal, explicit about
non-goals, and honest about the boundary between a gate-only implementation and a
runnable LIVE-R2 path; that made the authority decision a review rather than a
negotiation.

---

## Standing rules (restated)

Envelope deviations = STOP. The live event never starts without Pat's explicit go, stated fresh — no standing authorization exists or is created by this document. Snapshots verified on disk before recording. Credentials in the moment only; the trap is armed and has caught one already. No fabricated references. Canonical commands to completion, exit codes reported. Honest findings are the deliverable, not the embarrassment — the report that says "reality broke X" is worth more than the one that claims perfection. Locked surfaces change only by visible diffs; this pass makes exactly one (the LE-2 lock, rule 1) and locks its own additions. Nothing herein authorizes dynamic sequencing, RA-X, capability-bearing plans, side effects, registry changes, new adapters, new egress sites, or UI. After LIVE-R2: STOP and report — the fork's other road (RA-X) awaits with its preconditions already named, and the findings from reality's first contact with rotation ride into its design.

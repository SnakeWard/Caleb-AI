# Caleb AI — Pass Protocol GOV-1 + LE-2 (Combined)

**Prepared by:** Claude Fable 5 (reviewer/planner), for execution by Codex (implementer)
**Convention:** commit this file to `docs/protocols/PASS_PROTOCOL_GOV1_LE2.md` with the GOV-1 stage.
**Combination rationale (on the record):** usage limits and time constraints. The diagnostic-before-implementation convention is preserved in substance by a **pre-approved decision envelope** (§LE-2.4): every design decision raised by Codex's audit is answered in this protocol by Pat's authority. The implementer STOPs only if reality deviates from the envelope. Any finding outside the envelope = STOP and report; nothing outside it is decided by the implementer.
**Sequencing inside the pass:** GOV-1 (preflight reconciliation) → LE-2 (bridge). The guarded execution seam (Codex's step 4) is NOT part of this pass and is not authorized by it.

---

## Stage GOV-1 — Governance and Handoff Reconciliation

### Purpose
Restore the clean-tree, synchronized-remote baseline that every governed pass presumes, and repay the outstanding P2 record debt.

### Core rules
1. **Tree:** commit the uncommitted ledger append (`ledger_snap_20260707T213848375Z_000385_milestone`) as its own housekeeping commit with an honest message (validation-run append, consistent with M3-B precedent). If anything ELSE is dirty beyond that one entry, STOP and report verbatim.
2. **Remote:** push all 9 local commits. Verify `git status -sb` shows main in sync with origin/main. The offsite backup being 9 commits stale was a silent single-disk exposure; the report states the push result explicitly.
3. **Stale authority documents:** synchronize status/authority docs that still assert superseded facts (catalog "12 locked" prose outside historical locks; any doc naming RA-R1 as unimplemented). Content-correcting edits only, each listed in the report with one-line reasons. Do NOT retroactively fabricate protocol provenance for any pass that lacks a committed protocol — where provenance is missing, record the gap honestly in STATUS_LOG ("pass X was executed under chat-issued instruction; protocol not committed at the time") per Codex's own recommendation: record, never backfill.
4. **P2 debt payment (mandatory report line):** paste into the GOV-1 report the RA-R1-D Deliverable 1 table verbatim from `docs/RA_R1_STATIC_ROTATION_DIAGNOSTIC.md` — all 15 handoff-gate checks with file:line. This closes the reviewer-seat review requirement that survived three seat rotations. If the table in the doc does NOT contain file:line citations for all 15, that is a finding: say so, and the citations are added to the doc in this stage (from the actual source, verified).
5. **Canonical typecheck adoption:** add to the operating contract's standing rules: the canonical typecheck command is `node ./node_modules/typescript/bin/tsc --noEmit`, run to completion, exit code reported. "Did not complete" is no longer an acceptable validation line.

### GOV-1 validation
Canonical suite (`npx vitest run`, counts verbatim — baseline expectation 182 / 3,069); canonical typecheck to completion; catalogs V1 = 13, Hollowcut = 9; AUD-2 self-smoke against this stage's manifest; tree clean; remote in sync. Commit; push.

---

## Stage LE-2 — RA-R2 → Executable Plan Bridge (Contract + Implementation + Lock)

### 1. Pass name
LE-2 — RuntimeRotationPlan Bridge: deterministic derivation from RA-R2 contract to RA-R1 executable form, fail-closed, mock-only, mandatorily ledgered.

### 2. Purpose
Build the bridge Codex's audit proved cannot be a "simple connection": a deterministic, total-function derivation layer that either produces a valid RA-R1 executable plan from an RA-R2 RuntimeRotationPlan or refuses with a structured, ledgered rejection. The bridge is where every incompatibility Codex found becomes an explicit, tested rule instead of a latent surprise. No execution: the bridge derives plans; nothing in this pass runs them.

### 3. Prior summary
LE-1 accepted (`fdd82fe`, 182/3,069): the engine classifies RA-R2 plans at the route boundary, read-only, carried by `contract_validated_task_frame`. Codex's read-only audit enumerated eight incompatibilities between the RA-R2 contract layer and the RA-R1 executor. GOV-1 restored the clean baseline and paid the P2 debt.

### 4. The pre-approved decision envelope (Pat's authority; deviations = STOP)
Each of Codex's findings, decided:

1. **Analyst role (in RA-R2, absent from role registry):** fail-closed. A plan referencing any role absent from the current registry is UNBRIDGEABLE — structured rejection `bridge_rejected_unknown_role`. No silent role-mapping, no registry additions in this pass. Registering Analyst is future work via its own visible pass.
2. **`planner_synthesizer` transition (forbidden by handoff registry):** fail-closed. Plans requiring transitions the registry disallows are rejected: `bridge_rejected_forbidden_transition`. The registry is authoritative; the bridge never overrides it.
3. **Structural mapping (role sets/cycles/Hollows/gates → ordered sequence, adapter bindings, IDs, max_invocations):** the bridge derives deterministically: declared role order within each cycle × `max_cycles` (bounded 1–3 per RA-R2) → ordered sequence; `max_invocations` = sequence length (exact, no headroom); trace/context IDs minted post-H4 UUID; lineage refs to the source plan's `rrp_` ID. Same input plan → byte-identical derived plan (determinism test required).
4. **Prose `stop_criteria`:** NEVER executable. The bridge copies them into the derived plan's provenance block as inert documentation and derives execution stops ONLY from structural fields (sequence exhaustion, max_invocations, fail-closed halt). A detector proves prose stop-criteria cannot influence any derived structural field.
5. **Gate obligations (final verification; approval/snapshot gates for side-effect/code-mutation plans):** the bridge maps RA-R2's mandatory `final_verification_gate` and `role_handoff_gate` flags into explicit structural fields on the derived plan. Plans declaring side-effect or code-mutation intent are UNBRIDGEABLE in this pass (`bridge_rejected_ungated_capability`) — the approval/snapshot gate machinery they require doesn't exist in the executor yet, and the bridge refuses rather than dropping the obligation. This is refusal-before-capability applied to the bridge itself.
6. **LE-1's empty `ledger_refs` / unwritten artifact:** the bridge WRITES. Every bridge invocation — success or rejection — produces a ledger entry: source plan digest, outcome, derived-plan digest (on success) or rejection code, lineage. LE-1's classification artifact gains its ledger write here too if cheap; otherwise named-deferred in the report.
7. **Optional `appendRecord`:** the bridge's derived plans are marked `ledger_mandatory: true`, and the bridge module exposes its executor-facing constructor ONLY in a form that requires a ledger callback (type-level: no optional parameter on the bridge's output path). The RA-R1 executor's own optional parameter is out of scope to change here — but a detector asserts that any future execution of a BRIDGED plan without a ledger callback fails closed. Note this as the standing rule the guarded-execution pass must enforce end-to-end.
8. **`adapter_kind: "live"` accepted by mock-only runtime:** fail-closed NOW. The bridge rejects any plan binding a live adapter: `bridge_rejected_live_adapter_unavailable`. Live rotation remains a future, separately gated event; until its gate chain exists, "live" is unbridgeable by rule, not by accident.

### 5. Files to create
- `src/logicEngine/rotationPlanBridge.ts` (or argued equivalent location) — the derivation + rejection logic.
- `tests/logicEngine/rotationPlanBridge.test.ts` — unit coverage: every rejection code, determinism (same input → byte-identical output), structural mapping correctness.
- `tests/acceptance/le2RotationPlanBridgeAcceptance.test.ts` — detectors (§8) and the acceptance lock: the envelope's eight rules pinned as named tests, so weakening any rule requires a visible diff.
- `docs/LE2_ROTATION_PLAN_BRIDGE.md` — implementation doc: the eight envelope rules, the derivation algorithm, the decision inventory (every branch, its structural driver), and the standing obligations this pass hands the guarded-execution pass.

### 6. Files to modify
- `docs/STATUS_LOG.md`, `PLANS.md` — GOV-1 and LE-2 entries.
- Barrel exports as needed. NOT: `routeInput.ts`, L1 lock tests, role registry, handoff registry, RA-R1 executor internals (beyond none), providers, vitest config, H5 traps, package files, catalog manifests, historical Ledger.

### 7. Documentation requirements
Per §5's doc, plus: an explicit "what the guarded-execution pass inherits" section — mandatory ledger end-to-end, the gate machinery gap behind rejection code 5, the live-adapter gate chain gap behind code 8, and the Analyst-registration question. These are the next pass's preconditions, named now.

### 8. Acceptance requirements (detectors each proven to fire)
- Every rejection code exercised by a fixture: unknown role, forbidden transition, ungated capability, live adapter, plus schema/authorship/reference failures inherited from LE-1's validation (model-authored plans remain rejected at this layer too — re-asserted).
- Determinism: identical input plan bridged twice → byte-identical derived plans.
- Prose-immunity detector: two plans differing ONLY in `stop_criteria` prose produce byte-identical derived structural fields.
- Ledger completeness: every bridge invocation in the test suite has a corresponding ledger entry; a synthetic bridge call with ledger write suppressed fails closed.
- Read-only-beyond-scope proof: no route selection, no execution, no L1 change (seven entries verbatim), no registry change.
- AUD-2 self-smoke against this pass's manifest: verified/T2, compliant.
- Canonical suite green (counts verbatim); canonical typecheck to completion with exit code; catalogs 13/9; tree clean; remote in sync.

### 9. Validation commands
Snapshots per stage (`gov1_reconciliation_prechange`, `le2_bridge_prechange`), each verified on disk before recording. Then the §8 matrix. Commit per stage with pass IDs; push after each; clean tree.

### 10. Report format
House style. Mandatory lines: GOV-1 — push result, stale-doc edits listed, provenance gaps recorded (not backfilled), **the 15-line Deliverable 1 table verbatim**; LE-2 — the eight envelope rules confirmed as implemented-or-deviation-STOP, every detector's test name, determinism and prose-immunity results, ledger-completeness result, AUD-2 self-smoke verdict, L1 seven verbatim, catalogs 13/9, suite counts, canonical tsc exit code. Verdicts: `GOV-1 Governance Reconciliation: Accepted — baseline restored, record debts paid.` and `LE-2 Rotation Plan Bridge: Accepted — RA-R2 plans derive deterministically or refuse loudly; every incompatibility is now a rule; nothing runs yet.`

## Amendments A–C — Authorized Success Route and Acceptance Rebalance

**Authorized by:** Pat, current user instruction, 2026-07-18.
**Confirmed by:** Codex directly; confirmation was not delegated.
**Effect:** These amendments resolve the LE-2 pre-stage STOP finding. Everything
else in this protocol remains unchanged.

### Amendment A — Authorized success routes

LE-2 may add RA-R2 route modes `planner_critic` and
`planner_critic_synthesizer`. Codex verified both required transitions against the
current locked registry before adopting the second route:

- Planner→Critic is allowed by `src/roles/roleContractRegistry.ts:80`.
- Critic→Synthesizer is allowed by `src/roles/roleContractRegistry.ts:104`.

Success-path fixtures MUST use one of these routes and MUST be human-authored,
mock-bound, side-effect-free, code-mutation-free, and within the RA-R2 cycle bound.
The original `planner_synthesizer` route remains a forbidden-transition rejection
fixture. Routes containing Analyst remain unknown-role rejection fixtures.

### Amendment B — Acceptance criteria rebalanced

The bridge MUST demonstrate both faces:

1. At least one complete successful derivation, repeated byte-identically, with
   correct sequence, `max_invocations`, IDs, lineage and mandatory Ledger record.
2. Every rejection code and inherited LE-1 validation refusal named by the original
   protocol.

The eight decision-envelope rules remain unchanged.

### Amendment C — Guarded-execution inheritance record

The LE-2 implementation document's "what the guarded-execution pass inherits"
section MUST state that Analyst registration and the `planner_synthesizer`
transition are open design questions deliberately not resolved by LE-2. Plans
requiring either remain unbridgeable until a dedicated registry pass argues them on
their merits.

### GOV-1 record and recurring Git hygiene candidate

GOV-1 synchronized the remote at `93316eb`, recorded protocol gaps without
backfilling them, passed AUD-2 across 19 paths, and ran `git fsck --full` after a
geometric-repack warning. Repack/multi-pack-index warnings have now recurred and are
parked as named future hygiene candidate **GIT-HYG-1**: investigate Windows
`.git` file locking/permissions before the warning becomes operationally material.

---

## Standing rules (restated)

Deviation from the envelope = STOP; the envelope is Pat's decision surface, not the implementer's. Preflight is absolute: no work on a dirty tree or stale remote. Snapshots verified on disk before recording. No fabricated references; no backfilled provenance — gaps are recorded as gaps. Canonical validation commands only, run to completion, exit codes reported. Credentials never ambient. Honest deviations mandatory. Locked surfaces (L1 seven, H5 traps/pins, M3 boundary, catalog 13/9, role/handoff registries) change only by visible protocol-governed diffs — and this pass changes none of them. The guarded execution seam is a separate future pass with its own protocol; nothing herein authorizes execution, providers, side effects, role/registry changes, or UI. After LE-2: STOP and report.

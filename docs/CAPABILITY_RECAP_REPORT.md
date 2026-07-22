# Caleb AI — Capability Recap Report

**As of:** 2026-07-22 (SEAL-D1)  
**Authoritative home:** `F:\Caleb AI`  
**Evidence commit:** `f52861a318db9b5d6d70b606a3b3f23fc7285cd3` (`LIVE-D1-A1`)  
**Event report:** `docs/LIVE_D1_A1_EVENT_REPORT.md`  
**Doctrine:** Models think. Hollows work. Caleb orchestrates.  
**Status source of truth:** `docs/STATUS_LOG.md` (not README)  
**Pass authorization:** `docs/protocols/` · live events: `docs/LIVE_EVENT_AUTHORIZATIONS.md`  

This is a capability map, not a pass completion report. It answers two questions:

1. What can Caleb do **now**, in production code, with evidence?
2. What is **left** — deliberately out of scope, not yet wired, or next-horizon?

---

## Executive snapshot

| Layer | Status |
| --- | --- |
| Hollow-first work (local deterministic) | **Operational** — V1 + media + Hollowcut catalogs |
| Trust / VRP / Ledger / snapshots | **Operational** |
| Static & bridged role rotation (mock) | **Operational** |
| Dynamic route selection (classifier `rax4.1.0`) | **Operational on mocks; live for row 1** |
| Live single-model calls (Anthropic, xAI) | **Done under explicit events; disabled by default** |
| Live **fixed** Planner→Critic rotation (E1/E2) | **Proven live** (with F-series repairs) |
| Live **classifier-selected** rotation (row 1) | **Proven live and sealed** (`LIVE-D1-A1` evidence + register + event report) |
| Live multi-role / Analyst-in-path | **Not live** — mocks only beyond planner/critic |
| Cloud, product UI, production auth | **Not implemented** (phase-bounded out) |

**Validation baseline:** 213 files / ~3,294 tests (docs-only SEAL-D1 expects unchanged); catalogs **V1 = 14**, **Hollowcut = 9**.

---

## Part I — What Caleb can do today

### 1. Hollow execution spine

| Capability | What it means in practice |
| --- | --- |
| **Hollow manifests + registry** | Permissions, schemas, V1-safety gates; no silent side-effect catalogs |
| **Hollow Runner** | Local deterministic execution; output always **T0 / unverified** |
| **Verified Return Path (VRP)** | Only trust promoter; clean deterministic results promote to **T2 at most** |
| **JSONL Ledger** | Append-only evidence trail; entry identity integrity (H4) |
| **Auto Snapshot + Change Guard** | Pre-mutation snapshots, risk classification, rollback tooling |
| **Report builder** | Markdown/JSON reports from invocations, VRP results, ledger entries |
| **AUD-2 pass compliance** | Git changeset vs pass manifest → hollow.audit.pass_compliance_check |

**CLI (explicit, no hidden workflows):**  
`list-hollows`, `inspect-hollow`, `run-hollow`, ledger/report flags opt-in.

---

### 2. Catalogs (what work units exist)

| Catalog | Count | Role |
| --- | --- | --- |
| **V1 (protected)** | **14** | Text/validation/provenance/code + audit compliance + **route classifier** (`hollow.routing.route_classifier`) |
| **Media** | separate | Read-only, provided-metadata only (dimensions, aspect, duration) — **no real media probing** |
| **Hollowcut** | **9** | Supplied-state project/timeline/export-readiness validation — **no export/render/ffmpeg** |

V1 includes text (character count, prompt limit, section balance, repetition), validation (JSON schema, placeholders), provenance (file hash, ledger provenance), code (line count, import/export surface, safety scan), audit (pass compliance), routing (classifier).

---

### 3. Logic Engine (routing without “the model owns the route”)

| Capability | Status |
| --- | --- |
| TaskFrame + SignalFrame classification | Operational (fixed path) |
| `selectRoute` / work-graph stubs | Operational for V0 / hollow_only / single_pass labels |
| **L1 route-input allowlist (8 kinds)** | Operational — raw model output cannot author routes |
| Eighth kind: `lineage_resolved_decision_facing_record` | Operational with **five-check verifier** (lineage, well-formedness, no tier assertion, **no route pre-commit**, capability satisfiability) |
| **Classifier table `rax4.1.0`** | Eight explicit rows; pure lookup; fail-closed off-table; frozen/versioned |
| LE-2 dynamic selection | Decision-record present → classifier; else fixed TaskFrame+SignalFrame (**additive**) |
| Single-source capabilities | `getRoleCapabilityCatalog()` from role contracts (no duplicate lists) |
| `route-decision` CLI | Dry-run diagnostic (TaskFrame/signals path) |

**Eight classifier routes (table law):**

| Features (stakes / ambiguity / evidence) | Route |
| --- | --- |
| low / bounded / none | planner → critic |
| low / bounded / required | planner → analyst → critic |
| low / ambiguous / none | planner → critic → synthesizer |
| low / ambiguous / required | planner → analyst → critic → synthesizer |
| high / bounded / none | planner → critic → synthesizer |
| high / bounded / required | full four-role |
| high / ambiguous / none | full four-role |
| high / ambiguous / required | full four-role |

---

### 4. Roles, handoffs, Analyst doctrine

| Capability | Status |
| --- | --- |
| Role artifact contracts + validators | Operational |
| Consumption matrix | **39** legal transitions (includes Analyst wiring) |
| Analyst role | Registered, request_only, four semantic payload types |
| **Request-only Hollow seam** | Analyst emits `hollow_evidence_request`; **orchestrator** runs Hollow; **VRP** gates before Analyst sees result; no T0 to Analyst |
| Handoff gate | Enforced mid-rotation; refusals ledgered |

---

### 5. Rotation runtime (mock and live)

| Capability | Status |
| --- | --- |
| RA-R1 static rotation (mock adapters) | Operational |
| LE-2 bridge (RuntimeRotationPlan → executable sequence) | Operational |
| LE-3 guarded execution seam | Operational — human confirm, ledger mandatory, mock or live-gated |
| Execution-keyed reconstruction from `ledger.jsonl` alone | Operational — roles, digests, lineage, failures (F8) |
| **Selection reconstruction** | Additive: `selection_path`, `table_version`, `role_sequence`, features (null if pre-D1) |
| PRE-7 full mock rotation dress | Proven |
| RA-X-5 all **eight** routes mock e2e + reconstruct | Proven |
| Live gate chain (LIVE-R1) | Operational — evidence, budgets, prompt digests, credentials |
| Live adapters | **Anthropic** + **xAI (Grok)** — digest-only records, model ceiling **T1**, default tests offline |
| Live fixed rotation E1/E2 | Proven under AUTH + host-shell discipline |
| **Live dynamic selection (row 1)** | **Proven + sealed** — LIVE-D1-PREP machinery + **LIVE-D1-A1** live evidence + register entry + event report |

**Live row-1 budgets (unchanged binding source = gate evidence):**  
Planner 1,536 · Critic 2,048 · run 8,192 tokens · $0.05 · 2 invocations.

**LIVE-D1-A1 (sealed):**  
Classifier-selected `planner_critic` (features low/bounded/none); both roles Anthropic Haiku completed; spend **$0.012709** under budget. Evidence `f52861a318db9b5d6d70b606a3b3f23fc7285cd3`. Production reconstruction returns `selection_path: "classifier"`, `table_version: "rax4.1.0"`, `role_sequence: ["planner","critic"]`. Full report: `docs/LIVE_D1_A1_EVENT_REPORT.md`.

---

### 6. Governance & build discipline (product capabilities)

These are operational, not documentation cosplay:

| Capability | Status |
| --- | --- |
| Phase boundaries (`02_V1_PHASE_BOUNDARIES.md`) | Enforced by process + locks |
| Pass protocols under `docs/protocols/` | Authorization record |
| AUTH-2 live-event register | Append-only event authorizations |
| AUTH-3 authorization echo at seat | Operating-contract requirement |
| Implementer seat record | Seat physics for multi-agent work |
| Snapshot claim integrity | Snapshot gate honesty |
| Network egress proof | Documented / locked for live claims |
| Detector doctrine (R37) | Known-violation proofs required |

---

### 7. What “done” looks like for a typical offline run

```text
CLI / test harness
  → allowlisted route inputs (L1)
  → optional: decision-facing + verifier + classifier (rax4.1.0)
  → bridge RuntimeRotationPlan (roles × cycles, matrix-legal)
  → execute at LE-3 (mock adapters)
  → VRP on Hollows; role artifacts T1 ceiling for model path
  → JSONL ledger
  → reconstructRotationChainFromLedgerJsonl (roles + digests + selection if present)
```

No provider credentials required for the above.

---

## Part II — What is left to implement

Grouped by horizon. **Not authorized** until Pat (T4) opens a pass/event.

### A. Immediate / near-term (live dynamic campaign follow-through)

| Gap | Notes |
| --- | --- |
| **AUTH-2 detector expansion for LIVE-D1 labels** | Optional — register holds LIVE-D1-A1; detector still keys `LIVE-R2-E*-A*` only |
| **Live routes beyond row 1** | Rows 2–8 need live prompts/budgets/gate evidence for Analyst/Synthesizer; gate evidence today **locks planner_critic only** |
| **Sequence→route_mode map expansion** | LIVE-D1-PREP map is only `["planner","critic"]` → `planner_critic`; longer live routes need closed mapping + authorization |
| **Live Analyst-in-path + request-only seam** | Mock-proven (RA-X-5 T3); not live |
| **Cross-family dynamic live** | E2 was fixed cross-family; dynamic multi-provider selection not a campaign yet |

### B. Product / platform (explicitly out of V1 runtime)

From phase boundaries and Hollowcut locks:

| Area | Status |
| --- | --- |
| Production auth / multi-tenant | Not built |
| Cloud deployment / always-on service | Not built |
| Complex UI / 3D Thinking Mode | Plan docs only |
| Hollowcut real export/render/FFmpeg | Boundary-locked **out** |
| Real media file probing | Boundary-locked **out** (metadata-only) |
| Large project-specific Hollow catalog (Suno, TropeKill, etc.) | V2 examples — not implemented |
| Unrestricted shell Hollows | Forbidden without approval architecture |

### C. Architecture depth still thin or stubbed

| Area | Honest state |
| --- | --- |
| WorkGraph beyond lite / single-hollow dispatch | Partial — not a full multi-step work OS |
| Role rotation with implementer/verifier/reporter production paths | Contracts exist; live path is planner/critic-centric |
| Multi-model fallback / cost routing product layer | Adapters exist; no automatic fallback product |
| Final assembly / final-output ledger product UX | Contracts and locks exist; not a polished “ship a answer” product |
| Investor / operator dashboard over ledger | Not built — ledger is the truth surface |

### D. Hardening that remains forever-green work

| Area | Notes |
| --- | --- |
| More failure taxonomies under live load | F1–F9 covered major classes; production will invent new ones |
| Broader non-promoter / trust proofs | Doctrine held; keep detectors as table/routes grow |
| Continuous egress / credential hygiene | Runbook + ambient traps exist; operational diligence remains |

---

## Part III — Capability vs claim matrix (investor-honest)

| Claim you can make | Evidence class |
| --- | --- |
| Local Hollow work is deterministic and ledgered | Suite + V1 catalog + VRP |
| Models cannot silently become route authority | L1 + decision-facing verifier |
| System can choose a rotation from closed features | Classifier + RA-X-5 + LIVE-D1 |
| That choice is reconstructable from ledger | `route_classification_decision` + reconstruct API |
| Live models run only under human confirm + budgets + digests | LIVE-R1 gate + E1/E2 + D1 evidence |
| Analyst cannot grab ungated Hollow output | Request-only seam detectors |
| We do **not** yet run full dynamic multi-role **live** | Gate + prompts only for planner/critic |

---

## Part IV — Recommended next choices (for Pat)

Not a pass authorization — options ranked by leverage:

1. **Investor write-up** — sealed LIVE-D1 ledger story (“system decided”) + this recap.  
2. **LIVE-D2** — first live Analyst-bearing or longer route (prompts, budgets, gate-evidence expansion).  
3. **Product surface** — thin operator CLI/report: last rotation selection + digests.  
4. **Stay offline** — expand Hollow catalogs for real projects under V2 rules.

---

## Appendix — Key entry points (code)

| Concern | Location |
| --- | --- |
| V1 catalog | `src/hollows/v1HollowCatalog.ts` |
| VRP | `src/verification/verifiedReturnPath.ts` |
| L1 + classifier selection | `src/logicEngine/routeInputGate.ts` |
| Table `rax4.1.0` | `src/logicEngine/routeClassificationTable.ts` |
| Decision-facing verifier | `src/logicEngine/lineageResolvedDecisionFacingVerifier.ts` |
| Analyst Hollow seam | `src/logicEngine/analystHollowEvidenceRequestSeam.ts` |
| Live dynamic seam | `src/logicEngine/liveDynamicSelectionSeam.ts` |
| Live CLI | `src/cli/commandHandlers.ts` → `handleExecuteLiveRotationCommand` |
| Execute / reconstruct | `src/logicEngine/rotationExecutionSeam.ts` |
| Event-d1 fixture | `examples/live-rotation/event-d1.dynamic.fixture.json` |
| Live D1 prep report | `docs/LIVE_D1_PREP_REPORT.md` |
| Live D1-A1 event report | `docs/LIVE_D1_A1_EVENT_REPORT.md` |
| Live-event register | `docs/LIVE_EVENT_AUTHORIZATIONS.md` |
| Status log | `docs/STATUS_LOG.md` |

---

## Verdict line

**Caleb today is a Hollow-first, ledger-first orchestration kernel that can classify work, choose a rotation from a frozen table, execute it under mocks for all eight routes, and has completed a sealed live classifier-selected Planner→Critic rotation (LIVE-D1-A1) under Pat’s authorization — with reconstructable selection provenance.**  

What remains is mostly **breadth** (more live roles, product UX, cloud) and **discipline** (every new live shape gets AUTH + detectors), not a missing core idea.

---

*End of capability recap. Append updates via STATUS_LOG + new pass reports; do not grow this file into a second status log without a deliberate rewrite pass.*

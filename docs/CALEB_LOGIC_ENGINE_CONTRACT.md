# CALEB LOGIC ENGINE CONTRACT

**Document Type:** Architecture Doctrine Contract / Source-of-Truth  
**Project:** Caleb AI  
**Applies To:** Orchestration Core (future), Role Router (future), Role Rotation (future V3+), Thinking Mode telemetry (future), Work Graph execution, all routing / dispatch / handoff / loop decisions  
**Status:** Authoritative contract for the deterministic decision layer. Implementation is future and gated.  
**Source Authority:** Explicit user query (full "GROK — CALEB AI LOGIC ENGINE DOCTRINE + CONTRACT SOURCE INTEGRATION PASS" block), docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md, AGENTS.md, CODEX.md, CALEB_AI_EXECUTION_BATTLEPLAN.md, Caleb AI Role Rotation PDFs and Architecture materials, CALEB_AI_3D_UI_THINKING_MODE_PLAN.md, AUTO_SNAPSHOT_AND_CHANGE_GUARD.md, Hollowcut boundary/plan documents, and the established Caleb AI doctrine.

---

## Doctrine Reminder

**Models think. Hollows work. Caleb orchestrates.**

The Verified Return Path decides what becomes trusted. The Ledger remembers. Every change begins from a recoverable snapshot.

The Logic Engine exists to make the "orchestrates" part deterministic, observable, policy-enforced, and testable — separate from model reasoning and from Hollow labor.

---

## 1. Core Definition

The Logic Engine is the deterministic decision layer inside the Orchestration Core.

It is Caleb’s state controller / nervous system.

It does not think like a model. It does not perform creative reasoning, judgment, or synthesis. It routes, scores, gates, records, limits, and decides legal state transitions.

It is state-smart, not model-smart.

The Logic Engine owns the rules, the current execution state, the legality of transitions, the construction and validation of work plans, the approval of role handoffs and Hollow dispatches, loop control, stop criteria, and the emission of telemetry events that describe what the system is doing.

It is the part of Caleb that knows "what is allowed right now, what must happen next, and whether we are still inside policy."

Raw model output and raw Hollow output both enter the Logic Engine as untrusted (T0) until gates are satisfied.

---

## 2. Ownership Boundaries

### The Logic Engine owns:

- Task normalization
- Signal classification
- Route selection
- Capability resolution
- Work graph construction
- Role transition legality
- Role handoff gates
- Hollow dispatch approval
- Loop control
- Stop criteria
- Policy gate insertion
- Snapshot gate insertion
- Final assembly gating
- Trust-aware state movement
- Telemetry event emission

### The Logic Engine does not own:

- Model reasoning (Models think)
- Deterministic Hollow labor (Hollows work)
- Verified Return Path trust promotion (VRP decides)
- Ledger storage (Ledger remembers)
- UI visualization (UI visualizes)
- Raw model chain-of-thought
- Arbitrary file execution
- Export/render/FFmpeg/media mutation
- Unapproved side effects

The Logic Engine may *require* a snapshot gate or a human-approval gate, but it does not perform the snapshot or the side effect itself. It inserts the gate into the Work Graph and waits for the gate to clear.

---

## 3. Core Modules

The Logic Engine is composed of (or will be composed of) these 12 proposed modules. All are deterministic and policy-driven.

1. **Task Intake Normalizer** — Accepts raw task input and produces a canonical TaskFrame.
2. **Signal Classifier** — Analyzes the TaskFrame and produces a SignalFrame with scored signals.
3. **Route Selector** — Consumes the SignalFrame and selects a RouteDecision (including route mode and initial Work Graph skeleton).
4. **Capability Resolver** — Determines which Hollows, roles, or external capabilities are available and permitted for the current route.
5. **Work Graph Builder** — Constructs the executable Work Graph (nodes, edges, gates, required artifacts).
6. **Artifact Store / State Store** — Decouples role outputs into validated, versioned artifacts and stores them for later recoupling into role-specific context packs.
7. **Context Packager** — Builds the minimal, role-appropriate context for the next role or Hollow from stored artifacts (never raw previous voice).
8. **Role Handoff Gate** — Enforces the full handoff contract before a role output may become input to the next role or to final assembly.
9. **Hollow Dispatcher** — Approves and records Hollow invocations; only after policy, snapshot, and capability gates are satisfied.
10. **Trust Engine** — Tracks trust tier movement for artifacts, invocations, and the overall run; interacts with (but does not replace) the Verified Return Path for Hollow evidence.
11. **Loop Controller** — Enforces cycle limits, material-defect triggers, contradiction thresholds, and stop criteria.
12. **Ledger and Telemetry Emitter** — Emits structured, ledgerable events for every meaningful state transition and decision. These events are the source of truth for Thinking Mode visualization.

Each module must be independently testable with deterministic fixtures.

---

## 4. Deterministic State Machine

The Logic Engine drives execution through a finite, observable set of states. Every transition must be:

- Policy-allowed (current SignalFrame / route / trust state permits it)
- Ledgerable (an event is emitted and recorded)
- Testable (there exists a test that exercises the transition and its guards)

### Defined future states:

- IDLE
- TASK_RECEIVED
- TASK_NORMALIZED
- SIGNALS_CLASSIFIED
- ROUTE_SELECTED
- WORK_GRAPH_CREATED
- PRECHECKS_RUNNING
- HOLLOW_CHAIN_RUNNING
- ROLE_PASS_RUNNING
- HANDOFF_GATE_RUNNING
- VERIFICATION_RUNNING
- CRITIC_REVIEW_RUNNING
- LOOPBACK_RUNNING
- FINAL_ASSEMBLY_RUNNING
- FINAL_VERIFICATION_RUNNING
- COMPLETED
- FAILED
- BLOCKED
- ROLLED_BACK

A run may move forward, loop back (under strict limits), block, or roll back. It never silently skips states.

---

## 5. Route Modes

Initial future route modes (chosen by Route Selector based on SignalFrame):

- `hollow_only` — Pure deterministic work. No model passes.
- `single_pass` — One model pass (or Planner + Synthesizer) plus Hollow verification where applicable.
- `plan_synth` — Planner decomposes → Synthesizer assembles (with Hollow support).
- `plan_analyze_synth` — Planner → Analyst (evidence interpretation) → Synthesizer.
- `full_rotation` — Full Planner → Analyst → Critic → Synthesizer when stakes, ambiguity, contradiction, or audit need justify it.
- `recovery_guardrail` — Special route used after failure, contradiction, or policy violation to re-establish safe state.

Future MVP-only (documentation / stub phase):

- `full_rotation_stub` — Proves the routing decision and artifact handoff shell without actual multi-model execution or real role implementations.

Route mode is part of the RouteDecision and is recorded in the Work Graph and Ledger.

---

## 6. Routing Doctrine

These rules are deterministic policy (future defaults, adjustable via policy configuration but never by raw model suggestion):

- Pure deterministic tasks (character counts, schema checks, math, validation, reference integrity, etc.) go to Hollow-only.
- Low ambiguity / low stakes tasks go single-pass plus Hollow verification where evidence is available.
- Decomposition tasks (large or multi-part objectives) go Planner → Synthesizer (plan_synth or plan_analyze_synth).
- Evidence interpretation tasks (reconciling Hollow output with model claims, ranking options, filling gaps) go Planner → Analyst → Synthesizer.
- High stakes, contradiction, prior failure, or high audit need triggers full Planner → Analyst → Critic → Synthesizer.
- Code mutation, workspace mutation, or any side-effecting action requires a snapshot gate before the action node may execute.
- Side effects (network, shell, external systems, destructive writes) require explicit policy/human approval gates in addition to snapshot.
- Raw model suggestions never directly trigger unsafe action. The Logic Engine must approve via a RouteDecision or Handoff Gate.

The model may *propose* a route or role set. The Logic Engine *decides*.

---

## 7. Signal Scoring

The Signal Classifier produces a SignalFrame. The following fields are defined (future policy defaults use simple 0/1/2 scoring; thresholds are not fixed law and may be tuned with justification and tests):

- `deterministic_only` (0/1)
- `requires_judgment` (0/1/2)
- `ambiguity` (0/1/2)
- `stakes` (0/1/2)
- `evidence_complexity` (0/1/2)
- `contradiction_risk` (0/1/2)
- `branch_factor` (0/1/2)
- `multimodal_coupling` (0/1/2)
- `side_effect_risk` (0/1/2)
- `audit_need` (0/1/2)
- `prior_failure` (0/1)
- `cost_sensitivity` (0/1/2)
- `deadline_pressure` (0/1/2)

The Route Selector combines these (plus task type) into a RouteDecision. Scoring is recorded so that later critique or audit can replay why a particular route or cycle count was chosen.

---

## 8. Work Graph Contract

A Work Graph is a structured execution plan, not prose.

It is a directed graph of typed nodes with explicit dependencies, required input artifacts, produced output artifacts, gates, and stop criteria.

### Defined Work Graph node types (future):

- TASK_INTAKE
- SIGNAL_CLASSIFICATION
- ROUTE_DECISION
- HOLLOW_CALL
- ROLE_PASS (Planner, Analyst, Critic, Synthesizer, or future roles)
- GATE_CHECK (policy, snapshot, human approval, schema, trust, etc.)
- SNAPSHOT
- LEDGER_WRITE
- HUMAN_APPROVAL
- FINAL_ASSEMBLY
- RECOVERY

Every node declares:
- required prior artifacts / states
- produced artifacts
- gates that must clear before execution
- the module or Hollow/role responsible

The Work Graph is the single source of truth for what the run is allowed to do next. It is versioned, ledgered, and visualizable.

---

## 9. Role Artifact Baton (Decouple / Store / Recouple)

Role output must never flow directly as free text into the next role's prompt or context.

Principle: **Decouple / Store / Recouple**

1. Role produces structured output.
2. Output is validated against the universal role artifact shell (see below).
3. Validated artifact is stored (Artifact Store / State Store) with identity, trust_state, and ledger_ref.
4. Next role (or final assembly) receives a role-specific *context pack* built only from stored, approved artifacts plus the minimal task framing.

Raw previous role voice must not become the next role’s context.

### Universal role artifact shell (required fields):

- `artifact_id`
- `artifact_type`
- `schema_version`
- `task_id`
- `run_id`
- `role_id`
- `role_version`
- `input_refs` (array of prior artifact_ids)
- `claims` (what this role asserts)
- `evidence_refs` (what supports the claims; must be separate from claims)
- `assumptions`
- `constraints`
- `contradictions` (explicitly registered)
- `defects` (material or non-material)
- `open_questions`
- `recommended_next_step`
- `trust_state` (T0/T1/etc. at time of creation)
- `ledger_ref`

All roles must emit artifacts that conform to this shell (or a versioned extension). The Role Handoff Gate enforces this.

---

## 10. Role Handoff Gate

Before any role output may be consumed by another role, final assembly, or a dependent Hollow dispatch, the Role Handoff Gate must pass.

### Required checks:

- Schema valid (conforms to role artifact shell for the role_version)
- Required fields present
- Claims separated from evidence (no conflation)
- Assumptions listed
- Unsupported claims marked unverified
- Contradictions registered (not hidden)
- Defects registered (material defects block forward progress)
- Role stayed inside its declared scope
- Next role (or final assembly) is allowed to consume an artifact of this type from this role
- Event recorded in Ledger / Telemetry

Raw role output starts T0.

Schema-valid role artifact may become T1.

Evidence-supported role artifact may become usable only through orchestration acceptance (handoff gate + route policy + trust rules).

Role artifacts do not bypass the Verified Return Path for Hollow evidence. Hollow results still require VRP promotion to T2 before they may be treated as trusted evidence inside a role artifact or Work Graph node.

---

## 11. Loop Control

Loop control is strict and recorded.

- One cycle is the default.
- A second cycle is permitted only for material Critic defect or failed required validation.
- A third cycle is permitted only for high-stakes unresolved contradiction.
- More than three cycles requires human approval gate.

### Stop criteria (all must be considered; the Logic Engine decides based on policy):

- Required evidence gathered (Hollows + roles)
- Hollow validations passed (via VRP where applicable)
- No blocking defects
- Contradictions resolved or formally waived (with ledgered rationale)
- Final schema valid
- Budget (cost, time, token) not exceeded
- Cycle cap not exceeded
- Synthesizer output ready and accepted by final assembly gate

The Loop Controller inserts LOOPBACK_RUNNING nodes only when criteria are met and records the justification.

---

## 12. Thinking Mode Telemetry Connection

The Logic Engine is the source of observable reasoning events.

The 3D UI (future) is a visualization surface only. It must not invent events.

### Defined emitted event categories (future):

- TASK_CLASSIFIED
- ROUTE_SELECTED
- WORK_GRAPH_CREATED
- ROLE_STARTED
- ROLE_COMPLETED
- ROLE_HANDOFF_VALIDATED
- HOLLOW_DISPATCH_APPROVED
- HOLLOW_INVOKED
- HOLLOW_VERIFIED
- TRUST_TIER_ASSIGNED
- CRITIC_DEFECT_FOUND
- LOOPBACK_REQUESTED
- SNAPSHOT_REQUIRED
- SNAPSHOT_CREATED
- FINAL_OUTPUT_RELEASED

Each event must carry sufficient context (task_id, run_id, node_id, role_id or hollow_id, trust_state, ledger_ref, timestamp) to allow replay, audit, and visualization.

The UI renders the engine. The engine does not depend on the UI.

---

## 13. MVP Implementation Boundary

The first authorized implementation of Logic Engine concepts is documentation and contract only (this pass and immediate follow-ups).

Permitted in early MVP (future authorized pass, still no runtime Role Rotation or Model API Layer):

- TaskFrame definition and normalization
- SignalFrame definition and classification
- RouteDecision (including route modes, especially full_rotation_stub)
- WorkGraph (nodes, edges, gates)
- Simple route selection logic (deterministic, fixture-driven)
- Artifact shell + basic decouple/store/recouple demonstration (in-memory or local store)
- Ledger event emission for the above
- Role Handoff Gate skeleton (validation only, no real roles)
- Telemetry event emission for the above

Explicitly:

The first implementation should prove deterministic routing and artifact handoff shell before real Role Rotation or model APIs are connected.

No multi-model execution, no Planner/Analyst/Critic/Synthesizer runtime, no real loopback execution, and no UI rendering of these events until the contract, frames, and basic graph are proven in isolation.

---

## 14. Explicitly Forbidden in This Pass

This pass is documentation-only architecture contract integration.

Forbidden:

- Runtime Logic Engine implementation (no orchestrationCore.ts, no modules, no state machine executor)
- Role Rotation execution (no Planner, Analyst, Critic, Synthesizer code or dispatch)
- Multi-model APIs or Model API Layer work
- UI implementation (including 3D Thinking Mode visualization)
- New Hollows
- New CLI commands
- Export/render/media/FFmpeg behavior or changes
- Any modification to the protected V1 catalog (currently exactly 13 after AUD-1)
- Any modification to Hollowcut catalog count (must remain exactly 9)
- Changes to existing Hollow behavior, preview/export behavior, or trust gates
- Placeholders, stubs, or TODOs presented as complete

All future work that touches Logic Engine, routing, role handoff, or Work Graphs must begin from a fresh snapshot, pass baseline green, and obey this contract plus the V1 phase boundaries and Hollowcut boundary locks.

---

## Related Documents

- CALEB_AI_EXECUTION_BATTLEPLAN.md (source for Orchestration Core, conditional Role Rotation, Hollow vs. model separation)
- Caleb AI Role Rotation in a Multi-Model Hollow Server Architecture.pdf and related role materials (role logic, trigger policy, work graph concepts, artifact thinking)
- CALEB_AI_3D_UI_THINKING_MODE_PLAN.md (telemetry surface principle)
- docs/00_SOURCE_INDEX_AND_AUTHORITY.md, docs/01_CODEX_OPERATING_CONTRACT.md, docs/02_V1_PHASE_BOUNDARIES.md
- Hollowcut boundary and export runtime plan documents (for interaction patterns with future orchestration)
- AUTO_SNAPSHOT_AND_CHANGE_GUARD.md (snapshot gates)

This contract is the authoritative definition for the Logic Engine. Later implementation must conform or explicitly amend this contract via a new authorized pass.

**End of contract document.** (Doctrine and boundary only; no runtime implied or created in this pass.)

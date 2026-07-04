# CALEB AI 3D UI AND THINKING MODE PLAN

**Document Type:** Product / UI Architecture / Implementation Planning Manual  
**Project:** Caleb AI  
**Applies To:** Future Caleb AI user interface, 3D visualization layer, telemetry viewer, role-rotation display, Hollow activity display, Ledger viewer, rollback/snapshot display  
**Recommended UI Stack:** React + TypeScript + Three.js / React Three Fiber  
**Core Status:** Planning document for later implementation  

---

## 0. North Star

The Caleb AI interface should not look like a normal chatbot with a decorative background.

It should feel like a command system with a visible engine.

The 3D UI exists so the user can see the observable reasoning process of Caleb AI: routing, role selection, Hollow execution, verification gates, critique loops, provenance writes, snapshots, rollback readiness, and final synthesis.

The operating rule is:

> **The 3D UI is not the engine. It is the gauge cluster, inspection window, and camera port attached to the engine.**

Expanded principle:

> **The engine runs Caleb. The interface visualizes Caleb. Every meaningful visual movement should correspond to a real engine event.**

This makes the interface honest, useful, and visually distinct. The user does not merely watch a typing cursor. The user watches Caleb route, verify, criticize, preserve, and assemble the work.

---

## 1. What This UI Is

The Caleb AI 3D UI is a **visual telemetry surface** connected to the underlying Orchestration Engine.

It displays:

- Task intake state
- Complexity level
- Routing mode
- Active reasoning role
- Role rotation sequence
- Hollow invocations
- Communication Bus traffic
- Verified Return Path status
- Trust tier assignment
- Ledger writes
- Snapshot creation
- Rollback availability
- Policy blocks
- Critic loopbacks
- Final synthesis and release state

The interface should let the user understand what Caleb is doing without pretending to expose private hidden thought text.

Correct framing:

```text
Caleb is planning.
Caleb is running deterministic checks.
Caleb is verifying Hollow output.
Caleb is entering Critic review.
Caleb found a defect and is looping back.
Caleb has written the result to the Ledger.
Caleb has a rollback-safe snapshot available.
```

Incorrect framing:

```text
Display raw private chain-of-thought.
Invent fake reasoning animations that are not connected to real events.
Let decorative motion imply work that did not happen.
Use the 3D UI as the source of truth.
```

---

## 2. What This UI Is Not

The 3D UI is not:

- The Orchestration Core
- The Hollow Server
- The Model API Layer
- The Ledger
- The Verified Return Path
- The reasoning source of truth
- A replacement for logs, traces, tests, or snapshots
- A place where raw model internals should be exposed
- A decorative screensaver pretending to reason

The UI should never become responsible for deciding whether evidence is trusted, whether a Hollow succeeded, whether a role pass is valid, or whether rollback is possible.

Those decisions belong to the engine.

The UI renders the state of those decisions.

---

## 3. Core Product Metaphor

The best metaphor is:

> **Caleb Thinking Mode is a camera port into the engine.**

The engine is made of:

- Orchestration Core
- Role Router
- Model API Layer
- Hollow Server Layer
- Communication Bus
- Verified Return Path
- Ledger
- Snapshot and Change Guard
- Final Assembly

The UI is the live instrument panel connected to those systems.

In vehicle terms:

| Engine Reality | UI Equivalent |
|---|---|
| Orchestration Core routes task | Central command core lights and dispatches packets |
| Role Router selects mode | Complexity ring changes intensity |
| Planner starts | Planner node rotates forward and activates |
| Hollow invoked | Worker node pulses and receives packet |
| Verification passes | Gate turns trusted/green and emits evidence packet |
| Critic finds issue | Warning pulse, loopback arc, defect panel |
| Ledger writes event | Ledger column stamps new record |
| Snapshot created | Recovery ring locks in a checkpoint |
| Final answer ready | Synthesizer emits final artifact through release gate |

---

## 4. Non-Negotiable UI Rules

### Rule 1 — Instrumented, Not Decorative

Every meaningful animation must be backed by a real state event.

Allowed:

```text
ROLE_STARTED -> Role node activates.
HOLLOW_VERIFIED -> Hollow output packet passes through the gate.
LEDGER_ENTRY_WRITTEN -> Ledger stack receives a new record.
CRITIC_DEFECT_FOUND -> Critic node emits a warning and loopback route.
```

Not allowed:

```text
Random spinning implying role rotation when no role rotation occurred.
Fake progress bars not tied to execution state.
Green trust glow without Verified Return Path success.
Ledger animation without an actual ledger event.
```

### Rule 2 — Observable Reasoning, Not Hidden Chain-of-Thought

The UI may show reasoning state, routing decisions, role names, evidence summaries, verified results, confidence labels, and defect classes.

The UI must not expose or fabricate raw private chain-of-thought.

Recommended label:

```text
Observable Reasoning Trace
```

Avoid label:

```text
Raw Thoughts
```

### Rule 3 — Engine Is Source of Truth

The UI consumes events. It does not invent them.

The engine owns:

- Routing decisions
- Role transitions
- Hollow results
- Verification state
- Trust tier
- Ledger entries
- Snapshot validity
- Rollback status
- Final output permission

The UI owns:

- Rendering
- Camera movement
- Interaction panels
- Replay controls
- Filtering
- Visual accessibility
- Layout and presentation

### Rule 4 — 2D Inspector Must Always Exist

The 3D view is powerful, but it should be paired with a precise 2D inspector panel.

The 2D inspector should show exact state:

- Current mode
- Active role
- Active Hollows
- Evidence packets
- Trust tiers
- Warnings
- Errors
- Ledger refs
- Snapshot IDs
- Rollback availability
- Runtime duration
- Cost estimate if available

The 3D layer explains visually. The 2D panel confirms precisely.

### Rule 5 — Low-Power and Accessibility Fallbacks Are Required

The interface must support:

- Reduced motion mode
- 2D-only mode
- Static trace timeline
- Keyboard navigation
- Screen reader labels
- Color-blind-safe state indicators
- Performance scaling for weaker devices

The UI should be impressive, but it must not become unusable.

---

## 5. Thinking Mode Levels

Caleb should visualize complexity through distinct operating modes.

### Level 0 — Idle

State:

```text
No active task.
```

Visual:

- Slow breathing central core
- Dim role ring
- Hollow layer inactive
- Ledger idle

Purpose:

- Communicate readiness without implying work.

---

### Level 1 — Hollow Only

State:

```text
Task is deterministic and bounded.
No model reasoning needed beyond routing, or model use is bypassed entirely.
```

Visual:

- Central Orchestration Core sends packet directly to Hollow Server layer
- One or more Hollow nodes activate
- Verified Return Path gate checks results
- Ledger stamps record
- Final output returns quickly

Example:

```text
Count characters.
Validate JSON.
Check prompt length.
Calculate duration mismatch.
```

---

### Level 2 — Single Model + Hollow Verification

State:

```text
Simple task requires some judgment, but not role rotation.
```

Visual:

- One model node activates
- Hollows run deterministic checks
- Evidence returns through Verified Return Path
- Model node synthesizes final response

Example:

```text
Revise lyrics under a character limit.
Summarize a code guardrail report.
Explain a deterministic Hollow result.
```

---

### Level 3 — Planner + Synthesizer

State:

```text
Task needs decomposition and final assembly but limited evidence interpretation.
```

Visual:

- Planner node rotates forward
- Planner sends subtask packets
- Hollows execute checks
- Synthesizer node activates for final packaging

Example:

```text
Create a small implementation plan.
Package a simple protocol.
Generate a concise report from verified checks.
```

---

### Level 4 — Planner + Analyst + Synthesizer

State:

```text
Task has multiple evidence sources that need interpretation, comparison, or normalization.
```

Visual:

- Planner defines work graph
- Hollows gather evidence
- Analyst node receives evidence bundles and ranks findings
- Synthesizer assembles final output

Example:

```text
Compare vendor quotes.
Analyze app test results.
Align video duration, audio duration, and export profile.
```

---

### Level 5 — Full Role Rotation

State:

```text
Task is complex, ambiguous, high-stakes, contradiction-prone, or has prior failure.
```

Visual:

- Planner, Analyst, Critic, and Synthesizer form a rotating role chamber
- Active role moves forward and brightens
- Evidence packets flow from Hollows to Analyst
- Critic receives candidate answer and evidence bundle
- If Critic finds a material defect, a loopback arc returns to Planner or Analyst
- Synthesizer activates only after stop criteria are satisfied

Example:

```text
Major architecture planning.
Production code change strategy.
Security-sensitive workflow.
Complex research or stakeholder report.
```

---

### Level 6 — Recovery / Guardrail Mode

State:

```text
A failure, warning, rejected output, policy block, schema mismatch, test failure, or rollback event occurred.
```

Visual:

- Amber or red warning layer appears
- Snapshot ring displays last known-good checkpoint
- Rollback path is shown
- Quarantined component is isolated visually
- Ledger records the failure event

Example:

```text
Schema validation failed.
Hollow output was rejected.
Critic found blocking defect.
Tests failed after change.
Auto Snapshot system created rollback point.
```

---

## 6. Core 3D Scene Model

The first full interface can be designed as a layered 3D environment.

### 6.1 Central Orchestration Core

Purpose:

- Represents task intake, routing, and command authority.

Visual options:

- Central orb
- Command tower
- Engine core
- Geometric processor
- Caleb crest / command mark

Behavior:

- Pulses on task start
- Emits packets to Role Router, Model Layer, or Hollow Layer
- Changes intensity based on complexity
- Shows blocked state if policy prevents execution

---

### 6.2 Role Rotation Ring

Purpose:

- Shows the adaptive reasoning layer.

Nodes:

- Planner
- Analyst
- Critic
- Synthesizer

Behavior:

- Ring rotates only when role rotation is active
- Active role moves forward or enlarges
- Completed role leaves trace marker
- Critic loopback creates visible return arc
- Synthesizer releases output only after accepted evidence is ready

Role color language may be configurable, but initial meaning should be consistent:

| Role | Suggested Visual Identity |
|---|---|
| Planner | Structured grid, blueprint lines, cool blue |
| Analyst | Evidence streams, comparison panels, violet/indigo |
| Critic | Sharp inspection beam, amber warning edge |
| Synthesizer | Converging streams, final artifact glow |

Use color as support, not the only indicator.

---

### 6.3 Hollow Server Layer

Purpose:

- Shows deterministic local workers.

Visual options:

- Lower mechanical layer
- Worker cubes
- Server cores
- Tool nodes
- Deterministic grid

Behavior:

- Specific Hollow node activates when invoked
- Node pulses while running
- Node returns structured result packet
- Strict deterministic Hollows have clean mechanical motion
- Heuristic/rule-based Hollows have a softer or bounded indicator
- Failed Hollow is marked amber/red and connected to failure reason

Example Hollow groups:

- Text Hollows
- Code Hollows
- Media Hollows
- Validation Hollows
- Provenance Hollows
- Project Hollows

---

### 6.4 Communication Bus

Purpose:

- Shows structured message flow.

Visual options:

- Packet trails
- Fiber paths
- Light streams
- Message rails

Behavior:

- Packets move from Orchestration Core to target components
- Packet shape or icon indicates message type
- Failed packets stop at gate or return with error
- High traffic produces more packet density, not random chaos

Packet categories:

| Packet Type | Visual Meaning |
|---|---|
| Task packet | User intent entering system |
| Role packet | Role pass request or result |
| Hollow packet | Deterministic invocation |
| Evidence packet | Verified result ready for reasoning |
| Warning packet | Defect, risk, or partial trust |
| Ledger packet | Provenance write |
| Snapshot packet | Recovery point created |

---

### 6.5 Verified Return Path Gate

Purpose:

- Makes trust visible.

Behavior:

- Raw Hollow output approaches gate
- Gate checks schema, policy, errors, provenance, trust tier
- Valid evidence passes through and becomes trusted packet
- Invalid output is rejected or quarantined

Visual trust states:

| State | Meaning |
|---|---|
| Gray | Not yet evaluated |
| Blue/Teal | Running validation |
| Green | Verified and accepted |
| Amber | Warning / partial trust / non-blocking defect |
| Red | Rejected / blocked / quarantined |

Trust tiers should be visible in the inspector:

```text
T0 Raw untrusted
T1 Schema-valid but not fully verified
T2 Verified deterministic Hollow output
T3 Verified with provenance and policy clearance
T4 Human-approved or externally authoritative with full provenance
```

---

### 6.6 Ledger Stack

Purpose:

- Shows provenance being preserved.

Visual options:

- Vertical archive column
- Rotating record cylinder
- Block stack
- Timeline rail
- Immutable ledger plates

Behavior:

- Every meaningful event creates a ledger animation
- Ledger item contains a short readable label
- Selecting item opens exact 2D details
- Ledger can replay prior trace

Ledger event examples:

```text
Task started
Route selected
Role started
Hollow invoked
Hollow verified
Evidence accepted
Critic defect found
Snapshot created
Rollback available
Final output released
```

---

### 6.7 Snapshot / Rollback Ring

Purpose:

- Shows implementation safety state.

This connects to the Auto Snapshot and Change Guard.

Behavior:

- Before mutation, snapshot ring creates a checkpoint marker
- Successful validation promotes post-change snapshot
- Broken state triggers emergency snapshot
- Rollback path becomes visible when failure occurs

Visual states:

| State | Meaning |
|---|---|
| Locked checkpoint | Known-good snapshot exists |
| Amber checkpoint | Emergency/broken-state snapshot exists |
| Red rollback path | Rollback recommended or required |
| Green promoted checkpoint | New known-good state after validation |

---

## 7. Event-Driven Architecture

The UI should consume structured engine events.

The engine emits events. The UI subscribes and renders.

Recommended flow:

```text
Caleb Engine
  -> Event Emitter / Trace Stream
  -> UI State Store
  -> 3D Scene Renderer
  -> 2D Inspector Panel
  -> Replay Timeline
```

The UI should work from the same event stream that powers logs, traces, and Ledger summaries.

---

## 8. Minimum Event Schema

Every UI-visible event should share a common envelope.

```json
{
  "event_id": "evt_001",
  "schema_version": "1.0.0",
  "timestamp": "ISO_TIMESTAMP",
  "trace_id": "trace_001",
  "run_id": "run_001",
  "task_id": "task_001",
  "parent_event_id": null,
  "event_type": "ROLE_STARTED",
  "source": "orchestration_core",
  "target": "planner",
  "severity": "info",
  "status": "started",
  "payload": {},
  "ledger_ref": null,
  "display": {
    "title": "Planner started",
    "summary": "Planner is decomposing the task and selecting required evidence.",
    "visibility": "user_visible",
    "animation_hint": "activate_role_node"
  }
}
```

Rules:

- Events must be schema-validated before the UI consumes them.
- Events should not contain raw private chain-of-thought.
- Events should contain user-safe summaries.
- Events should connect to Ledger refs when applicable.
- Event replay should reconstruct the visual timeline.

---

## 9. Core Event Types

### Task Events

```text
TASK_RECEIVED
TASK_STARTED
TASK_CLASSIFIED
TASK_COMPLEXITY_SCORED
TASK_MODE_SELECTED
TASK_COMPLETED
TASK_FAILED
TASK_CANCELLED
```

### Routing Events

```text
ROUTE_SELECTED
DIRECT_PATH_SELECTED
HOLLOW_ONLY_SELECTED
SINGLE_PASS_SELECTED
PLAN_SYNTH_SELECTED
PLAN_ANALYZE_SYNTH_SELECTED
FULL_ROTATION_SELECTED
RECOVERY_MODE_SELECTED
```

### Role Events

```text
ROLE_ASSIGNED
ROLE_STARTED
ROLE_COMPLETED
ROLE_FAILED
ROLE_RETRIED
ROLE_LOOPBACK_REQUESTED
ROLE_OUTPUT_ACCEPTED
ROLE_OUTPUT_REJECTED
```

### Hollow Events

```text
HOLLOW_SELECTED
HOLLOW_INVOKED
HOLLOW_RUNNING
HOLLOW_COMPLETED
HOLLOW_FAILED
HOLLOW_TIMEOUT
HOLLOW_OUTPUT_RECEIVED
HOLLOW_OUTPUT_REJECTED
HOLLOW_QUARANTINED
```

### Verification Events

```text
VERIFY_STARTED
INPUT_SCHEMA_VALIDATED
OUTPUT_SCHEMA_VALIDATED
POLICY_CHECK_PASSED
POLICY_CHECK_FAILED
PROVENANCE_STAMPED
TRUST_TIER_ASSIGNED
EVIDENCE_PACKET_CREATED
EVIDENCE_ACCEPTED
EVIDENCE_REJECTED
```

### Critic / Defect Events

```text
CRITIC_REVIEW_STARTED
CRITIC_DEFECT_FOUND
CRITIC_CONTRADICTION_FOUND
CRITIC_MISSING_EVIDENCE_FOUND
CRITIC_APPROVED
CRITIC_BLOCKED_RELEASE
```

### Ledger Events

```text
LEDGER_WRITE_STARTED
LEDGER_ENTRY_WRITTEN
LEDGER_WRITE_FAILED
TRACE_REPLAY_STARTED
TRACE_REPLAY_COMPLETED
```

### Snapshot / Rollback Events

```text
SNAPSHOT_PRE_CHANGE_STARTED
SNAPSHOT_PRE_CHANGE_CREATED
SNAPSHOT_POST_CHANGE_CREATED
SNAPSHOT_EMERGENCY_CREATED
ROLLBACK_AVAILABLE
ROLLBACK_STARTED
ROLLBACK_COMPLETED
ROLLBACK_FAILED
```

### Final Assembly Events

```text
FINAL_ASSEMBLY_STARTED
FINAL_OUTPUT_SCHEMA_VALIDATED
FINAL_OUTPUT_READY
FINAL_OUTPUT_RELEASED
FINAL_OUTPUT_BLOCKED
```

---

## 10. UI State Model

The UI should keep a derived state object from event history.

```ts
export type CalebThinkingMode =
  | 'idle'
  | 'hollow_only'
  | 'single_pass'
  | 'plan_synth'
  | 'plan_analyze_synth'
  | 'full_rotation'
  | 'recovery_guardrail';

export type CalebRole =
  | 'planner'
  | 'analyst'
  | 'critic'
  | 'synthesizer';

export type TrustTier = 'T0' | 'T1' | 'T2' | 'T3' | 'T4';

export interface ThinkingModeState {
  traceId: string | null;
  runId: string | null;
  taskId: string | null;
  mode: CalebThinkingMode;
  complexityScore: number | null;
  activeRole: CalebRole | null;
  activeHollows: ActiveHollowState[];
  evidencePackets: EvidencePacketView[];
  warnings: WarningView[];
  ledgerRefs: string[];
  snapshotState: SnapshotViewState;
  rollbackAvailable: boolean;
  finalOutputState: 'none' | 'assembling' | 'ready' | 'released' | 'blocked';
}
```

This state must be derived from engine events rather than hand-authored UI assumptions.

---

## 11. Visual Mapping Table

| Engine Event | 3D Visual | 2D Inspector |
|---|---|---|
| TASK_STARTED | Core pulse begins | Shows task ID and start time |
| TASK_COMPLEXITY_SCORED | Complexity ring changes level | Shows score and triggering factors |
| ROUTE_SELECTED | Route path lights up | Shows selected mode |
| ROLE_STARTED | Role node moves forward | Shows role purpose and status |
| HOLLOW_INVOKED | Hollow node receives packet | Shows Hollow ID/version |
| HOLLOW_COMPLETED | Hollow node emits result packet | Shows raw status, not trusted yet |
| EVIDENCE_ACCEPTED | Packet passes verification gate | Shows trust tier and evidence summary |
| CRITIC_DEFECT_FOUND | Warning arc loops back | Shows defect list |
| LEDGER_ENTRY_WRITTEN | Ledger block stamped | Shows ledger reference |
| SNAPSHOT_CREATED | Checkpoint ring locks | Shows snapshot ID and rollback location |
| FINAL_OUTPUT_RELEASED | Synthesizer emits final artifact | Shows final output and provenance summary |

---

## 12. Suggested Frontend Architecture

Recommended stack:

```text
React
TypeScript
Vite or Next.js
Three.js
React Three Fiber
@react-three/drei
Zustand or XState
Framer Motion for 2D panels if needed
Vitest / Playwright for tests
```

Recommended folder structure:

```text
src/
├── ui/
│   ├── thinking-mode/
│   │   ├── ThinkingModeShell.tsx
│   │   ├── ThinkingModeCanvas.tsx
│   │   ├── ThinkingModeInspector.tsx
│   │   ├── ThinkingModeTimeline.tsx
│   │   ├── ThinkingModeReplayControls.tsx
│   │   └── ThinkingModeFallback2D.tsx
│   ├── three/
│   │   ├── CalebCoreNode.tsx
│   │   ├── RoleRotationRing.tsx
│   │   ├── RoleNode.tsx
│   │   ├── HollowLayer.tsx
│   │   ├── HollowNode.tsx
│   │   ├── CommunicationPacket.tsx
│   │   ├── VerifiedReturnGate.tsx
│   │   ├── LedgerStack.tsx
│   │   ├── SnapshotRing.tsx
│   │   └── CameraRig.tsx
│   ├── state/
│   │   ├── thinkingModeStore.ts
│   │   ├── eventReducer.ts
│   │   └── replayStore.ts
│   ├── events/
│   │   ├── thinkingEvents.ts
│   │   ├── eventSchemas.ts
│   │   ├── eventSource.ts
│   │   └── mockTraceFixtures.ts
│   └── accessibility/
│       ├── reducedMotion.ts
│       ├── colorSafeStates.ts
│       └── screenReaderSummaries.ts
```

Engine-facing structure:

```text
src/
├── telemetry/
│   ├── emitThinkingEvent.ts
│   ├── thinkingEventTypes.ts
│   ├── thinkingEventSchemas.ts
│   └── traceReplay.ts
├── ledger/
│   └── ledgerToThinkingEvents.ts
├── orchestration/
│   └── orchestrationEventHooks.ts
├── hollows/
│   └── hollowEventHooks.ts
└── changeGuard/
    └── snapshotEventHooks.ts
```

---

## 13. MVP Scope

The first UI version should be intentionally small.

### MVP Must Include

- 3D central Caleb core
- Simple role ring with Planner, Analyst, Critic, Synthesizer nodes
- Hollow layer with generic Hollow nodes
- Verified Return Path gate
- Ledger stack
- Event-driven state store
- Mock trace playback
- 2D inspector panel
- Reduced-motion fallback
- Basic replay timeline

### MVP Does Not Need

- Full production model integration
- Full cinematic camera system
- Complex particle physics
- Dozens of Hollow types
- Real-time multiplayer/collaboration
- Full 3D editor
- User-customizable themes
- VR/AR support

The MVP proves one thing:

> A real or mocked Caleb trace can drive the 3D Thinking Mode without fake state.

---

## 14. Implementation Passes

### UI Pass 00 — Planning and Visual Contract

Tasks:

- Add this markdown file to `/docs`.
- Define the UI as telemetry-only.
- Freeze the event names for MVP.
- Define which engine states are allowed to be displayed.
- Define no-private-chain-of-thought rule.

Definition of done:

- Planning document exists.
- Event taxonomy is approved.
- Visuals are tied to engine events.

---

### UI Pass 01 — Event Schema and Mock Trace Fixtures

Tasks:

- Implement `ThinkingEvent` TypeScript type.
- Implement schema validation for UI events.
- Create mock traces for each mode level.
- Create reducer that derives UI state from events.

Definition of done:

- Mock traces load successfully.
- Invalid events are rejected.
- UI state can be reconstructed from event history.

---

### UI Pass 02 — 2D Inspector First

Tasks:

- Build a simple 2D Thinking Mode inspector.
- Show task state, active role, active Hollows, evidence packets, warnings, ledger refs, and snapshot state.
- Add replay controls for mock traces.

Definition of done:

- User can replay a trace without the 3D layer.
- Inspector accurately reflects events.
- Reduced-motion fallback has a valid baseline.

Reason:

> The 2D inspector proves correctness before the 3D layer adds visual spectacle.

---

### UI Pass 03 — Basic Three.js Scene

Tasks:

- Add React Three Fiber canvas.
- Render central Orchestration Core.
- Render Role Rotation Ring.
- Render placeholder Hollow layer.
- Render Verified Return Path gate.
- Render Ledger stack.

Definition of done:

- Scene loads.
- Camera is stable.
- No engine integration yet.
- Mock state controls visual activation.

---

### UI Pass 04 — Event-Driven Animation

Tasks:

- Connect reducer state to 3D objects.
- Role nodes activate on `ROLE_STARTED`.
- Hollow nodes activate on `HOLLOW_INVOKED`.
- Gate changes state on verification events.
- Ledger stack updates on `LEDGER_ENTRY_WRITTEN`.

Definition of done:

- Mock traces visibly drive scene.
- No random animation is mistaken for real state.
- Every visual state has a corresponding event source.

---

### UI Pass 05 — Thinking Mode Levels

Tasks:

- Implement visual differences for Levels 0–6.
- Complexity score controls ring intensity and camera framing.
- Recovery mode displays snapshot/rollback state.

Definition of done:

- Each mode can be replayed from fixtures.
- User can visually distinguish direct path, Hollow-only path, and full rotation.

---

### UI Pass 06 — Engine Integration Adapter

Tasks:

- Add adapter from Caleb engine events to ThinkingEvent schema.
- Connect Orchestration Core events.
- Connect Hollow invocation events.
- Connect Verified Return Path events.
- Connect Ledger events.
- Connect Auto Snapshot and Change Guard events.

Definition of done:

- Real engine event stream can render in the UI.
- Mock and real traces use same display path.
- UI never directly mutates engine state.

---

### UI Pass 07 — Replay and Debugging

Tasks:

- Load past trace from Ledger.
- Replay event sequence in 3D.
- Allow pause, scrub, and inspect.
- Show event details in 2D panel.

Definition of done:

- A completed run can be replayed visually.
- Ledger refs remain clickable/cross-referenceable.
- Debug trace can explain why a route or rollback happened.

---

### UI Pass 08 — Performance and Accessibility Hardening

Tasks:

- Add reduced-motion mode.
- Add 2D-only mode.
- Add device performance detection.
- Add FPS guard.
- Add screen reader summaries.
- Add keyboard navigation for inspector and timeline.

Definition of done:

- UI remains usable on weaker devices.
- Motion-sensitive users can disable heavy animation.
- Critical state is not communicated by color alone.

---

## 15. Visual Language Guidelines

### Motion

Use motion to show state transitions, not to distract.

Good:

- A packet travels when a message is sent.
- A role rotates forward when active.
- A gate opens when evidence is verified.
- A warning arc appears when Critic finds a defect.

Bad:

- Constant chaotic spinning.
- Motion unrelated to system state.
- Effects that imply false activity.

### Color

Use consistent state colors.

Suggested meanings:

| Color Family | Meaning |
|---|---|
| Neutral / gray | Idle, inactive, background |
| Blue / indigo | Adaptive reasoning / model role |
| Teal | Hollow / deterministic execution |
| Green | Verified / trusted / passed |
| Amber | Warning / partial trust / needs review |
| Red | Rejected / blocked / quarantined / failed |
| White / gold | Final release / completed artifact |

Do not rely on color alone.

### Labels

Every major node should have readable labels in the 2D inspector even if 3D labels are minimized.

3D labels should be short:

```text
CORE
PLAN
ANALYZE
CRITIC
SYNTH
HOLLOW
VERIFY
LEDGER
SNAPSHOT
```

2D inspector labels can be more descriptive.

---

## 16. User Interaction Model

The user should be able to:

- Watch live execution
- Pause the visual trace
- Open the inspector
- Click a role node to see role summary
- Click a Hollow node to see Hollow ID, version, status, and trust tier
- Click the Verified Return Path gate to see checks
- Click Ledger stack entries to see provenance records
- Click snapshot markers to see rollback state
- Replay a completed run
- Switch to 2D-only trace
- Reduce or disable motion

The user should not be able to:

- Force trust state from the UI
- Mark unverified evidence as trusted without proper approval event
- Trigger unsafe Hollow side effects from a 3D click without policy gate
- Edit Ledger history from the UI
- Bypass the Orchestration Core

---

## 17. Safety and Honesty Rules

### No Fake Reasoning

If the engine did not enter full role rotation, the UI must not show full role rotation.

### No Private Chain-of-Thought Display

The UI displays structured summaries and trace state, not hidden raw model reasoning.

### No Trust Inflation

Only the Verified Return Path may visually promote evidence to verified/trusted state.

### No Silent Failure

If a Hollow fails, times out, or is rejected, the UI should show that clearly.

### No Untraceable Visual State

If the UI shows something important, it must be traceable to an event ID, run ID, task ID, or ledger ref.

---

## 18. Testing Strategy

### Unit Tests

Test:

- Event schemas
- Event reducer
- State transitions
- Trust tier display mapping
- Mode selection display mapping
- Snapshot display mapping

### Fixture Tests

Create fixture traces for:

- Idle
- Hollow-only success
- Single-pass with Hollow verification
- Full role rotation success
- Critic defect loopback
- Hollow failure
- Verification rejection
- Snapshot rollback available
- Final output blocked

### Visual Regression Tests

Use stable screenshots for:

- Idle scene
- Active Planner
- Active Hollow
- Verified gate
- Critic warning
- Ledger write
- Recovery mode

### Integration Tests

Test:

- Real engine event stream renders correctly
- Ledger replay reconstructs trace
- Bad event schema is rejected
- UI cannot mutate engine trust state
- Reduced-motion mode disables heavy animation

---

## 19. Performance Budget

Initial targets:

```text
Initial load: under 3 seconds on normal desktop
Frame rate: 45–60 FPS target on desktop
Reduced-motion mode: low GPU use
Max active packet objects: capped and pooled
Max visible ledger entries: virtualized / paginated
3D labels: limited and optimized
```

Performance rules:

- Use instancing for repeated packets and nodes where possible.
- Pool packet animations.
- Avoid expensive post-processing in MVP.
- Provide quality settings.
- Pause heavy animation when tab is not active.
- Never allow decorative effects to delay core app usability.

---

## 20. Future Enhancements

After MVP, possible expansions:

- Trace replay gallery
- Role comparison view
- Hollow dependency graph
- Evidence map
- Cost/latency overlay
- Model provider routing visualization
- Multi-model role assignment display
- User-facing “why this route was chosen” panel
- Snapshot diff viewer
- Rollback animation with restored state confirmation
- Project-specific UI modes for music, code, video, vendor, and research workflows
- Presentation mode for demos and investors
- Exportable visual trace reports

---

## 21. Codex Implementation Instruction Block

Use this block when it is time to begin implementation.

```text
Implement the Caleb AI 3D UI Thinking Mode foundation.

Goal:
Create a telemetry-driven 3D interface that visualizes Caleb AI engine state without becoming the engine itself. The UI must render observable reasoning state, role rotation, Hollow activity, Verified Return Path status, Ledger events, and snapshot/rollback status from structured events.

Non-negotiable rules:
1. The UI is an observer and command surface, not the source of truth.
2. Every meaningful animation must be backed by a real ThinkingEvent.
3. Do not display or fabricate private chain-of-thought.
4. Show observable reasoning trace only: role state, event summaries, evidence status, verification gates, trust tiers, warnings, and Ledger refs.
5. Do not allow the UI to promote evidence trust, bypass policy gates, or edit Ledger history.
6. Build the 2D inspector and event reducer before relying on 3D visuals.
7. Support reduced-motion and 2D-only fallback.
8. Use mock traces first, then engine integration.

Recommended stack:
React + TypeScript + React Three Fiber + Three.js + Zustand or XState + Vitest.

Implement in passes:
- UI Pass 01: ThinkingEvent type, schemas, mock trace fixtures, event reducer.
- UI Pass 02: 2D inspector panel and replay controls.
- UI Pass 03: Basic 3D scene with central core, role ring, Hollow layer, verification gate, Ledger stack.
- UI Pass 04: Event-driven animations connected to reducer state.
- UI Pass 05: Thinking Mode Levels 0–6.
- UI Pass 06: Engine integration adapter.
- UI Pass 07: Ledger replay.
- UI Pass 08: accessibility and performance hardening.

Definition of done for first implementation slice:
- Mock traces can replay Hollow-only, single-pass, full role rotation, critic loopback, and recovery mode.
- 2D inspector accurately shows task ID, mode, active role, active Hollows, evidence packets, warnings, trust tiers, ledger refs, and snapshot state.
- 3D scene changes only in response to validated events.
- Reduced-motion mode works.
- Tests cover event reducer and schema validation.
- No engine trust decision is controlled by UI code.
```

---

## 22. Closing Principle

Caleb AI should not merely answer.

Caleb AI should show the user how the answer moved through the system:

```text
Intent entered.
Route selected.
Roles activated if needed.
Hollows worked.
Evidence was verified.
Critic challenged.
Ledger preserved.
Snapshot protected.
Final output released.
```

That is the signature Caleb experience.

Other apps show a typing indicator.

**Caleb shows the engine.**

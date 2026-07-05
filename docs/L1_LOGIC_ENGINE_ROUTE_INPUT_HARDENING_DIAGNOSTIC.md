# L1 Logic Engine Route-Input Hardening Diagnostic

## Diagnostic Status

Pass: L1 — Logic Engine Route-Input Hardening Diagnostic

Canonical protocol: `docs/protocols/PASS_PROTOCOL_L1.md`

Pre-change snapshot: `snap_20260705T185401847Z_000336_milestone`

Snapshot verification: verified present on disk at `.caleb/snapshots/snap_20260705T185401847Z_000336_milestone` before this diagnostic recorded the ID.

Verdict: ready for Pat review. Do not implement L1 until Pat approves the implementation pass.

## 1. Protocol Basis

The L1 protocol is allowlist-based, not denylist-based.

It defines route/state authority as a closed set of approved categories:

- contract-validated TaskFrames
- engine-internal state
- deterministic Hollow signals at approved effective tiers
- accepted gate/policy results
- human/Pat approval records
- snapshot/change-guard states
- lineage-resolved decision-facing records exposing `effective_tier` only

The protocol explicitly rejects everything outside that allowlist by construction. The rejection set includes raw model output, T1 provider/model output, role artifact prose, display summaries, report text, provider identity, model confidence, digest presence, storage presence, `measurement_tier`, `subject_tier`, any provenance-only field, and any unregistered record type.

Required position for implementation: keep the allowlist as the authority mechanism. The rejected examples are detector obligations, not the foundation of the gate.

## 2. Current Route-Input Surfaces

The current Logic Engine route path is centered on these surfaces:

- `src/logicEngine/taskFrameValidator.ts`
  - `validateTaskFrameInput(raw)` converts an unknown JSON object into a typed `TaskFrame`.
  - It validates required task fields, valid `task_type`, and numeric `signal_hints`.
  - It does not validate route authority, source class, lineage, trust tier, or record kind.

- `src/logicEngine/signalClassifier.ts`
  - `classifySignals(frame, overrides?)` converts a `TaskFrame` plus optional overrides into a `SignalFrame`.
  - `frame.signal_hints` and `overrides` can directly affect `SignalFrame.signals`, `signal_score`, and `complexity_band`.
  - Those outputs are route-relevant.

- `src/logicEngine/routeSelector.ts`
  - `selectRoute(frame, signals)` is the primary route/state decision point.
  - It chooses route modes from `TaskFrame.task_type`, `TaskFrame.requires_code_mutation`, and `SignalFrame.signals`.
  - It also derives snapshot and approval gate requirements.
  - It trusts already-shaped `TaskFrame` and `SignalFrame` values; it does not contain a route-input allowlist gate.

- `src/logicEngine/workGraphBuilder.ts`
  - `buildWorkGraph(frame, decision)` turns a `RouteDecision` into state-movement structure.
  - It consumes the decision after routing, so it is downstream of the route-input boundary.

- `src/logicEngine/executionContextBuilder.ts`
  - `buildExecutionContextSummary(frame, signals, decision, graph, result, ...)` summarizes route execution.
  - It consumes route results and trust summaries for execution context reporting; it should remain downstream, not a source of route authority.

- `src/logicEngine/singlePassRouteMvp.ts`
  - `runSinglePassRouteMvp(input, options)` validates and executes the current mocked single-pass route boundary after a route mode has already been chosen.
  - It records model-shaped output as T0/T1 only and does not promote route completion, storage, or retrieval to trust.
  - Its request includes `route_mode: "single_pass"` but it is not the general Logic Engine route selector.

- `src/logicEngine/routeLedgerEventBuilder.ts`
  - `buildRouteLedgerEvent(input)` reads a broad `route_result` shape for Ledger event provenance.
  - This is a reporting/provenance surface, not a route-input surface. Its broad `Readonly<Record<string, unknown>>` path should not be allowed to become route authority.

## 3. Current Unsafe or Advisory Acceptance Risk

The current code has validation for `TaskFrame` shape and signal score ranges, but it does not yet have the L1 route-input authority gate.

Current risk areas:

- A caller that can shape a valid `TaskFrame.signal_hints` object can influence `SignalFrame` and therefore routing.
- A caller that can supply a `SignalFrame` directly to `selectRoute` can influence routing if the call site trusts the value.
- TypeScript types do not provide runtime authority; they do not prove provenance, trust tier, lineage, record kind, or approved source.
- `TaskFrame.description` and `TaskFrame.input_summary` are advisory prose fields. `routeSelector` does not currently read those fields, but L1 should explicitly prevent display/report/model prose from being converted into route authority through future call sites.
- Broad provenance/reporting records, especially `RouteLedgerEventBuildInput.route_result: SinglePassRouteMvpResult | Readonly<Record<string, unknown>>`, must remain downstream report/provenance inputs only.

Diagnostic conclusion: existing route selection is deterministic once typed inputs are trusted, but the trust boundary is implicit. L1 should make that boundary explicit and closed.

## 4. Proposed Allowed Route-Input Record Types

Recommended implementation shape: a closed discriminated union with a `record_kind` field and runtime validator. A record is route-eligible only if its `record_kind` is registered in the L1 allowlist and its payload passes that kind's validator.

Recommended allowed kinds:

- `contract_validated_task_frame`
  - Carries a `TaskFrame` returned by `validateTaskFrameInput`.
  - Must include validation evidence that the frame was contract-validated before routing.

- `verified_signal_frame`
  - Carries a `SignalFrame` produced by `classifySignals` from approved inputs.
  - Must not be accepted from arbitrary external or model/provider-shaped records.

- `engine_internal_state`
  - Carries bounded engine-owned state needed for state transitions.
  - Must be created inside Logic Engine code, not imported from report/display/provider output.

- `deterministic_hollow_signal`
  - Carries deterministic Hollow evidence at an approved `effective_tier`.
  - Must carry route-relevant normalized fields only, not raw output text or provenance-only tiers.

- `accepted_gate_policy_result`
  - Carries accepted gate or policy decisions such as approval-gate pass/fail, critic/recovery gate result, or side-effect policy result.
  - Must be a gate result, not model confidence or provider identity.

- `human_pat_approval_record`
  - Carries a human/Pat approval record with explicit approval identity and scope.
  - Must not be inferred from report text or display text.

- `snapshot_change_guard_state`
  - Carries snapshot or change-guard state required by route gating.
  - Must not treat snapshot presence alone as route authority beyond the approved guard-state record.

- `lineage_resolved_decision_facing_record`
  - Carries M3-compatible decision-facing evidence.
  - May expose `effective_tier` only.
  - Must not expose `measurement_tier`, `subject_tier`, raw model/provider output, digest presence as authority, storage presence as authority, or provider identity.

## 5. Proposed Rejected Route-Input Record Types

L1 implementation should reject these by construction:

- raw model output
- raw provider output
- schema-valid T1 provider/model output
- role artifact prose
- display summary text
- report text
- model confidence
- provider identity
- digest presence
- storage presence
- `measurement_tier`
- `subject_tier`
- any provenance-only field used as authority
- unregistered `record_kind`
- records without a `record_kind`
- arbitrary `Readonly<Record<string, unknown>>`

The rejection model must be structural. The gate should fail closed if a record has extra provenance-only authority fields or if it lacks a registered kind.

## 6. Recommended Decision-Facing Shape

Recommended core type shape:

```ts
type LogicEngineRouteInput =
  | ContractValidatedTaskFrameRouteInput
  | VerifiedSignalFrameRouteInput
  | EngineInternalStateRouteInput
  | DeterministicHollowSignalRouteInput
  | AcceptedGatePolicyResultRouteInput
  | HumanPatApprovalRouteInput
  | SnapshotChangeGuardStateRouteInput
  | LineageResolvedDecisionFacingRouteInput;
```

Recommended common fields:

```ts
interface LogicEngineRouteInputBase {
  readonly record_kind: string;
  readonly record_id: string;
  readonly source: "logic_engine" | "hollow" | "gate" | "human_pat" | "change_guard";
  readonly validated_at: string;
  readonly lineage_refs: readonly string[];
}
```

For M3-connected decision-facing evidence:

```ts
interface LineageResolvedDecisionFacingRouteInput extends LogicEngineRouteInputBase {
  readonly record_kind: "lineage_resolved_decision_facing_record";
  readonly source: "hollow" | "gate" | "logic_engine";
  readonly effective_tier: "T0" | "T1" | "T2" | "T3" | "T4";
  readonly decision_signal: Readonly<Record<string, unknown>>;
}
```

Important constraints:

- Decision-facing route inputs may expose `effective_tier` only.
- `measurement_tier` and `subject_tier` must not appear on decision-facing records.
- `effective_tier` is not sufficient by itself; it is route-relevant only when carried by an approved decision-facing `record_kind`.
- Raw prose, display text, report text, provider identity, storage presence, digest presence, and model confidence must not be fields that select or escalate route mode.

## 7. M3 Effective-Tier Connection

M3's structural split should connect to L1 through `lineage_resolved_decision_facing_record` only.

Recommended rule:

- M3 provenance-facing records may carry `measurement_tier`, `subject_tier`, and `effective_tier`.
- The L1 route-input gate may consume only a decision-facing projection that exposes `effective_tier`.
- The projection must be lineage-resolved before L1 sees it.
- The projection must carry an allowlisted `record_kind`.
- Route code must never read `measurement_tier` or `subject_tier`.

This preserves the M3 doctrine:

- measurement can be T2
- model/provider subject remains T1
- `effective_tier` reflects the lower applicable trust tier
- downstream decision code sees only `effective_tier`

For the required golden-path family, a Character Count Hollow derived evidence record may have `measurement_tier = T2`, `subject_tier = T1`, and `effective_tier = T1`; L1 may consider only the decision-facing `effective_tier = T1` projection and only if that projection's `record_kind` is explicitly allowed.

## 8. Likely Implementation Files

Likely files to create:

- `src/logicEngine/types/routeInput.ts`
- `src/logicEngine/routeInputGate.ts`
- `tests/logicEngine/routeInputGate.test.ts`
- `tests/acceptance/l1RouteInputHardeningAcceptance.test.ts`
- `docs/L1_LOGIC_ENGINE_ROUTE_INPUT_HARDENING_IMPLEMENTATION.md`

Likely files to modify:

- `src/logicEngine/index.ts`
- `src/logicEngine/types/index.ts`
- `src/logicEngine/routeSelector.ts` or a new wrapper around it
- `PLANS.md`
- `docs/STATUS_LOG.md`

Conditional files to inspect during implementation:

- `src/logicEngine/taskFrameValidator.ts`
- `src/logicEngine/signalClassifier.ts`
- `src/logicEngine/routeLedgerEventBuilder.ts`
- `src/logicEngine/singlePassRouteMvp.ts`
- `tests/logicEngine/logicEngineIntegration.test.ts`

Files L1 implementation should not modify unless Pat expands scope:

- provider adapters
- provider types
- egress configuration
- package files and lockfiles
- catalog registration files
- M3 raw-output runtime behavior
- historical Ledger content
- UI files
- role-rotation runtime

## 9. Required Acceptance Tests

Required allowlist tests:

- contract-validated TaskFrame is accepted as route input.
- verified SignalFrame produced from approved inputs is accepted as route input.
- engine-internal state is accepted only from the approved internal kind.
- deterministic Hollow signal is accepted only at approved `effective_tier` and approved kind.
- accepted gate/policy result is accepted only when explicitly accepted.
- human/Pat approval record is accepted only with explicit scoped approval.
- snapshot/change-guard state is accepted only as guard state, not as mere snapshot presence.
- lineage-resolved decision-facing record is accepted only when it exposes `effective_tier` and no provenance-only tiers.

Required detector tests:

- synthetic T1 model/provider record presented as Logic Engine route input is rejected.
- `measurement_tier` presented as route input is rejected.
- `subject_tier` presented as route input is rejected.
- display/report text presented as route input is rejected.
- unknown record type presented as route input is rejected.
- digest presence used as route authority is rejected.
- storage presence used as route authority is rejected.
- provider identity used as route authority is rejected.
- model confidence used as route authority is rejected.
- role artifact prose used as route authority is rejected.
- arbitrary record without a registered `record_kind` is rejected.

Required absence tests:

- raw model/provider output cannot select a route mode.
- T1 provider/model output cannot select a route mode.
- display/report-safe text cannot select a route mode.
- `measurement_tier` and `subject_tier` cannot move routing or state transitions.
- digest/storage/provider identity cannot escalate route authority.

Recommended integration test:

- Route a normal validated TaskFrame through the new gate to `classifySignals` and `selectRoute`.
- Attempt the same route with synthetic T1 provider/model output and prove the gate rejects before `selectRoute`.

## 10. Open Risks, Ambiguities, and Pat Decisions

Pat decisions required before L1 implementation:

- Decide whether L1 changes the public `selectRoute(frame, signals)` signature or keeps it as an internal primitive behind a new gated wrapper.
- Decide the minimum approved `effective_tier` for deterministic Hollow signals that may influence route state.
- Decide whether `TaskFrame.signal_hints` remain part of a contract-validated TaskFrame or become separate route-input records requiring their own authority metadata.
- Decide how human/Pat approval records are represented in code: dedicated type, existing approval field, or gate result record.
- Decide whether `verified_signal_frame` should be a distinct allowed kind or only an engine-internal derivative of an accepted TaskFrame.

Risks to manage:

- Over-tightening could break existing `logicEngineIntegration` tests if the gate is inserted without an adapter layer.
- Under-tightening could leave `signal_hints` as a model/report-shaped route influence path.
- Broad `Readonly<Record<string, unknown>>` reporting/provenance inputs must not be reused as route authority.
- Future role-rotation placeholders in `workGraphBuilder` must not become permission to implement role rotation in L1.
- `effective_tier` must not be treated as globally sufficient route authority; it must remain meaningful only on approved decision-facing record kinds.

Implementation recommendation:

Use the structural split. Keep provenance-facing records with `measurement_tier`, `subject_tier`, and `effective_tier`, but expose only `effective_tier` through L1 decision-facing interfaces. Put a fail-closed route-input gate in front of route selection and keep existing deterministic selection logic as an internal consumer of already-approved route inputs.

Stop condition:

This diagnostic does not implement L1. It creates no runtime behavior, tests, validators, storage, provider behavior, UI, egress change, trust logic, or route-input gate. Proceed only after Pat approves the L1 implementation pass.

# Logic Engine V0 Functional Core Acceptance Report

## Executive Summary

Logic Engine V0 is accepted as the deterministic orchestration foundation for Caleb AI.

This acceptance locks the V0 functional core as the proven local foundation for TaskFrame validation, signal classification, route selection, WorkGraph construction, guarded Hollow dispatch, execution context summaries, and optional observable telemetry/trace capture. It does not claim Role Rotation, model orchestration, Thinking Mode UI, enterprise readiness, or production readiness.

## Acceptance Verdict

Logic Engine V0 Functional Core: Accepted
Status: Deterministic orchestration foundation complete
Next phase: Role Artifact Contract Layer

## Accepted Scope

- TaskFrame validation
- signal classification
- route decision
- WorkGraph construction
- Hollow dispatch
- approval gate refusal/activation
- snapshot gate refusal/activation
- explicit file capture for mutation paths
- Verified Return Path integration
- optional Ledger writes
- failure taxonomy
- WorkGraph Executor Lite
- execution context summary
- CLI context surfacing
- telemetry hook
- telemetry trace collector
- CLI telemetry trace surfacing

## Explicitly Excluded Scope

- role execution
- model calls
- role rotation
- multi-model orchestration
- Hollow chains
- full DAG execution
- Thinking Mode UI
- replay runtime
- trace file export
- report runtime generation
- Ledger trace persistence
- authenticated approval
- enterprise readiness
- production readiness

## Pass History

- V0 - Route Decision / WorkGraph
- V0.0.5 - Runtime TaskFrame Validation
- V0.1 - Hollow Dispatch
- V0.1.1 - Gate Refusal Lock
- V0.2 - Gate Activation
- V0.2.1 - Explicit File Capture
- V0.3 - Execution Hardening / Failure Taxonomy
- V0.4 - WorkGraph Executor Lite
- V0.5 - Execution Context Summary
- V0.6 - Context Surfacing + Telemetry Hook Stub
- V0.7 - Telemetry Trace Contract
- V0.8 - Telemetry Trace CLI Surfacing

## Current Validation Snapshot

- `npx tsc --noEmit` passed.
- `npx vitest run` passed: 88 files, 1336 tests.
- `npm run build` passed.
- `list-hollows --json`: 12 V1 Hollows.
- `list-hollowcut-hollows --json`: 9 Hollowcut Hollows.
- `route-decision` remains dry-run.
- `logic-execute` default output unchanged.
- `--include-context` works.
- `--include-trace` works.
- `--include-context` and `--include-trace` work together as sibling fields sharing `context_id`.

## Architecture Map

- `signalClassifier` produces deterministic signal scoring from a validated TaskFrame.
- `routeSelector` selects the route mode and route rationale from the signal frame.
- `workGraphBuilder` constructs the WorkGraph nodes for the selected route.
- `taskFrameValidator` validates runtime TaskFrame input before routing or execution.
- `workGraphExecutorLite` coordinates the current executable V0 path for `hollow_only` routes and enriches results with execution context.
- `hollowDispatcher` remains the execution primitive for guarded Hollow dispatch, approval gates, snapshot gates, explicit file capture, HollowRunner invocation, Verified Return Path verification, optional Ledger writes, and failure taxonomy.
- `executionContextBuilder` creates the V0.5 execution context summary without raw Hollow input.
- `telemetryEmitter` creates and emits optional best-effort observable Logic Engine events.
- `telemetryTraceCollector` captures optional in-memory telemetry traces for CLI JSON surfacing.
- The types layer defines TaskFrame, SignalFrame, RouteDecision, WorkGraph, execution result, execution context, telemetry event, and telemetry trace contracts.

## CLI Matrix

| Command / Flag | Current V0 Status |
| --- | --- |
| `route-decision` | Dry-run diagnostic only. Validates TaskFrame, classifies signals, selects route, builds WorkGraph summary, and does not execute Hollows. |
| `logic-execute` | Executes exactly one V1 Hollow for supported `hollow_only` routes through `executeWorkGraphLite` and `dispatchHollow`. |
| `--include-context` | `logic-execute` JSON-only opt-in that surfaces `execution_context`. |
| `--include-trace` | `logic-execute` JSON-only opt-in that surfaces `telemetry_trace`. |
| `--write-ledger` | Supported where currently implemented; requires `--ledger-path` for `logic-execute` and `route-decision`. |
| `--approved-by` | Supplies the approval actor for approval-gated `logic-execute` paths. |
| `--files-to-capture-json` / `--files-to-capture-file` | Supplies explicit project-relative file capture lists for snapshot-gated mutation paths. |

## Trust Boundary Summary

- `dispatchHollow` executes through HollowRunner.
- Verified Return Path verifies Hollow invocation results.
- Raw Hollow output is not automatically trusted.
- Ledger writes are optional.
- `execution_context` is summary only.
- `telemetry_trace` is observable-event only.

## Gate Summary

- The approval gate refuses approval-required execution unless `approved_by` is present.
- The snapshot gate activates for snapshot-required routes before Hollow dispatch.
- Explicit file capture is supported through JSON or file-based path lists.
- Mutation paths require explicit file capture before dispatch.
- Refused paths return structured refusal errors and do not run HollowRunner when gates fail.

## Telemetry And Trace Summary

- Telemetry events are optional.
- No sink means no telemetry.
- `telemetry_trace` is opt-in CLI JSON only.
- Trace capture is in-memory for now.
- There is no file export.
- There is no Ledger trace persistence.
- There is no UI/replay runtime.

## Protected Components

V0.6 through V0.8 did not modify protected components according to current pass reports and diagnostic inspection:

- HollowRunner
- VerifiedReturnPath
- SnapshotManager
- ledger core
- V1 catalog
- Hollowcut catalog
- verification
- changeGuard
- `src/hollows/**`

## Known Limitations

- no role execution
- no model calls
- no full DAG execution
- no role artifact contract layer yet
- no authenticated approval
- no Thinking Mode UI
- no replay runtime
- no trace file export
- no enterprise hardening claim

## Next Phase

The next phase is Role Artifact Contract Layer.

## Final Acceptance Statement

Logic Engine V0 Functional Core: Accepted
Status: Deterministic orchestration foundation complete
Next phase: Role Artifact Contract Layer

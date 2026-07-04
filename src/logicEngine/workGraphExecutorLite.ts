import { classifySignals } from "./signalClassifier.js";
import { selectRoute } from "./routeSelector.js";
import { buildWorkGraph } from "./workGraphBuilder.js";
import { dispatchHollow } from "./hollowDispatcher.js";
import { buildExecutionContextSummary } from "./executionContextBuilder.js";
import { createLogicEngineTelemetryEvent, emitLogicEngineTelemetry } from "./telemetryEmitter.js";
import type { DispatchHollowOptions } from "./hollowDispatcher.js";
import type { TaskFrame } from "./types/taskFrame.js";
import type { SignalFrame } from "./types/signalFrame.js";
import type { RouteDecision } from "./types/routeDecision.js";
import type { WorkGraph, WorkGraphNodeType } from "./types/workGraph.js";
import type { LogicEngineDispatchError, LogicEngineExecutionResult } from "./types/logicEngineResult.js";
import type { LogicEngineTelemetrySink } from "./types/telemetry.js";
import type { ISODateTimeString, JsonValue } from "../types/common.js";

// Node types supported for hollow_only execution. All others cause a refused result.
const SUPPORTED_NODE_TYPES = new Set<WorkGraphNodeType>([
  "TASK_INTAKE",
  "SIGNAL_CLASSIFICATION",
  "ROUTE_DECISION",
  "HUMAN_APPROVAL",
  "SNAPSHOT",
  "HOLLOW_CALL",
  "LEDGER_WRITE",
  "FINAL_ASSEMBLY"
]);

export interface WorkGraphExecutorLiteOptions extends DispatchHollowOptions {
  readonly telemetrySink?: LogicEngineTelemetrySink;
  // Test injection only — production callers must not set this
  readonly _overrideGraph?: WorkGraph;
}

// Local factory for refused results. Does not duplicate gate, VRP, Ledger, or HollowRunner logic.
function buildRefusedExecutionResult(
  frame: TaskFrame,
  signals: SignalFrame,
  decision: RouteDecision,
  graph: WorkGraph,
  errors: readonly LogicEngineDispatchError[]
): LogicEngineExecutionResult {
  return {
    status: "refused",
    frame,
    signals,
    decision,
    graph,
    executed_hollow_id: null,
    invocation: null,
    verification: null,
    evidence_packet: null,
    snapshot_id: null,
    approved_by: null,
    snapshot_capture_mode: null,
    snapshot_files_captured: null,
    ledger_write_status: "skipped",
    ledger_entries: [],
    warnings: [],
    errors
  };
}

// Coordinates the hollow_only execution path through the existing pipeline.
// Accepts a validated TaskFrame — callers are responsible for TaskFrame validation.
// dispatchHollow remains the execution primitive; this function does not call
// HollowRunner, VRP, SnapshotManager, or Ledger directly.
export async function executeWorkGraphLite(
  frame: TaskFrame,
  rawHollowDispatchRequest: unknown,
  options?: WorkGraphExecutorLiteOptions
): Promise<LogicEngineExecutionResult> {
  const contextId = crypto.randomUUID();
  const createdAt = new Date().toISOString() as ISODateTimeString;
  const telemetrySink = options?.telemetrySink;

  const signals = classifySignals(frame);
  const decision = selectRoute(frame, signals);
  const graph = options?._overrideGraph ?? buildWorkGraph(frame, decision);

  const supportedByExecutorLite =
    decision.route_mode === "hollow_only" &&
    graph.nodes.every((n) => SUPPORTED_NODE_TYPES.has(n.node_type));

  await emitLogicEngineTelemetry(telemetrySink, createLogicEngineTelemetryEvent({
    event_type: "logic_engine.execution_started",
    context_id: contextId,
    task_id: frame.task_id,
    run_id: frame.run_id,
    trace_id: frame.trace_id,
    route_mode: decision.route_mode,
    status: "started",
    data: {
      task_type: frame.task_type,
      requires_code_mutation: frame.requires_code_mutation
    }
  }));
  await emitLogicEngineTelemetry(telemetrySink, createLogicEngineTelemetryEvent({
    event_type: "logic_engine.route_selected",
    context_id: contextId,
    task_id: frame.task_id,
    run_id: frame.run_id,
    trace_id: frame.trace_id,
    route_mode: decision.route_mode,
    status: "selected",
    data: {
      signal_score: signals.signal_score,
      complexity_band: signals.complexity_band,
      requires_snapshot_gate: decision.requires_snapshot_gate,
      requires_approval_gate: decision.requires_approval_gate
    }
  }));
  await emitLogicEngineTelemetry(telemetrySink, createLogicEngineTelemetryEvent({
    event_type: "logic_engine.workgraph_built",
    context_id: contextId,
    task_id: frame.task_id,
    run_id: frame.run_id,
    trace_id: frame.trace_id,
    route_mode: decision.route_mode,
    status: "built",
    data: {
      work_graph_node_count: graph.nodes.length,
      supported_by_executor_lite: supportedByExecutorLite
    }
  }));

  // Guard 1: Only hollow_only is executable by this lite executor
  if (decision.route_mode !== "hollow_only") {
    const result = buildRefusedExecutionResult(frame, signals, decision, graph, [
      {
        code: "route_not_supported_by_executor_lite",
        message: `WorkGraphExecutorLite only supports route_mode 'hollow_only'. Got '${decision.route_mode}'.`
      }
    ]);
    const enrichedResult = {
      ...result,
      execution_context: buildExecutionContextSummary(
        frame, signals, decision, graph, result, contextId, createdAt, supportedByExecutorLite
      )
    };
    await emitLogicEngineTelemetry(telemetrySink, createLogicEngineTelemetryEvent({
      event_type: "logic_engine.execution_refused",
      context_id: contextId,
      task_id: frame.task_id,
      run_id: frame.run_id,
      trace_id: frame.trace_id,
      route_mode: decision.route_mode,
      status: "refused",
      data: terminalTelemetryData(enrichedResult)
    }));
    return enrichedResult;
  }

  // Guard 2: Unsupported node types indicate a route that cannot be executed yet
  const unsupportedNode = graph.nodes.find((n) => !SUPPORTED_NODE_TYPES.has(n.node_type));
  if (unsupportedNode !== undefined) {
    const result = buildRefusedExecutionResult(frame, signals, decision, graph, [
      {
        code: "route_not_supported_by_executor_lite",
        message: `WorkGraph contains unsupported node type '${unsupportedNode.node_type}'. WorkGraphExecutorLite only supports hollow_only execution.`
      }
    ]);
    const enrichedResult = {
      ...result,
      execution_context: buildExecutionContextSummary(
        frame, signals, decision, graph, result, contextId, createdAt, supportedByExecutorLite
      )
    };
    await emitLogicEngineTelemetry(telemetrySink, createLogicEngineTelemetryEvent({
      event_type: "logic_engine.execution_refused",
      context_id: contextId,
      task_id: frame.task_id,
      run_id: frame.run_id,
      trace_id: frame.trace_id,
      route_mode: decision.route_mode,
      status: "refused",
      data: terminalTelemetryData(enrichedResult)
    }));
    return enrichedResult;
  }

  // All guards passed — delegate to dispatchHollow (the execution primitive)
  await emitLogicEngineTelemetry(telemetrySink, createLogicEngineTelemetryEvent({
    event_type: "logic_engine.dispatch_started",
    context_id: contextId,
    task_id: frame.task_id,
    run_id: frame.run_id,
    trace_id: frame.trace_id,
    route_mode: decision.route_mode,
    status: "dispatching",
    data: {
      hollow_id: getTelemetryHollowId(rawHollowDispatchRequest)
    }
  }));
  const result = await dispatchHollow(frame, signals, decision, graph, rawHollowDispatchRequest, options);
  const enrichedResult = {
    ...result,
    execution_context: buildExecutionContextSummary(
      frame, signals, decision, graph, result, contextId, createdAt, supportedByExecutorLite
    )
  };
  await emitLogicEngineTelemetry(telemetrySink, createLogicEngineTelemetryEvent({
    event_type: "logic_engine.dispatch_completed",
    context_id: contextId,
    task_id: frame.task_id,
    run_id: frame.run_id,
    trace_id: frame.trace_id,
    route_mode: decision.route_mode,
    status: enrichedResult.status,
    data: terminalTelemetryData(enrichedResult)
  }));
  await emitLogicEngineTelemetry(telemetrySink, createLogicEngineTelemetryEvent({
    event_type: enrichedResult.status === "executed"
      ? "logic_engine.execution_completed"
      : enrichedResult.status === "failed"
        ? "logic_engine.execution_failed"
        : "logic_engine.execution_refused",
    context_id: contextId,
    task_id: frame.task_id,
    run_id: frame.run_id,
    trace_id: frame.trace_id,
    route_mode: decision.route_mode,
    status: enrichedResult.status,
    data: terminalTelemetryData(enrichedResult)
  }));
  return enrichedResult;
}

function terminalTelemetryData(
  result: LogicEngineExecutionResult
): Record<string, JsonValue> {
  return {
    dispatch_status: result.status,
    hollow_id: result.executed_hollow_id,
    ledger_write_status: result.ledger_write_status,
    snapshot_id: result.snapshot_id,
    snapshot_capture_mode: result.snapshot_capture_mode,
    snapshot_files_captured: result.snapshot_files_captured,
    approved_by: result.approved_by,
    gates_required_snapshot: result.execution_context?.gates_required.snapshot ?? false,
    gates_required_approval: result.execution_context?.gates_required.approval ?? false,
    gates_satisfied_snapshot: result.execution_context?.gates_satisfied.snapshot ?? false,
    gates_satisfied_approval: result.execution_context?.gates_satisfied.approval ?? false,
    error_codes: result.errors.map((e) => e.code),
    warning_count: result.warnings.length
  };
}

function getTelemetryHollowId(rawHollowDispatchRequest: unknown): string | null {
  if (typeof rawHollowDispatchRequest !== "object" || rawHollowDispatchRequest === null) {
    return null;
  }

  const value = (rawHollowDispatchRequest as Record<string, unknown>)["hollow_id"];
  return typeof value === "string" ? value : null;
}

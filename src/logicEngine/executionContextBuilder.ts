import type { TaskFrame } from "./types/taskFrame.js";
import type { SignalFrame } from "./types/signalFrame.js";
import type { RouteDecision } from "./types/routeDecision.js";
import type { WorkGraph } from "./types/workGraph.js";
import type { LogicEngineExecutionResult } from "./types/logicEngineResult.js";
import type {
  LogicEngineExecutionContextSummary,
  ExecutionContextGates
} from "./types/executionContext.js";
import type { ISODateTimeString } from "../types/common.js";

export function buildExecutionContextSummary(
  frame: TaskFrame,
  signals: SignalFrame,
  decision: RouteDecision,
  graph: WorkGraph,
  result: LogicEngineExecutionResult,
  contextId: string,
  createdAt: ISODateTimeString,
  supportedByExecutorLite: boolean
): LogicEngineExecutionContextSummary {
  const gates_required: ExecutionContextGates = {
    snapshot: decision.requires_snapshot_gate,
    approval: decision.requires_approval_gate
  };

  const gates_satisfied: ExecutionContextGates = {
    snapshot: result.snapshot_id !== null,
    approval: result.approved_by !== null
  };

  const trust_tier = result.evidence_packet?.trust_tier ?? result.invocation?.trust_tier ?? null;

  return {
    schema_version: "0.5.0",
    context_id: contextId,
    task_id: frame.task_id,
    run_id: frame.run_id,
    trace_id: frame.trace_id,
    route_mode: decision.route_mode,
    signal_score: signals.signal_score,
    complexity_band: signals.complexity_band,
    work_graph_node_count: graph.nodes.length,
    supported_by_executor_lite: supportedByExecutorLite,
    gates_required,
    gates_satisfied,
    dispatch_status: result.status,
    approved_by: result.approved_by,
    snapshot_id: result.snapshot_id,
    snapshot_capture_mode: result.snapshot_capture_mode,
    snapshot_files_captured: result.snapshot_files_captured,
    hollow_id: result.executed_hollow_id,
    trust_tier,
    ledger_write_status: result.ledger_write_status,
    warnings: result.warnings,
    errors: result.errors,
    role_artifacts: [],
    created_at: createdAt,
    completed_at: new Date().toISOString() as ISODateTimeString
  };
}

import type { ISODateTimeString } from "../../types/common.js";
import type { TrustTier } from "../../types/trust.js";
import type { RouteMode } from "./routeDecision.js";
import type { ComplexityBand } from "./signalFrame.js";
import type { LogicEngineDispatchError } from "./logicEngineResult.js";

export interface ExecutionContextGates {
  readonly snapshot: boolean;
  readonly approval: boolean;
}

export interface LogicEngineExecutionContextSummary {
  readonly schema_version: "0.5.0";
  readonly context_id: string;
  readonly task_id: string;
  readonly run_id: string;
  readonly trace_id: string;
  readonly route_mode: RouteMode;
  readonly signal_score: number;
  readonly complexity_band: ComplexityBand;
  readonly work_graph_node_count: number;
  readonly supported_by_executor_lite: boolean;
  readonly gates_required: ExecutionContextGates;
  readonly gates_satisfied: ExecutionContextGates;
  readonly dispatch_status: "executed" | "refused" | "failed";
  readonly approved_by: string | null;
  readonly snapshot_id: string | null;
  readonly snapshot_capture_mode: "audit_marker" | "file_capture" | null;
  readonly snapshot_files_captured: number | null;
  readonly hollow_id: string | null;
  readonly trust_tier: TrustTier | null;
  readonly ledger_write_status: "ok" | "failed" | "skipped";
  readonly warnings: readonly string[];
  readonly errors: readonly LogicEngineDispatchError[];
  readonly role_artifacts: readonly unknown[];
  readonly created_at: ISODateTimeString;
  readonly completed_at: ISODateTimeString;
}

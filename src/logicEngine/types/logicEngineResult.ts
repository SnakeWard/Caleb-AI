import type { EvidencePacket } from "../../types/evidence.js";
import type { HollowInvocationRecord } from "../../types/invocation.js";
import type { LedgerEntry } from "../../types/ledger.js";
import type { VerificationResult } from "../../verification/verificationTypes.js";
import type { TaskFrame } from "./taskFrame.js";
import type { SignalFrame } from "./signalFrame.js";
import type { RouteDecision } from "./routeDecision.js";
import type { WorkGraph } from "./workGraph.js";
import type { LogicEngineExecutionContextSummary } from "./executionContext.js";

export type LogicEngineExecutionStatus = "executed" | "refused" | "failed";

export interface LogicEngineDispatchError {
  readonly code: string;
  readonly message: string;
}

export interface LogicEngineExecutionResult {
  readonly status: LogicEngineExecutionStatus;
  readonly frame: TaskFrame;
  readonly signals: SignalFrame;
  readonly decision: RouteDecision;
  readonly graph: WorkGraph;
  readonly executed_hollow_id: string | null;
  readonly invocation: HollowInvocationRecord | null;
  readonly verification: VerificationResult | null;
  readonly evidence_packet: EvidencePacket | null;
  readonly snapshot_id: string | null;
  readonly approved_by: string | null;
  readonly snapshot_capture_mode: "audit_marker" | "file_capture" | null;
  readonly snapshot_files_captured: number | null;
  readonly ledger_write_status: "ok" | "failed" | "skipped";
  readonly ledger_entries: readonly LedgerEntry[];
  readonly warnings: readonly string[];
  readonly errors: readonly LogicEngineDispatchError[];
  readonly execution_context?: LogicEngineExecutionContextSummary;
}

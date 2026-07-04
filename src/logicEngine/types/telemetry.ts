import type { JsonValue, ISODateTimeString } from "../../types/common.js";
import type { LogicEngineExecutionStatus } from "./logicEngineResult.js";
import type { RouteMode } from "./routeDecision.js";

export type LogicEngineTelemetryEventType =
  | "logic_engine.execution_started"
  | "logic_engine.route_selected"
  | "logic_engine.workgraph_built"
  | "logic_engine.dispatch_started"
  | "logic_engine.dispatch_completed"
  | "logic_engine.execution_completed"
  | "logic_engine.execution_refused"
  | "logic_engine.execution_failed";

export type LogicEngineTelemetryStatus =
  | "started"
  | "selected"
  | "built"
  | "dispatching"
  | LogicEngineExecutionStatus;

export interface LogicEngineTelemetryEvent {
  readonly schema_version: "0.6.0";
  readonly event_id: string;
  readonly event_type: LogicEngineTelemetryEventType;
  readonly context_id: string;
  readonly task_id: string;
  readonly run_id: string;
  readonly trace_id: string;
  readonly route_mode: RouteMode;
  readonly occurred_at: ISODateTimeString;
  readonly status: LogicEngineTelemetryStatus;
  readonly data: Readonly<Record<string, JsonValue>>;
}

export type LogicEngineTelemetrySink = (
  event: LogicEngineTelemetryEvent
) => void | Promise<void>;

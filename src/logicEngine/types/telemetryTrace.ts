import type { ISODateTimeString } from "../../types/common.js";
import type { LogicEngineTelemetryEvent } from "./telemetry.js";

export type LogicEngineTelemetryTraceEvent = LogicEngineTelemetryEvent;

export interface LogicEngineTelemetryTrace {
  readonly schema_version: "0.7.0";
  readonly trace_id: string;
  readonly run_id: string;
  readonly task_id: string;
  readonly context_id: string;
  readonly created_at: ISODateTimeString;
  readonly completed_at: ISODateTimeString;
  readonly event_count: number;
  readonly events: readonly LogicEngineTelemetryTraceEvent[];
  readonly warnings: readonly string[];
  readonly sanitized: true;
}

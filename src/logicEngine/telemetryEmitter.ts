import type { JsonValue, ISODateTimeString } from "../types/common.js";
import type {
  LogicEngineTelemetryEvent,
  LogicEngineTelemetryEventType,
  LogicEngineTelemetrySink,
  LogicEngineTelemetryStatus
} from "./types/telemetry.js";
import type { RouteMode } from "./types/routeDecision.js";

export type LogicEngineTelemetryEmitStatus = "skipped" | "emitted" | "failed";

export function createLogicEngineTelemetryEvent(input: {
  readonly event_type: LogicEngineTelemetryEventType;
  readonly context_id: string;
  readonly task_id: string;
  readonly run_id: string;
  readonly trace_id: string;
  readonly route_mode: RouteMode;
  readonly status: LogicEngineTelemetryStatus;
  readonly data?: Readonly<Record<string, JsonValue>>;
}): LogicEngineTelemetryEvent {
  return {
    schema_version: "0.6.0",
    event_id: crypto.randomUUID(),
    event_type: input.event_type,
    context_id: input.context_id,
    task_id: input.task_id,
    run_id: input.run_id,
    trace_id: input.trace_id,
    route_mode: input.route_mode,
    occurred_at: new Date().toISOString() as ISODateTimeString,
    status: input.status,
    data: input.data ?? {}
  };
}

export async function emitLogicEngineTelemetry(
  sink: LogicEngineTelemetrySink | undefined,
  event: LogicEngineTelemetryEvent
): Promise<LogicEngineTelemetryEmitStatus> {
  if (sink === undefined) {
    return "skipped";
  }

  try {
    await sink(event);
    return "emitted";
  } catch {
    return "failed";
  }
}

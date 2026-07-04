import type {
  LogicEngineTelemetryEvent,
  LogicEngineTelemetrySink
} from "./types/telemetry.js";
import type { LogicEngineTelemetryTrace } from "./types/telemetryTrace.js";

export interface InMemoryTelemetryCollector {
  readonly sink: LogicEngineTelemetrySink;
  readonly getEvents: () => readonly LogicEngineTelemetryEvent[];
  readonly toTrace: () => LogicEngineTelemetryTrace | null;
  readonly clear: () => void;
}

export function createTelemetryTraceCollector(): InMemoryTelemetryCollector {
  const events: LogicEngineTelemetryEvent[] = [];

  const sink: LogicEngineTelemetrySink = (event) => {
    try {
      events.push(copyTelemetryEvent(event));
    } catch {
      // Telemetry capture is best-effort and must never affect execution.
    }
  };

  return {
    sink,
    getEvents: () => events.map(copyTelemetryEvent),
    toTrace: () => {
      if (events.length === 0) {
        return null;
      }

      const copiedEvents = events.map(copyTelemetryEvent);
      const firstEvent = copiedEvents[0];
      const lastEvent = copiedEvents[copiedEvents.length - 1];
      if (firstEvent === undefined || lastEvent === undefined) {
        return null;
      }

      return {
        schema_version: "0.7.0",
        trace_id: firstEvent.trace_id,
        run_id: firstEvent.run_id,
        task_id: firstEvent.task_id,
        context_id: firstEvent.context_id,
        created_at: firstEvent.occurred_at,
        completed_at: lastEvent.occurred_at,
        event_count: copiedEvents.length,
        events: copiedEvents,
        warnings: [],
        sanitized: true
      };
    },
    clear: () => {
      events.length = 0;
    }
  };
}

export function serializeTelemetryTrace(trace: LogicEngineTelemetryTrace): string {
  return JSON.stringify(trace, null, 2);
}

function copyTelemetryEvent(event: LogicEngineTelemetryEvent): LogicEngineTelemetryEvent {
  return {
    ...event,
    data: JSON.parse(JSON.stringify(event.data)) as LogicEngineTelemetryEvent["data"]
  };
}

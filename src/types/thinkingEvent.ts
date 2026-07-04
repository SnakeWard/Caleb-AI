import type {
  CalebSeverity,
  CalebStatus,
  ISODateTimeString,
  JsonObject,
  SemVerString
} from "./common.js";

// ThinkingEvent is a future UI telemetry contract only. It MUST NOT be treated as permission to build 3D Thinking Mode during V1.
export type ThinkingEventType =
  | "TASK_STARTED"
  | "TASK_MODE_SELECTED"
  | "ROLE_STARTED"
  | "ROLE_COMPLETED"
  | "HOLLOW_INVOKED"
  | "HOLLOW_COMPLETED"
  | "VERIFY_STARTED"
  | "EVIDENCE_ACCEPTED"
  | "LEDGER_ENTRY_WRITTEN"
  | "SNAPSHOT_PRE_CHANGE_CREATED"
  | "FINAL_OUTPUT_RELEASED";

export interface ThinkingEventDisplay {
  readonly summary: string;
  readonly detail?: string;
}

export interface ThinkingEvent {
  readonly event_id: string;
  readonly schema_version: SemVerString;
  readonly timestamp: ISODateTimeString;
  readonly trace_id: string;
  readonly run_id: string;
  readonly task_id: string;
  readonly parent_event_id: string | null;
  readonly event_type: ThinkingEventType;
  readonly source: string;
  readonly target: string | null;
  readonly severity: CalebSeverity;
  readonly status: CalebStatus;
  readonly payload: JsonObject;
  readonly ledger_ref: string | null;
  readonly display: ThinkingEventDisplay;
}

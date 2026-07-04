import type { ISODateTimeString } from "../../types/common.js";
import type { SignalInputs } from "./signalFrame.js";

export type TaskType =
  | "hollow_execution"
  | "text_analysis"
  | "code_analysis"
  | "code_mutation"
  | "media_validation"
  | "timeline_validation"
  | "export_readiness"
  | "synthesis"
  | "planning"
  | "recovery";

export const VALID_TASK_TYPES: readonly TaskType[] = [
  "hollow_execution",
  "text_analysis",
  "code_analysis",
  "code_mutation",
  "media_validation",
  "timeline_validation",
  "export_readiness",
  "synthesis",
  "planning",
  "recovery"
] as const;

export interface TaskFrame {
  readonly task_id: string;
  readonly run_id: string;
  readonly trace_id: string;
  readonly task_type: TaskType;
  readonly description: string;
  readonly input_summary: string;
  readonly requested_by: string;
  readonly requires_code_mutation: boolean;
  readonly signal_hints?: Readonly<Partial<SignalInputs>>;
  readonly created_at: ISODateTimeString;
}

import type { TaskFrame } from "./types/taskFrame.js";
import { VALID_TASK_TYPES } from "./types/taskFrame.js";
import { SIGNAL_FIELD_NAMES } from "./types/signalFrame.js";
import type { SignalInputs, SignalScore } from "./types/signalFrame.js";

export interface TaskFrameValidationError {
  readonly field: string;
  readonly code: string;
  readonly message: string;
}

export type TaskFrameValidationResult =
  | { readonly valid: true; readonly frame: TaskFrame; readonly errors: readonly TaskFrameValidationError[] }
  | { readonly valid: false; readonly errors: readonly TaskFrameValidationError[] };

const REQUIRED_STRING_FIELDS = [
  "task_id",
  "run_id",
  "trace_id",
  "task_type",
  "description",
  "input_summary",
  "requested_by",
  "created_at"
] as const;

const VALID_SIGNAL_SCORES = new Set<number>([0, 1, 2]);

export function validateTaskFrameInput(raw: unknown): TaskFrameValidationResult {
  const errors: TaskFrameValidationError[] = [];

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return {
      valid: false,
      errors: [
        {
          field: "(root)",
          code: "invalid_type",
          message: "Input must be a JSON object."
        }
      ]
    };
  }

  const obj = raw as Record<string, unknown>;

  // Validate required string fields
  for (const field of REQUIRED_STRING_FIELDS) {
    if (obj[field] === undefined || obj[field] === null) {
      errors.push({
        field,
        code: "missing_required_field",
        message: `Required field '${field}' is missing.`
      });
    } else if (typeof obj[field] !== "string") {
      errors.push({
        field,
        code: "invalid_field_type",
        message: `Field '${field}' must be a string.`
      });
    } else if ((obj[field] as string).trim().length === 0) {
      errors.push({
        field,
        code: "empty_required_field",
        message: `Required field '${field}' must not be empty.`
      });
    }
  }

  // Validate task_type against allowed values
  if (typeof obj.task_type === "string" && obj.task_type.trim().length > 0) {
    if (!VALID_TASK_TYPES.includes(obj.task_type as TaskFrame["task_type"])) {
      errors.push({
        field: "task_type",
        code: "invalid_task_type",
        message: `Unknown task_type '${obj.task_type}'. Allowed: ${VALID_TASK_TYPES.join(", ")}.`
      });
    }
  }

  // Validate signal_hints if present
  if (obj.signal_hints !== undefined) {
    if (typeof obj.signal_hints !== "object" || obj.signal_hints === null || Array.isArray(obj.signal_hints)) {
      errors.push({
        field: "signal_hints",
        code: "invalid_signal_hints_type",
        message: "signal_hints must be an object."
      });
    } else {
      const hints = obj.signal_hints as Record<string, unknown>;
      for (const key of Object.keys(hints)) {
        if (!SIGNAL_FIELD_NAMES.includes(key as keyof SignalInputs)) {
          errors.push({
            field: `signal_hints.${key}`,
            code: "unknown_signal_field",
            message: `'${key}' is not a recognized signal field. Allowed: ${SIGNAL_FIELD_NAMES.join(", ")}.`
          });
          continue;
        }
        const val = hints[key];
        if (typeof val !== "number") {
          errors.push({
            field: `signal_hints.${key}`,
            code: "invalid_signal_score_type",
            message: `signal_hints.${key} must be a number (0, 1, or 2); received ${typeof val}.`
          });
        } else if (!Number.isInteger(val)) {
          errors.push({
            field: `signal_hints.${key}`,
            code: "invalid_signal_score_not_integer",
            message: `signal_hints.${key} must be an integer (0, 1, or 2); received ${val}.`
          });
        } else if (!VALID_SIGNAL_SCORES.has(val)) {
          errors.push({
            field: `signal_hints.${key}`,
            code: "invalid_signal_score_out_of_range",
            message: `signal_hints.${key} must be 0, 1, or 2; received ${val}.`
          });
        }
      }
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Construct the validated TaskFrame
  const frame: TaskFrame = {
    task_id: obj.task_id as string,
    run_id: obj.run_id as string,
    trace_id: obj.trace_id as string,
    task_type: obj.task_type as TaskFrame["task_type"],
    description: obj.description as string,
    input_summary: obj.input_summary as string,
    requested_by: obj.requested_by as string,
    requires_code_mutation: obj.requires_code_mutation === true,
    created_at: obj.created_at as string,
    ...(obj.signal_hints !== undefined
      ? { signal_hints: buildValidatedSignalHints(obj.signal_hints as Record<string, unknown>) }
      : {})
  } as TaskFrame;

  return { valid: true, frame, errors: [] };
}

function buildValidatedSignalHints(
  hints: Record<string, unknown>
): Readonly<Partial<SignalInputs>> {
  const result: Partial<Record<keyof SignalInputs, SignalScore>> = {};
  for (const key of SIGNAL_FIELD_NAMES) {
    const val = hints[key];
    if (val !== undefined && typeof val === "number" && Number.isInteger(val) && VALID_SIGNAL_SCORES.has(val)) {
      result[key] = val as SignalScore;
    }
  }
  return result;
}

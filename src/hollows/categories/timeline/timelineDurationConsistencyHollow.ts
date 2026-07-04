import type { JsonObject, JsonValue } from "../../../types/common.js";
import type { CalebCheck, CalebWarning } from "../../../types/invocation.js";
import type {
  TimelineValidationIssue,
  TimelineValidationResult,
  TimelineValidationSeverity,
  TimelineValidationSummary
} from "../../../hollowcut/timeline/index.js";
import {
  createTimelineValidationCheck,
  createTimelineValidationIssue,
  createTimelineValidationResult,
  isFiniteNonNegativeNumber,
  isFinitePositiveNumber
} from "../../../hollowcut/timeline/index.js";
import type { HollowImplementation } from "../../runnerTypes.js";

interface DurationPolicy {
  readonly timeline_shorter_than_content_severity: TimelineValidationSeverity;
  readonly timeline_much_longer_than_content_severity: TimelineValidationSeverity;
  readonly end_mismatch_severity: TimelineValidationSeverity;
  readonly allow_zero_duration_items: boolean;
  readonly long_tail_threshold_ms: number;
}

interface ParsedTiming {
  readonly item_id: string;
  readonly end_ms: number | null;
  readonly enabled: boolean;
}

const DEFAULT_POLICY: DurationPolicy = {
  timeline_shorter_than_content_severity: "warning",
  timeline_much_longer_than_content_severity: "warning",
  end_mismatch_severity: "warning",
  allow_zero_duration_items: false,
  long_tail_threshold_ms: 5000
};

export const timelineDurationConsistencyImplementation: HollowImplementation = ({ input_payload }) => {
  const result = validateTimelineDurationConsistencyInput(input_payload);
  return {
    result: result as unknown as JsonValue,
    result_units: "timeline_duration",
    checks: [
      check("timeline_present", "Timeline Present"),
      check("timeline_duration_checked", "Timeline Duration Checked"),
      check("timeline_item_timing_checked", "Timeline Item Timing Checked"),
      check("timeline_max_item_end_calculated", "Timeline Max Item End Calculated"),
      check("supplied_state_only_confirmed", "Supplied State Only Confirmed")
    ],
    warnings: result.issues.filter((issue) => issue.severity === "warning").map(toWarning),
    artifact_hashes: [],
    confidence_level: "deterministic_supplied_state_timeline_duration"
  };
};

export function validateTimelineDurationConsistencyInput(input: JsonValue): TimelineValidationResult {
  const issues: TimelineValidationIssue[] = [];
  const candidate = isRecord(input) ? input : {};
  const policy = parsePolicy(candidate.validation_policy);

  if (!isRecord(input)) {
    issues.push(issue("$", "error", "input_not_object", "Duration consistency input must be an object."));
  }

  const timeline = candidate.timeline;
  if (!isRecord(timeline)) {
    issues.push(issue("$.timeline", "error", "timeline_missing", "timeline must be a supplied object."));
    return makeResult(issues, {});
  }

  const timelineId = nonEmptyString(timeline.timeline_id) ? timeline.timeline_id : null;
  const durationMs = isFiniteNonNegativeNumber(timeline.duration_ms) ? timeline.duration_ms : null;
  if (durationMs === null) {
    issues.push(issue("$.timeline.duration_ms", "error", "timeline_duration_invalid", "timeline duration_ms must be finite and non-negative."));
  }

  const items = Array.isArray(timeline.items) ? timeline.items : [];
  if (!Array.isArray(timeline.items)) {
    issues.push(issue("$.timeline.items", "error", "timeline_items_not_array", "timeline.items must be an array."));
  }

  const parsedItems = items.map((item, index) => parseItemTiming(item, index, issues, policy));
  const activeMaxItemEnd = maxEnd(parsedItems.filter((item): item is ParsedTiming => item !== null && item.enabled));
  if (durationMs !== null && activeMaxItemEnd !== null) {
    if (durationMs < activeMaxItemEnd) {
      issues.push(issue("$.timeline.duration_ms", policy.timeline_shorter_than_content_severity, "timeline_duration_shorter_than_content", "timeline duration is shorter than active content."));
    }
    if (durationMs - activeMaxItemEnd > policy.long_tail_threshold_ms) {
      issues.push(issue("$.timeline.duration_ms", policy.timeline_much_longer_than_content_severity, "timeline_duration_long_tail", "timeline duration is much longer than active content."));
    }
  }

  return makeResult(issues, {
    timeline_id: timelineId,
    item_count: items.length,
    duration_ms: durationMs,
    max_item_end_ms: activeMaxItemEnd,
    disabled_item_count: parsedItems.filter((item) => item !== null && !item.enabled).length
  });
}

function parseItemTiming(
  item: unknown,
  index: number,
  issues: TimelineValidationIssue[],
  policy: DurationPolicy
): ParsedTiming | null {
  const path = `$.timeline.items[${index}]`;
  if (!isRecord(item)) {
    issues.push(issue(path, "error", "item_timing_invalid", "timeline item must be an object."));
    return null;
  }

  const itemId = nonEmptyString(item.item_id) ? item.item_id : `item_${index}`;
  const enabled = item.enabled === undefined ? true : item.enabled === true;
  if (!isFiniteNonNegativeNumber(item.start_ms)) {
    issues.push(issue(`${path}.start_ms`, "error", "item_timing_invalid", "start_ms must be finite and non-negative.", itemId));
  }
  if (item.duration_ms === 0 && !policy.allow_zero_duration_items) {
    issues.push(issue(`${path}.duration_ms`, "error", "item_duration_zero", "zero duration timeline items are not allowed by default.", itemId));
  } else if (!(policy.allow_zero_duration_items ? isFiniteNonNegativeNumber(item.duration_ms) : isFinitePositiveNumber(item.duration_ms))) {
    issues.push(issue(`${path}.duration_ms`, "error", "item_timing_invalid", "duration_ms must be finite and positive unless policy allows zero.", itemId));
  }
  if (typeof item.duration_ms === "number" && item.duration_ms < 0) {
    issues.push(issue(`${path}.duration_ms`, "error", "item_timing_invalid", "duration_ms must not be negative.", itemId));
  }
  if (!isFiniteNonNegativeNumber(item.end_ms)) {
    issues.push(issue(`${path}.end_ms`, "error", "item_timing_invalid", "end_ms must be finite and non-negative.", itemId));
  }
  if (
    isFiniteNonNegativeNumber(item.start_ms) &&
    (policy.allow_zero_duration_items ? isFiniteNonNegativeNumber(item.duration_ms) : isFinitePositiveNumber(item.duration_ms)) &&
    isFiniteNonNegativeNumber(item.end_ms) &&
    item.end_ms !== item.start_ms + Number(item.duration_ms)
  ) {
    issues.push(issue(`${path}.end_ms`, policy.end_mismatch_severity, "item_end_mismatch", "end_ms should equal start_ms + duration_ms.", itemId));
  }

  return {
    item_id: itemId,
    end_ms: isFiniteNonNegativeNumber(item.end_ms) ? item.end_ms : null,
    enabled
  };
}

function parsePolicy(value: unknown): DurationPolicy {
  if (!isRecord(value)) return DEFAULT_POLICY;
  return {
    timeline_shorter_than_content_severity: severity(value.timeline_shorter_than_content_severity, DEFAULT_POLICY.timeline_shorter_than_content_severity),
    timeline_much_longer_than_content_severity: severity(value.timeline_much_longer_than_content_severity, DEFAULT_POLICY.timeline_much_longer_than_content_severity),
    end_mismatch_severity: severity(value.end_mismatch_severity, DEFAULT_POLICY.end_mismatch_severity),
    allow_zero_duration_items: typeof value.allow_zero_duration_items === "boolean" ? value.allow_zero_duration_items : DEFAULT_POLICY.allow_zero_duration_items,
    long_tail_threshold_ms: isFiniteNonNegativeNumber(value.long_tail_threshold_ms) ? value.long_tail_threshold_ms : DEFAULT_POLICY.long_tail_threshold_ms
  };
}

function makeResult(
  issues: readonly TimelineValidationIssue[],
  summary: Partial<TimelineValidationSummary>
): TimelineValidationResult {
  const codes = issues.map((entry) => entry.code);
  return createTimelineValidationResult({
    issues,
    summary,
    checks: [
      createTimelineValidationCheck("timeline_present", codes.includes("timeline_missing") ? "fail" : "pass", "Timeline object was checked.", codes),
      createTimelineValidationCheck("timeline_duration_checked", codes.includes("timeline_duration_invalid") ? "fail" : "pass", "Timeline duration was checked.", codes),
      createTimelineValidationCheck("timeline_item_timing_checked", codes.some((code) => code.startsWith("item_")) ? "warning" : "pass", "Timeline item timing was checked.", codes),
      createTimelineValidationCheck("timeline_max_item_end_calculated", "pass", "Maximum active item end was calculated.", []),
      createTimelineValidationCheck("supplied_state_only_confirmed", "pass", "No files, shell, network, media probes, Ledger writes, or mutation were performed.", [])
    ]
  }) as TimelineValidationResult;
}

function maxEnd(items: readonly ParsedTiming[]): number | null {
  const ends = items.map((item) => item.end_ms).filter((value): value is number => typeof value === "number");
  return ends.length === 0 ? null : Math.max(...ends);
}

function issue(path: string, severityValue: TimelineValidationSeverity, code: string, message: string, itemId?: string): TimelineValidationIssue {
  return createTimelineValidationIssue(path, severityValue, code, message, itemId === undefined ? {} : { item_ids: [itemId] });
}

function severity(value: unknown, fallback: TimelineValidationSeverity): TimelineValidationSeverity {
  return value === "warning" || value === "error" ? value : fallback;
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function check(check_id: string, label: string): CalebCheck {
  return { check_id, label, status: "completed", severity: "info" };
}

function toWarning(entry: TimelineValidationIssue): CalebWarning {
  return { warning_id: entry.code, message: entry.message, severity: "warning" };
}

export const timelineDurationConsistencyHollow = timelineDurationConsistencyImplementation;

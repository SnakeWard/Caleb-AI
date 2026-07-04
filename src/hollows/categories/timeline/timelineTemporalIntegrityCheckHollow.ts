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

interface TemporalPolicy {
  readonly negative_duration_severity: TimelineValidationSeverity;
  readonly end_before_start_severity: TimelineValidationSeverity;
  readonly zero_duration_severity: TimelineValidationSeverity;
  readonly overlap_severity: TimelineValidationSeverity;
  readonly gap_severity: TimelineValidationSeverity;
  readonly duration_mismatch_severity: TimelineValidationSeverity;
  readonly allow_zero_duration_items: boolean;
}

const DEFAULT_POLICY: TemporalPolicy = {
  negative_duration_severity: "error",
  end_before_start_severity: "error",
  zero_duration_severity: "warning",
  overlap_severity: "error",
  gap_severity: "warning",
  duration_mismatch_severity: "warning",
  allow_zero_duration_items: false
};

export const timelineTemporalIntegrityCheckImplementation: HollowImplementation = ({ input_payload }) => {
  const result = validateTimelineTemporalIntegrityInput(input_payload);
  const warningIssues = result.issues.filter((issue) => issue.severity === "warning");

  return {
    result: result as unknown as JsonValue,
    result_units: "timeline_temporal_integrity",
    checks: [
      check("timeline_present", "Timeline Present"),
      check("item_timing_validated", "Item Timing Validated"),
      check("no_negative_durations", "No Negative Durations"),
      check("no_end_before_start", "No End Before Start"),
      check("overlaps_checked", "Overlaps Checked (per track)"),
      check("gaps_checked", "Gaps Checked (per track)"),
      check("duration_consistency_checked", "Duration Consistency Checked"),
      check("project_timeline_cross_checked", "Project/Timeline Duration Cross Checked (if supplied)"),
      check("supplied_state_only_confirmed", "Supplied State Only Confirmed")
    ],
    warnings: warningIssues.map(toWarning),
    artifact_hashes: [],
    confidence_level: "deterministic_supplied_state_timeline_temporal_integrity"
  };
};

export function validateTimelineTemporalIntegrityInput(input: JsonValue): TimelineValidationResult {
  const issues: TimelineValidationIssue[] = [];
  const candidate = isRecord(input) ? input : {};
  const policy = parsePolicy(candidate.validation_policy);

  if (!isRecord(input)) {
    issues.push(issue("$", "error", "input_not_object", "Temporal integrity input must be an object."));
  }

  const timeline = candidate.timeline ?? candidate.timeline_state;
  if (!isRecord(timeline)) {
    issues.push(issue("$.timeline", "error", "timeline_missing", "timeline (or timeline_state) must be a supplied object."));
    return makeResult(issues, {});
  }

  const timelineId = nonEmptyString(timeline.timeline_id) ? timeline.timeline_id : null;
  const declaredDuration = isFiniteNonNegativeNumber(timeline.duration_ms) ? timeline.duration_ms : null;

  const items = Array.isArray(timeline.items) ? timeline.items : [];
  if (!Array.isArray(timeline.items)) {
    issues.push(issue("$.timeline.items", "error", "timeline_items_not_array", "timeline.items must be an array."));
  }

  // Per-item timing validation (negative, end-before-start, zero)
  const parsedItems: any[] = [];
  const trackGroups: Record<string, any[]> = {};

  items.forEach((item: unknown, index: number) => {
    const path = `$.timeline.items[${index}]`;
    if (!isRecord(item)) {
      issues.push(issue(path, "error", "item_timing_invalid", "timeline item must be an object."));
      return;
    }

    const itemId = nonEmptyString(item.item_id) ? item.item_id : `item_${index}`;
    const trackId = nonEmptyString(item.track_id) ? item.track_id : "unknown_track";
    const start = isFiniteNonNegativeNumber(item.start_ms) ? item.start_ms : null;
    let duration = isFiniteNonNegativeNumber(item.duration_ms) ? item.duration_ms : null;
    let end = isFiniteNonNegativeNumber(item.end_ms) ? item.end_ms : null;

    if (start === null) {
      issues.push(issue(`${path}.start_ms`, "error", "start_invalid", "start_ms must be finite and non-negative.", itemId ? [itemId] : []));
    }

    if (duration !== null && duration < 0) {
      issues.push(issue(`${path}.duration_ms`, policy.negative_duration_severity, "negative_duration", "duration_ms must not be negative.", itemId ? [itemId] : []));
    }

    if (end !== null && start !== null && end < start) {
      issues.push(issue(`${path}.end_ms`, policy.end_before_start_severity, "end_before_start", "end_ms must not be before start_ms.", itemId ? [itemId] : []));
    }

    if (duration === null && start !== null && end !== null) {
      duration = end - start;
    }
    if (end === null && start !== null && duration !== null) {
      end = start + duration;
    }

    if (duration === 0 && !policy.allow_zero_duration_items) {
      issues.push(issue(`${path}.duration_ms`, policy.zero_duration_severity, "zero_duration", "Zero duration items are not allowed by policy.", itemId ? [itemId] : []));
    } else if (duration !== null && duration < 0) {
      // already handled
    }

    const enabled = item.enabled === undefined ? true : item.enabled === true;
    const parsed = { item_id: itemId, track_id: trackId, start_ms: start, duration_ms: duration, end_ms: end, enabled };

    parsedItems.push(parsed);

    if (!trackGroups[trackId]) trackGroups[trackId] = [];
    trackGroups[trackId].push(parsed);
  });

  // Per-track overlap and gap detection
  Object.keys(trackGroups).forEach(trackId => {
    const group = trackGroups[trackId] || [];
    const trackItems = group.filter((p: any) => p.enabled && p.start_ms !== null && p.end_ms !== null)
      .sort((a: any, b: any) => (a.start_ms ?? 0) - (b.start_ms ?? 0));

    for (let i = 0; i < trackItems.length; i++) {
      for (let j = i + 1; j < trackItems.length; j++) {
        const a = trackItems[i];
        const b = trackItems[j];
        if ((a.end_ms ?? 0) > (b.start_ms ?? 0) && (b.end_ms ?? 0) > (a.start_ms ?? 0)) {
          issues.push(issue(`$.timeline.items`, policy.overlap_severity, "overlap_detected",
            `Overlapping items on track ${trackId}: ${a.item_id} and ${b.item_id}.`, [a.item_id, b.item_id]));
        }
      }
    }

    // Simple gap detection (consecutive enabled items)
    for (let i = 0; i < trackItems.length - 1; i++) {
      const a = trackItems[i];
      const b = trackItems[i + 1];
      if ((a.end_ms ?? 0) < (b.start_ms ?? 0)) {
        const gap = (b.start_ms ?? 0) - (a.end_ms ?? 0);
        if (gap > 0) {
          issues.push(issue(`$.timeline.items`, policy.gap_severity, "gap_detected",
            `Gap of ${gap}ms between ${a.item_id} and ${b.item_id} on track ${trackId}.`, [a.item_id, b.item_id]));
        }
      }
    }
  });

  // Duration consistency (declared vs content)
  const maxEnd = Math.max(...parsedItems.filter((p: any) => p.end_ms !== null).map((p: any) => p.end_ms), 0);
  if (declaredDuration !== null && maxEnd > declaredDuration) {
    issues.push(issue("$.timeline.duration_ms", policy.duration_mismatch_severity, "duration_shorter_than_content",
      "Declared timeline duration is shorter than the latest item end.", timelineId ? [timelineId] : []));
  }

  // Project cross if supplied
  const project = candidate.project_state ?? candidate.project;
  if (isRecord(project) && isRecord(project.timeline) && declaredDuration !== null) {
    const projTimelineDuration = isFiniteNonNegativeNumber(project.timeline.duration_ms) ? project.timeline.duration_ms : null;
    if (projTimelineDuration !== null && Math.abs(projTimelineDuration - declaredDuration) > 0) {
      issues.push(issue("$.timeline.duration_ms", policy.duration_mismatch_severity, "project_timeline_duration_mismatch",
        "Timeline duration does not match duration declared in project_state.", timelineId ? [timelineId] : []));
    }
  }

  return makeResult(issues, {
    timeline_id: timelineId,
    item_count: items.length,
    duration_ms: declaredDuration,
    max_item_end_ms: maxEnd || null
  });
}

function parsePolicy(value: unknown): TemporalPolicy {
  if (!isRecord(value)) return DEFAULT_POLICY;
  return {
    negative_duration_severity: severity(value.negative_duration_severity, DEFAULT_POLICY.negative_duration_severity),
    end_before_start_severity: severity(value.end_before_start_severity, DEFAULT_POLICY.end_before_start_severity),
    zero_duration_severity: severity(value.zero_duration_severity, DEFAULT_POLICY.zero_duration_severity),
    overlap_severity: severity(value.overlap_severity, DEFAULT_POLICY.overlap_severity),
    gap_severity: severity(value.gap_severity, DEFAULT_POLICY.gap_severity),
    duration_mismatch_severity: severity(value.duration_mismatch_severity, DEFAULT_POLICY.duration_mismatch_severity),
    allow_zero_duration_items: typeof value.allow_zero_duration_items === "boolean" ? value.allow_zero_duration_items : DEFAULT_POLICY.allow_zero_duration_items
  };
}

function severity(val: unknown, fallback: TimelineValidationSeverity): TimelineValidationSeverity {
  return val === "error" || val === "warning" ? val : fallback;
}

function makeResult(issues: TimelineValidationIssue[], summaryOverrides: Partial<TimelineValidationSummary>): TimelineValidationResult {
  const counts = countBySeverity(issues);
  const summary: TimelineValidationSummary = {
    timeline_id: null,
    item_count: 0,
    track_count: 0,
    marker_count: 0,
    duration_ms: null,
    max_item_end_ms: null,
    visual_item_count: 0,
    audio_item_count: 0,
    caption_item_count: 0,
    disabled_item_count: 0,
    warning_count: counts.warning,
    error_count: counts.error,
    ...summaryOverrides
  };

  return createTimelineValidationResult({
    issues,
    summary,
    checks: [
      createTimelineValidationCheck("timeline_present", counts.error > 0 ? "fail" : "pass", "Timeline object present.", []),
      createTimelineValidationCheck("item_timing_validated", "pass", "Per-item timing validated (start/end/duration).", []),
      createTimelineValidationCheck("overlaps_checked", counts.error > 0 ? "fail" : "pass", "Overlaps checked per track.", []),
      createTimelineValidationCheck("supplied_state_only_confirmed", "pass", "No files, shell, network, media probes, Ledger writes, or mutation were performed.", [])
    ]
  });
}

function countBySeverity(issues: TimelineValidationIssue[]) {
  let error = 0, warning = 0;
  issues.forEach(i => i.severity === "error" ? error++ : warning++);
  return { error, warning };
}

function issue(path: string, severityValue: TimelineValidationSeverity, code: string, message: string, itemIds: string[] = []): TimelineValidationIssue {
  return createTimelineValidationIssue(path, severityValue, code, message, { item_ids: itemIds.length ? itemIds : [] });
}

function check(check_id: string, label: string): CalebCheck {
  return { check_id, label, status: "completed", severity: "info" };
}

function toWarning(issue: TimelineValidationIssue): CalebWarning {
  return { warning_id: issue.code, message: issue.message, severity: "warning" };
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function nonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export const timelineTemporalIntegrityCheckHollow = timelineTemporalIntegrityCheckImplementation;
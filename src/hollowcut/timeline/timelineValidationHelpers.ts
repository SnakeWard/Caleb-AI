import type {
  TimelineValidationCheck,
  TimelineValidationIssue,
  TimelineValidationSeverity,
  TimelineValidationStatus,
  TimelineValidationSummary
} from "./timelineValidationTypes.js";

export function createTimelineValidationIssue(
  path: string,
  severity: TimelineValidationSeverity,
  code: string,
  message: string,
  refs: {
    readonly item_ids?: readonly string[];
    readonly track_ids?: readonly string[];
    readonly asset_ids?: readonly string[];
  } = {}
): TimelineValidationIssue {
  return {
    path,
    severity,
    code,
    message,
    ...(refs.item_ids === undefined ? {} : { item_ids: [...refs.item_ids] }),
    ...(refs.track_ids === undefined ? {} : { track_ids: [...refs.track_ids] }),
    ...(refs.asset_ids === undefined ? {} : { asset_ids: [...refs.asset_ids] })
  };
}

export function createTimelineValidationCheck(
  check_id: string,
  status: TimelineValidationCheck["status"],
  message: string,
  issue_codes: readonly string[] = []
): TimelineValidationCheck {
  return {
    check_id,
    status,
    message,
    issue_codes: [...issue_codes]
  };
}

export function createEmptyTimelineValidationSummary(
  overrides: Partial<TimelineValidationSummary> = {}
): TimelineValidationSummary {
  return {
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
    warning_count: 0,
    error_count: 0,
    ...overrides
  };
}

export function mergeTimelineValidationIssues(
  ...issueGroups: readonly (readonly TimelineValidationIssue[])[]
): TimelineValidationIssue[] {
  return issueGroups.flatMap((group) => group.map(copyTimelineValidationIssue));
}

export function countTimelineIssuesBySeverity(issues: readonly TimelineValidationIssue[]): {
  readonly warning_count: number;
  readonly error_count: number;
} {
  return {
    warning_count: issues.filter((issue) => issue.severity === "warning").length,
    error_count: issues.filter((issue) => issue.severity === "error").length
  };
}

export function getTimelineValidationStatus(warningCount: number, errorCount: number): TimelineValidationStatus {
  if (errorCount > 0) return "invalid";
  if (warningCount > 0) return "warnings";
  return "valid";
}

export function createTimelineValidationResult(input: {
  readonly checks?: readonly TimelineValidationCheck[];
  readonly issues?: readonly TimelineValidationIssue[];
  readonly summary?: Partial<TimelineValidationSummary>;
}) {
  const issues = mergeTimelineValidationIssues(input.issues ?? []);
  const counts = countTimelineIssuesBySeverity(issues);
  const summary = createEmptyTimelineValidationSummary({
    ...input.summary,
    warning_count: counts.warning_count,
    error_count: counts.error_count
  });

  return {
    valid: counts.error_count === 0,
    status: getTimelineValidationStatus(counts.warning_count, counts.error_count),
    warning_count: counts.warning_count,
    error_count: counts.error_count,
    checks: (input.checks ?? []).map((check) => ({
      ...check,
      issue_codes: [...check.issue_codes]
    })),
    issues,
    summary
  };
}

function copyTimelineValidationIssue(issue: TimelineValidationIssue): TimelineValidationIssue {
  return {
    ...issue,
    ...(issue.item_ids === undefined ? {} : { item_ids: [...issue.item_ids] }),
    ...(issue.track_ids === undefined ? {} : { track_ids: [...issue.track_ids] }),
    ...(issue.asset_ids === undefined ? {} : { asset_ids: [...issue.asset_ids] })
  };
}

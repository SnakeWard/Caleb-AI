import type { JsonValue } from "../../../types/common.js";
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
  createTimelineValidationResult
} from "../../../hollowcut/timeline/index.js";
import type { HollowImplementation } from "../../runnerTypes.js";

interface TrackPolicy {
  readonly track_item_mismatch_severity: TimelineValidationSeverity;
  readonly unused_track_severity: TimelineValidationSeverity;
}

const DEFAULT_POLICY: TrackPolicy = {
  track_item_mismatch_severity: "warning",
  unused_track_severity: "warning"
};

export const timelineTrackReferenceCheckImplementation: HollowImplementation = ({ input_payload }) => {
  const result = validateTimelineTrackReferenceInput(input_payload);
  return {
    result: result as unknown as JsonValue,
    result_units: "timeline_track_refs",
    checks: [
      check("timeline_present", "Timeline Present"),
      check("tracks_checked", "Tracks Checked"),
      check("timeline_item_track_refs_checked", "Timeline Item Track Refs Checked"),
      check("track_item_lists_checked", "Track Item Lists Checked"),
      check("supplied_state_only_confirmed", "Supplied State Only Confirmed")
    ],
    warnings: result.issues.filter((issue) => issue.severity === "warning").map(toWarning),
    artifact_hashes: [],
    confidence_level: "deterministic_supplied_state_timeline_track_refs"
  };
};

export function validateTimelineTrackReferenceInput(input: JsonValue): TimelineValidationResult {
  const issues: TimelineValidationIssue[] = [];
  const candidate = isRecord(input) ? input : {};
  const policy = parsePolicy(candidate.validation_policy);
  const timeline = candidate.timeline;
  if (!isRecord(input)) issues.push(issue("$", "error", "input_not_object", "Track reference input must be an object."));
  if (!isRecord(timeline)) {
    issues.push(issue("$.timeline", "error", "timeline_missing", "timeline must be a supplied object."));
    return makeResult(issues, {}, 0);
  }

  const items = Array.isArray(timeline.items) ? timeline.items : [];
  if (!Array.isArray(timeline.items)) issues.push(issue("$.timeline.items", "error", "timeline_items_not_array", "timeline.items must be an array."));
  const tracks = candidate.tracks === undefined ? [] : candidate.tracks;
  if (!Array.isArray(tracks)) issues.push(issue("$.tracks", "error", "tracks_not_array", "tracks must be an array when provided."));
  const trackArray = Array.isArray(tracks) ? tracks : [];
  const parsedTracks = parseTracks(trackArray, issues);
  const trackIds = new Set(parsedTracks.map((track) => track.track_id));
  const itemIds = new Set<string>();
  const usedTrackIds = new Set<string>();

  items.forEach((item, index) => {
    if (!isRecord(item)) return;
    const itemId = nonEmptyString(item.item_id) ? item.item_id : `item_${index}`;
    itemIds.add(itemId);
    if (!nonEmptyString(item.track_id)) {
      issues.push(createTimelineValidationIssue(`$.timeline.items[${index}].track_id`, "error", "item_track_id_missing", "timeline item track_id must be a non-empty string.", { item_ids: [itemId] }));
      return;
    }
    usedTrackIds.add(item.track_id);
    if (!trackIds.has(item.track_id)) {
      issues.push(createTimelineValidationIssue(`$.timeline.items[${index}].track_id`, "error", "item_track_ref_missing", `Missing track reference: ${item.track_id}.`, { item_ids: [itemId], track_ids: [item.track_id] }));
    }
  });

  for (const track of parsedTracks) {
    if (!usedTrackIds.has(track.track_id)) {
      issues.push(createTimelineValidationIssue("$.tracks", policy.unused_track_severity, "unused_track", `Track "${track.track_id}" has no timeline items.`, { track_ids: [track.track_id] }));
    }
    for (const trackItemId of track.items) {
      if (!itemIds.has(trackItemId)) {
        issues.push(createTimelineValidationIssue("$.tracks.items", policy.track_item_mismatch_severity, "track_item_ref_missing", `Track "${track.track_id}" references missing item "${trackItemId}".`, { track_ids: [track.track_id], item_ids: [trackItemId] }));
      }
    }
  }

  for (const item of items) {
    if (!isRecord(item) || !nonEmptyString(item.item_id) || !nonEmptyString(item.track_id)) continue;
    const track = parsedTracks.find((candidateTrack) => candidateTrack.track_id === item.track_id);
    if (track !== undefined && !track.items.includes(item.item_id)) {
      issues.push(createTimelineValidationIssue("$.tracks.items", policy.track_item_mismatch_severity, "track_item_list_mismatch", `Track "${track.track_id}" does not list item "${item.item_id}".`, { track_ids: [track.track_id], item_ids: [item.item_id] }));
    }
  }

  return makeResult(issues, {
    timeline_id: nonEmptyString(timeline.timeline_id) ? timeline.timeline_id : null,
    item_count: items.length,
    track_count: parsedTracks.length
  }, parsedTracks.length);
}

function parseTracks(tracks: readonly unknown[], issues: TimelineValidationIssue[]): { readonly track_id: string; readonly items: readonly string[] }[] {
  const parsed: { track_id: string; items: string[] }[] = [];
  const seen = new Set<string>();
  for (const [index, track] of tracks.entries()) {
    const path = `$.tracks[${index}]`;
    if (!isRecord(track)) {
      issues.push(issue(path, "error", "track_invalid", "track must be an object."));
      continue;
    }
    if (!nonEmptyString(track.track_id)) {
      issues.push(issue(`${path}.track_id`, "error", "track_id_invalid", "track_id must be a non-empty string."));
      continue;
    }
    if (seen.has(track.track_id)) {
      issues.push(createTimelineValidationIssue(`${path}.track_id`, "error", "duplicate_track_id", "Duplicate track_id detected.", { track_ids: [track.track_id] }));
    }
    seen.add(track.track_id);
    if (track.items !== undefined && !isStringArray(track.items)) {
      issues.push(issue(`${path}.items`, "error", "track_items_invalid", "track items must be an array of item ID strings."));
    }
    parsed.push({ track_id: track.track_id, items: isStringArray(track.items) ? [...track.items] : [] });
  }
  return parsed;
}

function parsePolicy(value: unknown): TrackPolicy {
  if (!isRecord(value)) return DEFAULT_POLICY;
  return {
    track_item_mismatch_severity: severity(value.track_item_mismatch_severity, DEFAULT_POLICY.track_item_mismatch_severity),
    unused_track_severity: severity(value.unused_track_severity, DEFAULT_POLICY.unused_track_severity)
  };
}

function makeResult(
  issues: readonly TimelineValidationIssue[],
  summary: Partial<TimelineValidationSummary>,
  trackCount: number
): TimelineValidationResult {
  const codes = issues.map((entry) => entry.code);
  const result = createTimelineValidationResult({
    issues,
    summary,
    checks: [
      createTimelineValidationCheck("timeline_present", codes.includes("timeline_missing") ? "fail" : "pass", "Timeline object was checked.", codes),
      createTimelineValidationCheck("tracks_checked", codes.includes("tracks_not_array") ? "fail" : "pass", "Tracks were checked.", codes),
      createTimelineValidationCheck("timeline_item_track_refs_checked", codes.includes("item_track_ref_missing") ? "fail" : "pass", "Timeline item track references were checked.", codes),
      createTimelineValidationCheck("track_item_lists_checked", "pass", "Track item lists were checked.", codes),
      createTimelineValidationCheck("supplied_state_only_confirmed", "pass", "No files, shell, network, media probes, Ledger writes, overlap checks, or mutation were performed.", [])
    ]
  }) as TimelineValidationResult;
  return { ...result, summary: { ...result.summary, track_count: trackCount } } as TimelineValidationResult;
}

function issue(path: string, severityValue: TimelineValidationSeverity, code: string, message: string): TimelineValidationIssue {
  return createTimelineValidationIssue(path, severityValue, code, message);
}

function severity(value: unknown, fallback: TimelineValidationSeverity): TimelineValidationSeverity {
  return value === "warning" || value === "error" ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function check(check_id: string, label: string): CalebCheck {
  return { check_id, label, status: "completed", severity: "info" };
}

function toWarning(entry: TimelineValidationIssue): CalebWarning {
  return { warning_id: entry.code, message: entry.message, severity: "warning" };
}

export const timelineTrackReferenceCheckHollow = timelineTrackReferenceCheckImplementation;

import type { JsonObject, JsonValue } from "../../../types/common.js";
import type { CalebCheck, CalebWarning } from "../../../types/invocation.js";
import type {
  TimelineItemType,
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

const KNOWN_ITEM_TYPES = new Set<TimelineItemType>([
  "visual",
  "audio",
  "caption",
  "narration",
  "effect",
  "unknown"
]);

const DEFAULT_POLICY: TimelineSchemaCheckPolicy = {
  end_mismatch_severity: "warning",
  metadata_hint_without_evidence_severity: "warning",
  allow_zero_duration_items: false
};

interface TimelineSchemaCheckPolicy {
  readonly end_mismatch_severity: TimelineValidationSeverity;
  readonly metadata_hint_without_evidence_severity: TimelineValidationSeverity;
  readonly allow_zero_duration_items: boolean;
}

interface TimelineSchemaCheckInput {
  readonly timeline?: unknown;
  readonly assets?: unknown;
  readonly tracks?: unknown;
  readonly captions?: unknown;
  readonly validation_policy?: unknown;
}

interface ValidatedItem {
  readonly item_id: string;
  readonly asset_id: string;
  readonly track_id: string;
  readonly item_type: TimelineItemType;
  readonly end_ms: number | null;
  readonly enabled: boolean;
}

interface AssetShape {
  readonly asset_id: string;
}

interface TrackShape {
  readonly track_id: string;
}

export const timelineSchemaCheckImplementation: HollowImplementation = ({ input_payload }) => {
  const result = validateTimelineSchemaCheckInput(input_payload);
  const warningIssues = result.issues.filter((issue) => issue.severity === "warning");

  return {
    result: result as unknown as JsonValue,
    result_units: "timeline_schema",
    checks: [
      createCheck("timeline_present", "Timeline Present"),
      createCheck("timeline_required_fields_checked", "Timeline Required Fields Checked"),
      createCheck("timeline_items_checked", "Timeline Items Checked"),
      createCheck("timeline_tracks_checked", "Timeline Tracks Checked"),
      createCheck("timeline_references_checked", "Timeline References Checked"),
      createCheck("timeline_summary_created", "Timeline Summary Created"),
      createCheck("supplied_state_only_confirmed", "Supplied State Only Confirmed")
    ],
    warnings: warningIssues.map((issue) => createWarning(issue.code, issue.message)),
    artifact_hashes: [],
    confidence_level: "deterministic_supplied_state_timeline_schema"
  };
};

export function validateTimelineSchemaCheckInput(input: JsonValue): TimelineValidationResult {
  const candidate = isRecord(input) ? (input as TimelineSchemaCheckInput) : {};
  const issues: TimelineValidationIssue[] = [];
  const policy = parseValidationPolicy(candidate.validation_policy);

  if (!isRecord(input)) {
    issues.push(
      createTimelineValidationIssue(
        "$",
        "error",
        "input_not_object",
        "Timeline Schema Check Hollow requires an object input payload."
      )
    );
  }

  const timeline = candidate.timeline;
  if (!isRecord(timeline)) {
    issues.push(
      createTimelineValidationIssue(
        "$.timeline",
        "error",
        timeline === undefined ? "timeline_missing" : "timeline_invalid",
        "timeline must be a supplied object."
      )
    );
    return createResult(issues, createSummary({}));
  }

  const assets = parseArray(candidate.assets, "$.assets", "assets_invalid", issues);
  const tracks = parseArray(candidate.tracks, "$.tracks", "tracks_invalid", issues);
  const captions = parseArray(candidate.captions, "$.captions", "captions_invalid", issues);

  const timelineId = readNonEmptyString(timeline.timeline_id);
  if (timelineId === null) {
    issues.push(fieldError("$.timeline.timeline_id", "timeline_id_invalid", "timeline_id must be a non-empty string."));
  }

  const durationMs = readFiniteNonNegative(timeline.duration_ms);
  if (durationMs === null) {
    issues.push(fieldError("$.timeline.duration_ms", "timeline_duration_invalid", "duration_ms must be finite and non-negative."));
  }

  if (!isFinitePositiveNumber(timeline.fps)) {
    issues.push(fieldError("$.timeline.fps", "timeline_fps_invalid", "fps must be a finite positive number."));
  }
  if (!isFinitePositiveNumber(timeline.width)) {
    issues.push(fieldError("$.timeline.width", "timeline_width_invalid", "width must be a finite positive number."));
  }
  if (!isFinitePositiveNumber(timeline.height)) {
    issues.push(fieldError("$.timeline.height", "timeline_height_invalid", "height must be a finite positive number."));
  }
  if (readNonEmptyString(timeline.aspect_ratio) === null) {
    issues.push(fieldError("$.timeline.aspect_ratio", "timeline_aspect_ratio_invalid", "aspect_ratio must be a non-empty string."));
  }

  const items = Array.isArray(timeline.items) ? timeline.items : [];
  if (!Array.isArray(timeline.items)) {
    issues.push(fieldError("$.timeline.items", "timeline_items_invalid", "items must be an array."));
  }
  if (items.length === 0) {
    issues.push(warning("$.timeline.items", "timeline_items_empty", "timeline contains no items."));
  }

  const markers = parseOptionalArray(timeline.markers, "$.timeline.markers", "timeline_markers_invalid", issues);
  parseOptionalStringArray(timeline.warnings, "$.timeline.warnings", "timeline_warnings_invalid", issues);

  const parsedAssets = validateAssets(assets, issues, policy);
  const parsedTracks = validateTracks(tracks, issues);
  if (parsedTracks.length === 0) {
    issues.push(warning("$.tracks", "timeline_tracks_empty", "No tracks were supplied for timeline schema validation."));
  }

  const parsedItems = validateItems(items, issues, policy);
  validateDuplicateIds(parsedAssets.map((asset) => asset.asset_id), "$.assets", "duplicate_asset_id", "Duplicate asset_id detected.", issues);
  validateDuplicateIds(parsedTracks.map((track) => track.track_id), "$.tracks", "duplicate_track_id", "Duplicate track_id detected.", issues);
  validateDuplicateIds(parsedItems.map((item) => item.item_id), "$.timeline.items", "duplicate_item_id", "Duplicate item_id detected.", issues);
  validateReferences(parsedItems, parsedAssets, parsedTracks, issues);
  validateCaptions(captions, issues);
  validateMarkers(markers, issues);

  const maxItemEndMs = getMaxEnd(parsedItems);
  if (durationMs !== null && maxItemEndMs !== null) {
    if (durationMs < maxItemEndMs) {
      issues.push(
        warning(
          "$.timeline.duration_ms",
          "timeline_duration_shorter_than_items",
          "timeline duration is shorter than the maximum item end time."
        )
      );
    } else if (durationMs > maxItemEndMs + Math.max(10000, maxItemEndMs * 0.25)) {
      issues.push(
        warning(
          "$.timeline.duration_ms",
          "timeline_duration_much_longer_than_items",
          "timeline duration is much longer than the maximum item end time."
        )
      );
    }
  }

  const summary = createSummary({
    timeline_id: timelineId,
    item_count: items.length,
    track_count: Array.isArray(candidate.tracks) ? candidate.tracks.length : 0,
    marker_count: markers.length,
    duration_ms: durationMs,
    max_item_end_ms: maxItemEndMs,
    visual_item_count: parsedItems.filter((item) => item.item_type === "visual").length,
    audio_item_count: parsedItems.filter((item) => item.item_type === "audio").length,
    caption_item_count: parsedItems.filter((item) => item.item_type === "caption").length,
    disabled_item_count: parsedItems.filter((item) => !item.enabled).length
  });

  return createResult(issues, summary);
}

function validateAssets(
  assets: readonly unknown[],
  issues: TimelineValidationIssue[],
  policy: TimelineSchemaCheckPolicy
): AssetShape[] {
  const parsed: AssetShape[] = [];
  assets.forEach((asset, index) => {
    const path = `$.assets[${index}]`;
    if (!isRecord(asset)) {
      issues.push(fieldError(path, "asset_invalid", "asset must be an object."));
      return;
    }

    const assetId = readNonEmptyString(asset.asset_id);
    if (assetId === null) {
      issues.push(fieldError(`${path}.asset_id`, "asset_id_invalid", "asset_id must be a non-empty string."));
    } else {
      parsed.push({ asset_id: assetId });
    }

    const evidenceRefs = Array.isArray(asset.evidence_refs)
      ? asset.evidence_refs.filter((ref): ref is string => typeof ref === "string")
      : [];
    if (asset.evidence_refs !== undefined && !isStringArray(asset.evidence_refs)) {
      issues.push(fieldError(`${path}.evidence_refs`, "asset_evidence_refs_invalid", "evidence_refs must be an array of strings."));
    }
    if (asset.metadata_hint !== undefined && !isRecord(asset.metadata_hint)) {
      issues.push(fieldError(`${path}.metadata_hint`, "asset_metadata_hint_invalid", "metadata_hint must be an object when provided."));
    }
    if (asset.metadata_hint !== undefined && evidenceRefs.length === 0) {
      issues.push(
        createTimelineValidationIssue(
          `${path}.metadata_hint`,
          policy.metadata_hint_without_evidence_severity,
          "metadata_hint_without_evidence",
          "metadata_hint is supplied project state and is not verified evidence.",
          assetId === null ? {} : { asset_ids: [assetId] }
        )
      );
    }
  });
  return parsed;
}

function validateTracks(tracks: readonly unknown[], issues: TimelineValidationIssue[]): TrackShape[] {
  const parsed: TrackShape[] = [];
  tracks.forEach((track, index) => {
    const path = `$.tracks[${index}]`;
    if (!isRecord(track)) {
      issues.push(fieldError(path, "track_invalid", "track must be an object."));
      return;
    }

    const trackId = readNonEmptyString(track.track_id);
    if (trackId === null) {
      issues.push(fieldError(`${path}.track_id`, "track_id_invalid", "track_id must be a non-empty string."));
    } else {
      parsed.push({ track_id: trackId });
    }
    if (track.items !== undefined && !isStringArray(track.items)) {
      issues.push(fieldError(`${path}.items`, "track_items_invalid", "track items must be an array of item ID strings."));
    }
  });
  return parsed;
}

function validateItems(
  items: readonly unknown[],
  issues: TimelineValidationIssue[],
  policy: TimelineSchemaCheckPolicy
): ValidatedItem[] {
  const parsed: ValidatedItem[] = [];
  items.forEach((item, index) => {
    const path = `$.timeline.items[${index}]`;
    if (!isRecord(item)) {
      issues.push(fieldError(path, "timeline_item_invalid", "timeline item must be an object."));
      return;
    }

    const itemId = readNonEmptyString(item.item_id);
    const assetId = readNonEmptyString(item.asset_id);
    const trackId = readNonEmptyString(item.track_id);
    const itemType = parseItemType(item.item_type, path, issues);
    const enabled = item.enabled === undefined ? true : item.enabled;

    if (itemId === null) issues.push(fieldError(`${path}.item_id`, "item_id_invalid", "item_id must be a non-empty string."));
    if (assetId === null) issues.push(fieldError(`${path}.asset_id`, "item_asset_id_invalid", "asset_id must be a non-empty string."));
    if (trackId === null) issues.push(fieldError(`${path}.track_id`, "item_track_id_invalid", "track_id must be a non-empty string."));
    if (!isFiniteNonNegativeNumber(item.start_ms)) {
      issues.push(fieldError(`${path}.start_ms`, "item_start_ms_invalid", "start_ms must be finite and non-negative."));
    }
    if (!isValidDuration(item.duration_ms, policy.allow_zero_duration_items)) {
      issues.push(
        fieldError(
          `${path}.duration_ms`,
          "item_duration_ms_invalid",
          policy.allow_zero_duration_items
            ? "duration_ms must be finite and non-negative."
            : "duration_ms must be finite and positive."
        )
      );
    }
    if (!isFiniteNonNegativeNumber(item.end_ms)) {
      issues.push(fieldError(`${path}.end_ms`, "item_end_ms_invalid", "end_ms must be finite and non-negative."));
    }
    if (typeof enabled !== "boolean") {
      issues.push(fieldError(`${path}.enabled`, "item_enabled_invalid", "enabled must be a boolean when provided."));
    }
    if (!isIntegerLikeNonNegative(item.layer)) {
      issues.push(fieldError(`${path}.layer`, "item_layer_invalid", "layer must be an integer-like non-negative number."));
    }
    if (!isTransitionShape(item.transition_in)) {
      issues.push(fieldError(`${path}.transition_in`, "item_transition_in_invalid", "transition_in must be null, string, or object."));
    }
    if (!isTransitionShape(item.transition_out)) {
      issues.push(fieldError(`${path}.transition_out`, "item_transition_out_invalid", "transition_out must be null, string, or object."));
    }
    if (item.effects !== undefined && !Array.isArray(item.effects)) {
      issues.push(fieldError(`${path}.effects`, "item_effects_invalid", "effects must be an array when provided."));
    }
    if (item.metadata !== undefined && !isRecord(item.metadata)) {
      issues.push(fieldError(`${path}.metadata`, "item_metadata_invalid", "metadata must be an object when provided."));
    }
    if (item.warnings !== undefined && !isStringArray(item.warnings)) {
      issues.push(fieldError(`${path}.warnings`, "item_warnings_invalid", "warnings must be an array of strings when provided."));
    }

    if (
      isFiniteNonNegativeNumber(item.start_ms) &&
      isValidDuration(item.duration_ms, policy.allow_zero_duration_items) &&
      isFiniteNonNegativeNumber(item.end_ms) &&
      item.end_ms !== item.start_ms + item.duration_ms
    ) {
      issues.push(
        createTimelineValidationIssue(
          `${path}.end_ms`,
          policy.end_mismatch_severity,
          "item_end_ms_mismatch",
          "end_ms should equal start_ms + duration_ms.",
          itemId === null ? {} : { item_ids: [itemId] }
        )
      );
    }

    if (itemId !== null && assetId !== null && trackId !== null) {
      parsed.push({
        item_id: itemId,
        asset_id: assetId,
        track_id: trackId,
        item_type: itemType,
        end_ms: isFiniteNonNegativeNumber(item.end_ms) ? item.end_ms : null,
        enabled: typeof enabled === "boolean" ? enabled : true
      });
    }
  });
  return parsed;
}

function validateReferences(
  items: readonly ValidatedItem[],
  assets: readonly AssetShape[],
  tracks: readonly TrackShape[],
  issues: TimelineValidationIssue[]
): void {
  const assetIds = new Set(assets.map((asset) => asset.asset_id));
  const trackIds = new Set(tracks.map((track) => track.track_id));

  for (const item of items) {
    if (!assetIds.has(item.asset_id)) {
      issues.push(
        createTimelineValidationIssue(
          "$.timeline.items",
          "error",
          "missing_asset_reference",
          `Timeline item "${item.item_id}" references missing asset_id "${item.asset_id}".`,
          { item_ids: [item.item_id], asset_ids: [item.asset_id] }
        )
      );
    }
    if (!trackIds.has(item.track_id)) {
      issues.push(
        createTimelineValidationIssue(
          "$.timeline.items",
          "error",
          "missing_track_reference",
          `Timeline item "${item.item_id}" references missing track_id "${item.track_id}".`,
          { item_ids: [item.item_id], track_ids: [item.track_id] }
        )
      );
    }
  }
}

function validateCaptions(captions: readonly unknown[], issues: TimelineValidationIssue[]): void {
  captions.forEach((caption, index) => {
    const path = `$.captions[${index}]`;
    if (!isRecord(caption)) {
      issues.push(fieldError(path, "caption_invalid", "caption must be an object."));
      return;
    }
    if (caption.start_ms !== undefined && !isFiniteNonNegativeNumber(caption.start_ms)) {
      issues.push(fieldError(`${path}.start_ms`, "caption_start_ms_invalid", "caption start_ms must be finite and non-negative."));
    }
    if (caption.end_ms !== undefined && !isFiniteNonNegativeNumber(caption.end_ms)) {
      issues.push(fieldError(`${path}.end_ms`, "caption_end_ms_invalid", "caption end_ms must be finite and non-negative."));
    }
    if (
      isFiniteNonNegativeNumber(caption.start_ms) &&
      isFiniteNonNegativeNumber(caption.end_ms) &&
      caption.end_ms < caption.start_ms
    ) {
      issues.push(fieldError(`${path}.end_ms`, "caption_timing_invalid", "caption end_ms must not be before start_ms."));
    }
    if (caption.reading_speed_wpm === undefined || caption.reading_speed_wpm === null) {
      issues.push(warning(`${path}.reading_speed_wpm`, "caption_reading_speed_missing", "caption reading_speed_wpm is not supplied."));
    }
    if (caption.warnings !== undefined && !isStringArray(caption.warnings)) {
      issues.push(fieldError(`${path}.warnings`, "caption_warnings_invalid", "caption warnings must be an array of strings."));
    }
  });
}

function validateMarkers(markers: readonly unknown[], issues: TimelineValidationIssue[]): void {
  markers.forEach((marker, index) => {
    const path = `$.timeline.markers[${index}]`;
    if (!isRecord(marker)) {
      issues.push(warning(path, "marker_invalid", "marker should be an object."));
      return;
    }
    if (readNonEmptyString(marker.marker_id) === null) {
      issues.push(warning(`${path}.marker_id`, "marker_id_missing", "marker_id should be a non-empty string."));
    }
    if (!isFiniteNonNegativeNumber(marker.time_ms)) {
      issues.push(warning(`${path}.time_ms`, "marker_time_ms_invalid", "marker time_ms should be finite and non-negative."));
    }
    if (readNonEmptyString(marker.label) === null) {
      issues.push(warning(`${path}.label`, "marker_label_missing", "marker label should be a non-empty string."));
    }
    if (readNonEmptyString(marker.marker_type) === null) {
      issues.push(warning(`${path}.marker_type`, "marker_type_missing", "marker_type should be a non-empty string."));
    }
  });
}

function parseItemType(value: unknown, path: string, issues: TimelineValidationIssue[]): TimelineItemType {
  if (typeof value !== "string") {
    issues.push(fieldError(`${path}.item_type`, "item_type_invalid", "item_type must be a known timeline item type."));
    return "unknown";
  }
  if (!KNOWN_ITEM_TYPES.has(value as TimelineItemType)) {
    issues.push(fieldError(`${path}.item_type`, "item_type_invalid", "item_type must be a known timeline item type."));
    return "unknown";
  }
  if (value === "unknown") {
    issues.push(warning(`${path}.item_type`, "item_type_unknown", "item_type is unknown."));
  }
  return value as TimelineItemType;
}

function validateDuplicateIds(
  ids: readonly string[],
  path: string,
  code: string,
  message: string,
  issues: TimelineValidationIssue[]
): void {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) duplicates.add(id);
    seen.add(id);
  }
  for (const id of duplicates) {
    const refs = code.includes("item") ? { item_ids: [id] } : {};
    issues.push(createTimelineValidationIssue(path, "error", code, message, refs));
  }
}

function parseValidationPolicy(value: unknown): TimelineSchemaCheckPolicy {
  if (!isRecord(value)) return DEFAULT_POLICY;
  return {
    end_mismatch_severity: parseSeverity(value.end_mismatch_severity, DEFAULT_POLICY.end_mismatch_severity),
    metadata_hint_without_evidence_severity: parseSeverity(
      value.metadata_hint_without_evidence_severity,
      DEFAULT_POLICY.metadata_hint_without_evidence_severity
    ),
    allow_zero_duration_items:
      typeof value.allow_zero_duration_items === "boolean"
        ? value.allow_zero_duration_items
        : DEFAULT_POLICY.allow_zero_duration_items
  };
}

function parseSeverity(value: unknown, fallback: TimelineValidationSeverity): TimelineValidationSeverity {
  return value === "warning" || value === "error" ? value : fallback;
}

function parseArray(
  value: unknown,
  path: string,
  code: string,
  issues: TimelineValidationIssue[]
): readonly unknown[] {
  if (value === undefined) return [];
  if (Array.isArray(value)) return value;
  issues.push(fieldError(path, code, `${path} must be an array when provided.`));
  return [];
}

function parseOptionalArray(
  value: unknown,
  path: string,
  code: string,
  issues: TimelineValidationIssue[]
): readonly unknown[] {
  if (value === undefined) return [];
  if (Array.isArray(value)) return value;
  issues.push(fieldError(path, code, `${path} must be an array when provided.`));
  return [];
}

function parseOptionalStringArray(
  value: unknown,
  path: string,
  code: string,
  issues: TimelineValidationIssue[]
): void {
  if (value !== undefined && !isStringArray(value)) {
    issues.push(fieldError(path, code, `${path} must be an array of strings when provided.`));
  }
}

function createResult(
  issues: readonly TimelineValidationIssue[],
  summary: Partial<TimelineValidationSummary>
): TimelineValidationResult {
  const issueCodes = issues.map((issue) => issue.code);
  return createTimelineValidationResult({
    issues,
    summary,
    checks: [
      createTimelineValidationCheck("timeline_present", hasIssue(issues, "timeline_missing", "timeline_invalid") ? "fail" : "pass", "Timeline object was checked.", issueCodes),
      createTimelineValidationCheck("timeline_required_fields_checked", hasAnyError(issues) ? "warning" : "pass", "Timeline required fields were checked.", issueCodes),
      createTimelineValidationCheck("timeline_items_checked", "pass", "Timeline items were checked.", issueCodes),
      createTimelineValidationCheck("timeline_tracks_checked", "pass", "Timeline tracks were checked.", issueCodes),
      createTimelineValidationCheck("timeline_references_checked", "pass", "Timeline references were checked.", issueCodes),
      createTimelineValidationCheck("timeline_summary_created", "pass", "Timeline summary was created.", []),
      createTimelineValidationCheck("supplied_state_only_confirmed", "pass", "No files, media probes, shell commands, network calls, or mutations were performed.", [])
    ]
  }) as TimelineValidationResult;
}

function createSummary(overrides: Partial<TimelineValidationSummary>): Partial<TimelineValidationSummary> {
  return overrides;
}

function hasIssue(issues: readonly TimelineValidationIssue[], ...codes: readonly string[]): boolean {
  return issues.some((issue) => codes.includes(issue.code));
}

function hasAnyError(issues: readonly TimelineValidationIssue[]): boolean {
  return issues.some((issue) => issue.severity === "error");
}

function getMaxEnd(items: readonly ValidatedItem[]): number | null {
  const ends = items
    .map((item) => item.end_ms)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  return ends.length === 0 ? null : Math.max(...ends);
}

function readNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function readFiniteNonNegative(value: unknown): number | null {
  return isFiniteNonNegativeNumber(value) ? value : null;
}

function isValidDuration(value: unknown, allowZero: boolean): value is number {
  return allowZero ? isFiniteNonNegativeNumber(value) : isFinitePositiveNumber(value);
}

function isIntegerLikeNonNegative(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && Number.isInteger(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function isTransitionShape(value: unknown): boolean {
  return value === null || typeof value === "string" || isRecord(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fieldError(path: string, code: string, message: string): TimelineValidationIssue {
  return createTimelineValidationIssue(path, "error", code, message);
}

function warning(path: string, code: string, message: string): TimelineValidationIssue {
  return createTimelineValidationIssue(path, "warning", code, message);
}

function createCheck(check_id: string, label: string): CalebCheck {
  return { check_id, label, status: "completed", severity: "info" };
}

function createWarning(warning_id: string, message: string): CalebWarning {
  return { warning_id, message, severity: "warning" };
}

export const timelineSchemaCheckHollow = timelineSchemaCheckImplementation;

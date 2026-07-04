import { assertSafeMediaRelativePath } from "../../hollows/categories/media/mediaPathSafety.js";
import type {
  HollowcutAssetType,
  HollowcutExpectedMediaType,
  HollowcutExportFormat,
  HollowcutExportPlatform,
  HollowcutExportProfile,
  HollowcutExportStatus,
  HollowcutProject,
  HollowcutProjectValidationIssue,
  HollowcutProjectValidationResult,
  HollowcutProjectValidationSeverity,
  HollowcutProjectValidationSummary,
  HollowcutQualityPreset,
  HollowcutTrackType,
  HollowcutValidationCheckStatus,
  HollowcutValidationStatus
} from "./hollowcutProjectTypes.js";

const ASSET_TYPES = new Set<HollowcutAssetType>(["image", "audio", "video", "text", "unknown"]);
const EXPECTED_MEDIA_TYPES = new Set<HollowcutExpectedMediaType>(["image", "audio", "video", "unknown"]);
const TRACK_TYPES = new Set<HollowcutTrackType>(["visual", "audio", "caption", "narration", "effect"]);
const EXPORT_PLATFORMS = new Set<HollowcutExportPlatform>([
  "youtube",
  "youtube_shorts",
  "tiktok",
  "instagram",
  "custom"
]);
const EXPORT_FORMATS = new Set<HollowcutExportFormat>(["mp4", "webm", "mov", "png_sequence", "json_manifest"]);
const QUALITY_PRESETS = new Set<HollowcutQualityPreset>(["draft", "standard", "high"]);
const EXPORT_STATUSES = new Set<HollowcutExportStatus>(["planned", "validated", "exported"]);
const VALIDATION_STATUSES = new Set<HollowcutValidationStatus>([
  "not_validated",
  "valid",
  "warnings",
  "invalid"
]);
const VALIDATION_CHECK_STATUSES = new Set<HollowcutValidationCheckStatus>([
  "pass",
  "warning",
  "fail",
  "skipped"
]);

export function createHollowcutValidationIssue(
  path: string,
  severity: HollowcutProjectValidationSeverity,
  code: string,
  message: string
): HollowcutProjectValidationIssue {
  return { path, severity, code, message };
}

export function validateHollowcutProject(candidate: unknown): HollowcutProjectValidationResult {
  const issues: HollowcutProjectValidationIssue[] = [];

  if (!isRecord(candidate)) {
    issues.push(
      createHollowcutValidationIssue("$", "error", "project_not_object", "Hollowcut project must be an object.")
    );
    return createValidationResult(candidate, issues);
  }

  validateRequiredString(candidate, "schema_version", "$.schema_version", issues);
  validateRequiredString(candidate, "project_id", "$.project_id", issues);
  validateRequiredString(candidate, "project_name", "$.project_name", issues);
  validateRequiredString(candidate, "created_at", "$.created_at", issues, { isoLike: true });
  validateRequiredString(candidate, "updated_at", "$.updated_at", issues, { isoLike: true });
  const projectRoot = validateProjectRoot(candidate.project_root, "$.project_root", issues);

  const assets = validateRequiredArray(candidate, "assets", "$.assets", issues);
  const tracks = validateRequiredArray(candidate, "tracks", "$.tracks", issues);
  const captions = validateRequiredArray(candidate, "captions", "$.captions", issues);
  const exportTargets = validateRequiredArray(candidate, "export_targets", "$.export_targets", issues);
  validateStringArray(candidate.ledger_refs, "$.ledger_refs", issues, { required: true });
  validateStringArray(candidate.artifact_refs, "$.artifact_refs", issues, { required: true });

  if (Array.isArray(candidate.ledger_refs) && candidate.ledger_refs.length === 0) {
    issues.push(
      createHollowcutValidationIssue(
        "$.ledger_refs",
        "warning",
        "ledger_refs_empty",
        "Project has no Ledger refs yet; refs remain references only and do not invent evidence."
      )
    );
  }

  if (assets) {
    const seenAssetIds = new Set<string>();
    assets.forEach((asset, index) => {
      const assetPath = `$.assets[${index}]`;
      issues.push(...validateHollowcutProjectAsset(asset, { path: assetPath, projectRoot }));
      const assetId = getRecordString(asset, "asset_id");
      if (assetId) {
        if (seenAssetIds.has(assetId)) {
          issues.push(
            createHollowcutValidationIssue(assetPath, "error", "duplicate_asset_id", `Duplicate asset_id '${assetId}'.`)
          );
        }
        seenAssetIds.add(assetId);
      }
    });
  }

  if (isRecord(candidate.timeline)) {
    issues.push(...validateHollowcutTimeline(candidate.timeline, { path: "$.timeline" }));
  } else {
    issues.push(
      createHollowcutValidationIssue("$.timeline", "error", "timeline_invalid", "timeline must be an object.")
    );
  }

  if (tracks) {
    const seenTrackIds = new Set<string>();
    tracks.forEach((track, index) => {
      const trackPath = `$.tracks[${index}]`;
      issues.push(...validateTrack(track, trackPath));
      const trackId = getRecordString(track, "track_id");
      if (trackId) {
        if (seenTrackIds.has(trackId)) {
          issues.push(
            createHollowcutValidationIssue(trackPath, "error", "duplicate_track_id", `Duplicate track_id '${trackId}'.`)
          );
        }
        seenTrackIds.add(trackId);
      }
    });
  }

  if (captions) {
    captions.forEach((caption, index) => {
      issues.push(...validateCaption(caption, `$.captions[${index}]`));
    });
  }

  if (isRecord(candidate.narration)) {
    issues.push(...validateNarration(candidate.narration, "$.narration"));
  } else {
    issues.push(
      createHollowcutValidationIssue("$.narration", "error", "narration_invalid", "narration must be an object.")
    );
  }

  if (exportTargets) {
    exportTargets.forEach((target, index) => {
      issues.push(...validateExportTarget(target, `$.export_targets[${index}]`));
    });
  }

  if (isRecord(candidate.validation_state)) {
    issues.push(...validateValidationState(candidate.validation_state, "$.validation_state"));
  } else {
    issues.push(
      createHollowcutValidationIssue(
        "$.validation_state",
        "error",
        "validation_state_invalid",
        "validation_state must be an object."
      )
    );
  }

  if (!isRecord(candidate.provenance)) {
    issues.push(
      createHollowcutValidationIssue("$.provenance", "error", "provenance_invalid", "provenance must be an object.")
    );
  }

  issues.push(...validateHollowcutProjectReferences(candidate));

  return createValidationResult(candidate, issues);
}

export function isHollowcutProject(candidate: unknown): candidate is HollowcutProject {
  return validateHollowcutProject(candidate).valid;
}

export function validateHollowcutProjectAsset(
  candidate: unknown,
  options: { path?: string; projectRoot?: string } = {}
): HollowcutProjectValidationIssue[] {
  const path = options.path ?? "$.asset";
  const projectRoot = options.projectRoot ?? ".";
  const issues: HollowcutProjectValidationIssue[] = [];

  if (!isRecord(candidate)) {
    return [createHollowcutValidationIssue(path, "error", "asset_invalid", "Asset must be an object.")];
  }

  validateRequiredString(candidate, "asset_id", `${path}.asset_id`, issues);
  validateRequiredString(candidate, "display_name", `${path}.display_name`, issues);
  validateEnum(candidate.asset_type, ASSET_TYPES, `${path}.asset_type`, "asset_type_invalid", issues);

  if ("expected_media_type" in candidate && candidate.expected_media_type !== undefined) {
    validateEnum(
      candidate.expected_media_type,
      EXPECTED_MEDIA_TYPES,
      `${path}.expected_media_type`,
      "expected_media_type_invalid",
      issues
    );
  }

  if ("relative_path" in candidate && candidate.relative_path !== undefined) {
    if (typeof candidate.relative_path !== "string" || candidate.relative_path.trim().length === 0) {
      issues.push(
        createHollowcutValidationIssue(
          `${path}.relative_path`,
          "error",
          "asset_relative_path_invalid",
          "Asset relative_path must be a non-empty string when present."
        )
      );
    } else {
      try {
        assertSafeMediaRelativePath(projectRoot, candidate.relative_path);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Asset relative_path is unsafe.";
        issues.push(
          createHollowcutValidationIssue(
            `${path}.relative_path`,
            "error",
            "asset_relative_path_unsafe",
            message
          )
        );
      }
    }
  }

  if ("metadata_hint" in candidate && candidate.metadata_hint !== undefined && !isRecord(candidate.metadata_hint)) {
    issues.push(
      createHollowcutValidationIssue(
        `${path}.metadata_hint`,
        "error",
        "metadata_hint_invalid",
        "metadata_hint must be an object when present."
      )
    );
  }

  if (
    "verified_metadata" in candidate &&
    candidate.verified_metadata !== null &&
    candidate.verified_metadata !== undefined &&
    !isRecord(candidate.verified_metadata)
  ) {
    issues.push(
      createHollowcutValidationIssue(
        `${path}.verified_metadata`,
        "error",
        "verified_metadata_invalid",
        "verified_metadata must be an object or null when present."
      )
    );
  }

  const evidenceRefs = validateStringArray(candidate.evidence_refs, `${path}.evidence_refs`, issues, {
    required: true
  });
  validateStringArray(candidate.warnings, `${path}.warnings`, issues, { required: true });

  if (isRecord(candidate.metadata_hint) && !isRecord(candidate.verified_metadata) && evidenceRefs?.length === 0) {
    issues.push(
      createHollowcutValidationIssue(
        `${path}.metadata_hint`,
        "warning",
        "metadata_hint_unverified",
        "metadata_hint is caller-supplied planning data and is not verified evidence."
      )
    );
  }

  if (isRecord(candidate.verified_metadata) && evidenceRefs?.length === 0) {
    issues.push(
      createHollowcutValidationIssue(
        `${path}.verified_metadata`,
        "warning",
        "verified_metadata_without_evidence_refs",
        "verified_metadata is present without evidence_refs."
      )
    );
  }

  return issues;
}

export function validateHollowcutTimeline(
  candidate: unknown,
  options: { path?: string } = {}
): HollowcutProjectValidationIssue[] {
  const path = options.path ?? "$.timeline";
  const issues: HollowcutProjectValidationIssue[] = [];

  if (!isRecord(candidate)) {
    return [createHollowcutValidationIssue(path, "error", "timeline_invalid", "timeline must be an object.")];
  }

  validateRequiredString(candidate, "timeline_id", `${path}.timeline_id`, issues);
  validateFiniteNumber(candidate.duration_ms, `${path}.duration_ms`, "timeline_duration_invalid", issues, {
    min: 0
  });
  validateFiniteNumber(candidate.fps, `${path}.fps`, "timeline_fps_invalid", issues, { min: 0, positive: true });
  validateFiniteNumber(candidate.width, `${path}.width`, "timeline_width_invalid", issues, { min: 0, positive: true });
  validateFiniteNumber(candidate.height, `${path}.height`, "timeline_height_invalid", issues, {
    min: 0,
    positive: true
  });
  validateRequiredString(candidate, "aspect_ratio", `${path}.aspect_ratio`, issues);

  const items = validateRequiredArray(candidate, "items", `${path}.items`, issues);
  if (items) {
    items.forEach((item, index) => {
      issues.push(...validateTimelineItem(item, `${path}.items[${index}]`));
    });
  }

  return issues;
}

export function validateHollowcutProjectReferences(candidate: unknown): HollowcutProjectValidationIssue[] {
  const issues: HollowcutProjectValidationIssue[] = [];
  if (!isRecord(candidate)) {
    return issues;
  }

  const assets = Array.isArray(candidate.assets) ? candidate.assets : [];
  const tracks = Array.isArray(candidate.tracks) ? candidate.tracks : [];
  const timeline = isRecord(candidate.timeline) ? candidate.timeline : null;
  const assetIds = new Set(assets.map((asset) => getRecordString(asset, "asset_id")).filter(isString));
  const trackIds = new Set(tracks.map((track) => getRecordString(track, "track_id")).filter(isString));
  const timelineItems = timeline && Array.isArray(timeline.items) ? timeline.items : [];
  const timelineItemIds = new Set(timelineItems.map((item) => getRecordString(item, "item_id")).filter(isString));

  timelineItems.forEach((item, index) => {
    const path = `$.timeline.items[${index}]`;
    const assetId = getRecordString(item, "asset_id");
    const trackId = getRecordString(item, "track_id");
    if (assetId && !assetIds.has(assetId)) {
      issues.push(
        createHollowcutValidationIssue(
          `${path}.asset_id`,
          "error",
          "timeline_item_missing_asset_reference",
          `Timeline item references missing asset_id '${assetId}'.`
        )
      );
    }
    if (trackId && !trackIds.has(trackId)) {
      issues.push(
        createHollowcutValidationIssue(
          `${path}.track_id`,
          "error",
          "timeline_item_missing_track_reference",
          `Timeline item references missing track_id '${trackId}'.`
        )
      );
    }
  });

  tracks.forEach((track, index) => {
    if (!isRecord(track) || !Array.isArray(track.items)) {
      return;
    }
    track.items.forEach((itemId, itemIndex) => {
      if (typeof itemId === "string" && !timelineItemIds.has(itemId)) {
        issues.push(
          createHollowcutValidationIssue(
            `$.tracks[${index}].items[${itemIndex}]`,
            "warning",
            "track_item_reference_missing",
            `Track item reference '${itemId}' does not exist in timeline.items.`
          )
        );
      }
    });
  });

  const narration = isRecord(candidate.narration) ? candidate.narration : null;
  if (narration && typeof narration.audio_asset_id === "string" && !assetIds.has(narration.audio_asset_id)) {
    issues.push(
      createHollowcutValidationIssue(
        "$.narration.audio_asset_id",
        "warning",
        "narration_audio_asset_missing",
        `Narration audio_asset_id '${narration.audio_asset_id}' does not reference a known asset.`
      )
    );
  }

  return issues;
}

function validateTimelineItem(candidate: unknown, path: string): HollowcutProjectValidationIssue[] {
  const issues: HollowcutProjectValidationIssue[] = [];
  if (!isRecord(candidate)) {
    return [createHollowcutValidationIssue(path, "error", "timeline_item_invalid", "Timeline item must be an object.")];
  }

  validateRequiredString(candidate, "item_id", `${path}.item_id`, issues);
  validateRequiredString(candidate, "asset_id", `${path}.asset_id`, issues);
  validateRequiredString(candidate, "track_id", `${path}.track_id`, issues);
  const startValid = validateFiniteNumber(candidate.start_ms, `${path}.start_ms`, "timeline_item_start_invalid", issues, {
    min: 0
  });
  const durationValid = validateFiniteNumber(
    candidate.duration_ms,
    `${path}.duration_ms`,
    "timeline_item_duration_invalid",
    issues,
    { min: 0 }
  );
  const endValid = validateFiniteNumber(candidate.end_ms, `${path}.end_ms`, "timeline_item_end_invalid", issues, {
    min: 0
  });

  validateNullableString(candidate.transition_in, `${path}.transition_in`, "transition_in_invalid", issues);
  validateNullableString(candidate.transition_out, `${path}.transition_out`, "transition_out_invalid", issues);
  validateObjectArray(candidate.effects, `${path}.effects`, issues, { required: true });
  validateStringArray(candidate.warnings, `${path}.warnings`, issues, { required: true });

  if (
    startValid &&
    durationValid &&
    endValid &&
    typeof candidate.start_ms === "number" &&
    typeof candidate.duration_ms === "number" &&
    typeof candidate.end_ms === "number" &&
    candidate.end_ms !== candidate.start_ms + candidate.duration_ms
  ) {
    issues.push(
      createHollowcutValidationIssue(
        `${path}.end_ms`,
        "warning",
        "timeline_item_end_mismatch",
        "Timeline item end_ms should equal start_ms + duration_ms."
      )
    );
  }

  return issues;
}

function validateTrack(candidate: unknown, path: string): HollowcutProjectValidationIssue[] {
  const issues: HollowcutProjectValidationIssue[] = [];
  if (!isRecord(candidate)) {
    return [createHollowcutValidationIssue(path, "error", "track_invalid", "Track must be an object.")];
  }

  validateRequiredString(candidate, "track_id", `${path}.track_id`, issues);
  validateEnum(candidate.track_type, TRACK_TYPES, `${path}.track_type`, "track_type_invalid", issues);
  validateRequiredString(candidate, "name", `${path}.name`, issues);
  validateBoolean(candidate.locked, `${path}.locked`, "track_locked_invalid", issues);
  validateBoolean(candidate.muted, `${path}.muted`, "track_muted_invalid", issues);
  validateStringArray(candidate.items, `${path}.items`, issues, { required: true });

  return issues;
}

function validateCaption(candidate: unknown, path: string): HollowcutProjectValidationIssue[] {
  const issues: HollowcutProjectValidationIssue[] = [];
  if (!isRecord(candidate)) {
    return [createHollowcutValidationIssue(path, "error", "caption_invalid", "Caption must be an object.")];
  }

  validateRequiredString(candidate, "caption_id", `${path}.caption_id`, issues);
  validateRequiredString(candidate, "text", `${path}.text`, issues, { allowEmpty: true });
  const startValid = validateFiniteNumber(candidate.start_ms, `${path}.start_ms`, "caption_start_invalid", issues, {
    min: 0
  });
  const endValid = validateFiniteNumber(candidate.end_ms, `${path}.end_ms`, "caption_end_invalid", issues, { min: 0 });
  validateNullableString(candidate.style_ref, `${path}.style_ref`, "caption_style_ref_invalid", issues);
  if (candidate.reading_speed_wpm === null) {
    issues.push(
      createHollowcutValidationIssue(
        `${path}.reading_speed_wpm`,
        "warning",
        "caption_reading_speed_missing",
        "Caption reading speed validation is deferred and reading_speed_wpm is null."
      )
    );
  } else {
    validateFiniteNumber(
      candidate.reading_speed_wpm,
      `${path}.reading_speed_wpm`,
      "caption_reading_speed_invalid",
      issues,
      { min: 0, positive: true }
    );
  }
  validateStringArray(candidate.warnings, `${path}.warnings`, issues, { required: true });

  if (
    startValid &&
    endValid &&
    typeof candidate.start_ms === "number" &&
    typeof candidate.end_ms === "number" &&
    candidate.end_ms < candidate.start_ms
  ) {
    issues.push(
      createHollowcutValidationIssue(
        `${path}.end_ms`,
        "error",
        "caption_timing_invalid",
        "Caption end_ms must be greater than or equal to start_ms."
      )
    );
  }

  return issues;
}

function validateNarration(candidate: Record<string, unknown>, path: string): HollowcutProjectValidationIssue[] {
  const issues: HollowcutProjectValidationIssue[] = [];

  validateRequiredString(candidate, "script", `${path}.script`, issues, { allowEmpty: true });
  validateNullableString(candidate.voice_profile, `${path}.voice_profile`, "narration_voice_profile_invalid", issues);
  if (candidate.estimated_duration_ms !== null) {
    validateFiniteNumber(
      candidate.estimated_duration_ms,
      `${path}.estimated_duration_ms`,
      "narration_estimated_duration_invalid",
      issues,
      { min: 0 }
    );
  }
  validateNullableString(candidate.audio_asset_id, `${path}.audio_asset_id`, "narration_audio_asset_id_invalid", issues);
  validateStringArray(candidate.evidence_refs, `${path}.evidence_refs`, issues, { required: true });

  return issues;
}

function validateExportTarget(candidate: unknown, path: string): HollowcutProjectValidationIssue[] {
  const issues: HollowcutProjectValidationIssue[] = [];
  if (!isRecord(candidate)) {
    return [createHollowcutValidationIssue(path, "error", "export_target_invalid", "Export target must be an object.")];
  }

  validateRequiredString(candidate, "target_id", `${path}.target_id`, issues);
  validateEnum(candidate.platform, EXPORT_PLATFORMS, `${path}.platform`, "export_platform_invalid", issues);
  validateFiniteNumber(candidate.width, `${path}.width`, "export_width_invalid", issues, { min: 0, positive: true });
  validateFiniteNumber(candidate.height, `${path}.height`, "export_height_invalid", issues, { min: 0, positive: true });
  validateFiniteNumber(candidate.fps, `${path}.fps`, "export_fps_invalid", issues, { min: 0, positive: true });
  validateRequiredString(candidate, "format", `${path}.format`, issues);
  validateEnum(candidate.status, EXPORT_STATUSES, `${path}.status`, "export_status_invalid", issues);
  validateNullableString(candidate.output_path, `${path}.output_path`, "export_output_path_invalid", issues);
  validateBoolean(candidate.requires_approval, `${path}.requires_approval`, "export_requires_approval_invalid", issues);
  validateStringArray(candidate.warnings, `${path}.warnings`, issues, { required: true });

  if (candidate.status === "exported" && candidate.output_path === null) {
    issues.push(
      createHollowcutValidationIssue(
        `${path}.output_path`,
        "warning",
        "exported_status_without_output_path",
        "Export target status is exported but output_path is null."
      )
    );
  }

  return issues;
}

function validateValidationState(candidate: Record<string, unknown>, path: string): HollowcutProjectValidationIssue[] {
  const issues: HollowcutProjectValidationIssue[] = [];

  validateNullableString(
    candidate.last_validated_at,
    `${path}.last_validated_at`,
    "validation_state_last_validated_invalid",
    issues
  );
  validateEnum(
    candidate.validation_status,
    VALIDATION_STATUSES,
    `${path}.validation_status`,
    "validation_status_invalid",
    issues
  );
  if (candidate.validation_status === "not_validated") {
    issues.push(
      createHollowcutValidationIssue(
        `${path}.validation_status`,
        "warning",
        "validation_state_not_validated",
        "Project validation_state is not_validated."
      )
    );
  }

  const checks = validateRequiredArray(candidate, "checks", `${path}.checks`, issues);
  if (checks) {
    checks.forEach((check, index) => {
      issues.push(...validateValidationCheck(check, `${path}.checks[${index}]`));
    });
  }
  validateStringArray(candidate.warnings, `${path}.warnings`, issues, { required: true });
  validateStringArray(candidate.errors, `${path}.errors`, issues, { required: true });
  validateStringArray(candidate.evidence_refs, `${path}.evidence_refs`, issues, { required: true });
  validateStringArray(candidate.report_refs, `${path}.report_refs`, issues, { required: true });

  return issues;
}

function validateValidationCheck(candidate: unknown, path: string): HollowcutProjectValidationIssue[] {
  const issues: HollowcutProjectValidationIssue[] = [];
  if (!isRecord(candidate)) {
    return [
      createHollowcutValidationIssue(path, "error", "validation_check_invalid", "Validation check must be an object.")
    ];
  }
  validateRequiredString(candidate, "check_id", `${path}.check_id`, issues);
  validateEnum(candidate.status, VALIDATION_CHECK_STATUSES, `${path}.status`, "validation_check_status_invalid", issues);
  validateRequiredString(candidate, "message", `${path}.message`, issues, { allowEmpty: true });
  validateStringArray(candidate.evidence_refs, `${path}.evidence_refs`, issues, { required: true });
  return issues;
}

function createValidationResult(
  candidate: unknown,
  issues: HollowcutProjectValidationIssue[]
): HollowcutProjectValidationResult {
  const errorCount = issues.filter((issue) => issue.severity === "error").length;
  const warningCount = issues.filter((issue) => issue.severity === "warning").length;

  return {
    valid: errorCount === 0,
    warning_count: warningCount,
    error_count: errorCount,
    issues,
    normalized_summary: createSummary(candidate)
  };
}

function createSummary(candidate: unknown): HollowcutProjectValidationSummary {
  if (!isRecord(candidate)) {
    return {
      project_id: null,
      project_name: null,
      asset_count: 0,
      track_count: 0,
      timeline_item_count: 0,
      caption_count: 0,
      export_target_count: 0,
      ledger_ref_count: 0,
      artifact_ref_count: 0
    };
  }

  const timeline = isRecord(candidate.timeline) ? candidate.timeline : null;

  return {
    project_id: typeof candidate.project_id === "string" ? candidate.project_id : null,
    project_name: typeof candidate.project_name === "string" ? candidate.project_name : null,
    asset_count: Array.isArray(candidate.assets) ? candidate.assets.length : 0,
    track_count: Array.isArray(candidate.tracks) ? candidate.tracks.length : 0,
    timeline_item_count: timeline && Array.isArray(timeline.items) ? timeline.items.length : 0,
    caption_count: Array.isArray(candidate.captions) ? candidate.captions.length : 0,
    export_target_count: Array.isArray(candidate.export_targets) ? candidate.export_targets.length : 0,
    ledger_ref_count: Array.isArray(candidate.ledger_refs) ? candidate.ledger_refs.length : 0,
    artifact_ref_count: Array.isArray(candidate.artifact_refs) ? candidate.artifact_refs.length : 0
  };
}

function validateProjectRoot(
  value: unknown,
  path: string,
  issues: HollowcutProjectValidationIssue[]
): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push(
      createHollowcutValidationIssue(path, "error", "project_root_invalid", "project_root must be a non-empty string.")
    );
    return ".";
  }
  return value;
}

function validateRequiredString(
  record: Record<string, unknown>,
  key: string,
  path: string,
  issues: HollowcutProjectValidationIssue[],
  options: { allowEmpty?: boolean; isoLike?: boolean } = {}
): boolean {
  if (!(key in record)) {
    issues.push(createHollowcutValidationIssue(path, "error", `${key}_missing`, `${key} is required.`));
    return false;
  }
  const value = record[key];
  if (typeof value !== "string" || (!options.allowEmpty && value.trim().length === 0)) {
    issues.push(
      createHollowcutValidationIssue(path, "error", `${key}_invalid`, `${key} must be a non-empty string.`)
    );
    return false;
  }
  if (options.isoLike && !isIsoLikeString(value)) {
    issues.push(
      createHollowcutValidationIssue(path, "warning", `${key}_not_iso_like`, `${key} should be an ISO timestamp string.`)
    );
  }
  return true;
}

function validateRequiredArray(
  record: Record<string, unknown>,
  key: string,
  path: string,
  issues: HollowcutProjectValidationIssue[]
): unknown[] | null {
  if (!(key in record)) {
    issues.push(createHollowcutValidationIssue(path, "error", `${key}_missing`, `${key} is required.`));
    return null;
  }
  const value = record[key];
  if (!Array.isArray(value)) {
    issues.push(createHollowcutValidationIssue(path, "error", `${key}_invalid`, `${key} must be an array.`));
    return null;
  }
  return value;
}

function validateStringArray(
  value: unknown,
  path: string,
  issues: HollowcutProjectValidationIssue[],
  options: { required?: boolean } = {}
): string[] | null {
  if (value === undefined) {
    if (options.required) {
      issues.push(createHollowcutValidationIssue(path, "error", "string_array_missing", `${path} is required.`));
    }
    return null;
  }
  if (!Array.isArray(value) || !value.every((entry) => typeof entry === "string")) {
    issues.push(createHollowcutValidationIssue(path, "error", "string_array_invalid", `${path} must be a string array.`));
    return null;
  }
  return value;
}

function validateObjectArray(
  value: unknown,
  path: string,
  issues: HollowcutProjectValidationIssue[],
  options: { required?: boolean } = {}
): Record<string, unknown>[] | null {
  if (value === undefined) {
    if (options.required) {
      issues.push(createHollowcutValidationIssue(path, "error", "object_array_missing", `${path} is required.`));
    }
    return null;
  }
  if (!Array.isArray(value) || !value.every(isRecord)) {
    issues.push(createHollowcutValidationIssue(path, "error", "object_array_invalid", `${path} must be an object array.`));
    return null;
  }
  return value;
}

function validateEnum<T extends string>(
  value: unknown,
  allowed: ReadonlySet<T>,
  path: string,
  code: string,
  issues: HollowcutProjectValidationIssue[]
): boolean {
  if (typeof value !== "string" || !allowed.has(value as T)) {
    issues.push(createHollowcutValidationIssue(path, "error", code, `${path} has an unsupported value.`));
    return false;
  }
  return true;
}

function validateFiniteNumber(
  value: unknown,
  path: string,
  code: string,
  issues: HollowcutProjectValidationIssue[],
  options: { min?: number; positive?: boolean } = {}
): boolean {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    issues.push(createHollowcutValidationIssue(path, "error", code, `${path} must be a finite number.`));
    return false;
  }
  if (options.positive && value <= 0) {
    issues.push(createHollowcutValidationIssue(path, "error", code, `${path} must be greater than zero.`));
    return false;
  }
  if (options.min !== undefined && value < options.min) {
    issues.push(createHollowcutValidationIssue(path, "error", code, `${path} must be at least ${options.min}.`));
    return false;
  }
  return true;
}

function validateBoolean(
  value: unknown,
  path: string,
  code: string,
  issues: HollowcutProjectValidationIssue[]
): boolean {
  if (typeof value !== "boolean") {
    issues.push(createHollowcutValidationIssue(path, "error", code, `${path} must be a boolean.`));
    return false;
  }
  return true;
}

function validateNullableString(
  value: unknown,
  path: string,
  code: string,
  issues: HollowcutProjectValidationIssue[]
): boolean {
  if (value !== null && typeof value !== "string") {
    issues.push(createHollowcutValidationIssue(path, "error", code, `${path} must be a string or null.`));
    return false;
  }
  return true;
}

function getRecordString(value: unknown, key: string): string | null {
  if (!isRecord(value)) {
    return null;
  }
  const field = value[key];
  return typeof field === "string" && field.trim().length > 0 ? field : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isIsoLikeString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T/.test(value);
}

// Deterministic supplied-state export_profile validator for export readiness Hollow input.
// All checks structural only. No side effects, no file access, no rendering/export logic.
export function validateHollowcutExportProfile(
  candidate: unknown,
  path: string = "$.export_profile"
): HollowcutProjectValidationIssue[] {
  const issues: HollowcutProjectValidationIssue[] = [];

  if (candidate === undefined || candidate === null) {
    // Missing is allowed per current contract (warning may be issued at readiness level if no targets).
    return issues;
  }

  if (!isRecord(candidate)) {
    issues.push(
      createHollowcutValidationIssue(path, "error", "export_profile_not_object", "export_profile must be an object when supplied.")
    );
    return issues;
  }

  const rec = candidate as Record<string, unknown>;

  // profile_id
  if ("profile_id" in rec && rec.profile_id !== undefined) {
    if (typeof rec.profile_id !== "string" || rec.profile_id.trim().length === 0) {
      issues.push(createHollowcutValidationIssue(`${path}.profile_id`, "error", "export_profile_id_invalid", "profile_id must be a non-empty string when supplied."));
    }
  }

  // target_platform (reuse existing platform set)
  if ("target_platform" in rec && rec.target_platform !== undefined) {
    const p = rec.target_platform;
    if (typeof p !== "string" || !EXPORT_PLATFORMS.has(p as HollowcutExportPlatform)) {
      issues.push(createHollowcutValidationIssue(`${path}.target_platform`, "error", "export_profile_platform_invalid", `target_platform must be one of ${Array.from(EXPORT_PLATFORMS).join(", ")} when supplied.`));
    }
  }

  // format
  if ("format" in rec && rec.format !== undefined) {
    const f = rec.format;
    if (typeof f !== "string" || !EXPORT_FORMATS.has(f as HollowcutExportFormat)) {
      issues.push(createHollowcutValidationIssue(`${path}.format`, "error", "export_profile_format_invalid", `format must be one of ${Array.from(EXPORT_FORMATS).join(", ")} when supplied.`));
    }
  }

  // width/height positive integers
  if ("width" in rec && rec.width !== undefined) {
    const w = rec.width;
    if (typeof w !== "number" || !Number.isFinite(w) || !Number.isInteger(w) || w <= 0) {
      issues.push(createHollowcutValidationIssue(`${path}.width`, "error", "export_profile_width_invalid", "width must be a positive integer when supplied."));
    }
  }
  if ("height" in rec && rec.height !== undefined) {
    const h = rec.height;
    if (typeof h !== "number" || !Number.isFinite(h) || !Number.isInteger(h) || h <= 0) {
      issues.push(createHollowcutValidationIssue(`${path}.height`, "error", "export_profile_height_invalid", "height must be a positive integer when supplied."));
    }
  }

  // fps positive number (reasonable structural range 1-240)
  if ("fps" in rec && rec.fps !== undefined) {
    const f = rec.fps;
    if (typeof f !== "number" || !Number.isFinite(f) || f <= 0 || f > 240) {
      issues.push(createHollowcutValidationIssue(`${path}.fps`, "error", "export_profile_fps_invalid", "fps must be a positive number (1-240) when supplied."));
    }
  }

  // duration_limit_ms positive
  if ("duration_limit_ms" in rec && rec.duration_limit_ms !== undefined) {
    const d = rec.duration_limit_ms;
    if (typeof d !== "number" || !Number.isFinite(d) || d <= 0) {
      issues.push(createHollowcutValidationIssue(`${path}.duration_limit_ms`, "error", "export_profile_duration_limit_invalid", "duration_limit_ms must be positive when supplied."));
    }
  }

  // include_audio / include_captions booleans
  if ("include_audio" in rec && rec.include_audio !== undefined) {
    if (typeof rec.include_audio !== "boolean") {
      issues.push(createHollowcutValidationIssue(`${path}.include_audio`, "error", "export_profile_include_audio_invalid", "include_audio must be a boolean when supplied."));
    }
  }
  if ("include_captions" in rec && rec.include_captions !== undefined) {
    if (typeof rec.include_captions !== "boolean") {
      issues.push(createHollowcutValidationIssue(`${path}.include_captions`, "error", "export_profile_include_captions_invalid", "include_captions must be a boolean when supplied."));
    }
  }

  // quality_preset
  if ("quality_preset" in rec && rec.quality_preset !== undefined) {
    const q = rec.quality_preset;
    if (typeof q !== "string" || !QUALITY_PRESETS.has(q as HollowcutQualityPreset)) {
      issues.push(createHollowcutValidationIssue(`${path}.quality_preset`, "error", "export_profile_quality_preset_invalid", `quality_preset must be one of ${Array.from(QUALITY_PRESETS).join(", ")} when supplied.`));
    }
  }

  // Unknown fields: warn (per convention for supplied planning data; does not block)
  const known = new Set(["profile_id", "target_platform", "format", "width", "height", "fps", "duration_limit_ms", "include_audio", "include_captions", "quality_preset"]);
  for (const k of Object.keys(rec)) {
    if (!known.has(k)) {
      issues.push(createHollowcutValidationIssue(`${path}.${k}`, "warning", "export_profile_unsupported_field", `Unsupported field '${k}' in export_profile (supplied-state only; ignored for structural checks).`));
    }
  }

  return issues;
}

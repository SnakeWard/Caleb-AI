import type { JsonValue } from "../../../types/common.js";
import type { CalebCheck, CalebWarning } from "../../../types/invocation.js";
import type { HollowImplementation } from "../../runnerTypes.js";
import {
  normalizeDurationMetadata,
  type NormalizedDurationMetadata
} from "./durationMetadataHelpers.js";
import type {
  MediaType,
  VideoDurationInput,
  VideoDurationMetadataHint,
  VideoDurationResult
} from "./mediaMetadataTypes.js";
import { videoDurationManifest as manifest } from "./mediaHollowManifests.js";
import { resolveSafeMediaPath } from "./mediaPathSafety.js";
import { getMediaTypeFromExtension } from "./mediaTypeHelpers.js";

export const videoDurationManifest = manifest;

export function inspectVideoDuration(input: VideoDurationInput): VideoDurationResult {
  const warnings: CalebWarning[] = [];
  const checks: CalebCheck[] = [];
  return inspectVideoDurationInternal(input, warnings, checks);
}

export const videoDurationImplementation: HollowImplementation = async ({ input_payload }) => {
  const input = parseVideoDurationInput(input_payload);
  const warnings: CalebWarning[] = [];
  const checks: CalebCheck[] = [];
  const result = inspectVideoDurationInternal(input, warnings, checks);
  syncResultWarnings(result.warnings, warnings);

  return {
    result: result as unknown as JsonValue,
    result_units: "duration_ms",
    checks,
    warnings,
    artifact_hashes: [],
    confidence_level: "provided_video_duration_metadata"
  };
};

function inspectVideoDurationInternal(
  input: VideoDurationInput,
  warnings: CalebWarning[],
  checks: CalebCheck[]
): VideoDurationResult {
  checks.push(createCheck("expected_media_type_checked", "Expected Media Type Checked"));
  validateExpectedMediaType(input, warnings);
  const extensionMediaType = getExtensionMediaType(input.relative_path);
  validateExtensionMediaType(extensionMediaType, warnings);
  maybeCheckPathSafety(input, warnings, checks);

  const metadataHint = input.metadata_hint;
  if (metadataHint !== undefined) {
    checks.push(createCheck("metadata_hint_present", "Metadata Hint Present"));
  }

  const frameRate = getFrameRateValidation(metadataHint?.frame_rate_hint);
  if (metadataHint?.frame_rate_hint !== undefined) {
    checks.push(createCheck("frame_rate_checked", "Frame Rate Checked"));
    if (!frameRate.valid) {
      warnings.push(createWarning("frame_rate_invalid", "frame_rate_hint must be a positive finite number."));
    }
  }

  const normalized = normalizeDurationMetadata(metadataHint);
  for (const warningId of normalized.warnings) {
    warnings.push(createWarning(warningId, `Video duration warning: ${warningId}.`));
  }

  if (!normalized.valid) {
    checks.push(createCheck("unsupported_media_reported", "Unsupported Media Reported"));
    return createResult(input, extensionMediaType, normalized, frameRate, warnings.map((warning) => warning.warning_id));
  }

  warnings.push(createWarning("metadata_hint_used", "Video duration came from metadata_hint."));
  checks.push(createCheck("duration_metadata_present", "Duration Metadata Present"));
  checks.push(createCheck("duration_metadata_normalized", "Duration Metadata Normalized"));
  checks.push(createCheck("provided_metadata_duration_completed", "Provided Metadata Duration Completed"));
  return createResult(input, extensionMediaType, normalized, frameRate, warnings.map((warning) => warning.warning_id));
}

function parseVideoDurationInput(input: unknown): VideoDurationInput {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new Error("Video Duration Hollow requires an object input payload.");
  }

  const candidate = input as {
    project_root?: unknown;
    relative_path?: unknown;
    expected_media_type?: unknown;
    metadata_hint?: unknown;
  };

  const parsed: Partial<VideoDurationInput> = {};
  if (typeof candidate.project_root === "string" && candidate.project_root.trim().length > 0) {
    parsed.project_root = candidate.project_root;
  }
  if (typeof candidate.relative_path === "string" && candidate.relative_path.trim().length > 0) {
    parsed.relative_path = candidate.relative_path;
  }
  if (isMediaType(candidate.expected_media_type)) {
    parsed.expected_media_type = candidate.expected_media_type;
  } else if (candidate.expected_media_type !== undefined) {
    parsed.expected_media_type = "unknown";
  }
  const metadataHint = parseMetadataHint(candidate.metadata_hint);
  if (metadataHint !== undefined) {
    parsed.metadata_hint = metadataHint;
  }

  return parsed as VideoDurationInput;
}

function parseMetadataHint(value: unknown): VideoDurationMetadataHint | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  const candidate = value as VideoDurationMetadataHint;
  const parsed: VideoDurationMetadataHint = {};
  if (candidate.duration_ms !== undefined) {
    parsed.duration_ms = candidate.duration_ms;
  }
  if (candidate.duration_seconds !== undefined) {
    parsed.duration_seconds = candidate.duration_seconds;
  }
  if (candidate.frame_rate_hint !== undefined) {
    parsed.frame_rate_hint = candidate.frame_rate_hint;
  }
  if (candidate.codec_hint !== undefined) {
    parsed.codec_hint = candidate.codec_hint;
  }
  if (candidate.container_hint !== undefined) {
    parsed.container_hint = candidate.container_hint;
  }
  return parsed;
}

function createResult(
  input: VideoDurationInput,
  extensionMediaType: MediaType,
  normalized: NormalizedDurationMetadata,
  frameRate: { value: number | null; valid: boolean | null },
  warningIds: string[]
): VideoDurationResult {
  return {
    relative_path: input.relative_path ?? null,
    media_type: normalized.valid ? "video" : "unknown",
    inspection_method: normalized.valid ? "provided_metadata" : "unsupported",
    metadata_confidence: normalized.valid ? "medium" : "unsupported",
    unsupported_reason: normalized.valid ? null : "Provided video duration metadata was unavailable or invalid.",
    warnings: uniqueStrings(warningIds),
    duration_ms: normalized.duration_ms,
    duration_seconds: normalized.duration_seconds,
    duration_source: normalized.valid ? "provided_metadata" : "unsupported",
    frame_rate_hint: frameRate.value,
    frame_rate_valid: frameRate.valid,
    codec_hint: normalizeNullableString(input.metadata_hint?.codec_hint),
    container_hint: normalizeNullableString(input.metadata_hint?.container_hint),
    extension_media_type: extensionMediaType,
    duration_consistency: normalized.duration_consistency
  };
}

function getFrameRateValidation(value: unknown): { value: number | null; valid: boolean | null } {
  if (value === undefined || value === null) {
    return { value: null, valid: null };
  }
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? { value, valid: true }
    : { value: null, valid: false };
}

function validateExpectedMediaType(input: VideoDurationInput, warnings: CalebWarning[]): void {
  if (
    input.expected_media_type !== undefined &&
    input.expected_media_type !== "video" &&
    input.expected_media_type !== "unknown"
  ) {
    warnings.push(createWarning("expected_media_type_mismatch", "Expected media type does not match video duration."));
  }
}

function validateExtensionMediaType(extensionMediaType: MediaType, warnings: CalebWarning[]): void {
  if (extensionMediaType !== "unknown" && extensionMediaType !== "video") {
    warnings.push(createWarning("extension_media_type_mismatch", "File extension does not look like video."));
  }
}

function maybeCheckPathSafety(input: VideoDurationInput, warnings: CalebWarning[], checks: CalebCheck[]): void {
  if (input.project_root === undefined && input.relative_path === undefined) {
    return;
  }

  if (input.project_root === undefined) {
    return;
  }

  if (input.relative_path === undefined) {
    throw new Error("Video Duration Hollow requires relative_path when project_root is provided.");
  }

  resolveSafeMediaPath(input.project_root, input.relative_path);
  checks.push(createCheck("path_safety_checked", "Path Safety Checked"));
  warnings.push(createWarning("file_not_inspected_by_policy", "Video file was not inspected by policy."));
}

function getExtensionMediaType(relativePath: string | undefined): MediaType {
  return relativePath === undefined ? "unknown" : getMediaTypeFromExtension(relativePath);
}

function normalizeNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function isMediaType(value: unknown): value is MediaType {
  return value === "audio" || value === "video" || value === "image" || value === "unknown";
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

function syncResultWarnings(warningIds: string[], warnings: CalebWarning[]): void {
  const existingIds = new Set(warnings.map((warning) => warning.warning_id));
  for (const warningId of warningIds) {
    if (!existingIds.has(warningId)) {
      warnings.push(createWarning(warningId, `Video duration warning: ${warningId}.`));
      existingIds.add(warningId);
    }
  }
}

function createCheck(check_id: string, label: string): CalebCheck {
  return { check_id, label, status: "completed", severity: "info" };
}

function createWarning(warning_id: string, message: string): CalebWarning {
  return { warning_id, message, severity: "warning" };
}

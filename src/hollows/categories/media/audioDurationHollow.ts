import type { JsonValue } from "../../../types/common.js";
import type { CalebCheck, CalebWarning } from "../../../types/invocation.js";
import type { HollowImplementation } from "../../runnerTypes.js";
import {
  normalizeDurationMetadata,
  type NormalizedDurationMetadata
} from "./durationMetadataHelpers.js";
import type {
  AudioDurationInput,
  AudioDurationMetadataHint,
  AudioDurationResult,
  MediaType
} from "./mediaMetadataTypes.js";
import { audioDurationManifest as manifest } from "./mediaHollowManifests.js";
import { resolveSafeMediaPath } from "./mediaPathSafety.js";
import { getMediaTypeFromExtension } from "./mediaTypeHelpers.js";

export const audioDurationManifest = manifest;

export function inspectAudioDuration(input: AudioDurationInput): AudioDurationResult {
  const warnings: CalebWarning[] = [];
  const checks: CalebCheck[] = [];
  return inspectAudioDurationInternal(input, warnings, checks);
}

export const audioDurationImplementation: HollowImplementation = async ({ input_payload }) => {
  const input = parseAudioDurationInput(input_payload);
  const warnings: CalebWarning[] = [];
  const checks: CalebCheck[] = [];
  const result = inspectAudioDurationInternal(input, warnings, checks);
  syncResultWarnings(result.warnings, warnings);

  return {
    result: result as unknown as JsonValue,
    result_units: "duration_ms",
    checks,
    warnings,
    artifact_hashes: [],
    confidence_level: "provided_audio_duration_metadata"
  };
};

function inspectAudioDurationInternal(
  input: AudioDurationInput,
  warnings: CalebWarning[],
  checks: CalebCheck[]
): AudioDurationResult {
  checks.push(createCheck("expected_media_type_checked", "Expected Media Type Checked"));
  validateExpectedMediaType(input, warnings);
  const extensionMediaType = getExtensionMediaType(input.relative_path);
  validateExtensionMediaType(extensionMediaType, warnings);
  maybeCheckPathSafety(input, warnings, checks);

  const metadataHint = input.metadata_hint;
  if (metadataHint !== undefined) {
    checks.push(createCheck("metadata_hint_present", "Metadata Hint Present"));
  }

  const normalized = normalizeDurationMetadata(metadataHint);
  for (const warningId of normalized.warnings) {
    warnings.push(createWarning(warningId, `Audio duration warning: ${warningId}.`));
  }

  if (!normalized.valid) {
    checks.push(createCheck("unsupported_media_reported", "Unsupported Media Reported"));
    return createResult(input, extensionMediaType, normalized, warnings.map((warning) => warning.warning_id));
  }

  warnings.push(createWarning("metadata_hint_used", "Audio duration came from metadata_hint."));
  checks.push(createCheck("duration_metadata_present", "Duration Metadata Present"));
  checks.push(createCheck("duration_metadata_normalized", "Duration Metadata Normalized"));
  checks.push(createCheck("provided_metadata_duration_completed", "Provided Metadata Duration Completed"));
  return createResult(input, extensionMediaType, normalized, warnings.map((warning) => warning.warning_id));
}

function parseAudioDurationInput(input: unknown): AudioDurationInput {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new Error("Audio Duration Hollow requires an object input payload.");
  }

  const candidate = input as {
    project_root?: unknown;
    relative_path?: unknown;
    expected_media_type?: unknown;
    metadata_hint?: unknown;
  };

  const parsed: Partial<AudioDurationInput> = {};
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

  return parsed as AudioDurationInput;
}

function parseMetadataHint(value: unknown): AudioDurationMetadataHint | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  const candidate = value as AudioDurationMetadataHint;
  const parsed: AudioDurationMetadataHint = {};
  if (candidate.duration_ms !== undefined) {
    parsed.duration_ms = candidate.duration_ms;
  }
  if (candidate.duration_seconds !== undefined) {
    parsed.duration_seconds = candidate.duration_seconds;
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
  input: AudioDurationInput,
  extensionMediaType: MediaType,
  normalized: NormalizedDurationMetadata,
  warningIds: string[]
): AudioDurationResult {
  return {
    relative_path: input.relative_path ?? null,
    media_type: normalized.valid ? "audio" : "unknown",
    inspection_method: normalized.valid ? "provided_metadata" : "unsupported",
    metadata_confidence: normalized.valid ? "medium" : "unsupported",
    unsupported_reason: normalized.valid ? null : "Provided audio duration metadata was unavailable or invalid.",
    warnings: uniqueStrings(warningIds),
    duration_ms: normalized.duration_ms,
    duration_seconds: normalized.duration_seconds,
    duration_source: normalized.valid ? "provided_metadata" : "unsupported",
    codec_hint: normalizeNullableString(input.metadata_hint?.codec_hint),
    container_hint: normalizeNullableString(input.metadata_hint?.container_hint),
    extension_media_type: extensionMediaType,
    duration_consistency: normalized.duration_consistency
  };
}

function validateExpectedMediaType(input: AudioDurationInput, warnings: CalebWarning[]): void {
  if (
    input.expected_media_type !== undefined &&
    input.expected_media_type !== "audio" &&
    input.expected_media_type !== "unknown"
  ) {
    warnings.push(createWarning("expected_media_type_mismatch", "Expected media type does not match audio duration."));
  }
}

function validateExtensionMediaType(extensionMediaType: MediaType, warnings: CalebWarning[]): void {
  if (extensionMediaType !== "unknown" && extensionMediaType !== "audio") {
    warnings.push(createWarning("extension_media_type_mismatch", "File extension does not look like audio."));
  }
}

function maybeCheckPathSafety(input: AudioDurationInput, warnings: CalebWarning[], checks: CalebCheck[]): void {
  if (input.project_root === undefined && input.relative_path === undefined) {
    return;
  }

  if (input.project_root === undefined) {
    return;
  }

  if (input.relative_path === undefined) {
    throw new Error("Audio Duration Hollow requires relative_path when project_root is provided.");
  }

  resolveSafeMediaPath(input.project_root, input.relative_path);
  checks.push(createCheck("path_safety_checked", "Path Safety Checked"));
  warnings.push(createWarning("file_not_inspected_by_policy", "Audio file was not inspected by policy."));
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
      warnings.push(createWarning(warningId, `Audio duration warning: ${warningId}.`));
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

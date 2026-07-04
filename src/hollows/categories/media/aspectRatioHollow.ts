import type { JsonValue } from "../../../types/common.js";
import type { CalebCheck, CalebWarning } from "../../../types/invocation.js";
import type { HollowImplementation } from "../../runnerTypes.js";
import {
  calculateAspectRatioDecimal,
  classifyAspectRatio,
  classifyOrientation,
  reduceAspectRatio
} from "./mediaMath.js";
import type {
  AspectRatioInput,
  AspectRatioMetadataHint,
  AspectRatioResult,
  MediaInspectionMethod,
  MediaMetadataConfidence,
  MediaType
} from "./mediaMetadataTypes.js";
import { aspectRatioManifest as manifest } from "./mediaHollowManifests.js";
import { resolveSafeMediaPath } from "./mediaPathSafety.js";
import { inspectImageDimensions } from "./imageDimensionsHollow.js";

export const aspectRatioManifest = manifest;

const EXPECTED_RATIO_TOLERANCE = 0.01;

type DimensionSource = AspectRatioResult["dimension_source"];

interface SelectedDimensions {
  readonly width: number;
  readonly height: number;
  readonly relative_path: string | null;
  readonly inspection_method: MediaInspectionMethod;
  readonly metadata_confidence: MediaMetadataConfidence;
  readonly dimension_source: DimensionSource;
  readonly media_type: "image" | "unknown";
  readonly warnings: string[];
  readonly checks: CalebCheck[];
}

export async function inspectAspectRatio(input: AspectRatioInput): Promise<AspectRatioResult> {
  const warnings: CalebWarning[] = [];
  validateExpectedMediaType(input, warnings);
  const selected = await selectDimensions(input, warnings);
  return createAspectRatioResult(input, selected, warnings.map((warning) => warning.warning_id));
}

export const aspectRatioImplementation: HollowImplementation = async ({ input_payload }) => {
  const input = parseAspectRatioInput(input_payload);
  const warnings: CalebWarning[] = [];
  validateExpectedMediaType(input, warnings);

  const selected = await selectDimensions(input, warnings);
  const result = createAspectRatioResult(input, selected, warnings.map((warning) => warning.warning_id));
  syncResultWarnings(result, warnings);
  const selectedChecks = selected?.checks ?? [createCheck("unsupported_media_reported", "Unsupported Media Reported")];
  const checks = [
    ...selectedChecks,
    ...createResultChecks(result)
  ];

  return {
    result: result as unknown as JsonValue,
    result_units: "aspect_ratio",
    checks,
    warnings,
    artifact_hashes: [],
    confidence_level:
      result.dimension_source === "image_header"
        ? "deterministic_image_header_aspect_ratio"
        : "deterministic_aspect_ratio_math"
  };
};

export function parseExpectedRatio(expectedRatio: string | number | null | undefined): number | null {
  if (expectedRatio === null || expectedRatio === undefined) {
    return null;
  }

  if (typeof expectedRatio === "number") {
    return Number.isFinite(expectedRatio) && expectedRatio > 0 ? expectedRatio : null;
  }

  if (typeof expectedRatio !== "string") {
    return null;
  }

  const trimmed = expectedRatio.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const labelMatch = /^(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)$/.exec(trimmed);
  if (labelMatch !== null) {
    const width = Number(labelMatch[1]);
    const height = Number(labelMatch[2]);
    return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0 ? width / height : null;
  }

  const decimal = Number(trimmed);
  return Number.isFinite(decimal) && decimal > 0 ? decimal : null;
}

function parseAspectRatioInput(input: unknown): AspectRatioInput {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new Error("Aspect Ratio Hollow requires an object input payload.");
  }

  const candidate = input as {
    project_root?: unknown;
    relative_path?: unknown;
    expected_media_type?: unknown;
    width?: unknown;
    height?: unknown;
    expected_ratio?: unknown;
    metadata_hint?: unknown;
  };

  const parsed: AspectRatioInput = {};

  if (candidate.project_root !== undefined) {
    if (typeof candidate.project_root !== "string" || candidate.project_root.trim().length === 0) {
      throw new Error("Aspect Ratio Hollow requires input_payload.project_root as a non-empty string when provided.");
    }
    parsed.project_root = candidate.project_root;
  }

  if (candidate.relative_path !== undefined) {
    if (typeof candidate.relative_path !== "string" || candidate.relative_path.trim().length === 0) {
      throw new Error("Aspect Ratio Hollow requires input_payload.relative_path as a non-empty string when provided.");
    }
    parsed.relative_path = candidate.relative_path;
  }

  if (isMediaType(candidate.expected_media_type)) {
    parsed.expected_media_type = candidate.expected_media_type;
  } else if (candidate.expected_media_type !== undefined) {
    parsed.expected_media_type = "unknown";
  }

  if (candidate.width !== undefined) {
    parsed.width = typeof candidate.width === "number" ? candidate.width : Number.NaN;
  }
  if (candidate.height !== undefined) {
    parsed.height = typeof candidate.height === "number" ? candidate.height : Number.NaN;
  }

  if (isExpectedRatioValue(candidate.expected_ratio)) {
    parsed.expected_ratio = candidate.expected_ratio;
  } else if (candidate.expected_ratio !== undefined) {
    parsed.expected_ratio = String(candidate.expected_ratio);
  }

  const metadataHint = parseMetadataHint(candidate.metadata_hint);
  if (metadataHint !== undefined) {
    parsed.metadata_hint = metadataHint;
  }

  return parsed;
}

async function selectDimensions(
  input: AspectRatioInput,
  warnings: CalebWarning[]
): Promise<SelectedDimensions | null> {
  if (input.width !== undefined || input.height !== undefined) {
    if (isPositiveFiniteNumber(input.width) && isPositiveFiniteNumber(input.height)) {
      return {
        width: input.width,
        height: input.height,
        relative_path: input.relative_path ?? null,
        inspection_method: "provided_metadata",
        metadata_confidence: "high",
        dimension_source: "direct_dimensions",
        media_type: input.expected_media_type === "image" ? "image" : "unknown",
        warnings: [],
        checks: [createCheck("dimension_source_selected", "Dimension Source Selected")]
      };
    }

    warnings.push(createWarning("dimensions_invalid", "Direct width and height must be positive finite numbers."));
    return null;
  }

  const metadataHint = input.metadata_hint;
  if (metadataHint !== undefined) {
    if (isPositiveFiniteNumber(metadataHint.width) && isPositiveFiniteNumber(metadataHint.height)) {
      warnings.push(createWarning("metadata_hint_used", "Aspect ratio dimensions came from metadata_hint."));
      return {
        width: metadataHint.width,
        height: metadataHint.height,
        relative_path: input.relative_path ?? null,
        inspection_method: "provided_metadata",
        metadata_confidence: "medium",
        dimension_source: "provided_metadata",
        media_type: input.expected_media_type === "image" ? "image" : "unknown",
        warnings: [],
        checks: [createCheck("dimension_source_selected", "Dimension Source Selected")]
      };
    }
    warnings.push(createWarning("metadata_hint_invalid", "metadata_hint did not contain positive finite width and height."));
  }

  if (input.project_root !== undefined || input.relative_path !== undefined) {
    if (input.project_root === undefined || input.relative_path === undefined) {
      throw new Error("Aspect Ratio Hollow requires both project_root and relative_path for file inspection.");
    }

    resolveSafeMediaPath(input.project_root, input.relative_path);
    const imageResult = await inspectImageDimensions({
      project_root: input.project_root,
      relative_path: input.relative_path,
      expected_media_type: input.expected_media_type ?? "image"
    });
    const fileChecks = [
      createCheck("dimension_source_selected", "Dimension Source Selected"),
      createCheck("path_safety_passed", "Path Safety Passed"),
      createCheck("image_header_inspection_attempted", "Image Header Inspection Attempted")
    ];

    for (const warningId of imageResult.warnings) {
      warnings.push(createWarning(warningId, `Image dimension inspection warning: ${warningId}.`));
    }

    if (isPositiveFiniteNumber(imageResult.width) && isPositiveFiniteNumber(imageResult.height)) {
      return {
        width: imageResult.width,
        height: imageResult.height,
        relative_path: input.relative_path,
        inspection_method: imageResult.inspection_method,
        metadata_confidence: imageResult.metadata_confidence,
        dimension_source:
          imageResult.inspection_method === "header_probe" ? "image_header" : "provided_metadata",
        media_type: imageResult.media_type,
        warnings: imageResult.warnings,
        checks: fileChecks
      };
    }

    warnings.push(createWarning("dimensions_unavailable", "Aspect ratio dimensions could not be determined from file inspection."));
    return {
      width: 0,
      height: 0,
      relative_path: input.relative_path,
      inspection_method: "unsupported",
      metadata_confidence: "unsupported",
      dimension_source: "unsupported",
      media_type: "unknown",
      warnings: imageResult.warnings,
      checks: [...fileChecks, createCheck("unsupported_media_reported", "Unsupported Media Reported")]
    };
  }

  warnings.push(createWarning("dimensions_unavailable", "No direct dimensions, metadata_hint dimensions, or image file path were provided."));
  return null;
}

function createAspectRatioResult(
  input: AspectRatioInput,
  selected: SelectedDimensions | null,
  warningIds: string[]
): AspectRatioResult {
  if (selected === null || selected.dimension_source === "unsupported") {
    return createUnsupportedResult(input, warningIds);
  }

  const aspectRatioDecimal = calculateAspectRatioDecimal(selected.width, selected.height);
  const expectedRatio = input.expected_ratio ?? input.metadata_hint?.expected_ratio ?? null;
  const parsedExpectedRatio = parseExpectedRatio(expectedRatio);
  const hasExpectedRatio = expectedRatio !== null && expectedRatio !== undefined;
  const expectedRatioValid = !hasExpectedRatio || parsedExpectedRatio !== null;
  const ratioDifference =
    aspectRatioDecimal !== null && parsedExpectedRatio !== null
      ? Math.abs(aspectRatioDecimal - parsedExpectedRatio)
      : null;

  const warnings = [...warningIds];
  if (hasExpectedRatio && !expectedRatioValid) {
    warnings.push("unsupported_expected_ratio_format");
  }
  if (ratioDifference !== null && ratioDifference > EXPECTED_RATIO_TOLERANCE) {
    warnings.push("expected_ratio_mismatch");
  }

  return {
    relative_path: selected.relative_path,
    media_type: selected.media_type,
    inspection_method: selected.inspection_method,
    metadata_confidence: selected.metadata_confidence,
    unsupported_reason: null,
    warnings: uniqueStrings(warnings),
    width: selected.width,
    height: selected.height,
    aspect_ratio_decimal: aspectRatioDecimal,
    aspect_ratio_reduced: reduceAspectRatio(selected.width, selected.height),
    aspect_ratio_label: classifyAspectRatio(selected.width, selected.height),
    orientation: classifyOrientation(selected.width, selected.height),
    expected_ratio: expectedRatio,
    matches_expected_ratio:
      ratioDifference === null ? null : ratioDifference <= EXPECTED_RATIO_TOLERANCE,
    ratio_difference: ratioDifference,
    dimension_source: selected.dimension_source
  };
}

function createUnsupportedResult(input: AspectRatioInput, warningIds: string[]): AspectRatioResult {
  const expectedRatio = input.expected_ratio ?? input.metadata_hint?.expected_ratio ?? null;
  const warnings = [...warningIds];
  if (!warnings.includes("dimensions_unavailable")) {
    warnings.push("dimensions_unavailable");
  }
  if (expectedRatio !== null && expectedRatio !== undefined && parseExpectedRatio(expectedRatio) === null) {
    warnings.push("unsupported_expected_ratio_format");
  }

  return {
    relative_path: input.relative_path ?? null,
    media_type: "unknown",
    inspection_method: "unsupported",
    metadata_confidence: "unsupported",
    unsupported_reason: "Aspect ratio dimensions were not available.",
    warnings: uniqueStrings(warnings),
    width: null,
    height: null,
    aspect_ratio_decimal: null,
    aspect_ratio_reduced: null,
    aspect_ratio_label: "unknown",
    orientation: "unknown",
    expected_ratio: expectedRatio,
    matches_expected_ratio: null,
    ratio_difference: null,
    dimension_source: "unsupported"
  };
}

function createResultChecks(result: AspectRatioResult): CalebCheck[] {
  if (result.dimension_source === "unsupported") {
    return [createCheck("unsupported_media_reported", "Unsupported Media Reported")];
  }

  const checks = [
    createCheck("dimensions_valid", "Dimensions Valid"),
    createCheck("aspect_ratio_calculated", "Aspect Ratio Calculated"),
    createCheck("orientation_classified", "Orientation Classified")
  ];

  if (result.expected_ratio !== null) {
    checks.push(createCheck("expected_ratio_checked", "Expected Ratio Checked"));
  }

  return checks;
}

function parseMetadataHint(value: unknown): AspectRatioMetadataHint | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  const candidate = value as AspectRatioMetadataHint;
  const parsed: AspectRatioMetadataHint = {};
  if (candidate.width !== undefined) {
    parsed.width = candidate.width;
  }
  if (candidate.height !== undefined) {
    parsed.height = candidate.height;
  }
  if (isExpectedRatioValue(candidate.expected_ratio)) {
    parsed.expected_ratio = candidate.expected_ratio;
  } else if (candidate.expected_ratio !== undefined) {
    parsed.expected_ratio = String(candidate.expected_ratio);
  }
  return parsed;
}

function validateExpectedMediaType(input: AspectRatioInput, warnings: CalebWarning[]): void {
  if (
    input.expected_media_type !== undefined &&
    input.expected_media_type !== "image" &&
    input.expected_media_type !== "unknown"
  ) {
    warnings.push(
      createWarning(
        "expected_media_type_mismatch",
        `Expected media type "${String(input.expected_media_type)}" does not match aspect ratio inspection.`
      )
    );
  }
}

function isExpectedRatioValue(value: unknown): value is string | number | null {
  return value === null || typeof value === "string" || typeof value === "number";
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isMediaType(value: unknown): value is MediaType {
  return value === "audio" || value === "video" || value === "image" || value === "unknown";
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

function createCheck(check_id: string, label: string): CalebCheck {
  return { check_id, label, status: "completed", severity: "info" };
}

function createWarning(warning_id: string, message: string): CalebWarning {
  return { warning_id, message, severity: "warning" };
}

function syncResultWarnings(result: AspectRatioResult, warnings: CalebWarning[]): void {
  const existingIds = new Set(warnings.map((warning) => warning.warning_id));
  for (const warningId of result.warnings) {
    if (!existingIds.has(warningId)) {
      warnings.push(createWarning(warningId, `Aspect ratio warning: ${warningId}.`));
      existingIds.add(warningId);
    }
  }
}

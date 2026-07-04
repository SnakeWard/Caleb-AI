import { open } from "node:fs/promises";

import type { JsonValue } from "../../../types/common.js";
import type { CalebCheck, CalebWarning } from "../../../types/invocation.js";
import type { HollowImplementation } from "../../runnerTypes.js";
import {
  calculateAspectRatioDecimal,
  calculateMegapixels,
  classifyAspectRatio,
  classifyOrientation
} from "./mediaMath.js";
import type {
  ImageDimensionsInput,
  ImageDimensionsMetadataHint,
  ImageDimensionsResult,
  MediaInspectionMethod,
  MediaType
} from "./mediaMetadataTypes.js";
import { imageDimensionsManifest as manifest } from "./mediaHollowManifests.js";
import { getMediaExtension, getMediaTypeFromExtension } from "./mediaTypeHelpers.js";
import { resolveSafeMediaPath } from "./mediaPathSafety.js";

export const imageDimensionsManifest = manifest;

const MAX_HEADER_BYTES = 512 * 1024;

type ImageFormatHint = "png" | "jpeg" | "gif" | "webp" | "bmp" | "unknown";

interface ParsedImageHeader {
  readonly width: number;
  readonly height: number;
  readonly format_hint: ImageFormatHint;
}

export async function inspectImageDimensions(input: ImageDimensionsInput): Promise<ImageDimensionsResult> {
  const warnings: CalebWarning[] = [];
  validateExpectedMediaType(input, warnings);

  const safePath = resolveSafeMediaPath(input.project_root, input.relative_path);
  const header = await readHeaderBytes(safePath);
  const parsedHeader = parseImageHeader(header);

  if (parsedHeader !== null) {
    return createResult({
      relative_path: input.relative_path,
      width: parsedHeader.width,
      height: parsedHeader.height,
      format_hint: parsedHeader.format_hint,
      inspection_method: "header_probe",
      metadata_confidence: "high",
      unsupported_reason: null,
      warnings: warnings.map((warning) => warning.warning_id)
    });
  }

  const fallback = getValidMetadataHint(input.metadata_hint);
  if (fallback !== null) {
    warnings.push(createWarning("metadata_hint_used", "Image dimensions came from metadata_hint, not file header inspection."));
    return createResult({
      relative_path: input.relative_path,
      width: fallback.width,
      height: fallback.height,
      format_hint: normalizeFormatHint(fallback.format_hint) ?? formatHintFromExtension(input.relative_path),
      inspection_method: "provided_metadata",
      metadata_confidence: "medium",
      unsupported_reason: null,
      warnings: warnings.map((warning) => warning.warning_id)
    });
  }

  if (input.metadata_hint !== undefined) {
    warnings.push(createWarning("metadata_hint_invalid", "metadata_hint did not contain positive finite width and height."));
  }

  warnings.push(createWarning("unsupported_image_format", "Image dimensions could not be determined by supported header inspection."));
  warnings.push(createWarning("image_dimensions_unavailable", "Image dimensions are unavailable for this input."));

  return createResult({
    relative_path: input.relative_path,
    width: null,
    height: null,
    format_hint: formatHintFromExtension(input.relative_path),
    inspection_method: "unsupported",
    metadata_confidence: "unsupported",
    unsupported_reason: "Supported image header dimensions were not found.",
    warnings: warnings.map((warning) => warning.warning_id)
  });
}

export const imageDimensionsImplementation: HollowImplementation = async ({ input_payload }) => {
  const input = parseImageDimensionsInput(input_payload);
  const checks: CalebCheck[] = [
    createCheck("project_root_present", "Project Root Present"),
    createCheck("relative_path_present", "Relative Path Present")
  ];

  const warnings: CalebWarning[] = [];
  validateExpectedMediaType(input, warnings);

  const safePath = resolveSafeMediaPath(input.project_root, input.relative_path);
  checks.push(createCheck("path_safety_passed", "Path Safety Passed"));
  checks.push(createCheck("media_type_checked", "Media Type Checked"));

  const header = await readHeaderBytes(safePath);
  checks.push(createCheck("image_header_inspection_attempted", "Image Header Inspection Attempted"));

  const parsedHeader = parseImageHeader(header);
  let result: ImageDimensionsResult;

  if (parsedHeader !== null) {
    result = createResult({
      relative_path: input.relative_path,
      width: parsedHeader.width,
      height: parsedHeader.height,
      format_hint: parsedHeader.format_hint,
      inspection_method: "header_probe",
      metadata_confidence: "high",
      unsupported_reason: null,
      warnings: warnings.map((warning) => warning.warning_id)
    });
    checks.push(createCheck("image_dimensions_completed", "Image Dimensions Completed"));
  } else {
    const fallback = getValidMetadataHint(input.metadata_hint);
    if (fallback !== null) {
      warnings.push(createWarning("metadata_hint_used", "Image dimensions came from metadata_hint, not file header inspection."));
      result = createResult({
        relative_path: input.relative_path,
        width: fallback.width,
        height: fallback.height,
        format_hint: normalizeFormatHint(fallback.format_hint) ?? formatHintFromExtension(input.relative_path),
        inspection_method: "provided_metadata",
        metadata_confidence: "medium",
        unsupported_reason: null,
        warnings: warnings.map((warning) => warning.warning_id)
      });
      checks.push(createCheck("image_dimensions_completed", "Image Dimensions Completed"));
    } else {
      if (input.metadata_hint !== undefined) {
        warnings.push(createWarning("metadata_hint_invalid", "metadata_hint did not contain positive finite width and height."));
      }
      warnings.push(createWarning("unsupported_image_format", "Image dimensions could not be determined by supported header inspection."));
      warnings.push(createWarning("image_dimensions_unavailable", "Image dimensions are unavailable for this input."));
      result = createResult({
        relative_path: input.relative_path,
        width: null,
        height: null,
        format_hint: formatHintFromExtension(input.relative_path),
        inspection_method: "unsupported",
        metadata_confidence: "unsupported",
        unsupported_reason: "Supported image header dimensions were not found.",
        warnings: warnings.map((warning) => warning.warning_id)
      });
      checks.push(createCheck("unsupported_media_reported", "Unsupported Media Reported"));
    }
  }

  return {
    result: result as unknown as JsonValue,
    result_units: "pixels",
    checks,
    warnings,
    artifact_hashes: [],
    confidence_level:
      result.inspection_method === "header_probe"
        ? "deterministic_image_header_dimensions"
        : "bounded_image_metadata_inspection"
  };
};

function parseImageDimensionsInput(input: unknown): ImageDimensionsInput {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new Error("Image Dimensions Hollow requires an object input payload.");
  }

  const candidate = input as {
    project_root?: unknown;
    relative_path?: unknown;
    expected_media_type?: unknown;
    metadata_hint?: unknown;
  };

  if (typeof candidate.project_root !== "string" || candidate.project_root.trim().length === 0) {
    throw new Error("Image Dimensions Hollow requires input_payload.project_root as a non-empty string.");
  }

  if (typeof candidate.relative_path !== "string" || candidate.relative_path.trim().length === 0) {
    throw new Error("Image Dimensions Hollow requires input_payload.relative_path as a non-empty string.");
  }

  const parsedInput: ImageDimensionsInput = {
    project_root: candidate.project_root,
    relative_path: candidate.relative_path
  };

  if (isMediaType(candidate.expected_media_type)) {
    parsedInput.expected_media_type = candidate.expected_media_type;
  } else if (candidate.expected_media_type !== undefined) {
    parsedInput.expected_media_type = "unknown";
  }

  const metadataHint = parseMetadataHint(candidate.metadata_hint);
  if (metadataHint !== undefined) {
    parsedInput.metadata_hint = metadataHint;
  }

  return parsedInput;
}

function parseMetadataHint(value: unknown): ImageDimensionsMetadataHint | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  const candidate = value as ImageDimensionsMetadataHint;
  const parsed: ImageDimensionsMetadataHint = {};
  if (candidate.width !== undefined) {
    parsed.width = candidate.width;
  }
  if (candidate.height !== undefined) {
    parsed.height = candidate.height;
  }
  if (candidate.format_hint !== undefined) {
    parsed.format_hint = candidate.format_hint;
  }
  return parsed;
}

function validateExpectedMediaType(input: ImageDimensionsInput, warnings: CalebWarning[]): void {
  if (
    input.expected_media_type !== undefined &&
    input.expected_media_type !== "image" &&
    input.expected_media_type !== "unknown"
  ) {
    warnings.push(
      createWarning(
        "expected_media_type_mismatch",
        `Expected media type "${String(input.expected_media_type)}" does not match image dimensions inspection.`
      )
    );
  }
}

async function readHeaderBytes(filePath: string): Promise<Buffer> {
  const file = await open(filePath, "r");
  try {
    const buffer = Buffer.alloc(MAX_HEADER_BYTES);
    const { bytesRead } = await file.read(buffer, 0, MAX_HEADER_BYTES, 0);
    return buffer.subarray(0, bytesRead);
  } finally {
    await file.close();
  }
}

function parseImageHeader(buffer: Buffer): ParsedImageHeader | null {
  return parsePngHeader(buffer) ?? parseGifHeader(buffer) ?? parseJpegHeader(buffer);
}

function parsePngHeader(buffer: Buffer): ParsedImageHeader | null {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (buffer.length < 24 || !signature.every((byte, index) => buffer[index] === byte)) {
    return null;
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    format_hint: "png"
  };
}

function parseGifHeader(buffer: Buffer): ParsedImageHeader | null {
  if (buffer.length < 10) {
    return null;
  }

  const header = buffer.subarray(0, 6).toString("ascii");
  if (header !== "GIF87a" && header !== "GIF89a") {
    return null;
  }

  return {
    width: buffer.readUInt16LE(6),
    height: buffer.readUInt16LE(8),
    format_hint: "gif"
  };
}

function parseJpegHeader(buffer: Buffer): ParsedImageHeader | null {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }

  let offset = 2;
  while (offset + 3 < buffer.length) {
    while (offset < buffer.length && buffer[offset] !== 0xff) {
      offset += 1;
    }

    while (offset < buffer.length && buffer[offset] === 0xff) {
      offset += 1;
    }

    if (offset >= buffer.length) {
      return null;
    }

    const marker = buffer[offset]!;
    offset += 1;

    if (marker === 0xd9 || marker === 0xda) {
      return null;
    }

    if (offset + 2 > buffer.length) {
      return null;
    }

    const segmentLength = buffer.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > buffer.length) {
      return null;
    }

    if (isJpegStartOfFrameMarker(marker)) {
      if (segmentLength < 7 || offset + 7 >= buffer.length) {
        return null;
      }

      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5),
        format_hint: "jpeg"
      };
    }

    offset += segmentLength;
  }

  return null;
}

function isJpegStartOfFrameMarker(marker: number): boolean {
  return [
    0xc0,
    0xc1,
    0xc2,
    0xc3,
    0xc5,
    0xc6,
    0xc7,
    0xc9,
    0xca,
    0xcb,
    0xcd,
    0xce,
    0xcf
  ].includes(marker);
}

function getValidMetadataHint(
  metadataHint: ImageDimensionsMetadataHint | undefined
): { width: number; height: number; format_hint?: string | null } | null {
  const width = metadataHint?.width;
  const height = metadataHint?.height;
  if (!isPositiveFiniteNumber(width) || !isPositiveFiniteNumber(height)) {
    return null;
  }

  const validHint: { width: number; height: number; format_hint?: string | null } = { width, height };
  if (metadataHint?.format_hint !== undefined) {
    validHint.format_hint = metadataHint.format_hint;
  }
  return validHint;
}

function createResult(input: {
  relative_path: string;
  width: number | null;
  height: number | null;
  format_hint: ImageFormatHint;
  inspection_method: MediaInspectionMethod;
  metadata_confidence: ImageDimensionsResult["metadata_confidence"];
  unsupported_reason: string | null;
  warnings: string[];
}): ImageDimensionsResult {
  return {
    relative_path: input.relative_path,
    media_type: input.width === null || input.height === null ? "unknown" : "image",
    inspection_method: input.inspection_method,
    metadata_confidence: input.metadata_confidence,
    unsupported_reason: input.unsupported_reason,
    warnings: input.warnings,
    width: input.width,
    height: input.height,
    megapixels:
      input.width === null || input.height === null ? null : calculateMegapixels(input.width, input.height),
    orientation:
      input.width === null || input.height === null ? "unknown" : classifyOrientation(input.width, input.height),
    format_hint: input.format_hint,
    aspect_ratio_decimal:
      input.width === null || input.height === null
        ? null
        : calculateAspectRatioDecimal(input.width, input.height),
    aspect_ratio_label:
      input.width === null || input.height === null ? "unknown" : classifyAspectRatio(input.width, input.height)
  };
}

function formatHintFromExtension(relativePath: string): ImageFormatHint {
  const mediaType = getMediaTypeFromExtension(relativePath);
  if (mediaType !== "image") {
    return "unknown";
  }

  return normalizeFormatHint(getMediaExtension(relativePath).replace(".", "")) ?? "unknown";
}

function normalizeFormatHint(formatHint: unknown): ImageFormatHint | null {
  if (typeof formatHint !== "string") {
    return null;
  }

  const normalized = formatHint.toLowerCase().replace(".", "");
  if (normalized === "jpg") {
    return "jpeg";
  }

  if (normalized === "png" || normalized === "jpeg" || normalized === "gif" || normalized === "webp" || normalized === "bmp") {
    return normalized;
  }

  return "unknown";
}

function isPositiveFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isMediaType(value: unknown): value is MediaType {
  return value === "audio" || value === "video" || value === "image" || value === "unknown";
}

function createCheck(check_id: string, label: string): CalebCheck {
  return { check_id, label, status: "completed", severity: "info" };
}

function createWarning(warning_id: string, message: string): CalebWarning {
  return { warning_id, message, severity: "warning" };
}

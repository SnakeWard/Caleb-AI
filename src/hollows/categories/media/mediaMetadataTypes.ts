export type MediaType = "audio" | "video" | "image" | "unknown";

export type MediaInspectionMethod =
  | "header_probe"
  | "browser_metadata"
  | "provided_metadata"
  | "future_adapter"
  | "unsupported";

export type MediaMetadataConfidence = "high" | "medium" | "low" | "unsupported";

export type MediaOrientation = "landscape" | "portrait" | "square" | "unknown";

export type MediaAspectRatioLabel =
  | "16:9"
  | "9:16"
  | "1:1"
  | "4:5"
  | "21:9"
  | "custom"
  | "unknown";

export interface MediaMetadataInputBase {
  project_root: string;
  relative_path: string;
  expected_media_type?: MediaType;
  metadata_hint?: Record<string, unknown>;
}

export interface MediaMetadataResultBase {
  relative_path: string;
  media_type: MediaType;
  inspection_method: MediaInspectionMethod;
  metadata_confidence: MediaMetadataConfidence;
  unsupported_reason: string | null;
  warnings: string[];
}

export interface AudioDurationMetadataHint extends Record<string, unknown> {
  duration_ms?: number;
  duration_seconds?: number;
  codec_hint?: string | null;
  container_hint?: string | null;
}

export interface VideoDurationMetadataHint extends Record<string, unknown> {
  duration_ms?: number;
  duration_seconds?: number;
  frame_rate_hint?: number | null;
  codec_hint?: string | null;
  container_hint?: string | null;
}

export interface ImageDimensionsMetadataHint extends Record<string, unknown> {
  width?: number;
  height?: number;
  format_hint?: string | null;
}

export interface AspectRatioMetadataHint extends Record<string, unknown> {
  width?: number;
  height?: number;
  expected_ratio?: string | number | null;
}

export interface AudioDurationInput {
  project_root?: string;
  relative_path?: string;
  expected_media_type?: MediaType;
  metadata_hint?: AudioDurationMetadataHint;
}

export interface AudioDurationResult {
  relative_path: string | null;
  media_type: "audio" | "unknown";
  inspection_method: "provided_metadata" | "unsupported";
  metadata_confidence: "medium" | "low" | "unsupported";
  unsupported_reason: string | null;
  warnings: string[];
  duration_ms: number | null;
  duration_seconds: number | null;
  duration_source: "provided_metadata" | "unsupported";
  codec_hint: string | null;
  container_hint: string | null;
  extension_media_type: MediaType;
  duration_consistency: "consistent" | "mismatch" | "single_value" | "unavailable";
}

export interface VideoDurationInput {
  project_root?: string;
  relative_path?: string;
  expected_media_type?: MediaType;
  metadata_hint?: VideoDurationMetadataHint;
}

export interface VideoDurationResult {
  relative_path: string | null;
  media_type: "video" | "unknown";
  inspection_method: "provided_metadata" | "unsupported";
  metadata_confidence: "medium" | "low" | "unsupported";
  unsupported_reason: string | null;
  warnings: string[];
  duration_ms: number | null;
  duration_seconds: number | null;
  duration_source: "provided_metadata" | "unsupported";
  frame_rate_hint: number | null;
  frame_rate_valid: boolean | null;
  codec_hint: string | null;
  container_hint: string | null;
  extension_media_type: MediaType;
  duration_consistency: "consistent" | "mismatch" | "single_value" | "unavailable";
}

export interface ImageDimensionsInput extends MediaMetadataInputBase {
  expected_media_type?: MediaType;
  metadata_hint?: ImageDimensionsMetadataHint;
}

export interface ImageDimensionsResult extends MediaMetadataResultBase {
  media_type: "image" | "unknown";
  width: number | null;
  height: number | null;
  megapixels: number | null;
  orientation: MediaOrientation;
  format_hint: string | null;
  aspect_ratio_decimal: number | null;
  aspect_ratio_label: MediaAspectRatioLabel;
}

export interface AspectRatioInput {
  project_root?: string;
  relative_path?: string;
  expected_media_type?: MediaType;
  width?: number;
  height?: number;
  expected_ratio?: string | number | null;
  metadata_hint?: AspectRatioMetadataHint;
}

export interface AspectRatioResult {
  relative_path: string | null;
  media_type: "image" | "unknown";
  inspection_method: MediaInspectionMethod;
  metadata_confidence: MediaMetadataConfidence;
  unsupported_reason: string | null;
  warnings: string[];
  width: number | null;
  height: number | null;
  aspect_ratio_decimal: number | null;
  aspect_ratio_reduced: string | null;
  aspect_ratio_label: MediaAspectRatioLabel;
  orientation: MediaOrientation;
  expected_ratio: string | number | null;
  matches_expected_ratio: boolean | null;
  ratio_difference: number | null;
  dimension_source: "direct_dimensions" | "provided_metadata" | "image_header" | "unsupported";
}

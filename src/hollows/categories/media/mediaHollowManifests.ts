import type { HollowManifest } from "../../../types/hollow.js";

export const imageDimensionsManifest = {
  hollow_id: "hollow.media.image_dimensions",
  hollow_name: "Image Dimensions Hollow",
  hollow_version: "1.0.0",
  schema_version: "1.0.0",
  category: "media",
  description:
    "Inspects one explicit path-safe image file using read-only local header inspection for dimensions.",
  input_type: "media.image_dimensions.input",
  input_schema_ref: "schemas/hollows/media/image-dimensions.input.json",
  output_schema_ref: "schemas/hollows/media/image-dimensions.output.json",
  permissions: ["read_only"],
  permissions_required: ["read_only"],
  file_access_scope: "workspace_read",
  network_access: false,
  execution_mode: "local_inspection",
  deterministic: true,
  deterministic_level: "bounded_external_state",
  result_units: "pixels",
  checks: [
    "project_root_present",
    "relative_path_present",
    "path_safety_passed",
    "media_type_checked",
    "image_header_inspection_attempted",
    "image_dimensions_completed",
    "unsupported_media_reported"
  ],
  max_input_size: 20000,
  max_runtime_ms: 2000,
  supports_batching: false,
  supports_streaming: false,
  cache_policy: "artifact_digest",
  status: "trusted",
  owner: "caleb-ai-core"
} as const satisfies HollowManifest;

export const aspectRatioManifest = {
  hollow_id: "hollow.media.aspect_ratio",
  hollow_name: "Aspect Ratio Hollow",
  hollow_version: "1.0.0",
  schema_version: "1.0.0",
  category: "media",
  description:
    "Calculates and validates aspect ratio metadata from explicit dimensions, metadata hints, or one explicit path-safe image file.",
  input_type: "media.aspect_ratio.input",
  input_schema_ref: "schemas/hollows/media/aspect-ratio.input.json",
  output_schema_ref: "schemas/hollows/media/aspect-ratio.output.json",
  permissions: ["read_only"],
  permissions_required: ["read_only"],
  file_access_scope: "workspace_read",
  network_access: false,
  execution_mode: "local_inspection",
  deterministic: true,
  deterministic_level: "bounded_external_state",
  result_units: "aspect_ratio",
  checks: [
    "dimension_source_selected",
    "dimensions_valid",
    "aspect_ratio_calculated",
    "orientation_classified",
    "expected_ratio_checked",
    "path_safety_passed",
    "image_header_inspection_attempted",
    "unsupported_media_reported"
  ],
  max_input_size: 20000,
  max_runtime_ms: 2000,
  supports_batching: false,
  supports_streaming: false,
  cache_policy: "input_digest",
  status: "trusted",
  owner: "caleb-ai-core"
} as const satisfies HollowManifest;

export const audioDurationManifest = {
  hollow_id: "hollow.media.audio_duration",
  hollow_name: "Audio Duration Hollow",
  hollow_version: "1.0.0",
  schema_version: "1.0.0",
  category: "media",
  description:
    "Validates and normalizes explicitly provided audio duration metadata without inspecting or decoding media files.",
  input_type: "media.audio_duration.input",
  input_schema_ref: "schemas/hollows/media/audio-duration.input.json",
  output_schema_ref: "schemas/hollows/media/audio-duration.output.json",
  permissions: ["read_only"],
  permissions_required: ["read_only"],
  file_access_scope: "provided_handles_only",
  network_access: false,
  execution_mode: "local_inspection",
  deterministic: true,
  deterministic_level: "strict",
  result_units: "duration_ms",
  checks: [
    "metadata_hint_present",
    "duration_metadata_present",
    "duration_metadata_normalized",
    "expected_media_type_checked",
    "path_safety_checked",
    "provided_metadata_duration_completed",
    "unsupported_media_reported"
  ],
  max_input_size: 20000,
  max_runtime_ms: 1000,
  supports_batching: false,
  supports_streaming: false,
  cache_policy: "input_digest",
  status: "trusted",
  owner: "caleb-ai-core"
} as const satisfies HollowManifest;

export const videoDurationManifest = {
  hollow_id: "hollow.media.video_duration",
  hollow_name: "Video Duration Hollow",
  hollow_version: "1.0.0",
  schema_version: "1.0.0",
  category: "media",
  description:
    "Validates and normalizes explicitly provided video duration metadata without inspecting, decoding, or rendering media files.",
  input_type: "media.video_duration.input",
  input_schema_ref: "schemas/hollows/media/video-duration.input.json",
  output_schema_ref: "schemas/hollows/media/video-duration.output.json",
  permissions: ["read_only"],
  permissions_required: ["read_only"],
  file_access_scope: "provided_handles_only",
  network_access: false,
  execution_mode: "local_inspection",
  deterministic: true,
  deterministic_level: "strict",
  result_units: "duration_ms",
  checks: [
    "metadata_hint_present",
    "duration_metadata_present",
    "duration_metadata_normalized",
    "frame_rate_checked",
    "expected_media_type_checked",
    "path_safety_checked",
    "provided_metadata_duration_completed",
    "unsupported_media_reported"
  ],
  max_input_size: 20000,
  max_runtime_ms: 1000,
  supports_batching: false,
  supports_streaming: false,
  cache_policy: "input_digest",
  status: "trusted",
  owner: "caleb-ai-core"
} as const satisfies HollowManifest;

export const mediaHollowManifests = [
  imageDimensionsManifest,
  aspectRatioManifest,
  audioDurationManifest,
  videoDurationManifest
] as const satisfies readonly HollowManifest[];

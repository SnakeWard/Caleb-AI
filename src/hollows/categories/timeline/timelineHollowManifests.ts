import type { HollowManifest } from "../../../types/hollow.js";

export const timelineSchemaCheckManifest = {
  hollow_id: "hollow.timeline.schema_check",
  hollow_name: "Timeline Schema Check Hollow",
  hollow_version: "1.0.0",
  schema_version: "1.0.0",
  category: "timeline",
  description:
    "Validates supplied Hollowcut timeline and project-state objects for read-only schema shape and basic structural integrity.",
  input_type: "timeline.schema_check.input",
  input_schema_ref: "schemas/hollows/timeline/schema-check.input.json",
  output_schema_ref: "schemas/hollows/timeline/schema-check.output.json",
  permissions: ["read_only"],
  permissions_required: ["read_only"],
  file_access_scope: "none",
  network_access: false,
  execution_mode: "local_inspection",
  deterministic: true,
  deterministic_level: "strict",
  result_units: "timeline_schema",
  checks: [
    "timeline_present",
    "timeline_required_fields_checked",
    "timeline_items_checked",
    "timeline_tracks_checked",
    "timeline_references_checked",
    "timeline_summary_created",
    "supplied_state_only_confirmed"
  ],
  max_input_size: 200000,
  max_runtime_ms: 1000,
  supports_batching: false,
  supports_streaming: false,
  cache_policy: "input_digest",
  status: "trusted",
  owner: "caleb-ai-core"
} as const satisfies HollowManifest;

export const timelineDurationConsistencyManifest = {
  hollow_id: "hollow.timeline.duration_consistency",
  hollow_name: "Timeline Duration Consistency Hollow",
  hollow_version: "1.0.0",
  schema_version: "1.0.0",
  category: "timeline",
  description:
    "Validates supplied Hollowcut timeline duration and item timing consistency without reading, rendering, or mutating files.",
  input_type: "timeline.duration_consistency.input",
  input_schema_ref: "schemas/hollows/timeline/duration-consistency.input.json",
  output_schema_ref: "schemas/hollows/timeline/duration-consistency.output.json",
  permissions: ["read_only"],
  permissions_required: ["read_only"],
  file_access_scope: "none",
  network_access: false,
  execution_mode: "local_inspection",
  deterministic: true,
  deterministic_level: "strict",
  result_units: "timeline_duration",
  checks: [
    "timeline_present",
    "timeline_duration_checked",
    "timeline_item_timing_checked",
    "timeline_max_item_end_calculated",
    "supplied_state_only_confirmed"
  ],
  max_input_size: 200000,
  max_runtime_ms: 1000,
  supports_batching: false,
  supports_streaming: false,
  cache_policy: "input_digest",
  status: "trusted",
  owner: "caleb-ai-core"
} as const satisfies HollowManifest;

export const timelineAssetReferenceCheckManifest = {
  hollow_id: "hollow.timeline.asset_reference_check",
  hollow_name: "Timeline Asset Reference Check Hollow",
  hollow_version: "1.0.0",
  schema_version: "1.0.0",
  category: "timeline",
  description:
    "Validates supplied Hollowcut timeline item asset references against supplied project assets without file existence checks.",
  input_type: "timeline.asset_reference_check.input",
  input_schema_ref: "schemas/hollows/timeline/asset-reference-check.input.json",
  output_schema_ref: "schemas/hollows/timeline/asset-reference-check.output.json",
  permissions: ["read_only"],
  permissions_required: ["read_only"],
  file_access_scope: "none",
  network_access: false,
  execution_mode: "local_inspection",
  deterministic: true,
  deterministic_level: "strict",
  result_units: "timeline_asset_refs",
  checks: [
    "timeline_present",
    "assets_checked",
    "timeline_item_asset_refs_checked",
    "unused_assets_checked",
    "supplied_state_only_confirmed"
  ],
  max_input_size: 200000,
  max_runtime_ms: 1000,
  supports_batching: false,
  supports_streaming: false,
  cache_policy: "input_digest",
  status: "trusted",
  owner: "caleb-ai-core"
} as const satisfies HollowManifest;

export const timelineTrackReferenceCheckManifest = {
  hollow_id: "hollow.timeline.track_reference_check",
  hollow_name: "Timeline Track Reference Check Hollow",
  hollow_version: "1.0.0",
  schema_version: "1.0.0",
  category: "timeline",
  description:
    "Validates supplied Hollowcut timeline item track references and track item lists without overlap checking or mutation.",
  input_type: "timeline.track_reference_check.input",
  input_schema_ref: "schemas/hollows/timeline/track-reference-check.input.json",
  output_schema_ref: "schemas/hollows/timeline/track-reference-check.output.json",
  permissions: ["read_only"],
  permissions_required: ["read_only"],
  file_access_scope: "none",
  network_access: false,
  execution_mode: "local_inspection",
  deterministic: true,
  deterministic_level: "strict",
  result_units: "timeline_track_refs",
  checks: [
    "timeline_present",
    "tracks_checked",
    "timeline_item_track_refs_checked",
    "track_item_lists_checked",
    "supplied_state_only_confirmed"
  ],
  max_input_size: 200000,
  max_runtime_ms: 1000,
  supports_batching: false,
  supports_streaming: false,
  cache_policy: "input_digest",
  status: "trusted",
  owner: "caleb-ai-core"
} as const satisfies HollowManifest;

export const timelineTemporalIntegrityCheckManifest = {
  hollow_id: "hollow.timeline.temporal_integrity_check",
  hollow_name: "Timeline Temporal Integrity Check Hollow",
  hollow_version: "1.0.0",
  schema_version: "1.0.0",
  category: "timeline",
  description:
    "Validates supplied Hollowcut timeline for temporal integrity: negative durations, end-before-start, per-track overlaps, gaps, ordering, duration consistency, and optional project cross-duration. Supplied-state only.",
  input_type: "timeline.temporal_integrity_check.input",
  input_schema_ref: "schemas/hollows/timeline/temporal-integrity-check.input.json",
  output_schema_ref: "schemas/hollows/timeline/temporal-integrity-check.output.json",
  permissions: ["read_only"],
  permissions_required: ["read_only"],
  file_access_scope: "none",
  network_access: false,
  execution_mode: "local_inspection",
  deterministic: true,
  deterministic_level: "strict",
  result_units: "timeline_temporal_integrity",
  checks: [
    "timeline_present",
    "item_timing_validated",
    "no_negative_durations",
    "no_end_before_start",
    "overlaps_checked",
    "gaps_checked",
    "duration_consistency_checked",
    "project_timeline_cross_checked",
    "supplied_state_only_confirmed"
  ],
  max_input_size: 200000,
  max_runtime_ms: 1000,
  supports_batching: false,
  supports_streaming: false,
  cache_policy: "input_digest",
  status: "trusted",
  owner: "caleb-ai-core"
} as const satisfies HollowManifest;

export const timelineHollowManifests = [
  timelineSchemaCheckManifest,
  timelineDurationConsistencyManifest,
  timelineAssetReferenceCheckManifest,
  timelineTrackReferenceCheckManifest,
  timelineTemporalIntegrityCheckManifest
] as const satisfies readonly HollowManifest[];

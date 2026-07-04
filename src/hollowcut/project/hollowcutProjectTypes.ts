export type HollowcutAssetType = "image" | "audio" | "video" | "text" | "unknown";
export type HollowcutExpectedMediaType = "image" | "audio" | "video" | "unknown";
export type HollowcutTrackType = "visual" | "audio" | "caption" | "narration" | "effect";
export type HollowcutExportPlatform = "youtube" | "youtube_shorts" | "tiktok" | "instagram" | "custom";
export type HollowcutExportStatus = "planned" | "validated" | "exported";
export type HollowcutValidationStatus = "not_validated" | "valid" | "warnings" | "invalid";
export type HollowcutValidationCheckStatus = "pass" | "warning" | "fail" | "skipped";
export type HollowcutProjectValidationSeverity = "warning" | "error";

export interface HollowcutProject {
  schema_version: string;
  project_id: string;
  project_name: string;
  created_at: string;
  updated_at: string;
  project_root: string;
  assets: HollowcutAsset[];
  timeline: HollowcutTimeline;
  tracks: HollowcutTrack[];
  captions: HollowcutCaption[];
  narration: HollowcutNarration;
  export_targets: HollowcutExportTarget[];
  validation_state: HollowcutValidationState;
  ledger_refs: string[];
  artifact_refs: string[];
  provenance: HollowcutProjectProvenance;
}

export interface HollowcutAsset {
  asset_id: string;
  asset_type: HollowcutAssetType;
  relative_path?: string;
  display_name: string;
  expected_media_type?: HollowcutExpectedMediaType;
  metadata_hint?: Record<string, unknown>;
  verified_metadata?: Record<string, unknown> | null;
  evidence_refs: string[];
  warnings: string[];
}

export interface HollowcutTimeline {
  timeline_id: string;
  duration_ms: number;
  fps: number;
  width: number;
  height: number;
  aspect_ratio: string;
  items: HollowcutTimelineItem[];
}

export interface HollowcutTimelineItem {
  item_id: string;
  asset_id: string;
  track_id: string;
  start_ms: number;
  duration_ms: number;
  end_ms: number;
  transition_in: string | null;
  transition_out: string | null;
  effects: Record<string, unknown>[];
  warnings: string[];
}

export interface HollowcutTrack {
  track_id: string;
  track_type: HollowcutTrackType;
  name: string;
  locked: boolean;
  muted: boolean;
  items: string[];
}

export interface HollowcutCaption {
  caption_id: string;
  text: string;
  start_ms: number;
  end_ms: number;
  style_ref: string | null;
  reading_speed_wpm: number | null;
  warnings: string[];
}

export interface HollowcutNarration {
  script: string;
  voice_profile: string | null;
  estimated_duration_ms: number | null;
  audio_asset_id: string | null;
  evidence_refs: string[];
}

export interface HollowcutExportTarget {
  target_id: string;
  platform: HollowcutExportPlatform;
  width: number;
  height: number;
  fps: number;
  format: string;
  status: HollowcutExportStatus;
  output_path: string | null;
  requires_approval: boolean;
  warnings: string[];
}

export interface HollowcutValidationState {
  last_validated_at: string | null;
  validation_status: HollowcutValidationStatus;
  checks: HollowcutValidationCheck[];
  warnings: string[];
  errors: string[];
  evidence_refs: string[];
  report_refs: string[];
}

export interface HollowcutValidationCheck {
  check_id: string;
  status: HollowcutValidationCheckStatus;
  message: string;
  evidence_refs: string[];
}

export interface HollowcutProjectProvenance {
  created_by?: string | null;
  source?: string | null;
  notes?: string[];
  [key: string]: unknown;
}

export interface HollowcutProjectValidationIssue {
  path: string;
  severity: HollowcutProjectValidationSeverity;
  code: string;
  message: string;
}

export interface HollowcutProjectValidationResult {
  valid: boolean;
  warning_count: number;
  error_count: number;
  issues: HollowcutProjectValidationIssue[];
  normalized_summary: HollowcutProjectValidationSummary;
}

export interface HollowcutProjectValidationSummary {
  project_id: string | null;
  project_name: string | null;
  asset_count: number;
  track_count: number;
  timeline_item_count: number;
  caption_count: number;
  export_target_count: number;
  ledger_ref_count: number;
  artifact_ref_count: number;
}

// Supplied-state export_profile contract (for hollow.hollowcut.export_readiness_check input).
// Deterministic structural only. Missing profile remains allowed (current contract).
export type HollowcutExportFormat = "mp4" | "webm" | "mov" | "png_sequence" | "json_manifest";
export type HollowcutQualityPreset = "draft" | "standard" | "high";

export interface HollowcutExportProfile {
  profile_id?: string;
  target_platform?: HollowcutExportPlatform;
  format?: HollowcutExportFormat;
  width?: number;
  height?: number;
  fps?: number;
  duration_limit_ms?: number;
  include_audio?: boolean;
  include_captions?: boolean;
  quality_preset?: HollowcutQualityPreset;
  // Unknown fields will be flagged as warnings by validator (no invention of engine behavior).
  [key: string]: unknown;
}

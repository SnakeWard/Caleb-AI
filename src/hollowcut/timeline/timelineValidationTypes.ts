export type TimelineValidationSeverity = "warning" | "error";

export type TimelineValidationStatus = "valid" | "warnings" | "invalid";

export type TimelineItemType = "visual" | "audio" | "caption" | "narration" | "effect" | "unknown";

export type TimelineTrackType = "visual" | "audio" | "caption" | "narration" | "effect";

export type TimelineMarkerType = "beat" | "scene" | "warning" | "note" | "custom";

export type TimelineOverlapPolicy = "allow" | "warn" | "error";

export interface TimelineValidationIssue {
  readonly path: string;
  readonly severity: TimelineValidationSeverity;
  readonly code: string;
  readonly message: string;
  readonly item_ids?: readonly string[];
  readonly track_ids?: readonly string[];
  readonly asset_ids?: readonly string[];
}

export interface TimelineValidationCheck {
  readonly check_id: string;
  readonly status: "pass" | "warning" | "fail" | "skipped";
  readonly message: string;
  readonly issue_codes: readonly string[];
}

export interface TimelineValidationSummary {
  readonly timeline_id: string | null;
  readonly item_count: number;
  readonly track_count: number;
  readonly marker_count: number;
  readonly duration_ms: number | null;
  readonly max_item_end_ms: number | null;
  readonly visual_item_count: number;
  readonly audio_item_count: number;
  readonly caption_item_count: number;
  readonly disabled_item_count: number;
  readonly warning_count: number;
  readonly error_count: number;
}

export interface TimelineValidationResult {
  readonly valid: boolean;
  readonly status: TimelineValidationStatus;
  readonly warning_count: number;
  readonly error_count: number;
  readonly checks: readonly TimelineValidationCheck[];
  readonly issues: readonly TimelineValidationIssue[];
  readonly summary: TimelineValidationSummary;
}

export interface TimelineReferenceSets {
  readonly asset_ids: ReadonlySet<string>;
  readonly track_ids: ReadonlySet<string>;
  readonly item_ids: ReadonlySet<string>;
}

export interface TimelineItemTiming {
  readonly item_id: string;
  readonly track_id: string;
  readonly item_type: TimelineItemType;
  readonly start_ms: number;
  readonly duration_ms: number;
  readonly end_ms: number;
  readonly enabled: boolean;
  readonly layer: number;
}

export interface TimelineOverlap {
  readonly first_item_id: string;
  readonly second_item_id: string;
  readonly track_id: string;
  readonly overlap_start_ms: number;
  readonly overlap_end_ms: number;
  readonly overlap_duration_ms: number;
  readonly policy: TimelineOverlapPolicy;
}

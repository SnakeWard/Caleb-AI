import type { JsonObject, JsonValue } from "../types/common.js";
import type { CalebCheck, CalebWarning } from "../types/invocation.js";
import type {
  HollowcutProject,
  HollowcutTimeline,
  HollowcutTimelineItem,
  HollowcutTrack,
  HollowcutAsset
} from "./project/hollowcutProjectTypes.js";
import {
  createHollowcutValidationIssue,
  validateHollowcutProject
} from "./project/hollowcutProjectValidation.js";
import type {
  TimelineValidationIssue,
  TimelineValidationCheck,
  TimelineValidationResult,
  TimelineValidationSeverity
} from "./timeline/timelineValidationTypes.js";
import {
  createTimelineValidationIssue,
  createTimelineValidationCheck,
  createTimelineValidationResult
} from "./timeline/timelineValidationHelpers.js";
import type { HollowImplementation } from "../hollows/runnerTypes.js";
import type { HollowManifest } from "../types/hollow.js";

export const hollowcutProjectTimelineCrossCheckManifest: HollowManifest = {
  hollow_id: "hollow.hollowcut.project_timeline_cross_check",
  hollow_name: "Hollowcut Project + Timeline Cross Consistency Check Hollow",
  hollow_version: "1.0.0",
  schema_version: "1.0.0",
  category: "project",
  description: "Validates deterministic cross-consistency between supplied Hollowcut project state and timeline state (asset references, track references, ID linking, no orphans/duplicates). Supplied-state only; no file access or mutation.",
  input_type: "hollowcut.project_timeline_cross_check.input",
  input_schema_ref: "schemas/hollows/hollowcut/project-timeline-cross-check.input.json",
  output_schema_ref: "schemas/hollows/hollowcut/project-timeline-cross-check.output.json",
  permissions: ["read_only"],
  permissions_required: ["read_only"],
  file_access_scope: "none",
  network_access: false,
  execution_mode: "local_inspection",
  deterministic: true,
  deterministic_level: "strict",
  result_units: "hollowcut_cross_consistency",
  checks: [
    "project_state_present",
    "timeline_state_present",
    "project_timeline_id_link_checked",
    "asset_references_checked",
    "track_references_checked",
    "no_duplicate_ids",
    "no_orphaned_references",
    "required_collections_checked",
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

export const hollowcutProjectTimelineCrossCheckImplementation: HollowImplementation = ({ input_payload }) => {
  const result = validateProjectTimelineCrossConsistency(input_payload);
  const warningIssues = result.issues.filter((i: any) => i.severity === "warning");

  return {
    result: result as unknown as JsonValue,
    result_units: "hollowcut_cross_consistency",
    checks: result.checks as any,
    warnings: warningIssues.map((issue: any) => ({ warning_id: issue.code, message: issue.message, severity: "warning" as const })),
    artifact_hashes: [],
    confidence_level: "deterministic_supplied_state_hollowcut_project_timeline_cross"
  };
};

export function validateProjectTimelineCrossConsistency(input: JsonValue): any {
  const issues: any[] = [];
  const checks: any[] = [];

  if (!isRecord(input)) {
    issues.push(createHollowcutValidationIssue("$", "error", "input_not_object", "Cross check input must be an object containing project_state and/or timeline_state."));
    return buildCrossResult(issues, checks);
  }

  // Support both { project_state, timeline_state } and direct project (which embeds timeline)
  const projectCandidate = (input as any).project_state ?? input;
  const timelineCandidate = (input as any).timeline_state ?? (isRecord(projectCandidate) ? (projectCandidate as any).timeline : null);

  checks.push(createCheck("project_state_present", "Project State Present"));
  checks.push(createCheck("timeline_state_present", "Timeline State Present"));

  if (!isRecord(projectCandidate)) {
    issues.push(createHollowcutValidationIssue("$.project_state", "error", "project_state_missing", "project_state must be a supplied Hollowcut project object."));
  } else {
    // Run basic project validation for structural integrity
    const projectResult = validateHollowcutProject(projectCandidate);
    issues.push(...projectResult.issues);
  }

  if (!isRecord(timelineCandidate)) {
    issues.push(createHollowcutValidationIssue("$.timeline_state", "error", "timeline_state_missing", "timeline_state (or embedded timeline in project) is required for cross-consistency."));
  }

  // Extract sets for cross checks
  const projectAssets = new Set<string>();
  const projectTracks = new Set<string>();
  let projectId: string | null = null;
  let timelineId: string | null = null;

  if (isRecord(projectCandidate)) {
    projectId = typeof (projectCandidate as any).project_id === "string" ? (projectCandidate as any).project_id : null;
    const assets = Array.isArray((projectCandidate as any).assets) ? (projectCandidate as any).assets : [];
    assets.forEach((a: any) => { if (typeof a?.asset_id === "string") projectAssets.add(a.asset_id); });

    const tracks = Array.isArray((projectCandidate as any).tracks) ? (projectCandidate as any).tracks : [];
    tracks.forEach((t: any) => { if (typeof t?.track_id === "string") projectTracks.add(t.track_id); });
  }

  const timelineItems: any[] = [];
  if (isRecord(timelineCandidate)) {
    timelineId = typeof (timelineCandidate as any).timeline_id === "string" ? (timelineCandidate as any).timeline_id : null;
    const items = Array.isArray((timelineCandidate as any).items) ? (timelineCandidate as any).items : [];
    timelineItems.push(...items);
  } else if (isRecord(projectCandidate) && isRecord((projectCandidate as any).timeline)) {
    // Fallback to embedded timeline in project
    const emb = (projectCandidate as any).timeline;
    timelineId = typeof emb.timeline_id === "string" ? emb.timeline_id : null;
    const items = Array.isArray(emb.items) ? emb.items : [];
    timelineItems.push(...items);
  }

  // ID linking checks
  if (projectId && timelineId && projectId !== timelineId) {
    // Note: current schemas may not always link them directly; only flag if both present and mismatch
    issues.push(createHollowcutValidationIssue("$.timeline_state.timeline_id", "warning", "timeline_project_id_mismatch", "timeline_id and project_id are both present but do not match."));
  }

  // Asset reference cross-check
  const seenAssetRefs = new Set<string>();
  timelineItems.forEach((item: any, idx: number) => {
    const assetId = typeof item?.asset_id === "string" ? item.asset_id : null;
    if (assetId) {
      seenAssetRefs.add(assetId);
      if (!projectAssets.has(assetId)) {
        issues.push(createTimelineValidationIssue(
          `$.timeline_state.items[${idx}].asset_id`,
          "error",
          "unknown_asset_reference",
          `Timeline item references asset_id '${assetId}' not present in project_state.assets.`,
          { item_ids: [item.item_id], asset_ids: [assetId] }
        ));
      }
    }
  });

  // Track reference cross-check
  timelineItems.forEach((item: any, idx: number) => {
    const trackId = typeof item?.track_id === "string" ? item.track_id : null;
    if (trackId && !projectTracks.has(trackId)) {
      issues.push(createTimelineValidationIssue(
        `$.timeline_state.items[${idx}].track_id`,
        "error",
        "unknown_track_reference",
        `Timeline item references track_id '${trackId}' not present in project_state.tracks.`,
        { item_ids: [item.item_id], track_ids: [trackId] }
      ));
    }
  });

  // Duplicate ID detection (simple)
  const itemIds = new Set<string>();
  timelineItems.forEach((item: any) => {
    if (typeof item?.item_id === "string") {
      if (itemIds.has(item.item_id)) {
        issues.push(createTimelineValidationIssue("$.timeline_state.items", "error", "duplicate_item_id", `Duplicate item_id '${item.item_id}' in timeline.`));
      }
      itemIds.add(item.item_id);
    }
  });

  // Required collections check
  if (isRecord(projectCandidate) && (!Array.isArray((projectCandidate as any).assets) || (projectCandidate as any).assets.length === 0)) {
    issues.push(createHollowcutValidationIssue("$.project_state.assets", "warning", "empty_assets", "Project state has no assets; cross-reference checks are limited."));
  }

  if (timelineItems.length === 0) {
    issues.push(createTimelineValidationIssue("$.timeline_state.items", "warning", "empty_timeline_items", "Timeline has no items; cross-reference checks are limited."));
  }

  // Build result using existing patterns
  const errorCount = issues.filter((i: any) => i.severity === "error").length;
  const warningCount = issues.filter((i: any) => i.severity === "warning").length;

  const crossChecks: any[] = [
    ...checks,
    createCheck("project_timeline_id_link_checked", "Project/Timeline ID Link Checked"),
    createCheck("asset_references_checked", "Asset References Cross-Checked"),
    createCheck("track_references_checked", "Track References Cross-Checked"),
    createCheck("no_duplicate_ids", "No Duplicate IDs"),
    createCheck("no_orphaned_references", "No Orphaned References"),
    createCheck("required_collections_checked", "Required Collections Checked"),
    createCheck("supplied_state_only_confirmed", "Supplied State Only Confirmed")
  ];

  return {
    valid: errorCount === 0,
    status: errorCount > 0 ? "invalid" : (warningCount > 0 ? "warnings" : "valid"),
    warning_count: warningCount,
    error_count: errorCount,
    checks: crossChecks,
    issues,
    summary: {
      project_id: projectId,
      timeline_id: timelineId,
      asset_reference_count: seenAssetRefs.size,
      warning_count: warningCount,
      error_count: errorCount
    }
  };
}

function createCheck(check_id: string, label: string): any {
  return { check_id, label, status: "completed", severity: "info" };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildCrossResult(issues: any[], checks: any[]) {
  const errorCount = issues.filter((i: any) => i.severity === "error").length;
  const warningCount = issues.filter((i: any) => i.severity === "warning").length;
  return {
    valid: errorCount === 0,
    status: errorCount > 0 ? "invalid" : (warningCount > 0 ? "warnings" : "valid"),
    warning_count: warningCount,
    error_count: errorCount,
    checks,
    issues,
    summary: { project_id: null, timeline_id: null, asset_reference_count: 0, warning_count: warningCount, error_count: errorCount }
  };
}

export const hollowcutProjectTimelineCrossCheckHollow = hollowcutProjectTimelineCrossCheckImplementation;
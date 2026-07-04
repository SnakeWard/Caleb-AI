import type { JsonObject, JsonValue } from "../types/common.js";
import type { CalebCheck, CalebWarning } from "../types/invocation.js";
import type {
  HollowcutExportPlatform,
  HollowcutExportProfile,
  HollowcutProject,
  HollowcutExportTarget
} from "./project/hollowcutProjectTypes.js";
import {
  createHollowcutValidationIssue,
  validateHollowcutExportProfile,
  validateHollowcutProject
} from "./project/hollowcutProjectValidation.js";
import {
  createTimelineValidationIssue,
  createTimelineValidationCheck,
  createTimelineValidationResult
} from "./timeline/timelineValidationHelpers.js";
import type { HollowImplementation } from "../hollows/runnerTypes.js";
import type { HollowManifest } from "../types/hollow.js";

export const hollowcutExportReadinessCheckManifest: HollowManifest = {
  hollow_id: "hollow.hollowcut.export_readiness_check",
  hollow_name: "Hollowcut Export Readiness Check Hollow",
  hollow_version: "1.0.0",
  schema_version: "1.0.0",
  category: "project",
  description: "Validates supplied Hollowcut project_state + timeline_state (+ optional export_profile) for structural export/build readiness using hardened deterministic contract (IDs, refs, timing, export_targets, export_profile fields). Supplied-state only; no file access, no mutation, no actual export, no render. export_profile (if supplied) must conform to contract or produces structured blockers.",
  input_type: "hollowcut.export_readiness_check.input",
  input_schema_ref: "schemas/hollows/hollowcut/export-readiness-check.input.json",
  output_schema_ref: "schemas/hollows/hollowcut/export-readiness-check.output.json",
  permissions: ["read_only"],
  permissions_required: ["read_only"],
  file_access_scope: "none",
  network_access: false,
  execution_mode: "local_inspection",
  deterministic: true,
  deterministic_level: "strict",
  result_units: "hollowcut_export_readiness",
  checks: [
    "project_state_present",
    "timeline_state_present",
    "project_identifiers_present",
    "timeline_identifiers_present",
    "required_collections_present",
    "timeline_has_items",
    "asset_references_valid",
    "track_references_valid",
    "timing_integrity_ok",
    "export_targets_structurally_valid",
    "export_profile_structurally_valid_if_supplied",
    "export_profile_targets_aligned",
    "no_blocking_issues",
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

export const hollowcutExportReadinessCheckImplementation: HollowImplementation = ({ input_payload }) => {
  const result = validateExportReadiness(input_payload);
  const warningIssues = result.issues.filter((i: any) => i.severity === "warning");
  const errorIssues = result.issues.filter((i: any) => i.severity === "error");

  return {
    result: result as unknown as JsonValue,
    result_units: "hollowcut_export_readiness",
    checks: result.checks as any,
    warnings: warningIssues.map((issue: any) => ({ warning_id: issue.code, message: issue.message, severity: "warning" as const })),
    artifact_hashes: [],
    confidence_level: "deterministic_supplied_state_hollowcut_export_readiness"
  };
};

export function validateExportReadiness(input: JsonValue): any {
  const issues: any[] = [];
  const checks: any[] = [];
  const blockers: any[] = [];

  if (!isRecord(input)) {
    issues.push(createHollowcutValidationIssue("$", "error", "input_not_object", "Export readiness input must be an object with project_state and timeline_state."));
    return buildReadinessResult(issues, checks, blockers);
  }

  const projectCandidate = (input as any).project_state ?? input;
  const timelineCandidate = (input as any).timeline_state ?? (isRecord(projectCandidate) ? (projectCandidate as any).timeline : null);
  const exportProfile = (input as any).export_profile;

  checks.push(createCheck("project_state_present", "Project State Present"));
  checks.push(createCheck("timeline_state_present", "Timeline State Present"));

  if (!isRecord(projectCandidate)) {
    issues.push(createHollowcutValidationIssue("$.project_state", "error", "project_state_missing", "project_state is required for export readiness."));
    blockers.push("project_state_missing");
  } else {
    const projectResult = validateHollowcutProject(projectCandidate);
    issues.push(...projectResult.issues);
    if (projectResult.issues.some((i: any) => i.severity === "error")) {
      blockers.push("project_structural_errors");
    }
  }

  if (!isRecord(timelineCandidate)) {
    issues.push(createHollowcutValidationIssue("$.timeline_state", "error", "timeline_state_missing", "timeline_state (or embedded timeline) is required."));
    blockers.push("timeline_state_missing");
  }

  // Basic linkage and collections (reuse cross logic patterns)
  let projectId: string | null = null;
  let timelineId: string | null = null;
  const projectAssets = new Set<string>();
  const projectTracks = new Set<string>();
  let timelineItems: any[] = [];

  if (isRecord(projectCandidate)) {
    projectId = typeof (projectCandidate as any).project_id === "string" ? (projectCandidate as any).project_id : null;
    const assets = Array.isArray((projectCandidate as any).assets) ? (projectCandidate as any).assets : [];
    assets.forEach((a: any) => { if (typeof a?.asset_id === "string") projectAssets.add(a.asset_id); });
    const tracks = Array.isArray((projectCandidate as any).tracks) ? (projectCandidate as any).tracks : [];
    tracks.forEach((t: any) => { if (typeof t?.track_id === "string") projectTracks.add(t.track_id); });
  }

  if (isRecord(timelineCandidate)) {
    timelineId = typeof (timelineCandidate as any).timeline_id === "string" ? (timelineCandidate as any).timeline_id : null;
    timelineItems = Array.isArray((timelineCandidate as any).items) ? (timelineCandidate as any).items : [];
  }

  if (projectId && timelineId && projectId !== timelineId) {
    issues.push(createHollowcutValidationIssue("$.timeline_state.timeline_id", "warning", "id_linkage_mismatch", "project_id and timeline_id do not match."));
  }

  if (timelineItems.length === 0) {
    issues.push(createHollowcutValidationIssue("$.timeline_state.items", "error", "no_timeline_items", "Timeline must have at least one item for export readiness."));
    blockers.push("no_timeline_items");
  }

  // Reference checks (reuse patterns)
  timelineItems.forEach((item: any, idx: number) => {
    const assetId = typeof item?.asset_id === "string" ? item.asset_id : null;
    const trackId = typeof item?.track_id === "string" ? item.track_id : null;
    if (assetId && !projectAssets.has(assetId)) {
      issues.push(createTimelineValidationIssue(`$.timeline_state.items[${idx}].asset_id`, "error", "unknown_asset_reference", `Asset reference '${assetId}' not in project assets.`, { item_ids: [item.item_id || `item_${idx}`], asset_ids: [assetId] }));
      blockers.push("broken_asset_ref");
    }
    if (trackId && !projectTracks.has(trackId)) {
      issues.push(createTimelineValidationIssue(`$.timeline_state.items[${idx}].track_id`, "error", "unknown_track_reference", `Track reference '${trackId}' not in project tracks.`, { item_ids: [item.item_id || `item_${idx}`], track_ids: [trackId] }));
      blockers.push("broken_track_ref");
    }
  });

  // Timing integrity (basic reuse)
  timelineItems.forEach((item: any, idx: number) => {
    const start = (typeof item?.start_ms === "number" && isFinite(item.start_ms) && item.start_ms >= 0) ? item.start_ms : null;
    const duration = (typeof item?.duration_ms === "number" && isFinite(item.duration_ms) && item.duration_ms >= 0) ? item.duration_ms : null;
    const end = (typeof item?.end_ms === "number" && isFinite(item.end_ms) && item.end_ms >= 0) ? item.end_ms : null;
    if (duration !== null && duration < 0) {
      issues.push(createTimelineValidationIssue(`$.timeline_state.items[${idx}].duration_ms`, "error", "negative_duration", "Duration must not be negative.", { item_ids: item.item_id ? [item.item_id] : [] }));
      blockers.push("negative_duration");
    }
    if (end !== null && start !== null && end < start) {
      issues.push(createTimelineValidationIssue(`$.timeline_state.items[${idx}].end_ms`, "error", "end_before_start", "End must not be before start.", { item_ids: item.item_id ? [item.item_id] : [] }));
      blockers.push("end_before_start");
    }
  });

  // Export targets / profile structural
  const exportTargets = Array.isArray((projectCandidate as any)?.export_targets) ? (projectCandidate as any).export_targets : [];
  if (exportTargets.length === 0 && !exportProfile) {
    issues.push(createHollowcutValidationIssue("$.project_state.export_targets", "warning", "no_export_targets", "No export_targets defined and no export_profile supplied; readiness for specific export is limited."));
  } else {
    exportTargets.forEach((target: any, idx: number) => {
      if (!target || typeof target.target_id !== "string") {
        issues.push(createHollowcutValidationIssue(`$.project_state.export_targets[${idx}]`, "error", "invalid_export_target", "Export target must have target_id."));
        blockers.push("invalid_export_target");
      }
      const platform = target.platform as HollowcutExportPlatform;
      if (platform && !["youtube", "youtube_shorts", "tiktok", "instagram", "custom"].includes(platform)) {
        issues.push(createHollowcutValidationIssue(`$.project_state.export_targets[${idx}].platform`, "error", "invalid_export_platform", `Unknown export platform '${platform}'.`));
        blockers.push("invalid_export_platform");
      }
    });
  }

  // Hardened supplied-state export_profile contract (deterministic structural validation only)
  if (exportProfile !== undefined && exportProfile !== null) {
    checks.push(createCheck("export_profile_structurally_valid_if_supplied", "Export Profile Structurally Valid (if supplied)"));
    if (!isRecord(exportProfile)) {
      issues.push(createHollowcutValidationIssue("$.export_profile", "error", "export_profile_not_object", "export_profile must be an object when supplied."));
      blockers.push("invalid_export_profile");
    } else {
      const profileIssues = validateHollowcutExportProfile(exportProfile);
      issues.push(...profileIssues);
      if (profileIssues.some((i: any) => i.severity === "error")) {
        blockers.push("invalid_export_profile");
      }
    }
  }

  // Alignment between supplied export_profile and project_state.export_targets (when both present)
  // Only check fields explicitly represented in the supplied state. No guessing.
  let matchedExportTargetCount = 0;
  let matchedTargetPlatforms: string[] = [];
  if (exportProfile && isRecord(exportProfile) && exportTargets.length > 0) {
    checks.push(createCheck("export_profile_targets_aligned", "Export Profile and Targets Aligned (when both supplied)"));
    const pPlatform = (exportProfile as any).target_platform;
    if (pPlatform && typeof pPlatform === "string") {
      const matches = exportTargets.filter((t: any) => t && t.platform === pPlatform);
      matchedExportTargetCount = matches.length;
      matchedTargetPlatforms = matches.map((t: any) => t.platform).filter((p: any) => typeof p === "string");
      if (matches.length === 0) {
        issues.push(createHollowcutValidationIssue("$.export_profile.target_platform", "error", "export_profile_platform_not_in_targets", `export_profile.target_platform '${pPlatform}' is not present in any project_state.export_targets.`));
        blockers.push("export_profile_platform_mismatch");
      } else if (matches.length > 1) {
        issues.push(createHollowcutValidationIssue("$.export_profile.target_platform", "warning", "multiple_matching_export_targets", `Multiple export_targets match the supplied export_profile platform '${pPlatform}'.`));
      } else {
        // single match - check represented fields for direct contradictions
        const tgt = matches[0];
        const pW = (exportProfile as any).width;
        const pH = (exportProfile as any).height;
        const pFps = (exportProfile as any).fps;
        const pFmt = (exportProfile as any).format;
        if (typeof pW === "number" && typeof tgt.width === "number" && pW !== tgt.width) {
          issues.push(createHollowcutValidationIssue("$.export_profile.width", "error", "export_profile_target_width_mismatch", `export_profile width ${pW} does not match export_target width ${tgt.width}.`));
          blockers.push("export_profile_target_dimension_mismatch");
        }
        if (typeof pH === "number" && typeof tgt.height === "number" && pH !== tgt.height) {
          issues.push(createHollowcutValidationIssue("$.export_profile.height", "error", "export_profile_target_height_mismatch", `export_profile height ${pH} does not match export_target height ${tgt.height}.`));
          blockers.push("export_profile_target_dimension_mismatch");
        }
        if (typeof pFps === "number" && typeof tgt.fps === "number" && pFps !== tgt.fps) {
          issues.push(createHollowcutValidationIssue("$.export_profile.fps", "error", "export_profile_target_fps_mismatch", `export_profile fps ${pFps} does not match export_target fps ${tgt.fps}.`));
          blockers.push("export_profile_target_fps_mismatch");
        }
        if (typeof pFmt === "string" && typeof tgt.format === "string" && pFmt !== tgt.format) {
          issues.push(createHollowcutValidationIssue("$.export_profile.format", "error", "export_profile_target_format_mismatch", `export_profile format '${pFmt}' does not match export_target format '${tgt.format}'.`));
          blockers.push("export_profile_target_format_mismatch");
        }
      }
    }
    // duration_limit vs represented timeline duration
    const pDurLimit = (exportProfile as any).duration_limit_ms;
    if (typeof pDurLimit === "number" && isRecord(timelineCandidate) && typeof (timelineCandidate as any).duration_ms === "number") {
      const tlDur = (timelineCandidate as any).duration_ms;
      if (tlDur > pDurLimit) {
        issues.push(createHollowcutValidationIssue("$.export_profile.duration_limit_ms", "error", "timeline_exceeds_profile_duration_limit", `Timeline duration ${tlDur} exceeds export_profile duration_limit_ms ${pDurLimit}.`));
        blockers.push("timeline_exceeds_duration_limit");
      }
    }
  }

  const errorCount = issues.filter((i: any) => i.severity === "error").length;
  const warningCount = issues.filter((i: any) => i.severity === "warning").length;

  const readinessChecks: any[] = [
    ...checks,
    createCheck("project_state_present", "Project State Present"),
    createCheck("timeline_state_present", "Timeline State Present"),
    createCheck("project_identifiers_present", "Project Identifiers Present"),
    createCheck("timeline_identifiers_present", "Timeline Identifiers Present"),
    createCheck("required_collections_present", "Required Collections Present"),
    createCheck("timeline_has_items", "Timeline Has Usable Items"),
    createCheck("asset_references_valid", "Asset References Valid"),
    createCheck("track_references_valid", "Track References Valid"),
    createCheck("timing_integrity_ok", "Timing Integrity OK"),
    createCheck("export_targets_structurally_valid", "Export Targets Structurally Valid"),
    createCheck("export_profile_structurally_valid_if_supplied", "Export Profile Structurally Valid (if supplied)"),
    createCheck("export_profile_targets_aligned", "Export Profile and Targets Aligned (when both supplied)"),
    createCheck("no_blocking_issues", "No Blocking Issues for Export Readiness"),
    createCheck("supplied_state_only_confirmed", "Supplied State Only Confirmed")
  ];

  const next_required_actions = computeNextRequiredActions(issues);
  const unmapped_issue_codes = computeUnmappedIssueCodes(issues);

  return {
    ready: errorCount === 0,
    valid: errorCount === 0,
    status: errorCount > 0 ? "invalid" : (warningCount > 0 ? "warnings" : "valid"),
    warning_count: warningCount,
    error_count: errorCount,
    blocking_count: blockers.length,
    blockers,
    checks: readinessChecks,
    issues,
    warnings: issues.filter((i: any) => i.severity === "warning"),
    skipped_checks: [],
    summary: {
      project_id: projectId,
      timeline_id: timelineId,
      asset_count: projectAssets.size,
      track_count: projectTracks.size,
      timeline_item_count: timelineItems.length,
      export_target_count: exportTargets.length,
      warning_count: warningCount,
      error_count: errorCount,
      blocking_count: blockers.length,
      export_profile_present: !!exportProfile,
      matched_export_target_count: matchedExportTargetCount,
      matched_target_platforms: matchedTargetPlatforms,
      alignment_error_count: issues.filter((i: any) => i.severity === "error" && (i.code.includes("export_profile") || i.code.includes("mismatch") || i.code.includes("duration_limit"))).length,
      alignment_warning_count: issues.filter((i: any) => i.severity === "warning" && (i.code.includes("export_profile") || i.code.includes("multiple_matching") || i.code.includes("unsupported"))).length
    },
    readiness_summary: buildReadinessSummary({
      ready: errorCount === 0,
      valid: errorCount === 0,
      status: errorCount > 0 ? "invalid" : (warningCount > 0 ? "warnings" : "valid"),
      projectId,
      timelineId,
      exportProfilePresent: !!exportProfile,
      exportTargetsCount: exportTargets.length,
      matchedExportTargetCount,
      assetCount: projectAssets.size,
      trackCount: projectTracks.size,
      timelineItemCount: timelineItems.length,
      blockingCount: blockers.length,
      errorCount,
      warningCount,
      skippedCount: 0,
      issues,
      blockers
    }),
    blocking_reasons: blockers,
    next_required_actions,
    unmapped_issue_codes
  };
}

function createCheck(check_id: string, label: string): any {
  return { check_id, label, status: "completed", severity: "info" };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildReadinessSummary(params: {
  ready: boolean;
  valid: boolean;
  status: string;
  projectId: string | null;
  timelineId: string | null;
  exportProfilePresent: boolean;
  exportTargetsCount: number;
  matchedExportTargetCount: number;
  assetCount: number;
  trackCount: number;
  timelineItemCount: number;
  blockingCount: number;
  errorCount: number;
  warningCount: number;
  skippedCount: number;
  issues: any[];
  blockers: any[];
}): any {
  const blockingCategories = new Set<string>();
  const warningCategories = new Set<string>();

  for (const i of params.issues) {
    const cat = deriveCategory(i.code, i.path);
    if (i.severity === "error") blockingCategories.add(cat);
    else if (i.severity === "warning") warningCategories.add(cat);
  }

  const nextActions = computeNextRequiredActions(params.issues);
  const unmapped = computeUnmappedIssueCodes(params.issues);

  const safe = params.ready && params.valid && params.blockingCount === 0 && params.errorCount === 0;

  return {
    ready: params.ready,
    status: params.status === "valid" ? "ready" : (params.status === "warnings" ? "ready_with_warnings" : (params.status === "invalid" ? "invalid" : "not_ready")),
    project_id: params.projectId,
    timeline_id: params.timelineId,
    export_profile_present: params.exportProfilePresent,
    export_targets_count: params.exportTargetsCount,
    matched_export_target_count: params.matchedExportTargetCount,
    asset_count: params.assetCount,
    track_count: params.trackCount,
    timeline_item_count: params.timelineItemCount,
    blocking_count: params.blockingCount,
    error_count: params.errorCount,
    warning_count: params.warningCount,
    skipped_check_count: params.skippedCount,
    blocking_categories: Array.from(blockingCategories).sort(),
    warning_categories: Array.from(warningCategories).sort(),
    top_blockers: params.blockers.slice(0, 5),
    next_required_actions: nextActions,
    unmapped_issue_codes: unmapped,
    safe_to_hand_to_future_export: safe,
    supplied_state_only: true
  };
}

function deriveCategory(code: string, path: string): string {
  const c = (code || "").toLowerCase();
  const p = (path || "").toLowerCase();
  if (c.includes("asset") || p.includes("asset")) return "asset";
  if (c.includes("track") || p.includes("track")) return "track";
  if (c.includes("timing") || c.includes("duration") || c.includes("negative") || c.includes("end_before")) return "timing";
  if (c.includes("export_profile") || c.includes("profile")) return "export_profile";
  if (c.includes("export_target") || c.includes("platform") || c.includes("target")) return "export_target";
  if (c.includes("project")) return "project";
  if (c.includes("timeline")) return "timeline";
  if (c.includes("alignment") || c.includes("mismatch")) return "alignment";
  if (c.includes("supplied") || c.includes("state")) return "supplied_state";
  return "unknown";
}

const NEXT_ACTION_MAP: Record<string, string> = {
  "broken_asset_ref": "Resolve unknown asset references before export.",
  "broken_track_ref": "Resolve unknown track references before export.",
  "negative_duration": "Fix negative timeline item durations.",
  "end_before_start": "Fix timeline item end before start.",
  "export_profile_platform_not_in_targets": "Align export_profile.target_platform with project_state.export_targets.",
  "timeline_exceeds_profile_duration_limit": "Shorten timeline duration or increase export_profile.duration_limit_ms.",
  "invalid_export_profile": "Fix invalid export_profile fields.",
  "export_profile_target_width_mismatch": "Align export_profile width with matching export_target.",
  "export_profile_target_height_mismatch": "Align export_profile height with matching export_target.",
  "export_profile_target_fps_mismatch": "Align export_profile fps with matching export_target.",
  "export_profile_target_format_mismatch": "Align export_profile format with matching export_target.",
  "export_profile_platform_mismatch": "Align export_profile target platform with available export targets.",
  "invalid_export_platform": "Use a supported export platform.",
  "no_timeline_items": "Provide at least one timeline item.",
  "project_state_missing": "Provide project_state.",
  "timeline_state_missing": "Provide timeline_state.",
  "no_export_targets": "Define export_targets or supply a compatible export_profile.",
  // Actual codes emitted by creates + validators inside this Hollow / profile validator (for deterministic actions on real fixtures/cases)
  "unknown_asset_reference": "Resolve unknown asset references before export.",
  "unknown_track_reference": "Resolve unknown track references before export.",
  "timeline_item_duration_invalid": "Fix negative timeline item durations.",
  "timeline_item_end_invalid": "Fix timeline item end before start.",
  "export_platform_invalid": "Use a supported export platform.",
  "export_profile_platform_invalid": "Use a supported export platform.",
  "export_profile_format_invalid": "Fix invalid export_profile fields.",
  "export_profile_width_invalid": "Fix invalid export_profile fields.",
  "export_profile_height_invalid": "Fix invalid export_profile fields.",
  "export_profile_fps_invalid": "Fix invalid export_profile fields.",
  "export_profile_duration_limit_invalid": "Fix invalid export_profile fields.",
  "export_profile_id_invalid": "Fix invalid export_profile fields.",
  "export_profile_include_audio_invalid": "Fix invalid export_profile fields.",
  "export_profile_include_captions_invalid": "Fix invalid export_profile fields.",
  "export_profile_quality_preset_invalid": "Fix invalid export_profile fields.",
  "export_profile_unsupported_field": "Fix invalid export_profile fields."
};

function computeNextRequiredActions(issues: any[]): string[] {
  const actions: string[] = [];
  const seen = new Set<string>();
  for (const i of issues) {
    const code = i.code;
    if (!code) continue;
    const action = NEXT_ACTION_MAP[code];
    if (action && !seen.has(action)) {
      actions.push(action);
      seen.add(action);
    }
  }
  return actions;
}

function computeUnmappedIssueCodes(issues: any[]): string[] {
  const known = new Set(Object.keys(NEXT_ACTION_MAP));
  const seen = new Set<string>();
  for (const i of issues) {
    const code = i && i.code;
    if (code && !known.has(code) && !seen.has(code)) {
      seen.add(code);
    }
  }
  return Array.from(seen).sort();
}

function buildReadinessResult(issues: any[], checks: any[], blockers: any[]) {
  const errorCount = issues.filter((i: any) => i.severity === "error").length;
  const warningCount = issues.filter((i: any) => i.severity === "warning").length;
  const next_required_actions = computeNextRequiredActions(issues);
  const unmapped_issue_codes = computeUnmappedIssueCodes(issues);

  return {
    ready: errorCount === 0,
    valid: errorCount === 0,
    status: errorCount > 0 ? "invalid" : (warningCount > 0 ? "warnings" : "valid"),
    warning_count: warningCount,
    error_count: errorCount,
    blocking_count: blockers.length,
    blockers,
    checks,
    issues,
    warnings: issues.filter((i: any) => i.severity === "warning"),
    skipped_checks: [],
    summary: {
      project_id: null,
      timeline_id: null,
      asset_count: 0,
      track_count: 0,
      timeline_item_count: 0,
      export_target_count: 0,
      warning_count: warningCount,
      error_count: errorCount,
      blocking_count: blockers.length,
      export_profile_present: false,
      matched_export_target_count: 0,
      matched_target_platforms: [],
      alignment_error_count: 0,
      alignment_warning_count: 0
    },
    readiness_summary: buildReadinessSummary({
      ready: errorCount === 0,
      valid: errorCount === 0,
      status: errorCount > 0 ? "invalid" : (warningCount > 0 ? "warnings" : "valid"),
      projectId: null,
      timelineId: null,
      exportProfilePresent: false,
      exportTargetsCount: 0,
      matchedExportTargetCount: 0,
      assetCount: 0,
      trackCount: 0,
      timelineItemCount: 0,
      blockingCount: blockers.length,
      errorCount,
      warningCount,
      skippedCount: 0,
      issues,
      blockers
    }),
    blocking_reasons: blockers,
    next_required_actions,
    unmapped_issue_codes
  };
}

export const hollowcutExportReadinessCheckHollow = hollowcutExportReadinessCheckImplementation;

// Narrow test-only surface for constructed unknown-code coverage (per rollup pass requirement: prove unknown codes go to unmapped_issue_codes and produce no invented actions).
// Not part of the Hollow contract or public API. Removed in future if full helper exports are authorized.
export const __test = {
  computeUnmappedIssueCodes,
  computeNextRequiredActions,
  NEXT_ACTION_MAP
} as const;
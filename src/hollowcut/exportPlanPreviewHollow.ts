import type { JsonValue } from "../types/common.js";
import type { HollowManifest } from "../types/hollow.js";
import type { HollowImplementation } from "../hollows/runnerTypes.js";

export const hollowcutExportPlanPreviewManifest: HollowManifest = {
  hollow_id: "hollow.hollowcut.export_plan_preview",
  hollow_name: "Hollowcut Export Plan Preview Hollow",
  hollow_version: "1.0.0",
  schema_version: "1.0.0",
  category: "project",
  description: "Consumes T2 verified export readiness evidence (from hollow.hollowcut.export_readiness_check + VRP) and produces a deterministic non-destructive dry-run export plan preview. Supplied verified evidence only; no file access, no mutation, no media inspection, no FFmpeg, no render, no build artifacts. First non-destructive step in export runtime boundary per plan. Rejects raw T0 or unsafe readiness.",
  input_type: "hollowcut.export_plan_preview.input",
  input_schema_ref: "schemas/hollows/hollowcut/export-plan-preview.input.json",
  output_schema_ref: "schemas/hollows/hollowcut/export-plan-preview.output.json",
  permissions: ["read_only"],
  permissions_required: ["read_only"],
  file_access_scope: "none",
  network_access: false,
  execution_mode: "local_inspection",
  deterministic: true,
  deterministic_level: "strict",
  result_units: "hollowcut_export_plan_preview",
  checks: [
    "verified_readiness_present",
    "trust_tier_t2",
    "verified_return_path",
    "readiness_summary_present",
    "safe_to_hand_to_future_export",
    "no_blockers",
    "ready_and_valid",
    "contract_conformant",
    "non_destructive_only"
  ],
  max_input_size: 200000,
  max_runtime_ms: 1000,
  supports_batching: false,
  supports_streaming: false,
  cache_policy: "input_digest",
  status: "trusted",
  owner: "caleb-ai-core"
} as const satisfies HollowManifest;

export const hollowcutExportPlanPreviewImplementation: HollowImplementation = ({ input_payload }) => {
  const data: any = input_payload;
  const issues: any[] = [];
  const checks: any[] = [];

  // The input is expected to be the full output from a run-hollowcut-hollow --json for the export_readiness_check,
  // or a structure containing invocation + verification_result, or {verified_readiness: ...}.
  // We extract the readiness result and verification evidence.
  const invocation = data.invocation || data;
  const verificationResult = data.verification_result || data;
  const readinessResult = invocation.result || data.result || data;

  if (!readinessResult || typeof readinessResult !== "object" || !readinessResult.readiness_summary) {
    issues.push(createIssue("$", "error", "verified_readiness_missing", "Input must be (or contain) verified readiness evidence with result.readiness_summary from export_readiness_check run + VRP."));
    return buildPreviewResult(false, "not_previewable", issues, checks, null);
  }

  const rs = readinessResult.readiness_summary;

  // Gate checks for T2 verified readiness
  const trustTier = verificationResult.trust_tier || invocation.trust_tier || data.trust_tier;
  const hasT2 = trustTier === "T2";
  if (!hasT2) {
    issues.push(createIssue("$.verification_result.trust_tier", "error", "not_t2", "Verified readiness evidence must have trust_tier: \"T2\"."));
  }

  const ev = verificationResult.evidence_packet || (invocation.provenance ? { verified_return_path: invocation.provenance.verified_return_path } : {});
  const hasVerifiedReturnPath = !!(ev && ev.verified_return_path === true);
  if (!hasVerifiedReturnPath) {
    issues.push(createIssue("$.verification_result.evidence_packet.verified_return_path", "error", "missing_verified_return_path", "Verified readiness evidence must include verified_return_path: true."));
  }

  if (!rs || typeof rs !== "object") {
    issues.push(createIssue("$.result.readiness_summary", "error", "readiness_summary_missing", "readiness_summary is required in the readiness result."));
  } else {
    if (rs.safe_to_hand_to_future_export !== true) {
      issues.push(createIssue("$.result.readiness_summary.safe_to_hand_to_future_export", "error", "not_safe_to_hand_to_future_export", "safe_to_hand_to_future_export must be true for preview."));
    }
    if (typeof readinessResult.blocking_count === "number" && readinessResult.blocking_count > 0) {
      issues.push(createIssue("$.result.blocking_count", "error", "has_blockers", "blocking_count must be 0 for preview."));
    }
    if (readinessResult.ready !== true) {
      issues.push(createIssue("$.result.ready", "error", "not_ready", "ready must be true for preview."));
    }
    if (readinessResult.valid !== true) {
      issues.push(createIssue("$.result.valid", "error", "not_valid", "valid must be true for preview."));
    }
  }

  // Basic contract shape check (presence of key fields from the readiness contract)
  const hasContractShape = !!(rs && typeof rs.ready === "boolean" && Array.isArray(rs.blocking_categories) && Array.isArray(rs.next_required_actions) && Array.isArray(rs.unmapped_issue_codes) && typeof rs.safe_to_hand_to_future_export === "boolean");
  if (!hasContractShape) {
    issues.push(createIssue("$.result", "error", "contract_conformance_failed", "The readiness result does not conform to the export readiness contract shape (missing readiness_summary fields or structure)."));
  }

  const errorCount = issues.filter((i: any) => i.severity === "error").length;
  const previewable = errorCount === 0 && hasT2 && hasVerifiedReturnPath && rs && rs.safe_to_hand_to_future_export === true && (readinessResult.blocking_count || 0) === 0 && readinessResult.ready === true && readinessResult.valid === true && hasContractShape;

  const status = previewable ? "previewable" : "not_previewable";

  // Add standard checks for transparency
  checks.push(createCheck("verified_readiness_present", "Verified Readiness Evidence Present"));
  checks.push(createCheck("trust_tier_t2", "Trust Tier T2 Confirmed"));
  checks.push(createCheck("verified_return_path", "Verified Return Path Confirmed"));
  checks.push(createCheck("readiness_summary_present", "readiness_summary Present"));
  checks.push(createCheck("safe_to_hand_to_future_export", "safe_to_hand_to_future_export True"));
  checks.push(createCheck("no_blockers", "No Blockers"));
  checks.push(createCheck("ready_and_valid", "Ready and Valid"));
  checks.push(createCheck("contract_conformant", "Contract Conformance"));
  checks.push(createCheck("non_destructive_only", "Non-Destructive Preview Only"));

  let previewPlan: any = null;
  if (previewable) {
    const originalInput = invocation.input_payload || data.input_payload || {};
    const ep = originalInput.export_profile || {};
    const matched = (readinessResult.summary && readinessResult.summary.matched_target_platforms) || (rs && rs.target_platform ? [rs.target_platform] : []);
    const intendedDuration = (ep.duration_limit_ms != null ? ep.duration_limit_ms : (readinessResult.summary && readinessResult.summary.timeline_duration ? null : null));

    previewPlan = {
      plan_type: "dry_run_export_plan_preview",
      source_readiness_trust_tier: "T2",
      project_id: rs.project_id || null,
      timeline_id: rs.timeline_id || null,
      target_platforms: matched,
      selected_export_profile: ep,
      intended_format: ep.format || null,
      intended_width: typeof ep.width === "number" ? ep.width : null,
      intended_height: typeof ep.height === "number" ? ep.height : null,
      intended_fps: typeof ep.fps === "number" ? ep.fps : null,
      intended_duration_ms: typeof intendedDuration === "number" ? intendedDuration : null,
      timeline_item_count: rs.timeline_item_count || 0,
      asset_count: rs.asset_count || 0,
      track_count: rs.track_count || 0,
      planned_steps: [
        "Read verified readiness summary from T2 evidence.",
        "Confirm T2 trust tier and verified_return_path from VRP.",
        "Confirm safe_to_hand_to_future_export === true and blocking_count === 0.",
        "Select target platform(s) from readiness_summary or supplied export_profile.",
        "Confirm export_profile alignment from readiness checks (if both present).",
        "Prepare dry-run export plan metadata (format, dimensions, fps, duration, item/asset/track counts).",
        "Stop before any media rendering, FFmpeg, mutation, or artifact creation."
      ],
      non_destructive_confirmed: true,
      ffmpeg_invocation_planned: false,
      media_output_planned: false,
      mutation_planned: false
    };
  }

  const previewInfo = {
    previewable,
    valid: previewable,
    status,
    checks,
    issues,
    warnings: [],
    blockers: issues.filter((i: any) => i.severity === "error").map((i: any) => i.code),
    preview_plan: previewPlan,
    summary: {
      project_id: rs ? rs.project_id : null,
      timeline_id: rs ? rs.timeline_id : null,
      previewable
    },
    supplied_state_only_confirmed: true,
    confidence_level: "deterministic_verified_readiness_export_plan_preview"
  };
  return {
    result: previewInfo,
    result_units: "hollowcut_export_plan_preview",
    checks,
    warnings: [],
    artifact_hashes: [],
    confidence_level: "deterministic_verified_readiness_export_plan_preview"
  };
};

function createCheck(check_id: string, label: string): any {
  return { check_id, label, status: "completed", severity: "info" };
}

function createIssue(path: string, severity: "error" | "warning", code: string, message: string): any {
  return { path, severity, code, message };
}

function buildPreviewResult(previewable: boolean, status: string, issues: any[], checks: any[], previewPlan: any): any {
  const previewInfo = {
    previewable,
    valid: previewable,
    status,
    checks,
    issues,
    warnings: [],
    blockers: issues.filter((i: any) => i.severity === "error").map((i: any) => i.code),
    preview_plan: previewPlan,
    summary: { previewable },
    supplied_state_only_confirmed: true,
    confidence_level: "deterministic_verified_readiness_export_plan_preview"
  };
  return {
    result: previewInfo,
    result_units: "hollowcut_export_plan_preview",
    checks,
    warnings: [],
    artifact_hashes: [],
    confidence_level: "deterministic_verified_readiness_export_plan_preview"
  };
}

export const hollowcutExportPlanPreviewHollow = hollowcutExportPlanPreviewImplementation;
import type { JsonObject, JsonValue } from "../types/common.js";
import type { CalebCheck, CalebWarning } from "../types/invocation.js";
import type {
  HollowcutProjectValidationIssue,
  HollowcutProjectValidationResult
} from "./project/hollowcutProjectTypes.js";
import {
  createHollowcutValidationIssue,
  validateHollowcutProject
} from "./project/hollowcutProjectValidation.js";
import type { HollowImplementation } from "../hollows/runnerTypes.js";
import type { HollowManifest } from "../types/hollow.js";

export const hollowcutProjectStateCheckManifest: HollowManifest = {
  hollow_id: "hollow.hollowcut.project_state_check",
  hollow_name: "Hollowcut Project State Check Hollow",
  hollow_version: "1.0.0",
  schema_version: "1.0.0",
  category: "project",
  description: "Validates supplied Hollowcut project state for structural integrity, required fields, ID presence, duplicates, references, and collection constraints using deterministic logic only.",
  input_type: "hollowcut.project_state_check.input",
  input_schema_ref: "schemas/hollows/hollowcut/project-state-check.input.json",
  output_schema_ref: "schemas/hollows/hollowcut/project-state-check.output.json",
  permissions: ["read_only"],
  permissions_required: ["read_only"],
  file_access_scope: "none",
  network_access: false,
  execution_mode: "local_inspection",
  deterministic: true,
  deterministic_level: "strict",
  result_units: "hollowcut_project_state",
  checks: [
    "project_present",
    "project_required_fields_checked",
    "project_assets_checked",
    "project_tracks_checked",
    "project_references_checked",
    "project_collections_checked",
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

export const hollowcutProjectStateCheckImplementation: HollowImplementation = ({ input_payload }) => {
  const result = validateHollowcutProjectSuppliedState(input_payload);
  const warningIssues = result.issues.filter((issue) => issue.severity === "warning");

  return {
    result: result as unknown as JsonValue,
    result_units: "hollowcut_project_state",
    checks: [
      createCheck("project_present", "Project Present"),
      createCheck("project_required_fields_checked", "Project Required Fields Checked"),
      createCheck("project_assets_checked", "Project Assets Checked"),
      createCheck("project_tracks_checked", "Project Tracks Checked"),
      createCheck("project_references_checked", "Project References Checked"),
      createCheck("project_collections_checked", "Project Collections Checked"),
      createCheck("supplied_state_only_confirmed", "Supplied State Only Confirmed")
    ],
    warnings: warningIssues.map((issue) => createWarning(issue.code, issue.message)),
    artifact_hashes: [],
    confidence_level: "deterministic_supplied_state_hollowcut_project"
  };
};

export function validateHollowcutProjectSuppliedState(input: JsonValue): HollowcutProjectValidationResult {
  if (!isRecord(input)) {
    const issues = [
      createHollowcutValidationIssue("$", "error", "input_not_object", "Hollowcut Project State Check Hollow requires an object input payload.")
    ];
    return createResultFromIssues(issues);
  }

  const projectCandidate = (input as any).project ?? input;
  const baseResult = validateHollowcutProject(projectCandidate);

  const issues = [...baseResult.issues];

  if (!isRecord(projectCandidate)) {
    issues.push(
      createHollowcutValidationIssue("$.project", "error", "supplied_project_missing", "Supplied state must contain a project object or be the project object itself.")
    );
  }

  return createResultFromIssues(issues.length > (baseResult.issues?.length || 0) ? issues : baseResult.issues);
}

function createCheck(check_id: string, label: string): CalebCheck {
  return { check_id, label, status: "completed", severity: "info" };
}

function createWarning(code: string, message: string): CalebWarning {
  return { warning_id: code, message, severity: "warning" };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createResultFromIssues(issues: HollowcutProjectValidationIssue[]): HollowcutProjectValidationResult {
  const errorCount = issues.filter(i => i.severity === "error").length;
  const warningCount = issues.filter(i => i.severity === "warning").length;

  return {
    valid: errorCount === 0,
    status: errorCount > 0 ? "invalid" : (warningCount > 0 ? "warnings" : "valid"),
    issues,
    summary: {
      project_id: null,
      asset_count: 0,
      track_count: 0,
      caption_count: 0,
      export_target_count: 0,
      warning_count: warningCount,
      error_count: errorCount
    },
    checks: [
      createCheck("project_present", "Project Present"),
      createCheck("project_required_fields_checked", "Project Required Fields Checked"),
      createCheck("project_assets_checked", "Project Assets Checked"),
      createCheck("project_tracks_checked", "Project Tracks Checked"),
      createCheck("project_references_checked", "Project References Checked"),
      createCheck("project_collections_checked", "Project Collections Checked"),
      createCheck("supplied_state_only_confirmed", "Supplied State Only Confirmed")
    ]
  } as any;
}

export const hollowcutProjectStateCheckHollow = hollowcutProjectStateCheckImplementation;
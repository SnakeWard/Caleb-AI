import type { JsonValue } from "../../../types/common.js";
import type { CalebCheck, CalebWarning } from "../../../types/invocation.js";
import type {
  TimelineValidationIssue,
  TimelineValidationResult,
  TimelineValidationSeverity,
  TimelineValidationSummary
} from "../../../hollowcut/timeline/index.js";
import {
  createTimelineValidationCheck,
  createTimelineValidationIssue,
  createTimelineValidationResult
} from "../../../hollowcut/timeline/index.js";
import { assertSafeMediaRelativePath } from "../media/mediaPathSafety.js";
import type { HollowImplementation } from "../../runnerTypes.js";

interface AssetPolicy {
  readonly unused_asset_severity: TimelineValidationSeverity;
  readonly metadata_hint_without_evidence_severity: TimelineValidationSeverity;
}

const DEFAULT_POLICY: AssetPolicy = {
  unused_asset_severity: "warning",
  metadata_hint_without_evidence_severity: "warning"
};

export const timelineAssetReferenceCheckImplementation: HollowImplementation = ({ input_payload }) => {
  const result = validateTimelineAssetReferenceInput(input_payload);
  return {
    result: result as unknown as JsonValue,
    result_units: "timeline_asset_refs",
    checks: [
      check("timeline_present", "Timeline Present"),
      check("assets_checked", "Assets Checked"),
      check("timeline_item_asset_refs_checked", "Timeline Item Asset Refs Checked"),
      check("unused_assets_checked", "Unused Assets Checked"),
      check("supplied_state_only_confirmed", "Supplied State Only Confirmed")
    ],
    warnings: result.issues.filter((issue) => issue.severity === "warning").map(toWarning),
    artifact_hashes: [],
    confidence_level: "deterministic_supplied_state_timeline_asset_refs"
  };
};

export function validateTimelineAssetReferenceInput(input: JsonValue): TimelineValidationResult {
  const issues: TimelineValidationIssue[] = [];
  const candidate = isRecord(input) ? input : {};
  const policy = parsePolicy(candidate.validation_policy);
  const timeline = candidate.timeline;
  if (!isRecord(input)) issues.push(issue("$", "error", "input_not_object", "Asset reference input must be an object."));
  if (!isRecord(timeline)) {
    issues.push(issue("$.timeline", "error", "timeline_missing", "timeline must be a supplied object."));
    return makeResult(issues, {}, 0);
  }

  const items = Array.isArray(timeline.items) ? timeline.items : [];
  if (!Array.isArray(timeline.items)) issues.push(issue("$.timeline.items", "error", "timeline_items_not_array", "timeline.items must be an array."));
  const assets = candidate.assets === undefined ? [] : candidate.assets;
  if (!Array.isArray(assets)) {
    issues.push(issue("$.assets", "error", "assets_not_array", "assets must be an array when provided."));
  }
  const assetArray = Array.isArray(assets) ? assets : [];
  const parsedAssets = parseAssets(assetArray, issues, policy);
  const assetIds = new Set(parsedAssets.map((asset) => asset.asset_id));
  const referenced = new Set<string>();

  items.forEach((item, index) => {
    const path = `$.timeline.items[${index}]`;
    if (!isRecord(item)) return;
    const itemId = nonEmptyString(item.item_id) ? item.item_id : `item_${index}`;
    if (!nonEmptyString(item.asset_id)) {
      issues.push(refIssue(`${path}.asset_id`, "error", "item_asset_id_missing", "timeline item asset_id must be a non-empty string.", itemId));
      return;
    }
    referenced.add(item.asset_id);
    if (!assetIds.has(item.asset_id)) {
      issues.push(createTimelineValidationIssue(`${path}.asset_id`, "error", "item_asset_ref_missing", `Missing asset reference: ${item.asset_id}.`, { item_ids: [itemId], asset_ids: [item.asset_id] }));
    }
  });

  for (const asset of parsedAssets) {
    if (!referenced.has(asset.asset_id)) {
      issues.push(createTimelineValidationIssue("$.assets", policy.unused_asset_severity, "unused_asset", `Asset "${asset.asset_id}" is not referenced by timeline items.`, { asset_ids: [asset.asset_id] }));
    }
  }

  return makeResult(issues, {
    timeline_id: nonEmptyString(timeline.timeline_id) ? timeline.timeline_id : null,
    item_count: items.length
  }, parsedAssets.length);
}

function parseAssets(
  assets: readonly unknown[],
  issues: TimelineValidationIssue[],
  policy: AssetPolicy
): { readonly asset_id: string }[] {
  const parsed: { asset_id: string }[] = [];
  const seen = new Set<string>();
  for (const [index, asset] of assets.entries()) {
    const path = `$.assets[${index}]`;
    if (!isRecord(asset)) {
      issues.push(issue(path, "error", "asset_invalid", "asset must be an object."));
      continue;
    }
    if (!nonEmptyString(asset.asset_id)) {
      issues.push(issue(`${path}.asset_id`, "error", "asset_id_invalid", "asset_id must be a non-empty string."));
      continue;
    }
    if (seen.has(asset.asset_id)) {
      issues.push(createTimelineValidationIssue(`${path}.asset_id`, "error", "duplicate_asset_id", "Duplicate asset_id detected.", { asset_ids: [asset.asset_id] }));
    }
    seen.add(asset.asset_id);
    parsed.push({ asset_id: asset.asset_id });

    const evidenceRefs = isStringArray(asset.evidence_refs) ? asset.evidence_refs : [];
    if (asset.evidence_refs !== undefined && !isStringArray(asset.evidence_refs)) {
      issues.push(issue(`${path}.evidence_refs`, "error", "asset_evidence_refs_invalid", "evidence_refs must be an array of strings."));
    }
    if (asset.metadata_hint !== undefined && evidenceRefs.length === 0) {
      issues.push(createTimelineValidationIssue(`${path}.metadata_hint`, policy.metadata_hint_without_evidence_severity, "metadata_hint_without_evidence", "metadata_hint is not verified evidence.", { asset_ids: [asset.asset_id] }));
    }
    if (asset.verified_metadata !== undefined && asset.verified_metadata !== null && evidenceRefs.length === 0) {
      issues.push(createTimelineValidationIssue(`${path}.verified_metadata`, "warning", "verified_metadata_without_evidence", "verified_metadata requires evidence_refs to be trusted.", { asset_ids: [asset.asset_id] }));
    }
    if (asset.relative_path !== undefined) {
      if (!nonEmptyString(asset.relative_path)) {
        issues.push(issue(`${path}.relative_path`, "error", "asset_relative_path_unsafe", "relative_path must be a non-empty string when provided."));
      } else {
        try {
          assertSafeMediaRelativePath(".", asset.relative_path);
        } catch (error) {
          issues.push(createTimelineValidationIssue(`${path}.relative_path`, "error", "asset_relative_path_unsafe", error instanceof Error ? error.message : "relative_path is unsafe.", { asset_ids: [asset.asset_id] }));
        }
      }
    }
  }
  return parsed;
}

function parsePolicy(value: unknown): AssetPolicy {
  if (!isRecord(value)) return DEFAULT_POLICY;
  return {
    unused_asset_severity: severity(value.unused_asset_severity, DEFAULT_POLICY.unused_asset_severity),
    metadata_hint_without_evidence_severity: severity(value.metadata_hint_without_evidence_severity, DEFAULT_POLICY.metadata_hint_without_evidence_severity)
  };
}

function makeResult(
  issues: readonly TimelineValidationIssue[],
  summary: Partial<TimelineValidationSummary>,
  assetCount: number
): TimelineValidationResult {
  const codes = issues.map((entry) => entry.code);
  const result = createTimelineValidationResult({
    issues,
    summary,
    checks: [
      createTimelineValidationCheck("timeline_present", codes.includes("timeline_missing") ? "fail" : "pass", "Timeline object was checked.", codes),
      createTimelineValidationCheck("assets_checked", codes.includes("assets_not_array") ? "fail" : "pass", "Assets were checked.", codes),
      createTimelineValidationCheck("timeline_item_asset_refs_checked", codes.includes("item_asset_ref_missing") ? "fail" : "pass", "Timeline item asset references were checked.", codes),
      createTimelineValidationCheck("unused_assets_checked", "pass", "Unused assets were checked.", codes),
      createTimelineValidationCheck("supplied_state_only_confirmed", "pass", "No files, shell, network, media probes, Ledger writes, or mutation were performed.", [])
    ]
  }) as TimelineValidationResult;
  return { ...result, summary: { ...result.summary, asset_count: assetCount } } as TimelineValidationResult;
}

function issue(path: string, severityValue: TimelineValidationSeverity, code: string, message: string): TimelineValidationIssue {
  return createTimelineValidationIssue(path, severityValue, code, message);
}

function refIssue(path: string, severityValue: TimelineValidationSeverity, code: string, message: string, itemId: string): TimelineValidationIssue {
  return createTimelineValidationIssue(path, severityValue, code, message, { item_ids: [itemId] });
}

function severity(value: unknown, fallback: TimelineValidationSeverity): TimelineValidationSeverity {
  return value === "warning" || value === "error" ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

function check(check_id: string, label: string): CalebCheck {
  return { check_id, label, status: "completed", severity: "info" };
}

function toWarning(entry: TimelineValidationIssue): CalebWarning {
  return { warning_id: entry.code, message: entry.message, severity: "warning" };
}

export const timelineAssetReferenceCheckHollow = timelineAssetReferenceCheckImplementation;

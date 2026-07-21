import type { RouteInputBase } from "./routeInput.js";

/**
 * Eighth L1 route-input kind (RA-X-3). Describes task *requirements* only —
 * never a pre-committed route. Eligible as classifier input only after the
 * five-check verifier passes. Verified eligibility is non-promoting (T1-capped input).
 */

export const LINEAGE_RESOLVED_DECISION_FACING_RECORD_KIND =
  "lineage_resolved_decision_facing_record" as const;

export type LineageResolvedDecisionFacingRecordKind =
  typeof LINEAGE_RESOLVED_DECISION_FACING_RECORD_KIND;

export const DECISION_FACING_BOUNDS = {
  summary_max: 200,
  id_max: 160,
  capability_max: 160,
  constraint_max: 200,
  open_question_max: 200,
  required_capabilities_max: 6,
  constraints_max: 4,
  open_questions_max: 4,
  lineage_refs_max: 8
} as const;

/**
 * Closed task-requirement surface the future classifier may read.
 * No ordered roles, route_mode, route_id, or free-form smuggling fields.
 */
export interface DecisionFacingTaskRequirements {
  readonly summary: string;
  readonly required_capabilities: readonly string[];
  readonly constraints: readonly string[];
  readonly open_questions: readonly string[];
}

export interface LineageResolvedDecisionFacingRecord extends RouteInputBase {
  readonly record_kind: LineageResolvedDecisionFacingRecordKind;
  readonly source: "logic_engine";
  readonly task_requirements: DecisionFacingTaskRequirements;
  /**
   * Lineage references. At least one must resolve to a gated trusted root.
   * Format for offline resolution: `gated:<kind>:<id>`.
   */
  readonly lineage_refs: readonly string[];
}

export type LineageResolveStatus = "trusted_root" | "resolved_node" | "orphan";

export interface LineageResolveResult {
  readonly status: LineageResolveStatus;
  readonly record_kind?: string;
}

export interface LineageResolvedDecisionFacingValidationIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export type LineageResolvedDecisionFacingValidationResult =
  | {
      readonly ok: true;
      readonly record: LineageResolvedDecisionFacingRecord;
      readonly issues: readonly [];
    }
  | {
      readonly ok: false;
      readonly record: null;
      readonly issues: readonly LineageResolvedDecisionFacingValidationIssue[];
    };

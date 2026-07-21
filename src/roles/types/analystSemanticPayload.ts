import type { RoleAcceptanceStatus } from "./roleArtifact.js";

/**
 * Analyst semantic payload — closed four-type evidence schema (RA-X-1).
 * Never self-verifying: no field may assert trust tier above T1 for Analyst content.
 */

export const ANALYST_SEMANTIC_SCHEMA_VERSION = "0.1.0" as const;

export type AnalystOutputType =
  | "finding"
  | "gap_analysis"
  | "plan_revision_request"
  | "hollow_evidence_request";

export const ANALYST_OUTPUT_TYPES: readonly AnalystOutputType[] = [
  "finding",
  "gap_analysis",
  "plan_revision_request",
  "hollow_evidence_request"
] as const;

export type AnalystFindingStance = "supports" | "contradicts" | "neutral";

export const ANALYST_FINDING_STANCES: readonly AnalystFindingStance[] = [
  "supports",
  "contradicts",
  "neutral"
] as const;

/** Per-string bounds (160–240 band except short IDs). */
export const ANALYST_BOUNDS = {
  summary_max: 200,
  id_max: 160,
  claim_text_max: 200,
  rationale_max: 240,
  description_max: 200,
  revision_reason_max: 240,
  evidence_sought_max: 240,
  findings_max: 5,
  gaps_max: 5,
  revision_targets_max: 4,
  evidence_ref_ids_max: 6
} as const;

export interface AnalystFindingItem {
  readonly finding_id: string;
  readonly stance: AnalystFindingStance;
  readonly claim_text: string;
  readonly rationale: string;
  readonly evidence_ref_ids: readonly string[];
}

export interface AnalystGapItem {
  readonly gap_id: string;
  readonly description: string;
}

export interface AnalystFindingPayload {
  readonly schema_version: typeof ANALYST_SEMANTIC_SCHEMA_VERSION;
  readonly role_id: "analyst";
  readonly output_type: "finding";
  readonly summary: string;
  readonly findings: readonly AnalystFindingItem[];
  readonly confidence: number;
  readonly acceptance_status: RoleAcceptanceStatus;
}

export interface AnalystGapAnalysisPayload {
  readonly schema_version: typeof ANALYST_SEMANTIC_SCHEMA_VERSION;
  readonly role_id: "analyst";
  readonly output_type: "gap_analysis";
  readonly summary: string;
  readonly gaps: readonly AnalystGapItem[];
  readonly confidence: number;
  readonly acceptance_status: RoleAcceptanceStatus;
}

export interface AnalystPlanRevisionRequestPayload {
  readonly schema_version: typeof ANALYST_SEMANTIC_SCHEMA_VERSION;
  readonly role_id: "analyst";
  readonly output_type: "plan_revision_request";
  readonly summary: string;
  readonly revision_reason: string;
  readonly revision_targets: readonly string[];
  readonly confidence: number;
  readonly acceptance_status: RoleAcceptanceStatus;
}

/**
 * Request-only Hollow interaction shape.
 * Carries hollow_id + evidence_sought only — never execution results.
 */
export interface AnalystHollowEvidenceRequestPayload {
  readonly schema_version: typeof ANALYST_SEMANTIC_SCHEMA_VERSION;
  readonly role_id: "analyst";
  readonly output_type: "hollow_evidence_request";
  readonly summary: string;
  readonly hollow_id: string;
  readonly evidence_sought: string;
  readonly confidence: number;
  readonly acceptance_status: RoleAcceptanceStatus;
}

export type AnalystSemanticPayload =
  | AnalystFindingPayload
  | AnalystGapAnalysisPayload
  | AnalystPlanRevisionRequestPayload
  | AnalystHollowEvidenceRequestPayload;

export interface AnalystSemanticPayloadValidationIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface AnalystSemanticPayloadValidationResult {
  readonly ok: boolean;
  readonly issues: readonly AnalystSemanticPayloadValidationIssue[];
}

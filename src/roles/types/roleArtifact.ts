import type { ISODateTimeString } from "../../types/common.js";

export const ROLE_ARTIFACT_SCHEMA_VERSION = "0.1.0" as const;

export type RoleArtifactSchemaVersion = typeof ROLE_ARTIFACT_SCHEMA_VERSION;

export type RoleId =
  | "planner"
  | "implementer"
  | "verifier"
  | "critic"
  | "synthesizer"
  | "reporter"
  | "recovery"
  | "human_operator";

export const VALID_ROLE_IDS: readonly RoleId[] = [
  "planner",
  "implementer",
  "verifier",
  "critic",
  "synthesizer",
  "reporter",
  "recovery",
  "human_operator"
] as const;

export const ROLE_IDS = VALID_ROLE_IDS;

export type RoleArtifactType =
  | "plan"
  | "implementation_notes"
  | "verification"
  | "critique"
  | "synthesis"
  | "report"
  | "recovery_plan"
  | "human_decision";

export const VALID_ROLE_ARTIFACT_TYPES: readonly RoleArtifactType[] = [
  "plan",
  "implementation_notes",
  "verification",
  "critique",
  "synthesis",
  "report",
  "recovery_plan",
  "human_decision"
] as const;

export type RoleAcceptanceStatus =
  | "accepted"
  | "needs_revision"
  | "blocked"
  | "rejected";

export const VALID_ROLE_ACCEPTANCE_STATUSES: readonly RoleAcceptanceStatus[] = [
  "accepted",
  "needs_revision",
  "blocked",
  "rejected"
] as const;

export interface RoleArtifactClaim {
  readonly claim_id: string;
  readonly text: string;
  readonly evidence_ref_ids: readonly string[];
}

export interface RoleArtifactEvidenceRef {
  readonly ref_id: string;
  readonly ref_type: "hollow_evidence" | "ledger_entry" | "artifact" | "context" | "trace" | "human_input";
  readonly description: string;
}

export interface RoleTelemetryTraceRef {
  readonly trace_id: string;
  readonly context_id: string;
}

export interface RoleExecutionContextRef {
  readonly context_id: string;
}

export interface RoleArtifact {
  readonly schema_version: RoleArtifactSchemaVersion;
  readonly artifact_id: string;
  readonly artifact_type: RoleArtifactType;
  readonly role_id: RoleId;
  readonly task_id: string;
  readonly run_id: string;
  readonly trace_id: string;
  readonly context_id: string;
  readonly summary: string;
  readonly claims: readonly RoleArtifactClaim[];
  readonly assumptions: readonly string[];
  readonly constraints: readonly string[];
  readonly open_questions: readonly string[];
  readonly recommendations: readonly string[];
  readonly evidence_refs: readonly RoleArtifactEvidenceRef[];
  readonly confidence: number;
  readonly handoff_notes: readonly string[];
  readonly required_next_role: RoleId | null;
  readonly acceptance_status: RoleAcceptanceStatus;
  readonly created_at: ISODateTimeString;
  readonly source_artifact_ids?: readonly string[];
  readonly telemetry_trace_ref?: RoleTelemetryTraceRef;
  readonly execution_context_ref?: RoleExecutionContextRef;
  readonly warnings?: readonly string[];
}

export interface RoleArtifactValidationError {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface RoleArtifactValidationResult {
  readonly ok: boolean;
  readonly errors: readonly RoleArtifactValidationError[];
}

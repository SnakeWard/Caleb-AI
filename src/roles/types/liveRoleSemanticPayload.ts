import type {
  RoleAcceptanceStatus,
  RoleArtifactClaim,
  RoleArtifactEvidenceRef
} from "./roleArtifact.js";

export interface LiveRoleSemanticPayload {
  readonly summary: string;
  readonly claims: readonly RoleArtifactClaim[];
  readonly assumptions: readonly string[];
  readonly constraints: readonly string[];
  readonly open_questions: readonly string[];
  readonly recommendations: readonly string[];
  readonly evidence_refs: readonly RoleArtifactEvidenceRef[];
  readonly confidence: number;
  readonly handoff_notes: readonly string[];
  readonly acceptance_status: RoleAcceptanceStatus;
}

export interface LiveRoleSemanticPayloadValidationIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface LiveRoleSemanticPayloadValidationResult {
  readonly ok: boolean;
  readonly issues: readonly LiveRoleSemanticPayloadValidationIssue[];
}

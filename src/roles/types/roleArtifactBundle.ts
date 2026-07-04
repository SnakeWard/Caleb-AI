import type { ISODateTimeString } from "../../types/common.js";
import type {
  RoleAcceptanceStatus,
  RoleArtifactSchemaVersion,
  RoleArtifactType,
  RoleId
} from "./roleArtifact.js";
import type {
  RoleHandoffGateErrorCode,
  RoleHandoffGateStatus
} from "../roleHandoffGate.js";

export type RoleArtifactReferenceBundleStatus =
  | "complete"
  | "incomplete"
  | "blocked"
  | "invalid";

export const VALID_ROLE_ARTIFACT_REFERENCE_BUNDLE_STATUSES: readonly RoleArtifactReferenceBundleStatus[] = [
  "complete",
  "incomplete",
  "blocked",
  "invalid"
] as const;

export interface RoleArtifactReference {
  readonly artifact_id: string;
  readonly role_id: RoleId;
  readonly artifact_type: RoleArtifactType;
  readonly acceptance_status: RoleAcceptanceStatus;
}

export interface RoleHandoffGateReference {
  readonly source_role: RoleId;
  readonly target_role: RoleId;
  readonly source_artifact_id: string;
  readonly allowed: boolean;
  readonly status: RoleHandoffGateStatus;
  readonly error_codes: readonly RoleHandoffGateErrorCode[];
}

export interface RoleArtifactReferenceBundle {
  readonly schema_version: RoleArtifactSchemaVersion;
  readonly bundle_id: string;
  readonly task_id: string;
  readonly run_id: string;
  readonly trace_id: string;
  readonly context_id: string;
  readonly artifact_refs: readonly RoleArtifactReference[];
  readonly handoff_gate_refs: readonly RoleHandoffGateReference[];
  readonly bundle_status: RoleArtifactReferenceBundleStatus;
  readonly created_at: ISODateTimeString;
  readonly warnings?: readonly string[];
}

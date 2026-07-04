import type { ISODateTimeString } from "../../types/common.js";
import type { RoleArtifactSchemaVersion, RoleId } from "./roleArtifact.js";

export type RoleHandoffStatus =
  | "pending"
  | "ready"
  | "blocked"
  | "completed"
  | "rejected";

export const VALID_ROLE_HANDOFF_STATUSES: readonly RoleHandoffStatus[] = [
  "pending",
  "ready",
  "blocked",
  "completed",
  "rejected"
] as const;

export interface RoleHandoffEnvelope {
  readonly schema_version: RoleArtifactSchemaVersion;
  readonly source_role: RoleId;
  readonly target_role: RoleId;
  readonly task_id: string;
  readonly run_id: string;
  readonly trace_id: string;
  readonly context_id: string;
  readonly handoff_status: RoleHandoffStatus;
  readonly artifact_id?: string;
  readonly artifact_refs?: readonly string[];
  readonly created_at?: ISODateTimeString;
}

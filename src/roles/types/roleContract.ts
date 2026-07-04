import type {
  RoleAcceptanceStatus,
  RoleArtifactSchemaVersion,
  RoleArtifactType,
  RoleId
} from "./roleArtifact.js";

export interface RoleContract {
  readonly schema_version: RoleArtifactSchemaVersion;
  readonly role_id: RoleId;
  readonly allowed_artifact_types: readonly RoleArtifactType[];
  readonly allowed_acceptance_statuses: readonly RoleAcceptanceStatus[];
}

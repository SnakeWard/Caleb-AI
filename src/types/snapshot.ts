import type {
  ArtifactHash,
  CalebStatus,
  ISODateTimeString,
  JsonObject,
  SemVerString
} from "./common.js";

export type SnapshotType = "pre_change" | "post_change" | "emergency" | "milestone";

export interface SnapshotCapturedFile {
  readonly path: string;
  readonly hash: string;
}

export interface SnapshotManifest {
  readonly snapshot_id: string;
  readonly snapshot_type: SnapshotType;
  readonly schema_version: SemVerString;
  readonly run_id: string;
  readonly trace_id: string;
  readonly requested_by: string;
  readonly approved_by: string | null;
  readonly started_at: ISODateTimeString;
  readonly completed_at: ISODateTimeString | null;
  readonly status: CalebStatus;
  readonly reason: string;
  readonly files_captured: readonly SnapshotCapturedFile[];
  readonly artifact_hashes: readonly ArtifactHash[];
  readonly provenance: JsonObject;
  readonly ledger_refs: readonly string[];
  readonly rollback_method: string;
  readonly rollback_steps: readonly string[];
}

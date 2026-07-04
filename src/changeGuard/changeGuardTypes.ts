import type { ArtifactHash } from "../types/common.js";
import type { LedgerEntry } from "../types/ledger.js";
import type { SnapshotManifest, SnapshotType } from "../types/snapshot.js";

export interface CapturedFileRecord {
  readonly relative_path: string;
  readonly source_path: string;
  readonly snapshot_path: string;
  readonly hash: string;
}

export interface CreateSnapshotRequest {
  readonly snapshot_type: SnapshotType;
  readonly reason: string;
  readonly requested_change?: string;
  readonly files_to_capture: readonly string[];
  readonly run_id?: string;
  readonly trace_id?: string;
  readonly requested_by?: string;
  readonly approved_by?: string | null;
  readonly notes?: string;
  readonly strict?: boolean;
}

export interface SnapshotResult {
  readonly snapshot_id: string;
  readonly snapshot_path: string;
  readonly manifest: SnapshotManifest;
  readonly captured_files: readonly CapturedFileRecord[];
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly ledger_entry?: LedgerEntry;
}

export interface RestoreSnapshotRequest {
  readonly snapshot_id: string;
  readonly requested_by?: string;
  readonly approved_by?: string | null;
  readonly strict?: boolean;
}

export interface RollbackPreviewFile {
  readonly relative_path: string;
  readonly source_path: string;
  readonly target_path: string;
}

export interface RollbackPreview {
  readonly snapshot_id: string;
  readonly files: readonly RollbackPreviewFile[];
}

export interface RestoredFileRecord {
  readonly relative_path: string;
  readonly target_path: string;
  readonly hash: string;
}

export interface RollbackResult {
  readonly snapshot_id: string;
  readonly restored_files: readonly RestoredFileRecord[];
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly ledger_entry?: LedgerEntry;
}

export interface GuardCommand {
  readonly command: string;
  readonly args: readonly string[];
  readonly cwd?: string;
  readonly timeout_ms?: number;
  readonly label?: string;
}

export interface GuardCommandResult {
  readonly label?: string;
  readonly command: string;
  readonly args: readonly string[];
  readonly cwd: string;
  readonly status: "passed" | "failed" | "timed_out";
  readonly stdout: string;
  readonly stderr: string;
  readonly exit_code: number | null;
  readonly duration_ms: number;
}

export type ChangeRiskLevel = "low" | "medium" | "high" | "critical";

export interface ChangeRiskRequest {
  readonly files_planned?: readonly string[];
  readonly touches_dependencies?: boolean;
  readonly touches_schema?: boolean;
  readonly touches_ledger?: boolean;
  readonly touches_verified_return_path?: boolean;
  readonly touches_permissions?: boolean;
  readonly touches_many_files?: boolean;
  readonly includes_file_delete?: boolean;
  readonly includes_side_effect?: boolean;
  readonly has_tests?: boolean;
}

export interface ChangeRiskResult {
  readonly level: ChangeRiskLevel;
  readonly reasons: readonly string[];
}

export interface FileHashRecord {
  readonly path: string;
  readonly hash: string;
}

export interface SnapshotManifestValidationIssue {
  readonly field: string;
  readonly message: string;
}

export interface SnapshotManifestValidationResult {
  readonly valid: boolean;
  readonly manifest?: SnapshotManifest;
  readonly errors: readonly SnapshotManifestValidationIssue[];
  readonly warnings: readonly SnapshotManifestValidationIssue[];
}

export interface SnapshotLedgerInput {
  readonly snapshot_id: string;
  readonly activity: string;
  readonly run_id: string;
  readonly trace_id: string;
  readonly requested_by: string;
  readonly approved_by: string | null;
  readonly artifact_hashes: readonly ArtifactHash[];
}

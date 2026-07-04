export interface SnapshotClaimIntegrityInput {
  readonly plans_md_content: string;
  readonly existing_snapshot_ids: readonly string[];
  readonly allowed_missing_snapshot_ids?: readonly string[];
  readonly checked_file?: string;
  readonly snapshot_root?: string;
  readonly created_at?: string;
}

export interface SnapshotClaimIntegrityReport {
  readonly report_id: string;
  readonly validator_id: string;
  readonly checked_file: string;
  readonly snapshot_root: string;
  readonly claimed_snapshot_ids: readonly string[];
  readonly existing_snapshot_ids: readonly string[];
  readonly missing_snapshot_ids: readonly string[];
  readonly invalid_snapshot_claims: readonly string[];
  readonly duplicate_snapshot_claims: readonly string[];
  readonly allowed_missing_snapshot_ids: readonly string[];
  readonly passed: boolean;
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly created_at: string;
}

export interface RunSnapshotClaimIntegrityGateOptions {
  readonly plansFilePath?: string;
  readonly snapshotRootPath?: string;
  readonly allowedMissingSnapshotIds?: readonly string[];
  readonly createdAt?: string;
}

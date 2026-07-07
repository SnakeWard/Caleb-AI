import type { PassComplianceResult } from "../hollows/audit/passComplianceCheck.js";

export const AUD2_SCHEMA_VERSION = "1.0.0" as const;

export type GitChangesetOperation = "create" | "modify" | "delete";

export interface GitChangesetEntry {
  readonly operation: GitChangesetOperation;
  readonly path: string;
}

export interface GitCollectionSummary {
  readonly source: "git_cli_layer";
  readonly hollow_gathered_environment: false;
  readonly path_format: "repo_relative_forward_slash";
  readonly tracked_changes: number;
  readonly untracked_changes: number;
  readonly total_changes: number;
}

export interface PassComplianceAuditSuccess {
  readonly ok: true;
  readonly schema_version: typeof AUD2_SCHEMA_VERSION;
  readonly command: "audit-pass-compliance";
  readonly base_ref: string;
  readonly head_ref: "working_tree";
  readonly collection: GitCollectionSummary;
  readonly hollow: {
    readonly hollow_id: string;
    readonly hollow_version: string;
    readonly verification_status: string;
    readonly trust_tier: string;
  };
  readonly changeset: readonly GitChangesetEntry[];
  readonly verdict: PassComplianceResult;
  readonly ledger_refs: readonly string[];
}

export type PassComplianceAuditStage =
  | "cli_preflight"
  | "git_collection"
  | "manifest_read"
  | "manifest_parse"
  | "hollow_invocation"
  | "verified_return_path";

export interface PassComplianceAuditErrorBody {
  readonly ok: false;
  readonly schema_version: typeof AUD2_SCHEMA_VERSION;
  readonly command: "audit-pass-compliance";
  readonly stage: PassComplianceAuditStage;
  readonly error: {
    readonly code: string;
    readonly message: string;
    readonly path?: string;
  };
}

export type PassComplianceAuditResult = PassComplianceAuditSuccess | PassComplianceAuditErrorBody;
import type { JsonValue, Sha256Digest } from "../types/common.js";
import type { TrustTier } from "../types/trust.js";

export type RawOutputArtifactKind = "provider_model_output";
export type RawOutputStoreStatus = "stored" | "found" | "not_found" | "content_deleted" | "integrity_failure";

export interface RawOutputArtifactRecord {
  readonly artifact_ref: string;
  readonly digest: Sha256Digest;
  readonly content_length: number;
  readonly artifact_kind: RawOutputArtifactKind;
  readonly raw_output_trust_tier: "T0";
  readonly schema_valid_output_trust_tier: "T1";
  readonly max_allowed_trust_tier: "T1";
  readonly created_at: string;
  readonly provider_id?: string;
  readonly model_id?: string;
  readonly source_ledger_id?: string;
}

export interface LiveCallShapedRawOutput {
  readonly output_text: string;
  readonly provider_id: string;
  readonly model_id: string;
  readonly source_ledger_id?: string;
}

export interface StoreRawOutputInput extends LiveCallShapedRawOutput {
  readonly created_at: string;
}

export interface StoreRawOutputResult {
  readonly ok: boolean;
  readonly status: "stored" | "rejected";
  readonly record?: RawOutputArtifactRecord;
  readonly issues: readonly RawOutputIssue[];
}

export interface ReadRawOutputResult {
  readonly ok: boolean;
  readonly status: RawOutputStoreStatus;
  readonly digest: Sha256Digest;
  readonly content?: string;
  readonly record?: RawOutputArtifactRecord;
  readonly deletion?: RawOutputDeletionRecord;
  readonly issues: readonly RawOutputIssue[];
}

export interface DeleteRawOutputResult {
  readonly ok: boolean;
  readonly status: "content_deleted" | "not_found";
  readonly digest: Sha256Digest;
  readonly deletion?: RawOutputDeletionRecord;
  readonly issues: readonly RawOutputIssue[];
}

export interface RawOutputDeletionRecord {
  readonly digest: Sha256Digest;
  readonly deletion_ledger_ref: string;
  readonly deleted_at: string;
}

export interface RawOutputIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface RawOutputStore {
  store(input: StoreRawOutputInput): Promise<StoreRawOutputResult> | StoreRawOutputResult;
  read(digest: Sha256Digest): Promise<ReadRawOutputResult> | ReadRawOutputResult;
  delete(input: {
    readonly digest: Sha256Digest;
    readonly deletion_ledger_ref: string;
    readonly deleted_at: string;
  }): Promise<DeleteRawOutputResult> | DeleteRawOutputResult;
}

export interface DerivedEvidenceProvenanceRecord {
  readonly evidence_id: string;
  readonly derived_from: readonly string[];
  readonly source_tiers: readonly TrustTier[];
  readonly measurement_tier: TrustTier;
  readonly subject_tier: TrustTier;
  readonly effective_tier: TrustTier;
  readonly claim: JsonValue;
  readonly artifact_refs: readonly string[];
}

export interface DecisionFacingDerivedEvidence {
  readonly evidence_id: string;
  readonly effective_tier: TrustTier;
  readonly claim: JsonValue;
  readonly artifact_refs: readonly string[];
}

export interface DerivedEvidenceIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface DerivedEvidenceValidationResult {
  readonly ok: boolean;
  readonly issues: readonly DerivedEvidenceIssue[];
}

export type DecisionTierField = "measurement_tier" | "subject_tier" | "effective_tier";

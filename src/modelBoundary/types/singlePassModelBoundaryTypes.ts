import type {
  InMemoryArtifactStore,
  RuntimeStorageRef,
  RuntimeStorageTrustState,
  RuntimeStorageValidationStatus
} from "../../storage/index.js";

export type SinglePassBoundarySchemaVersion = "0.1.0" | string;
export type SinglePassModelBoundaryStatus =
  | "accepted_t1"
  | "rejected"
  | "adapter_failed"
  | "storage_failed"
  | "validation_failed";

export interface SinglePassModelBoundaryIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
  readonly severity: "error" | "warning";
}

export interface SinglePassModelEvidenceInput {
  readonly ref_id: string;
  readonly description?: string;
}

export interface SinglePassModelRequest {
  readonly schema_version: SinglePassBoundarySchemaVersion;
  readonly task_id: string;
  readonly run_id: string;
  readonly route_mode: "single_pass";
  readonly request_id: string;
  readonly user_goal: string;
  readonly prompt: string;
  readonly evidence_refs: readonly SinglePassModelEvidenceInput[];
  readonly context_refs: readonly RuntimeStorageRef[];
  readonly constraints: Readonly<Record<string, unknown>>;
  readonly created_at: string;
}

export interface SinglePassModelResponse {
  readonly schema_version: SinglePassBoundarySchemaVersion;
  readonly task_id: string;
  readonly run_id: string;
  readonly request_id: string;
  readonly response_id: string;
  readonly adapter_id: string;
  readonly adapter_kind: "mock";
  readonly output_text: string;
  readonly output_claims: readonly string[];
  readonly used_evidence_refs: readonly SinglePassModelEvidenceInput[];
  readonly warnings: readonly string[];
  readonly created_at: string;
  readonly raw_trust_tier: "T0";
  readonly validation_status: "raw";
}

export interface SinglePassModelStorageRefs {
  readonly raw_response_record_id: string | null;
  readonly validated_response_record_id: string | null;
}

export interface SinglePassModelBoundaryTrustSummary {
  readonly raw_output_trust_tier: "T0";
  readonly validated_output_trust_tier: "T1";
  readonly max_allowed_trust_tier: "T1";
  readonly trust_promotion_blocked: true;
  readonly notes: readonly string[];
}

export interface SinglePassModelBoundaryResult {
  readonly ok: boolean;
  readonly status: SinglePassModelBoundaryStatus;
  readonly request_id: string | null;
  readonly response_id: string | null;
  readonly raw_response_record_id: string | null;
  readonly validated_response_record_id: string | null;
  readonly storage_refs: SinglePassModelStorageRefs;
  readonly trust_summary: SinglePassModelBoundaryTrustSummary;
  readonly issues: readonly SinglePassModelBoundaryIssue[];
}

export interface MockSinglePassModelAdapterConfig {
  readonly adapter_id?: string;
  readonly fixed_output_text?: string;
  readonly response_id?: string;
  readonly created_at?: string;
}

export interface MockSinglePassModelAdapter {
  readonly adapter_id: string;
  readonly adapter_kind: "mock";
  generate(request: SinglePassModelRequest): SinglePassModelResponse;
}

export interface MockSinglePassModelBoundaryOptions {
  readonly store: InMemoryArtifactStore;
  readonly adapter?: MockSinglePassModelAdapter;
  readonly now?: string;
}

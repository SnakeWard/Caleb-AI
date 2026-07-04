import type {
  InMemoryArtifactStore,
  RuntimeStorageRef
} from "../../storage/index.js";
import type {
  MockSinglePassModelAdapter,
  ModelInvocationRecord,
  SinglePassModelBoundaryResult
} from "../../modelBoundary/index.js";

export type SinglePassRouteMvpSchemaVersion = "0.1.0" | string;
export type SinglePassRouteMvpStatus =
  | "completed_t1"
  | "rejected"
  | "boundary_failed"
  | "invocation_record_failed"
  | "storage_failed";

export interface SinglePassRouteMvpIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
  readonly severity: "error" | "warning";
}

export interface SinglePassRouteMvpRequest {
  readonly schema_version: SinglePassRouteMvpSchemaVersion;
  readonly task_id: string;
  readonly run_id: string;
  readonly route_mode: "single_pass";
  readonly request_id: string;
  readonly user_goal: string;
  readonly prompt: string;
  readonly evidence_refs: readonly unknown[];
  readonly context_refs: readonly RuntimeStorageRef[];
  readonly constraints: Readonly<Record<string, unknown>>;
  readonly created_at: string;
}

export interface SinglePassRouteMvpTrustSummary {
  readonly raw_model_output_trust_tier: "T0";
  readonly schema_valid_model_output_trust_tier: "T1";
  readonly max_model_output_trust_tier: "T1";
  readonly model_output_is_deterministic_evidence: false;
  readonly route_completion_promotes_trust: false;
  readonly storage_promotes_trust: false;
  readonly retrieval_promotes_trust: false;
  readonly notes: readonly string[];
}

export interface SinglePassRouteMvpStorageSummary {
  readonly raw_response_record_id: string | null;
  readonly validated_response_record_id: string | null;
  readonly total_records_after_route: number;
  readonly usable_final_evidence_count: number;
  readonly store_kind: "in_memory";
}

export interface SinglePassRouteMvpResult {
  readonly ok: boolean;
  readonly status: SinglePassRouteMvpStatus;
  readonly task_id: string | null;
  readonly run_id: string | null;
  readonly route_mode: "single_pass" | null;
  readonly request_id: string | null;
  readonly response_id: string | null;
  readonly boundary_result: SinglePassModelBoundaryResult | null;
  readonly model_invocation_record: ModelInvocationRecord | null;
  readonly storage_summary: SinglePassRouteMvpStorageSummary;
  readonly trust_summary: SinglePassRouteMvpTrustSummary;
  readonly issues: readonly SinglePassRouteMvpIssue[];
}

export interface SinglePassRouteMvpOptions {
  readonly store?: InMemoryArtifactStore;
  readonly adapter?: MockSinglePassModelAdapter;
  readonly now?: string;
}

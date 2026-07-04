import type {
  SinglePassModelBoundaryResult,
  SinglePassModelRequest,
  SinglePassModelResponse,
  SinglePassModelStorageRefs
} from "./singlePassModelBoundaryTypes.js";

export type ModelInvocationRecordSchemaVersion = "0.1.0" | string;
export type ModelInvocationRecordKind = "mocked_single_pass_invocation";
export type ModelInvocationRecordStatus = "created" | "schema_valid" | "rejected" | "adapter_failed" | "storage_failed";
export type ModelInvocationAdapterKind = "mock";

export interface ModelInvocationTrustSummary {
  readonly raw_output_trust_tier: "T0";
  readonly validated_output_trust_tier: "T1";
  readonly max_allowed_trust_tier: "T1";
  readonly model_output_is_deterministic_evidence: false;
  readonly trust_promotion_blocked: true;
  readonly ledger_presence_promotes_trust: false;
  readonly notes: readonly string[];
}

export interface ModelInvocationStorageRefs extends SinglePassModelStorageRefs {
  readonly invocation_record_storage_id?: string;
}

export interface ModelInvocationTiming {
  readonly created_at: string;
  readonly completed_at: string;
}

export interface ModelInvocationDigestRefs {
  readonly prompt_digest: string;
  readonly request_digest: string;
  readonly response_digest: string;
}

export interface ModelInvocationLedgerIntent {
  readonly intended_activity: string;
  readonly actor_type: "model_boundary" | "model_adapter";
  readonly actor_id: string;
  readonly can_write_later: boolean;
  readonly writes_in_this_pass: false;
  readonly trust_effect: "none";
  readonly notes: readonly string[];
}

export interface ModelInvocationRecord {
  readonly schema_version: ModelInvocationRecordSchemaVersion;
  readonly record_id: string;
  readonly record_kind: ModelInvocationRecordKind;
  readonly task_id: string;
  readonly run_id: string;
  readonly request_id: string;
  readonly response_id: string;
  readonly route_mode: "single_pass";
  readonly boundary_id: string;
  readonly adapter_id: string;
  readonly adapter_kind: ModelInvocationAdapterKind;
  readonly invocation_status: ModelInvocationRecordStatus;
  readonly created_at: string;
  readonly completed_at: string;
  readonly prompt_digest: string;
  readonly request_digest: string;
  readonly response_digest: string;
  readonly supplied_evidence_refs: readonly unknown[];
  readonly supplied_context_refs: readonly unknown[];
  readonly raw_response_record_id: string;
  readonly validated_response_record_id: string;
  readonly storage_refs: ModelInvocationStorageRefs;
  readonly trust_summary: ModelInvocationTrustSummary;
  readonly warnings: readonly string[];
  readonly issues: readonly string[];
  readonly ledger_intent: ModelInvocationLedgerIntent;
  readonly notes: readonly string[];
}

export interface ModelInvocationValidationIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface ModelInvocationValidationResult {
  readonly ok: boolean;
  readonly errors: readonly ModelInvocationValidationIssue[];
}

export interface ModelInvocationRecordBuildInput {
  readonly request: SinglePassModelRequest;
  readonly response: SinglePassModelResponse;
  readonly boundary_result: SinglePassModelBoundaryResult;
  readonly boundary_id?: string;
  readonly record_id?: string;
  readonly invocation_status?: ModelInvocationRecordStatus;
  readonly created_at: string;
  readonly completed_at: string;
  readonly storage_refs?: ModelInvocationStorageRefs;
  readonly warnings?: readonly string[];
  readonly issues?: readonly string[];
}

export interface ModelInvocationRecordBuildResult {
  readonly ok: boolean;
  readonly record: ModelInvocationRecord | null;
  readonly errors: readonly ModelInvocationValidationIssue[];
}

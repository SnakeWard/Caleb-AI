import type { Sha256Digest } from "../../types/common.js";
import type { RoleId } from "../../roles/types/roleArtifact.js";
import type { RotationPlanAdapterKind } from "./staticRotationPlan.js";

export interface RoleRuntimeContextRef {
  readonly digest: Sha256Digest;
  readonly step_index: number;
}

export interface RoleRuntimeAdapterInvokeInput {
  readonly plan_id: string;
  readonly task_id: string;
  readonly run_id: string;
  readonly trace_id: string;
  readonly context_id: string;
  readonly step_index: number;
  readonly role_id: RoleId;
  readonly adapter_id: string;
  readonly adapter_kind: RotationPlanAdapterKind;
  readonly context_text: string;
  readonly context_refs: readonly RoleRuntimeContextRef[];
}

export type RoleRuntimeAdapterFailureCode =
  | "adapter_invocation_failed"
  | "adapter_missing_artifact"
  | "adapter_rejected";

export const ROLE_RUNTIME_ADAPTER_FAILURE_STAGES = [
  "output_truncated",
  "json_parse",
  "payload_validation",
  "envelope_validation",
  "identity_mismatch",
  "adapter_unavailable",
  "missing_api_key",
  "invalid_request",
  "provider_timeout",
  "provider_rate_limited",
  "provider_auth_failed",
  "provider_rejected_request",
  "provider_malformed_response",
  "response_validation_failed",
  "observer_failure",
  "safety_profile_blocked",
  "network_failure",
  "unknown_provider_error",
  "invocation_exception"
] as const;

export type RoleRuntimeAdapterFailureStage =
  (typeof ROLE_RUNTIME_ADAPTER_FAILURE_STAGES)[number];

export const ROLE_RUNTIME_ADAPTER_FAILURE_TAXONOMIES = [
  "adapter_invocation_failed",
  "adapter_missing_artifact",
  "adapter_rejected",
  "adapter_unavailable",
  "missing_api_key",
  "invalid_request",
  "provider_timeout",
  "provider_rate_limited",
  "provider_auth_failed",
  "provider_rejected_request",
  "provider_malformed_response",
  "response_validation_failed",
  "observer_failure",
  "safety_profile_blocked",
  "network_failure",
  "unknown_provider_error",
  "live_prompt_template_digest_mismatch",
  "live_provider_invocation_failed",
  "live_role_timeout_budget_exceeded",
  "live_provider_response_unvalidated",
  "live_observer_failure",
  "live_observer_artifact_invalid",
  "live_observer_output_truncated",
  "live_observer_storage_failed",
  "live_observer_output_missing",
  "live_output_digest_mismatch",
  "live_response_bytes_exceeded",
  "live_role_token_budget_exceeded",
  "live_total_invocation_budget_exceeded",
  "live_total_token_budget_exceeded",
  "live_total_spend_budget_exceeded"
] as const;

export type RoleRuntimeAdapterFailureTaxonomy =
  (typeof ROLE_RUNTIME_ADAPTER_FAILURE_TAXONOMIES)[number];

export const ROLE_RUNTIME_ADAPTER_STOP_REASONS = [
  "max_tokens",
  "end_turn",
  "stop",
  "length",
  "content_filter",
  "tool_use",
  "refusal",
  "unknown"
] as const;

export type RoleRuntimeAdapterStopReason =
  (typeof ROLE_RUNTIME_ADAPTER_STOP_REASONS)[number];

export interface RoleRuntimeAdapterFailureBudget {
  readonly max_tokens: number;
  readonly timeout_ms: number;
  readonly max_response_bytes: number;
}

export interface RoleRuntimeAdapterFailureEvidence {
  readonly stage: RoleRuntimeAdapterFailureStage | null;
  readonly taxonomy: RoleRuntimeAdapterFailureTaxonomy | null;
  readonly error_name: string | null;
  readonly input_tokens: number | null;
  readonly output_tokens: number | null;
  readonly total_tokens: number | null;
  readonly stop_reason: RoleRuntimeAdapterStopReason | null;
  readonly budget: RoleRuntimeAdapterFailureBudget | null;
  readonly t0_digest: Sha256Digest | null;
  readonly observer_normalization_stage: "markdown_fence_unwrapped" | null;
}

export interface RoleRuntimeAdapterInvokeResult {
  readonly ok: boolean;
  readonly status: "completed" | "failed";
  readonly artifact: unknown;
  readonly artifact_provenance?: {
    readonly derived_from: readonly Sha256Digest[];
  };
  readonly failure_code?: RoleRuntimeAdapterFailureCode;
  readonly failure_evidence?: RoleRuntimeAdapterFailureEvidence;
}

export interface RoleRuntimeAdapter {
  readonly adapter_id: string;
  readonly adapter_kind: RotationPlanAdapterKind;
  invoke(input: RoleRuntimeAdapterInvokeInput): Promise<RoleRuntimeAdapterInvokeResult>;
}

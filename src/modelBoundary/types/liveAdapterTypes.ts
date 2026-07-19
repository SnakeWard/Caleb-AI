export type LiveAdapterSchemaVersion = "0.1.0" | string;
export type LiveAdapterProviderId = string;
export type LiveAdapterProviderKind =
  | "openai_compatible"
  | "anthropic_compatible"
  | "google_compatible"
  | "xai_compatible"
  | "local_compatible"
  | "custom_compatible";

export type LiveAdapterResultStatus =
  | "response_schema_valid"
  | "response_raw"
  | "adapter_unavailable"
  | "failed"
  | "rejected"
  | "timeout"
  | "rate_limited"
  | "auth_failed"
  | "safety_blocked"
  | "validation_failed";

export type LiveAdapterFailureKind =
  | "adapter_unavailable"
  | "missing_api_key"
  | "invalid_request"
  | "provider_timeout"
  | "provider_rate_limited"
  | "provider_auth_failed"
  | "provider_rejected_request"
  | "provider_malformed_response"
  | "response_validation_failed"
  | "observer_failure"
  | "safety_profile_blocked"
  | "network_failure"
  | "unknown_provider_error";

export interface LiveAdapterProviderNeutralLimits {
  readonly timeout_ms: number;
  readonly max_output_tokens: number;
  readonly retry_count: number;
  readonly temperature_allowed: boolean;
  readonly streaming_allowed: boolean;
}

export interface LiveAdapterSafetyProfileRef {
  readonly safety_profile_id: string;
  readonly redaction_required: boolean;
  readonly raw_transcript_storage_allowed: boolean;
  readonly ledger_raw_prompt_allowed: false;
  readonly ledger_raw_output_allowed: false;
}

export interface LiveAdapterPromptRef {
  readonly prompt_ref_id: string;
  readonly prompt_digest: string;
  readonly prompt_storage_kind: "ref_only" | "digest_only" | "future_approved_storage";
  readonly raw_prompt_included: false;
}

export interface LiveAdapterOutputRef {
  readonly output_ref_id: string;
  readonly output_digest: string;
  readonly output_storage_kind: "ref_only" | "digest_only" | "future_approved_storage";
  readonly raw_output_included: false;
}

export interface LiveAdapterRedactionSummary {
  readonly input_redacted: boolean;
  readonly output_redacted: boolean;
  readonly redaction_profile_id: string;
  readonly raw_prompt_removed: boolean;
  readonly raw_output_removed: boolean;
  readonly sensitive_fields_removed: boolean;
  readonly redaction_notes: readonly string[];
}

export interface LiveAdapterTokenUsage {
  readonly input_tokens: number;
  readonly output_tokens: number;
  readonly total_tokens: number;
  readonly usage_available: boolean;
}

export interface LiveAdapterTimingSummary {
  readonly started_at: string;
  readonly completed_at: string;
  readonly latency_ms: number;
  readonly timed_out: boolean;
}

export interface LiveAdapterFailureResponseTelemetry {
  readonly provider_response_id: string | null;
  readonly output_digest: string;
  readonly finish_reason: string;
  readonly token_usage: LiveAdapterTokenUsage;
  readonly timing: LiveAdapterTimingSummary;
}

export interface LiveAdapterRetrySummary {
  readonly attempts: number;
  readonly max_attempts: number;
  readonly retryable: boolean;
  readonly retry_notes: readonly string[];
}

export interface LiveAdapterProviderErrorSummary {
  readonly failure_kind: LiveAdapterFailureKind;
  readonly provider_error_code: string | null;
  readonly provider_error_ref: string | null;
  readonly normalized_message: string;
  readonly retryable: boolean;
}

export interface LiveAdapterTrustSummary {
  readonly raw_provider_output_trust_tier: "T0";
  readonly schema_valid_provider_output_trust_tier: "T0" | "T1";
  readonly max_allowed_trust_tier: "T1";
  readonly provider_identity_promotes_trust: false;
  readonly successful_response_promotes_trust: false;
  readonly provider_output_is_deterministic_evidence: false;
  readonly storage_promotes_trust: false;
  readonly retrieval_promotes_trust: false;
  readonly ledger_presence_promotes_trust: false;
  readonly verified_final_truth_claimed: false;
  readonly requires_hollow_verification_for_t2: true;
  readonly notes: readonly string[];
}

export interface LiveAdapterRequest {
  readonly schema_version: LiveAdapterSchemaVersion;
  readonly task_id: string;
  readonly run_id: string;
  readonly request_id: string;
  readonly route_mode: "single_pass";
  readonly provider_id: LiveAdapterProviderId;
  readonly provider_kind: LiveAdapterProviderKind;
  readonly adapter_id: string;
  readonly adapter_version: string;
  readonly prompt_ref: LiveAdapterPromptRef;
  readonly redacted_prompt_digest: string;
  readonly context_refs: readonly unknown[];
  readonly evidence_refs: readonly unknown[];
  readonly constraints: Readonly<Record<string, unknown>>;
  readonly limits: LiveAdapterProviderNeutralLimits;
  readonly safety_profile: LiveAdapterSafetyProfileRef;
  readonly created_at: string;
}

export interface LiveAdapterResponse {
  readonly schema_version: LiveAdapterSchemaVersion;
  readonly task_id: string;
  readonly run_id: string;
  readonly request_id: string;
  readonly response_id: string;
  readonly route_mode: "single_pass";
  readonly provider_id: LiveAdapterProviderId;
  readonly provider_kind: LiveAdapterProviderKind;
  readonly adapter_id: string;
  readonly adapter_version: string;
  readonly provider_response_id: string | null;
  readonly output_ref: LiveAdapterOutputRef;
  readonly redacted_output_digest: string;
  readonly finish_reason: string;
  readonly token_usage: LiveAdapterTokenUsage;
  readonly timing: LiveAdapterTimingSummary;
  readonly retry_summary: LiveAdapterRetrySummary;
  readonly redaction_summary: LiveAdapterRedactionSummary;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly trust_summary: LiveAdapterTrustSummary;
  readonly validation_status: "raw" | "schema_valid";
  readonly created_at: string;
}

export interface LiveAdapterFailure {
  readonly schema_version: LiveAdapterSchemaVersion;
  readonly task_id: string;
  readonly run_id: string;
  readonly request_id: string;
  readonly route_mode: "single_pass";
  readonly provider_id: LiveAdapterProviderId;
  readonly provider_kind: LiveAdapterProviderKind;
  readonly adapter_id: string;
  readonly adapter_version: string;
  readonly failure_kind: LiveAdapterFailureKind;
  readonly status: Exclude<LiveAdapterResultStatus, "response_schema_valid" | "response_raw">;
  readonly retryable: boolean;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly response_telemetry?: LiveAdapterFailureResponseTelemetry;
  readonly trust_summary: LiveAdapterTrustSummary;
  readonly created_at: string;
}

export type LiveAdapterResult =
  | { readonly ok: true; readonly status: "response_schema_valid" | "response_raw"; readonly response: LiveAdapterResponse; readonly issues: readonly LiveAdapterValidationIssue[] }
  | { readonly ok: false; readonly status: Exclude<LiveAdapterResultStatus, "response_schema_valid" | "response_raw">; readonly failure: LiveAdapterFailure; readonly issues: readonly LiveAdapterValidationIssue[] };

export interface LiveAdapterValidationIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
  readonly severity: "error" | "warning";
}

export interface LiveAdapterValidationResult {
  readonly ok: boolean;
  readonly errors: readonly LiveAdapterValidationIssue[];
}

export type LiveAdapterNormalizedOutputObservation =
  | { readonly ok: true }
  | { readonly ok: false; readonly failure_code: "observer_failure" };

export type LiveAdapterNormalizedOutputObserver = (
  normalized_output_text: string
) =>
  | LiveAdapterNormalizedOutputObservation
  | Promise<LiveAdapterNormalizedOutputObservation>;

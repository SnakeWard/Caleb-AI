export type LiveAdapterRedactionSchemaVersion = "0.1.0" | string;

export type LiveAdapterRedactionScope =
  | "live_adapter_request"
  | "live_adapter_response"
  | "live_adapter_failure"
  | "ledger_event"
  | "runtime_storage_record"
  | "final_output_record";

export type LiveAdapterSensitiveCategory =
  | "api_key"
  | "secret"
  | "env_value"
  | "credential"
  | "auth_token"
  | "private_key"
  | "password"
  | "raw_prompt_text"
  | "raw_model_output_text"
  | "unredacted_user_content"
  | "unredacted_provider_response"
  | "unknown_sensitive_content";

export type LiveAdapterRedactionAction =
  | "block"
  | "remove"
  | "replace_with_digest"
  | "replace_with_ref"
  | "summarize_only"
  | "future_policy_required";

export interface LiveAdapterAllowedContentDeclaration {
  readonly ids_allowed: boolean;
  readonly refs_allowed: boolean;
  readonly digests_allowed: boolean;
  readonly statuses_allowed: boolean;
  readonly trust_summaries_allowed: boolean;
  readonly usage_summaries_allowed: boolean;
  readonly timing_summaries_allowed: boolean;
  readonly warning_summaries_allowed: boolean;
  readonly error_summaries_allowed: boolean;
  readonly raw_text_allowed: false;
}

export interface LiveAdapterBlockedContentDeclaration {
  readonly raw_prompt_text_blocked: true;
  readonly raw_model_output_text_blocked: true;
  readonly api_keys_blocked: true;
  readonly secrets_blocked: true;
  readonly env_values_blocked: true;
  readonly credentials_blocked: true;
  readonly auth_tokens_blocked: true;
  readonly private_keys_blocked: true;
  readonly unredacted_user_content_blocked: true;
  readonly unredacted_provider_response_blocked: true;
}

export interface LiveAdapterRedactionPolicy {
  readonly schema_version: LiveAdapterRedactionSchemaVersion;
  readonly policy_id: string;
  readonly policy_version: string;
  readonly scope: LiveAdapterRedactionScope | readonly LiveAdapterRedactionScope[];
  readonly safety_profile_id: string;
  readonly redaction_required: boolean;
  readonly raw_prompt_allowed: false;
  readonly raw_output_allowed: false;
  readonly ledger_raw_prompt_allowed: false;
  readonly ledger_raw_output_allowed: false;
  readonly runtime_storage_raw_prompt_allowed: false;
  readonly runtime_storage_raw_output_allowed: false;
  readonly allowed_content: LiveAdapterAllowedContentDeclaration;
  readonly blocked_content: LiveAdapterBlockedContentDeclaration;
  readonly sensitive_categories: readonly LiveAdapterSensitiveCategory[];
  readonly default_action: LiveAdapterRedactionAction;
  readonly created_at: string;
  readonly notes: readonly string[];
}

export interface LiveAdapterRedactionDigestRef {
  readonly digest_id: string;
  readonly digest_algorithm: string;
  readonly digest_value: string;
  readonly source_kind: string;
  readonly raw_content_retained: false;
}

export interface LiveAdapterRedactionManifest {
  readonly schema_version: LiveAdapterRedactionSchemaVersion;
  readonly manifest_id: string;
  readonly policy_id: string;
  readonly task_id: string;
  readonly run_id: string;
  readonly request_id: string;
  readonly scope: LiveAdapterRedactionScope | readonly LiveAdapterRedactionScope[];
  readonly input_digest_refs: readonly LiveAdapterRedactionDigestRef[];
  readonly output_digest_refs: readonly LiveAdapterRedactionDigestRef[];
  readonly redacted_fields: readonly string[];
  readonly blocked_fields: readonly string[];
  readonly allowed_fields: readonly string[];
  readonly sensitive_categories_detected: readonly LiveAdapterSensitiveCategory[];
  readonly raw_prompt_removed: true;
  readonly raw_output_removed: boolean;
  readonly api_keys_removed: true;
  readonly secrets_removed: true;
  readonly env_values_removed: true;
  readonly created_at: string;
  readonly notes: readonly string[];
}

export interface LiveAdapterRedactionAuditSummary {
  readonly redaction_applied: boolean;
  readonly redaction_policy_id: string;
  readonly redaction_manifest_id: string;
  readonly sensitive_content_detected: boolean;
  readonly sensitive_content_removed: boolean;
  readonly raw_prompt_removed: boolean;
  readonly raw_output_removed: boolean;
  readonly api_keys_removed: boolean;
  readonly secrets_removed: boolean;
  readonly env_values_removed: boolean;
  readonly remaining_sensitive_content_allowed: false;
  readonly audit_notes: readonly string[];
}

export interface LiveAdapterSafetyProfileCompatibility {
  readonly safety_profile_id: string;
  readonly redaction_policy_id: string;
  readonly compatible: boolean;
  readonly incompatibility_reasons: readonly string[];
  readonly raw_transcript_storage_allowed: false;
  readonly ledger_raw_prompt_allowed: false;
  readonly ledger_raw_output_allowed: false;
  readonly live_provider_allowed_after_redaction: boolean;
}

export interface LiveAdapterRedactionTrustSummary {
  readonly redaction_promotes_trust: false;
  readonly redaction_metadata_promotes_trust: false;
  readonly provider_identity_promotes_trust: false;
  readonly successful_provider_response_promotes_trust: false;
  readonly ledger_presence_promotes_trust: false;
  readonly storage_promotes_trust: false;
  readonly retrieval_promotes_trust: false;
  readonly redacted_output_is_verified_truth: false;
  readonly redacted_output_is_deterministic_evidence: false;
  readonly live_provider_output_max_trust_tier: "T1";
  readonly requires_hollow_verification_for_t2: true;
  readonly notes: readonly string[];
}

export type LiveAdapterRedactionResultStatus =
  | "redacted"
  | "rejected"
  | "blocked"
  | "validation_failed"
  | "policy_incompatible";

export interface LiveAdapterRedactionResult {
  readonly schema_version: LiveAdapterRedactionSchemaVersion;
  readonly result_id: string;
  readonly policy_id: string;
  readonly manifest_id: string;
  readonly task_id: string;
  readonly run_id: string;
  readonly request_id: string;
  readonly scope: LiveAdapterRedactionScope | readonly LiveAdapterRedactionScope[];
  readonly status: LiveAdapterRedactionResultStatus;
  readonly digest_refs: readonly LiveAdapterRedactionDigestRef[];
  readonly audit_summary: LiveAdapterRedactionAuditSummary;
  readonly safety_profile_compatibility: LiveAdapterSafetyProfileCompatibility;
  readonly trust_summary: LiveAdapterRedactionTrustSummary;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly created_at: string;
  readonly notes: readonly string[];
}

export interface LiveAdapterRedactionValidationIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
  readonly severity: "error" | "warning";
}

export interface LiveAdapterRedactionValidationResult {
  readonly ok: boolean;
  readonly errors: readonly LiveAdapterRedactionValidationIssue[];
}

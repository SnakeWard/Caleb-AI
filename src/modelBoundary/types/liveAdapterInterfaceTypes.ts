import type { LiveAdapterFailureKind, LiveAdapterRequest, LiveAdapterResponse } from "./liveAdapterTypes.js";

export type LiveAdapterInterfaceSchemaVersion = "0.1.0" | string;
export type LiveAdapterInterfaceId = string;
export type LiveAdapterInterfaceKind = "mock_compatible_live_adapter_interface";
export type LiveAdapterInterfaceMode = "mock_only" | "no_network" | "future_live_opt_in";

export interface LiveAdapterInterfaceCapabilities {
  readonly schema_version: LiveAdapterInterfaceSchemaVersion;
  readonly interface_id: LiveAdapterInterfaceId;
  readonly interface_kind: LiveAdapterInterfaceKind;
  readonly adapter_id: string;
  readonly adapter_version: string;
  readonly supported_route_modes: readonly string[];
  readonly supported_provider_kinds: readonly string[];
  readonly supports_live_network: false;
  readonly supports_mock_invocation: true;
  readonly requires_api_key: false;
  readonly imports_provider_sdk: false;
  readonly performs_network_call: false;
  readonly stores_raw_prompt: false;
  readonly stores_raw_output: false;
  readonly writes_ledger_directly: false;
  readonly max_output_trust_tier: "T1";
  readonly created_at: string;
  readonly notes: readonly string[];
}

export interface LiveAdapterInvocationContext {
  readonly schema_version: LiveAdapterInterfaceSchemaVersion;
  readonly task_id: string;
  readonly run_id: string;
  readonly request_id: string;
  readonly route_mode: "single_pass";
  readonly interface_id: LiveAdapterInterfaceId;
  readonly adapter_id: string;
  readonly safety_profile_id: string;
  readonly redaction_policy_id: string;
  readonly redaction_manifest_id: string;
  readonly created_at: string;
  readonly context_refs: readonly unknown[];
  readonly evidence_refs: readonly unknown[];
  readonly notes: readonly string[];
}

export interface LiveAdapterInvocationInput {
  readonly schema_version: LiveAdapterInterfaceSchemaVersion;
  readonly invocation_id: string;
  readonly context: LiveAdapterInvocationContext;
  readonly live_adapter_request: LiveAdapterRequest | Readonly<Record<string, unknown>>;
  readonly redaction_result_ref: string;
  readonly prompt_digest: string;
  readonly raw_prompt_included: false;
  readonly api_key_included: false;
  readonly network_allowed: false;
  readonly created_at: string;
}

export interface LiveAdapterInvocationOutput {
  readonly schema_version: LiveAdapterInterfaceSchemaVersion;
  readonly invocation_id: string;
  readonly response_id: string;
  readonly adapter_id: string;
  readonly interface_id: LiveAdapterInterfaceId;
  readonly live_adapter_response: LiveAdapterResponse | Readonly<Record<string, unknown>>;
  readonly redaction_result_ref: string;
  readonly output_digest: string;
  readonly raw_output_included: false;
  readonly network_used: false;
  readonly provider_sdk_used: false;
  readonly created_at: string;
}

export type LiveAdapterHealthStatusValue =
  | "available_mock_only"
  | "unavailable"
  | "disabled"
  | "future_live_not_enabled";

export interface LiveAdapterHealthStatus {
  readonly schema_version: LiveAdapterInterfaceSchemaVersion;
  readonly interface_id: LiveAdapterInterfaceId;
  readonly adapter_id: string;
  readonly status: LiveAdapterHealthStatusValue;
  readonly live_network_available: false;
  readonly api_key_available: false;
  readonly provider_sdk_available: false;
  readonly mock_invocation_available: boolean;
  readonly checked_at: string;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
}

export interface LiveAdapterTrustCapRequirements {
  readonly raw_provider_output_trust_tier: "T0";
  readonly schema_valid_provider_output_trust_tier: "T1";
  readonly max_allowed_output_trust_tier: "T1";
  readonly interface_validation_promotes_trust: false;
  readonly adapter_availability_promotes_trust: false;
  readonly mock_compatibility_promotes_trust: false;
  readonly provider_identity_promotes_trust: false;
  readonly successful_provider_response_promotes_trust: false;
  readonly provider_output_is_deterministic_evidence: false;
  readonly requires_hollow_verification_for_t2: true;
  readonly notes: readonly string[];
}

export interface LiveAdapterUnavailableResult {
  readonly schema_version: LiveAdapterInterfaceSchemaVersion;
  readonly interface_id: LiveAdapterInterfaceId;
  readonly adapter_id: string;
  readonly status: "unavailable" | "disabled" | "future_live_not_enabled";
  readonly reason: string;
  readonly failure_kind: LiveAdapterFailureKind;
  readonly retryable: boolean;
  readonly trust_summary: LiveAdapterTrustCapRequirements;
  readonly created_at: string;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
}

export interface LiveAdapterSafetyRequirements {
  readonly redaction_required: true;
  readonly safety_profile_required: true;
  readonly raw_prompt_forbidden: true;
  readonly raw_output_forbidden: true;
  readonly api_key_forbidden_in_payload: true;
  readonly secrets_forbidden_in_payload: true;
  readonly env_values_forbidden_in_payload: true;
  readonly ledger_raw_prompt_forbidden: true;
  readonly ledger_raw_output_forbidden: true;
  readonly network_disabled_for_r20: true;
  readonly notes: readonly string[];
}

export interface LiveAdapterRedactionRequirements {
  readonly redaction_policy_required: true;
  readonly redaction_manifest_required: true;
  readonly redaction_result_required: true;
  readonly redaction_does_not_verify_truth: true;
  readonly redaction_does_not_promote_trust: true;
  readonly refs_digests_summaries_preferred: true;
  readonly notes: readonly string[];
}

export interface LiveAdapterTestIsolationRequirements {
  readonly unit_tests_offline: true;
  readonly unit_tests_no_api_keys: true;
  readonly unit_tests_no_provider_sdk: true;
  readonly unit_tests_no_network: true;
  readonly live_tests_opt_in_only: true;
  readonly live_tests_skipped_by_default: true;
  readonly test_fixtures_no_secrets: true;
  readonly test_fixtures_no_raw_prompt: true;
  readonly test_fixtures_no_raw_output: true;
  readonly notes: readonly string[];
}

export interface LiveAdapterMockCompatibilitySummary {
  readonly compatible_with_mock_boundary: true;
  readonly compatible_with_live_adapter_types: true;
  readonly compatible_with_redaction_contract: true;
  readonly uses_provider_neutral_shape: true;
  readonly no_network_required: true;
  readonly no_api_key_required: true;
  readonly no_provider_sdk_required: true;
  readonly notes: readonly string[];
}

export type LiveAdapterInvocationResultStatus =
  | "mock_interface_ready"
  | "unavailable"
  | "rejected"
  | "validation_failed"
  | "future_live_not_enabled";

export interface LiveAdapterInvocationResult {
  readonly schema_version: LiveAdapterInterfaceSchemaVersion;
  readonly result_id: string;
  readonly invocation_id: string;
  readonly interface_id: LiveAdapterInterfaceId;
  readonly adapter_id: string;
  readonly ok: boolean;
  readonly status: LiveAdapterInvocationResultStatus;
  readonly context: LiveAdapterInvocationContext;
  readonly input_ref: string;
  readonly output_ref: string | null;
  readonly health_status: LiveAdapterHealthStatus;
  readonly safety_requirements: LiveAdapterSafetyRequirements;
  readonly redaction_requirements: LiveAdapterRedactionRequirements;
  readonly trust_cap_requirements: LiveAdapterTrustCapRequirements;
  readonly test_isolation_requirements: LiveAdapterTestIsolationRequirements;
  readonly mock_compatibility: LiveAdapterMockCompatibilitySummary;
  readonly warnings: readonly string[];
  readonly errors: readonly string[];
  readonly created_at: string;
  readonly notes: readonly string[];
}

export interface LiveAdapterInterfaceValidationIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
  readonly severity: "error" | "warning";
}

export interface LiveAdapterInterfaceValidationResult {
  readonly ok: boolean;
  readonly errors: readonly LiveAdapterInterfaceValidationIssue[];
}

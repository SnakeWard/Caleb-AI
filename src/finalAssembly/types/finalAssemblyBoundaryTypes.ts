import type { SinglePassRouteMvpResult } from "../../logicEngine/index.js";

export type FinalAssemblyBoundarySchemaVersion = "0.1.0" | string;
export type FinalAssemblyStatus =
  | "assembled_unverified"
  | "rejected"
  | "route_result_invalid"
  | "trust_violation"
  | "release_blocked";

export interface FinalAssemblyIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
  readonly severity: "error" | "warning";
}

export interface FinalAssemblyRequest {
  readonly schema_version: FinalAssemblyBoundarySchemaVersion;
  readonly task_id: string;
  readonly run_id: string;
  readonly assembly_id: string;
  readonly route_mode: "single_pass";
  readonly route_result_ref: string;
  readonly route_result: SinglePassRouteMvpResult | Readonly<Record<string, unknown>>;
  readonly requested_output_type: string;
  readonly created_at: string;
}

export interface FinalAssemblySourceRefs {
  readonly route_result_ref: string;
  readonly request_id: string | null;
  readonly response_id: string | null;
  readonly raw_response_record_id: string | null;
  readonly validated_response_record_id: string | null;
  readonly model_invocation_record_id: string | null;
}

export interface FinalAssemblyTrustSummary {
  readonly highest_model_output_trust_tier: "T0" | "T1";
  readonly final_packet_trust_tier: "T0" | "T1";
  readonly final_answer_claims_verified: false;
  readonly route_completion_promotes_trust: false;
  readonly final_assembly_promotes_trust: false;
  readonly storage_promotes_trust: false;
  readonly retrieval_promotes_trust: false;
  readonly model_output_is_deterministic_evidence: false;
  readonly requires_hollow_verification_for_t2: true;
  readonly notes: readonly string[];
}

export interface FinalAssemblyLimitations {
  readonly has_verified_hollow_evidence: boolean;
  readonly has_live_model_provider: false;
  readonly has_real_ledger_write: false;
  readonly has_persistent_storage: false;
  readonly has_role_rotation: false;
  readonly limitation_notes: readonly string[];
}

export interface FinalAssemblyReleaseEligibility {
  readonly can_release_to_user: boolean;
  readonly release_type: "mock_single_pass_unverified" | "blocked_unverified";
  readonly blocking_reasons: readonly string[];
  readonly required_disclaimer: string;
  readonly trust_label: string;
}

export interface FinalAssemblyPacket {
  readonly schema_version: FinalAssemblyBoundarySchemaVersion;
  readonly packet_id: string;
  readonly task_id: string;
  readonly run_id: string;
  readonly assembly_id: string;
  readonly route_mode: "single_pass";
  readonly status: FinalAssemblyStatus;
  readonly user_facing_text: string;
  readonly source_refs: FinalAssemblySourceRefs;
  readonly trust_summary: FinalAssemblyTrustSummary;
  readonly limitations: FinalAssemblyLimitations;
  readonly release_eligibility: FinalAssemblyReleaseEligibility;
  readonly warnings: readonly string[];
  readonly issues: readonly FinalAssemblyIssue[];
  readonly created_at: string;
}

export interface FinalAssemblyValidationResult {
  readonly ok: boolean;
  readonly errors: readonly FinalAssemblyIssue[];
}

export interface FinalAssemblyBoundaryRunResult extends FinalAssemblyValidationResult {
  readonly packet: FinalAssemblyPacket | null;
}

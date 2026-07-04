import type { LedgerEntry } from "../../types/index.js";
import type { FinalAssemblyPacket } from "./finalAssemblyBoundaryTypes.js";
import type { RouteLedgerEvent } from "../../logicEngine/index.js";

export type FinalOutputLedgerRecordSchemaVersion = "0.1.0" | string;
export type FinalOutputLedgerRecordKind = "mocked_single_pass_final_output_recorded";
export type FinalOutputLedgerRecordStatus = "recorded_unverified" | "rejected" | "write_failed" | "validation_failed";
export type FinalOutputLedgerRecordActorType = "final_assembly_boundary" | "logic_engine" | "route_runner";

export interface FinalOutputLedgerRecordValidationIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
  readonly severity: "error" | "warning";
}

export interface FinalOutputLedgerRecordRefs {
  readonly route_event_ref: string;
  readonly route_result_ref: string;
  readonly final_assembly_packet_ref: string;
  readonly model_invocation_record_id: string;
  readonly raw_response_record_id: string;
  readonly validated_response_record_id: string;
}

export interface FinalOutputLedgerRecordDigestRefs {
  readonly final_packet_digest: string;
  readonly route_event_digest: string;
}

export interface FinalOutputLedgerRecordReleaseSummary {
  readonly release_type: string;
  readonly can_release_to_user: boolean;
  readonly trust_label: string;
  readonly required_disclaimer_present: boolean;
  readonly verified_final_truth_claimed: false;
  readonly blocking_reasons: readonly string[];
  readonly release_notes: readonly string[];
}

export interface FinalOutputLedgerRecordTrustSummary {
  readonly final_packet_trust_tier: "T0" | "T1";
  readonly highest_model_output_trust_tier: "T0" | "T1";
  readonly max_allowed_trust_tier: "T1";
  readonly raw_model_output_trust_tier: "T0";
  readonly schema_valid_model_output_trust_tier: "T1";
  readonly final_output_record_promotes_trust: false;
  readonly ledger_write_promotes_trust: false;
  readonly ledger_presence_promotes_trust: false;
  readonly final_assembly_promotes_trust: false;
  readonly route_completion_promotes_trust: false;
  readonly storage_promotes_trust: false;
  readonly retrieval_promotes_trust: false;
  readonly model_output_is_deterministic_evidence: false;
  readonly final_output_is_verified_truth: false;
  readonly requires_hollow_verification_for_t2: true;
  readonly notes: readonly string[];
}

export interface FinalOutputLedgerRecordLimitations {
  readonly has_live_model_provider: false;
  readonly has_real_model_api_layer: false;
  readonly has_verified_hollow_evidence: boolean;
  readonly has_real_ledger_route_event: boolean;
  readonly has_persistent_artifact_store: false;
  readonly has_hollow_execution: false;
  readonly has_role_rotation: false;
  readonly limitation_notes: readonly string[];
}

export interface FinalOutputLedgerRecordWriteIntent {
  readonly target: "ledger";
  readonly append_only: true;
  readonly writes_in_this_pass: true;
  readonly trust_effect: "none";
  readonly allowed_content: readonly string[];
  readonly blocked_content: readonly string[];
  readonly notes: readonly string[];
}

export interface FinalOutputLedgerRecord {
  readonly schema_version: FinalOutputLedgerRecordSchemaVersion;
  readonly record_id: string;
  readonly record_kind: FinalOutputLedgerRecordKind;
  readonly status: FinalOutputLedgerRecordStatus;
  readonly task_id: string;
  readonly run_id: string;
  readonly route_mode: "single_pass";
  readonly assembly_id: string;
  readonly packet_id: string;
  readonly actor_type: FinalOutputLedgerRecordActorType;
  readonly actor_id: string;
  readonly created_at: string;
  readonly route_event_ref: string;
  readonly route_result_ref: string;
  readonly final_assembly_packet_ref: string;
  readonly model_invocation_record_id: string;
  readonly raw_response_record_id: string;
  readonly validated_response_record_id: string;
  readonly final_packet_digest: string;
  readonly route_event_digest: string;
  readonly final_output_type: string;
  readonly release_summary: FinalOutputLedgerRecordReleaseSummary;
  readonly trust_summary: FinalOutputLedgerRecordTrustSummary;
  readonly limitations: FinalOutputLedgerRecordLimitations;
  readonly write_intent: FinalOutputLedgerRecordWriteIntent;
  readonly warnings: readonly string[];
  readonly issues: readonly string[];
  readonly notes: readonly string[];
}

export interface FinalOutputLedgerRecordValidationResult {
  readonly ok: boolean;
  readonly errors: readonly FinalOutputLedgerRecordValidationIssue[];
}

export interface FinalOutputLedgerRecordBuildInput {
  readonly final_assembly_packet: FinalAssemblyPacket | Readonly<Record<string, unknown>>;
  readonly route_ledger_event: RouteLedgerEvent | Readonly<Record<string, unknown>>;
  readonly route_event_ref: string;
  readonly route_result_ref: string;
  readonly final_assembly_packet_ref: string;
  readonly record_id?: string;
  readonly actor_type?: FinalOutputLedgerRecordActorType;
  readonly actor_id?: string;
  readonly final_output_type?: string;
  readonly created_at?: string;
}

export interface FinalOutputLedgerRecordBuildResult extends FinalOutputLedgerRecordValidationResult {
  readonly record: FinalOutputLedgerRecord | null;
}

export interface FinalOutputLedgerRecordWriteResult extends FinalOutputLedgerRecordValidationResult {
  readonly status: FinalOutputLedgerRecordStatus;
  readonly record: FinalOutputLedgerRecord | null;
  readonly ledger_entry: LedgerEntry | null;
  readonly ledger_path: string | null;
}

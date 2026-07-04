import type { LedgerEntry } from "../../types/index.js";
import type { FinalAssemblyPacket } from "../../finalAssembly/index.js";
import type { SinglePassRouteMvpResult } from "./singlePassRouteMvpTypes.js";

export type RouteLedgerEventSchemaVersion = "0.1.0" | string;
export type RouteLedgerEventKind = "mocked_single_pass_route_completed" | "mocked_single_pass_route_rejected";
export type RouteLedgerEventStatus = "recorded" | "rejected" | "write_failed" | "validation_failed";
export type RouteLedgerEventActorType = "logic_engine" | "route_runner" | "final_assembly_boundary";

export interface RouteLedgerEventValidationIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
  readonly severity: "error" | "warning";
}

export interface RouteLedgerEventRefs {
  readonly route_result_ref: string;
  readonly final_assembly_packet_ref: string;
  readonly request_id: string;
  readonly response_id: string;
  readonly model_invocation_record_id: string;
  readonly raw_response_record_id: string;
  readonly validated_response_record_id: string;
  readonly final_packet_id: string;
}

export interface RouteLedgerEventDigestRefs {
  readonly route_result_digest: string;
  readonly final_packet_digest: string;
}

export interface RouteLedgerEventTrustSummary {
  readonly raw_model_output_trust_tier: "T0";
  readonly schema_valid_model_output_trust_tier: "T1";
  readonly final_packet_trust_tier: "T0" | "T1";
  readonly max_model_output_trust_tier: "T1";
  readonly verified_final_truth_claimed: false;
  readonly model_output_is_deterministic_evidence: false;
  readonly route_completion_promotes_trust: false;
  readonly final_assembly_promotes_trust: false;
  readonly ledger_write_promotes_trust: false;
  readonly ledger_presence_promotes_trust: false;
  readonly storage_promotes_trust: false;
  readonly retrieval_promotes_trust: false;
  readonly notes: readonly string[];
}

export interface RouteLedgerEventWriteIntent {
  readonly target: "ledger";
  readonly append_only: true;
  readonly writes_in_this_pass: true;
  readonly trust_effect: "none";
  readonly allowed_content: readonly string[];
  readonly blocked_content: readonly string[];
  readonly notes: readonly string[];
}

export interface RouteLedgerEvent {
  readonly schema_version: RouteLedgerEventSchemaVersion;
  readonly event_id: string;
  readonly event_kind: RouteLedgerEventKind;
  readonly task_id: string;
  readonly run_id: string;
  readonly route_mode: "single_pass";
  readonly route_status: string;
  readonly actor_type: RouteLedgerEventActorType;
  readonly actor_id: string;
  readonly created_at: string;
  readonly route_result_ref: string;
  readonly final_assembly_packet_ref: string;
  readonly request_id: string;
  readonly response_id: string;
  readonly model_invocation_record_id: string;
  readonly raw_response_record_id: string;
  readonly validated_response_record_id: string;
  readonly final_packet_id: string;
  readonly route_result_digest: string;
  readonly final_packet_digest: string;
  readonly trust_summary: RouteLedgerEventTrustSummary;
  readonly write_intent: RouteLedgerEventWriteIntent;
  readonly warnings: readonly string[];
  readonly issues: readonly string[];
  readonly notes: readonly string[];
}

export interface RouteLedgerEventValidationResult {
  readonly ok: boolean;
  readonly errors: readonly RouteLedgerEventValidationIssue[];
}

export interface RouteLedgerEventBuildInput {
  readonly route_result: SinglePassRouteMvpResult | Readonly<Record<string, unknown>>;
  readonly final_assembly_packet: FinalAssemblyPacket | Readonly<Record<string, unknown>>;
  readonly route_result_ref: string;
  readonly final_assembly_packet_ref: string;
  readonly event_id?: string;
  readonly actor_type?: RouteLedgerEventActorType;
  readonly actor_id?: string;
  readonly created_at?: string;
}

export interface RouteLedgerEventBuildResult extends RouteLedgerEventValidationResult {
  readonly event: RouteLedgerEvent | null;
}

export interface RouteLedgerEventWriteResult extends RouteLedgerEventValidationResult {
  readonly status: RouteLedgerEventStatus;
  readonly event: RouteLedgerEvent | null;
  readonly ledger_entry: LedgerEntry | null;
  readonly ledger_path: string | null;
}

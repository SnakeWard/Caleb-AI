export type RuntimeStorageSchemaVersion = "0.1.0" | string;

export type RuntimeStorageRecordKind =
  | "task_frame_ref"
  | "signal_frame_ref"
  | "route_decision_ref"
  | "work_graph_ref"
  | "role_artifact"
  | "role_handoff"
  | "artifact_bundle"
  | "evidence_packet"
  | "execution_context"
  | "telemetry_trace"
  | "ledger_ref"
  | "snapshot_ref"
  | "final_output";

export type RuntimeStorageTrustState = "T0" | "T1" | "T2" | "T3" | "T4";

export type RuntimeStorageValidationStatus =
  | "raw"
  | "schema_valid"
  | "verified"
  | "rejected"
  | "quarantined"
  | "superseded";

export type RuntimeStorageSourceKind =
  | "user"
  | "model"
  | "role"
  | "hollow"
  | "logic_engine"
  | "verified_return_path"
  | "ledger"
  | "snapshot_guard"
  | "hollowcut"
  | "system";

export interface RuntimeStorageRef {
  readonly ref_id: string;
  readonly ref_kind: RuntimeStorageRecordKind | "external";
  readonly description?: string;
}

export interface RuntimeStorageRecordBase {
  readonly storage_record_id: string;
  readonly record_kind: RuntimeStorageRecordKind;
  readonly schema_version: RuntimeStorageSchemaVersion;
  readonly task_id: string;
  readonly run_id: string;
  readonly created_at: string;
  readonly source_kind: RuntimeStorageSourceKind;
  readonly trust_tier: RuntimeStorageTrustState;
  readonly validation_status: RuntimeStorageValidationStatus;
  readonly ledger_refs: readonly string[];
  readonly input_refs: readonly RuntimeStorageRef[];
  readonly output_refs: readonly RuntimeStorageRef[];
  readonly artifact_refs: readonly RuntimeStorageRef[];
  readonly notes: readonly string[];
}

export interface TaskFrameRefStorageRecord extends RuntimeStorageRecordBase {
  readonly record_kind: "task_frame_ref";
}

export interface SignalFrameRefStorageRecord extends RuntimeStorageRecordBase {
  readonly record_kind: "signal_frame_ref";
}

export interface RouteDecisionRefStorageRecord extends RuntimeStorageRecordBase {
  readonly record_kind: "route_decision_ref";
}

export interface WorkGraphRefStorageRecord extends RuntimeStorageRecordBase {
  readonly record_kind: "work_graph_ref";
}

export interface RoleArtifactStorageRecord extends RuntimeStorageRecordBase {
  readonly record_kind: "role_artifact";
  readonly role_id: string;
  readonly role_version: string;
  readonly artifact_id: string;
  readonly artifact_type: string;
  readonly evidence_refs: readonly RuntimeStorageRef[];
  readonly assumptions: readonly string[];
  readonly contradictions: readonly string[];
  readonly defects: readonly string[];
  readonly open_questions: readonly string[];
}

export interface RoleHandoffStorageRecord extends RuntimeStorageRecordBase {
  readonly record_kind: "role_handoff";
  readonly from_role: string;
  readonly to_role: string;
  readonly handoff_id: string;
  readonly handoff_status: string;
  readonly allowed_to_consume: boolean;
  readonly blocking_reasons: readonly string[];
}

export interface ArtifactBundleStorageRecord extends RuntimeStorageRecordBase {
  readonly record_kind: "artifact_bundle";
  readonly bundle_id: string;
  readonly bundle_type: string;
  readonly member_artifact_refs: readonly RuntimeStorageRef[];
  readonly consistency_status: string;
  readonly report_refs: readonly RuntimeStorageRef[];
}

export interface EvidencePacketStorageRecord extends RuntimeStorageRecordBase {
  readonly record_kind: "evidence_packet";
  readonly evidence_id: string;
  readonly evidence_source: string;
  readonly claim_keys: readonly string[];
  readonly units: string;
  readonly verification_refs: readonly RuntimeStorageRef[];
  readonly can_be_used_for_final: boolean;
}

export interface ExecutionContextStorageRecord extends RuntimeStorageRecordBase {
  readonly record_kind: "execution_context";
  readonly route_mode: string;
  readonly active_pass: string;
  readonly active_role: string;
  readonly work_graph_ref: RuntimeStorageRef;
  readonly accepted_evidence_refs: readonly RuntimeStorageRef[];
  readonly rejected_artifact_refs: readonly RuntimeStorageRef[];
  readonly contradiction_register_ref: RuntimeStorageRef | null;
  readonly defect_register_ref: RuntimeStorageRef | null;
  readonly snapshot_refs: readonly RuntimeStorageRef[];
  readonly final_output_ref: RuntimeStorageRef | null;
  readonly status: string;
}

export interface TelemetryTraceStorageRecord extends RuntimeStorageRecordBase {
  readonly record_kind: "telemetry_trace";
  readonly trace_id: string;
  readonly event_count: number;
  readonly event_refs: readonly RuntimeStorageRef[];
  readonly started_at: string;
  readonly completed_at: string | null;
  readonly status: string;
}

export interface LedgerRefStorageRecord extends RuntimeStorageRecordBase {
  readonly record_kind: "ledger_ref";
  readonly ledger_entry_id: string;
  readonly ledger_path: string;
  readonly activity: string;
  readonly actor_type: string;
  readonly actor_id: string;
}

export interface SnapshotRefStorageRecord extends RuntimeStorageRecordBase {
  readonly record_kind: "snapshot_ref";
  readonly snapshot_id: string;
  readonly snapshot_type: string;
  readonly snapshot_path: string;
  readonly rollback_available: boolean;
}

export interface FinalOutputStorageRecord extends RuntimeStorageRecordBase {
  readonly record_kind: "final_output";
  readonly final_output_id: string;
  readonly output_type: string;
  readonly assembled_from_refs: readonly RuntimeStorageRef[];
  readonly final_verification_status: RuntimeStorageValidationStatus;
  readonly release_status: "draft" | "blocked" | "released";
}

export type RuntimeStorageRecord =
  | TaskFrameRefStorageRecord
  | SignalFrameRefStorageRecord
  | RouteDecisionRefStorageRecord
  | WorkGraphRefStorageRecord
  | RoleArtifactStorageRecord
  | RoleHandoffStorageRecord
  | ArtifactBundleStorageRecord
  | EvidencePacketStorageRecord
  | ExecutionContextStorageRecord
  | TelemetryTraceStorageRecord
  | LedgerRefStorageRecord
  | SnapshotRefStorageRecord
  | FinalOutputStorageRecord;

export interface RuntimeStorageValidationIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface RuntimeStorageValidationResult {
  readonly ok: boolean;
  readonly errors: readonly RuntimeStorageValidationIssue[];
}

# Runtime Storage Type Contracts

## 1. Purpose

This pass creates static TypeScript contracts for future runtime storage. It defines record shapes, validation status, trust state, source kinds, storage references, kind-specific records, and deterministic validator behavior.

This pass does not implement storage.

## 2. Relationship To R8

R8 locked the Runtime / Storage Planning Boundary. R9 turns that boundary into type contracts so future work can describe storage records without creating a store or persistence layer.

The R8 rules remain active: storage does not increase trust, persistence is not verification, retrieval is not trust promotion, and VRP remains the trust gate.

## 3. Non-Implementation Statement

- No runtime store is implemented.
- No persistence layer is implemented.
- No database is implemented.
- No model adapter is implemented.
- No role runtime is implemented.
- No UI storage is implemented.

R9 does not add file-backed storage, in-memory storage, SQLite, Postgres, cloud storage, vector storage, provider SDKs, model API calls, role execution, or Hollowcut export storage.

## 4. Record Kinds

RuntimeStorageRecordKind includes:

- task_frame_ref
- signal_frame_ref
- route_decision_ref
- work_graph_ref
- role_artifact
- role_handoff
- artifact_bundle
- evidence_packet
- execution_context
- telemetry_trace
- ledger_ref
- snapshot_ref
- final_output

## 5. Base Record Contract

Every runtime storage record must include:

- storage_record_id
- record_kind
- schema_version
- task_id
- run_id
- created_at
- source_kind
- trust_tier
- validation_status
- ledger_refs
- input_refs
- output_refs
- artifact_refs
- notes

Base records are identity and provenance envelopes only. A stored object must carry trust state, not imply it.

## 6. Specific Record Contracts

RoleArtifactStorageRecord adds role_id, role_version, artifact_id, artifact_type, evidence_refs, assumptions, contradictions, defects, and open_questions.

RoleHandoffStorageRecord adds from_role, to_role, handoff_id, handoff_status, allowed_to_consume, and blocking_reasons.

ArtifactBundleStorageRecord adds bundle_id, bundle_type, member_artifact_refs, consistency_status, and report_refs.

EvidencePacketStorageRecord adds evidence_id, evidence_source, claim_keys, units, verification_refs, and can_be_used_for_final.

ExecutionContextStorageRecord adds route_mode, active_pass, active_role, work_graph_ref, accepted_evidence_refs, rejected_artifact_refs, contradiction_register_ref, defect_register_ref, snapshot_refs, final_output_ref, and status.

TelemetryTraceStorageRecord adds trace_id, event_count, event_refs, started_at, completed_at, and status.

LedgerRefStorageRecord adds ledger_entry_id, ledger_path, activity, actor_type, and actor_id.

SnapshotRefStorageRecord adds snapshot_id, snapshot_type, snapshot_path, and rollback_available.

FinalOutputStorageRecord adds final_output_id, output_type, assembled_from_refs, final_verification_status, and release_status.

TaskFrame, SignalFrame, RouteDecision, and WorkGraph reference records use the base record contract as reference envelopes for future storage.

## 7. Trust Invariants

The validator enforces:

1. A record with source_kind model cannot be created above T0 unless validation_status is schema_valid or higher.
2. A record with source_kind role cannot be created above T0 unless validation_status is schema_valid or higher.
3. A record with validation_status raw cannot have trust_tier above T0.
4. A record cannot claim T2 unless it has at least one verification_ref or ledger_ref.
5. A record cannot claim T3 unless it has ledger_refs and validation_status verified.
6. A record cannot claim T4 unless notes or artifact_refs indicate human approval or external authority.
7. Storage alone must never promote trust.
8. Rejected or quarantined records cannot be marked can_be_used_for_final.
9. Final output records cannot be release_status released unless final_verification_status is verified.
10. Evidence packets marked can_be_used_for_final must not be T0.

These rules preserve the doctrine that storage does not increase trust and VRP remains the trust gate.

## 8. Future Use

This type layer is intended to support:

- in-memory artifact store prototype
- mocked single_pass model boundary
- ledgered model invocation record
- persistent artifact store
- full role rotation runtime
- Thinking Mode trace display

Future implementation must continue to prove that storage, persistence, and retrieval do not promote trust.

## 9. Acceptance Verdict

Runtime Storage Type Contracts: Accepted
Status: Static runtime storage type layer complete; no runtime storage implemented
Next phase: In-memory artifact store prototype or mocked single_pass model boundary

# Runtime / Storage Planning Boundary

## 1. Purpose

This document locks the boundary between Caleb AI's accepted static role artifact contracts and any future runtime or persistent storage layer. It defines what future storage must preserve, what it must never imply, and which runtime behaviors remain outside this pass.

The purpose is planning only. Runtime/storage must not become a backdoor trust path.

## 2. Current Accepted Foundation

The current accepted Caleb AI foundation includes:

- V1 Hollow foundation.
- Verified Return Path.
- Ledger.
- Auto Snapshot / Change Guard.
- Logic Engine V0.
- WorkGraph executor lite.
- telemetry trace contract.
- Role Artifact Contract Layer R1-R7.
- Hollowcut supplied-state validation lane.

These layers define local deterministic execution, trust promotion, provenance recording, static role artifact contracts, and supplied-state validation boundaries. They do not authorize runtime role storage or model-backed memory.

## 3. Boundary Statement

This pass does not implement runtime storage.

This pass does not persist role artifacts beyond existing examples/tests/docs.

This pass does not execute models.

This pass does not implement live role rotation.

This pass does not create database-backed artifact storage.

This pass defines the rules future storage must obey.

No runtime storage is implemented in this pass.

No model API calls are implemented in this pass.

No live role rotation runtime is implemented in this pass.

## 4. Storage Domains

Future storage planning must treat each storage domain as explicit, typed, and independently gated:

- TaskFrame storage.
- SignalFrame storage.
- RouteDecision storage.
- WorkGraph storage.
- RoleArtifact storage.
- RoleHandoff storage.
- ArtifactBundle storage.
- EvidencePacket storage.
- ExecutionContext storage.
- TelemetryTrace storage.
- LedgerRef storage.
- SnapshotRef storage.
- FinalOutput storage.

These domains may reference one another by stable IDs, but references do not imply trust promotion.

## 5. Trust Boundary Rules

Future runtime or persistent storage must obey these exact rules:

- Raw model output starts at T0.
- Raw role artifact output starts at T0.
- Schema-valid role artifact may be T1 only.
- Verified deterministic Hollow evidence may reach T2 through VRP.
- Storage does not increase trust.
- Persistence is not verification.
- Retrieval is not trust promotion.
- Human approval or external authority is required for T4.
- A stored object must carry trust state, not imply it.

Storage may preserve provenance and replay information, but storage never validates, promotes, or authorizes consumption by itself.

## 6. Verified Return Path Relationship

Future storage may store raw, rejected, partial, accepted, or final artifacts.

Only Verified Return Path and explicitly approved gates may decide whether an artifact can be consumed as trusted evidence.

Storage must never become a shortcut around VRP.

Storage may record a VRP result or gate decision by reference, but the stored record is not itself the gate. Caleb must be able to distinguish "this was stored" from "this was verified".

## 7. Role Artifact Storage Rules

Future role artifact storage must preserve at least the following fields or equivalent typed references:

- artifact_id.
- artifact_type.
- schema_version.
- task_id.
- run_id.
- role_id.
- role_version.
- input_refs.
- evidence_refs.
- assumptions.
- contradictions.
- defects.
- open_questions.
- trust_tier.
- validation_status.
- ledger_refs.
- created_at.
- source_kind.

RoleArtifact storage must preserve source artifact identity, schema version, role version, run/task/pass identity, ledger refs, verification state, evidence refs, assumption registers, contradiction registers, defect registers, replayability, and rollback compatibility.

No raw unverified artifact promotion is allowed. Stored artifacts remain untrusted unless the relevant validation and trust gates say otherwise.

## 8. Execution Context Storage Rules

Future execution context storage must preserve at least the following fields or equivalent typed references:

- task_id.
- run_id.
- route_mode.
- active_pass.
- active_role.
- work_graph_ref.
- accepted_evidence_refs.
- rejected_artifact_refs.
- contradiction_register_ref.
- defect_register_ref.
- ledger_refs.
- snapshot_refs.
- final_output_ref.
- status.

ExecutionContext storage must remain a replay and provenance surface. It must not smuggle raw Hollow output, model output, or role artifacts into trusted state.

## 9. Storage Non-Goals For This Phase

Storage non-goals for this phase:

- no SQLite.
- no Postgres.
- no cloud persistence.
- no model API transcript store.
- no vector database.
- no semantic memory.
- no UI trace database.
- no full role runtime.
- no provider SDK persistence.
- no Hollowcut render/export storage.

This pass also does not add provider SDKs, runtime role execution, live model adapter persistence, model provider invocation history, full role rotation runtime memory, database-backed storage, cloud storage, UI trace storage, or Hollowcut export runtime storage.

## 10. Future Implementation Sequence

Recommended future implementation sequence:

1. Runtime/Storage Planning Boundary.
2. Runtime storage type contracts.
3. In-memory artifact store prototype.
4. Mocked single_pass model adapter.
5. Ledgered model invocation record.
6. Persistent artifact store.
7. Full role rotation runtime.
8. UI/Thinking Mode trace display.

The next implementation pass should choose either runtime storage type contracts or a mocked single_pass model boundary. Live model integration remains out of scope until storage, trust, and replay boundaries are explicit.

## 11. Acceptance Verdict

Runtime/Storage Planning Boundary: Accepted
Status: Planning boundary locked; no runtime storage implemented
Next phase: Runtime storage type contracts or mocked single_pass model boundary

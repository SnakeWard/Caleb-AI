import type { ISODateTimeString, Sha256Digest } from "../../types/common.js";
import type { RoleHandoffGateStatus } from "../../roles/roleHandoffGate.js";
import type { RoleId } from "../../roles/types/roleArtifact.js";
import type { ContentAddressedRawOutputStore } from "../../rawOutput/contentAddressedRawOutputStore.js";
import type { RoleRuntimeAdapter, RoleRuntimeContextRef } from "./roleRuntimeAdapter.js";
import type { RotationPlanAdapterKind, StaticRotationPlan } from "./staticRotationPlan.js";

export type RoleRuntimeExecutionStatus = "completed" | "halted" | "failed";

export type RoleRuntimeFailureCode =
  | "invalid_rotation_plan"
  | "model_authored_plan_rejected"
  | "adapter_not_found"
  | "adapter_invocation_failed"
  | "raw_storage_failed"
  | "artifact_validation_failed"
  | "artifact_lineage_invalid"
  | "handoff_gate_blocked"
  | "handoff_gate_invalid"
  | "context_assembly_failed"
  | "ledger_record_write_failed"
  | "max_invocations_reached";

export interface RoleRuntimeInvocationRecord {
  readonly record_id: string;
  readonly plan_id: string;
  readonly task_id: string;
  readonly run_id: string;
  readonly trace_id: string;
  readonly context_id: string;
  readonly step_index: number;
  readonly role_id: RoleId;
  readonly adapter_id: string;
  readonly adapter_kind: RotationPlanAdapterKind;
  readonly artifact_digest: Sha256Digest;
  readonly artifact_id: string;
  readonly derived_from?: readonly Sha256Digest[];
  readonly context_refs: readonly RoleRuntimeContextRef[];
  readonly validation_status: "schema_valid" | "raw_rejected";
  readonly trust_tier: "T1";
  readonly handoff_gate_status: RoleHandoffGateStatus | null;
  readonly failure_code: RoleRuntimeFailureCode | null;
  readonly created_at: ISODateTimeString;
}

export interface RoleRuntimeExecutionResult {
  readonly ok: boolean;
  readonly status: RoleRuntimeExecutionStatus;
  readonly plan_id: string;
  readonly completed_steps: number;
  readonly failed_step_index: number | null;
  readonly failure_code: RoleRuntimeFailureCode | null;
  readonly records: readonly RoleRuntimeInvocationRecord[];
}

export interface RoleRuntimeExecutorInput {
  readonly plan: unknown;
  readonly adapters: ReadonlyMap<string, RoleRuntimeAdapter>;
  readonly store: ContentAddressedRawOutputStore;
  readonly now?: () => ISODateTimeString;
  readonly appendRecord?: (record: RoleRuntimeInvocationRecord) => boolean | Promise<boolean>;
}

export interface ReconstructedRotationStep {
  readonly step_index: number;
  readonly role_id: RoleId;
  readonly adapter_id: string;
  readonly artifact_digest: Sha256Digest;
  readonly derived_from?: readonly Sha256Digest[];
  readonly context_refs: readonly RoleRuntimeContextRef[];
}

export interface ReconstructedRotationChain {
  readonly plan_id: string;
  readonly task_id: string;
  readonly run_id: string;
  readonly trace_id: string;
  readonly context_id: string;
  readonly steps: readonly ReconstructedRotationStep[];
  readonly final_status: RoleRuntimeExecutionStatus;
}

export type ValidatedRotationPlan = StaticRotationPlan;

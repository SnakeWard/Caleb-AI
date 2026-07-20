import type { ISODateTimeString, Sha256Digest } from "../../types/common.js";
import type {
  RoleHandoffGateErrorCode,
  RoleHandoffGateStatus
} from "../../roles/roleHandoffGate.js";
import type { RoleId } from "../../roles/types/roleArtifact.js";
import type { ContentAddressedRawOutputStore } from "../../rawOutput/contentAddressedRawOutputStore.js";
import type {
  RoleRuntimeAdapter,
  RoleRuntimeAdapterFailureBudget,
  RoleRuntimeAdapterFailureStage,
  RoleRuntimeAdapterFailureTaxonomy,
  RoleRuntimeAdapterStopReason,
  RoleRuntimeContextRef
} from "./roleRuntimeAdapter.js";
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

export interface RoleRuntimeGateRefusalIssue {
  readonly check_index: number | null;
  readonly code: RoleHandoffGateErrorCode;
  readonly path: string;
  readonly expected: readonly string[] | null;
  readonly actual: string | null;
  readonly transition: {
    readonly source_role: RoleId;
    readonly target_role: RoleId;
  };
}

export interface RoleRuntimeGateEvaluationRefusedRecord {
  readonly record_type: "gate_evaluation_refused";
  readonly record_id: string;
  readonly plan_id: string;
  readonly task_id: string;
  readonly run_id: string;
  readonly trace_id: string;
  readonly context_id: string;
  readonly step_index: number;
  readonly source_role: RoleId;
  readonly target_role: RoleId;
  readonly adapter_id: string;
  readonly adapter_kind: RotationPlanAdapterKind;
  readonly stage: "handoff_gate";
  readonly terminal_status: "handoff_gate_blocked" | "handoff_gate_invalid";
  readonly artifact_digest: Sha256Digest;
  readonly artifact_id: string;
  readonly derived_from?: readonly Sha256Digest[];
  readonly validation_status: "schema_valid";
  readonly trust_tier: "T1";
  readonly issues: readonly RoleRuntimeGateRefusalIssue[];
  readonly created_at: ISODateTimeString;
}

export interface RoleRuntimeInvocationFailedRecord {
  readonly record_type: "role_invocation_failed";
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
  readonly stage: RoleRuntimeAdapterFailureStage | null;
  readonly taxonomy: RoleRuntimeAdapterFailureTaxonomy | null;
  readonly error_name: string | null;
  readonly input_tokens: number | null;
  readonly output_tokens: number | null;
  readonly total_tokens: number | null;
  readonly stop_reason: RoleRuntimeAdapterStopReason | null;
  readonly budget: RoleRuntimeAdapterFailureBudget | null;
  readonly t0_digest: Sha256Digest | null;
  readonly observer_normalization_stage: "markdown_fence_unwrapped" | null;
  readonly trust_tier: "T0";
  readonly created_at: ISODateTimeString;
}

export type RoleRuntimeFailedStepRecord =
  | RoleRuntimeGateEvaluationRefusedRecord
  | RoleRuntimeInvocationFailedRecord;

export type RoleRuntimeLedgerRecord =
  | RoleRuntimeInvocationRecord
  | RoleRuntimeGateEvaluationRefusedRecord
  | RoleRuntimeInvocationFailedRecord;

export interface RoleRuntimeExecutionResult {
  readonly ok: boolean;
  readonly status: RoleRuntimeExecutionStatus;
  readonly plan_id: string;
  readonly completed_steps: number;
  readonly failed_step_index: number | null;
  readonly failure_code: RoleRuntimeFailureCode | null;
  readonly records: readonly RoleRuntimeInvocationRecord[];
  readonly failed_step_record: RoleRuntimeFailedStepRecord | null;
}

export interface RoleRuntimeExecutorInput {
  readonly plan: unknown;
  readonly adapters: ReadonlyMap<string, RoleRuntimeAdapter>;
  readonly store: ContentAddressedRawOutputStore;
  readonly now?: () => ISODateTimeString;
  readonly appendRecord?: (record: RoleRuntimeLedgerRecord) => boolean | Promise<boolean>;
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

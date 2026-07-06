import type { Sha256Digest } from "../../types/common.js";
import type { RoleId } from "../../roles/types/roleArtifact.js";
import type { RotationPlanAdapterKind } from "./staticRotationPlan.js";

export interface RoleRuntimeContextRef {
  readonly digest: Sha256Digest;
  readonly step_index: number;
}

export interface RoleRuntimeAdapterInvokeInput {
  readonly plan_id: string;
  readonly task_id: string;
  readonly run_id: string;
  readonly trace_id: string;
  readonly context_id: string;
  readonly step_index: number;
  readonly role_id: RoleId;
  readonly adapter_id: string;
  readonly adapter_kind: RotationPlanAdapterKind;
  readonly context_text: string;
  readonly context_refs: readonly RoleRuntimeContextRef[];
}

export type RoleRuntimeAdapterFailureCode =
  | "adapter_invocation_failed"
  | "adapter_missing_artifact"
  | "adapter_rejected";

export interface RoleRuntimeAdapterInvokeResult {
  readonly ok: boolean;
  readonly status: "completed" | "failed";
  readonly artifact: unknown;
  readonly failure_code?: RoleRuntimeAdapterFailureCode;
}

export interface RoleRuntimeAdapter {
  readonly adapter_id: string;
  readonly adapter_kind: "mock";
  invoke(input: RoleRuntimeAdapterInvokeInput): Promise<RoleRuntimeAdapterInvokeResult>;
}
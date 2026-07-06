import type { ISODateTimeString } from "../../types/common.js";
import type { RoleId } from "../../roles/types/roleArtifact.js";

export const ROTATION_PLAN_SCHEMA_VERSION = "ra-r1.0.0" as const;

export type RotationPlanSchemaVersion = typeof ROTATION_PLAN_SCHEMA_VERSION;

export type RotationPlanAuthoredBy = "human" | "fixture";

export type RotationPlanAdapterKind = "mock" | "live";

export interface RotationPlanStep {
  readonly step_index: number;
  readonly role_id: RoleId;
  readonly adapter_id: string;
  readonly adapter_kind: RotationPlanAdapterKind;
}

export interface RotationStopConditions {
  readonly max_invocations: number;
  readonly halt_on_first_failure: true;
}

export interface StaticRotationPlan {
  readonly schema_version: RotationPlanSchemaVersion;
  readonly plan_id: string;
  readonly task_id: string;
  readonly run_id: string;
  readonly trace_id: string;
  readonly context_id: string;
  readonly authored_by: RotationPlanAuthoredBy;
  readonly sequence: readonly RotationPlanStep[];
  readonly stop_conditions: RotationStopConditions;
  readonly created_at: ISODateTimeString;
}
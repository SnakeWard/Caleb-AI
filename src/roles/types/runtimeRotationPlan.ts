import type { ISODateTimeString } from "../../types/common.js";
import type { RoleArtifactValidationError, RoleArtifactValidationResult } from "./roleArtifact.js";

export const RUNTIME_ROTATION_PLAN_SCHEMA_VERSION = "1.0.0" as const;

export type RuntimeRotationPlanSchemaVersion = typeof RUNTIME_ROTATION_PLAN_SCHEMA_VERSION;

export type RuntimeRotationPlanAuthoredBy =
  | "orchestration_core"
  | "logic_engine"
  | "human"
  | "fixture";

export const VALID_RUNTIME_ROTATION_PLAN_AUTHORS: readonly RuntimeRotationPlanAuthoredBy[] = [
  "orchestration_core",
  "logic_engine",
  "human",
  "fixture"
] as const;

export type RuntimeRotationRouteMode =
  | "planner_critic"
  | "planner_critic_synthesizer"
  | "planner_synthesizer"
  | "planner_analyst_synthesizer"
  | "planner_analyst_critic"
  | "full_rotation";

export const VALID_RUNTIME_ROTATION_ROUTE_MODES: readonly RuntimeRotationRouteMode[] = [
  "planner_critic",
  "planner_critic_synthesizer",
  "planner_synthesizer",
  "planner_analyst_synthesizer",
  "planner_analyst_critic",
  "full_rotation"
] as const;

export type RuntimeRotationPlanRole = "planner" | "analyst" | "critic" | "synthesizer";

export const VALID_RUNTIME_ROTATION_PLAN_ROLES: readonly RuntimeRotationPlanRole[] = [
  "planner",
  "analyst",
  "critic",
  "synthesizer"
] as const;

export type RuntimeRotationPlanGate =
  | "role_handoff_gate"
  | "approval_gate"
  | "snapshot_gate"
  | "final_verification_gate";

export const VALID_RUNTIME_ROTATION_PLAN_GATES: readonly RuntimeRotationPlanGate[] = [
  "role_handoff_gate",
  "approval_gate",
  "snapshot_gate",
  "final_verification_gate"
] as const;

export const MANDATORY_RUNTIME_ROTATION_PLAN_GATES: readonly RuntimeRotationPlanGate[] = [
  "role_handoff_gate",
  "final_verification_gate"
] as const;

export type RuntimeRotationSideEffectPolicy = "none" | "requires_approval";

export type RuntimeRotationCodeMutationPolicy = "none" | "requires_snapshot";

export type RuntimeRotationLedgerPolicy = "record_all_passes";

export const VALID_RUNTIME_ROTATION_LEDGER_POLICIES: readonly RuntimeRotationLedgerPolicy[] = [
  "record_all_passes"
] as const;

export interface RuntimeRotationPlan {
  readonly runtime_rotation_plan_id: string;
  readonly schema_version: RuntimeRotationPlanSchemaVersion;
  readonly task_id: string;
  readonly run_id: string;
  readonly authored_by: RuntimeRotationPlanAuthoredBy;
  readonly route_mode: RuntimeRotationRouteMode;
  readonly roles_required: readonly RuntimeRotationPlanRole[];
  readonly hollows_required: readonly string[];
  readonly gates_required: readonly RuntimeRotationPlanGate[];
  readonly max_cycles: number;
  readonly stop_criteria: readonly string[];
  readonly side_effect_policy: RuntimeRotationSideEffectPolicy;
  readonly code_mutation_policy: RuntimeRotationCodeMutationPolicy;
  readonly snapshot_requirement: boolean;
  readonly ledger_policy: RuntimeRotationLedgerPolicy;
  readonly created_at: ISODateTimeString;
}

export type RuntimeRotationPlanValidationError = RoleArtifactValidationError;
export type RuntimeRotationPlanValidationResult = RoleArtifactValidationResult;

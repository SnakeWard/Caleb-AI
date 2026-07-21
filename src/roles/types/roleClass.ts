/**
 * Role class and authority declarations (RA-X-1).
 * Uniform on every RegisteredRoleContract — structural shape shared across roles.
 */

export type RoleClass =
  | "reasoning"
  | "implementation"
  | "verification"
  | "synthesis"
  | "reporting"
  | "recovery"
  | "human";

export type RoleExecutionAuthority = "none" | "request_only";

/** Declared input kinds a role may consume as contract (not L1 route kinds). */
export type RolePermittedInputKind =
  | "planner_plan"
  | "contract_validated_task_frame"
  | "role_artifact"
  | "human_decision"
  | "recovery_plan"
  | "implementation_notes"
  | "verification"
  | "critique"
  | "synthesis"
  | "report"
  | "analysis";

export const ROLE_CLASS_VALUES: readonly RoleClass[] = [
  "reasoning",
  "implementation",
  "verification",
  "synthesis",
  "reporting",
  "recovery",
  "human"
] as const;

export const ROLE_EXECUTION_AUTHORITY_VALUES: readonly RoleExecutionAuthority[] = [
  "none",
  "request_only"
] as const;

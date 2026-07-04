import type { ISODateTimeString } from "../../types/common.js";
import type {
  RoleAcceptanceStatus,
  RoleArtifactSchemaVersion,
  RoleArtifactType,
  RoleId
} from "./roleArtifact.js";
import type { RoleArtifactReferenceBundleStatus } from "./roleArtifactBundle.js";
import type { RoleHandoffGateStatus } from "../roleHandoffGate.js";

export type RoleArtifactBundleConsistencyReportStatus =
  | "clean"
  | "warning"
  | "blocked"
  | "invalid";

export type RoleArtifactBundleValidationStatus =
  | "valid"
  | "invalid"
  | "not_evaluated";

export type RoleArtifactBundleConsistencyCheckStatus =
  | "pass"
  | "warn"
  | "fail"
  | "not_applicable";

export type RoleArtifactBundleFindingSeverity =
  | "info"
  | "warning"
  | "error"
  | "critical";

export const VALID_ROLE_ARTIFACT_BUNDLE_CONSISTENCY_REPORT_STATUSES: readonly RoleArtifactBundleConsistencyReportStatus[] = [
  "clean",
  "warning",
  "blocked",
  "invalid"
] as const;

export const VALID_ROLE_ARTIFACT_BUNDLE_VALIDATION_STATUSES: readonly RoleArtifactBundleValidationStatus[] = [
  "valid",
  "invalid",
  "not_evaluated"
] as const;

export const VALID_ROLE_ARTIFACT_BUNDLE_CONSISTENCY_CHECK_STATUSES: readonly RoleArtifactBundleConsistencyCheckStatus[] = [
  "pass",
  "warn",
  "fail",
  "not_applicable"
] as const;

export const VALID_ROLE_ARTIFACT_BUNDLE_FINDING_SEVERITIES: readonly RoleArtifactBundleFindingSeverity[] = [
  "info",
  "warning",
  "error",
  "critical"
] as const;

export interface RoleArtifactBundleArtifactRefSummary {
  readonly total_artifact_refs: number;
  readonly by_role: readonly {
    readonly role_id: RoleId;
    readonly count: number;
  }[];
  readonly by_artifact_type: readonly {
    readonly artifact_type: RoleArtifactType;
    readonly count: number;
  }[];
  readonly by_acceptance_status: readonly {
    readonly acceptance_status: RoleAcceptanceStatus;
    readonly count: number;
  }[];
}

export interface RoleArtifactBundleHandoffGateSummary {
  readonly total_handoff_gate_refs: number;
  readonly allowed_count: number;
  readonly blocked_count: number;
  readonly invalid_count: number;
  readonly by_status: readonly {
    readonly status: RoleHandoffGateStatus;
    readonly count: number;
  }[];
}

export interface RoleArtifactBundleConsistencyCheck {
  readonly check_id: string;
  readonly status: RoleArtifactBundleConsistencyCheckStatus;
  readonly summary: string;
  readonly related_artifact_ids?: readonly string[];
  readonly related_roles?: readonly RoleId[];
  readonly related_handoff_refs?: readonly string[];
}

export interface RoleArtifactBundleFinding {
  readonly finding_id: string;
  readonly severity: RoleArtifactBundleFindingSeverity;
  readonly code: string;
  readonly summary: string;
  readonly related_artifact_ids?: readonly string[];
  readonly related_roles?: readonly RoleId[];
}

export interface RoleArtifactBundleConsistencyReport {
  readonly schema_version: RoleArtifactSchemaVersion;
  readonly report_id: string;
  readonly bundle_id: string;
  readonly task_id: string;
  readonly run_id: string;
  readonly trace_id: string;
  readonly context_id: string;
  readonly report_status: RoleArtifactBundleConsistencyReportStatus;
  readonly bundle_status: RoleArtifactReferenceBundleStatus;
  readonly validation_status: RoleArtifactBundleValidationStatus;
  readonly artifact_ref_summary: RoleArtifactBundleArtifactRefSummary;
  readonly handoff_gate_summary: RoleArtifactBundleHandoffGateSummary;
  readonly consistency_checks: readonly RoleArtifactBundleConsistencyCheck[];
  readonly findings: readonly RoleArtifactBundleFinding[];
  readonly warnings?: readonly string[];
  readonly created_at: ISODateTimeString;
}

import { createArtifactId } from "../ledger/idFactory.js";
import { validateRoleArtifact } from "../roles/roleArtifactValidator.js";
import {
  ROLE_ARTIFACT_SCHEMA_VERSION,
  type RoleArtifact,
  type RoleArtifactType,
  type RoleId
} from "../roles/types/roleArtifact.js";
import type { LiveRoleSemanticPayload } from "../roles/types/liveRoleSemanticPayload.js";
import type { RoleRuntimeAdapterInvokeInput } from "../roleRuntime/types/roleRuntimeAdapter.js";

export type LiveRoleArtifactFailureStage =
  | "output_truncated"
  | "json_parse"
  | "payload_validation"
  | "envelope_validation"
  | "identity_mismatch";

export interface LiveRoleArtifactSafeIssue {
  readonly code: string;
  readonly path: string;
}

export interface LiveRoleArtifactFailureDetail {
  readonly stage: LiveRoleArtifactFailureStage;
  readonly issues: readonly LiveRoleArtifactSafeIssue[];
}

export interface BuildLiveRoleArtifactInput {
  readonly payload: LiveRoleSemanticPayload;
  readonly invocation: RoleRuntimeAdapterInvokeInput;
  readonly created_at: string;
  readonly artifact_id_factory?: () => string;
}

export function buildLiveRoleArtifact(input: BuildLiveRoleArtifactInput): RoleArtifact {
  const artifactType: RoleArtifactType = input.invocation.role_id === "planner" ? "plan" : "critique";
  const requiredNextRole: RoleId | null = expectedNextRole(input.invocation.role_id);
  return {
    schema_version: ROLE_ARTIFACT_SCHEMA_VERSION,
    artifact_id: input.artifact_id_factory?.() ?? createArtifactId(),
    artifact_type: artifactType,
    role_id: input.invocation.role_id,
    task_id: input.invocation.task_id,
    run_id: input.invocation.run_id,
    trace_id: input.invocation.trace_id,
    context_id: input.invocation.context_id,
    summary: input.payload.summary,
    claims: input.payload.claims.map((claim) => ({
      claim_id: claim.claim_id,
      text: claim.text,
      evidence_ref_ids: [...claim.evidence_ref_ids]
    })),
    assumptions: [...input.payload.assumptions],
    constraints: [...input.payload.constraints],
    open_questions: [...input.payload.open_questions],
    recommendations: [...input.payload.recommendations],
    evidence_refs: input.payload.evidence_refs.map((ref) => ({ ...ref })),
    confidence: input.payload.confidence,
    handoff_notes: [...input.payload.handoff_notes],
    required_next_role: requiredNextRole,
    acceptance_status: input.payload.acceptance_status,
    created_at: input.created_at,
    telemetry_trace_ref: {
      trace_id: input.invocation.trace_id,
      context_id: input.invocation.context_id
    },
    execution_context_ref: {
      context_id: input.invocation.context_id
    }
  };
}

export function validateLiveRoleArtifactEnvelope(
  artifact: unknown,
  invocation: RoleRuntimeAdapterInvokeInput
): { readonly ok: true; readonly artifact: RoleArtifact } | {
  readonly ok: false;
  readonly detail: LiveRoleArtifactFailureDetail;
} {
  const structural = validateRoleArtifact(artifact);
  if (!structural.ok) {
    return {
      ok: false,
      detail: {
        stage: "envelope_validation",
        issues: structural.errors.map(({ code, path }) => ({ code, path }))
      }
    };
  }
  const record = artifact as unknown as Record<string, unknown>;
  const expectedType: RoleArtifactType = invocation.role_id === "planner" ? "plan" : "critique";
  const expectedRole = expectedNextRole(invocation.role_id);
  const comparisons: readonly [string, unknown, unknown][] = [
    ["role_id", record["role_id"], invocation.role_id],
    ["artifact_type", record["artifact_type"], expectedType],
    ["task_id", record["task_id"], invocation.task_id],
    ["run_id", record["run_id"], invocation.run_id],
    ["trace_id", record["trace_id"], invocation.trace_id],
    ["context_id", record["context_id"], invocation.context_id],
    ["required_next_role", record["required_next_role"], expectedRole]
  ];
  const issues = comparisons
    .filter(([, actual, expected]) => actual !== expected)
    .map(([field]) => ({ code: "invocation_identity_mismatch", path: `$.${field}` }));
  if (issues.length > 0) {
    return {
      ok: false,
      detail: { stage: "identity_mismatch", issues }
    };
  }
  return { ok: true, artifact: artifact as RoleArtifact };
}

export function expectedNextRole(roleId: RoleId): RoleId | null {
  return roleId === "planner" ? "critic" : null;
}

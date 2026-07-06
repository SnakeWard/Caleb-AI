import type { RoleId } from "../roles/types/roleArtifact.js";
import { ROLE_ARTIFACT_SCHEMA_VERSION } from "../roles/types/roleArtifact.js";
import type {
  RoleRuntimeAdapter,
  RoleRuntimeAdapterInvokeInput,
  RoleRuntimeAdapterInvokeResult
} from "./types/roleRuntimeAdapter.js";

export interface MockRoleRuntimeAdapterOptions {
  readonly adapter_id: string;
  readonly role_id: RoleId;
  readonly artifact_type: "plan" | "critique" | "implementation_notes" | "verification" | "synthesis" | "report";
  readonly artifact_id_prefix?: string;
  readonly fixed_artifact?: Record<string, unknown>;
  readonly should_fail?: boolean;
  readonly failure_code?: RoleRuntimeAdapterInvokeResult["failure_code"];
}

export function createMockRoleRuntimeAdapter(options: MockRoleRuntimeAdapterOptions): RoleRuntimeAdapter {
  return {
    adapter_id: options.adapter_id,
    adapter_kind: "mock",
    async invoke(input: RoleRuntimeAdapterInvokeInput): Promise<RoleRuntimeAdapterInvokeResult> {
      if (options.should_fail === true) {
        return {
          ok: false,
          status: "failed",
          artifact: null,
          failure_code: options.failure_code ?? "adapter_invocation_failed"
        };
      }

      const artifact = options.fixed_artifact ?? buildDefaultArtifact(input, options);
      return {
        ok: true,
        status: "completed",
        artifact
      };
    }
  };
}

function buildDefaultArtifact(
  input: RoleRuntimeAdapterInvokeInput,
  options: MockRoleRuntimeAdapterOptions
): Record<string, unknown> {
  const prefix = options.artifact_id_prefix ?? input.role_id;
  return {
    schema_version: ROLE_ARTIFACT_SCHEMA_VERSION,
    artifact_id: `${prefix}_artifact_${input.step_index}`,
    artifact_type: options.artifact_type,
    role_id: input.role_id,
    task_id: input.task_id,
    run_id: input.run_id,
    trace_id: input.trace_id,
    context_id: input.context_id,
    summary: `Mock ${input.role_id} artifact for step ${input.step_index}.`,
    claims: [],
    assumptions: [],
    constraints: [],
    open_questions: [],
    recommendations: [],
    evidence_refs: [],
    confidence: 0.5,
    handoff_notes: [],
    required_next_role: null,
    acceptance_status: "accepted",
    created_at: "2026-07-06T00:00:00.000Z"
  };
}
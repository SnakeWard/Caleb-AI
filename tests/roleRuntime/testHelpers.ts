import { mkdtemp } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { ContentAddressedRawOutputStore } from "../../src/rawOutput/contentAddressedRawOutputStore.js";
import { createMockRoleRuntimeAdapter } from "../../src/roleRuntime/mockRoleRuntimeAdapter.js";
import type { RoleRuntimeAdapter } from "../../src/roleRuntime/types/roleRuntimeAdapter.js";
import type { StaticRotationPlan } from "../../src/roleRuntime/types/staticRotationPlan.js";

export async function createIsolatedRawOutputStore(): Promise<ContentAddressedRawOutputStore> {
  const dir = await mkdtemp(join(tmpdir(), "role-runtime-store-"));
  return new ContentAddressedRawOutputStore({ root_dir: dir });
}

export function goldenPlannerCriticPlan(overrides: Partial<StaticRotationPlan> = {}): StaticRotationPlan {
  return {
    schema_version: "ra-r1.0.0",
    plan_id: "fixture_plan_planner_critic_001",
    authored_by: "fixture",
    task_id: "task_ra_r1_golden_001",
    run_id: "run_ra_r1_golden_001",
    trace_id: "trace_ra_r1_golden_001",
    context_id: "context_ra_r1_golden_001",
    sequence: [
      {
        step_index: 0,
        role_id: "planner",
        adapter_id: "mock.role_runtime.planner",
        adapter_kind: "mock"
      },
      {
        step_index: 1,
        role_id: "critic",
        adapter_id: "mock.role_runtime.critic",
        adapter_kind: "mock"
      }
    ],
    stop_conditions: {
      max_invocations: 2,
      halt_on_first_failure: true
    },
    created_at: "2026-07-06T00:00:00.000Z",
    ...overrides
  };
}

export function singleStepGoldenPlan(overrides: Partial<StaticRotationPlan> = {}): StaticRotationPlan {
  const base = goldenPlannerCriticPlan(overrides);
  return {
    ...base,
    sequence: [base.sequence[0]!],
    stop_conditions: { max_invocations: 1, halt_on_first_failure: true }
  };
}

export function goldenPlannerCriticAdapters(
  plannerArtifact?: Record<string, unknown>,
  criticArtifact?: Record<string, unknown>
): Map<string, RoleRuntimeAdapter> {
  return new Map<string, RoleRuntimeAdapter>([
    [
      "mock.role_runtime.planner",
      createMockRoleRuntimeAdapter({
        adapter_id: "mock.role_runtime.planner",
        role_id: "planner",
        artifact_type: "plan",
        ...(plannerArtifact === undefined ? {} : { fixed_artifact: plannerArtifact })
      })
    ],
    [
      "mock.role_runtime.critic",
      createMockRoleRuntimeAdapter({
        adapter_id: "mock.role_runtime.critic",
        role_id: "critic",
        artifact_type: "critique",
        ...(criticArtifact === undefined ? {} : { fixed_artifact: criticArtifact })
      })
    ]
  ]);
}
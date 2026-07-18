import { readFile } from "node:fs/promises";

import { bridgeRuntimeRotationPlan, type BridgedExecutablePlan } from "../../src/logicEngine/rotationPlanBridge.js";
import type { ContractValidatedTaskFrameRouteInput } from "../../src/logicEngine/types/routeInput.js";
import { createMockRoleRuntimeAdapter } from "../../src/roleRuntime/mockRoleRuntimeAdapter.js";
import type { RoleRuntimeAdapter } from "../../src/roleRuntime/types/roleRuntimeAdapter.js";
import type { RuntimeRotationPlanRole } from "../../src/roles/types/runtimeRotationPlan.js";
import type { LedgerEntry } from "../../src/types/ledger.js";

export const LE3_NOW = "2026-07-18T21:00:00.000Z";

export interface BridgedPlannerCriticFixture {
  readonly source_plan: Record<string, unknown>;
  readonly plan: BridgedExecutablePlan;
  readonly bridge_entry: LedgerEntry;
}

export async function createBridgedPlannerCriticFixture(): Promise<BridgedPlannerCriticFixture> {
  const sourcePlan = JSON.parse(
    await readFile("examples/roles/runtime-rotation-plan.valid.planner-critic.json", "utf8")
  ) as Record<string, unknown>;
  const bridgeEntries: LedgerEntry[] = [];
  const result = await bridgeRuntimeRotationPlan({
    carrier: carrier(sourcePlan),
    runtime_rotation_plan: sourcePlan,
    adapter_bindings: (sourcePlan["roles_required"] as string[]).map((role) => ({
      role_id: role as RuntimeRotationPlanRole,
      adapter_id: `mock.role_runtime.${role}`,
      adapter_kind: "mock" as const
    })),
    append_ledger_entry: (entry) => {
      bridgeEntries.push(entry);
      return true;
    },
    decided_at: LE3_NOW,
    ledger_id: "bridge_123e4567-e89b-12d3-a456-426614174400"
  });
  if (!result.ok || bridgeEntries[0] === undefined) {
    throw new Error("LE-3 test fixture could not derive a bridged planner_critic plan.");
  }
  return {
    source_plan: sourcePlan,
    plan: result.derived_plan,
    bridge_entry: bridgeEntries[0]
  };
}

export function createPlannerCriticExecutionAdapters(options: {
  readonly planner_artifact?: Record<string, unknown>;
  readonly critic_artifact?: Record<string, unknown>;
  readonly critic_should_fail?: boolean;
  readonly invocation_counter?: { count: number };
} = {}): Map<string, RoleRuntimeAdapter> {
  const planner = createMockRoleRuntimeAdapter({
    adapter_id: "mock.role_runtime.planner",
    role_id: "planner",
    artifact_type: "plan",
    ...(options.planner_artifact === undefined ? {} : { fixed_artifact: options.planner_artifact })
  });
  const critic = createMockRoleRuntimeAdapter({
    adapter_id: "mock.role_runtime.critic",
    role_id: "critic",
    artifact_type: "critique",
    ...(options.critic_artifact === undefined ? {} : { fixed_artifact: options.critic_artifact }),
    ...(options.critic_should_fail === true ? { should_fail: true } : {})
  });
  return new Map<string, RoleRuntimeAdapter>([
    [planner.adapter_id, countInvocations(planner, options.invocation_counter)],
    [critic.adapter_id, countInvocations(critic, options.invocation_counter)]
  ]);
}

export function forgeBridgeEntryForPlan(
  original: LedgerEntry,
  plan: BridgedExecutablePlan,
  digest: string
): LedgerEntry {
  const result = original.result as Record<string, unknown>;
  return {
    ...original,
    result: {
      ...result,
      derived_plan_digest: digest,
      source_plan_ref: plan.source_runtime_rotation_plan_id
    },
    artifact_hashes: [{ artifact_id: plan.plan_id, hash: digest, algorithm: "sha256" }],
    artifact_refs: [plan.plan_id]
  };
}

function carrier(plan: Record<string, unknown>): ContractValidatedTaskFrameRouteInput {
  return {
    record_kind: "contract_validated_task_frame",
    record_id: "route_input.le3_fixture",
    source: "logic_engine",
    validated_at: LE3_NOW,
    lineage_refs: [plan["runtime_rotation_plan_id"] as string],
    task_frame: {
      task_id: plan["task_id"] as string,
      run_id: plan["run_id"] as string,
      trace_id: "trace_le3_fixture",
      task_type: "planning",
      description: "LE-3 guarded execution fixture",
      input_summary: "bounded planner critic plan",
      requested_by: "le3_test",
      requires_code_mutation: false,
      created_at: LE3_NOW
    },
    validation: { validator: "validateTaskFrameInput", valid: true }
  };
}

function countInvocations(
  adapter: RoleRuntimeAdapter,
  counter: { count: number } | undefined
): RoleRuntimeAdapter {
  if (counter === undefined) {
    return adapter;
  }
  return {
    ...adapter,
    async invoke(input) {
      counter.count += 1;
      return adapter.invoke(input);
    }
  };
}

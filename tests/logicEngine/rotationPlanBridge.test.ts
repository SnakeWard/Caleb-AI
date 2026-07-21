import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { validateLedgerEntry } from "../../src/ledger/ledgerValidation.js";
import {
  bridgeRuntimeRotationPlan,
  createBridgedExecutorHandoff,
  type BridgedExecutablePlan,
  type RotationPlanBridgeAdapterBinding,
  type RotationPlanBridgeInput
} from "../../src/logicEngine/rotationPlanBridge.js";
import type { ContractValidatedTaskFrameRouteInput } from "../../src/logicEngine/types/routeInput.js";
import type { RuntimeRotationPlanRole } from "../../src/roles/types/runtimeRotationPlan.js";
import type { BridgeExecutionRecordAppender } from "../../src/logicEngine/rotationPlanBridge.js";
import type { LedgerEntry } from "../../src/types/ledger.js";

const NOW = "2026-07-18T12:00:00.000Z";

async function fixture(path: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(path, "utf8")) as Record<string, unknown>;
}

function carrier(
  plan: Record<string, unknown>,
  overrides: Partial<ContractValidatedTaskFrameRouteInput> = {}
): ContractValidatedTaskFrameRouteInput {
  const planId = plan["runtime_rotation_plan_id"] as string;
  return {
    record_kind: "contract_validated_task_frame",
    record_id: "route_input.le2_carrier",
    source: "logic_engine",
    validated_at: NOW,
    lineage_refs: [planId],
    task_frame: {
      task_id: plan["task_id"] as string,
      run_id: plan["run_id"] as string,
      trace_id: "trace_le2_carrier",
      task_type: "planning",
      description: "LE-2 deterministic bridge carrier",
      input_summary: "bounded RA-R2 plan",
      requested_by: "le2_test",
      requires_code_mutation: false,
      created_at: NOW
    },
    validation: { validator: "validateTaskFrameInput", valid: true },
    ...overrides
  };
}

function bindings(
  roles: readonly string[],
  kind: "mock" | "live" = "mock"
): RotationPlanBridgeAdapterBinding[] {
  return roles.map((role) => ({
    role_id: role as RuntimeRotationPlanRole,
    adapter_id: `${kind}.role_runtime.${role}`,
    adapter_kind: kind
  }));
}

async function invoke(
  plan: Record<string, unknown>,
  overrides: Partial<RotationPlanBridgeInput> = {}
): Promise<{ result: Awaited<ReturnType<typeof bridgeRuntimeRotationPlan>>; entries: LedgerEntry[] }> {
  const entries: LedgerEntry[] = [];
  const result = await bridgeRuntimeRotationPlan({
    carrier: carrier(plan),
    runtime_rotation_plan: plan,
    adapter_bindings: bindings(plan["roles_required"] as string[]),
    append_ledger_entry: (entry) => {
      entries.push(entry);
      return true;
    },
    decided_at: NOW,
    ledger_id: "bridge_123e4567-e89b-12d3-a456-426614174200",
    ...overrides
  });
  return { result, entries };
}

function expectLedgered(
  entries: readonly LedgerEntry[],
  expectedStatus: "completed" | "rejected"
): void {
  expect(entries).toHaveLength(1);
  expect(entries[0]?.status).toBe(expectedStatus);
  expect(entries[0]?.actor_id).toBe("logic_engine.rotation_plan_bridge");
  expect(entries[0]?.trust_tier).toBe("T2");
  expect(entries[0]?.verification_status).toBe("verified");
  expect(validateLedgerEntry(entries[0]).valid).toBe(true);
}

describe("rotationPlanBridge", () => {
  it("derives planner_critic deterministically with exact sequence and mandatory ledger", async () => {
    const plan = await fixture("examples/roles/runtime-rotation-plan.valid.planner-critic.json");
    const first = await invoke(plan);
    const second = await invoke(plan, {
      ledger_id: "bridge_123e4567-e89b-12d3-a456-426614174201"
    });

    expect(first.result.ok).toBe(true);
    expect(second.result.ok).toBe(true);
    if (!first.result.ok || !second.result.ok) {
      return;
    }

    expect(JSON.stringify(first.result.derived_plan)).toBe(JSON.stringify(second.result.derived_plan));
    expect(first.result.derived_plan.sequence.map((step) => step.role_id)).toEqual([
      "planner",
      "critic",
      "planner",
      "critic"
    ]);
    expect(first.result.derived_plan.stop_conditions.max_invocations).toBe(4);
    expect(first.result.derived_plan.plan_id).toMatch(/^plan_[0-9a-f-]{36}$/);
    expect(first.result.derived_plan.trace_id).toMatch(/^trace_[0-9a-f-]{36}$/);
    expect(first.result.derived_plan.context_id).toMatch(/^context_[0-9a-f-]{36}$/);
    expect(first.result.derived_plan.lineage_refs).toEqual([plan["runtime_rotation_plan_id"]]);
    expect(first.result.derived_plan.ledger_mandatory).toBe(true);
    expect(first.result.derived_plan.gate_obligations).toEqual({
      role_handoff_gate: true,
      final_verification_gate: true,
      approval_gate: false,
      snapshot_gate: false
    });
    expectLedgered(first.entries, "completed");
    expectLedgered(second.entries, "completed");
  });

  it("derives planner_critic_synthesizer after verifying both registry transitions", async () => {
    const plan = await fixture(
      "examples/roles/runtime-rotation-plan.valid.planner-critic-synthesizer.json"
    );
    const { result, entries } = await invoke(plan);

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.derived_plan.sequence.map((step) => step.role_id)).toEqual([
      "planner",
      "critic",
      "synthesizer"
    ]);
    expect(result.derived_plan.authored_by).toBe("fixture");
    expectLedgered(entries, "completed");
  });

  it("rejects a second planner_critic_synthesizer cycle at Synthesizer to Planner", async () => {
    const plan = await fixture(
      "examples/roles/runtime-rotation-plan.valid.planner-critic-synthesizer.json"
    );
    plan["max_cycles"] = 2;
    const { result, entries } = await invoke(plan);

    expect(result.ok).toBe(false);
    expect(result.rejection_code).toBe("bridge_rejected_forbidden_transition");
    expectLedgered(entries, "rejected");
  });

  it("rejects valid RA-R2 orchestration authorship that RA-R1 cannot represent", async () => {
    const plan = await fixture("examples/roles/runtime-rotation-plan.valid.planner-critic.json");
    plan["authored_by"] = "orchestration_core";
    const { result, entries } = await invoke(plan);

    expect(result.ok).toBe(false);
    expect(result.rejection_code).toBe("bridge_rejected_authorship");
    expectLedgered(entries, "rejected");
  });

  it("keeps stop_criteria prose inert while preserving it in provenance", async () => {
    const firstPlan = await fixture("examples/roles/runtime-rotation-plan.valid.planner-critic.json");
    const secondPlan = { ...firstPlan, stop_criteria: ["entirely different prose"] };
    const first = await invoke(firstPlan);
    const second = await invoke(secondPlan);

    expect(first.result.ok).toBe(true);
    expect(second.result.ok).toBe(true);
    if (!first.result.ok || !second.result.ok) {
      return;
    }

    const firstDerived = first.result.derived_plan;
    const secondDerived = second.result.derived_plan;
    expect(firstDerived.plan_id).toBe(secondDerived.plan_id);
    expect(firstDerived.trace_id).toBe(secondDerived.trace_id);
    expect(firstDerived.context_id).toBe(secondDerived.context_id);
    expect(firstDerived.structural_digest).toBe(secondDerived.structural_digest);
    expect(firstDerived.sequence).toEqual(secondDerived.sequence);
    expect(firstDerived.stop_conditions).toEqual(secondDerived.stop_conditions);
    expect(firstDerived.source_plan_digest).not.toBe(secondDerived.source_plan_digest);
    expect(firstDerived.bridge_provenance.inert_stop_criteria).not.toEqual(
      secondDerived.bridge_provenance.inert_stop_criteria
    );
  });

  it("ledgers invalid schema rejection", async () => {
    const plan = await fixture("examples/roles/runtime-rotation-plan.valid.planner-critic.json");
    delete plan["schema_version"];
    const { result, entries } = await invoke(plan);
    expect(result.ok).toBe(false);
    expect(result.rejection_code).toBe("bridge_rejected_invalid_schema");
    expectLedgered(entries, "rejected");
  });

  it("ledgers model-authored rejection", async () => {
    const plan = await fixture("examples/roles/runtime-rotation-plan.invalid.model-authored.json");
    const { result, entries } = await invoke(plan);
    expect(result.ok).toBe(false);
    expect(result.rejection_code).toBe("bridge_rejected_authorship");
    expectLedgered(entries, "rejected");
  });

  it("rejects missing carrier lineage as a reference failure", async () => {
    const plan = await fixture("examples/roles/runtime-rotation-plan.valid.planner-critic.json");
    const { result, entries } = await invoke(plan, {
      carrier: carrier(plan, { lineage_refs: [] })
    });
    expect(result.ok).toBe(false);
    expect(result.rejection_code).toBe("bridge_rejected_reference_format");
    expectLedgered(entries, "rejected");
  });

  it("accepts planner_analyst_synthesizer when Analyst transitions are registry-legal (RA-X-2)", async () => {
    const plan = await fixture("examples/roles/runtime-rotation-plan.valid.minimal.json");
    plan["route_mode"] = "planner_analyst_synthesizer";
    plan["roles_required"] = ["planner", "analyst", "synthesizer"];
    plan["max_cycles"] = 1;
    plan["authored_by"] = "human";
    plan["side_effect_policy"] = "none";
    plan["code_mutation_policy"] = "none";
    plan["snapshot_requirement"] = false;
    plan["gates_required"] = ["role_handoff_gate", "final_verification_gate"];
    plan["hollows_required"] = [];
    const { result, entries } = await invoke(plan);
    expect(result.ok).toBe(true);
    expectLedgered(entries, "completed");
  });

  it("rejects planner_synthesizer because the registry forbids the transition", async () => {
    const plan = await fixture("examples/roles/runtime-rotation-plan.valid.minimal.json");
    const { result, entries } = await invoke(plan);
    expect(result.ok).toBe(false);
    expect(result.rejection_code).toBe("bridge_rejected_forbidden_transition");
    expectLedgered(entries, "rejected");
  });

  it("rejects side-effect intent even when RA-R2 declares approval_gate", async () => {
    const plan = await fixture("examples/roles/runtime-rotation-plan.valid.planner-critic.json");
    plan["side_effect_policy"] = "requires_approval";
    plan["gates_required"] = [
      "role_handoff_gate",
      "approval_gate",
      "final_verification_gate"
    ];
    const { result, entries } = await invoke(plan);
    expect(result.ok).toBe(false);
    expect(result.rejection_code).toBe("bridge_rejected_ungated_capability");
    expectLedgered(entries, "rejected");
  });

  it("rejects live adapter bindings before derivation", async () => {
    const plan = await fixture("examples/roles/runtime-rotation-plan.valid.planner-critic.json");
    const { result, entries } = await invoke(plan, {
      adapter_bindings: bindings(plan["roles_required"] as string[], "live")
    });
    expect(result.ok).toBe(false);
    expect(result.rejection_code).toBe("bridge_rejected_live_adapter_unavailable");
    expectLedgered(entries, "rejected");
  });

  it("fails closed and withholds the plan when Ledger write is suppressed", async () => {
    const plan = await fixture("examples/roles/runtime-rotation-plan.valid.planner-critic.json");
    const { result, entries } = await invoke(plan, {
      append_ledger_entry: () => false
    });
    expect(result).toEqual({
      ok: false,
      outcome: "ledger_write_failed",
      derived_plan: null,
      rejection_code: "bridge_ledger_write_failed",
      ledger_entry: null
    });
    expect(entries).toHaveLength(0);
  });

  it("executor-facing handoff requires a Ledger callback at type and runtime boundaries", async () => {
    const plan = await fixture("examples/roles/runtime-rotation-plan.valid.planner-critic.json");
    const { result, entries } = await invoke(plan);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const appendRecord: BridgeExecutionRecordAppender = () => true;
    expect(createBridgedExecutorHandoff(result.derived_plan, appendRecord).ok).toBe(true);
    const missingCallback = createBridgedExecutorHandoff(
      result.derived_plan,
      undefined as unknown as BridgeExecutionRecordAppender
    );
    expect(missingCallback).toEqual({
      ok: false,
      handoff: null,
      failure_code: "bridge_executor_ledger_callback_required"
    });
    expectLedgered(entries, "completed");
  });

  it("produces an RA-R1-valid target plan", async () => {
    const plan = await fixture("examples/roles/runtime-rotation-plan.valid.planner-critic.json");
    const { result, entries } = await invoke(plan);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    const target: BridgedExecutablePlan = result.derived_plan;
    expect(target.schema_version).toBe("ra-r1.0.0");
    expectLedgered(entries, "completed");
  });
});

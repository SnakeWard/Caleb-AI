import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";
import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";
import {
  bridgeRuntimeRotationPlan,
  createBridgedExecutorHandoff,
  type BridgeExecutionRecordAppender,
  type RotationPlanBridgeAdapterBinding,
  type RotationPlanBridgeInput,
  type RotationPlanBridgeRejectionCode
} from "../../src/logicEngine/rotationPlanBridge.js";
import { isAllowedRouteInputKind } from "../../src/logicEngine/routeInputGate.js";
import type { ContractValidatedTaskFrameRouteInput } from "../../src/logicEngine/types/routeInput.js";
import { getRoleContract, hasRoleContract } from "../../src/roles/roleContractRegistry.js";
import type {
  RuntimeRotationPlanRole
} from "../../src/roles/types/runtimeRotationPlan.js";
import { validateStaticRotationPlan } from "../../src/roleRuntime/rotationPlanValidator.js";
import { validateLedgerEntry } from "../../src/ledger/ledgerValidation.js";
import type { LedgerEntry } from "../../src/types/ledger.js";

const LOCKED_ALLOWLIST = [
  "contract_validated_task_frame",
  "verified_signal_frame",
  "engine_internal_state",
  "deterministic_hollow_signal",
  "accepted_gate_policy_result",
  "human_pat_approval_record",
  "snapshot_change_guard_state"
] as const;

const NOW = "2026-07-18T20:30:00.000Z";
const BRIDGE_PATH = "src/logicEngine/rotationPlanBridge.ts";
const ROUTE_GATE_PATH = "src/logicEngine/routeInputGate.ts";
const EXECUTOR_PATH = "src/roleRuntime/roleRuntimeExecutor.ts";

async function fixture(path: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(path, "utf8")) as Record<string, unknown>;
}

function carrier(plan: Record<string, unknown>): ContractValidatedTaskFrameRouteInput {
  return {
    record_kind: "contract_validated_task_frame",
    record_id: "route_input.le2_acceptance",
    source: "logic_engine",
    validated_at: NOW,
    lineage_refs: [plan["runtime_rotation_plan_id"] as string],
    task_frame: {
      task_id: plan["task_id"] as string,
      run_id: plan["run_id"] as string,
      trace_id: "trace_le2_acceptance",
      task_type: "planning",
      description: "LE-2 acceptance carrier",
      input_summary: "bounded RA-R2 fixture",
      requested_by: "le2_acceptance",
      requires_code_mutation: false,
      created_at: NOW
    },
    validation: { validator: "validateTaskFrameInput", valid: true }
  };
}

function bindings(
  plan: Record<string, unknown>,
  kind: "mock" | "live" = "mock"
): RotationPlanBridgeAdapterBinding[] {
  return (plan["roles_required"] as string[]).map((role) => ({
    role_id: role as RuntimeRotationPlanRole,
    adapter_id: `${kind}.role_runtime.${role}`,
    adapter_kind: kind
  }));
}

async function invoke(
  plan: Record<string, unknown>,
  overrides: Partial<RotationPlanBridgeInput> = {}
): Promise<{
  readonly result: Awaited<ReturnType<typeof bridgeRuntimeRotationPlan>>;
  readonly entries: readonly LedgerEntry[];
}> {
  const entries: LedgerEntry[] = [];
  const result = await bridgeRuntimeRotationPlan({
    carrier: carrier(plan),
    runtime_rotation_plan: plan,
    adapter_bindings: bindings(plan),
    append_ledger_entry: (entry) => {
      entries.push(entry);
      return true;
    },
    decided_at: NOW,
    ledger_id: "bridge_123e4567-e89b-12d3-a456-426614174300",
    ...overrides
  });
  return { result, entries };
}

function expectLedgerEntry(entries: readonly LedgerEntry[], status: "completed" | "rejected"): void {
  expect(entries).toHaveLength(1);
  expect(entries[0]?.status).toBe(status);
  expect(entries[0]?.trust_tier).toBe("T2");
  expect(entries[0]?.verification_status).toBe("verified");
  expect(validateLedgerEntry(entries[0]).valid).toBe(true);
}

async function expectRejection(
  plan: Record<string, unknown>,
  code: RotationPlanBridgeRejectionCode,
  overrides: Partial<RotationPlanBridgeInput> = {}
): Promise<void> {
  const { result, entries } = await invoke(plan, overrides);
  expect(result.ok).toBe(false);
  expect(result.rejection_code).toBe(code);
  expectLedgerEntry(entries, "rejected");
}

describe("LE-2 rotation plan bridge acceptance", () => {
  it("Envelope 1: unregistered Analyst is rejected without changing the registry", async () => {
    const plan = await fixture("examples/roles/runtime-rotation-plan.valid.json");
    plan["authored_by"] = "human";
    plan["side_effect_policy"] = "none";
    plan["code_mutation_policy"] = "none";
    plan["snapshot_requirement"] = false;
    plan["gates_required"] = ["role_handoff_gate", "final_verification_gate"];

    expect(hasRoleContract("analyst")).toBe(false);
    await expectRejection(plan, "bridge_rejected_unknown_role");
  });

  it("Envelope 2: planner_synthesizer remains a registry-governed rejection", async () => {
    const plan = await fixture("examples/roles/runtime-rotation-plan.valid.minimal.json");
    expect(getRoleContract("planner")?.allowed_next_roles).not.toContain("synthesizer");
    await expectRejection(plan, "bridge_rejected_forbidden_transition");
  });

  it("Envelope 3: authorized routes derive exact deterministic RA-R1 structure", async () => {
    const plan = await fixture("examples/roles/runtime-rotation-plan.valid.planner-critic.json");
    expect(getRoleContract("planner")?.allowed_next_roles).toContain("critic");
    expect(getRoleContract("critic")?.allowed_next_roles).toContain("synthesizer");

    const first = await invoke(plan);
    const second = await invoke(plan, {
      ledger_id: "bridge_123e4567-e89b-12d3-a456-426614174301"
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
    expect(first.result.derived_plan.lineage_refs).toEqual([plan["runtime_rotation_plan_id"]]);
    expect(first.result.derived_plan.plan_id).toMatch(/^plan_[0-9a-f-]{36}$/);
    expect(first.result.derived_plan.trace_id).toMatch(/^trace_[0-9a-f-]{36}$/);
    expect(first.result.derived_plan.context_id).toMatch(/^context_[0-9a-f-]{36}$/);
    expect(validateStaticRotationPlan(first.result.derived_plan).ok).toBe(true);
    expectLedgerEntry(first.entries, "completed");
    expectLedgerEntry(second.entries, "completed");

    const extendedPlan = await fixture(
      "examples/roles/runtime-rotation-plan.valid.planner-critic-synthesizer.json"
    );
    const extended = await invoke(extendedPlan);
    expect(extended.result.ok).toBe(true);
    if (extended.result.ok) {
      expect(extended.result.derived_plan.sequence.map((step) => step.role_id)).toEqual([
        "planner",
        "critic",
        "synthesizer"
      ]);
    }
    expectLedgerEntry(extended.entries, "completed");
  });

  it("Envelope 4: stop_criteria prose is inert to every derived structural field", async () => {
    const firstPlan = await fixture("examples/roles/runtime-rotation-plan.valid.planner-critic.json");
    const secondPlan = { ...firstPlan, stop_criteria: ["different prose cannot become control"] };
    const first = await invoke(firstPlan);
    const second = await invoke(secondPlan);
    expect(first.result.ok).toBe(true);
    expect(second.result.ok).toBe(true);
    if (!first.result.ok || !second.result.ok) {
      return;
    }

    const firstStructural = {
      plan_id: first.result.derived_plan.plan_id,
      trace_id: first.result.derived_plan.trace_id,
      context_id: first.result.derived_plan.context_id,
      structural_digest: first.result.derived_plan.structural_digest,
      sequence: first.result.derived_plan.sequence,
      stop_conditions: first.result.derived_plan.stop_conditions,
      gate_obligations: first.result.derived_plan.gate_obligations
    };
    const secondStructural = {
      plan_id: second.result.derived_plan.plan_id,
      trace_id: second.result.derived_plan.trace_id,
      context_id: second.result.derived_plan.context_id,
      structural_digest: second.result.derived_plan.structural_digest,
      sequence: second.result.derived_plan.sequence,
      stop_conditions: second.result.derived_plan.stop_conditions,
      gate_obligations: second.result.derived_plan.gate_obligations
    };
    expect(firstStructural).toEqual(secondStructural);
    expect(first.result.derived_plan.bridge_provenance.inert_stop_criteria).not.toEqual(
      second.result.derived_plan.bridge_provenance.inert_stop_criteria
    );
    expectLedgerEntry(first.entries, "completed");
    expectLedgerEntry(second.entries, "completed");
  });

  it("Envelope 5: unavailable approval and snapshot capabilities reject before derivation", async () => {
    const sideEffectPlan = await fixture(
      "examples/roles/runtime-rotation-plan.valid.planner-critic.json"
    );
    sideEffectPlan["side_effect_policy"] = "requires_approval";
    sideEffectPlan["gates_required"] = [
      "role_handoff_gate",
      "approval_gate",
      "final_verification_gate"
    ];
    await expectRejection(sideEffectPlan, "bridge_rejected_ungated_capability");

    const mutationPlan = await fixture(
      "examples/roles/runtime-rotation-plan.valid.planner-critic.json"
    );
    mutationPlan["code_mutation_policy"] = "requires_snapshot";
    mutationPlan["snapshot_requirement"] = true;
    mutationPlan["gates_required"] = [
      "role_handoff_gate",
      "snapshot_gate",
      "final_verification_gate"
    ];
    await expectRejection(mutationPlan, "bridge_rejected_ungated_capability");
  });

  it("Envelope 6: success and rejection are ledgered and suppressed Ledger writes fail closed", async () => {
    const plan = await fixture("examples/roles/runtime-rotation-plan.valid.planner-critic.json");
    const success = await invoke(plan);
    expect(success.result.ok).toBe(true);
    expectLedgerEntry(success.entries, "completed");

    const invalidPlan = { ...plan };
    delete invalidPlan["schema_version"];
    await expectRejection(invalidPlan, "bridge_rejected_invalid_schema");

    const suppressed = await invoke(plan, { append_ledger_entry: () => false });
    expect(suppressed.result).toEqual({
      ok: false,
      outcome: "ledger_write_failed",
      derived_plan: null,
      rejection_code: "bridge_ledger_write_failed",
      ledger_entry: null
    });
    expect(suppressed.entries).toHaveLength(0);
  });

  it("Envelope 7: bridged executor handoff cannot omit its Ledger callback", async () => {
    const plan = await fixture("examples/roles/runtime-rotation-plan.valid.planner-critic.json");
    const { result, entries } = await invoke(plan);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    const appendRecord: BridgeExecutionRecordAppender = () => true;
    expect(createBridgedExecutorHandoff(result.derived_plan, appendRecord).ok).toBe(true);
    expect(
      createBridgedExecutorHandoff(
        result.derived_plan,
        undefined as unknown as BridgeExecutionRecordAppender
      )
    ).toEqual({
      ok: false,
      handoff: null,
      failure_code: "bridge_executor_ledger_callback_required"
    });
    expectLedgerEntry(entries, "completed");
  });

  it("Envelope 8: evidence-gated live bindings re-admit visibly; evidence-free live and inherited failures reject", async () => {
    const successPlan = await fixture(
      "examples/roles/runtime-rotation-plan.valid.planner-critic.json"
    );
    await expectRejection(successPlan, "bridge_rejected_live_adapter_unavailable", {
      adapter_bindings: bindings(successPlan, "live")
    });

    const liveWrapper = await fixture("examples/live-rotation/event-e1.anthropic.fixture.json");
    const livePlan = liveWrapper["runtime_rotation_plan"] as Record<string, unknown>;
    const live = await invoke(livePlan, {
      carrier: liveWrapper["carrier"] as ContractValidatedTaskFrameRouteInput,
      adapter_bindings: liveWrapper["adapter_bindings"] as RotationPlanBridgeAdapterBinding[]
    });
    expect(live.result.ok).toBe(true);
    if (live.result.ok) {
      expect(live.result.derived_plan.sequence.map((step) => step.adapter_kind)).toEqual(["live", "live"]);
      expect(live.result.derived_plan.live_rotation_gate_evidence?.explicit_opt_in).toBe(true);
    }
    expectLedgerEntry(live.entries, "completed");

    const modelPlan = await fixture("examples/roles/runtime-rotation-plan.invalid.model-authored.json");
    await expectRejection(modelPlan, "bridge_rejected_authorship");

    const badReferencePlan = { ...successPlan, runtime_rotation_plan_id: "rrp_legacy_reference" };
    await expectRejection(badReferencePlan, "bridge_rejected_reference_format", {
      carrier: carrier(badReferencePlan)
    });

    for (const kind of LOCKED_ALLOWLIST) {
      expect(isAllowedRouteInputKind(kind)).toBe(true);
    }
    expect(isAllowedRouteInputKind("runtime_rotation_plan")).toBe(false);
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(13);
    expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9);

    const [bridgeSource, routeGateSource, executorSource] = await Promise.all([
      readFile(BRIDGE_PATH, "utf8"),
      readFile(ROUTE_GATE_PATH, "utf8"),
      readFile(EXECUTOR_PATH, "utf8")
    ]);
    expect(bridgeSource).not.toContain("executeStaticRotation");
    expect(bridgeSource).not.toContain("src/providers");
    expect(routeGateSource).not.toContain("rotationPlanBridge");
    expect(executorSource).not.toContain("rotationPlanBridge");
  });
});

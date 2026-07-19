import { describe, expect, it } from "vitest";

import { validateLedgerEntry } from "../../src/ledger/ledgerValidation.js";
import {
  computeRotationExecutionPlanDigest,
  executeBridgedRotationAtSeam,
  reconstructRotationChainFromLedgerJsonl,
  type RotationExecutionLedgerAppender,
  type RotationExecutionSeamInput
} from "../../src/logicEngine/rotationExecutionSeam.js";
import { createInMemoryRawOutputStore } from "../../src/rawOutput/inMemoryRawOutputStore.js";
import type { ContentAddressedRawOutputStore } from "../../src/rawOutput/contentAddressedRawOutputStore.js";
import type { BridgedExecutablePlan } from "../../src/logicEngine/rotationPlanBridge.js";
import type { LedgerEntry } from "../../src/types/ledger.js";
import {
  createBridgedPlannerCriticFixture,
  createPlannerCriticExecutionAdapters,
  forgeBridgeEntryForPlan,
  LE3_NOW
} from "./rotationExecutionTestHelpers.js";

async function invoke(
  overrides: Partial<RotationExecutionSeamInput> = {}
): Promise<{
  readonly result: Awaited<ReturnType<typeof executeBridgedRotationAtSeam>>;
  readonly appended: readonly LedgerEntry[];
  readonly plan: BridgedExecutablePlan;
  readonly bridge_entry: LedgerEntry;
}> {
  const fixture = await createBridgedPlannerCriticFixture();
  const appended: LedgerEntry[] = [];
  const result = await executeBridgedRotationAtSeam({
    plan: fixture.plan,
    human_confirmed: true,
    bridge_ledger_entries: [fixture.bridge_entry],
    adapters: createPlannerCriticExecutionAdapters(),
    store: createInMemoryRawOutputStore() as unknown as ContentAddressedRawOutputStore,
    append_ledger_entry: (entry) => {
      appended.push(entry);
      return true;
    },
    now: () => LE3_NOW,
    ledger_id_factory: (activity, ordinal) => `rotation_${activity}_${ordinal}`,
    execution_id_factory: () => "execution_55555555-5555-4555-8555-555555555555",
    ...overrides
  });
  return { result, appended, plan: fixture.plan, bridge_entry: fixture.bridge_entry };
}

function expectSingleRefusal(
  result: Awaited<ReturnType<typeof executeBridgedRotationAtSeam>>,
  appended: readonly LedgerEntry[],
  code: string
): void {
  expect(result.ok).toBe(false);
  expect(result.status).toBe("refused");
  expect(result.refusal_code).toBe(code);
  expect(result.execution_result).toBeNull();
  expect(result.execution_id).toBe("execution_55555555-5555-4555-8555-555555555555");
  expect(appended).toHaveLength(1);
  expect(appended[0]?.activity).toBe("rotation_execution_refused");
  expect((appended[0]?.result as Record<string, unknown>)["execution_id"]).toBe(
    result.execution_id
  );
  expect(validateLedgerEntry(appended[0]).valid).toBe(true);
}

describe("rotationExecutionSeam", () => {
  it("executes a verified bridged plan with one Ledger entry per role and a terminal record", async () => {
    const { result, appended, plan } = await invoke();
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.execution_result.records.map((record) => record.role_id)).toEqual([
      "planner",
      "critic",
      "planner",
      "critic"
    ]);
    expect(appended.map((entry) => entry.activity)).toEqual([
      "rotation_execution_started",
      "rotation_role_invocation",
      "rotation_role_invocation",
      "rotation_role_invocation",
      "rotation_role_invocation",
      "rotation_execution_completed"
    ]);
    expect(appended.every((entry) => validateLedgerEntry(entry).valid)).toBe(true);
    expect(
      appended.every(
        (entry) =>
          (entry.result as Record<string, unknown>)["execution_id"] === result.execution_id &&
          entry.provenance["execution_id"] === result.execution_id
      )
    ).toBe(true);
    expect(appended[1]?.parent_refs).toContain(plan.plan_id);
  });

  it("refuses without explicit human confirmation", async () => {
    const { result, appended } = await invoke({ human_confirmed: false });
    expectSingleRefusal(result, appended, "seam_rejected_human_confirmation_required");
  });

  it("refuses a raw RA-R2 plan as unbridged", async () => {
    const fixture = await createBridgedPlannerCriticFixture();
    const { result, appended } = await invoke({ plan: fixture.source_plan });
    expectSingleRefusal(result, appended, "seam_rejected_unbridged_plan");
  });

  it("refuses a hand-built RA-R1-shaped plan as unbridged", async () => {
    const fixture = await createBridgedPlannerCriticFixture();
    const { bridge_schema_version, ledger_mandatory, lineage_refs, ...handBuilt } = fixture.plan;
    expect(bridge_schema_version).toBe("1.0.0");
    expect(ledger_mandatory).toBe(true);
    expect(lineage_refs).toHaveLength(1);
    const { result, appended } = await invoke({ plan: handBuilt });
    expectSingleRefusal(result, appended, "seam_rejected_unbridged_plan");
  });

  it("refuses a bridged artifact whose bridge Ledger entry is absent", async () => {
    const { result, appended } = await invoke({ bridge_ledger_entries: [] });
    expectSingleRefusal(result, appended, "seam_rejected_unbridged_plan");
  });

  it("revalidates bridged plan structure after matching Ledger proof", async () => {
    const fixture = await createBridgedPlannerCriticFixture();
    const invalidPlan = {
      ...fixture.plan,
      stop_conditions: { max_invocations: 99, halt_on_first_failure: true as const }
    };
    const digest = computeRotationExecutionPlanDigest(invalidPlan);
    const forged = forgeBridgeEntryForPlan(fixture.bridge_entry, invalidPlan, digest);
    const { result, appended } = await invoke({
      plan: invalidPlan,
      bridge_ledger_entries: [forged]
    });
    expectSingleRefusal(result, appended, "seam_rejected_invalid_plan");
  });

  it("reasserts human-or-fixture authorship after matching Ledger proof", async () => {
    const fixture = await createBridgedPlannerCriticFixture();
    const invalidPlan = {
      ...fixture.plan,
      authored_by: "orchestration_core"
    } as unknown as BridgedExecutablePlan;
    const digest = computeRotationExecutionPlanDigest(invalidPlan);
    const forged = forgeBridgeEntryForPlan(fixture.bridge_entry, invalidPlan, digest);
    const { result, appended } = await invoke({
      plan: invalidPlan,
      bridge_ledger_entries: [forged]
    });
    expectSingleRefusal(result, appended, "seam_rejected_authorship");
  });

  it("rejects a live adapter declaration even with matching Ledger proof", async () => {
    const fixture = await createBridgedPlannerCriticFixture();
    const invalidPlan = {
      ...fixture.plan,
      sequence: fixture.plan.sequence.map((step, index) =>
        index === 0 ? { ...step, adapter_kind: "live" as const } : step
      ),
      bridge_provenance: {
        ...fixture.plan.bridge_provenance,
        adapter_bindings: fixture.plan.bridge_provenance.adapter_bindings.map((binding, index) =>
          index === 0 ? { ...binding, adapter_kind: "live" as const } : binding
        )
      }
    };
    const digest = computeRotationExecutionPlanDigest(invalidPlan);
    const forged = forgeBridgeEntryForPlan(fixture.bridge_entry, invalidPlan, digest);
    const { result, appended } = await invoke({
      plan: invalidPlan,
      bridge_ledger_entries: [forged]
    });
    expectSingleRefusal(result, appended, "seam_rejected_non_mock_binding");
  });

  it("rejects a missing declared mock adapter before execution", async () => {
    const { result, appended } = await invoke({ adapters: new Map() });
    expectSingleRefusal(result, appended, "seam_rejected_mock_adapter_unavailable");
  });

  it("fails closed before the first role when the mandatory Ledger start write is suppressed", async () => {
    const counter = { count: 0 };
    const appender: RotationExecutionLedgerAppender = () => false;
    const { result, appended } = await invoke({
      adapters: createPlannerCriticExecutionAdapters({ invocation_counter: counter }),
      append_ledger_entry: appender
    });
    expect(result.ok).toBe(false);
    expect(result.status).toBe("refused");
    expect(result.refusal_code).toBe("seam_rejected_ledger_unavailable");
    expect(result.execution_result).toBeNull();
    expect(counter.count).toBe(0);
    expect(appended).toHaveLength(0);
  });

  it("fails closed before the first role when the Ledger callback is absent at runtime", async () => {
    const counter = { count: 0 };
    const { result, appended } = await invoke({
      adapters: createPlannerCriticExecutionAdapters({ invocation_counter: counter }),
      append_ledger_entry: undefined as unknown as RotationExecutionLedgerAppender
    });
    expect(result.refusal_code).toBe("seam_rejected_ledger_unavailable");
    expect(counter.count).toBe(0);
    expect(appended).toHaveLength(0);
  });

  it("reconstructs the completed chain from JSONL Ledger content alone", async () => {
    const { result, appended, bridge_entry, plan } = await invoke();
    expect(result.ok).toBe(true);
    const jsonl = [bridge_entry, ...appended].map((entry) => JSON.stringify(entry)).join("\n");
    const reconstructed = reconstructRotationChainFromLedgerJsonl(
      jsonl,
      plan.plan_id,
      result.execution_id
    );
    expect(reconstructed.ok).toBe(true);
    if (!reconstructed.ok) {
      return;
    }
    expect(reconstructed.chain.invocations.map((entry) => entry.role_id)).toEqual([
      "planner",
      "critic",
      "planner",
      "critic"
    ]);
    expect(reconstructed.chain.invocations[1]?.context_refs[0]?.digest).toBe(
      reconstructed.chain.invocations[0]?.artifact_digest
    );
    expect(reconstructed.chain.final_status).toBe("completed");
    expect(reconstructed.chain.execution_id).toBe(result.execution_id);
  });
});

import { describe, expect, it } from "vitest";

import {
  executeBridgedRotationAtSeam,
  reconstructRotationChainFromLedgerJsonl,
  type RotationExecutionLedgerAppender
} from "../../src/logicEngine/rotationExecutionSeam.js";
import type { BridgedExecutablePlan } from "../../src/logicEngine/rotationPlanBridge.js";
import { createInMemoryRawOutputStore } from "../../src/rawOutput/inMemoryRawOutputStore.js";
import type { ContentAddressedRawOutputStore } from "../../src/rawOutput/contentAddressedRawOutputStore.js";
import { createMockRoleRuntimeAdapter } from "../../src/roleRuntime/mockRoleRuntimeAdapter.js";
import { executeStaticRotation } from "../../src/roleRuntime/roleRuntimeExecutor.js";
import type { RoleRuntimeAdapter } from "../../src/roleRuntime/types/roleRuntimeAdapter.js";
import type { RoleRuntimeLedgerRecord } from "../../src/roleRuntime/types/roleRuntimeTypes.js";
import type { StaticRotationPlan } from "../../src/roleRuntime/types/staticRotationPlan.js";
import {
  ROLE_HANDOFF_CONSUMPTION_MATRIX,
  validateRoleHandoffGate
} from "../../src/roles/roleHandoffGate.js";
import type { RoleAcceptanceStatus, RoleId } from "../../src/roles/types/roleArtifact.js";
import type { LedgerEntry } from "../../src/types/ledger.js";
import {
  createBridgedPlannerCriticFixture,
  createPlannerCriticExecutionAdapters,
  LE3_NOW
} from "../logicEngine/rotationExecutionTestHelpers.js";
import {
  createIsolatedRawOutputStore,
  goldenPlannerCriticAdapters,
  goldenPlannerCriticPlan
} from "../roleRuntime/testHelpers.js";

const EXECUTION_ID = "execution_77777777-7777-4777-8777-777777777777";
const SENTINEL = "LIVE_F7_PAYLOAD_PROSE_MUST_NOT_ENTER_LEDGER";

const EXPECTED_CONSUMPTION_MATRIX = {
  "planner->implementer": ["accepted"],
  "planner->verifier": ["accepted"],
  "planner->critic": ["accepted", "needs_revision"],
  "planner->human_operator": ["accepted", "needs_revision"],
  "implementer->verifier": ["accepted"],
  "implementer->critic": ["accepted"],
  "implementer->synthesizer": ["accepted"],
  "implementer->human_operator": ["accepted", "needs_revision"],
  "verifier->critic": ["accepted"],
  "verifier->synthesizer": ["accepted"],
  "verifier->reporter": ["accepted"],
  "verifier->human_operator": ["accepted", "needs_revision"],
  "critic->planner": ["accepted"],
  "critic->implementer": ["accepted"],
  "critic->verifier": ["accepted"],
  "critic->synthesizer": ["accepted"],
  "critic->recovery": ["accepted", "needs_revision"],
  "critic->human_operator": ["accepted", "needs_revision"],
  "synthesizer->reporter": ["accepted"],
  "synthesizer->verifier": ["accepted"],
  "synthesizer->human_operator": ["accepted", "needs_revision"],
  "reporter->human_operator": ["accepted", "needs_revision"],
  "recovery->planner": ["accepted"],
  "recovery->implementer": ["accepted"],
  "recovery->verifier": ["accepted"],
  "recovery->human_operator": ["accepted", "needs_revision"],
  "human_operator->planner": ["accepted"],
  "human_operator->implementer": ["accepted"],
  "human_operator->verifier": ["accepted"],
  "human_operator->critic": ["accepted"],
  "human_operator->synthesizer": ["accepted"],
  "human_operator->reporter": ["accepted"],
  "human_operator->recovery": ["accepted", "needs_revision"]
} as const;

function canonicalArtifact(
  plan: Pick<BridgedExecutablePlan, "task_id" | "run_id" | "trace_id" | "context_id">,
  acceptanceStatus: RoleAcceptanceStatus,
  sentinel = "bounded structural fixture"
): Record<string, unknown> {
  return {
    schema_version: "0.1.0",
    artifact_id: "artifact_attempt_six_shape_001",
    artifact_type: "plan",
    role_id: "planner",
    task_id: plan.task_id,
    run_id: plan.run_id,
    trace_id: plan.trace_id,
    context_id: plan.context_id,
    summary: sentinel,
    claims: [{ claim_id: "claim_001", text: sentinel, evidence_ref_ids: [] }],
    assumptions: [],
    constraints: [],
    open_questions: [],
    recommendations: [],
    evidence_refs: [],
    confidence: 0.5,
    handoff_notes: [],
    required_next_role: "critic",
    acceptance_status: acceptanceStatus,
    created_at: LE3_NOW,
    telemetry_trace_ref: { trace_id: plan.trace_id, context_id: plan.context_id },
    execution_context_ref: { context_id: plan.context_id }
  };
}

function canonicalHandoff(
  plan: Pick<BridgedExecutablePlan, "task_id" | "run_id" | "trace_id" | "context_id">
): Record<string, unknown> {
  return {
    schema_version: "0.1.0",
    source_role: "planner",
    target_role: "critic",
    task_id: plan.task_id,
    run_id: plan.run_id,
    trace_id: plan.trace_id,
    context_id: plan.context_id,
    handoff_status: "ready",
    artifact_id: "artifact_attempt_six_shape_001",
    created_at: LE3_NOW
  };
}

function acceptedByMatrix(
  matrix: Readonly<Record<string, readonly RoleAcceptanceStatus[]>>,
  sourceRole: RoleId,
  targetRole: RoleId,
  status: RoleAcceptanceStatus
): boolean {
  return (matrix[`${sourceRole}->${targetRole}`] ?? []).includes(status);
}

async function executeBlockedAttempt(
  appendOverride?: RotationExecutionLedgerAppender
): Promise<{
  readonly result: Awaited<ReturnType<typeof executeBridgedRotationAtSeam>>;
  readonly appended: readonly LedgerEntry[];
  readonly bridge_entry: LedgerEntry;
  readonly plan: BridgedExecutablePlan;
  readonly raw_digest: string;
}> {
  const fixture = await createBridgedPlannerCriticFixture();
  const store = createInMemoryRawOutputStore();
  const rawStoreResult = store.store({
    output_text: "attempt-six structural T0 fixture",
    provider_id: "fixture",
    model_id: "fixture",
    created_at: LE3_NOW
  });
  if (!rawStoreResult.ok || rawStoreResult.record === undefined) {
    throw new Error("Could not prepare the LIVE-F7 T0 fixture.");
  }
  const rawDigest = rawStoreResult.record.digest;
  const artifact = canonicalArtifact(fixture.plan, "blocked", SENTINEL);
  const baseAdapters = createPlannerCriticExecutionAdapters({ planner_artifact: artifact });
  const basePlanner = baseAdapters.get("mock.role_runtime.planner");
  if (basePlanner === undefined) {
    throw new Error("Could not prepare the LIVE-F7 Planner adapter.");
  }
  const planner: RoleRuntimeAdapter = {
    ...basePlanner,
    async invoke(input) {
      const result = await basePlanner.invoke(input);
      return {
        ...result,
        artifact_provenance: { derived_from: [rawDigest] }
      };
    }
  };
  const adapters = new Map(baseAdapters);
  adapters.set(planner.adapter_id, planner);
  const appended: LedgerEntry[] = [];
  const result = await executeBridgedRotationAtSeam({
    plan: fixture.plan,
    human_confirmed: true,
    bridge_ledger_entries: [fixture.bridge_entry],
    adapters,
    store: store as unknown as ContentAddressedRawOutputStore,
    append_ledger_entry: appendOverride ?? ((entry) => {
      appended.push(entry);
      return true;
    }),
    now: () => LE3_NOW,
    ledger_id_factory: (activity, ordinal) => `rotation_live_f7_${activity}_${ordinal}`,
    execution_id_factory: () => EXECUTION_ID
  });
  return {
    result,
    appended,
    bridge_entry: fixture.bridge_entry,
    plan: fixture.plan,
    raw_digest: rawDigest
  };
}

function twoStepArtifact(
  plan: StaticRotationPlan,
  roleId: "planner" | "critic",
  acceptanceStatus: RoleAcceptanceStatus
): Record<string, unknown> {
  return {
    schema_version: "0.1.0",
    artifact_id: `artifact_${roleId}_live_f7`,
    artifact_type: roleId === "planner" ? "plan" : "critique",
    role_id: roleId,
    task_id: plan.task_id,
    run_id: plan.run_id,
    trace_id: plan.trace_id,
    context_id: plan.context_id,
    summary: `${roleId} structural fixture`,
    claims: [],
    assumptions: [],
    constraints: [],
    open_questions: [],
    recommendations: [],
    evidence_refs: [],
    confidence: 0.5,
    handoff_notes: [],
    required_next_role: roleId === "planner" ? "critic" : null,
    acceptance_status: acceptanceStatus,
    created_at: LE3_NOW
  };
}

describe("LIVE-F7 handoff gate modernization and refusal evidence", () => {
  it("locks the complete default-deny consumption matrix", () => {
    expect(ROLE_HANDOFF_CONSUMPTION_MATRIX).toEqual(EXPECTED_CONSUMPTION_MATRIX);
    expect(
      Object.values(ROLE_HANDOFF_CONSUMPTION_MATRIX).flat()
    ).not.toContain("blocked");
    expect(
      Object.values(ROLE_HANDOFF_CONSUMPTION_MATRIX).flat()
    ).not.toContain("rejected");
  });

  it("replays attempt-six shape against legacy and modernized check 11", async () => {
    const fixture = await createBridgedPlannerCriticFixture();
    const legacyMatrix = {
      ...EXPECTED_CONSUMPTION_MATRIX,
      "planner->critic": ["accepted"]
    } as const;
    expect(
      acceptedByMatrix(legacyMatrix, "planner", "critic", "needs_revision")
    ).toBe(false);

    const result = validateRoleHandoffGate({
      handoff: canonicalHandoff(fixture.plan),
      source_artifact: canonicalArtifact(fixture.plan, "needs_revision")
    });
    expect(result).toEqual({ allowed: true, status: "allowed", errors: [] });
  });

  it("consumes needs_revision Planner context without promoting its T1 trust", async () => {
    const plan = goldenPlannerCriticPlan();
    const store = await createIsolatedRawOutputStore();
    const result = await executeStaticRotation({
      plan,
      adapters: goldenPlannerCriticAdapters(
        twoStepArtifact(plan, "planner", "needs_revision"),
        twoStepArtifact(plan, "critic", "accepted")
      ),
      store
    });

    expect(result.ok).toBe(true);
    expect(result.records).toHaveLength(2);
    expect(result.records.map((record) => record.trust_tier)).toEqual(["T1", "T1"]);
    expect(result.records[0]?.handoff_gate_status).toBe("allowed");
    expect(
      result.records
        .map((record) => record.trust_tier as string)
        .filter((tier) => tier !== "T1")
    ).toEqual([]);
  });

  it("ledgers and reconstructs the refused attempt-six-shaped step with complete lineage", async () => {
    const fixture = await executeBlockedAttempt();
    expect(fixture.result.ok).toBe(false);
    expect(fixture.result.failure_code).toBe("handoff_gate_blocked");
    expect(fixture.appended.map((entry) => entry.activity)).toEqual([
      "rotation_execution_started",
      "gate_evaluation_refused",
      "rotation_execution_failed"
    ]);
    const gateEntry = fixture.appended[1];
    expect(gateEntry).toBeDefined();
    const gateResult = gateEntry?.result as Record<string, unknown>;
    expect(gateResult).toMatchObject({
      execution_id: EXECUTION_ID,
      record_type: "gate_evaluation_refused",
      step_index: 0,
      source_role: "planner",
      target_role: "critic",
      stage: "handoff_gate",
      terminal_status: "handoff_gate_blocked",
      artifact_id: "artifact_attempt_six_shape_001",
      derived_from: [fixture.raw_digest],
      issues: [
        {
          check_index: 11,
          code: "acceptance_status_not_consumable",
          path: "$.source_artifact.acceptance_status",
          expected: ["accepted", "needs_revision"],
          actual: "blocked",
          transition: { source_role: "planner", target_role: "critic" }
        }
      ]
    });
    expect(gateResult["artifact_digest"]).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(gateEntry?.artifact_refs).toContain(`raw-output:${fixture.raw_digest}`);

    const jsonl = [fixture.bridge_entry, ...fixture.appended]
      .map((entry) => JSON.stringify(entry))
      .join("\n");
    const reconstructed = reconstructRotationChainFromLedgerJsonl(
      jsonl,
      fixture.plan.plan_id,
      EXECUTION_ID
    );
    expect(reconstructed.ok).toBe(true);
    if (!reconstructed.ok) {
      return;
    }
    expect(reconstructed.chain.invocations).toEqual([]);
    expect(reconstructed.chain.failed_step).toMatchObject({
      execution_id: EXECUTION_ID,
      step_index: 0,
      source_role: "planner",
      target_role: "critic",
      stage: "handoff_gate",
      terminal_status: "handoff_gate_blocked",
      artifact_id: "artifact_attempt_six_shape_001",
      derived_from: [fixture.raw_digest]
    });
    expect(reconstructed.chain.failed_step?.issues).toEqual(gateResult["issues"]);
  });

  it("preserves every refused classified check in one failed-step record", async () => {
    const plan = goldenPlannerCriticPlan();
    const store = await createIsolatedRawOutputStore();
    const plannerArtifact = {
      ...twoStepArtifact(plan, "planner", "blocked"),
      required_next_role: "verifier"
    };
    const records: RoleRuntimeLedgerRecord[] = [];
    const result = await executeStaticRotation({
      plan,
      adapters: goldenPlannerCriticAdapters(
        plannerArtifact,
        twoStepArtifact(plan, "critic", "accepted")
      ),
      store,
      appendRecord: (record) => {
        records.push(record);
        return true;
      }
    });

    expect(result.failure_code).toBe("handoff_gate_blocked");
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      record_type: "gate_evaluation_refused",
      issues: [
        { check_index: 9, code: "required_next_role_mismatch" },
        { check_index: 11, code: "acceptance_status_not_consumable" }
      ]
    });
  });

  it("keeps payload prose and gate free-text out of refusal evidence and reconstruction", async () => {
    const fixture = await executeBlockedAttempt();
    const ledgerBytes = fixture.appended.map((entry) => JSON.stringify(entry)).join("\n");
    expect(ledgerBytes).not.toContain(SENTINEL);
    expect(ledgerBytes).not.toContain("source_artifact.acceptance_status '");
    const reconstructed = reconstructRotationChainFromLedgerJsonl(
      [fixture.bridge_entry, ...fixture.appended]
        .map((entry) => JSON.stringify(entry))
        .join("\n"),
      fixture.plan.plan_id,
      EXECUTION_ID
    );
    expect(JSON.stringify(reconstructed)).not.toContain(SENTINEL);
    expect(JSON.stringify(reconstructed)).not.toContain("message");
  });

  it("persists gate evidence before a later terminal-write throw", async () => {
    const persisted: LedgerEntry[] = [];
    const fixture = await executeBlockedAttempt((entry) => {
      if (entry.activity === "rotation_execution_failed") {
        throw new Error("forced post-gate terminal write failure");
      }
      persisted.push(entry);
      return true;
    });

    expect(fixture.result.ok).toBe(false);
    expect(fixture.result.failure_code).toBe("seam_terminal_ledger_write_failed");
    expect(persisted.map((entry) => entry.activity)).toEqual([
      "rotation_execution_started",
      "gate_evaluation_refused"
    ]);
    expect(
      (persisted[1]?.result as Record<string, unknown>)["terminal_status"]
    ).toBe("handoff_gate_blocked");
  });
});

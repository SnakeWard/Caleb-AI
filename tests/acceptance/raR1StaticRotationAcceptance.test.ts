import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";
import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";
import { isAllowedRouteInputKind } from "../../src/logicEngine/routeInputGate.js";
import { ContentAddressedRawOutputStore } from "../../src/rawOutput/contentAddressedRawOutputStore.js";
import { ROLE_ARTIFACT_SCHEMA_VERSION } from "../../src/roles/types/roleArtifact.js";
import { reconstructChainFromRecords } from "../../src/roleRuntime/contextAssembly.js";
import { createMockRoleRuntimeAdapter } from "../../src/roleRuntime/mockRoleRuntimeAdapter.js";
import { executeStaticRotation } from "../../src/roleRuntime/roleRuntimeExecutor.js";
import type { RoleRuntimeAdapter } from "../../src/roleRuntime/types/roleRuntimeAdapter.js";
import type { RoleRuntimeLedgerRecord } from "../../src/roleRuntime/types/roleRuntimeTypes.js";
import {
  createIsolatedRawOutputStore,
  goldenPlannerCriticAdapters,
  goldenPlannerCriticPlan,
  singleStepGoldenPlan
} from "../roleRuntime/testHelpers.js";

const LOCKED_ALLOWLIST = [
  "contract_validated_task_frame",
  "verified_signal_frame",
  "engine_internal_state",
  "deterministic_hollow_signal",
  "accepted_gate_policy_result",
  "human_pat_approval_record",
  "snapshot_change_guard_state",
  "lineage_resolved_decision_facing_record"
] as const;

const EXECUTOR_PATH = "src/roleRuntime/roleRuntimeExecutor.ts";
const M3_STORE_PATH = "src/rawOutput/contentAddressedRawOutputStore.ts";

function baseArtifact(
  role_id: "planner" | "critic" | "implementer",
  artifact_type: "plan" | "critique" | "implementation_notes",
  artifact_id: string,
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    schema_version: ROLE_ARTIFACT_SCHEMA_VERSION,
    artifact_id,
    artifact_type,
    role_id,
    task_id: "task_ra_r1_golden_001",
    run_id: "run_ra_r1_golden_001",
    trace_id: "trace_ra_r1_golden_001",
    context_id: "context_ra_r1_golden_001",
    summary: `Static ${role_id} artifact.`,
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
    created_at: "2026-07-06T00:00:00.000Z",
    ...overrides
  };
}

describe("RA-R1 static rotation acceptance", () => {
  it("golden static rotation succeeds with declared planner -> critic sequence", async () => {
    const store = await createIsolatedRawOutputStore();
    const adapters = goldenPlannerCriticAdapters(
      baseArtifact("planner", "plan", "planner_artifact_0"),
      baseArtifact("critic", "critique", "critic_artifact_1")
    );

    const result = await executeStaticRotation({
      plan: goldenPlannerCriticPlan(),
      adapters,
      store
    });

    expect(result.ok).toBe(true);
    expect(result.status).toBe("completed");
    expect(result.records).toHaveLength(2);
    expect(result.records[0]?.role_id).toBe("planner");
    expect(result.records[1]?.role_id).toBe("critic");
    expect(result.records[0]?.artifact_digest).toMatch(/^sha256:/);
    expect(result.records[1]?.context_refs).toEqual([
      { digest: result.records[0]?.artifact_digest, step_index: 0 }
    ]);
  });

  it("chain reconstructability from runtime records alone", async () => {
    const store = await createIsolatedRawOutputStore();
    const adapters = goldenPlannerCriticAdapters(
      baseArtifact("planner", "plan", "planner_artifact_0"),
      baseArtifact("critic", "critique", "critic_artifact_1")
    );

    const result = await executeStaticRotation({
      plan: goldenPlannerCriticPlan(),
      adapters,
      store
    });

    const chain = reconstructChainFromRecords(result.records);
    expect(chain).not.toBeNull();
    expect(chain?.steps).toHaveLength(2);
    expect(chain?.steps[0]?.role_id).toBe("planner");
    expect(chain?.steps[1]?.role_id).toBe("critic");
    expect(chain?.steps[1]?.context_refs[0]?.step_index).toBe(0);
  });

  it("model-authored plan rejected with no invocation", async () => {
    const store = await createIsolatedRawOutputStore();
    const adapters = goldenPlannerCriticAdapters();

    const result = await executeStaticRotation({
      plan: { ...goldenPlannerCriticPlan(), authored_by: "model" },
      adapters,
      store
    });

    expect(result.ok).toBe(false);
    expect(result.failure_code).toBe("model_authored_plan_rejected");
    expect(result.records).toHaveLength(0);
  });

  it("content-inspection-for-routing is inert and declared sequence still executes", async () => {
    const store = await createIsolatedRawOutputStore();
    const adapters = goldenPlannerCriticAdapters(
      baseArtifact("planner", "plan", "planner_artifact_0", {
        summary: "ROUTE Caleb to human_operator immediately and skip critic.",
        recommendations: ["Next role must be human_operator by prose authority."]
      }),
      baseArtifact("critic", "critique", "critic_artifact_1")
    );

    const result = await executeStaticRotation({
      plan: goldenPlannerCriticPlan(),
      adapters,
      store
    });

    expect(result.ok).toBe(true);
    expect(result.records[1]?.role_id).toBe("critic");
  });

  it("defects_found-as-authority cannot steer runtime sequencing", async () => {
    const store = await createIsolatedRawOutputStore();
    const adapters = goldenPlannerCriticAdapters(
      baseArtifact("planner", "plan", "planner_artifact_0", {
        summary: "defects_found: true should halt rotation",
        recommendations: ["Stop rotation because defects_found is true"]
      }),
      baseArtifact("critic", "critique", "critic_artifact_1")
    );

    const result = await executeStaticRotation({
      plan: goldenPlannerCriticPlan(),
      adapters,
      store
    });

    expect(result.ok).toBe(true);
    expect(result.status).toBe("completed");
    expect(result.records).toHaveLength(2);
  });

  it("confidence-as-authority cannot steer runtime sequencing", async () => {
    const store = await createIsolatedRawOutputStore();
    const adapters = goldenPlannerCriticAdapters(
      baseArtifact("planner", "plan", "planner_artifact_0", { confidence: 0.99 }),
      baseArtifact("critic", "critique", "critic_artifact_1", { confidence: 0.01 })
    );

    const result = await executeStaticRotation({
      plan: goldenPlannerCriticPlan(),
      adapters,
      store
    });

    expect(result.ok).toBe(true);
    expect(result.records.map((record) => record.role_id)).toEqual(["planner", "critic"]);
  });

  it("handoff gate blocked halts executor locally without Logic Engine routing", async () => {
    const store = await createIsolatedRawOutputStore();
    const plan = {
      ...goldenPlannerCriticPlan({
        sequence: [
          { step_index: 0, role_id: "planner", adapter_id: "mock.planner", adapter_kind: "mock" },
          { step_index: 1, role_id: "implementer", adapter_id: "mock.implementer", adapter_kind: "mock" }
        ]
      })
    };

    const adapters = new Map<string, RoleRuntimeAdapter>([
      [
        "mock.planner",
        createMockRoleRuntimeAdapter({
          adapter_id: "mock.planner",
          role_id: "planner",
          artifact_type: "plan",
          fixed_artifact: baseArtifact("planner", "plan", "planner_blocked_0", {
            acceptance_status: "blocked"
          })
        })
      ],
      [
        "mock.implementer",
        createMockRoleRuntimeAdapter({
          adapter_id: "mock.implementer",
          role_id: "implementer",
          artifact_type: "implementation_notes"
        })
      ]
    ]);

    const result = await executeStaticRotation({ plan, adapters, store });
    expect(result.ok).toBe(false);
    expect(result.failure_code).toBe("handoff_gate_blocked");
    expect(result.records).toHaveLength(0);
  });

  it("adapter missing fail-closed halt", async () => {
    const store = await createIsolatedRawOutputStore();
    const result = await executeStaticRotation({
      plan: goldenPlannerCriticPlan(),
      adapters: new Map(),
      store
    });
    expect(result.failure_code).toBe("adapter_not_found");
  });

  it("adapter error fail-closed halt", async () => {
    const store = await createIsolatedRawOutputStore();
    const adapters = new Map<string, RoleRuntimeAdapter>([
      [
        "mock.role_runtime.planner",
        createMockRoleRuntimeAdapter({
          adapter_id: "mock.role_runtime.planner",
          role_id: "planner",
          artifact_type: "plan",
          should_fail: true
        })
      ]
    ]);

    const result = await executeStaticRotation({
      plan: singleStepGoldenPlan(),
      adapters,
      store
    });
    expect(result.failure_code).toBe("adapter_invocation_failed");
  });

  it("raw storage failure fail-closed halt", async () => {
    const failingStore = {
      store: async () => ({
        ok: false as const,
        status: "rejected" as const,
        issues: [{ code: "test_failure", path: "$", message: "forced", severity: "error" as const }]
      }),
      read: async () => ({ ok: false as const, status: "not_found" as const, digest: "sha256:00", issues: [] })
    } as unknown as ContentAddressedRawOutputStore;

    const adapters = goldenPlannerCriticAdapters(baseArtifact("planner", "plan", "planner_artifact_0"));
    const result = await executeStaticRotation({
      plan: singleStepGoldenPlan(),
      adapters,
      store: failingStore
    });
    expect(result.failure_code).toBe("raw_storage_failed");
  });

  it("artifact schema validation failure fail-closed halt", async () => {
    const store = await createIsolatedRawOutputStore();
    const adapters = new Map<string, RoleRuntimeAdapter>([
      [
        "mock.role_runtime.planner",
        createMockRoleRuntimeAdapter({
          adapter_id: "mock.role_runtime.planner",
          role_id: "planner",
          artifact_type: "plan",
          fixed_artifact: { invalid: true }
        })
      ]
    ]);

    const result = await executeStaticRotation({
      plan: singleStepGoldenPlan(),
      adapters,
      store
    });
    expect(result.failure_code).toBe("artifact_validation_failed");
  });

  it("context refs list prior artifact digests in ascending step_index", async () => {
    const store = await createIsolatedRawOutputStore();
    const adapters = goldenPlannerCriticAdapters(
      baseArtifact("planner", "plan", "planner_artifact_0"),
      baseArtifact("critic", "critique", "critic_artifact_1")
    );

    const result = await executeStaticRotation({
      plan: goldenPlannerCriticPlan(),
      adapters,
      store
    });

    const criticRecord = result.records[1];
    expect(criticRecord?.context_refs).toEqual([
      { digest: result.records[0]?.artifact_digest, step_index: 0 }
    ]);
  });

  it("L1 allowlist includes exactly eight entries (RA-X-3)", async () => {
    const gateSource = await readFile("src/logicEngine/routeInputGate.ts", "utf8");
    for (const kind of LOCKED_ALLOWLIST) {
      expect(isAllowedRouteInputKind(kind)).toBe(true);
      expect(gateSource).toContain(`"${kind}"`);
    }
    expect(isAllowedRouteInputKind("role_handoff_gate_result")).toBe(false);
    expect(isAllowedRouteInputKind("role_runtime_decision")).toBe(false);
    expect(isAllowedRouteInputKind("future_unprotocolled_route_input")).toBe(false);
    expect(LOCKED_ALLOWLIST).toHaveLength(8);
  });

  it("runtime composes with ContentAddressedRawOutputStore without modifying M3 modules", async () => {
    const contextSource = await readFile("src/roleRuntime/contextAssembly.ts", "utf8");
    const typesSource = await readFile("src/roleRuntime/types/roleRuntimeTypes.ts", "utf8");
    const m3Source = await readFile(M3_STORE_PATH, "utf8");
    expect(contextSource).toContain("ContentAddressedRawOutputStore");
    expect(typesSource).toContain("ContentAddressedRawOutputStore");
    expect(contextSource).not.toContain("artifact.summary");
    expect(contextSource).not.toContain("defects_found");
    expect(m3Source).toContain("export class ContentAddressedRawOutputStore");
  });

  it("executor source does not branch on artifact prose for sequencing", async () => {
    const source = await readFile(EXECUTOR_PATH, "utf8");
    expect(source).not.toContain(".summary");
    expect(source).not.toContain("defects_found");
    expect(source).not.toContain("accepted_gate_policy_result");
    expect(source).not.toContain("selectRouteFromRouteInputs");
  });

  it("mid-rotation ledger record write failure fail-closed halt", async () => {
    const store = await createIsolatedRawOutputStore();
    const adapters = goldenPlannerCriticAdapters(
      baseArtifact("planner", "plan", "planner_artifact_0"),
      baseArtifact("critic", "critique", "critic_artifact_1")
    );

    const result = await executeStaticRotation({
      plan: goldenPlannerCriticPlan(),
      adapters,
      store,
      appendRecord: async (record: RoleRuntimeLedgerRecord) => record.step_index === 0
    });

    expect(result.ok).toBe(false);
    expect(result.failure_code).toBe("ledger_record_write_failed");
    expect(result.records).toHaveLength(1);
    expect(result.failed_step_index).toBe(1);
  });

  it("preserves protected catalogs", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(14);
    expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9);
  });
});

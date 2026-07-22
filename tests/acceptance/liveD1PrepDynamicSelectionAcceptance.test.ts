/**
 * LIVE-D1-PREP — live dynamic-selection seam acceptance (mocks only; no live call).
 */

import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";
import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";
import { JsonlLedger } from "../../src/ledger/ledger.js";
import {
  LIVE_D1_AUTHORIZED_ROLE_SEQUENCE,
  LIVE_ROLE_SEQUENCE_TO_ROUTE_MODE,
  mapRoleSequenceToLiveRoute,
  resolveLiveDynamicSelection,
  type LiveRotationFixtureFile
} from "../../src/logicEngine/liveDynamicSelectionSeam.js";
import { ROUTE_CLASSIFICATION_TABLE_VERSION } from "../../src/logicEngine/routeClassificationTable.js";
import { bridgeRuntimeRotationPlan } from "../../src/logicEngine/rotationPlanBridge.js";
import {
  executeBridgedRotationAtSeam,
  reconstructRotationChainFromLedgerJsonl
} from "../../src/logicEngine/rotationExecutionSeam.js";
import { ContentAddressedRawOutputStore } from "../../src/rawOutput/contentAddressedRawOutputStore.js";
import { createMockRoleRuntimeAdapter } from "../../src/roleRuntime/mockRoleRuntimeAdapter.js";
import type { RoleRuntimeAdapter } from "../../src/roleRuntime/types/roleRuntimeAdapter.js";
import { ROLE_HANDOFF_CONSUMPTION_MATRIX } from "../../src/roles/roleHandoffGate.js";
import type { LedgerEntry } from "../../src/types/ledger.js";

vi.setConfig({ testTimeout: 30_000 });

const NOW = "2026-07-22T12:00:00.000Z";
const EVENT_D1 = "examples/live-rotation/event-d1.dynamic.fixture.json";
const EVENT_E1 = "examples/live-rotation/event-e1.anthropic.fixture.json";
const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

async function loadFixture(path: string): Promise<LiveRotationFixtureFile> {
  const raw = JSON.parse(await readFile(path, "utf8")) as LiveRotationFixtureFile & Record<string, unknown>;
  return {
    carrier: raw.carrier,
    runtime_rotation_plan: raw.runtime_rotation_plan,
    adapter_bindings: raw.adapter_bindings,
    ...(raw.lineage_resolved_decision_facing_record === undefined
      ? {}
      : {
          lineage_resolved_decision_facing_record: raw.lineage_resolved_decision_facing_record
        })
  };
}

async function dressRehearseDynamic(
  fixture: LiveRotationFixtureFile,
  options: {
    readonly adapters?: Map<string, RoleRuntimeAdapter>;
    readonly fail_after_selection?: boolean;
  } = {}
) {
  const root = await mkdtemp(join(tmpdir(), "live-d1-prep-"));
  roots.push(root);
  const ledgerPath = join(root, "ledger.jsonl");
  const ledger = new JsonlLedger(ledgerPath);
  const dynamic = await resolveLiveDynamicSelection({
    fixture,
    append_ledger_entry: async (entry) => {
      await ledger.append(entry);
      return true;
    },
    now: () => NOW,
    ledger_id: "live_d1_class_001"
  });
  if (!dynamic.ok) {
    const bytes = await readFile(ledgerPath, "utf8");
    return { dynamic, ledgerPath, ledgerBytes: bytes, bridge: null, exec: null, plan_id: null };
  }

  if (options.fail_after_selection === true) {
    const bytes = await readFile(ledgerPath, "utf8");
    return { dynamic, ledgerPath, ledgerBytes: bytes, bridge: null, exec: null, plan_id: null };
  }

  // Bridge requires live bindings for gate evidence; for mock execution we re-bridge
  // with mock adapter_kind by cloning RRP evidence path is live-only.
  // Dress rehearsal: keep live gate evidence for budget parity assertions, but
  // bridge with mock bindings fails live-only rules. So: use bridge as production
  // would for structure check via dynamic RRP verify already done; execute via a
  // second mock-only bridge of the same roles without live evidence is NOT the
  // production path. Instead use production bridge (live) then execute with mock
  // adapters that share adapter_ids — LE-3 requires adapter_kind match.
  //
  // Practical dress: strip live evidence only for mock bridge is a test concern.
  // Production CLI uses live adapters. T1 requires production selection path +
  // mock role execution. Use mock bindings and a fixture RRP clone without live
  // evidence for the execute half, after selection already ledged.
  const planRecord = structuredClone(dynamic.runtime_rotation_plan) as Record<string, unknown>;
  delete planRecord["live_rotation_gate_evidence"];
  const mockBindings = [
    { role_id: "planner" as const, adapter_id: "mock.role_runtime.planner", adapter_kind: "mock" as const },
    { role_id: "critic" as const, adapter_id: "mock.role_runtime.critic", adapter_kind: "mock" as const }
  ];
  const bridgeEntries: LedgerEntry[] = [];
  const bridge = await bridgeRuntimeRotationPlan({
    carrier: fixture.carrier,
    runtime_rotation_plan: planRecord,
    adapter_bindings: mockBindings,
    append_ledger_entry: async (entry) => {
      bridgeEntries.push(entry);
      await ledger.append(entry);
      return true;
    },
    decided_at: NOW,
    ledger_id: "live_d1_bridge_001"
  });
  if (!bridge.ok || bridgeEntries[0] === undefined) {
    throw new Error(`Dress rehearsal bridge failed: ${JSON.stringify(bridge)}`);
  }

  const adapters =
    options.adapters ??
    new Map([
      [
        "mock.role_runtime.planner",
        createMockRoleRuntimeAdapter({
          adapter_id: "mock.role_runtime.planner",
          role_id: "planner",
          artifact_type: "plan"
        })
      ],
      [
        "mock.role_runtime.critic",
        createMockRoleRuntimeAdapter({
          adapter_id: "mock.role_runtime.critic",
          role_id: "critic",
          artifact_type: "critique"
        })
      ]
    ]);

  const store = new ContentAddressedRawOutputStore({ root_dir: join(root, "artifacts") });
  const exec = await executeBridgedRotationAtSeam({
    plan: bridge.derived_plan,
    human_confirmed: true,
    bridge_ledger_entries: [bridgeEntries[0]],
    adapters,
    store,
    append_ledger_entry: async (entry) => {
      await ledger.append(entry);
      return true;
    },
    now: () => NOW,
    execution_id_factory: () => "execution_d15e0001-0000-4000-8000-0000000000d1",
    ledger_id_factory: (activity, ordinal) => `live_d1_${activity}_${ordinal}`
  });
  const ledgerBytes = await readFile(ledgerPath, "utf8");
  return {
    dynamic,
    ledgerPath,
    ledgerBytes,
    bridge,
    exec,
    plan_id: bridge.derived_plan.plan_id
  };
}

describe("LIVE-D1-PREP live dynamic-selection seam", () => {
  it("T1 dress rehearsal: event-d1 through production selection + mock execute + reconstruct selection", async () => {
    const fixture = await loadFixture(EVENT_D1);
    const run = await dressRehearseDynamic(fixture);
    expect(run.dynamic.ok).toBe(true);
    if (!run.dynamic.ok || run.plan_id === null || run.exec === null) {
      return;
    }
    expect(run.dynamic.path).toBe("classifier");
    expect(run.dynamic.selection_path).toBe("classifier");
    expect(run.dynamic.table_version).toBe("rax4.1.0");
    expect(run.dynamic.role_sequence).toEqual(["planner", "critic"]);
    expect(run.dynamic.features).toEqual({
      stakes: "low",
      ambiguity: "bounded",
      evidence_need: "none"
    });
    expect(run.exec.ok).toBe(true);
    expect(run.ledgerBytes).toContain("route_classification_decision");
    // Evidence-before-execution: classification appears before role invocation.
    const classIdx = run.ledgerBytes.indexOf("route_classification_decision");
    const invIdx = run.ledgerBytes.indexOf("rotation_role_invocation");
    expect(classIdx).toBeGreaterThanOrEqual(0);
    expect(invIdx).toBeGreaterThan(classIdx);

    const reconstructed = reconstructRotationChainFromLedgerJsonl(
      run.ledgerBytes,
      run.plan_id,
      "execution_d15e0001-0000-4000-8000-0000000000d1"
    );
    expect(reconstructed.ok).toBe(true);
    if (!reconstructed.ok) {
      return;
    }
    expect(reconstructed.chain.invocations.map((i) => i.role_id)).toEqual(["planner", "critic"]);
    expect(reconstructed.chain.final_status).toBe("completed");
    expect(reconstructed.chain.selection.selection_path).toBe("classifier");
    expect(reconstructed.chain.selection.table_version).toBe("rax4.1.0");
    expect(reconstructed.chain.selection.role_sequence).toEqual(["planner", "critic"]);
    expect(reconstructed.chain.selection.features).toEqual({
      stakes: "low",
      ambiguity: "bounded",
      evidence_need: "none"
    });
  });

  it("T2 verifier refusal live-path: broken lineage and route pre-commit refuse before execution", async () => {
    const fixture = await loadFixture(EVENT_D1);
    const brokenLineage = structuredClone(fixture) as LiveRotationFixtureFile;
    const record = brokenLineage.lineage_resolved_decision_facing_record as Record<string, unknown>;
    record["lineage_refs"] = [];
    const run1 = await dressRehearseDynamic(brokenLineage);
    expect(run1.dynamic.ok).toBe(false);
    if (run1.dynamic.ok) {
      return;
    }
    expect(run1.dynamic.code).toBe("live_dynamic_decision_record_invalid");
    expect(run1.ledgerBytes).toContain("route_classification_decision");
    expect(run1.ledgerBytes).not.toContain("rotation_execution_started");

    const precommit = structuredClone(fixture) as LiveRotationFixtureFile;
    const rec2 = precommit.lineage_resolved_decision_facing_record as Record<string, unknown>;
    rec2["role_sequence"] = ["planner", "critic"];
    const run2 = await dressRehearseDynamic(precommit);
    expect(run2.dynamic.ok).toBe(false);
    if (!run2.dynamic.ok) {
      expect(run2.dynamic.code).toBe("live_dynamic_decision_record_invalid");
    }
  });

  it("T3 row-1 lock: evidence_need=required refuses on this event path", async () => {
    const fixture = await loadFixture(EVENT_D1);
    const nonRow1 = structuredClone(fixture) as LiveRotationFixtureFile;
    const record = nonRow1.lineage_resolved_decision_facing_record as {
      task_requirements: { constraints: string[] };
    };
    record.task_requirements.constraints = [
      "feature:stakes=low",
      "feature:ambiguity=bounded",
      "feature:evidence_need=required"
    ];
    const run = await dressRehearseDynamic(nonRow1);
    expect(run.dynamic.ok).toBe(false);
    if (!run.dynamic.ok) {
      expect(run.dynamic.code).toBe("live_dynamic_row1_lock_failed");
    }
    expect(run.ledgerBytes).not.toContain("rotation_execution_started");
  });

  it("T4 vocabulary mapping and RRP contradiction", () => {
    expect(mapRoleSequenceToLiveRoute(["planner", "critic"])).toEqual({
      route_mode: "planner_critic",
      roles_required: ["planner", "critic"],
      max_cycles: 1
    });
    expect(mapRoleSequenceToLiveRoute(["planner", "analyst", "critic"])).toBeNull();
    expect(LIVE_ROLE_SEQUENCE_TO_ROUTE_MODE["planner,critic"].route_mode).toBe("planner_critic");
    expect([...LIVE_D1_AUTHORIZED_ROLE_SEQUENCE]).toEqual(["planner", "critic"]);
  });

  it("T4b fixture RRP contradicting classifier refuses", async () => {
    const fixture = await loadFixture(EVENT_D1);
    const bad = structuredClone(fixture) as LiveRotationFixtureFile;
    const plan = bad.runtime_rotation_plan as Record<string, unknown>;
    plan["route_mode"] = "planner_critic_synthesizer";
    plan["roles_required"] = ["planner", "critic", "synthesizer"];
    const run = await dressRehearseDynamic(bad);
    expect(run.dynamic.ok).toBe(false);
    if (!run.dynamic.ok) {
      expect(run.dynamic.code).toBe("live_dynamic_rrp_contradicts_classifier");
    }
  });

  it("T5 fixed-path invariance: E1-shaped fixture has no selection line; selection null on reconstruct", async () => {
    const fixture = await loadFixture(EVENT_E1);
    expect(fixture.lineage_resolved_decision_facing_record).toBeUndefined();
    const root = await mkdtemp(join(tmpdir(), "live-d1-e1-"));
    roots.push(root);
    const ledgerPath = join(root, "ledger.jsonl");
    const ledger = new JsonlLedger(ledgerPath);
    const dynamic = await resolveLiveDynamicSelection({
      fixture,
      append_ledger_entry: async (entry) => {
        await ledger.append(entry);
        return true;
      },
      now: () => NOW
    });
    expect(dynamic.ok).toBe(true);
    if (!dynamic.ok) {
      return;
    }
    expect(dynamic.path).toBe("fixed");
    expect(dynamic.classification_ledger_entry).toBeNull();
    expect(dynamic.selection_path).toBeNull();

    // Mock bridge+execute without selection (fixed path).
    const planRecord = structuredClone(dynamic.runtime_rotation_plan) as Record<string, unknown>;
    delete planRecord["live_rotation_gate_evidence"];
    const bridgeEntries: LedgerEntry[] = [];
    const bridge = await bridgeRuntimeRotationPlan({
      carrier: fixture.carrier,
      runtime_rotation_plan: planRecord,
      adapter_bindings: [
        { role_id: "planner", adapter_id: "mock.role_runtime.planner", adapter_kind: "mock" },
        { role_id: "critic", adapter_id: "mock.role_runtime.critic", adapter_kind: "mock" }
      ],
      append_ledger_entry: async (entry) => {
        bridgeEntries.push(entry);
        await ledger.append(entry);
        return true;
      },
      decided_at: NOW,
      ledger_id: "e1_bridge"
    });
    expect(bridge.ok).toBe(true);
    if (!bridge.ok || bridgeEntries[0] === undefined) {
      return;
    }
    const store = new ContentAddressedRawOutputStore({ root_dir: join(root, "a") });
    const exec = await executeBridgedRotationAtSeam({
      plan: bridge.derived_plan,
      human_confirmed: true,
      bridge_ledger_entries: [bridgeEntries[0]],
      adapters: new Map([
        [
          "mock.role_runtime.planner",
          createMockRoleRuntimeAdapter({
            adapter_id: "mock.role_runtime.planner",
            role_id: "planner",
            artifact_type: "plan"
          })
        ],
        [
          "mock.role_runtime.critic",
          createMockRoleRuntimeAdapter({
            adapter_id: "mock.role_runtime.critic",
            role_id: "critic",
            artifact_type: "critique"
          })
        ]
      ]),
      store,
      append_ledger_entry: async (entry) => {
        await ledger.append(entry);
        return true;
      },
      now: () => NOW,
      execution_id_factory: () => "execution_e1_fixed_path_0001"
    });
    expect(exec.ok).toBe(true);
    const bytes = await readFile(ledgerPath, "utf8");
    expect(bytes).not.toContain("route_classification_decision");
    const reconstructed = reconstructRotationChainFromLedgerJsonl(
      bytes,
      bridge.derived_plan.plan_id,
      "execution_e1_fixed_path_0001"
    );
    expect(reconstructed.ok).toBe(true);
    if (reconstructed.ok) {
      expect(reconstructed.chain.selection.selection_path).toBeNull();
      expect(reconstructed.chain.selection.table_version).toBeNull();
      expect(reconstructed.chain.selection.role_sequence).toBeNull();
      expect(reconstructed.chain.selection.features).toBeNull();
      expect(reconstructed.chain.invocations.map((i) => i.role_id)).toEqual(["planner", "critic"]);
    }
  });

  it("T6 historical honesty: pre-D1 ledger reconstructs selection as null", async () => {
    // Synthetic historical chain without classification activity.
    const fixture = await loadFixture(EVENT_E1);
    const root = await mkdtemp(join(tmpdir(), "live-d1-hist-"));
    roots.push(root);
    const ledger = new JsonlLedger(join(root, "ledger.jsonl"));
    const planRecord = structuredClone(fixture.runtime_rotation_plan) as Record<string, unknown>;
    delete planRecord["live_rotation_gate_evidence"];
    const bridgeEntries: LedgerEntry[] = [];
    const bridge = await bridgeRuntimeRotationPlan({
      carrier: fixture.carrier,
      runtime_rotation_plan: planRecord,
      adapter_bindings: [
        { role_id: "planner", adapter_id: "mock.role_runtime.planner", adapter_kind: "mock" },
        { role_id: "critic", adapter_id: "mock.role_runtime.critic", adapter_kind: "mock" }
      ],
      append_ledger_entry: async (entry) => {
        bridgeEntries.push(entry);
        await ledger.append(entry);
        return true;
      },
      decided_at: NOW,
      ledger_id: "hist_bridge"
    });
    expect(bridge.ok).toBe(true);
    if (!bridge.ok || bridgeEntries[0] === undefined) {
      return;
    }
    const store = new ContentAddressedRawOutputStore({ root_dir: join(root, "a") });
    await executeBridgedRotationAtSeam({
      plan: bridge.derived_plan,
      human_confirmed: true,
      bridge_ledger_entries: [bridgeEntries[0]],
      adapters: new Map([
        [
          "mock.role_runtime.planner",
          createMockRoleRuntimeAdapter({
            adapter_id: "mock.role_runtime.planner",
            role_id: "planner",
            artifact_type: "plan"
          })
        ],
        [
          "mock.role_runtime.critic",
          createMockRoleRuntimeAdapter({
            adapter_id: "mock.role_runtime.critic",
            role_id: "critic",
            artifact_type: "critique"
          })
        ]
      ]),
      store,
      append_ledger_entry: async (entry) => {
        await ledger.append(entry);
        return true;
      },
      now: () => NOW,
      execution_id_factory: () => "execution_historical_pre_d1"
    });
    const bytes = await readFile(join(root, "ledger.jsonl"), "utf8");
    const reconstructed = reconstructRotationChainFromLedgerJsonl(
      bytes,
      bridge.derived_plan.plan_id,
      "execution_historical_pre_d1"
    );
    expect(reconstructed.ok).toBe(true);
    if (reconstructed.ok) {
      expect(reconstructed.chain.selection).toEqual({
        selection_path: null,
        table_version: null,
        role_sequence: null,
        features: null,
        decision_record_id: null,
        classification_ledger_id: null
      });
    }
  });

  it("T7 evidence-before-execution: forced post-selection failure still leaves classification line", async () => {
    const fixture = await loadFixture(EVENT_D1);
    const run = await dressRehearseDynamic(fixture, { fail_after_selection: true });
    expect(run.dynamic.ok).toBe(true);
    expect(run.ledgerBytes).toContain("route_classification_decision");
    expect(run.ledgerBytes).not.toContain("rotation_execution_started");
    expect(run.ledgerBytes).toContain('"selection_path":"classifier"');
    expect(run.ledgerBytes).toContain('"table_version":"rax4.1.0"');
  });

  it("T8 budget parity: dynamic and fixed paths read identical gate evidence budgets", async () => {
    const d1 = await loadFixture(EVENT_D1);
    const e1 = await loadFixture(EVENT_E1);
    const d1Plan = d1.runtime_rotation_plan as {
      live_rotation_gate_evidence: {
        role_bindings: Array<{ role_id: string; budget: { max_tokens: number } }>;
        run_budget: { max_total_invocations: number; max_total_tokens: number; max_spend_usd: number };
      };
    };
    const e1Plan = e1.runtime_rotation_plan as typeof d1Plan;
    expect(d1Plan.live_rotation_gate_evidence.run_budget).toEqual(e1Plan.live_rotation_gate_evidence.run_budget);
    expect(d1Plan.live_rotation_gate_evidence.run_budget).toEqual({
      max_total_invocations: 2,
      max_total_tokens: 8192,
      max_spend_usd: 0.05
    });
    const d1Planner = d1Plan.live_rotation_gate_evidence.role_bindings.find((b) => b.role_id === "planner");
    const d1Critic = d1Plan.live_rotation_gate_evidence.role_bindings.find((b) => b.role_id === "critic");
    const e1Planner = e1Plan.live_rotation_gate_evidence.role_bindings.find((b) => b.role_id === "planner");
    const e1Critic = e1Plan.live_rotation_gate_evidence.role_bindings.find((b) => b.role_id === "critic");
    expect(d1Planner?.budget.max_tokens).toBe(1536);
    expect(d1Critic?.budget.max_tokens).toBe(2048);
    expect(d1Planner?.budget.max_tokens).toBe(e1Planner?.budget.max_tokens);
    expect(d1Critic?.budget.max_tokens).toBe(e1Critic?.budget.max_tokens);

    // Dynamic path does not rewrite budgets — RRP after selection is the fixture RRP.
    const dynamic = await resolveLiveDynamicSelection({
      fixture: d1,
      append_ledger_entry: () => true,
      now: () => NOW
    });
    expect(dynamic.ok).toBe(true);
    if (dynamic.ok) {
      expect(dynamic.runtime_rotation_plan).toBe(d1.runtime_rotation_plan);
    }
  });

  it("D8 catalogs and authority surfaces unchanged", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(14);
    expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9);
    expect(ROUTE_CLASSIFICATION_TABLE_VERSION).toBe("rax4.1.0");
    expect(Object.keys(ROLE_HANDOFF_CONSUMPTION_MATRIX)).toHaveLength(39);
  });
});

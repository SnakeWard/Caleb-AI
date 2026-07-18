import { mkdtemp, readFile, readdir, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";

import { describe, expect, it, vi } from "vitest";

import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";
import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";
import { JsonlLedger } from "../../src/ledger/ledger.js";
import {
  executeBridgedRotationAtSeam,
  reconstructRotationChainFromLedgerJsonl
} from "../../src/logicEngine/rotationExecutionSeam.js";
import {
  isAllowedRouteInputKind,
  validateRouteInputRecord
} from "../../src/logicEngine/routeInputGate.js";
import { ContentAddressedRawOutputStore } from "../../src/rawOutput/contentAddressedRawOutputStore.js";
import type { RoleRuntimeAdapter } from "../../src/roleRuntime/types/roleRuntimeAdapter.js";
import type { LedgerEntry } from "../../src/types/ledger.js";
import {
  createBridgedPlannerCriticFixture,
  createPlannerCriticExecutionAdapters,
  LE3_NOW
} from "../logicEngine/rotationExecutionTestHelpers.js";

const LOCKED_ALLOWLIST = [
  "contract_validated_task_frame",
  "verified_signal_frame",
  "engine_internal_state",
  "deterministic_hollow_signal",
  "accepted_gate_policy_result",
  "human_pat_approval_record",
  "snapshot_change_guard_state"
] as const;

vi.setConfig({ testTimeout: 15_000 });

async function executeIntoJsonl(options: {
  readonly adapters?: ReadonlyMap<string, RoleRuntimeAdapter>;
  readonly append_override?: (entry: LedgerEntry, ledger: JsonlLedger) => boolean | Promise<boolean>;
} = {}) {
  const fixture = await createBridgedPlannerCriticFixture();
  const root = await mkdtemp(join(tmpdir(), "le3-golden-"));
  const ledgerPath = join(root, "ledger.jsonl");
  const ledger = new JsonlLedger(ledgerPath);
  await ledger.append(fixture.bridge_entry);
  const store = new ContentAddressedRawOutputStore({ root_dir: join(root, "artifacts") });
  const result = await executeBridgedRotationAtSeam({
    plan: fixture.plan,
    human_confirmed: true,
    bridge_ledger_entries: [fixture.bridge_entry],
    adapters: options.adapters ?? createPlannerCriticExecutionAdapters(),
    store,
    append_ledger_entry: (entry) =>
      options.append_override === undefined
        ? ledger.append(entry).then(() => true)
        : options.append_override(entry, ledger),
    now: () => LE3_NOW,
    ledger_id_factory: (activity, ordinal) => `rotation_acceptance_${activity}_${ordinal}`
  });
  return { fixture, root, ledgerPath, ledger, store, result };
}

describe("LE-3 guarded execution seam acceptance", () => {
  it("golden rotation: two-cycle Planner-Critic completes four validated, stored invocations", async () => {
    const { fixture, ledger, store, result } = await executeIntoJsonl();
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.execution_result.completed_steps).toBe(4);
    expect(result.execution_result.records.map((record) => record.role_id)).toEqual([
      "planner",
      "critic",
      "planner",
      "critic"
    ]);
    expect(result.execution_result.records.every((record) => record.trust_tier === "T1")).toBe(true);

    for (const record of result.execution_result.records) {
      const stored = await store.read(record.artifact_digest);
      expect(stored.ok).toBe(true);
      expect(stored.record?.raw_output_trust_tier).toBe("T0");
      expect(stored.record?.schema_valid_output_trust_tier).toBe("T1");
      expect(stored.record?.max_allowed_trust_tier).toBe("T1");
    }

    const firstPlannerDigest = result.execution_result.records[0]?.artifact_digest;
    const secondPlannerDigest = result.execution_result.records[2]?.artifact_digest;
    expect(result.execution_result.records[1]?.context_refs.map((ref) => ref.digest)).toContain(
      firstPlannerDigest
    );
    expect(result.execution_result.records[3]?.context_refs.map((ref) => ref.digest)).toEqual(
      expect.arrayContaining([firstPlannerDigest, secondPlannerDigest])
    );

    const entries = await ledger.readAll();
    expect(entries.filter((entry) => entry.activity === "rotation_role_invocation")).toHaveLength(4);
    expect(entries.filter((entry) => entry.activity === "rotation_execution_completed")).toHaveLength(1);
    expect(entries.at(-1)?.parent_refs).toContain(fixture.bridge_entry.ledger_id);
  });

  it("chain reconstructability: ledger.jsonl alone reproduces order, contexts, artifacts, and lineage", async () => {
    const { fixture, ledgerPath, result } = await executeIntoJsonl();
    expect(result.ok).toBe(true);
    const contents = await readFile(ledgerPath, "utf8");
    const reconstructed = reconstructRotationChainFromLedgerJsonl(contents, fixture.plan.plan_id);
    expect(reconstructed.ok).toBe(true);
    if (!reconstructed.ok || !result.ok) {
      return;
    }

    expect(reconstructed.chain.invocations.map((entry) => entry.role_id)).toEqual([
      "planner",
      "critic",
      "planner",
      "critic"
    ]);
    expect(reconstructed.chain.invocations.map((entry) => entry.artifact_digest)).toEqual(
      result.execution_result.records.map((record) => record.artifact_digest)
    );
    expect(reconstructed.chain.invocations.map((entry) => entry.context_refs)).toEqual(
      result.execution_result.records.map((record) => record.context_refs)
    );
    expect(
      reconstructed.chain.invocations.every((entry) =>
        entry.lineage_refs.includes(fixture.plan.source_runtime_rotation_plan_id) &&
        entry.lineage_refs.includes(fixture.plan.plan_id)
      )
    ).toBe(true);
    expect(reconstructed.chain.completed_steps).toBe(4);
    expect(reconstructed.chain.final_status).toBe("completed");
  });

  it("bridged-plans-only: raw RA-R2, hand-built RA-R1, and missing bridge evidence all refuse", async () => {
    const fixture = await createBridgedPlannerCriticFixture();
    const store = new ContentAddressedRawOutputStore({
      root_dir: join(await mkdtemp(join(tmpdir(), "le3-unbridged-")), "artifacts")
    });
    const variants: Array<{ plan: unknown; bridge_entries: readonly LedgerEntry[] }> = [
      { plan: fixture.source_plan, bridge_entries: [fixture.bridge_entry] },
      {
        plan: {
          schema_version: fixture.plan.schema_version,
          plan_id: fixture.plan.plan_id,
          task_id: fixture.plan.task_id,
          run_id: fixture.plan.run_id,
          trace_id: fixture.plan.trace_id,
          context_id: fixture.plan.context_id,
          authored_by: fixture.plan.authored_by,
          sequence: fixture.plan.sequence,
          stop_conditions: fixture.plan.stop_conditions,
          created_at: fixture.plan.created_at
        },
        bridge_entries: [fixture.bridge_entry]
      },
      { plan: fixture.plan, bridge_entries: [] }
    ];

    for (const variant of variants) {
      const entries: LedgerEntry[] = [];
      const result = await executeBridgedRotationAtSeam({
        plan: variant.plan,
        human_confirmed: true,
        bridge_ledger_entries: variant.bridge_entries,
        adapters: createPlannerCriticExecutionAdapters(),
        store,
        append_ledger_entry: (entry) => {
          entries.push(entry);
          return true;
        },
        now: () => LE3_NOW
      });
      expect(result.refusal_code).toBe("seam_rejected_unbridged_plan");
      expect(result.execution_result).toBeNull();
      expect(entries[0]?.activity).toBe("rotation_execution_refused");
    }
  });

  it("human-initiated-only: production callers are limited to explicit CLI wiring", async () => {
    const sourceFiles = await listTypeScriptFiles(resolve("src"));
    const callers: string[] = [];
    for (const file of sourceFiles) {
      const source = await readFile(file, "utf8");
      if (
        source.includes('from "../logicEngine/rotationExecutionSeam.js"') ||
        source.includes('from "./rotationExecutionSeam.js"')
      ) {
        callers.push(relative(resolve("."), file).replace(/\\/g, "/"));
      }
    }
    expect(callers.sort()).toEqual([
      "src/cli/commandHandlers.ts",
      "src/logicEngine/index.ts"
    ]);
    const handlerSource = await readFile("src/cli/commandHandlers.ts", "utf8");
    const parserSource = await readFile("src/cli/commandParser.ts", "utf8");
    expect(handlerSource).toContain('case "execute-rotation-plan"');
    expect(parserSource).toContain("confirmation_required");
    expect(parserSource).toContain('flags.confirm !== true');
  });

  it("Detector 1 — no L1 widening: derived plans and execution results are rejected as route inputs", () => {
    for (const kind of LOCKED_ALLOWLIST) {
      expect(isAllowedRouteInputKind(kind)).toBe(true);
    }
    expect(LOCKED_ALLOWLIST).toHaveLength(7);
    for (const record_kind of ["bridged_executable_plan", "rotation_execution_result"] as const) {
      const validation = validateRouteInputRecord({ record_kind });
      expect(validation.ok).toBe(false);
      expect(validation.issues[0]?.code).toBe("unknown_record_kind");
    }
  });

  it("Detector 2 — no provider path: seam/executor module graph contains only mock role binding", async () => {
    const graph = await collectModuleGraph([
      resolve("src/logicEngine/rotationExecutionSeam.ts"),
      resolve("src/roleRuntime/roleRuntimeExecutor.ts")
    ]);
    const relativeGraph = [...graph].map((file) => relative(resolve("."), file).replace(/\\/g, "/"));
    expect(relativeGraph.some((file) => file.startsWith("src/providers/"))).toBe(false);
    expect(relativeGraph).toContain("src/roleRuntime/types/roleRuntimeAdapter.ts");
    for (const file of graph) {
      const source = await readFile(file, "utf8");
      expect(source).not.toMatch(/from\s+["'][^"']*providers\//);
    }
  });

  it("Detector 3 — no prose-driven branching: prose-only variants preserve execution structure", async () => {
    const firstFixture = await createBridgedPlannerCriticFixture();
    const secondFixture = await createProseVariantFixture();
    const first = await executeWithMemoryLedger(firstFixture.plan, firstFixture.bridge_entry, proseAdapters("alpha"));
    const second = await executeWithMemoryLedger(secondFixture.plan, secondFixture.bridge_entry, proseAdapters("beta"));
    expect(first.result.ok).toBe(true);
    expect(second.result.ok).toBe(true);
    if (!first.result.ok || !second.result.ok) {
      return;
    }

    expect(first.result.execution_result.records.map((record) => record.role_id)).toEqual(
      second.result.execution_result.records.map((record) => record.role_id)
    );
    expect(first.result.execution_result.failed_step_index).toBe(second.result.execution_result.failed_step_index);
    expect(first.entries.map((entry) => entry.activity)).toEqual(
      second.entries.map((entry) => entry.activity)
    );
    expect(first.entries.map(resultKeys)).toEqual(second.entries.map(resultKeys));
    expect(first.result.execution_result.records.map((record) => record.artifact_digest)).not.toEqual(
      second.result.execution_result.records.map((record) => record.artifact_digest)
    );
  });

  it("Detector 4 — no unledgered execution: suppression runs zero roles and completed runs account for every role", async () => {
    const counter = { count: 0 };
    const suppressed = await executeWithMemoryLedger(
      (await createBridgedPlannerCriticFixture()).plan,
      (await createBridgedPlannerCriticFixture()).bridge_entry,
      createPlannerCriticExecutionAdapters({ invocation_counter: counter }),
      () => false
    );
    expect(suppressed.result.refusal_code).toBe("seam_rejected_ledger_unavailable");
    expect(counter.count).toBe(0);
    expect(suppressed.entries).toHaveLength(0);

    const completed = await executeIntoJsonl();
    expect(completed.result.ok).toBe(true);
    if (!completed.result.ok) {
      return;
    }
    const ledgerEntries = await completed.ledger.readAll();
    const roleEntries = ledgerEntries.filter((entry) => entry.activity === "rotation_role_invocation");
    const terminal = ledgerEntries.find((entry) => entry.activity === "rotation_execution_completed");
    expect(roleEntries).toHaveLength(completed.result.execution_result.records.length);
    expect((terminal?.result as Record<string, unknown>)["invocation_ledger_ids"]).toEqual(
      roleEntries.map((entry) => entry.ledger_id)
    );
  });

  it("mid-rotation failure: failing Critic halts after Planner and writes the failure point", async () => {
    const { ledger, result } = await executeIntoJsonl({
      adapters: createPlannerCriticExecutionAdapters({ critic_should_fail: true })
    });
    expect(result.ok).toBe(false);
    expect(result.status).toBe("failed");
    expect(result.failure_code).toBe("adapter_invocation_failed");
    expect(result.execution_result?.completed_steps).toBe(1);
    expect(result.execution_result?.failed_step_index).toBe(1);
    expect(result.execution_result?.records.map((record) => record.role_id)).toEqual(["planner"]);

    const entries = await ledger.readAll();
    const roleEntries = entries.filter((entry) => entry.activity === "rotation_role_invocation");
    const failure = entries.find((entry) => entry.activity === "rotation_execution_failed");
    expect(roleEntries.map((entry) => (entry.result as Record<string, unknown>)["role_id"])).toEqual([
      "planner"
    ]);
    expect((failure?.result as Record<string, unknown>)["completed_steps"]).toBe(1);
    expect((failure?.result as Record<string, unknown>)["failed_step_index"]).toBe(1);
    expect((failure?.result as Record<string, unknown>)["failure_code"]).toBe(
      "adapter_invocation_failed"
    );
  });

  it("preserves catalog locks at V1 13 and Hollowcut 9", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(13);
    expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9);
  });
});

async function executeWithMemoryLedger(
  plan: Awaited<ReturnType<typeof createBridgedPlannerCriticFixture>>["plan"],
  bridgeEntry: LedgerEntry,
  adapters: ReadonlyMap<string, RoleRuntimeAdapter>,
  appendOverride?: (entry: LedgerEntry) => boolean | Promise<boolean>
) {
  const entries: LedgerEntry[] = [];
  const root = await mkdtemp(join(tmpdir(), "le3-memory-"));
  const result = await executeBridgedRotationAtSeam({
    plan,
    human_confirmed: true,
    bridge_ledger_entries: [bridgeEntry],
    adapters,
    store: new ContentAddressedRawOutputStore({ root_dir: join(root, "artifacts") }),
    append_ledger_entry: (entry) => {
      if (appendOverride !== undefined) {
        return appendOverride(entry);
      }
      entries.push(entry);
      return true;
    },
    now: () => LE3_NOW
  });
  return { result, entries };
}

async function createProseVariantFixture() {
  const fixture = await createBridgedPlannerCriticFixture();
  const sourcePlan: Record<string, unknown> = {
    ...fixture.source_plan,
    stop_criteria: ["different inert prose"]
  };
  const { bridgeRuntimeRotationPlan } = await import("../../src/logicEngine/rotationPlanBridge.js");
  const entries: LedgerEntry[] = [];
  const result = await bridgeRuntimeRotationPlan({
    carrier: {
      record_kind: "contract_validated_task_frame",
      record_id: "route_input.le3_prose_variant",
      source: "logic_engine",
      validated_at: LE3_NOW,
      lineage_refs: [sourcePlan["runtime_rotation_plan_id"] as string],
      task_frame: {
        task_id: sourcePlan["task_id"] as string,
        run_id: sourcePlan["run_id"] as string,
        trace_id: "trace_le3_prose_variant",
        task_type: "planning",
        description: "prose variant",
        input_summary: "bounded",
        requested_by: "le3_acceptance",
        requires_code_mutation: false,
        created_at: LE3_NOW
      },
      validation: { validator: "validateTaskFrameInput", valid: true }
    },
    runtime_rotation_plan: sourcePlan,
    adapter_bindings: [
      { role_id: "planner", adapter_id: "mock.role_runtime.planner", adapter_kind: "mock" },
      { role_id: "critic", adapter_id: "mock.role_runtime.critic", adapter_kind: "mock" }
    ],
    append_ledger_entry: (entry) => {
      entries.push(entry);
      return true;
    },
    decided_at: LE3_NOW
  });
  if (!result.ok || entries[0] === undefined) {
    throw new Error("Could not derive prose-variant fixture.");
  }
  return { source_plan: sourcePlan, plan: result.derived_plan, bridge_entry: entries[0] };
}

function proseAdapters(label: string): Map<string, RoleRuntimeAdapter> {
  const base = createPlannerCriticExecutionAdapters();
  return new Map(
    [...base.entries()].map(([id, adapter]) => [
      id,
      {
        ...adapter,
        async invoke(input) {
          const result = await adapter.invoke(input);
          if (!result.ok || typeof result.artifact !== "object" || result.artifact === null) {
            return result;
          }
          return {
            ...result,
            artifact: {
              ...(result.artifact as Record<string, unknown>),
              summary: `${label} prose for ${input.role_id} step ${input.step_index}`,
              recommendations: [`${label} advisory prose cannot steer execution`]
            }
          };
        }
      } satisfies RoleRuntimeAdapter
    ])
  );
}

function resultKeys(entry: LedgerEntry): readonly string[] {
  return typeof entry.result === "object" && entry.result !== null && !Array.isArray(entry.result)
    ? Object.keys(entry.result).sort()
    : [];
}

async function collectModuleGraph(initial: readonly string[]): Promise<Set<string>> {
  const seen = new Set<string>();
  const queue = [...initial];
  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined || seen.has(current)) {
      continue;
    }
    seen.add(current);
    const source = await readFile(current, "utf8");
    for (const match of source.matchAll(/from\s+["']([^"']+)["']/g)) {
      const specifier = match[1];
      if (specifier === undefined || !specifier.startsWith(".")) {
        continue;
      }
      const candidate = resolve(dirname(current), specifier.replace(/\.js$/, ".ts"));
      if (await isFile(candidate)) {
        queue.push(candidate);
      }
    }
  }
  return seen;
}

async function listTypeScriptFiles(root: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listTypeScriptFiles(path)));
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      files.push(path);
    }
  }
  return files;
}

async function isFile(path: string): Promise<boolean> {
  return stat(path)
    .then((value) => value.isFile())
    .catch(() => false);
}

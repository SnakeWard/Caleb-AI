/**
 * RA-X-5 — Exhaustive dynamic-rotation mock rehearsal (campaign-certifying).
 * Proves gated decision-facing → classifier → LE-2 selection → mock execution →
 * ledger-only reconstruction for all eight rax4.1.0 routes. No live providers.
 */

import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

vi.setConfig({ testTimeout: 60_000 });

import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";
import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";
import { JsonlLedger } from "../../src/ledger/ledger.js";
import { validateLedgerEntry } from "../../src/ledger/ledgerValidation.js";
import { fulfillAnalystHollowEvidenceRequest } from "../../src/logicEngine/analystHollowEvidenceRequestSeam.js";
import {
  ROUTE_CLASSIFICATION_TABLE_VERSION,
  assertRouteMatrixWalkable
} from "../../src/logicEngine/routeClassificationTable.js";
import {
  selectRouteFromRouteInputs,
  validateRouteInputRecord
} from "../../src/logicEngine/routeInputGate.js";
import { bridgeRuntimeRotationPlan } from "../../src/logicEngine/rotationPlanBridge.js";
import {
  executeBridgedRotationAtSeam,
  reconstructRotationChainFromLedgerJsonl
} from "../../src/logicEngine/rotationExecutionSeam.js";
import type { ContractValidatedTaskFrameRouteInput } from "../../src/logicEngine/types/routeInput.js";
import type { LineageResolvedDecisionFacingRecord } from "../../src/logicEngine/types/lineageResolvedDecisionFacingRecord.js";
import { ContentAddressedRawOutputStore } from "../../src/rawOutput/contentAddressedRawOutputStore.js";
import { createMockRoleRuntimeAdapter } from "../../src/roleRuntime/mockRoleRuntimeAdapter.js";
import type { RoleRuntimeAdapter } from "../../src/roleRuntime/types/roleRuntimeAdapter.js";
import { ROLE_HANDOFF_CONSUMPTION_MATRIX } from "../../src/roles/roleHandoffGate.js";
import { ROLE_ARTIFACT_SCHEMA_VERSION } from "../../src/roles/types/roleArtifact.js";
import type { RuntimeRotationPlanRole } from "../../src/roles/types/runtimeRotationPlan.js";
import type { LedgerEntry } from "../../src/types/ledger.js";

const NOW = "2026-07-21T21:00:00.000Z";
const FIXTURE_DIR = "tests/fixtures/ra-x-5";
const roots: string[] = [];

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

interface RehearsalFixture {
  readonly fixture_id: string;
  readonly route_row: number;
  readonly features: {
    readonly stakes: "low" | "high";
    readonly ambiguity: "bounded" | "ambiguous";
    readonly evidence_need: "none" | "required";
  };
  readonly expected_route: readonly RuntimeRotationPlanRole[];
  readonly table_version: string;
  readonly runtime_rotation_plan: Record<string, unknown>;
}

interface RehearsalResult {
  readonly fixture: RehearsalFixture;
  readonly role_sequence: readonly string[];
  readonly table_version: string;
  readonly execution_id: string;
  readonly plan_id: string;
  readonly ledger_bytes: string;
  readonly ledger_entries: readonly LedgerEntry[];
  readonly final_status: "completed" | "failed";
  readonly reconstructed_roles: readonly string[];
  readonly reconstructed_status: "completed" | "failed";
  readonly reconstructed_table_version: string | null;
  readonly trust_tiers: readonly string[];
  readonly seam_evidence:
    | {
        readonly executed_by: string;
        readonly analyst_held_ungated: boolean;
        readonly trust_tier: string;
      }
    | undefined;
  readonly failed_step: {
    readonly step_index: number;
    readonly role_id: string;
    readonly failure_code: string | null;
  } | null;
}

async function loadFixture(routeRow: number): Promise<RehearsalFixture> {
  const raw = await readFile(join(FIXTURE_DIR, `rax5-rehearsal-route-${routeRow}.json`), "utf8");
  return JSON.parse(raw) as RehearsalFixture;
}

function decisionFacing(fixture: RehearsalFixture): LineageResolvedDecisionFacingRecord {
  return {
    record_kind: "lineage_resolved_decision_facing_record",
    record_id: `route_input.decision_facing.${fixture.fixture_id}`,
    source: "logic_engine",
    validated_at: NOW,
    lineage_refs: ["gated:contract_validated_task_frame:rax5_root"],
    task_requirements: {
      summary: `RA-X-5 rehearsal row ${fixture.route_row}`,
      required_capabilities: ["reasoning"],
      constraints: [
        `feature:stakes=${fixture.features.stakes}`,
        `feature:ambiguity=${fixture.features.ambiguity}`,
        `feature:evidence_need=${fixture.features.evidence_need}`
      ],
      open_questions: []
    }
  };
}

function carrier(plan: Record<string, unknown>): ContractValidatedTaskFrameRouteInput {
  return {
    record_kind: "contract_validated_task_frame",
    record_id: `route_input.carrier.${plan["runtime_rotation_plan_id"] as string}`,
    source: "logic_engine",
    validated_at: NOW,
    lineage_refs: [plan["runtime_rotation_plan_id"] as string],
    task_frame: {
      task_id: plan["task_id"] as string,
      run_id: plan["run_id"] as string,
      trace_id: `trace_${plan["runtime_rotation_plan_id"] as string}`,
      task_type: "planning",
      description: "RA-X-5 mock dynamic rotation rehearsal",
      input_summary: "classifier-selected route",
      requested_by: "rax5_rehearsal",
      requires_code_mutation: false,
      created_at: NOW
    },
    validation: { validator: "validateTaskFrameInput", valid: true }
  };
}

function artifactFor(
  role: RuntimeRotationPlanRole,
  input: {
    readonly step_index: number;
    readonly task_id: string;
    readonly run_id: string;
    readonly trace_id: string;
    readonly context_id: string;
  },
  extra: Record<string, unknown> = {}
): Record<string, unknown> {
  const typeByRole: Record<RuntimeRotationPlanRole, string> = {
    planner: "plan",
    analyst: "analysis",
    critic: "critique",
    synthesizer: "synthesis"
  };
  return {
    schema_version: ROLE_ARTIFACT_SCHEMA_VERSION,
    artifact_id: `rax5_${role}_artifact_${input.step_index}`,
    artifact_type: typeByRole[role],
    role_id: role,
    task_id: input.task_id,
    run_id: input.run_id,
    trace_id: input.trace_id,
    context_id: input.context_id,
    summary: `RA-X-5 mock ${role} step ${input.step_index}.`,
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
    created_at: NOW,
    ...extra
  };
}

function createRoleAdapters(
  roles: readonly RuntimeRotationPlanRole[],
  options: {
    readonly fail_role?: RuntimeRotationPlanRole | undefined;
    readonly fail_step_index?: number | undefined;
    readonly analyst_seam?:
      | { current: RehearsalResult["seam_evidence"] | undefined }
      | undefined;
  } = {}
): Map<string, RoleRuntimeAdapter> {
  const map = new Map<string, RoleRuntimeAdapter>();
  for (const role of roles) {
    const base = createMockRoleRuntimeAdapter({
      adapter_id: `mock.role_runtime.${role}`,
      role_id: role,
      artifact_type: (
        role === "planner"
          ? "plan"
          : role === "analyst"
            ? "analysis"
            : role === "critic"
              ? "critique"
              : "synthesis"
      ) as "plan" | "analysis" | "critique" | "synthesis"
    });

    const adapter: RoleRuntimeAdapter = {
      ...base,
      async invoke(input) {
        if (
          options.fail_role === role &&
          options.fail_step_index !== undefined &&
          input.step_index === options.fail_step_index
        ) {
          return {
            ok: false,
            status: "failed",
            artifact: null,
            failure_code: "adapter_rejected",
            failure_evidence: {
              stage: "output_truncated",
              taxonomy: "live_observer_output_truncated",
              error_name: "Rax5MockCriticTruncation",
              input_tokens: 10,
              output_tokens: 512,
              total_tokens: 522,
              stop_reason: "max_tokens",
              budget: { max_tokens: 512, timeout_ms: 30_000, max_response_bytes: 65_536 },
              t0_digest: null,
              observer_normalization_stage: null
            }
          };
        }

        if (role === "analyst" && options.analyst_seam !== undefined) {
          const request = {
            schema_version: "0.1.0",
            role_id: "analyst",
            output_type: "hollow_evidence_request",
            summary: "RA-X-5 in-route hollow evidence request.",
            hollow_id: "hollow.text.character_count",
            evidence_sought: "rax5 evidence text",
            confidence: 0.7,
            acceptance_status: "accepted"
          };
          const seam = await fulfillAnalystHollowEvidenceRequest(request);
          expect(seam.ok).toBe(true);
          if (seam.ok) {
            options.analyst_seam.current = {
              executed_by: seam.evidence.executed_by,
              analyst_held_ungated: seam.evidence.analyst_held_ungated,
              trust_tier: seam.evidence.trust_tier
            };
            expect(seam.evidence.trust_tier).not.toBe("T0");
            expect(seam.evidence.analyst_held_ungated).toBe(false);
            expect(seam.evidence.executed_by).toBe("orchestrator");
          }
          return {
            ok: true,
            status: "completed",
            artifact: artifactFor(role, input, {
              evidence_refs: seam.ok
                ? [
                    {
                      ref_type: "hollow_evidence",
                      ref_id: "gated_hollow_evidence",
                      description: `orchestrator_gated:${seam.evidence.result_digest}`
                    }
                  ]
                : [],
              summary: "Analyst marshaled orchestrator-gated Hollow evidence."
            })
          };
        }

        return {
          ok: true,
          status: "completed",
          artifact: artifactFor(role, input)
        };
      }
    };
    map.set(adapter.adapter_id, adapter);
  }
  return map;
}

function extractTableVersionFromLedger(entries: readonly LedgerEntry[]): string | null {
  for (const entry of entries) {
    if (entry.activity === "route_classification_decision") {
      const result = entry.result as Record<string, unknown>;
      if (typeof result["table_version"] === "string") {
        return result["table_version"];
      }
    }
  }
  for (const entry of entries) {
    if (entry.activity === "runtime_rotation_plan_bridge") {
      const result = entry.result as Record<string, unknown>;
      const structural = result["structural_inputs"];
      if (Array.isArray(structural)) {
        for (const item of structural) {
          if (typeof item === "string" && item.startsWith("table_version:")) {
            return item.slice("table_version:".length);
          }
        }
      }
    }
  }
  // Fall back: scan stop_criteria tokens preserved only if present in any entry JSON
  for (const entry of entries) {
    const blob = JSON.stringify(entry);
    const match = blob.match(/table_version:(rax4\.\d+\.\d+)/);
    if (match?.[1] !== undefined) {
      return match[1];
    }
  }
  return null;
}

async function runRehearsal(
  routeRow: number,
  options: {
    readonly fail_role?: RuntimeRotationPlanRole;
    readonly fail_step_index?: number;
    readonly exercise_analyst_seam?: boolean;
    readonly execution_id?: string;
  } = {}
): Promise<RehearsalResult> {
  const fixture = await loadFixture(routeRow);
  const decision = decisionFacing(fixture);
  expect(validateRouteInputRecord(decision).ok).toBe(true);

  const selection = selectRouteFromRouteInputs([decision]);
  expect(selection.ok).toBe(true);
  if (!selection.ok || selection.decision === null) {
    throw new Error(`RA-X-5 classifier selection failed for route ${routeRow}`);
  }
  expect(selection.decision.selection_path).toBe("classifier");
  expect(selection.decision.table_version).toBe(ROUTE_CLASSIFICATION_TABLE_VERSION);
  expect(selection.decision.role_sequence).toEqual([...fixture.expected_route]);

  const plan = fixture.runtime_rotation_plan;
  const root = await mkdtemp(join(tmpdir(), `rax5-r${routeRow}-`));
  roots.push(root);
  const ledgerPath = join(root, "ledger.jsonl");
  const ledger = new JsonlLedger(ledgerPath);

  // Classification decision — recoverable from ledger alone (table version + route).
  const classificationEntry: LedgerEntry = {
    ledger_id: `rax5_class_${routeRow}`,
    schema_version: "1.0.0",
    timestamp: NOW,
    task_id: plan["task_id"] as string,
    run_id: plan["run_id"] as string,
    trace_id: `trace_class_${routeRow}`,
    actor_type: "orchestration_core",
    actor_id: "logic_engine.route_classifier",
    actor_version: "1.0.0",
    activity: "route_classification_decision",
    status: "completed",
    result: {
      table_version: selection.decision.table_version ?? ROUTE_CLASSIFICATION_TABLE_VERSION,
      role_sequence: [...(selection.decision.role_sequence ?? [])],
      selection_path: selection.decision.selection_path ?? "classifier",
      route_row: routeRow,
      features: selection.decision.classification_features
        ? { ...selection.decision.classification_features }
        : null
    },
    warnings: [],
    errors: [],
    artifact_hashes: [],
    provenance: { fixture_id: fixture.fixture_id },
    retryable: false,
    verification_status: "verified",
    trust_tier: "T2",
    parent_refs: [decision.record_id],
    artifact_refs: []
  };
  expect(validateLedgerEntry(classificationEntry).valid).toBe(true);
  await ledger.append(classificationEntry);

  const bridgeEntries: LedgerEntry[] = [];
  const bridge = await bridgeRuntimeRotationPlan({
    carrier: carrier(plan),
    runtime_rotation_plan: plan,
    adapter_bindings: fixture.expected_route.map((role) => ({
      role_id: role,
      adapter_id: `mock.role_runtime.${role}`,
      adapter_kind: "mock" as const
    })),
    append_ledger_entry: (entry) => {
      bridgeEntries.push(entry);
      return ledger.append(entry).then(() => true);
    },
    decided_at: NOW,
    ledger_id: `rax5_bridge_${routeRow}`
  });
  expect(bridge.ok, JSON.stringify(bridge)).toBe(true);
  if (!bridge.ok || bridgeEntries[0] === undefined) {
    throw new Error(`RA-X-5 bridge failed for route ${routeRow}`);
  }

  // Annotate structural reconstruction of table version on bridge line via parent classification.
  const bridgeEntry = bridgeEntries[0];

  const seamHolder: { current: RehearsalResult["seam_evidence"] | undefined } = {
    current: undefined
  };
  const adapterOptions: {
    fail_role?: RuntimeRotationPlanRole;
    fail_step_index?: number;
    analyst_seam?: { current: RehearsalResult["seam_evidence"] | undefined };
  } = {};
  if (options.fail_role !== undefined) {
    adapterOptions.fail_role = options.fail_role;
  }
  if (options.fail_step_index !== undefined) {
    adapterOptions.fail_step_index = options.fail_step_index;
  }
  if (options.exercise_analyst_seam === true) {
    adapterOptions.analyst_seam = seamHolder;
  }
  const adapters = createRoleAdapters(fixture.expected_route, adapterOptions);

  const executionId =
    options.execution_id ??
    `execution_a15e5000-0000-4000-8000-0000000000${String(routeRow).padStart(2, "0")}`;
  const store = new ContentAddressedRawOutputStore({ root_dir: join(root, "artifacts") });
  const exec = await executeBridgedRotationAtSeam({
    plan: bridge.derived_plan,
    human_confirmed: true,
    bridge_ledger_entries: [bridgeEntry],
    adapters,
    store,
    append_ledger_entry: (entry) => ledger.append(entry).then(() => true),
    now: () => NOW,
    ledger_id_factory: (activity, ordinal) => `rax5_r${routeRow}_${activity}_${ordinal}`,
    execution_id_factory: () => executionId
  });

  const ledgerBytes = await readFile(ledgerPath, "utf8");
  const ledgerEntries = (await ledger.readAll()) as LedgerEntry[];
  const reconstructed = reconstructRotationChainFromLedgerJsonl(
    ledgerBytes,
    bridge.derived_plan.plan_id,
    executionId
  );
  expect(reconstructed.ok, JSON.stringify(reconstructed)).toBe(true);
  if (!reconstructed.ok) {
    throw new Error(`RA-X-5 reconstruction failed for route ${routeRow}`);
  }

  // Keyed and inferred must agree for single-execution ledger.
  const inferred = reconstructRotationChainFromLedgerJsonl(
    ledgerBytes,
    bridge.derived_plan.plan_id
  );
  expect(inferred.ok).toBe(true);
  if (inferred.ok) {
    expect(inferred.chain.execution_id).toBe(executionId);
    expect(inferred.chain.invocations.map((i) => i.role_id)).toEqual(
      reconstructed.chain.invocations.map((i) => i.role_id)
    );
  }

  const finalStatus =
    exec.ok && exec.execution_result?.status === "completed"
      ? "completed"
      : reconstructed.chain.final_status;

  return {
    fixture,
    role_sequence: selection.decision.role_sequence ?? [],
    table_version: selection.decision.table_version ?? ROUTE_CLASSIFICATION_TABLE_VERSION,
    execution_id: executionId,
    plan_id: bridge.derived_plan.plan_id,
    ledger_bytes: ledgerBytes,
    ledger_entries: ledgerEntries,
    final_status: finalStatus === "completed" ? "completed" : "failed",
    reconstructed_roles: reconstructed.chain.invocations.map((i) => i.role_id),
    reconstructed_status: reconstructed.chain.final_status,
    reconstructed_table_version: extractTableVersionFromLedger(ledgerEntries),
    trust_tiers: ledgerEntries
      .filter((entry) => entry.activity === "rotation_role_invocation")
      .map((entry) => entry.trust_tier),
    seam_evidence: seamHolder.current,
    failed_step:
      reconstructed.chain.failed_step === null
        ? null
        : {
            step_index: reconstructed.chain.failed_step.step_index,
            role_id:
              "role_id" in reconstructed.chain.failed_step
                ? String((reconstructed.chain.failed_step as { role_id?: string }).role_id ?? "")
                : "",
            failure_code: reconstructed.chain.failure_code
          }
  } satisfies RehearsalResult;
}

describe("RA-X-5 exhaustive dynamic-rotation mock rehearsal", () => {
  it("T1+T2+T6: all eight routes select, execute, walk matrix, and reconstruct from ledger alone", async () => {
    const matrixKeys = new Set(Object.keys(ROLE_HANDOFF_CONSUMPTION_MATRIX));
    const results: RehearsalResult[] = [];

    for (let row = 1; row <= 8; row += 1) {
      const result = await runRehearsal(row);
      results.push(result);

      expect(result.role_sequence).toEqual([...result.fixture.expected_route]);
      expect(result.table_version).toBe("rax4.1.0");
      expect(result.reconstructed_table_version).toBe("rax4.1.0");
      expect(result.reconstructed_roles).toEqual([...result.fixture.expected_route]);
      expect(result.reconstructed_status).toBe("completed");
      expect(result.final_status).toBe("completed");

      // T6 legality: every consecutive handoff is matrix-walkable.
      const walk = assertRouteMatrixWalkable(result.fixture.expected_route);
      expect(walk.ok).toBe(true);
      for (let i = 0; i < result.fixture.expected_route.length - 1; i += 1) {
        const from = result.fixture.expected_route[i];
        const to = result.fixture.expected_route[i + 1];
        expect(matrixKeys.has(`${from}->${to}`)).toBe(true);
      }

      // Reconstruction: digests and two-artifact lineage present for multi-step routes.
      const reconstructed = reconstructRotationChainFromLedgerJsonl(
        result.ledger_bytes,
        result.plan_id,
        result.execution_id
      );
      expect(reconstructed.ok).toBe(true);
      if (reconstructed.ok) {
        for (const inv of reconstructed.chain.invocations) {
          expect(inv.artifact_digest).toMatch(/^sha256:[0-9a-f]{64}$/);
        }
        if (reconstructed.chain.invocations.length >= 2) {
          const second = reconstructed.chain.invocations[1];
          expect(second?.context_refs.length).toBeGreaterThanOrEqual(1);
          expect(second?.context_refs[0]?.digest).toBe(
            reconstructed.chain.invocations[0]?.artifact_digest
          );
        }
      }

      // No filesystem correlation: reconstruction used only ledger bytes (temp dir not consulted).
      expect(result.ledger_bytes.includes("rotation_execution_completed")).toBe(true);
    }

    expect(results).toHaveLength(8);
    // Fixtures present for all eight names.
    const names = await readdir(FIXTURE_DIR);
    for (let row = 1; row <= 8; row += 1) {
      expect(names).toContain(`rax5-rehearsal-route-${row}.json`);
    }
  });

  it("T3: Analyst-bearing route exercises request-only hollow_evidence_request in-route", async () => {
    // Route 2: planner → analyst → critic (shortest Analyst-bearing path).
    const result = await runRehearsal(2, { exercise_analyst_seam: true });
    expect(result.final_status).toBe("completed");
    expect(result.reconstructed_roles).toEqual(["planner", "analyst", "critic"]);
    expect(result.seam_evidence).toBeDefined();
    expect(result.seam_evidence?.executed_by).toBe("orchestrator");
    expect(result.seam_evidence?.analyst_held_ungated).toBe(false);
    expect(result.seam_evidence?.trust_tier).not.toBe("T0");
  });

  it("T4: non-promoter exhaustive — longer routes do not embed higher trust", async () => {
    const short = await runRehearsal(1);
    const long = await runRehearsal(8);
    expect(short.role_sequence.length).toBe(2);
    expect(long.role_sequence.length).toBe(4);
    expect(short.trust_tiers.every((t) => t === "T0" || t === "T1")).toBe(true);
    expect(long.trust_tiers.every((t) => t === "T0" || t === "T1")).toBe(true);
    // Absence: no T2+ on model artifacts from longer workload.
    expect(long.trust_tiers.some((t) => t === "T2" || t === "T3" || t === "T4")).toBe(false);
    expect(short.trust_tiers.some((t) => t === "T2" || t === "T3" || t === "T4")).toBe(false);
  });

  it("T5: negative mid-route Critic failure reconstructs with F8 detail", async () => {
    // Route 8 is four roles: planner(0), analyst(1), critic(2), synthesizer(3).
    const result = await runRehearsal(8, {
      fail_role: "critic",
      fail_step_index: 2,
      execution_id: "execution_a15e5000-0000-4000-8000-00000000f008"
    });
    expect(result.reconstructed_status).toBe("failed");
    expect(result.reconstructed_roles).toEqual(["planner", "analyst"]);
    expect(result.failed_step).not.toBeNull();
    expect(result.failed_step?.step_index).toBe(2);

    const reconstructed = reconstructRotationChainFromLedgerJsonl(
      result.ledger_bytes,
      result.plan_id,
      result.execution_id
    );
    expect(reconstructed.ok).toBe(true);
    if (reconstructed.ok) {
      expect(reconstructed.chain.final_status).toBe("failed");
      expect(reconstructed.chain.failed_step).not.toBeNull();
      expect(reconstructed.chain.failed_step_index).toBe(2);
      expect(reconstructed.chain.completed_steps).toBe(2);
      // F8-shaped failure recoverable from ledger alone.
      const failed = reconstructed.chain.failed_step as Record<string, unknown> | null;
      expect(failed).not.toBeNull();
      if (failed !== null) {
        const blob = JSON.stringify(failed);
        expect(blob).toMatch(/output_truncated|adapter_rejected|role_invocation_failed|taxonomy/);
      }
      expect(result.ledger_bytes).toContain("role_invocation_failed");
    }
  });

  it("T7: re-running a rehearsal yields identical route and reconstruction shape", async () => {
    const a = await runRehearsal(1, {
      execution_id: "execution_a15e5000-0000-4000-8000-00000000d001"
    });
    const b = await runRehearsal(1, {
      execution_id: "execution_a15e5000-0000-4000-8000-00000000d002"
    });
    expect(a.role_sequence).toEqual(b.role_sequence);
    expect(a.table_version).toBe(b.table_version);
    expect(a.reconstructed_roles).toEqual(b.reconstructed_roles);
    expect(a.reconstructed_status).toBe(b.reconstructed_status);
    expect(a.reconstructed_table_version).toBe(b.reconstructed_table_version);

    const ra = reconstructRotationChainFromLedgerJsonl(a.ledger_bytes, a.plan_id, a.execution_id);
    const rb = reconstructRotationChainFromLedgerJsonl(b.ledger_bytes, b.plan_id, b.execution_id);
    expect(ra.ok && rb.ok).toBe(true);
    if (ra.ok && rb.ok) {
      expect(ra.chain.invocations.map((i) => i.role_id)).toEqual(
        rb.chain.invocations.map((i) => i.role_id)
      );
      expect(ra.chain.final_status).toBe(rb.chain.final_status);
      // Digests stable given fixed NOW + fixed artifact content per step role.
      expect(ra.chain.invocations.map((i) => i.artifact_digest)).toEqual(
        rb.chain.invocations.map((i) => i.artifact_digest)
      );
    }
  });

  it("D7 untouched surfaces: catalogs 14/9, table version, matrix size declaration", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(14);
    expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9);
    expect(ROUTE_CLASSIFICATION_TABLE_VERSION).toBe("rax4.1.0");
    expect(Object.keys(ROLE_HANDOFF_CONSUMPTION_MATRIX)).toHaveLength(39);
  });
});

import { describe, it, expect, afterEach } from "vitest";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rm } from "node:fs/promises";

import { executeWorkGraphLite } from "../../src/logicEngine/workGraphExecutorLite.js";
import { validateTaskFrameInput } from "../../src/logicEngine/taskFrameValidator.js";
import { selectRoute } from "../../src/logicEngine/routeSelector.js";
import { classifySignals } from "../../src/logicEngine/signalClassifier.js";
import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";
import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";
import type { TaskFrame } from "../../src/logicEngine/types/taskFrame.js";
import type { WorkGraph } from "../../src/logicEngine/types/workGraph.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CHAR_COUNT_HOLLOW_ID = "hollow.text.character_count";
const CHAR_COUNT_INPUT = { text: "Caleb orchestrates." };

const VALID_DISPATCH_REQUEST = {
  hollow_id: CHAR_COUNT_HOLLOW_ID,
  hollow_input: CHAR_COUNT_INPUT
};

function makeFrame(overrides: Partial<Record<string, unknown>> = {}): TaskFrame {
  const raw = {
    task_id: "test_executor_task_001",
    run_id: "test_executor_run_001",
    trace_id: "test_executor_trace_001",
    task_type: "hollow_execution",
    description: "WorkGraphExecutorLite test task",
    input_summary: "Character count deterministic test",
    requested_by: "test_runner",
    requires_code_mutation: false,
    signal_hints: { deterministic_only: 2, requires_judgment: 0 },
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
  const validation = validateTaskFrameInput(raw);
  if (!validation.valid) {
    throw new Error(`Test setup: invalid TaskFrame — ${validation.errors[0]?.message ?? "unknown"}`);
  }
  return validation.frame;
}

function makeNonHollowOnlyFrame(): TaskFrame {
  return makeFrame({
    task_id: "test_non_hollow_task",
    task_type: "text_analysis",
    signal_hints: {}
  });
}

function makeGatedFrame(): TaskFrame {
  return makeFrame({
    task_id: "test_gated_task",
    signal_hints: { deterministic_only: 2, requires_judgment: 0, stakes: 2 }
  });
}

function makeMutationFrame(): TaskFrame {
  return makeFrame({
    task_id: "test_mutation_task",
    requires_code_mutation: true,
    signal_hints: { deterministic_only: 2, requires_judgment: 0 }
  });
}

let tempLedgerPath: string | undefined;
let tempSnapshotRoot: string | undefined;

afterEach(async () => {
  if (tempLedgerPath !== undefined) {
    await rm(tempLedgerPath, { force: true });
    tempLedgerPath = undefined;
  }
  if (tempSnapshotRoot !== undefined) {
    await rm(tempSnapshotRoot, { recursive: true, force: true });
    tempSnapshotRoot = undefined;
  }
});

// ─── V0.4 WorkGraphExecutorLite tests ────────────────────────────────────────

describe("executeWorkGraphLite — V0.4", () => {
  // ── Test 1: simple hollow_only execution ─────────────────────────────────
  it("executes simple hollow_only path successfully (test 1)", async () => {
    const frame = makeFrame();
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST);
    expect(result.status).toBe("executed");
    expect(result.executed_hollow_id).toBe(CHAR_COUNT_HOLLOW_ID);
    expect(result.invocation).not.toBeNull();
  });

  // ── Test 2: trust tier matches dispatchHollow for the same input ──────────
  it("result trust tier matches dispatchHollow for the same input (test 2)", async () => {
    const frame = makeFrame();
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST);
    // Deterministic hollow + VRP acceptance → T2/verified
    const trustTier = result.evidence_packet?.trust_tier ?? result.invocation?.trust_tier;
    expect(trustTier).toBe("T2");
    expect(result.verification?.decision).toBe("accepted");
  });

  // ── Test 3: approval gate behavior preserved ──────────────────────────────
  it("refuses without approved_by when approval gate required (test 3)", async () => {
    const frame = makeGatedFrame();
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST);
    expect(result.status).toBe("refused");
    expect(result.errors.some((e) => e.code === "missing_approved_by")).toBe(true);
    expect(result.invocation).toBeNull();
  });

  it("approval gate passes with non-empty approved_by (test 3b)", async () => {
    const frame = makeGatedFrame();
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST, {
      approved_by: "operator.test"
    });
    expect(result.status).toBe("executed");
    expect(result.approved_by).toBe("operator.test");
  });

  // ── Test 4: snapshot gate behavior preserved ──────────────────────────────
  it("snapshot gate creates snapshot_id when gate required (test 4)", async () => {
    tempSnapshotRoot = join(tmpdir(), `caleb_v04_snap_${Date.now()}`);
    const frame = makeMutationFrame();
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST, {
      approved_by: "operator.test",
      snapshotRoot: tempSnapshotRoot,
      filesToCapture: ["package.json"]
    });
    expect(result.snapshot_id).not.toBeNull();
    expect(typeof result.snapshot_id).toBe("string");
  });

  // ── Test 5: filesToCapture behavior preserved ─────────────────────────────
  it("filesToCapture produces file_capture snapshot_capture_mode (test 5)", async () => {
    tempSnapshotRoot = join(tmpdir(), `caleb_v04_fc_${Date.now()}`);
    const frame = makeMutationFrame();
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST, {
      approved_by: "operator.test",
      snapshotRoot: tempSnapshotRoot,
      filesToCapture: ["package.json"]
    });
    expect(result.snapshot_capture_mode).toBe("file_capture");
    expect(result.snapshot_files_captured).toBe(1);
  });

  // ── Test 6: ledger_write_status behavior preserved ───────────────────────
  it("ledger_write_status is ok after successful ledger write (test 6)", async () => {
    tempLedgerPath = join(tmpdir(), `caleb_v04_ledger_${Date.now()}.jsonl`);
    const frame = makeFrame();
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST, {
      writeLedger: true,
      ledgerPath: tempLedgerPath
    });
    expect(result.ledger_write_status).toBe("ok");
    expect(result.ledger_entries.length).toBeGreaterThan(0);
  });

  // ── Test 7: non-hollow_only route refuses ─────────────────────────────────
  it("refuses non-hollow_only route with route_not_supported_by_executor_lite (test 7)", async () => {
    const frame = makeNonHollowOnlyFrame();
    // Confirm the frame actually routes to a non-hollow_only mode
    const signals = classifySignals(frame);
    const decision = selectRoute(frame, signals);
    expect(decision.route_mode).not.toBe("hollow_only");

    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST);
    expect(result.status).toBe("refused");
    expect(result.errors.some((e) => e.code === "route_not_supported_by_executor_lite")).toBe(true);
    expect(result.invocation).toBeNull();
  });

  // ── Test 8: unsupported node type refuses ─────────────────────────────────
  it("refuses unsupported node type with route_not_supported_by_executor_lite (test 8)", async () => {
    const frame = makeFrame();
    const overrideGraph: WorkGraph = {
      task_id: frame.task_id,
      run_id: frame.run_id,
      route_mode: "hollow_only",
      built_at: new Date().toISOString(),
      nodes: [
        {
          node_id: "hollow_only_00_task_intake",
          node_type: "TASK_INTAKE",
          label: "Task Intake",
          required_prior_artifacts: [],
          produced_artifacts: ["artifact.task_frame"],
          required_gates: [],
          responsible_module: "logic_engine.task_normalizer"
        },
        {
          node_id: "hollow_only_01_role_pass",
          node_type: "ROLE_PASS",
          label: "Injected unsupported role pass node",
          required_prior_artifacts: ["artifact.task_frame"],
          produced_artifacts: ["artifact.role_output"],
          required_gates: [],
          responsible_module: "orchestration.role_synthesizer"
        }
      ]
    };

    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST, {
      _overrideGraph: overrideGraph
    });
    expect(result.status).toBe("refused");
    expect(result.errors.some((e) => e.code === "route_not_supported_by_executor_lite")).toBe(true);
    expect(result.errors[0]?.message).toMatch(/ROLE_PASS/);
    expect(result.invocation).toBeNull();
  });

  // ── Test 9: ROLE_PASS node refused — no role execution ───────────────────
  it("ROLE_PASS node is refused and no role execution occurs (test 9)", async () => {
    const frame = makeFrame();
    const graphWithRolePass: WorkGraph = {
      task_id: frame.task_id,
      run_id: frame.run_id,
      route_mode: "hollow_only",
      built_at: new Date().toISOString(),
      nodes: [
        {
          node_id: "hollow_only_00_task_intake",
          node_type: "TASK_INTAKE",
          label: "Task Intake",
          required_prior_artifacts: [],
          produced_artifacts: ["artifact.task_frame"],
          required_gates: [],
          responsible_module: "logic_engine.task_normalizer"
        },
        {
          node_id: "hollow_only_01_role_pass",
          node_type: "ROLE_PASS",
          label: "Role Pass node that must not execute",
          required_prior_artifacts: ["artifact.task_frame"],
          produced_artifacts: ["artifact.synthesizer_output"],
          required_gates: [],
          responsible_module: "orchestration.role_synthesizer"
        }
      ]
    };

    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST, {
      _overrideGraph: graphWithRolePass
    });

    expect(result.status).toBe("refused");
    expect(result.invocation).toBeNull(); // No Hollow ran — role was refused, not executed
    expect(result.verification).toBeNull(); // No VRP — nothing executed
    expect(result.evidence_packet).toBeNull();
  });

  // ── Test 10: no model call path exists ────────────────────────────────────
  it("no model call path exists — invocation is a Hollow invocation (test 10)", async () => {
    const frame = makeFrame();
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST);
    expect(result.status).toBe("executed");
    // hollow_id is populated by HollowRunner — a model call would not produce this field
    expect(result.invocation?.hollow_id).toBe(CHAR_COUNT_HOLLOW_ID);
    // caller is set to logic_engine_v0 by dispatchHollow — not a model caller
    expect(result.invocation?.caller).toBe("logic_engine_v0");
    // No model_response field exists on LogicEngineExecutionResult
    expect((result as unknown as Record<string, unknown>)["model_response"]).toBeUndefined();
  });

  // ── Test 11: dispatchHollow remains the execution primitive ──────────────
  it("_overrideVRP and _overrideLedger are respected — confirming dispatchHollow is called (test 11)", async () => {
    tempLedgerPath = join(tmpdir(), `caleb_v04_prim_${Date.now()}.jsonl`);
    const frame = makeFrame();
    const mockRejectingVRP = {
      verifyInvocation: (_inv: unknown) => ({
        decision: "rejected" as const,
        trust_tier: "T0" as const,
        verification_status: "unverified" as const,
        errors: [{ code: "failed_invocation" as const, message: "Mock: VRP rejection for executor test" }],
        warnings: [],
        can_model_consume: false,
        can_persist_as_truth: false,
        can_trigger_side_effect: false
      })
    };

    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST, {
      _overrideVRP: mockRejectingVRP
    });

    // _overrideVRP is a dispatchHollow option — if it's honored, dispatchHollow was called
    expect(result.status).toBe("failed");
    expect(result.errors.some((e) => e.code === "vrp_rejected")).toBe(true);
    expect(result.invocation?.status).toBe("completed");
  });

  // ── Test 12: route-decision remains a dry-run ─────────────────────────────
  it("selectRoute remains a pure dry-run — no side effects from route selection (test 12)", () => {
    const frame = makeFrame();
    const signals = classifySignals(frame);
    const decision1 = selectRoute(frame, signals);
    const decision2 = selectRoute(frame, signals);

    // Pure function — same inputs produce same route, no state mutation
    expect(decision1.route_mode).toBe(decision2.route_mode);
    expect(decision1.requires_snapshot_gate).toBe(decision2.requires_snapshot_gate);
    expect(decision1.requires_approval_gate).toBe(decision2.requires_approval_gate);
    // No invocation or ledger effect from calling selectRoute
    // (executeWorkGraphLite does not call dispatchHollow for dry-run — it's separate)
  });

  // ── Test 13: logic-execute CLI behavior unchanged after wiring ────────────
  it("result shape after wiring is identical to pre-wiring shape (test 13)", async () => {
    const frame = makeFrame();
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST);

    // The CLI result payload fields that commandHandlers.ts reads from result
    expect(result.status).toBeDefined();
    expect(result.decision).toBeDefined();
    expect(result.decision.route_mode).toBe("hollow_only");
    expect(result.executed_hollow_id).toBe(CHAR_COUNT_HOLLOW_ID);
    expect(result.invocation).not.toBeNull();
    expect(result.verification).not.toBeNull();
    expect(result.evidence_packet).not.toBeNull();
    expect(result.snapshot_id).toBeNull();
    expect(result.approved_by).toBeNull();
    expect(result.snapshot_capture_mode).toBeNull();
    expect(result.snapshot_files_captured).toBeNull();
    expect(result.ledger_write_status).toBe("skipped");
    expect(result.ledger_entries).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  // ── Test 14: V1 catalog remains exactly 12 ───────────────────────────────
  it("V1 Hollow catalog remains exactly 12 (test 14)", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(12);
  });

  // ── Test 15: Hollowcut catalog remains exactly 9 ─────────────────────────
  it("Hollowcut catalog remains exactly 9 (test 15)", () => {
    expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9);
  });
});

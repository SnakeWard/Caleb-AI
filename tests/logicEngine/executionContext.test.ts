import { describe, it, expect, afterEach } from "vitest";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rm } from "node:fs/promises";

import { executeWorkGraphLite } from "../../src/logicEngine/workGraphExecutorLite.js";
import { dispatchHollow } from "../../src/logicEngine/hollowDispatcher.js";
import { validateTaskFrameInput } from "../../src/logicEngine/taskFrameValidator.js";
import { classifySignals } from "../../src/logicEngine/signalClassifier.js";
import { selectRoute } from "../../src/logicEngine/routeSelector.js";
import { buildWorkGraph } from "../../src/logicEngine/workGraphBuilder.js";
import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";
import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";
import type { TaskFrame } from "../../src/logicEngine/types/taskFrame.js";
import type { WorkGraph } from "../../src/logicEngine/types/workGraph.js";
import type { LogicEngineTelemetryEvent } from "../../src/logicEngine/types/telemetry.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const CHAR_COUNT_HOLLOW_ID = "hollow.text.character_count";
const CHAR_COUNT_INPUT = { text: "Caleb orchestrates." };

const VALID_DISPATCH_REQUEST = {
  hollow_id: CHAR_COUNT_HOLLOW_ID,
  hollow_input: CHAR_COUNT_INPUT
};

function makeFrame(overrides: Partial<Record<string, unknown>> = {}): TaskFrame {
  const raw = {
    task_id: "test_ctx_task_001",
    run_id: "test_ctx_run_001",
    trace_id: "test_ctx_trace_001",
    task_type: "hollow_execution",
    description: "ExecutionContext V0.5 test task",
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

function makeGatedFrame(): TaskFrame {
  return makeFrame({
    task_id: "test_ctx_gated_task",
    signal_hints: { deterministic_only: 2, requires_judgment: 0, stakes: 2 }
  });
}

function makeMutationFrame(): TaskFrame {
  return makeFrame({
    task_id: "test_ctx_mutation_task",
    requires_code_mutation: true,
    signal_hints: { deterministic_only: 2, requires_judgment: 0 }
  });
}

function makeNonHollowOnlyFrame(): TaskFrame {
  return makeFrame({
    task_id: "test_ctx_non_hollow_task",
    task_type: "text_analysis",
    signal_hints: {}
  });
}

function isValidIso(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const d = new Date(value);
  return !isNaN(d.getTime()) && value.includes("T");
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

// ─── V0.5 ExecutionContext tests ──────────────────────────────────────────────

describe("executeWorkGraphLite — V0.5 ExecutionContext", () => {
  // ── Test 1: execution_context is defined ─────────────────────────────────
  it("execution_context is defined on result from executeWorkGraphLite (test 1)", async () => {
    const frame = makeFrame();
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST);
    expect(result.execution_context).toBeDefined();
  });

  // ── Test 2: schema_version ───────────────────────────────────────────────
  it("execution_context.schema_version is '0.5.0' (test 2)", async () => {
    const frame = makeFrame();
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST);
    expect(result.execution_context?.schema_version).toBe("0.5.0");
  });

  // ── Test 3: context_id is a non-empty string ─────────────────────────────
  it("context_id is a non-empty string (test 3)", async () => {
    const frame = makeFrame();
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST);
    const ctx = result.execution_context;
    expect(typeof ctx?.context_id).toBe("string");
    expect(ctx?.context_id.length).toBeGreaterThan(0);
  });

  // ── Test 4: context_id is unique across two executions ───────────────────
  it("context_id is unique across two executions (test 4)", async () => {
    const frame = makeFrame();
    const [r1, r2] = await Promise.all([
      executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST),
      executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST)
    ]);
    expect(r1.execution_context?.context_id).not.toBe(r2.execution_context?.context_id);
  });

  // ── Test 5: task_id, run_id, trace_id match the frame ───────────────────
  it("task_id, run_id, trace_id match the frame (test 5)", async () => {
    const frame = makeFrame();
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST);
    const ctx = result.execution_context;
    expect(ctx?.task_id).toBe(frame.task_id);
    expect(ctx?.run_id).toBe(frame.run_id);
    expect(ctx?.trace_id).toBe(frame.trace_id);
  });

  // ── Test 6: signal_score and route_mode are populated ───────────────────
  it("signal_score and route_mode are populated (test 6)", async () => {
    const frame = makeFrame();
    const signals = classifySignals(frame);
    const decision = selectRoute(frame, signals);

    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST);
    const ctx = result.execution_context;
    expect(ctx?.signal_score).toBe(signals.signal_score);
    expect(ctx?.route_mode).toBe(decision.route_mode);
  });

  // ── Test 7: work_graph_node_count equals graph.nodes.length ─────────────
  it("work_graph_node_count equals graph.nodes.length (test 7)", async () => {
    const frame = makeFrame();
    const signals = classifySignals(frame);
    const decision = selectRoute(frame, signals);
    const graph = buildWorkGraph(frame, decision);

    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST);
    expect(result.execution_context?.work_graph_node_count).toBe(graph.nodes.length);
  });

  // ── Test 8: gates_required false/false for ungated route ─────────────────
  it("gates_required is false/false for ungated hollow_only route (test 8)", async () => {
    const frame = makeFrame();
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST);
    const ctx = result.execution_context;
    expect(ctx?.gates_required.snapshot).toBe(false);
    expect(ctx?.gates_required.approval).toBe(false);
  });

  // ── Test 9: gates_required reflects approval gate ────────────────────────
  it("gates_required.approval is true for gated frame (test 9)", async () => {
    const frame = makeGatedFrame();
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST);
    expect(result.execution_context?.gates_required.approval).toBe(true);
  });

  // ── Test 10: gates_required reflects snapshot gate ───────────────────────
  it("gates_required.snapshot is true for mutation frame (test 10)", async () => {
    const frame = makeMutationFrame();
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST, {
      approved_by: "operator.test"
    });
    expect(result.execution_context?.gates_required.snapshot).toBe(true);
  });

  // ── Test 11: gates_satisfied.snapshot after snapshot-gated execution ─────
  it("gates_satisfied.snapshot is true after snapshot-gated execution (test 11)", async () => {
    tempSnapshotRoot = join(tmpdir(), `caleb_ctx_snap_${Date.now()}`);
    const frame = makeMutationFrame();
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST, {
      approved_by: "operator.test",
      snapshotRoot: tempSnapshotRoot,
      filesToCapture: ["package.json"]
    });
    expect(result.execution_context?.gates_satisfied.snapshot).toBe(true);
  });

  // ── Test 12: gates_satisfied.approval after approval-gated execution ─────
  it("gates_satisfied.approval is true after approval-gated execution (test 12)", async () => {
    const frame = makeGatedFrame();
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST, {
      approved_by: "operator.test"
    });
    expect(result.execution_context?.gates_satisfied.approval).toBe(true);
  });

  // ── Test 13: ledger_write_status matches result.ledger_write_status ──────
  it("ledger_write_status in context matches result.ledger_write_status (test 13)", async () => {
    tempLedgerPath = join(tmpdir(), `caleb_ctx_ledger_${Date.now()}.jsonl`);
    const frame = makeFrame();
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST, {
      writeLedger: true,
      ledgerPath: tempLedgerPath
    });
    expect(result.execution_context?.ledger_write_status).toBe(result.ledger_write_status);
    expect(result.execution_context?.ledger_write_status).toBe("ok");
  });

  // ── Test 14: warnings match result.warnings ──────────────────────────────
  it("warnings in context match result.warnings (test 14)", async () => {
    const frame = makeFrame();
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST);
    expect(result.execution_context?.warnings).toEqual(result.warnings);
  });

  // ── Test 15: errors match result.errors ─────────────────────────────────
  it("errors in context match result.errors (test 15)", async () => {
    const frame = makeFrame();
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST);
    expect(result.execution_context?.errors).toEqual(result.errors);
  });

  // ── Test 16: context does not contain hollow_input ───────────────────────
  it("context does not contain hollow_input (test 16)", async () => {
    const frame = makeFrame();
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST);
    const ctx = result.execution_context as unknown as Record<string, unknown>;
    expect(ctx["hollow_input"]).toBeUndefined();
  });

  // ── Test 17: context does not contain input_payload ──────────────────────
  it("context does not contain input_payload (test 17)", async () => {
    const frame = makeFrame();
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST);
    const ctx = result.execution_context as unknown as Record<string, unknown>;
    expect(ctx["input_payload"]).toBeUndefined();
  });

  // ── Test 18: successful execution status unchanged ───────────────────────
  it("successful execution status is still 'executed' with context attached (test 18)", async () => {
    const frame = makeFrame();
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST);
    expect(result.status).toBe("executed");
    expect(result.invocation).not.toBeNull();
    expect(result.execution_context?.dispatch_status).toBe("executed");
  });

  // ── Test 19: refused result still gets execution_context ─────────────────
  it("refused result from executeWorkGraphLite still has execution_context (test 19)", async () => {
    const frame = makeGatedFrame();
    // Refuse at approval gate — dispatchHollow refuses, executor enriches
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST);
    expect(result.status).toBe("refused");
    expect(result.execution_context).toBeDefined();
    expect(result.execution_context?.dispatch_status).toBe("refused");
  });

  // ── Test 20: failed execution gets dispatch_status 'failed' ──────────────
  it("failed execution gets dispatch_status 'failed' (test 20)", async () => {
    const frame = makeFrame();
    const mockRejectingVRP = {
      verifyInvocation: (_inv: unknown) => ({
        decision: "rejected" as const,
        trust_tier: "T0" as const,
        verification_status: "unverified" as const,
        errors: [{ code: "failed_invocation" as const, message: "Mock: VRP rejection for context test" }],
        warnings: [],
        can_model_consume: false,
        can_persist_as_truth: false,
        can_trigger_side_effect: false
      })
    };
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST, {
      _overrideVRP: mockRejectingVRP
    });
    expect(result.status).toBe("failed");
    expect(result.execution_context?.dispatch_status).toBe("failed");
  });

  // ── Test 21: supported_by_executor_lite true for hollow_only path ─────────
  it("supported_by_executor_lite is true for supported hollow_only execution (test 21)", async () => {
    const frame = makeFrame();
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST);
    expect(result.execution_context?.supported_by_executor_lite).toBe(true);
  });

  // ── Test 22: supported_by_executor_lite false for unsupported route ───────
  it("supported_by_executor_lite is false for unsupported route/node (test 22)", async () => {
    const frame = makeFrame();
    const unsupportedGraph: WorkGraph = {
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
          label: "Unsupported role pass",
          required_prior_artifacts: ["artifact.task_frame"],
          produced_artifacts: ["artifact.role_output"],
          required_gates: [],
          responsible_module: "orchestration.role_synthesizer"
        }
      ]
    };
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST, {
      _overrideGraph: unsupportedGraph
    });
    expect(result.status).toBe("refused");
    expect(result.execution_context?.supported_by_executor_lite).toBe(false);
  });

  // ── Test 23: created_at is valid ISO ─────────────────────────────────────
  it("created_at is a valid ISO datetime string (test 23)", async () => {
    const frame = makeFrame();
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST);
    expect(isValidIso(result.execution_context?.created_at)).toBe(true);
  });

  // ── Test 24: completed_at is valid ISO ───────────────────────────────────
  it("completed_at is a valid ISO datetime string (test 24)", async () => {
    const frame = makeFrame();
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST);
    expect(isValidIso(result.execution_context?.completed_at)).toBe(true);
  });

  // ── Test 25: created_at <= completed_at ──────────────────────────────────
  it("created_at is before or equal to completed_at (test 25)", async () => {
    const frame = makeFrame();
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST);
    const ctx = result.execution_context;
    if (ctx === undefined) throw new Error("execution_context missing");
    const start = new Date(ctx.created_at).getTime();
    const end = new Date(ctx.completed_at).getTime();
    expect(start).toBeLessThanOrEqual(end);
  });

  // ── Test 26: route-decision path has no execution_context ────────────────
  // The route-decision CLI command calls selectRoute directly, not executeWorkGraphLite.
  // selectRoute is a pure function and returns a RouteDecision — no execution_context.
  it("selectRoute result has no execution_context — it is not a LogicEngineExecutionResult (test 26)", () => {
    const frame = makeFrame();
    const signals = classifySignals(frame);
    const decision = selectRoute(frame, signals);
    // RouteDecision does not have execution_context — confirm the field is absent
    expect((decision as unknown as Record<string, unknown>)["execution_context"]).toBeUndefined();
  });

  // ── Test 27: role_artifacts is always [] ─────────────────────────────────
  it("role_artifacts is always an empty array in V0.5 (test 27)", async () => {
    const frame = makeFrame();
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST);
    expect(result.execution_context?.role_artifacts).toEqual([]);
    expect(result.execution_context?.role_artifacts).toHaveLength(0);
  });

  // ── Test 28: V1 catalog remains exactly 12 ───────────────────────────────
  it("V1 Hollow catalog remains exactly 12 (test 28)", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(12);
  });

  // ── Test 29: Hollowcut catalog remains exactly 9 ─────────────────────────
  it("Hollowcut catalog remains exactly 9 (test 29)", () => {
    expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9);
  });

  it("dispatchHollow still does not produce execution_context directly (test 30)", async () => {
    const frame = makeFrame();
    const signals = classifySignals(frame);
    const decision = selectRoute(frame, signals);
    const graph = buildWorkGraph(frame, decision);
    const result = await dispatchHollow(frame, signals, decision, graph, VALID_DISPATCH_REQUEST);

    expect((result as unknown as Record<string, unknown>)["execution_context"]).toBeUndefined();
  });

  it("no-sink telemetry changes no execution behavior (test 31)", async () => {
    const frame = makeFrame();
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST);

    expect(result.status).toBe("executed");
    expect(result.execution_context?.role_artifacts).toEqual([]);
  });

  it("telemetry sink receives stable success events with one context_id (test 32)", async () => {
    const events: LogicEngineTelemetryEvent[] = [];
    const frame = makeFrame();
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST, {
      telemetrySink: (event) => {
        events.push(event);
      }
    });

    expect(result.status).toBe("executed");
    expect(events.map((event) => event.event_type)).toEqual([
      "logic_engine.execution_started",
      "logic_engine.route_selected",
      "logic_engine.workgraph_built",
      "logic_engine.dispatch_started",
      "logic_engine.dispatch_completed",
      "logic_engine.execution_completed"
    ]);
    expect(new Set(events.map((event) => event.context_id)).size).toBe(1);
    expect(events[0]?.context_id).toBe(result.execution_context?.context_id);
  });

  it("telemetry sink receives execution_refused on refusal (test 33)", async () => {
    const events: LogicEngineTelemetryEvent[] = [];
    const frame = makeGatedFrame();
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST, {
      telemetrySink: (event) => {
        events.push(event);
      }
    });

    expect(result.status).toBe("refused");
    expect(events.map((event) => event.event_type)).toContain("logic_engine.execution_refused");
  });

  it("telemetry sink receives execution_failed on failure (test 34)", async () => {
    const events: LogicEngineTelemetryEvent[] = [];
    const frame = makeFrame();
    const mockRejectingVRP = {
      verifyInvocation: (_inv: unknown) => ({
        decision: "rejected" as const,
        trust_tier: "T0" as const,
        verification_status: "unverified" as const,
        errors: [{ code: "failed_invocation" as const, message: "Mock: VRP rejection for telemetry test" }],
        warnings: [],
        can_model_consume: false,
        can_persist_as_truth: false,
        can_trigger_side_effect: false
      })
    };
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST, {
      _overrideVRP: mockRejectingVRP,
      telemetrySink: (event) => {
        events.push(event);
      }
    });

    expect(result.status).toBe("failed");
    expect(events.map((event) => event.event_type)).toContain("logic_engine.execution_failed");
  });

  it("telemetry events do not contain hollow_input or input_payload (test 35)", async () => {
    const events: LogicEngineTelemetryEvent[] = [];
    const frame = makeFrame();
    await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST, {
      telemetrySink: (event) => {
        events.push(event);
      }
    });

    const serialized = JSON.stringify(events);
    expect(serialized).not.toContain("hollow_input");
    expect(serialized).not.toContain("input_payload");
  });

  it("telemetry sink failure does not fail execution (test 36)", async () => {
    const frame = makeFrame();
    const result = await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST, {
      telemetrySink: async () => {
        throw new Error("mock telemetry sink failure");
      }
    });

    expect(result.status).toBe("executed");
    expect(result.errors).toHaveLength(0);
  });
});

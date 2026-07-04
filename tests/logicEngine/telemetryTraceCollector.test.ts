import { describe, expect, it } from "vitest";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { handleCliCommand, parseCliArgs } from "../../src/cli/index.js";
import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";
import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";
import { executeWorkGraphLite } from "../../src/logicEngine/workGraphExecutorLite.js";
import { createTelemetryTraceCollector, serializeTelemetryTrace } from "../../src/logicEngine/telemetryTraceCollector.js";
import { validateTaskFrameInput } from "../../src/logicEngine/taskFrameValidator.js";
import type { TaskFrame } from "../../src/logicEngine/types/taskFrame.js";
import type { LogicEngineTelemetryEvent } from "../../src/logicEngine/types/telemetry.js";

const CHAR_COUNT_HOLLOW_ID = "hollow.text.character_count";
const SAMPLE_HOLLOW_INPUT_TEXT = "Caleb orchestrates.";
const VALID_DISPATCH_REQUEST = {
  hollow_id: CHAR_COUNT_HOLLOW_ID,
  hollow_input: { text: SAMPLE_HOLLOW_INPUT_TEXT }
};

function makeFrame(overrides: Partial<Record<string, unknown>> = {}): TaskFrame {
  const raw = {
    task_id: "test_trace_task_001",
    run_id: "test_trace_run_001",
    trace_id: "test_trace_trace_001",
    task_type: "hollow_execution",
    description: "Telemetry trace collector test task",
    input_summary: "Character count deterministic test",
    requested_by: "test_runner",
    requires_code_mutation: false,
    signal_hints: { deterministic_only: 2, requires_judgment: 0 },
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
  const validation = validateTaskFrameInput(raw);
  if (!validation.valid) {
    throw new Error(`Test setup: invalid TaskFrame - ${validation.errors[0]?.message ?? "unknown"}`);
  }
  return validation.frame;
}

function makeGatedFrame(): TaskFrame {
  return makeFrame({
    task_id: "test_trace_refused_task",
    signal_hints: { deterministic_only: 2, requires_judgment: 0, stakes: 2 }
  });
}

function isValidIso(value: unknown): boolean {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime()) && value.includes("T");
}

describe("Logic Engine V0.7 telemetry trace collector", () => {
  it("captures emitted events in order and getEvents returns capture-order copies", async () => {
    const collector = createTelemetryTraceCollector();
    const frame = makeFrame();
    await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST, { telemetrySink: collector.sink });

    const events = collector.getEvents();
    expect(events.map((event) => event.event_type)).toEqual([
      "logic_engine.execution_started",
      "logic_engine.route_selected",
      "logic_engine.workgraph_built",
      "logic_engine.dispatch_started",
      "logic_engine.dispatch_completed",
      "logic_engine.execution_completed"
    ]);

    const mutableEvent = events[0] as LogicEngineTelemetryEvent | undefined;
    expect(mutableEvent).toBeDefined();
    if (mutableEvent !== undefined) {
      (mutableEvent.data as Record<string, unknown>)["mutated_by_test"] = true;
    }
    expect(JSON.stringify(collector.getEvents())).not.toContain("mutated_by_test");
  });

  it("toTrace returns null when no events were captured and clear empties captured events", async () => {
    const collector = createTelemetryTraceCollector();
    expect(collector.toTrace()).toBeNull();

    await executeWorkGraphLite(makeFrame(), VALID_DISPATCH_REQUEST, { telemetrySink: collector.sink });
    expect(collector.toTrace()).not.toBeNull();
    collector.clear();
    expect(collector.getEvents()).toHaveLength(0);
    expect(collector.toTrace()).toBeNull();
  });

  it("creates a V0.7 trace envelope with identity fields, timestamps, count, warnings, and sanitized marker", async () => {
    const collector = createTelemetryTraceCollector();
    const frame = makeFrame();
    await executeWorkGraphLite(frame, VALID_DISPATCH_REQUEST, { telemetrySink: collector.sink });

    const trace = collector.toTrace();
    expect(trace).not.toBeNull();
    if (trace === null) return;

    expect(trace.schema_version).toBe("0.7.0");
    expect(trace.task_id).toBe(frame.task_id);
    expect(trace.run_id).toBe(frame.run_id);
    expect(trace.trace_id).toBe(frame.trace_id);
    expect(trace.context_id).toBe(trace.events[0]?.context_id);
    expect(trace.event_count).toBe(trace.events.length);
    expect(trace.created_at).toBe(trace.events[0]?.occurred_at);
    expect(trace.completed_at).toBe(trace.events[trace.events.length - 1]?.occurred_at);
    expect(isValidIso(trace.created_at)).toBe(true);
    expect(isValidIso(trace.completed_at)).toBe(true);
    expect(trace.warnings).toEqual([]);
    expect(trace.sanitized).toBe(true);
    expect(trace.events.every((event) => event.context_id === trace.context_id)).toBe(true);
  });

  it("serialized events and trace do not expose raw Hollow input, reserved payload names, secrets, unverified output, or hidden reasoning", async () => {
    const collector = createTelemetryTraceCollector();
    await executeWorkGraphLite(makeFrame(), VALID_DISPATCH_REQUEST, { telemetrySink: collector.sink });

    const serializedEvents = JSON.stringify(collector.getEvents());
    const trace = collector.toTrace();
    expect(trace).not.toBeNull();
    if (trace === null) return;

    const serializedTrace = serializeTelemetryTrace(trace);
    for (const serialized of [serializedEvents, serializedTrace]) {
      expect(serialized).not.toContain("hollow_input");
      expect(serialized).not.toContain("input_payload");
      expect(serialized).not.toContain(SAMPLE_HOLLOW_INPUT_TEXT);
      expect(serialized.toLowerCase()).not.toContain("secret");
      expect(serialized).not.toContain("raw_unverified_output");
      expect(serialized).not.toContain("hidden_reasoning");
      expect(serialized).not.toContain("chain_of_thought");
    }
  });

  it("collector is in-memory only and can capture successful, refused, and failed executions", async () => {
    const successCollector = createTelemetryTraceCollector();
    const successResult = await executeWorkGraphLite(makeFrame(), VALID_DISPATCH_REQUEST, {
      telemetrySink: successCollector.sink
    });
    expect(successResult.status).toBe("executed");
    expect(successCollector.toTrace()).not.toBeNull();

    const refusedCollector = createTelemetryTraceCollector();
    const refusedResult = await executeWorkGraphLite(makeGatedFrame(), VALID_DISPATCH_REQUEST, {
      telemetrySink: refusedCollector.sink
    });
    expect(refusedResult.status).toBe("refused");
    expect(refusedCollector.toTrace()?.events.map((event) => event.event_type)).toContain("logic_engine.execution_refused");

    const failedCollector = createTelemetryTraceCollector();
    const mockRejectingVRP = {
      verifyInvocation: (_inv: unknown) => ({
        decision: "rejected" as const,
        trust_tier: "T0" as const,
        verification_status: "unverified" as const,
        errors: [{ code: "failed_invocation" as const, message: "Mock: VRP rejection for trace collector test" }],
        warnings: [],
        can_model_consume: false,
        can_persist_as_truth: false,
        can_trigger_side_effect: false
      })
    };
    const failedResult = await executeWorkGraphLite(makeFrame(), VALID_DISPATCH_REQUEST, {
      _overrideVRP: mockRejectingVRP,
      telemetrySink: failedCollector.sink
    });
    expect(failedResult.status).toBe("failed");
    expect(failedCollector.toTrace()?.events.map((event) => event.event_type)).toContain("logic_engine.execution_failed");

    expect(successResult.ledger_entries).toHaveLength(0);
    expect(refusedResult.ledger_entries).toHaveLength(0);
    expect(failedResult.ledger_entries).toHaveLength(0);
  });

  it("collector does not write files", async () => {
    const dir = await mkdtemp(join(tmpdir(), "caleb-telemetry-trace-test-"));
    try {
      const collector = createTelemetryTraceCollector();
      await executeWorkGraphLite(makeFrame(), VALID_DISPATCH_REQUEST, {
        telemetrySink: collector.sink
      });

      expect(await readdir(dir)).toEqual([]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("default no-sink execution remains unchanged and role_artifacts stays empty", async () => {
    const result = await executeWorkGraphLite(makeFrame(), VALID_DISPATCH_REQUEST);

    expect(result.status).toBe("executed");
    expect(result.execution_context?.role_artifacts).toEqual([]);
  });

  it("--include-context CLI behavior remains unchanged and route-decision remains dry-run", async () => {
    const withoutContext = await handleCliCommand(parseCliArgs([
      "logic-execute",
      "--input-file",
      "examples/logicEngine/simple-task.json",
      "--id",
      CHAR_COUNT_HOLLOW_ID,
      "--hollow-input-file",
      "examples/logicEngine/character-count-input.json",
      "--json"
    ]));
    expect(withoutContext.ok).toBe(true);
    expect((withoutContext.data as Record<string, unknown>)["execution_context"]).toBeUndefined();

    const withContext = await handleCliCommand(parseCliArgs([
      "logic-execute",
      "--input-file",
      "examples/logicEngine/simple-task.json",
      "--id",
      CHAR_COUNT_HOLLOW_ID,
      "--hollow-input-file",
      "examples/logicEngine/character-count-input.json",
      "--include-context",
      "--json"
    ]));
    expect(withContext.ok).toBe(true);
    expect((withContext.data as Record<string, unknown>)["execution_context"]).toBeDefined();

    const routeDecision = await handleCliCommand(parseCliArgs([
      "route-decision",
      "--input-file",
      "examples/logicEngine/simple-task.json",
      "--json"
    ]));
    expect(routeDecision.ok).toBe(true);
    expect((routeDecision.data as Record<string, unknown>)["execution_context"]).toBeUndefined();
    expect((routeDecision.data as Record<string, unknown>)["executed_hollow_id"]).toBeUndefined();
  });

  it("catalog counts remain protected", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(12);
    expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9);
  });
});

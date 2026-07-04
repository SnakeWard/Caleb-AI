import { describe, it, expect } from "vitest";
import { classifySignals } from "../../src/logicEngine/signalClassifier.js";
import { selectRoute } from "../../src/logicEngine/routeSelector.js";
import { buildWorkGraph } from "../../src/logicEngine/workGraphBuilder.js";
import { createLedgerEntryFromRouteDecision } from "../../src/logicEngine/ledgerEmitter.js";
import type { TaskFrame } from "../../src/logicEngine/types/taskFrame.js";

function makeFrame(overrides: Partial<TaskFrame> = {}): TaskFrame {
  return {
    task_id: "task_ledger_001",
    run_id: "run_ledger_001",
    trace_id: "trace_ledger_001",
    task_type: "text_analysis",
    description: "Ledger test task",
    input_summary: "Some input",
    requested_by: "test",
    requires_code_mutation: false,
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}

function buildAll(frameOverrides: Partial<TaskFrame> = {}) {
  const frame = makeFrame(frameOverrides);
  const signals = classifySignals(frame);
  const decision = selectRoute(frame, signals);
  const graph = buildWorkGraph(frame, decision);
  const entry = createLedgerEntryFromRouteDecision(decision, graph);
  return { frame, signals, decision, graph, entry };
}

describe("createLedgerEntryFromRouteDecision — Caleb doctrine fields", () => {
  it("actor_type is 'orchestration_core'", () => {
    const { entry } = buildAll();
    expect(entry.actor_type).toBe("orchestration_core");
  });

  it("actor_id is 'logic_engine_v0'", () => {
    const { entry } = buildAll();
    expect(entry.actor_id).toBe("logic_engine_v0");
  });

  it("actor_version is '0.1.0'", () => {
    const { entry } = buildAll();
    expect(entry.actor_version).toBe("0.1.0");
  });

  it("activity is 'route_decision'", () => {
    const { entry } = buildAll();
    expect(entry.activity).toBe("route_decision");
  });

  it("status is 'completed'", () => {
    const { entry } = buildAll();
    expect(entry.status).toBe("completed");
  });
});

describe("createLedgerEntryFromRouteDecision — trust and verification (Correction 5)", () => {
  it("trust_tier is 'T1' (schema-valid, not VRP-promoted)", () => {
    const { entry } = buildAll();
    expect(entry.trust_tier).toBe("T1");
  });

  it("verification_status is 'schema_valid' (not 'verified' — VRP not invoked)", () => {
    const { entry } = buildAll();
    expect(entry.verification_status).toBe("schema_valid");
  });

  it("retryable is false", () => {
    const { entry } = buildAll();
    expect(entry.retryable).toBe(false);
  });
});

describe("createLedgerEntryFromRouteDecision — provenance and result", () => {
  it("task_id matches the RouteDecision task_id", () => {
    const { entry, decision } = buildAll({ task_id: "task_abc" });
    expect(entry.task_id).toBe(decision.task_id);
    expect(entry.task_id).toBe("task_abc");
  });

  it("run_id matches the RouteDecision run_id", () => {
    const { entry, decision } = buildAll({ run_id: "run_xyz" });
    expect(entry.run_id).toBe(decision.run_id);
    expect(entry.run_id).toBe("run_xyz");
  });

  it("result contains route_mode", () => {
    const { entry, decision } = buildAll();
    const result = entry.result as Record<string, unknown>;
    expect(result["route_mode"]).toBe(decision.route_mode);
  });

  it("result contains signal_score", () => {
    const { entry, decision } = buildAll();
    const result = entry.result as Record<string, unknown>;
    expect(result["signal_score"]).toBe(decision.signal_score);
  });

  it("result contains complexity_band", () => {
    const { entry, decision } = buildAll();
    const result = entry.result as Record<string, unknown>;
    expect(result["complexity_band"]).toBe(decision.complexity_band);
  });

  it("result contains hard_overrides_count as a number", () => {
    const { entry } = buildAll();
    const result = entry.result as Record<string, unknown>;
    expect(typeof result["hard_overrides_count"]).toBe("number");
  });

  it("result contains work_graph_node_count matching graph.nodes.length", () => {
    const { entry, graph } = buildAll();
    const result = entry.result as Record<string, unknown>;
    expect(result["work_graph_node_count"]).toBe(graph.nodes.length);
  });

  it("provenance contains logic_engine_version", () => {
    const { entry } = buildAll();
    expect((entry.provenance as Record<string, unknown>)["logic_engine_version"]).toBe("0.1.0");
  });

  it("warnings is an empty array", () => {
    const { entry } = buildAll();
    expect(entry.warnings).toEqual([]);
  });

  it("errors is an empty array", () => {
    const { entry } = buildAll();
    expect(entry.errors).toEqual([]);
  });

  it("artifact_hashes is an empty array", () => {
    const { entry } = buildAll();
    expect(entry.artifact_hashes).toEqual([]);
  });

  it("parent_refs is an empty array by default", () => {
    const { entry } = buildAll();
    expect(entry.parent_refs).toEqual([]);
  });

  it("parent_refs accepts supplied options", () => {
    const { decision, graph } = buildAll();
    const entry = createLedgerEntryFromRouteDecision(decision, graph, {
      parent_refs: ["ledger_000001"]
    });
    expect(entry.parent_refs).toEqual(["ledger_000001"]);
  });

  it("ledger_id starts with 'route_' prefix", () => {
    const { entry } = buildAll();
    expect(entry.ledger_id.startsWith("route_")).toBe(true);
  });

  it("schema_version is '1.0.0'", () => {
    const { entry } = buildAll();
    expect(entry.schema_version).toBe("1.0.0");
  });

  it("timestamp is a valid ISO string", () => {
    const { entry } = buildAll();
    expect(entry.timestamp).toBeTruthy();
    expect(() => new Date(entry.timestamp)).not.toThrow();
  });

  it("custom timestamp option is respected", () => {
    const { decision, graph } = buildAll();
    const ts = "2026-03-01T12:00:00.000Z";
    const entry = createLedgerEntryFromRouteDecision(decision, graph, { timestamp: ts });
    expect(entry.timestamp).toBe(ts);
  });
});

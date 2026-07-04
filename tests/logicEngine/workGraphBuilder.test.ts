import { describe, it, expect } from "vitest";
import { classifySignals } from "../../src/logicEngine/signalClassifier.js";
import { selectRoute } from "../../src/logicEngine/routeSelector.js";
import { buildWorkGraph } from "../../src/logicEngine/workGraphBuilder.js";
import type { TaskFrame } from "../../src/logicEngine/types/taskFrame.js";
import type { WorkGraphNodeType } from "../../src/logicEngine/types/workGraph.js";

function makeFrame(overrides: Partial<TaskFrame> = {}): TaskFrame {
  return {
    task_id: "task_001",
    run_id: "run_001",
    trace_id: "trace_001",
    task_type: "text_analysis",
    description: "Test task",
    input_summary: "Some input",
    requested_by: "test",
    requires_code_mutation: false,
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}

function buildForFrame(frameOverrides: Partial<TaskFrame> = {}) {
  const frame = makeFrame(frameOverrides);
  const signals = classifySignals(frame);
  const decision = selectRoute(frame, signals);
  const graph = buildWorkGraph(frame, decision);
  return { frame, signals, decision, graph };
}

function nodeTypes(graph: ReturnType<typeof buildWorkGraph>): WorkGraphNodeType[] {
  return graph.nodes.map((n) => n.node_type);
}

describe("workGraphBuilder — standard intake sequence", () => {
  it("every graph starts with TASK_INTAKE, SIGNAL_CLASSIFICATION, ROUTE_DECISION", () => {
    const { graph } = buildForFrame();
    const types = nodeTypes(graph);

    expect(types[0]).toBe("TASK_INTAKE");
    expect(types[1]).toBe("SIGNAL_CLASSIFICATION");
    expect(types[2]).toBe("ROUTE_DECISION");
  });

  it("every graph ends with LEDGER_WRITE then FINAL_ASSEMBLY", () => {
    const { graph } = buildForFrame();
    const types = nodeTypes(graph);

    expect(types[types.length - 2]).toBe("LEDGER_WRITE");
    expect(types[types.length - 1]).toBe("FINAL_ASSEMBLY");
  });

  it("task_id and run_id are preserved in WorkGraph", () => {
    const { graph } = buildForFrame({ task_id: "task_xyz", run_id: "run_abc" });

    expect(graph.task_id).toBe("task_xyz");
    expect(graph.run_id).toBe("run_abc");
  });

  it("route_mode is carried into WorkGraph", () => {
    const { decision, graph } = buildForFrame();

    expect(graph.route_mode).toBe(decision.route_mode);
  });

  it("built_at is a valid ISO timestamp", () => {
    const { graph } = buildForFrame();

    expect(graph.built_at).toBeTruthy();
    expect(() => new Date(graph.built_at)).not.toThrow();
  });

  it("all node_ids are unique within a graph", () => {
    const { graph } = buildForFrame({
      signal_hints: {
        requires_judgment: 2,
        ambiguity: 2,
        stakes: 2,
        evidence_complexity: 2,
        contradiction_risk: 2,
        branch_factor: 2,
        audit_need: 2
      }
    });
    const ids = graph.nodes.map((n) => n.node_id);
    const unique = new Set(ids);

    expect(unique.size).toBe(ids.length);
  });
});

describe("workGraphBuilder — hollow_only route", () => {
  it("hollow_only graph contains a HOLLOW_CALL node", () => {
    const frame = makeFrame({ signal_hints: { deterministic_only: 2, requires_judgment: 0 } });
    const signals = classifySignals(frame);
    const decision = selectRoute(frame, signals);
    const graph = buildWorkGraph(frame, decision);

    expect(decision.route_mode).toBe("hollow_only");
    expect(nodeTypes(graph)).toContain("HOLLOW_CALL");
  });

  it("hollow_only graph contains no ROLE_PASS nodes", () => {
    const frame = makeFrame({ signal_hints: { deterministic_only: 2, requires_judgment: 0 } });
    const signals = classifySignals(frame);
    const decision = selectRoute(frame, signals);
    const graph = buildWorkGraph(frame, decision);

    expect(nodeTypes(graph)).not.toContain("ROLE_PASS");
  });

  it("hollow_only graph contains no RECOVERY node", () => {
    const frame = makeFrame({ signal_hints: { deterministic_only: 2, requires_judgment: 0 } });
    const signals = classifySignals(frame);
    const decision = selectRoute(frame, signals);
    const graph = buildWorkGraph(frame, decision);

    expect(nodeTypes(graph)).not.toContain("RECOVERY");
  });
});

describe("workGraphBuilder — full_rotation_stub route", () => {
  it("full_rotation_stub graph contains planner, analyst, critic, synthesizer ROLE_PASS nodes", () => {
    const frame = makeFrame({
      signal_hints: { stakes: 2, evidence_complexity: 2 }
    });
    const signals = classifySignals(frame);
    const decision = selectRoute(frame, signals);
    const graph = buildWorkGraph(frame, decision);

    expect(decision.route_mode).toBe("full_rotation_stub");

    const rolePassNodes = graph.nodes.filter((n) => n.node_type === "ROLE_PASS");
    const labels = rolePassNodes.map((n) => n.label);
    expect(labels).toContain("Planner Pass");
    expect(labels).toContain("Analyst Pass");
    expect(labels).toContain("Critic Pass");
    expect(labels).toContain("Synthesizer Pass");
  });

  it("full_rotation_stub graph contains a GATE_CHECK node (critic gate)", () => {
    const frame = makeFrame({
      signal_hints: { stakes: 2, evidence_complexity: 2 }
    });
    const signals = classifySignals(frame);
    const decision = selectRoute(frame, signals);
    const graph = buildWorkGraph(frame, decision);

    expect(nodeTypes(graph)).toContain("GATE_CHECK");
  });
});

describe("workGraphBuilder — recovery_guardrail route", () => {
  it("recovery_guardrail graph contains a RECOVERY node", () => {
    const frame = makeFrame({ task_type: "recovery" });
    const signals = classifySignals(frame);
    const decision = selectRoute(frame, signals);
    const graph = buildWorkGraph(frame, decision);

    expect(decision.route_mode).toBe("recovery_guardrail");
    expect(nodeTypes(graph)).toContain("RECOVERY");
  });

  it("recovery_guardrail graph contains a GATE_CHECK node", () => {
    const frame = makeFrame({ task_type: "recovery" });
    const signals = classifySignals(frame);
    const decision = selectRoute(frame, signals);
    const graph = buildWorkGraph(frame, decision);

    expect(nodeTypes(graph)).toContain("GATE_CHECK");
  });

  it("recovery_guardrail graph contains no ROLE_PASS nodes", () => {
    const frame = makeFrame({ task_type: "recovery" });
    const signals = classifySignals(frame);
    const decision = selectRoute(frame, signals);
    const graph = buildWorkGraph(frame, decision);

    expect(nodeTypes(graph)).not.toContain("ROLE_PASS");
  });
});

describe("workGraphBuilder — gate nodes (Correction 3)", () => {
  it("SNAPSHOT node appears when requires_snapshot_gate is true", () => {
    const frame = makeFrame({ requires_code_mutation: true });
    const signals = classifySignals(frame);
    const decision = selectRoute(frame, signals);
    const graph = buildWorkGraph(frame, decision);

    expect(decision.requires_snapshot_gate).toBe(true);
    expect(nodeTypes(graph)).toContain("SNAPSHOT");
  });

  it("SNAPSHOT node does not appear when requires_snapshot_gate is false", () => {
    const frame = makeFrame();
    const signals = classifySignals(frame);
    const decision = selectRoute(frame, signals);
    const graph = buildWorkGraph(frame, decision);

    expect(decision.requires_snapshot_gate).toBe(false);
    expect(nodeTypes(graph)).not.toContain("SNAPSHOT");
  });

  it("SNAPSHOT node appears before any route-specific mutation node (index check)", () => {
    const frame = makeFrame({ requires_code_mutation: true });
    const signals = classifySignals(frame);
    const decision = selectRoute(frame, signals);
    const graph = buildWorkGraph(frame, decision);

    const snapshotIdx = graph.nodes.findIndex((n) => n.node_type === "SNAPSHOT");
    const hollowIdx = graph.nodes.findIndex((n) => n.node_type === "HOLLOW_CALL");

    expect(snapshotIdx).toBeGreaterThan(-1);
    expect(hollowIdx).toBeGreaterThan(-1);
    expect(snapshotIdx).toBeLessThan(hollowIdx);
  });

  it("HUMAN_APPROVAL node appears when requires_approval_gate is true", () => {
    const frame = makeFrame({ signal_hints: { side_effect_risk: 1 } } as any);
    const signals = classifySignals(makeFrame(), { side_effect_risk: 1 });
    const decision = selectRoute(makeFrame(), signals);
    const graph = buildWorkGraph(makeFrame(), decision);

    expect(decision.requires_approval_gate).toBe(true);
    expect(nodeTypes(graph)).toContain("HUMAN_APPROVAL");
  });

  it("HUMAN_APPROVAL node does not appear when requires_approval_gate is false", () => {
    const frame = makeFrame();
    const signals = classifySignals(frame);
    const decision = selectRoute(frame, signals);
    const graph = buildWorkGraph(frame, decision);

    expect(decision.requires_approval_gate).toBe(false);
    expect(nodeTypes(graph)).not.toContain("HUMAN_APPROVAL");
  });

  it("HUMAN_APPROVAL appears before side-effecting route nodes (index check)", () => {
    const signals = classifySignals(makeFrame(), { side_effect_risk: 1 });
    const decision = selectRoute(makeFrame(), signals);
    const graph = buildWorkGraph(makeFrame(), decision);

    const approvalIdx = graph.nodes.findIndex((n) => n.node_type === "HUMAN_APPROVAL");
    const hollowIdx = graph.nodes.findIndex((n) => n.node_type === "HOLLOW_CALL");

    expect(approvalIdx).toBeGreaterThan(-1);
    expect(hollowIdx).toBeGreaterThan(-1);
    expect(approvalIdx).toBeLessThan(hollowIdx);
  });
});

describe("workGraphBuilder — node structure", () => {
  it("each node has a non-empty node_id, label, and responsible_module", () => {
    const { graph } = buildForFrame();

    for (const node of graph.nodes) {
      expect(node.node_id).toBeTruthy();
      expect(node.label).toBeTruthy();
      expect(node.responsible_module).toBeTruthy();
    }
  });

  it("each node has required_prior_artifacts and produced_artifacts as arrays", () => {
    const { graph } = buildForFrame();

    for (const node of graph.nodes) {
      expect(Array.isArray(node.required_prior_artifacts)).toBe(true);
      expect(Array.isArray(node.produced_artifacts)).toBe(true);
    }
  });
});

import { describe, it, expect } from "vitest";
import { classifySignals } from "../../src/logicEngine/signalClassifier.js";
import { selectRoute } from "../../src/logicEngine/routeSelector.js";
import { buildWorkGraph } from "../../src/logicEngine/workGraphBuilder.js";
import { createLedgerEntryFromRouteDecision } from "../../src/logicEngine/ledgerEmitter.js";
import type { TaskFrame } from "../../src/logicEngine/types/taskFrame.js";

function makeFrame(overrides: Partial<TaskFrame> = {}): TaskFrame {
  return {
    task_id: "task_integration_001",
    run_id: "run_integration_001",
    trace_id: "trace_integration_001",
    task_type: "text_analysis",
    description: "Integration test task",
    input_summary: "Some input",
    requested_by: "integration_test",
    requires_code_mutation: false,
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides
  };
}

describe("Logic Engine V0 integration — TaskFrame → SignalFrame → RouteDecision → WorkGraph", () => {
  it("simple deterministic task routes to hollow_only end-to-end", () => {
    const frame = makeFrame({
      task_type: "hollow_execution",
      signal_hints: { deterministic_only: 2, requires_judgment: 0 }
    });

    const signals = classifySignals(frame);
    const decision = selectRoute(frame, signals);
    const graph = buildWorkGraph(frame, decision);

    expect(signals.task_id).toBe(frame.task_id);
    expect(decision.route_mode).toBe("hollow_only");
    expect(graph.route_mode).toBe("hollow_only");
    expect(graph.nodes[0]?.node_type).toBe("TASK_INTAKE");
  });

  it("high-stakes task routes to full_rotation_stub end-to-end", () => {
    const frame = makeFrame({
      signal_hints: { stakes: 2, evidence_complexity: 2 }
    });

    const signals = classifySignals(frame);
    const decision = selectRoute(frame, signals);
    const graph = buildWorkGraph(frame, decision);

    expect(decision.route_mode).toBe("full_rotation_stub");
    expect(graph.nodes.some((n) => n.node_type === "ROLE_PASS")).toBe(true);
    expect(graph.nodes.some((n) => n.node_type === "GATE_CHECK")).toBe(true);
  });

  it("recovery task routes to recovery_guardrail end-to-end", () => {
    const frame = makeFrame({ task_type: "recovery" });

    const signals = classifySignals(frame);
    const decision = selectRoute(frame, signals);
    const graph = buildWorkGraph(frame, decision);

    expect(signals.signals.prior_failure).toBe(2);
    expect(decision.route_mode).toBe("recovery_guardrail");
    expect(graph.nodes.some((n) => n.node_type === "RECOVERY")).toBe(true);
  });

  it("code mutation task sets snapshot gate even if route is hollow_only", () => {
    const frame = makeFrame({
      requires_code_mutation: true,
      signal_hints: { deterministic_only: 2, requires_judgment: 0 }
    });

    const signals = classifySignals(frame);
    const decision = selectRoute(frame, signals);
    const graph = buildWorkGraph(frame, decision);

    expect(decision.route_mode).toBe("hollow_only");
    expect(decision.requires_snapshot_gate).toBe(true);
    expect(graph.nodes.some((n) => n.node_type === "SNAPSHOT")).toBe(true);
  });

  it("task_id is consistent through the full pipeline", () => {
    const frame = makeFrame({ task_id: "task_pipeline_check" });

    const signals = classifySignals(frame);
    const decision = selectRoute(frame, signals);
    const graph = buildWorkGraph(frame, decision);
    const entry = createLedgerEntryFromRouteDecision(decision, graph);

    expect(signals.task_id).toBe("task_pipeline_check");
    expect(decision.task_id).toBe("task_pipeline_check");
    expect(graph.task_id).toBe("task_pipeline_check");
    expect(entry.task_id).toBe("task_pipeline_check");
  });

  it("run_id is consistent through the full pipeline", () => {
    const frame = makeFrame({ run_id: "run_pipeline_check" });

    const signals = classifySignals(frame);
    const decision = selectRoute(frame, signals);
    const graph = buildWorkGraph(frame, decision);
    const entry = createLedgerEntryFromRouteDecision(decision, graph);

    expect(signals.run_id).toBe("run_pipeline_check");
    expect(decision.run_id).toBe("run_pipeline_check");
    expect(graph.run_id).toBe("run_pipeline_check");
    expect(entry.run_id).toBe("run_pipeline_check");
  });

  it("VRP is not involved — route decision trust stays at T1, not T2", () => {
    const frame = makeFrame();
    const signals = classifySignals(frame);
    const decision = selectRoute(frame, signals);
    const graph = buildWorkGraph(frame, decision);
    const entry = createLedgerEntryFromRouteDecision(decision, graph);

    expect(entry.trust_tier).toBe("T1");
    expect(entry.verification_status).toBe("schema_valid");
    expect(entry.trust_tier).not.toBe("T2");
    expect(entry.trust_tier).not.toBe("T0");
  });

  it("a deterministic task never routes to full rotation without a hard override condition", () => {
    const frame = makeFrame({
      task_type: "text_analysis",
      signal_hints: { deterministic_only: 2, requires_judgment: 0, ambiguity: 0 }
    });

    const signals = classifySignals(frame);
    const decision = selectRoute(frame, signals);

    expect(decision.route_mode).not.toBe("full_rotation_stub");
    expect(decision.route_mode).not.toBe("plan_analyze_synth");
  });

  it("plan_synth route end-to-end: medium complexity task", () => {
    const frame = makeFrame({
      signal_hints: {
        stakes: 2,
        ambiguity: 2,
        requires_judgment: 2,
        branch_factor: 1
      }
    });

    const signals = classifySignals(frame);
    const decision = selectRoute(frame, signals);
    const graph = buildWorkGraph(frame, decision);

    expect(decision.route_mode).toBe("plan_synth");
    const rolePasses = graph.nodes.filter((n) => n.node_type === "ROLE_PASS");
    const labels = rolePasses.map((n) => n.label);
    expect(labels).toContain("Planner Pass");
    expect(labels).toContain("Synthesizer Pass");
    expect(labels).not.toContain("Analyst Pass");
    expect(labels).not.toContain("Critic Pass");
  });

  it("plan_analyze_synth route end-to-end: high complexity task", () => {
    // Use signals that reach band 'high' without triggering any hard override.
    // Avoids: contradiction_risk+stakes (Override 2), stakes+evidence_complexity (Override 3),
    // deterministic_only+no_judgment (Override 4), recovery/prior_failure (Override 1).
    const frame = makeFrame({
      signal_hints: {
        requires_judgment: 2,
        ambiguity: 2,
        branch_factor: 2,
        multimodal_coupling: 2,
        audit_need: 2,
        cost_sensitivity: 2,
        deadline_pressure: 2
      }
    });

    const signals = classifySignals(frame);
    const decision = selectRoute(frame, signals);
    const graph = buildWorkGraph(frame, decision);

    expect(decision.route_mode).toBe("plan_analyze_synth");
    const rolePasses = graph.nodes.filter((n) => n.node_type === "ROLE_PASS");
    const labels = rolePasses.map((n) => n.label);
    expect(labels).toContain("Planner Pass");
    expect(labels).toContain("Analyst Pass");
    expect(labels).toContain("Synthesizer Pass");
    expect(labels).not.toContain("Critic Pass");
  });
});

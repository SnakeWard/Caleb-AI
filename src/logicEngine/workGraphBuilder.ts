import type { TaskFrame } from "./types/taskFrame.js";
import type { RouteDecision, RouteMode } from "./types/routeDecision.js";
import type { WorkGraph, WorkGraphNode, WorkGraphNodeType } from "./types/workGraph.js";

interface NodeSpec {
  readonly node_type: WorkGraphNodeType;
  readonly label: string;
  readonly required_prior_artifacts: readonly string[];
  readonly produced_artifacts: readonly string[];
  readonly required_gates: readonly string[];
  readonly responsible_module: string;
}

export function buildWorkGraph(frame: TaskFrame, decision: RouteDecision): WorkGraph {
  const nodes: WorkGraphNode[] = [];
  let index = 0;

  function addNode(spec: NodeSpec): void {
    nodes.push({
      node_id: `${decision.route_mode}_${index.toString().padStart(2, "0")}_${spec.node_type.toLowerCase()}`,
      ...spec
    });
    index += 1;
  }

  // Standard intake sequence — every graph starts with these three nodes
  addNode({
    node_type: "TASK_INTAKE",
    label: "Task Intake",
    required_prior_artifacts: [],
    produced_artifacts: ["artifact.task_frame"],
    required_gates: [],
    responsible_module: "logic_engine.task_normalizer"
  });

  addNode({
    node_type: "SIGNAL_CLASSIFICATION",
    label: "Signal Classification",
    required_prior_artifacts: ["artifact.task_frame"],
    produced_artifacts: ["artifact.signal_frame"],
    required_gates: [],
    responsible_module: "logic_engine.signal_classifier"
  });

  addNode({
    node_type: "ROUTE_DECISION",
    label: "Route Decision",
    required_prior_artifacts: ["artifact.signal_frame"],
    produced_artifacts: ["artifact.route_decision"],
    required_gates: [],
    responsible_module: "logic_engine.route_selector"
  });

  // Gate nodes appear before any mutation or side-effecting work (Correction 3).
  if (decision.requires_snapshot_gate) {
    addNode({
      node_type: "SNAPSHOT",
      label: "Pre-Mutation Snapshot",
      required_prior_artifacts: ["artifact.route_decision"],
      produced_artifacts: ["artifact.snapshot_record"],
      required_gates: ["snapshot_gate"],
      responsible_module: "change_guard.snapshot_manager"
    });
  }

  if (decision.requires_approval_gate) {
    addNode({
      node_type: "HUMAN_APPROVAL",
      label: "Approval Gate",
      required_prior_artifacts: ["artifact.route_decision"],
      produced_artifacts: ["artifact.approval_record"],
      required_gates: ["approval_gate"],
      responsible_module: "orchestration.approval_gate"
    });
  }

  // Route-specific nodes appended after intake and gate nodes
  addRouteNodes(decision.route_mode, addNode);

  // Every graph ends with ledger write then final assembly
  addNode({
    node_type: "LEDGER_WRITE",
    label: "Ledger Write",
    required_prior_artifacts: ["artifact.route_decision"],
    produced_artifacts: ["artifact.ledger_entry"],
    required_gates: [],
    responsible_module: "ledger.jsonl_ledger"
  });

  addNode({
    node_type: "FINAL_ASSEMBLY",
    label: "Final Assembly",
    required_prior_artifacts: ["artifact.ledger_entry"],
    produced_artifacts: ["artifact.final_output"],
    required_gates: [],
    responsible_module: "logic_engine.final_assembly"
  });

  return {
    task_id: frame.task_id,
    run_id: frame.run_id,
    route_mode: decision.route_mode,
    nodes,
    built_at: new Date().toISOString()
  };
}

function addRouteNodes(
  route: RouteMode,
  addNode: (spec: NodeSpec) => void
): void {
  switch (route) {
    case "hollow_only":
      addNode({
        node_type: "HOLLOW_CALL",
        label: "Hollow Execution",
        required_prior_artifacts: ["artifact.route_decision"],
        produced_artifacts: ["artifact.hollow_result"],
        required_gates: ["vrp_gate"],
        responsible_module: "hollows.hollow_runner"
      });
      break;

    case "single_pass":
      addNode({
        node_type: "ROLE_PASS",
        label: "Synthesizer Pass",
        required_prior_artifacts: ["artifact.route_decision"],
        produced_artifacts: ["artifact.synthesizer_output"],
        required_gates: [],
        responsible_module: "orchestration.role_synthesizer"
      });
      addNode({
        node_type: "HOLLOW_CALL",
        label: "Hollow Verification",
        required_prior_artifacts: ["artifact.synthesizer_output"],
        produced_artifacts: ["artifact.hollow_result"],
        required_gates: ["vrp_gate"],
        responsible_module: "hollows.hollow_runner"
      });
      break;

    case "plan_synth":
      addNode({
        node_type: "ROLE_PASS",
        label: "Planner Pass",
        required_prior_artifacts: ["artifact.route_decision"],
        produced_artifacts: ["artifact.planner_output"],
        required_gates: [],
        responsible_module: "orchestration.role_planner"
      });
      addNode({
        node_type: "ROLE_PASS",
        label: "Synthesizer Pass",
        required_prior_artifacts: ["artifact.planner_output"],
        produced_artifacts: ["artifact.synthesizer_output"],
        required_gates: [],
        responsible_module: "orchestration.role_synthesizer"
      });
      addNode({
        node_type: "HOLLOW_CALL",
        label: "Hollow Verification",
        required_prior_artifacts: ["artifact.synthesizer_output"],
        produced_artifacts: ["artifact.hollow_result"],
        required_gates: ["vrp_gate"],
        responsible_module: "hollows.hollow_runner"
      });
      break;

    case "plan_analyze_synth":
      addNode({
        node_type: "ROLE_PASS",
        label: "Planner Pass",
        required_prior_artifacts: ["artifact.route_decision"],
        produced_artifacts: ["artifact.planner_output"],
        required_gates: [],
        responsible_module: "orchestration.role_planner"
      });
      addNode({
        node_type: "ROLE_PASS",
        label: "Analyst Pass",
        required_prior_artifacts: ["artifact.planner_output"],
        produced_artifacts: ["artifact.analyst_output"],
        required_gates: [],
        responsible_module: "orchestration.role_analyst"
      });
      addNode({
        node_type: "ROLE_PASS",
        label: "Synthesizer Pass",
        required_prior_artifacts: ["artifact.analyst_output"],
        produced_artifacts: ["artifact.synthesizer_output"],
        required_gates: [],
        responsible_module: "orchestration.role_synthesizer"
      });
      addNode({
        node_type: "HOLLOW_CALL",
        label: "Hollow Verification",
        required_prior_artifacts: ["artifact.synthesizer_output"],
        produced_artifacts: ["artifact.hollow_result"],
        required_gates: ["vrp_gate"],
        responsible_module: "hollows.hollow_runner"
      });
      break;

    case "full_rotation_stub":
      addNode({
        node_type: "ROLE_PASS",
        label: "Planner Pass",
        required_prior_artifacts: ["artifact.route_decision"],
        produced_artifacts: ["artifact.planner_output"],
        required_gates: [],
        responsible_module: "orchestration.role_planner"
      });
      addNode({
        node_type: "ROLE_PASS",
        label: "Analyst Pass",
        required_prior_artifacts: ["artifact.planner_output"],
        produced_artifacts: ["artifact.analyst_output"],
        required_gates: [],
        responsible_module: "orchestration.role_analyst"
      });
      addNode({
        node_type: "ROLE_PASS",
        label: "Critic Pass",
        required_prior_artifacts: ["artifact.analyst_output"],
        produced_artifacts: ["artifact.critic_output"],
        required_gates: [],
        responsible_module: "orchestration.role_critic"
      });
      addNode({
        node_type: "GATE_CHECK",
        label: "Critic Gate Check",
        required_prior_artifacts: ["artifact.critic_output"],
        produced_artifacts: ["artifact.gate_check_result"],
        required_gates: ["critic_gate"],
        responsible_module: "orchestration.critic_gate"
      });
      addNode({
        node_type: "ROLE_PASS",
        label: "Synthesizer Pass",
        required_prior_artifacts: ["artifact.gate_check_result"],
        produced_artifacts: ["artifact.synthesizer_output"],
        required_gates: [],
        responsible_module: "orchestration.role_synthesizer"
      });
      addNode({
        node_type: "HOLLOW_CALL",
        label: "Hollow Verification",
        required_prior_artifacts: ["artifact.synthesizer_output"],
        produced_artifacts: ["artifact.hollow_result"],
        required_gates: ["vrp_gate"],
        responsible_module: "hollows.hollow_runner"
      });
      break;

    case "recovery_guardrail":
      addNode({
        node_type: "RECOVERY",
        label: "Recovery Handler",
        required_prior_artifacts: ["artifact.route_decision"],
        produced_artifacts: ["artifact.recovery_record"],
        required_gates: [],
        responsible_module: "orchestration.recovery"
      });
      addNode({
        node_type: "GATE_CHECK",
        label: "Recovery Gate Check",
        required_prior_artifacts: ["artifact.recovery_record"],
        produced_artifacts: ["artifact.gate_check_result"],
        required_gates: ["recovery_gate"],
        responsible_module: "orchestration.recovery_gate"
      });
      addNode({
        node_type: "HOLLOW_CALL",
        label: "Hollow Verification",
        required_prior_artifacts: ["artifact.gate_check_result"],
        produced_artifacts: ["artifact.hollow_result"],
        required_gates: ["vrp_gate"],
        responsible_module: "hollows.hollow_runner"
      });
      break;
  }
}

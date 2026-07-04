import type { LedgerEntry } from "../types/ledger.js";
import type { RouteDecision } from "./types/routeDecision.js";
import type { WorkGraph } from "./types/workGraph.js";
import { createLedgerId } from "../ledger/ledgerEntryFactory.js";

export interface RouteDecisionLedgerOptions {
  readonly ledger_id?: string;
  readonly timestamp?: string;
  readonly parent_refs?: readonly string[];
}

export function createLedgerEntryFromRouteDecision(
  decision: RouteDecision,
  graph: WorkGraph,
  options: RouteDecisionLedgerOptions = {}
): LedgerEntry {
  return {
    ledger_id: options.ledger_id ?? createLedgerId("route"),
    schema_version: "1.0.0",
    timestamp: options.timestamp ?? new Date().toISOString(),
    task_id: decision.task_id,
    run_id: decision.run_id,
    trace_id: decision.task_id,
    actor_type: "orchestration_core",
    actor_id: "logic_engine_v0",
    actor_version: "0.1.0",
    activity: "route_decision",
    status: "completed",
    result: {
      route_mode: decision.route_mode,
      signal_score: decision.signal_score,
      complexity_band: decision.complexity_band,
      hard_overrides_count: decision.hard_overrides_applied.length,
      requires_snapshot_gate: decision.requires_snapshot_gate,
      requires_approval_gate: decision.requires_approval_gate,
      work_graph_node_count: graph.nodes.length
    },
    warnings: [],
    errors: [],
    artifact_hashes: [],
    provenance: {
      logic_engine_version: "0.1.0",
      decided_at: decision.decided_at,
      built_at: graph.built_at
    },
    retryable: false,
    verification_status: "schema_valid",
    trust_tier: "T1",
    parent_refs: [...(options.parent_refs ?? [])],
    artifact_refs: []
  };
}

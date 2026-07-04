import type { ISODateTimeString } from "../../types/common.js";
import type { RouteMode } from "./routeDecision.js";

export type WorkGraphNodeType =
  | "TASK_INTAKE"
  | "SIGNAL_CLASSIFICATION"
  | "ROUTE_DECISION"
  | "HOLLOW_CALL"
  | "ROLE_PASS"
  | "GATE_CHECK"
  | "SNAPSHOT"
  | "LEDGER_WRITE"
  | "HUMAN_APPROVAL"
  | "FINAL_ASSEMBLY"
  | "RECOVERY";

export interface WorkGraphNode {
  readonly node_id: string;
  readonly node_type: WorkGraphNodeType;
  readonly label: string;
  readonly required_prior_artifacts: readonly string[];
  readonly produced_artifacts: readonly string[];
  readonly required_gates: readonly string[];
  readonly responsible_module: string;
}

export interface WorkGraph {
  readonly task_id: string;
  readonly run_id: string;
  readonly route_mode: RouteMode;
  readonly nodes: readonly WorkGraphNode[];
  readonly built_at: ISODateTimeString;
}

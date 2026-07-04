import type { ISODateTimeString } from "../../types/common.js";
import type { ComplexityBand } from "./signalFrame.js";

export type RouteMode =
  | "hollow_only"
  | "single_pass"
  | "plan_synth"
  | "plan_analyze_synth"
  | "full_rotation_stub"
  | "recovery_guardrail";

export interface HardOverride {
  readonly override_id: string;
  readonly condition: string;
  readonly effect: string;
}

export interface RouteDecision {
  readonly task_id: string;
  readonly run_id: string;
  readonly route_mode: RouteMode;
  readonly route_rationale: string;
  readonly hard_overrides_applied: readonly HardOverride[];
  readonly requires_snapshot_gate: boolean;
  readonly requires_approval_gate: boolean;
  readonly complexity_band: ComplexityBand;
  readonly signal_score: number;
  readonly decided_at: ISODateTimeString;
}

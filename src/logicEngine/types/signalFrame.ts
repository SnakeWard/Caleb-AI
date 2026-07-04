import type { ISODateTimeString } from "../../types/common.js";

export type SignalScore = 0 | 1 | 2;

export type ComplexityBand = "low" | "medium" | "high" | "critical";

export interface SignalInputs {
  readonly deterministic_only: SignalScore;
  readonly requires_judgment: SignalScore;
  readonly ambiguity: SignalScore;
  readonly stakes: SignalScore;
  readonly evidence_complexity: SignalScore;
  readonly contradiction_risk: SignalScore;
  readonly branch_factor: SignalScore;
  readonly multimodal_coupling: SignalScore;
  readonly side_effect_risk: SignalScore;
  readonly audit_need: SignalScore;
  readonly prior_failure: SignalScore;
  readonly cost_sensitivity: SignalScore;
  readonly deadline_pressure: SignalScore;
}

export interface SignalFrame {
  readonly task_id: string;
  readonly run_id: string;
  readonly signals: SignalInputs;
  readonly signal_score: number;
  readonly complexity_band: ComplexityBand;
  readonly classified_at: ISODateTimeString;
}

export const SIGNAL_FIELD_NAMES: readonly (keyof SignalInputs)[] = [
  "deterministic_only",
  "requires_judgment",
  "ambiguity",
  "stakes",
  "evidence_complexity",
  "contradiction_risk",
  "branch_factor",
  "multimodal_coupling",
  "side_effect_risk",
  "audit_need",
  "prior_failure",
  "cost_sensitivity",
  "deadline_pressure"
] as const;

export const SIGNAL_COUNT = SIGNAL_FIELD_NAMES.length;
export const MAX_SIGNAL_SCORE = SIGNAL_COUNT * 2;

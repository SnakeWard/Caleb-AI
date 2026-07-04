import type { TaskFrame } from "./types/taskFrame.js";
import type { SignalFrame, SignalInputs, SignalScore, ComplexityBand } from "./types/signalFrame.js";
import { SIGNAL_FIELD_NAMES } from "./types/signalFrame.js";

const DEFAULT_SIGNALS: SignalInputs = {
  deterministic_only: 0,
  requires_judgment: 0,
  ambiguity: 0,
  stakes: 0,
  evidence_complexity: 0,
  contradiction_risk: 0,
  branch_factor: 0,
  multimodal_coupling: 0,
  side_effect_risk: 0,
  audit_need: 0,
  prior_failure: 0,
  cost_sensitivity: 0,
  deadline_pressure: 0
};

export function classifySignals(
  frame: TaskFrame,
  overrides?: Readonly<Partial<SignalInputs>>
): SignalFrame {
  const withHints: SignalInputs = {
    ...DEFAULT_SIGNALS,
    ...(frame.signal_hints ?? {})
  };

  const withOverrides: SignalInputs = {
    ...withHints,
    ...(overrides ?? {})
  };

  // Enforce task_type implications after hints and overrides are applied
  const side_effect_risk = frame.requires_code_mutation
    ? clampSignal(Math.max(withOverrides.side_effect_risk, 1))
    : withOverrides.side_effect_risk;

  const prior_failure =
    frame.task_type === "recovery"
      ? clampSignal(Math.max(withOverrides.prior_failure, 2))
      : withOverrides.prior_failure;

  const signals: SignalInputs = {
    ...withOverrides,
    side_effect_risk,
    prior_failure
  };

  const signal_score = computeSignalScore(signals);
  const complexity_band = computeComplexityBand(signal_score);

  return {
    task_id: frame.task_id,
    run_id: frame.run_id,
    signals,
    signal_score,
    complexity_band,
    classified_at: new Date().toISOString()
  };
}

function computeSignalScore(signals: SignalInputs): number {
  return SIGNAL_FIELD_NAMES.reduce((sum, key) => sum + signals[key], 0);
}

function computeComplexityBand(score: number): ComplexityBand {
  if (score <= 6) return "low";
  if (score <= 13) return "medium";
  if (score <= 20) return "high";
  return "critical";
}

function clampSignal(n: number): SignalScore {
  return Math.min(2, Math.max(0, n)) as SignalScore;
}

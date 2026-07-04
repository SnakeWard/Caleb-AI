import type { TaskFrame } from "./types/taskFrame.js";
import type { SignalFrame, ComplexityBand } from "./types/signalFrame.js";
import type { RouteDecision, RouteMode, HardOverride } from "./types/routeDecision.js";

export function selectRoute(frame: TaskFrame, signals: SignalFrame): RouteDecision {
  const overrides: HardOverride[] = [];
  let route_mode: RouteMode | null = null;

  // Override 1: Recovery or prior failure outranks all other overrides.
  // A failed or recovery-state task must not be downgraded to hollow_only.
  if (frame.task_type === "recovery" || signals.signals.prior_failure === 2) {
    route_mode = "recovery_guardrail";
    overrides.push({
      override_id: "RECOVERY_OR_PRIOR_FAILURE",
      condition: "task_type === 'recovery' OR prior_failure === 2",
      effect: "route forced to recovery_guardrail"
    });
  }

  // Override 2: Contradiction with material stakes escalates to full review.
  if (
    route_mode === null &&
    signals.signals.contradiction_risk === 2 &&
    signals.signals.stakes >= 1
  ) {
    route_mode = "full_rotation_stub";
    overrides.push({
      override_id: "CONTRADICTION_ESCALATION",
      condition: "contradiction_risk === 2 AND stakes >= 1",
      effect: "route escalated to full_rotation_stub"
    });
  }

  // Override 3: High stakes combined with high evidence complexity requires full review.
  if (
    route_mode === null &&
    signals.signals.stakes === 2 &&
    signals.signals.evidence_complexity === 2
  ) {
    route_mode = "full_rotation_stub";
    overrides.push({
      override_id: "HIGH_STAKES_HIGH_EVIDENCE",
      condition: "stakes === 2 AND evidence_complexity === 2",
      effect: "route escalated to full_rotation_stub"
    });
  }

  // Override 4: Fully deterministic, no judgment needed — Hollow-only path.
  if (
    route_mode === null &&
    signals.signals.deterministic_only === 2 &&
    signals.signals.requires_judgment === 0
  ) {
    route_mode = "hollow_only";
    overrides.push({
      override_id: "DETERMINISTIC_LOCK",
      condition: "deterministic_only === 2 AND requires_judgment === 0",
      effect: "route locked to hollow_only"
    });
  }

  // Score-based routing when no hard override matched.
  if (route_mode === null) {
    route_mode = selectRouteByBand(signals.complexity_band);
  }

  // Gate flags are always independent of route selection.
  const requires_snapshot_gate =
    frame.requires_code_mutation || signals.signals.side_effect_risk >= 1;
  const requires_approval_gate =
    signals.signals.side_effect_risk > 0 || signals.signals.stakes === 2;

  return {
    task_id: frame.task_id,
    run_id: frame.run_id,
    route_mode,
    route_rationale: buildRationale(route_mode, overrides, signals),
    hard_overrides_applied: overrides,
    requires_snapshot_gate,
    requires_approval_gate,
    complexity_band: signals.complexity_band,
    signal_score: signals.signal_score,
    decided_at: new Date().toISOString()
  };
}

function selectRouteByBand(band: ComplexityBand): RouteMode {
  switch (band) {
    case "low":
      return "single_pass";
    case "medium":
      return "plan_synth";
    case "high":
      return "plan_analyze_synth";
    case "critical":
      return "full_rotation_stub";
  }
}

function buildRationale(
  route: RouteMode,
  overrides: readonly HardOverride[],
  signals: SignalFrame
): string {
  if (overrides.length > 0 && overrides[0] !== undefined) {
    const id = overrides[0].override_id;
    const cond = overrides[0].condition;
    return (
      `Hard override '${id}' applied: ${cond}. ` +
      `Route: ${route}. Signal score: ${signals.signal_score} (${signals.complexity_band}).`
    );
  }
  return (
    `Score-based routing. ` +
    `Band: ${signals.complexity_band}. Signal score: ${signals.signal_score}. Route: ${route}.`
  );
}

import type { ChangeRiskLevel, ChangeRiskRequest, ChangeRiskResult } from "./changeGuardTypes.js";

const rank: Record<ChangeRiskLevel, number> = { low: 0, medium: 1, high: 2, critical: 3 };

export function classifyChangeRisk(request: ChangeRiskRequest): ChangeRiskResult {
  let level: ChangeRiskLevel = "low";
  const reasons: string[] = [];

  const raise = (next: ChangeRiskLevel, reason: string): void => {
    if (rank[next] > rank[level]) {
      level = next;
    }
    reasons.push(reason);
  };

  if (request.touches_dependencies) raise("medium", "Dependency changes are at least medium risk.");
  if (request.touches_schema) raise("high", "Schema changes are high risk.");
  if (request.touches_ledger) raise("high", "Ledger changes are high risk.");
  if (request.touches_verified_return_path) raise("high", "Verified Return Path changes are high risk.");
  if (request.touches_permissions) raise("critical", "Permission changes are critical risk.");
  if (request.includes_side_effect) raise("critical", "Side effects are critical risk.");
  if (request.includes_file_delete) raise("critical", "File deletion is critical risk.");
  if (request.touches_many_files || (request.files_planned?.length ?? 0) > 8) {
    raise("high", "Many-file changes are high risk.");
  }
  if (request.has_tests === false && level !== "low") {
    raise(rank[level] >= rank.high ? "critical" : "high", "Missing tests raise behavior-change risk.");
  }

  return { level, reasons };
}

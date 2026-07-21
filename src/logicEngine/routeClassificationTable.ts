/**
 * RA-X-4 version-locked immutable routing table + pure lookup + build-time proofs.
 * The classifier IS this table as data — no route-computing branching.
 */

import {
  ROLE_HANDOFF_CONSUMPTION_MATRIX,
  type RoleHandoffTransitionKey
} from "../roles/roleHandoffGate.js";
import type { RoleId } from "../roles/types/roleArtifact.js";
import type { RuntimeRotationPlanRole } from "../roles/types/runtimeRotationPlan.js";

export const ROUTE_CLASSIFICATION_TABLE_VERSION = "rax4.1.0" as const;

export type RouteStakes = "low" | "high";
export type RouteAmbiguity = "bounded" | "ambiguous";
export type RouteEvidenceNeed = "none" | "required";

export type ClassifiedRole = RuntimeRotationPlanRole;

export interface RouteClassificationFeatures {
  readonly stakes: RouteStakes;
  readonly ambiguity: RouteAmbiguity;
  readonly evidence_need: RouteEvidenceNeed;
}

export interface RouteClassificationRow {
  readonly stakes: RouteStakes;
  readonly ambiguity: RouteAmbiguity;
  readonly evidence_need: RouteEvidenceNeed;
  readonly route: readonly ClassifiedRole[];
}

/** Immutable eight-row table (D1). Object.freeze — no runtime mutation. */
export const ROUTE_CLASSIFICATION_TABLE: readonly RouteClassificationRow[] = Object.freeze([
  Object.freeze({
    stakes: "low",
    ambiguity: "bounded",
    evidence_need: "none",
    route: Object.freeze(["planner", "critic"] as const)
  }),
  Object.freeze({
    stakes: "low",
    ambiguity: "bounded",
    evidence_need: "required",
    route: Object.freeze(["planner", "analyst", "critic"] as const)
  }),
  Object.freeze({
    stakes: "low",
    ambiguity: "ambiguous",
    evidence_need: "none",
    route: Object.freeze(["planner", "critic", "synthesizer"] as const)
  }),
  Object.freeze({
    stakes: "low",
    ambiguity: "ambiguous",
    evidence_need: "required",
    route: Object.freeze(["planner", "analyst", "critic", "synthesizer"] as const)
  }),
  Object.freeze({
    stakes: "high",
    ambiguity: "bounded",
    evidence_need: "none",
    route: Object.freeze(["planner", "critic", "synthesizer"] as const)
  }),
  Object.freeze({
    stakes: "high",
    ambiguity: "bounded",
    evidence_need: "required",
    route: Object.freeze(["planner", "analyst", "critic", "synthesizer"] as const)
  }),
  Object.freeze({
    stakes: "high",
    ambiguity: "ambiguous",
    evidence_need: "none",
    route: Object.freeze(["planner", "analyst", "critic", "synthesizer"] as const)
  }),
  Object.freeze({
    stakes: "high",
    ambiguity: "ambiguous",
    evidence_need: "required",
    route: Object.freeze(["planner", "analyst", "critic", "synthesizer"] as const)
  })
]);

export interface RouteLookupResult {
  readonly ok: true;
  readonly route: readonly ClassifiedRole[];
  readonly table_version: typeof ROUTE_CLASSIFICATION_TABLE_VERSION;
  readonly features: RouteClassificationFeatures;
  readonly row_index: number;
}

export interface RouteLookupFailure {
  readonly ok: false;
  readonly code: "off_table_features" | "invalid_features";
  readonly message: string;
}

/**
 * Pure table lookup — the only route-producing operation.
 * No if/else constructing routes; find matching frozen row or refuse.
 */
export function lookupRouteClassification(
  features: RouteClassificationFeatures
): RouteLookupResult | RouteLookupFailure {
  if (!isValidFeatures(features)) {
    return { ok: false, code: "invalid_features", message: "Feature values are not in the legal enum space." };
  }
  const rowIndex = ROUTE_CLASSIFICATION_TABLE.findIndex(
    (row) =>
      row.stakes === features.stakes &&
      row.ambiguity === features.ambiguity &&
      row.evidence_need === features.evidence_need
  );
  if (rowIndex < 0) {
    return {
      ok: false,
      code: "off_table_features",
      message: "Feature combination is outside the eight-row legal table."
    };
  }
  const row = ROUTE_CLASSIFICATION_TABLE[rowIndex];
  if (row === undefined) {
    return { ok: false, code: "off_table_features", message: "Table row missing." };
  }
  return {
    ok: true,
    route: row.route,
    table_version: ROUTE_CLASSIFICATION_TABLE_VERSION,
    features,
    row_index: rowIndex
  };
}

/**
 * Extract classification features from a gated decision-facing record's
 * task_requirements.constraints tokens (closed feature tokens, pure lookup map).
 */
export function extractClassificationFeaturesFromConstraints(
  constraints: readonly string[]
): RouteClassificationFeatures | null {
  const stakesMap: Record<string, RouteStakes> = {
    "feature:stakes=low": "low",
    "feature:stakes=high": "high"
  };
  const ambiguityMap: Record<string, RouteAmbiguity> = {
    "feature:ambiguity=bounded": "bounded",
    "feature:ambiguity=ambiguous": "ambiguous"
  };
  const evidenceMap: Record<string, RouteEvidenceNeed> = {
    "feature:evidence_need=none": "none",
    "feature:evidence_need=required": "required"
  };

  let stakes: RouteStakes | null = null;
  let ambiguity: RouteAmbiguity | null = null;
  let evidence_need: RouteEvidenceNeed | null = null;

  for (const token of constraints) {
    if (token in stakesMap) {
      if (stakes !== null) return null;
      stakes = stakesMap[token] ?? null;
    }
    if (token in ambiguityMap) {
      if (ambiguity !== null) return null;
      ambiguity = ambiguityMap[token] ?? null;
    }
    if (token in evidenceMap) {
      if (evidence_need !== null) return null;
      evidence_need = evidenceMap[token] ?? null;
    }
  }

  if (stakes === null || ambiguity === null || evidence_need === null) {
    return null;
  }
  return { stakes, ambiguity, evidence_need };
}

/** Build-time: every consecutive pair in route must exist in the handoff matrix. */
export function assertRouteMatrixWalkable(
  route: readonly ClassifiedRole[]
): { readonly ok: true } | { readonly ok: false; readonly missing: string } {
  for (let index = 0; index < route.length - 1; index += 1) {
    const from = route[index];
    const to = route[index + 1];
    if (from === undefined || to === undefined) {
      return { ok: false, missing: "incomplete_pair" };
    }
    const key = `${from}->${to}` as RoleHandoffTransitionKey;
    const matrix = ROLE_HANDOFF_CONSUMPTION_MATRIX as Partial<
      Record<RoleHandoffTransitionKey, readonly unknown[]>
    >;
    if (matrix[key] === undefined) {
      return { ok: false, missing: key };
    }
  }
  return { ok: true };
}

/** Build-time: single-cycle finite non-repeating sequence. */
export function assertRouteAcyclicSingleCycle(
  route: readonly ClassifiedRole[]
): { readonly ok: true } | { readonly ok: false; readonly reason: string } {
  if (route.length === 0) {
    return { ok: false, reason: "empty_route" };
  }
  if (route.length > 8) {
    return { ok: false, reason: "route_too_long" };
  }
  const seen = new Set<string>();
  for (const role of route) {
    if (seen.has(role)) {
      return { ok: false, reason: `repeat_role:${role}` };
    }
    seen.add(role);
  }
  return { ok: true };
}

/** Prove entire table is matrix-walkable and acyclic (build-time legality). */
export function proveRoutingTableLegal(): {
  readonly ok: boolean;
  readonly issues: readonly string[];
} {
  const issues: string[] = [];
  if (ROUTE_CLASSIFICATION_TABLE.length !== 8) {
    issues.push(`table_row_count:${ROUTE_CLASSIFICATION_TABLE.length}`);
  }
  ROUTE_CLASSIFICATION_TABLE.forEach((row, index) => {
    const walk = assertRouteMatrixWalkable(row.route);
    if (!walk.ok) {
      issues.push(`row_${index}_unwalkable:${walk.missing}`);
    }
    const cycle = assertRouteAcyclicSingleCycle(row.route);
    if (!cycle.ok) {
      issues.push(`row_${index}_acyclicity:${cycle.reason}`);
    }
  });
  return { ok: issues.length === 0, issues };
}

function isValidFeatures(features: RouteClassificationFeatures): boolean {
  const stakesOk = features.stakes === "low" || features.stakes === "high";
  const ambiguityOk =
    features.ambiguity === "bounded" || features.ambiguity === "ambiguous";
  const evidenceOk =
    features.evidence_need === "none" || features.evidence_need === "required";
  return stakesOk && ambiguityOk && evidenceOk;
}

/** Guard: table object is frozen (immutability). */
export function isRoutingTableFrozen(): boolean {
  return Object.isFrozen(ROUTE_CLASSIFICATION_TABLE);
}

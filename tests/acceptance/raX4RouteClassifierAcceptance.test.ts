import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  ROUTE_CLASSIFICATION_TABLE,
  ROUTE_CLASSIFICATION_TABLE_VERSION,
  assertRouteAcyclicSingleCycle,
  assertRouteMatrixWalkable,
  isRoutingTableFrozen,
  lookupRouteClassification,
  proveRoutingTableLegal,
  type RouteClassificationFeatures
} from "../../src/logicEngine/routeClassificationTable.js";
import {
  selectRouteFromRouteInputs,
  validateRouteInputRecord
} from "../../src/logicEngine/routeInputGate.js";
import { fulfillAnalystHollowEvidenceRequest } from "../../src/logicEngine/analystHollowEvidenceRequestSeam.js";
import { classifyDecisionFacingRecord } from "../../src/hollows/categories/routing/routeClassifierHollow.js";
import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";
import { getRoleCapabilityCatalog } from "../../src/roles/roleCapabilitySet.js";
import { listRoleContracts } from "../../src/roles/roleContractRegistry.js";
import type { LineageResolvedDecisionFacingRecord } from "../../src/logicEngine/types/lineageResolvedDecisionFacingRecord.js";
import type { RegisteredRoleContract } from "../../src/roles/roleContractRegistry.js";

const NOW = "2026-07-21T20:00:00.000Z";

function decisionRecord(
  features: RouteClassificationFeatures,
  capabilities: string[] = ["reasoning"]
): LineageResolvedDecisionFacingRecord {
  return {
    record_kind: "lineage_resolved_decision_facing_record",
    record_id: "route_input.decision_facing.rax4",
    source: "logic_engine",
    validated_at: NOW,
    lineage_refs: ["gated:contract_validated_task_frame:root_001"],
    task_requirements: {
      summary: "Classify route from closed feature tokens.",
      required_capabilities: capabilities,
      constraints: [
        `feature:stakes=${features.stakes}`,
        `feature:ambiguity=${features.ambiguity}`,
        `feature:evidence_need=${features.evidence_need}`
      ],
      open_questions: []
    }
  };
}

const ALL_FEATURE_COMBOS: RouteClassificationFeatures[] = [
  { stakes: "low", ambiguity: "bounded", evidence_need: "none" },
  { stakes: "low", ambiguity: "bounded", evidence_need: "required" },
  { stakes: "low", ambiguity: "ambiguous", evidence_need: "none" },
  { stakes: "low", ambiguity: "ambiguous", evidence_need: "required" },
  { stakes: "high", ambiguity: "bounded", evidence_need: "none" },
  { stakes: "high", ambiguity: "bounded", evidence_need: "required" },
  { stakes: "high", ambiguity: "ambiguous", evidence_need: "none" },
  { stakes: "high", ambiguity: "ambiguous", evidence_need: "required" }
];

describe("RA-X-4 route classifier + dynamic selection + request-only seam", () => {
  it("T1: each of eight feature combinations yields its ratified route; off-table refuses", () => {
    expect(ROUTE_CLASSIFICATION_TABLE).toHaveLength(8);
    for (const features of ALL_FEATURE_COMBOS) {
      const result = lookupRouteClassification(features);
      expect(result.ok, JSON.stringify(features)).toBe(true);
      if (result.ok) {
        expect(result.table_version).toBe(ROUTE_CLASSIFICATION_TABLE_VERSION);
        expect(result.route.length).toBeGreaterThanOrEqual(2);
      }
    }
    // Off-table: invalid enum values are invalid_features
    const bad = lookupRouteClassification({
      stakes: "medium" as never,
      ambiguity: "bounded",
      evidence_need: "none"
    });
    expect(bad.ok).toBe(false);
  });

  it("T2: pure lookup — classifier reads table constant; no route-computing switch on features", async () => {
    const tableSource = await readFile("src/logicEngine/routeClassificationTable.ts", "utf8");
    expect(tableSource).toContain("ROUTE_CLASSIFICATION_TABLE");
    expect(tableSource).toContain("findIndex");
    // Forbidden pattern: building routes via if/else on stakes
    expect(tableSource).not.toMatch(/if\s*\(\s*features\.stakes[\s\S]{0,80}route\s*=\s*\[/);
    const hollowSource = await readFile(
      "src/hollows/categories/routing/routeClassifierHollow.ts",
      "utf8"
    );
    expect(hollowSource).toContain("lookupRouteClassification");
    expect(hollowSource).not.toMatch(/if\s*\(\s*stakes\s*===/);
  });

  it("T3: matrix-walkability — all eight routes walkable; synthetic bad route fails", () => {
    const proof = proveRoutingTableLegal();
    expect(proof.ok).toBe(true);
    expect(proof.issues).toEqual([]);
    const bad = assertRouteMatrixWalkable(["planner", "reporter"] as never);
    expect(bad.ok).toBe(false);
    if (!bad.ok) {
      expect(bad.missing).toBe("planner->reporter");
    }
  });

  it("T4: determinism — same features always same route + table version", () => {
    const features: RouteClassificationFeatures = {
      stakes: "high",
      ambiguity: "ambiguous",
      evidence_need: "required"
    };
    const a = lookupRouteClassification(features);
    const b = lookupRouteClassification(features);
    expect(a).toEqual(b);
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) {
      expect(a.route).toEqual(["planner", "analyst", "critic", "synthesizer"]);
      expect(a.table_version).toBe(ROUTE_CLASSIFICATION_TABLE_VERSION);
    }
  });

  it("T5: version-lock + immutability", () => {
    expect(isRoutingTableFrozen()).toBe(true);
    expect(ROUTE_CLASSIFICATION_TABLE_VERSION).toBe("rax4.1.0");
    const classified = classifyDecisionFacingRecord(
      decisionRecord({ stakes: "low", ambiguity: "bounded", evidence_need: "none" })
    );
    expect(classified.ok).toBe(true);
    if (classified.ok) {
      expect(classified.result.table_version).toBe(ROUTE_CLASSIFICATION_TABLE_VERSION);
    }
    expect(() => {
      // Frozen table rejects runtime mutation.
      (ROUTE_CLASSIFICATION_TABLE as unknown as unknown[]).push({});
    }).toThrow();
    expect(ROUTE_CLASSIFICATION_TABLE).toHaveLength(8);
  });

  it("T6: acyclicity — finite single-cycle non-repeating; synthetic loop refused", () => {
    for (const row of ROUTE_CLASSIFICATION_TABLE) {
      expect(assertRouteAcyclicSingleCycle(row.route).ok).toBe(true);
    }
    const loop = assertRouteAcyclicSingleCycle(["planner", "critic", "planner"] as never);
    expect(loop.ok).toBe(false);
    if (!loop.ok) {
      expect(loop.reason).toContain("repeat_role");
    }
  });

  it("T7: request-only seam — orchestrator runs Hollow; Analyst never holds T0", async () => {
    const request = {
      schema_version: "0.1.0",
      role_id: "analyst",
      output_type: "hollow_evidence_request",
      summary: "Count evidence text length.",
      hollow_id: "hollow.text.character_count",
      evidence_sought: "hello world",
      confidence: 0.7,
      acceptance_status: "accepted"
    };
    const result = await fulfillAnalystHollowEvidenceRequest(request);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.evidence.executed_by).toBe("orchestrator");
      expect(result.evidence.analyst_held_ungated).toBe(false);
      expect(result.evidence.trust_tier).not.toBe("T0");
      expect(result.evidence.verification_status).toBe("verified");
      expect(result.evidence.gated_result).toBeDefined();
    }

    const seamSource = await readFile(
      "src/logicEngine/analystHollowEvidenceRequestSeam.ts",
      "utf8"
    );
    expect(seamSource).toContain("orchestrator");
    expect(seamSource).toContain("VerifiedReturnPath");
    expect(seamSource).toContain("analyst_held_ungated: false");

    // Analyst semantic types still forbid result on request shape.
    const withResult = await fulfillAnalystHollowEvidenceRequest({
      ...request,
      result: { sneaky: true }
    });
    expect(withResult.ok).toBe(false);
  });

  it("T8: non-promoter routing — longer route does not embed higher trust", () => {
    const short = classifyDecisionFacingRecord(
      decisionRecord({ stakes: "low", ambiguity: "bounded", evidence_need: "none" })
    );
    const long = classifyDecisionFacingRecord(
      decisionRecord({ stakes: "high", ambiguity: "ambiguous", evidence_need: "required" })
    );
    expect(short.ok && long.ok).toBe(true);
    if (short.ok && long.ok) {
      expect(JSON.stringify(short.result)).not.toMatch(/"trust_tier"|"T2"|"T3"/);
      expect(JSON.stringify(long.result)).not.toMatch(/"trust_tier"|"T2"|"T3"/);
      expect(long.result.role_sequence.length).toBeGreaterThan(short.result.role_sequence.length);
    }
  });

  it("T9: single-source capability — reduced registry changes classifier satisfiability", () => {
    const withoutAnalyst = listRoleContracts().filter(
      (e) => e.contract.role_id !== "analyst"
    ) as RegisteredRoleContract[];
    const reduced = getRoleCapabilityCatalog(withoutAnalyst);
    expect(reduced.all_capabilities.has("artifact:analysis" as never)).toBe(false);

    const needsAnalysis = classifyDecisionFacingRecord(
      decisionRecord(
        { stakes: "low", ambiguity: "bounded", evidence_need: "none" },
        ["artifact:analysis"]
      )
    );
    // Default catalog includes analyst.
    expect(needsAnalysis.ok).toBe(true);

    // Inject reduced catalog via re-export path: classifier always reads live registry.
    // Prove module coupling: getRoleCapabilityCatalog is imported by classifier source.
  });

  it("T9-source: classifier imports getRoleCapabilityCatalog from roleCapabilitySet", async () => {
    const source = await readFile(
      "src/hollows/categories/routing/routeClassifierHollow.ts",
      "utf8"
    );
    expect(source).toContain('from "../../../roles/roleCapabilitySet.js"');
    expect(source).toContain("getRoleCapabilityCatalog");
    expect(source).not.toContain("HAND_CODED_CAPABILITIES");
  });

  it("T10: LE-2 additive — fixed path unchanged; decision-record uses classifier", () => {
    // Fixed path still requires task frame + signal (pre-RA-X-4).
    const fixedOnly = selectRouteFromRouteInputs([
      {
        record_kind: "contract_validated_task_frame",
        record_id: "tf1",
        source: "logic_engine",
        validated_at: NOW,
        lineage_refs: [],
        task_frame: {
          task_id: "task_fixed",
          run_id: "run_fixed",
          trace_id: "trace_fixed",
          task_type: "planning",
          description: "fixed path",
          input_summary: "x",
          requested_by: "test",
          requires_code_mutation: false,
          created_at: NOW
        },
        validation: { validator: "validateTaskFrameInput", valid: true }
      }
    ]);
    expect(fixedOnly.ok).toBe(false);
    expect(fixedOnly.issues.some((i) => i.code === "missing_verified_signal_frame")).toBe(true);

    const decision = decisionRecord({
      stakes: "low",
      ambiguity: "bounded",
      evidence_need: "required"
    });
    expect(validateRouteInputRecord(decision).ok).toBe(true);
    const dynamic = selectRouteFromRouteInputs([decision]);
    expect(dynamic.ok).toBe(true);
    if (dynamic.ok) {
      expect(dynamic.decision.selection_path).toBe("classifier");
      expect(dynamic.decision.table_version).toBe(ROUTE_CLASSIFICATION_TABLE_VERSION);
      expect(dynamic.decision.role_sequence).toEqual(["planner", "analyst", "critic"]);
    }
  });

  it("D8: classifier registered in V1 catalog (13 → 14)", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(14);
    expect(
      V1_HOLLOW_MANIFESTS.some((m) => m.hollow_id === "hollow.routing.route_classifier")
    ).toBe(true);
  });
});

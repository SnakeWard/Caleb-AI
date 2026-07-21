import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  isAllowedRouteInputKind,
  validateRouteInputRecord
} from "../../src/logicEngine/routeInputGate.js";
import { validateLineageResolvedDecisionFacingRecord } from "../../src/logicEngine/lineageResolvedDecisionFacingVerifier.js";
import {
  getRoleCapabilityCatalog,
  catalogProvidesCapability
} from "../../src/roles/roleCapabilitySet.js";
import { listRoleContracts } from "../../src/roles/roleContractRegistry.js";
import type { RegisteredRoleContract } from "../../src/roles/roleContractRegistry.js";

const NOW = "2026-07-21T18:00:00.000Z";
const EIGHTH = "lineage_resolved_decision_facing_record";

const EIGHT_ALLOWLIST = [
  "contract_validated_task_frame",
  "verified_signal_frame",
  "engine_internal_state",
  "deterministic_hollow_signal",
  "accepted_gate_policy_result",
  "human_pat_approval_record",
  "snapshot_change_guard_state",
  EIGHTH
] as const;

function validDecisionFacing(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    record_kind: EIGHTH,
    record_id: "route_input.decision_facing.valid_001",
    source: "logic_engine",
    validated_at: NOW,
    lineage_refs: ["gated:contract_validated_task_frame:task_frame_root_001"],
    task_requirements: {
      summary: "Distinguish host contention from deterministic defects.",
      required_capabilities: ["reasoning", "artifact:analysis"],
      constraints: ["No live provider call."],
      open_questions: []
    },
    ...overrides
  };
}

describe("RA-X-3 eighth L1 type + five-check verifier", () => {
  it("T1: lineage — well-formed resolvable lineage passes; orphan and fabricated root refuse", () => {
    expect(validateLineageResolvedDecisionFacingRecord(validDecisionFacing()).ok).toBe(true);

    const orphan = validateLineageResolvedDecisionFacingRecord(
      validDecisionFacing({
        lineage_refs: ["ungated:missing:artifact"]
      })
    );
    expect(orphan.ok).toBe(false);
    expect(orphan.issues.some((i) => i.code === "lineage_orphan_ref")).toBe(true);

    const fabricated = validateLineageResolvedDecisionFacingRecord(
      validDecisionFacing({
        lineage_refs: ["gated:fabricated_root_kind:x"]
      })
    );
    expect(fabricated.ok).toBe(false);
    expect(
      fabricated.issues.some(
        (i) => i.code === "lineage_orphan_ref" || i.code === "lineage_incomplete"
      )
    ).toBe(true);
  });

  it("T2: well-formedness — bounded closed record passes; missing/overflow/free-form refuse", () => {
    expect(validateLineageResolvedDecisionFacingRecord(validDecisionFacing()).ok).toBe(true);

    const missing = validateLineageResolvedDecisionFacingRecord(
      validDecisionFacing({
        task_requirements: {
          summary: "x",
          required_capabilities: ["reasoning"],
          constraints: []
          // open_questions missing
        }
      })
    );
    expect(missing.ok).toBe(false);
    expect(missing.issues.some((i) => i.code === "missing_required_field")).toBe(true);

    const overflow = validateLineageResolvedDecisionFacingRecord(
      validDecisionFacing({
        task_requirements: {
          summary: "x".repeat(201),
          required_capabilities: ["reasoning"],
          constraints: [],
          open_questions: []
        }
      })
    );
    expect(overflow.ok).toBe(false);
    expect(overflow.issues.some((i) => i.code === "string_length_overflow")).toBe(true);

    const freeForm = validateLineageResolvedDecisionFacingRecord(
      validDecisionFacing({
        task_requirements: {
          summary: "ok",
          required_capabilities: ["reasoning"],
          constraints: [],
          open_questions: [],
          freeform_notes: "smuggle"
        }
      })
    );
    expect(freeForm.ok).toBe(false);
    expect(freeForm.issues.some((i) => i.code === "unexpected_field")).toBe(true);

    const cardinality = validateLineageResolvedDecisionFacingRecord(
      validDecisionFacing({
        task_requirements: {
          summary: "ok",
          required_capabilities: [
            "reasoning",
            "reasoning",
            "reasoning",
            "reasoning",
            "reasoning",
            "reasoning",
            "reasoning"
          ],
          constraints: [],
          open_questions: []
        }
      })
    );
    expect(cardinality.ok).toBe(false);
    expect(cardinality.issues.some((i) => i.code === "cardinality_overflow")).toBe(true);
  });

  it("T3: no tier assertion — trust_tier on record refuses", () => {
    const result = validateLineageResolvedDecisionFacingRecord(
      validDecisionFacing({ trust_tier: "T2" })
    );
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === "tier_assertion_forbidden")).toBe(true);
  });

  it("T4: no route pre-commitment — embedded role sequence refuses", () => {
    const withSequence = validateLineageResolvedDecisionFacingRecord(
      validDecisionFacing({
        roles_required: ["planner", "analyst", "critic"]
      })
    );
    expect(withSequence.ok).toBe(false);
    expect(withSequence.issues.some((i) => i.code === "route_precommitment_forbidden")).toBe(
      true
    );

    const nested = validateLineageResolvedDecisionFacingRecord(
      validDecisionFacing({
        task_requirements: {
          summary: "ok",
          required_capabilities: ["reasoning"],
          constraints: [],
          open_questions: [],
          route_mode: "full_rotation"
        }
      })
    );
    expect(nested.ok).toBe(false);
    expect(nested.issues.some((i) => i.code === "route_precommitment_forbidden")).toBe(true);
  });

  it("T5: satisfiability against single-source capability set", () => {
    const ok = validateLineageResolvedDecisionFacingRecord(validDecisionFacing());
    expect(ok.ok).toBe(true);

    const unsat = validateLineageResolvedDecisionFacingRecord(
      validDecisionFacing({
        task_requirements: {
          summary: "Requires nonexistent capability.",
          required_capabilities: ["telepathy"],
          constraints: [],
          open_questions: []
        }
      })
    );
    expect(unsat.ok).toBe(false);
    expect(unsat.issues.some((i) => i.code === "capability_unsatisfiable")).toBe(true);
  });

  it("T6: eighth type remains verifier-gated (consumer is RA-X-4 classifier path)", async () => {
    // RA-X-3 delivered gated-and-ready input. RA-X-4 may consume via classifier.
    // Verifier invocation remains mandatory at the gate.
    const source = await readFile("src/logicEngine/routeInputGate.ts", "utf8");
    expect(source).toContain("validateLineageResolvedDecisionFacingRecord");
    expect(source).toContain('case "lineage_resolved_decision_facing_record"');
  });

  it("T7: atomic addition — allowlist is eight and gate invokes verifier", async () => {
    for (const kind of EIGHT_ALLOWLIST) {
      expect(isAllowedRouteInputKind(kind)).toBe(true);
    }
    expect(EIGHT_ALLOWLIST).toHaveLength(8);

    const gateSource = await readFile("src/logicEngine/routeInputGate.ts", "utf8");
    expect(gateSource).toContain('case "lineage_resolved_decision_facing_record"');
    expect(gateSource).toContain("validateLineageResolvedDecisionFacingRecord");

    // Gate refuses failing verifier records even though kind is allowlisted.
    const refused = validateRouteInputRecord(
      validDecisionFacing({ lineage_refs: ["role_artifact:planner.fake"] })
    );
    expect(refused.ok).toBe(false);
    expect(refused.issues[0]?.code).not.toBe("unknown_record_kind");
  });

  it("T8: masquerade — role-artifact lineage without gated root refuses", () => {
    const masquerade = validateRouteInputRecord({
      record_kind: EIGHTH,
      record_id: "route_input.masquerade.role_artifact_lineage",
      source: "logic_engine",
      validated_at: NOW,
      lineage_refs: [
        "role_artifact:planner.plan.digest.sha256.fake",
        "role_artifact:critic.critique.digest.sha256.fake"
      ],
      task_requirements: {
        summary: "Masquerade attempt.",
        required_capabilities: ["reasoning"],
        constraints: [],
        open_questions: []
      }
    });
    expect(masquerade.ok).toBe(false);
    expect(
      masquerade.issues.some(
        (i) =>
          i.code === "lineage_untrusted_root" ||
          i.code === "lineage_incomplete" ||
          i.code === "lineage_orphan_ref"
      )
    ).toBe(true);
  });

  it("T9: single-source capability catalog — registry change moves satisfiability", () => {
    const full = getRoleCapabilityCatalog();
    expect(catalogProvidesCapability(full, "reasoning")).toBe(true);
    expect(catalogProvidesCapability(full, "artifact:analysis")).toBe(true);

    const withoutAnalyst = listRoleContracts().filter(
      (entry) => entry.contract.role_id !== "analyst"
    ) as RegisteredRoleContract[];
    const reduced = getRoleCapabilityCatalog(withoutAnalyst);
    expect(catalogProvidesCapability(reduced, "artifact:analysis")).toBe(false);

    const needsAnalysis = validateLineageResolvedDecisionFacingRecord(
      validDecisionFacing({
        task_requirements: {
          summary: "Needs analysis artifact capability.",
          required_capabilities: ["artifact:analysis"],
          constraints: [],
          open_questions: []
        }
      }),
      { capability_catalog: reduced }
    );
    expect(needsAnalysis.ok).toBe(false);
    expect(needsAnalysis.issues.some((i) => i.code === "capability_unsatisfiable")).toBe(true);

    const withFull = validateLineageResolvedDecisionFacingRecord(
      validDecisionFacing({
        task_requirements: {
          summary: "Needs analysis artifact capability.",
          required_capabilities: ["artifact:analysis"],
          constraints: [],
          open_questions: []
        }
      }),
      { capability_catalog: full }
    );
    expect(withFull.ok).toBe(true);
  });

  it("public gate accepts a fully valid eighth-type record", () => {
    const result = validateRouteInputRecord(validDecisionFacing());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.input.record_kind).toBe(EIGHTH);
    }
  });
});

import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  ANALYST_BOUNDS,
  ANALYST_OUTPUT_TYPES,
  ROLE_HANDOFF_CONSUMPTION_MATRIX,
  getRoleContract,
  listRoleContracts,
  validateAnalystSemanticPayload,
  validateRoleArtifact,
  validateRoleContractRegistry,
  type RoleId
} from "../../src/roles/index.js";

function loadJson(path: string): unknown {
  return JSON.parse(readFileSync(path, "utf8"));
}

describe("RA-X-1 Analyst role isolation registration", () => {
  it("T1: each of four output types validates; each rejection class fails", async () => {
    for (const name of [
      "finding",
      "gap_analysis",
      "plan_revision_request",
      "hollow_evidence_request"
    ] as const) {
      const payload = loadJson(`examples/roles/analyst.valid-${name}.json`);
      const result = validateAnalystSemanticPayload(payload);
      expect(result.ok, name).toBe(true);
      expect(result.issues, name).toEqual([]);
    }

    const unknown = validateAnalystSemanticPayload(
      loadJson("examples/roles/analyst.invalid-unknown_type.json")
    );
    expect(unknown.ok).toBe(false);
    expect(unknown.issues.some((i) => i.code === "unknown_output_type")).toBe(true);

    const missing = validateAnalystSemanticPayload(
      loadJson("examples/roles/analyst.invalid-missing_field.json")
    );
    expect(missing.ok).toBe(false);
    expect(missing.issues.some((i) => i.code === "missing_required_field")).toBe(true);

    const cardinality = validateAnalystSemanticPayload(
      loadJson("examples/roles/analyst.invalid-cardinality.json")
    );
    expect(cardinality.ok).toBe(false);
    expect(cardinality.issues.some((i) => i.code === "cardinality_overflow")).toBe(true);

    const overflow = validateAnalystSemanticPayload(
      loadJson("examples/roles/analyst.invalid-string_overflow.json")
    );
    expect(overflow.ok).toBe(false);
    expect(overflow.issues.some((i) => i.code === "string_length_overflow")).toBe(true);

    const tier = validateAnalystSemanticPayload(
      loadJson("examples/roles/analyst.invalid-tier_promotion.json")
    );
    expect(tier.ok).toBe(false);
    expect(tier.issues.some((i) => i.code === "tier_promotion_forbidden")).toBe(true);

    const hollow = validateAnalystSemanticPayload(
      loadJson("examples/roles/analyst.invalid-hollow_with_result.json")
    );
    expect(hollow.ok).toBe(false);
    expect(hollow.issues.some((i) => i.code === "malformed_hollow_request")).toBe(true);
  });

  it("T2: never-self-verifying — trust_tier T2 on Analyst payload is rejected", () => {
    const result = validateAnalystSemanticPayload(
      loadJson("examples/roles/analyst.invalid-tier_promotion.json")
    );
    expect(result.ok).toBe(false);
    expect(
      result.issues.some(
        (i) => i.code === "tier_promotion_forbidden" && i.path.includes("trust_tier")
      )
    ).toBe(true);
  });

  it("T3: Analyst remains registered; matrix wiring is RA-X-2's surface", () => {
    // RA-X-1 proved isolation at registration time. RA-X-2 adds six matrix rows.
    // This detector keeps the schema/registry registration lock without re-asserting
    // pre-wiring unreachability (superseded by RA-X-2).
    const analyst = getRoleContract("analyst");
    expect(analyst).toBeDefined();
    expect(analyst?.contract.role_id).toBe("analyst");
    expect(analyst?.role_class).toBe("reasoning");
    expect(analyst?.execution_authority).toBe("request_only");
    expect(Object.keys(ROLE_HANDOFF_CONSUMPTION_MATRIX).length).toBeGreaterThanOrEqual(33);
  });

  it("T4: hollow_evidence_request is request-only (no result/output fields)", () => {
    const valid = loadJson(
      "examples/roles/analyst.valid-hollow_evidence_request.json"
    ) as Record<string, unknown>;
    expect(Object.keys(valid).sort()).toEqual([
      "acceptance_status",
      "confidence",
      "evidence_sought",
      "hollow_id",
      "output_type",
      "role_id",
      "schema_version",
      "summary"
    ]);
    expect(validateAnalystSemanticPayload(valid).ok).toBe(true);

    const withResult = validateAnalystSemanticPayload(
      loadJson("examples/roles/analyst.invalid-hollow_with_result.json")
    );
    expect(withResult.ok).toBe(false);
    expect(withResult.issues.some((i) => i.code === "malformed_hollow_request")).toBe(true);
  });

  it("T5: registry uniformity — Analyst has same structural fields as Planner/Critic", () => {
    const planner = getRoleContract("planner");
    const critic = getRoleContract("critic");
    const analyst = getRoleContract("analyst");
    expect(planner && critic && analyst).toBeTruthy();
    if (!planner || !critic || !analyst) {
      return;
    }
    const structuralKeys = [
      "contract",
      "display_name",
      "description",
      "required_fields",
      "forbidden_fields",
      "allowed_next_roles",
      "can_handoff_to_human",
      "role_class",
      "permitted_input_kinds",
      "execution_authority"
    ] as const;
    for (const key of structuralKeys) {
      expect(key in planner).toBe(true);
      expect(key in critic).toBe(true);
      expect(key in analyst).toBe(true);
    }
    expect(analyst.contract.role_id).toBe("analyst");
    expect(analyst.role_class).toBe("reasoning");
    expect(analyst.permitted_input_kinds).toEqual([
      "planner_plan",
      "contract_validated_task_frame"
    ]);
    expect(analyst.execution_authority).toBe("request_only");
    expect(planner.execution_authority).toBe("none");
    expect(critic.execution_authority).toBe("none");
    expect(validateRoleContractRegistry()).toEqual({ ok: true, errors: [] });

    const artifact = loadJson("examples/roles/analyst.valid-artifact.json");
    expect(validateRoleArtifact(artifact)).toMatchObject({ ok: true });
  });

  it("locks four output types and reports bound constants", () => {
    expect([...ANALYST_OUTPUT_TYPES]).toEqual([
      "finding",
      "gap_analysis",
      "plan_revision_request",
      "hollow_evidence_request"
    ]);
    expect(ANALYST_BOUNDS.summary_max).toBe(200);
    expect(ANALYST_BOUNDS.id_max).toBe(160);
    expect(ANALYST_BOUNDS.rationale_max).toBe(240);
    expect(ANALYST_BOUNDS.findings_max).toBe(5);
  });

  it("L1 allowlist remains seven entries (not touched)", async () => {
    const source = await readFile("src/logicEngine/routeInputGate.ts", "utf8");
    expect(source).toContain("contract_validated_task_frame");
    expect(source).not.toContain("lineage_resolved_decision_facing_record");
    const kinds = [
      "contract_validated_task_frame",
      "verified_signal_frame",
      "engine_internal_state",
      "deterministic_hollow_signal",
      "accepted_gate_policy_result",
      "human_pat_approval_record",
      "snapshot_change_guard_state"
    ];
    for (const kind of kinds) {
      expect(source).toContain(kind);
    }
  });
});

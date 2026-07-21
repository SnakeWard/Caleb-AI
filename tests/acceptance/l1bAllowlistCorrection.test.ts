import { describe, expect, it } from "vitest";

import {
  isAllowedRouteInputKind,
  validateRouteInputRecord
} from "../../src/logicEngine/routeInputGate.js";

const NOW = "2026-07-05T00:00:00.000Z";

describe("L1-B route-input allowlist correction", () => {
  it("l1b masquerade fixture: decision record with unverified role-artifact lineage is rejected", () => {
    // RA-X-3: eighth type is allowlisted but still refuses masquerade lineage (T8).
    const masquerade = validateRouteInputRecord({
      record_kind: "lineage_resolved_decision_facing_record",
      record_id: "route_input.masquerade.role_artifact_lineage",
      source: "logic_engine",
      validated_at: NOW,
      lineage_refs: [
        "role_artifact:planner.plan.digest.sha256.fake",
        "role_artifact:critic.critique.digest.sha256.fake"
      ],
      task_requirements: {
        summary: "Masquerade without gated root.",
        required_capabilities: ["reasoning"],
        constraints: [],
        open_questions: []
      }
    });

    expect(isAllowedRouteInputKind("lineage_resolved_decision_facing_record")).toBe(true);
    expect(masquerade.ok).toBe(false);
    expect(
      masquerade.issues.some(
        (issue) =>
          issue.code === "lineage_untrusted_root" ||
          issue.code === "lineage_incomplete" ||
          issue.code === "lineage_orphan_ref"
      )
    ).toBe(true);
  });

  it("unknown kinds remain rejected by construction", () => {
    const unknown = validateRouteInputRecord({
      record_kind: "unknown_record_type",
      record_id: "route_input.unknown",
      source: "hollow",
      validated_at: NOW,
      lineage_refs: []
    });

    expect(unknown.ok).toBe(false);
    expect(unknown.issues[0]?.code).toBe("unknown_record_kind");
  });
});

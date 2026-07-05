import { describe, expect, it } from "vitest";

import {
  isAllowedRouteInputKind,
  validateRouteInputRecord
} from "../../src/logicEngine/routeInputGate.js";

const NOW = "2026-07-05T00:00:00.000Z";

describe("L1-B route-input allowlist correction", () => {
  it("l1b masquerade fixture: decision record with unverified role-artifact lineage is rejected", () => {
    const masquerade = validateRouteInputRecord({
      record_kind: "lineage_resolved_decision_facing_record",
      record_id: "route_input.masquerade.role_artifact_lineage",
      source: "hollow",
      validated_at: NOW,
      lineage_refs: [
        "role_artifact:planner.plan.digest.sha256.fake",
        "role_artifact:critic.critique.digest.sha256.fake"
      ],
      effective_tier: "T2",
      decision_signal: {
        defects_found: true
      }
    });

    expect(masquerade.ok).toBe(false);
    expect(masquerade.issues).toEqual([
      {
        code: "unknown_record_kind",
        path: "$.record_kind",
        message: "Unregistered route input record_kind 'lineage_resolved_decision_facing_record' is rejected by construction."
      }
    ]);
  });

  it("removed lineage_resolved_decision_facing_record behaves like an unknown kind", () => {
    const removed = validateRouteInputRecord({
      record_kind: "lineage_resolved_decision_facing_record",
      record_id: "route_input.removed",
      source: "hollow",
      validated_at: NOW,
      lineage_refs: [],
      effective_tier: "T2",
      decision_signal: {}
    });
    const unknown = validateRouteInputRecord({
      record_kind: "unknown_record_type",
      record_id: "route_input.unknown",
      source: "hollow",
      validated_at: NOW,
      lineage_refs: []
    });

    expect(isAllowedRouteInputKind("lineage_resolved_decision_facing_record")).toBe(false);
    expect(removed.ok).toBe(false);
    expect(unknown.ok).toBe(false);
    expect(removed.issues[0]?.code).toBe("unknown_record_kind");
    expect(unknown.issues[0]?.code).toBe("unknown_record_kind");
  });
});

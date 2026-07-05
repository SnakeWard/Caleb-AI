import { describe, expect, it } from "vitest";

import {
  createDerivedEvidenceRecord,
  detectLaunderingAttempt,
  detectTierFieldMisuse,
  minTrustTier,
  toDecisionFacingEvidence,
  validateDerivedEvidenceRecord
} from "../../src/rawOutput/index.js";

describe("derived evidence policy", () => {
  it("computes subject_tier and effective_tier with min semantics", () => {
    const record = createDerivedEvidenceRecord({
      evidence_id: "evidence_1",
      derived_from: ["ledger_123e4567-e89b-12d3-a456-426614174000"],
      source_tiers: ["T1"],
      measurement_tier: "T2",
      claim: { character_count: 12 }
    });

    expect(record.measurement_tier).toBe("T2");
    expect(record.subject_tier).toBe("T1");
    expect(record.effective_tier).toBe("T1");
    expect(validateDerivedEvidenceRecord(record).ok).toBe(true);
  });

  it("decision-facing evidence exposes effective_tier only", () => {
    const record = createDerivedEvidenceRecord({
      evidence_id: "evidence_1",
      derived_from: ["ledger_123e4567-e89b-12d3-a456-426614174000"],
      source_tiers: ["T1"],
      measurement_tier: "T2",
      claim: { character_count: 12 }
    });
    const decision = toDecisionFacingEvidence(record);

    expect(decision.effective_tier).toBe("T1");
    expect("measurement_tier" in decision).toBe(false);
    expect("subject_tier" in decision).toBe(false);
  });

  it("detects measurement_tier and subject_tier misuse", () => {
    expect(detectTierFieldMisuse(["effective_tier"]).ok).toBe(true);
    expect(detectTierFieldMisuse(["measurement_tier"]).issues[0]?.code).toBe("forbidden_tier_field_consumption");
    expect(detectTierFieldMisuse(["subject_tier"]).issues[0]?.code).toBe("forbidden_tier_field_consumption");
  });

  it("detects laundering attempts above effective_tier", () => {
    const record = createDerivedEvidenceRecord({
      evidence_id: "evidence_1",
      derived_from: ["ledger_123e4567-e89b-12d3-a456-426614174000"],
      source_tiers: ["T1"],
      measurement_tier: "T2",
      claim: { character_count: 12 }
    });

    expect(detectLaunderingAttempt(record, "T1").ok).toBe(true);
    expect(detectLaunderingAttempt(record, "T2").issues[0]?.code).toBe("trust_laundering_attempt");
  });

  it("keeps trust min monotonic across multiple sources", () => {
    expect(minTrustTier(["T4", "T2", "T1"])).toBe("T1");
    expect(minTrustTier(["T2", "T0"])).toBe("T0");
  });
});

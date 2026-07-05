import type { JsonValue } from "../types/common.js";
import type { TrustTier } from "../types/trust.js";
import type {
  DecisionFacingDerivedEvidence,
  DecisionTierField,
  DerivedEvidenceIssue,
  DerivedEvidenceProvenanceRecord,
  DerivedEvidenceValidationResult
} from "./rawOutputArtifactTypes.js";

const TRUST_ORDER: readonly TrustTier[] = ["T0", "T1", "T2", "T3", "T4"];

export interface CreateDerivedEvidenceInput {
  readonly evidence_id: string;
  readonly derived_from: readonly string[];
  readonly source_tiers: readonly TrustTier[];
  readonly measurement_tier: TrustTier;
  readonly claim: JsonValue;
  readonly artifact_refs?: readonly string[];
}

export function createDerivedEvidenceRecord(input: CreateDerivedEvidenceInput): DerivedEvidenceProvenanceRecord {
  const subjectTier = minTrustTier(input.source_tiers);
  const effectiveTier = minTrustTier([input.measurement_tier, subjectTier]);
  return {
    evidence_id: input.evidence_id,
    derived_from: [...input.derived_from],
    source_tiers: [...input.source_tiers],
    measurement_tier: input.measurement_tier,
    subject_tier: subjectTier,
    effective_tier: effectiveTier,
    claim: cloneJson(input.claim),
    artifact_refs: [...(input.artifact_refs ?? [])]
  };
}

export function toDecisionFacingEvidence(record: DerivedEvidenceProvenanceRecord): DecisionFacingDerivedEvidence {
  return {
    evidence_id: record.evidence_id,
    effective_tier: record.effective_tier,
    claim: cloneJson(record.claim),
    artifact_refs: [...record.artifact_refs]
  };
}

export function validateDerivedEvidenceRecord(record: DerivedEvidenceProvenanceRecord): DerivedEvidenceValidationResult {
  const issues: DerivedEvidenceIssue[] = [];
  if (!isTrustTier(record.measurement_tier)) {
    issues.push(issue("invalid_measurement_tier", "measurement_tier", "measurement_tier must be a TrustTier."));
  }
  if (!isTrustTier(record.subject_tier)) {
    issues.push(issue("invalid_subject_tier", "subject_tier", "subject_tier must be a TrustTier."));
  }
  if (!isTrustTier(record.effective_tier)) {
    issues.push(issue("invalid_effective_tier", "effective_tier", "effective_tier must be a TrustTier."));
  }
  if (record.source_tiers.length === 0) {
    issues.push(issue("missing_source_tiers", "source_tiers", "Derived evidence must include at least one source tier."));
  }

  const expectedSubject = minTrustTier(record.source_tiers);
  if (record.subject_tier !== expectedSubject) {
    issues.push(issue("subject_tier_mismatch", "subject_tier", "subject_tier must equal min(source_tiers)."));
  }

  const expectedEffective = minTrustTier([record.measurement_tier, record.subject_tier]);
  if (record.effective_tier !== expectedEffective) {
    issues.push(issue("effective_tier_mismatch", "effective_tier", "effective_tier must equal min(measurement_tier, subject_tier)."));
  }

  return { ok: issues.length === 0, issues };
}

export function detectTierFieldMisuse(fields: readonly DecisionTierField[]): DerivedEvidenceValidationResult {
  const forbidden = fields.filter((field) => field !== "effective_tier");
  return {
    ok: forbidden.length === 0,
    issues: forbidden.map((field) =>
      issue("forbidden_tier_field_consumption", field, `${field} must not be consumed by decision logic.`)
    )
  };
}

export function detectLaunderingAttempt(record: DerivedEvidenceProvenanceRecord, claimed_tier: TrustTier): DerivedEvidenceValidationResult {
  const validation = validateDerivedEvidenceRecord(record);
  const issues = [...validation.issues];
  if (compareTrustTier(claimed_tier, record.effective_tier) > 0) {
    issues.push(issue("trust_laundering_attempt", "claimed_tier", "Claimed tier exceeds effective_tier."));
  }

  return { ok: issues.length === 0, issues };
}

export function minTrustTier(tiers: readonly TrustTier[]): TrustTier {
  if (tiers.length === 0) {
    return "T0";
  }

  return tiers.reduce((lowest, tier) => compareTrustTier(tier, lowest) < 0 ? tier : lowest);
}

export function compareTrustTier(left: TrustTier, right: TrustTier): number {
  return TRUST_ORDER.indexOf(left) - TRUST_ORDER.indexOf(right);
}

function isTrustTier(value: unknown): value is TrustTier {
  return typeof value === "string" && (TRUST_ORDER as readonly string[]).includes(value);
}

function issue(code: string, path: string, message: string): DerivedEvidenceIssue {
  return { code, path, message };
}

function cloneJson(value: JsonValue): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue;
}

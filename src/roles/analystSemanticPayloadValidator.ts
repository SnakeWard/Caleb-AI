import { VALID_ROLE_ACCEPTANCE_STATUSES } from "./types/roleArtifact.js";
import {
  ANALYST_BOUNDS,
  ANALYST_FINDING_STANCES,
  ANALYST_OUTPUT_TYPES,
  ANALYST_SEMANTIC_SCHEMA_VERSION,
  type AnalystOutputType,
  type AnalystSemanticPayloadValidationIssue,
  type AnalystSemanticPayloadValidationResult
} from "./types/analystSemanticPayload.js";

/** Fields that would assert or promote trust above T1 for Analyst-authored content. */
const TIER_PROMOTION_KEYS = new Set([
  "trust_tier",
  "trustTier",
  "max_allowed_trust_tier",
  "maxAllowedTrustTier",
  "trust_promotion",
  "trustPromotion",
  "promotes_trust",
  "promotesTrust",
  "verified_trust_tier",
  "verifiedTrustTier",
  "hollow_trust_tier",
  "self_verified",
  "selfVerified",
  "t2_claim",
  "t2Claim"
]);

/** Execution-result fields forbidden on hollow_evidence_request (request-only). */
const HOLLOW_RESULT_FORBIDDEN_KEYS = new Set([
  "result",
  "output",
  "hollow_output",
  "hollowOutput",
  "execution_result",
  "executionResult",
  "hollow_result",
  "hollowResult",
  "return_value",
  "returnValue",
  "gated_output",
  "gatedOutput",
  "observation",
  "raw_output",
  "rawOutput"
]);

const BASE_FIELDS = [
  "schema_version",
  "role_id",
  "output_type",
  "summary",
  "confidence",
  "acceptance_status"
] as const;

const TYPE_FIELDS: Record<AnalystOutputType, readonly string[]> = {
  finding: [...BASE_FIELDS, "findings"],
  gap_analysis: [...BASE_FIELDS, "gaps"],
  plan_revision_request: [...BASE_FIELDS, "revision_reason", "revision_targets"],
  hollow_evidence_request: [...BASE_FIELDS, "hollow_id", "evidence_sought"]
};

export function validateAnalystSemanticPayload(
  input: unknown
): AnalystSemanticPayloadValidationResult {
  const issues: AnalystSemanticPayloadValidationIssue[] = [];
  if (!isRecord(input)) {
    return result([issue("invalid_root", "$", "Analyst payload must be a JSON object.")]);
  }

  scanForbiddenTierDeep(input, "$", issues);

  if (input["schema_version"] !== ANALYST_SEMANTIC_SCHEMA_VERSION) {
    issues.push(issue(
      "invalid_schema_version",
      "$.schema_version",
      `schema_version must be ${ANALYST_SEMANTIC_SCHEMA_VERSION}.`
    ));
  }
  if (input["role_id"] !== "analyst") {
    issues.push(issue("invalid_role_id", "$.role_id", "role_id must be analyst."));
  }

  const outputType = input["output_type"];
  if (typeof outputType !== "string" || !ANALYST_OUTPUT_TYPES.includes(outputType as AnalystOutputType)) {
    issues.push(issue(
      "unknown_output_type",
      "$.output_type",
      "output_type must be one of the four Analyst evidence output types."
    ));
    return result(issues);
  }
  const typed = outputType as AnalystOutputType;
  const allowed = TYPE_FIELDS[typed];
  validateClosedObject(input, allowed, "$", issues);
  for (const field of allowed) {
    if (!Object.prototype.hasOwnProperty.call(input, field)) {
      issues.push(issue("missing_required_field", `$.${field}`, `${field} is required.`));
    }
  }

  requireBoundedString(input["summary"], "$.summary", ANALYST_BOUNDS.summary_max, issues);
  if (
    typeof input["confidence"] !== "number" ||
    !Number.isFinite(input["confidence"]) ||
    input["confidence"] < 0 ||
    input["confidence"] > 1
  ) {
    issues.push(issue(
      "invalid_confidence",
      "$.confidence",
      "confidence must be a finite number from 0 through 1."
    ));
  }
  if (!VALID_ROLE_ACCEPTANCE_STATUSES.includes(input["acceptance_status"] as never)) {
    issues.push(issue(
      "invalid_acceptance_status",
      "$.acceptance_status",
      "acceptance_status must be an allowed RoleAcceptanceStatus."
    ));
  }

  switch (typed) {
    case "finding":
      validateFindings(input["findings"], issues);
      break;
    case "gap_analysis":
      validateGaps(input["gaps"], issues);
      break;
    case "plan_revision_request":
      requireBoundedString(
        input["revision_reason"],
        "$.revision_reason",
        ANALYST_BOUNDS.revision_reason_max,
        issues
      );
      validateStringArray(
        input["revision_targets"],
        "$.revision_targets",
        ANALYST_BOUNDS.revision_targets_max,
        ANALYST_BOUNDS.id_max,
        issues
      );
      break;
    case "hollow_evidence_request":
      requireBoundedString(input["hollow_id"], "$.hollow_id", ANALYST_BOUNDS.id_max, issues);
      requireBoundedString(
        input["evidence_sought"],
        "$.evidence_sought",
        ANALYST_BOUNDS.evidence_sought_max,
        issues
      );
      for (const key of Object.keys(input)) {
        if (HOLLOW_RESULT_FORBIDDEN_KEYS.has(key)) {
          issues.push(issue(
            "malformed_hollow_request",
            `$.${key}`,
            "hollow_evidence_request is request-only and must not carry execution results."
          ));
        }
      }
      break;
  }

  return result(issues);
}

export function isAnalystSemanticPayload(input: unknown): boolean {
  return validateAnalystSemanticPayload(input).ok;
}

function validateFindings(value: unknown, issues: AnalystSemanticPayloadValidationIssue[]): void {
  if (!Array.isArray(value)) {
    issues.push(issue("invalid_array", "$.findings", "findings must be an array."));
    return;
  }
  if (value.length > ANALYST_BOUNDS.findings_max) {
    issues.push(issue(
      "cardinality_overflow",
      "$.findings",
      `findings length must be at most ${ANALYST_BOUNDS.findings_max}.`
    ));
  }
  const findingFields = [
    "finding_id",
    "stance",
    "claim_text",
    "rationale",
    "evidence_ref_ids"
  ] as const;
  value.forEach((entry, index) => {
    const path = `$.findings[${index}]`;
    if (!isRecord(entry)) {
      issues.push(issue("invalid_object", path, "finding item must be an object."));
      return;
    }
    validateClosedObject(entry, findingFields, path, issues);
    for (const field of findingFields) {
      if (!Object.prototype.hasOwnProperty.call(entry, field)) {
        issues.push(issue("missing_required_field", `${path}.${field}`, `${field} is required.`));
      }
    }
    requireBoundedString(entry["finding_id"], `${path}.finding_id`, ANALYST_BOUNDS.id_max, issues);
    if (
      typeof entry["stance"] !== "string" ||
      !ANALYST_FINDING_STANCES.includes(entry["stance"] as never)
    ) {
      issues.push(issue(
        "invalid_stance",
        `${path}.stance`,
        "stance must be supports, contradicts, or neutral."
      ));
    }
    requireBoundedString(entry["claim_text"], `${path}.claim_text`, ANALYST_BOUNDS.claim_text_max, issues);
    requireBoundedString(entry["rationale"], `${path}.rationale`, ANALYST_BOUNDS.rationale_max, issues);
    validateStringArray(
      entry["evidence_ref_ids"],
      `${path}.evidence_ref_ids`,
      ANALYST_BOUNDS.evidence_ref_ids_max,
      ANALYST_BOUNDS.id_max,
      issues
    );
    scanForbiddenTierDeep(entry, path, issues);
  });
}

function validateGaps(value: unknown, issues: AnalystSemanticPayloadValidationIssue[]): void {
  if (!Array.isArray(value)) {
    issues.push(issue("invalid_array", "$.gaps", "gaps must be an array."));
    return;
  }
  if (value.length > ANALYST_BOUNDS.gaps_max) {
    issues.push(issue(
      "cardinality_overflow",
      "$.gaps",
      `gaps length must be at most ${ANALYST_BOUNDS.gaps_max}.`
    ));
  }
  const gapFields = ["gap_id", "description"] as const;
  value.forEach((entry, index) => {
    const path = `$.gaps[${index}]`;
    if (!isRecord(entry)) {
      issues.push(issue("invalid_object", path, "gap item must be an object."));
      return;
    }
    validateClosedObject(entry, gapFields, path, issues);
    for (const field of gapFields) {
      if (!Object.prototype.hasOwnProperty.call(entry, field)) {
        issues.push(issue("missing_required_field", `${path}.${field}`, `${field} is required.`));
      }
    }
    requireBoundedString(entry["gap_id"], `${path}.gap_id`, ANALYST_BOUNDS.id_max, issues);
    requireBoundedString(
      entry["description"],
      `${path}.description`,
      ANALYST_BOUNDS.description_max,
      issues
    );
    scanForbiddenTierDeep(entry, path, issues);
  });
}

function validateStringArray(
  value: unknown,
  path: string,
  maxItems: number,
  maxString: number,
  issues: AnalystSemanticPayloadValidationIssue[]
): void {
  if (!Array.isArray(value)) {
    issues.push(issue("invalid_array", path, "must be an array."));
    return;
  }
  if (value.length > maxItems) {
    issues.push(issue(
      "cardinality_overflow",
      path,
      `array length must be at most ${maxItems}.`
    ));
  }
  value.forEach((entry, index) => {
    requireBoundedString(entry, `${path}[${index}]`, maxString, issues);
  });
}

function requireBoundedString(
  value: unknown,
  path: string,
  max: number,
  issues: AnalystSemanticPayloadValidationIssue[]
): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push(issue("invalid_string", path, "must be a non-empty string."));
    return;
  }
  if (value.length > max) {
    issues.push(issue(
      "string_length_overflow",
      path,
      `string length must be at most ${max}.`
    ));
  }
}

function validateClosedObject(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  issues: AnalystSemanticPayloadValidationIssue[]
): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) {
      issues.push(issue("unexpected_field", `${path}.${key}`, `Unexpected field '${key}'.`));
    }
  }
}

function scanForbiddenTierDeep(
  value: unknown,
  path: string,
  issues: AnalystSemanticPayloadValidationIssue[]
): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      scanForbiddenTierDeep(entry, `${path}[${index}]`, issues);
    });
    return;
  }
  if (!isRecord(value)) {
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (TIER_PROMOTION_KEYS.has(key)) {
      issues.push(issue(
        "tier_promotion_forbidden",
        childPath,
        "Analyst payloads cannot assert or promote trust above T1."
      ));
    }
    scanForbiddenTierDeep(child, childPath, issues);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function issue(
  code: string,
  path: string,
  message: string
): AnalystSemanticPayloadValidationIssue {
  return { code, path, message };
}

function result(
  issues: readonly AnalystSemanticPayloadValidationIssue[]
): AnalystSemanticPayloadValidationResult {
  return { ok: issues.length === 0, issues };
}

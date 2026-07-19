import { VALID_ROLE_ACCEPTANCE_STATUSES } from "./types/roleArtifact.js";
import type {
  LiveRoleSemanticPayload,
  LiveRoleSemanticPayloadValidationIssue,
  LiveRoleSemanticPayloadValidationResult
} from "./types/liveRoleSemanticPayload.js";

export const LIVE_ROLE_SEMANTIC_MAX_STRING_LENGTH = 4000;
export const LIVE_ROLE_SEMANTIC_MAX_ARRAY_LENGTH = 50;

const REQUIRED_FIELDS = [
  "summary",
  "claims",
  "assumptions",
  "constraints",
  "open_questions",
  "recommendations",
  "evidence_refs",
  "confidence",
  "handoff_notes",
  "acceptance_status"
] as const;

const STRING_ARRAY_FIELDS = [
  "assumptions",
  "constraints",
  "open_questions",
  "recommendations",
  "handoff_notes"
] as const;

const CLAIM_FIELDS = ["claim_id", "text", "evidence_ref_ids"] as const;
const EVIDENCE_FIELDS = ["ref_id", "ref_type", "description"] as const;
const EVIDENCE_REF_TYPES = new Set([
  "hollow_evidence",
  "ledger_entry",
  "artifact",
  "context",
  "trace",
  "human_input"
]);
const FORBIDDEN_KEYS = new Set([
  "chain_of_thought",
  "chainOfThought",
  "hidden_chain_of_thought",
  "hiddenChainOfThought",
  "private_reasoning",
  "privateReasoning",
  "reasoning_transcript",
  "reasoningTranscript",
  "scratchpad",
  "raw_scratchpad",
  "rawScratchpad",
  "thought_log",
  "thoughtLog",
  "secrets",
  "credentials",
  "raw_file_contents",
  "rawFileContents",
  "hollow_input",
  "hollowInput",
  "input_payload",
  "inputPayload"
]);

export function validateLiveRoleSemanticPayload(
  input: unknown
): LiveRoleSemanticPayloadValidationResult {
  const issues: LiveRoleSemanticPayloadValidationIssue[] = [];
  if (!isRecord(input)) {
    return result([issue("invalid_root", "$", "Semantic payload must be a JSON object.")]);
  }

  validateClosedObject(input, REQUIRED_FIELDS, "$", issues);
  for (const field of REQUIRED_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(input, field)) {
      issues.push(issue("missing_required_field", `$.${field}`, `${field} is required.`));
    }
  }

  requireNonEmptyString(input["summary"], "$.summary", issues);
  validateClaims(input["claims"], issues);
  for (const field of STRING_ARRAY_FIELDS) {
    validateStringArray(input[field], `$.${field}`, issues);
  }
  validateEvidenceRefs(input["evidence_refs"], issues);
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

  scanForbiddenKeys(input, "$", issues);
  validateRecursiveBounds(input, "$", issues);
  return result(issues);
}

export function isLiveRoleSemanticPayload(input: unknown): input is LiveRoleSemanticPayload {
  return validateLiveRoleSemanticPayload(input).ok;
}

function validateClaims(value: unknown, issues: LiveRoleSemanticPayloadValidationIssue[]): void {
  if (!validateArray(value, "$.claims", issues)) {
    return;
  }
  value.forEach((entry, index) => {
    const path = `$.claims[${index}]`;
    if (!isRecord(entry)) {
      issues.push(issue("invalid_claim", path, "Each claim must be an object."));
      return;
    }
    validateClosedObject(entry, CLAIM_FIELDS, path, issues);
    for (const field of CLAIM_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(entry, field)) {
        issues.push(issue("missing_required_field", `${path}.${field}`, `${field} is required.`));
      }
    }
    requireNonEmptyString(entry["claim_id"], `${path}.claim_id`, issues);
    requireNonEmptyString(entry["text"], `${path}.text`, issues);
    validateStringArray(entry["evidence_ref_ids"], `${path}.evidence_ref_ids`, issues);
  });
}

function validateEvidenceRefs(value: unknown, issues: LiveRoleSemanticPayloadValidationIssue[]): void {
  if (!validateArray(value, "$.evidence_refs", issues)) {
    return;
  }
  value.forEach((entry, index) => {
    const path = `$.evidence_refs[${index}]`;
    if (!isRecord(entry)) {
      issues.push(issue("invalid_evidence_ref", path, "Each evidence reference must be an object."));
      return;
    }
    validateClosedObject(entry, EVIDENCE_FIELDS, path, issues);
    for (const field of EVIDENCE_FIELDS) {
      if (!Object.prototype.hasOwnProperty.call(entry, field)) {
        issues.push(issue("missing_required_field", `${path}.${field}`, `${field} is required.`));
      }
    }
    requireNonEmptyString(entry["ref_id"], `${path}.ref_id`, issues);
    requireNonEmptyString(entry["description"], `${path}.description`, issues);
    if (typeof entry["ref_type"] !== "string" || !EVIDENCE_REF_TYPES.has(entry["ref_type"])) {
      issues.push(issue(
        "invalid_evidence_ref_type",
        `${path}.ref_type`,
        "ref_type must be an allowed RoleArtifactEvidenceRef type."
      ));
    }
  });
}

function validateStringArray(
  value: unknown,
  path: string,
  issues: LiveRoleSemanticPayloadValidationIssue[]
): void {
  if (!validateArray(value, path, issues)) {
    return;
  }
  value.forEach((entry, index) => {
    if (typeof entry !== "string") {
      issues.push(issue("invalid_array_item", `${path}[${index}]`, "Array entries must be strings."));
    }
  });
}

function validateArray(
  value: unknown,
  path: string,
  issues: LiveRoleSemanticPayloadValidationIssue[]
): value is unknown[] {
  if (!Array.isArray(value)) {
    issues.push(issue("invalid_array", path, `${path} must be an array.`));
    return false;
  }
  return true;
}

function validateClosedObject(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  issues: LiveRoleSemanticPayloadValidationIssue[]
): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) {
      issues.push(issue("unexpected_field", `${path}.${key}`, `${key} is not allowed in this object.`));
    }
  }
}

function requireNonEmptyString(
  value: unknown,
  path: string,
  issues: LiveRoleSemanticPayloadValidationIssue[]
): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    issues.push(issue("invalid_required_string", path, `${path} must be a non-empty string.`));
  }
}

function scanForbiddenKeys(
  value: unknown,
  path: string,
  issues: LiveRoleSemanticPayloadValidationIssue[],
  parentKey?: string
): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => scanForbiddenKeys(entry, `${path}[${index}]`, issues, parentKey));
    return;
  }
  if (!isRecord(value)) {
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (FORBIDDEN_KEYS.has(key)) {
      issues.push(issue("forbidden_key", childPath, `Forbidden key '${key}' is not allowed.`));
    }
    if ((parentKey === "telemetry_trace" || parentKey === "telemetryTrace") && key === "events") {
      issues.push(issue(
        "embedded_telemetry_events_forbidden",
        childPath,
        "Embedded telemetry events are forbidden."
      ));
    }
    scanForbiddenKeys(child, childPath, issues, key);
  }
}

function validateRecursiveBounds(
  value: unknown,
  path: string,
  issues: LiveRoleSemanticPayloadValidationIssue[]
): void {
  if (typeof value === "string") {
    if (value.length > LIVE_ROLE_SEMANTIC_MAX_STRING_LENGTH) {
      issues.push(issue(
        "string_too_long",
        path,
        `String exceeds maximum length of ${LIVE_ROLE_SEMANTIC_MAX_STRING_LENGTH}.`
      ));
    }
    return;
  }
  if (Array.isArray(value)) {
    if (value.length > LIVE_ROLE_SEMANTIC_MAX_ARRAY_LENGTH) {
      issues.push(issue(
        "array_too_long",
        path,
        `Array exceeds maximum length of ${LIVE_ROLE_SEMANTIC_MAX_ARRAY_LENGTH}.`
      ));
    }
    value.forEach((entry, index) => validateRecursiveBounds(entry, `${path}[${index}]`, issues));
    return;
  }
  if (isRecord(value)) {
    for (const [key, child] of Object.entries(value)) {
      validateRecursiveBounds(child, `${path}.${key}`, issues);
    }
  }
}

function result(
  issues: readonly LiveRoleSemanticPayloadValidationIssue[]
): LiveRoleSemanticPayloadValidationResult {
  return { ok: issues.length === 0, issues };
}

function issue(code: string, path: string, message: string): LiveRoleSemanticPayloadValidationIssue {
  return { code, path, message };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

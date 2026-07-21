/**
 * Five-check verifier for lineage_resolved_decision_facing_record (RA-X-3).
 * Atomic with allowlist membership: the route-input gate must invoke this.
 */

import {
  catalogProvidesCapability,
  getRoleCapabilityCatalog,
  type RoleCapabilityCatalog
} from "../roles/roleCapabilitySet.js";
import {
  DECISION_FACING_BOUNDS,
  LINEAGE_RESOLVED_DECISION_FACING_RECORD_KIND,
  type LineageResolveResult,
  type LineageResolvedDecisionFacingRecord,
  type LineageResolvedDecisionFacingValidationIssue,
  type LineageResolvedDecisionFacingValidationResult
} from "./types/lineageResolvedDecisionFacingRecord.js";

const ALLOWED_TOP_LEVEL = [
  "record_kind",
  "record_id",
  "source",
  "validated_at",
  "lineage_refs",
  "task_requirements"
] as const;

const TASK_REQUIREMENT_FIELDS = [
  "summary",
  "required_capabilities",
  "constraints",
  "open_questions"
] as const;

/** Fields that pre-commit a route (check #4 — doctrine-critical). */
const ROUTE_PRECOMMIT_KEYS = new Set([
  "roles_required",
  "role_sequence",
  "ordered_roles",
  "roles",
  "route_mode",
  "route_id",
  "rotation_plan",
  "runtime_rotation_plan",
  "next_roles",
  "sequence",
  "role_order",
  "planned_roles"
]);

/** Fields that assert or promote trust (check #3). */
const TIER_ASSERTION_KEYS = new Set([
  "trust_tier",
  "effective_tier",
  "max_allowed_trust_tier",
  "measurement_tier",
  "subject_tier",
  "verified_trust_tier",
  "promotes_trust",
  "trust_promotion"
]);

const GATED_ROOT_PREFIX =
  /^gated:(contract_validated_task_frame|accepted_gate_policy_result|human_pat_approval_record|snapshot_change_guard_state|deterministic_hollow_signal|verified_signal_frame):[A-Za-z0-9._:-]+$/;

const GATED_NODE_PREFIX = /^gated:[a-z0-9_]+:[A-Za-z0-9._:-]+$/i;

export interface LineageDecisionFacingVerifierOptions {
  readonly capability_catalog?: RoleCapabilityCatalog;
  readonly lineage_resolver?: (ref: string) => LineageResolveResult | null;
}

export function validateLineageResolvedDecisionFacingRecord(
  input: unknown,
  options: LineageDecisionFacingVerifierOptions = {}
): LineageResolvedDecisionFacingValidationResult {
  const issues: LineageResolvedDecisionFacingValidationIssue[] = [];
  if (!isRecord(input)) {
    return fail([issue("invalid_root", "$", "Decision-facing record must be a JSON object.")]);
  }

  if (input["record_kind"] !== LINEAGE_RESOLVED_DECISION_FACING_RECORD_KIND) {
    return fail([
      issue(
        "invalid_record_kind",
        "$.record_kind",
        `record_kind must be ${LINEAGE_RESOLVED_DECISION_FACING_RECORD_KIND}.`
      )
    ]);
  }

  // Check #3 / #4 structural scans (including nested).
  scanForbiddenKeys(input, "$", issues);

  validateClosedObject(input, ALLOWED_TOP_LEVEL, "$", issues);
  for (const field of ALLOWED_TOP_LEVEL) {
    if (!Object.prototype.hasOwnProperty.call(input, field)) {
      issues.push(issue("missing_required_field", `$.${field}`, `${field} is required.`));
    }
  }

  if (!isNonEmptyString(input["record_id"], DECISION_FACING_BOUNDS.id_max)) {
    issues.push(issue("invalid_record_id", "$.record_id", "record_id must be a non-empty bounded string."));
  }
  if (input["source"] !== "logic_engine") {
    issues.push(issue("invalid_source", "$.source", "source must be logic_engine."));
  }
  if (!isNonEmptyString(input["validated_at"], DECISION_FACING_BOUNDS.summary_max)) {
    issues.push(issue("invalid_validated_at", "$.validated_at", "validated_at must be a non-empty string."));
  }

  // Check #1 — lineage completeness.
  issues.push(...validateLineage(input["lineage_refs"], options.lineage_resolver));

  // Check #2 — decision-field well-formedness.
  issues.push(...validateTaskRequirements(input["task_requirements"]));

  // Check #5 — satisfiability against single-source capability catalog.
  const catalog = options.capability_catalog ?? getRoleCapabilityCatalog();
  issues.push(...validateSatisfiability(input["task_requirements"], catalog));

  if (issues.length > 0) {
    return fail(issues);
  }

  return {
    ok: true,
    record: input as unknown as LineageResolvedDecisionFacingRecord,
    issues: []
  };
}

function validateLineage(
  value: unknown,
  resolver?: (ref: string) => LineageResolveResult | null
): LineageResolvedDecisionFacingValidationIssue[] {
  const issues: LineageResolvedDecisionFacingValidationIssue[] = [];
  if (!Array.isArray(value) || value.length === 0) {
    issues.push(issue(
      "lineage_incomplete",
      "$.lineage_refs",
      "lineage_refs must be a non-empty array."
    ));
    return issues;
  }
  if (value.length > DECISION_FACING_BOUNDS.lineage_refs_max) {
    issues.push(issue(
      "cardinality_overflow",
      "$.lineage_refs",
      `lineage_refs length must be at most ${DECISION_FACING_BOUNDS.lineage_refs_max}.`
    ));
  }

  let hasTrustedRoot = false;
  value.forEach((ref, index) => {
    const path = `$.lineage_refs[${index}]`;
    if (typeof ref !== "string" || ref.trim().length === 0) {
      issues.push(issue("invalid_lineage_ref", path, "lineage ref must be a non-empty string."));
      return;
    }
    if (ref.length > DECISION_FACING_BOUNDS.id_max * 2) {
      issues.push(issue("string_length_overflow", path, "lineage ref exceeds length bound."));
    }

    // Masquerade: role-artifact-only lineage is not a trusted root.
    if (ref.startsWith("role_artifact:")) {
      issues.push(issue(
        "lineage_untrusted_root",
        path,
        "Role-artifact lineage without a gated trusted root is refused."
      ));
      return;
    }

    const resolved = resolver?.(ref) ?? defaultLineageResolve(ref);
    if (resolved === null || resolved.status === "orphan") {
      issues.push(issue(
        "lineage_orphan_ref",
        path,
        "Lineage ref does not resolve to a previously gated artifact."
      ));
      return;
    }
    if (resolved.status === "trusted_root") {
      hasTrustedRoot = true;
    }
  });

  if (!hasTrustedRoot && issues.length === 0) {
    issues.push(issue(
      "lineage_incomplete",
      "$.lineage_refs",
      "Lineage must terminate at a gated trusted root."
    ));
  }
  return issues;
}

function defaultLineageResolve(ref: string): LineageResolveResult | null {
  if (GATED_ROOT_PREFIX.test(ref)) {
    const kind = ref.split(":")[1];
    return kind === undefined
      ? { status: "trusted_root" }
      : { status: "trusted_root", record_kind: kind };
  }
  if (GATED_NODE_PREFIX.test(ref)) {
    const kind = ref.split(":")[1];
    return kind === undefined
      ? { status: "resolved_node" }
      : { status: "resolved_node", record_kind: kind };
  }
  return { status: "orphan" };
}

function validateTaskRequirements(value: unknown): LineageResolvedDecisionFacingValidationIssue[] {
  const issues: LineageResolvedDecisionFacingValidationIssue[] = [];
  if (!isRecord(value)) {
    issues.push(issue(
      "invalid_task_requirements",
      "$.task_requirements",
      "task_requirements must be an object."
    ));
    return issues;
  }
  validateClosedObject(value, TASK_REQUIREMENT_FIELDS, "$.task_requirements", issues);
  for (const field of TASK_REQUIREMENT_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(value, field)) {
      issues.push(issue(
        "missing_required_field",
        `$.task_requirements.${field}`,
        `${field} is required.`
      ));
    }
  }

  if (!isNonEmptyString(value["summary"], DECISION_FACING_BOUNDS.summary_max)) {
    if (typeof value["summary"] === "string" && value["summary"].length > DECISION_FACING_BOUNDS.summary_max) {
      issues.push(issue(
        "string_length_overflow",
        "$.task_requirements.summary",
        `summary must be at most ${DECISION_FACING_BOUNDS.summary_max} characters.`
      ));
    } else {
      issues.push(issue(
        "invalid_string",
        "$.task_requirements.summary",
        "summary must be a non-empty string."
      ));
    }
  }

  issues.push(
    ...validateStringArray(
      value["required_capabilities"],
      "$.task_requirements.required_capabilities",
      DECISION_FACING_BOUNDS.required_capabilities_max,
      DECISION_FACING_BOUNDS.capability_max
    )
  );
  issues.push(
    ...validateStringArray(
      value["constraints"],
      "$.task_requirements.constraints",
      DECISION_FACING_BOUNDS.constraints_max,
      DECISION_FACING_BOUNDS.constraint_max
    )
  );
  issues.push(
    ...validateStringArray(
      value["open_questions"],
      "$.task_requirements.open_questions",
      DECISION_FACING_BOUNDS.open_questions_max,
      DECISION_FACING_BOUNDS.open_question_max
    )
  );

  // Free-form smuggling under task_requirements.
  scanForbiddenKeys(value, "$.task_requirements", issues);
  return issues;
}

function validateSatisfiability(
  taskRequirements: unknown,
  catalog: RoleCapabilityCatalog
): LineageResolvedDecisionFacingValidationIssue[] {
  const issues: LineageResolvedDecisionFacingValidationIssue[] = [];
  if (!isRecord(taskRequirements) || !Array.isArray(taskRequirements["required_capabilities"])) {
    return issues;
  }
  taskRequirements["required_capabilities"].forEach((capability, index) => {
    if (typeof capability !== "string") {
      return;
    }
    if (!catalogProvidesCapability(catalog, capability)) {
      issues.push(issue(
        "capability_unsatisfiable",
        `$.task_requirements.required_capabilities[${index}]`,
        `No registered role provides capability '${capability}'.`
      ));
    }
  });
  return issues;
}

function validateStringArray(
  value: unknown,
  path: string,
  maxItems: number,
  maxString: number
): LineageResolvedDecisionFacingValidationIssue[] {
  const issues: LineageResolvedDecisionFacingValidationIssue[] = [];
  if (!Array.isArray(value)) {
    issues.push(issue("invalid_array", path, "must be an array."));
    return issues;
  }
  if (value.length > maxItems) {
    issues.push(issue(
      "cardinality_overflow",
      path,
      `array length must be at most ${maxItems}.`
    ));
  }
  value.forEach((entry, index) => {
    const entryPath = `${path}[${index}]`;
    if (typeof entry !== "string" || entry.trim().length === 0) {
      issues.push(issue("invalid_string", entryPath, "must be a non-empty string."));
      return;
    }
    if (entry.length > maxString) {
      issues.push(issue(
        "string_length_overflow",
        entryPath,
        `string length must be at most ${maxString}.`
      ));
    }
  });
  return issues;
}

function scanForbiddenKeys(
  value: unknown,
  path: string,
  issues: LineageResolvedDecisionFacingValidationIssue[]
): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => {
      scanForbiddenKeys(entry, `${path}[${index}]`, issues);
    });
    return;
  }
  if (!isRecord(value)) {
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (ROUTE_PRECOMMIT_KEYS.has(key)) {
      issues.push(issue(
        "route_precommitment_forbidden",
        childPath,
        "Decision-facing records must not pre-commit a route or ordered role sequence."
      ));
    }
    if (TIER_ASSERTION_KEYS.has(key)) {
      issues.push(issue(
        "tier_assertion_forbidden",
        childPath,
        "Decision-facing records must not assert or promote trust tier."
      ));
    }
    scanForbiddenKeys(child, childPath, issues);
  }
}

function validateClosedObject(
  value: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  issues: LineageResolvedDecisionFacingValidationIssue[]
): void {
  const allowedSet = new Set(allowed);
  for (const key of Object.keys(value)) {
    if (!allowedSet.has(key)) {
      issues.push(issue("unexpected_field", `${path}.${key}`, `Unexpected field '${key}'.`));
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown, max: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}

function issue(
  code: string,
  path: string,
  message: string
): LineageResolvedDecisionFacingValidationIssue {
  return { code, path, message };
}

function fail(
  issues: readonly LineageResolvedDecisionFacingValidationIssue[]
): LineageResolvedDecisionFacingValidationResult {
  return { ok: false, record: null, issues };
}

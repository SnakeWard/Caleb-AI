import type { JsonValue } from "../../types/common.js";
import type { CalebCheck } from "../../types/invocation.js";
import type { HollowManifest } from "../../types/hollow.js";
import type { HollowImplementation } from "../runnerTypes.js";

export const PASS_COMPLIANCE_SCHEMA_VERSION = "1.0.0" as const;

export type PassComplianceChangeKind = "created" | "modified" | "deleted";

export interface PassManifestInput {
  readonly pass_id: string;
  readonly schema_version: typeof PASS_COMPLIANCE_SCHEMA_VERSION;
  readonly allowed_create: readonly string[];
  readonly allowed_modify: readonly string[];
  readonly allowed_delete: readonly string[];
  readonly forbidden: readonly string[];
}

export interface ChangesetEntryInput {
  readonly path: string;
  readonly change_kind: PassComplianceChangeKind;
}

export interface PassComplianceInput {
  readonly pass_manifest: PassManifestInput;
  readonly changeset: { readonly entries: readonly ChangesetEntryInput[] };
}

export interface PassComplianceViolation {
  readonly code: string;
  readonly path: string;
  readonly matched_rule: string | null;
  readonly change_kind: PassComplianceChangeKind | null;
}

export interface PassComplianceSummary {
  readonly pass_id: string;
  readonly entry_count: number;
  readonly created_count: number;
  readonly modified_count: number;
  readonly deleted_count: number;
  readonly violation_count: number;
  readonly forbidden_hits: number;
  readonly unlisted_creates: number;
  readonly unlisted_modifies: number;
  readonly unexpected_deletions: number;
}

export interface PassComplianceResult {
  readonly valid: boolean;
  readonly compliant: boolean | null;
  readonly status: "compliant" | "violations" | "invalid_input";
  readonly checks: readonly CalebCheck[];
  readonly violations: readonly PassComplianceViolation[];
  readonly summary: PassComplianceSummary;
}

export const passComplianceCheckManifest = {
  hollow_id: "hollow.audit.pass_compliance_check",
  hollow_name: "Pass Compliance Check Hollow",
  hollow_version: "1.0.0",
  schema_version: "1.0.0",
  category: "policy",
  description:
    "Deterministically evaluates a supplied Pass Manifest against a supplied Changeset and reports protocol compliance. Supplied-state only; report-only; non-enforcing.",
  input_type: "pass_compliance_check_input",
  input_schema_ref: "schemas/hollows/audit/pass-compliance-check.input.json",
  output_schema_ref: "schemas/hollows/audit/pass-compliance-check.output.json",
  permissions: ["none"],
  permissions_required: [],
  file_access_scope: "none",
  network_access: false,
  execution_mode: "local_deterministic",
  deterministic: true,
  deterministic_level: "strict",
  result_units: "compliance_verdict",
  checks: [
    "manifest_present",
    "changeset_present",
    "compliance_evaluation_completed",
    "supplied_state_only_confirmed"
  ],
  max_input_size: 500000,
  max_runtime_ms: 2000,
  supports_batching: false,
  supports_streaming: false,
  cache_policy: "input_digest",
  status: "trusted",
  owner: "caleb-ai-core"
} as const satisfies HollowManifest;

const MANIFEST_FIELDS = new Set([
  "pass_id",
  "schema_version",
  "allowed_create",
  "allowed_modify",
  "allowed_delete",
  "forbidden"
]);

const CHANGESET_FIELDS = new Set(["entries"]);
const ENTRY_FIELDS = new Set(["path", "change_kind"]);
const INPUT_FIELDS = new Set(["pass_manifest", "changeset"]);
const CHANGE_KINDS = new Set<PassComplianceChangeKind>(["created", "modified", "deleted"]);

export function evaluatePassCompliance(input: unknown): PassComplianceResult {
  const violations: PassComplianceViolation[] = [];
  const inputErrors = validateInput(input, violations);

  if (inputErrors.length > 0) {
    return buildResult({
      valid: false,
      compliant: null,
      status: "invalid_input",
      violations: sortViolations(violations),
      summary: buildSummary(readPassId(input), [], violations)
    });
  }

  const parsed = input as PassComplianceInput;
  const entries = [...parsed.changeset.entries];
  evaluateCompliance(parsed.pass_manifest, entries, violations);

  const status = violations.length === 0 ? "compliant" : "violations";
  return buildResult({
    valid: true,
    compliant: violations.length === 0,
    status,
    violations: sortViolations(violations),
    summary: buildSummary(parsed.pass_manifest.pass_id, entries, violations)
  });
}

export const passComplianceCheckImplementation: HollowImplementation = ({ input_payload }) => {
  const result = evaluatePassCompliance(input_payload);

  return {
    result: result as unknown as JsonValue,
    result_units: "compliance_verdict",
    checks: [
      check("manifest_present", "Manifest Present"),
      check("changeset_present", "Changeset Present"),
      check("compliance_evaluation_completed", "Compliance Evaluation Completed"),
      check("supplied_state_only_confirmed", "Supplied State Only Confirmed")
    ],
    warnings: [],
    artifact_hashes: [],
    confidence_level: "deterministic_pass_compliance_audit"
  };
};

function validateInput(input: unknown, violations: PassComplianceViolation[]): string[] {
  const errors: string[] = [];

  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    pushViolation(violations, "AUD_INVALID_CHANGESET", "$", null, null);
    return ["root"];
  }

  const root = input as Record<string, unknown>;
  for (const key of Object.keys(root)) {
    if (!INPUT_FIELDS.has(key)) {
      pushViolation(violations, "AUD_UNKNOWN_FIELD", `$.${key}`, null, null);
      errors.push(key);
    }
  }

  if (!Object.prototype.hasOwnProperty.call(root, "pass_manifest")) {
    pushViolation(violations, "AUD_MISSING_FIELD", "$.pass_manifest", null, null);
    errors.push("pass_manifest");
  }
  if (!Object.prototype.hasOwnProperty.call(root, "changeset")) {
    pushViolation(violations, "AUD_MISSING_FIELD", "$.changeset", null, null);
    errors.push("changeset");
  }

  if (errors.length > 0) {
    return errors;
  }

  validateManifest(root["pass_manifest"], violations, errors);
  validateChangeset(root["changeset"], violations, errors);
  return errors;
}

function validateManifest(value: unknown, violations: PassComplianceViolation[], errors: string[]): void {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    pushViolation(violations, "AUD_INVALID_MANIFEST", "$.pass_manifest", null, null);
    errors.push("pass_manifest");
    return;
  }

  const manifest = value as Record<string, unknown>;
  for (const key of Object.keys(manifest)) {
    if (!MANIFEST_FIELDS.has(key)) {
      pushViolation(violations, "AUD_UNKNOWN_FIELD", `$.pass_manifest.${key}`, null, null);
      errors.push(`pass_manifest.${key}`);
    }
  }

  for (const field of MANIFEST_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(manifest, field)) {
      pushViolation(violations, "AUD_MISSING_FIELD", `$.pass_manifest.${field}`, null, null);
      errors.push(`pass_manifest.${field}`);
    }
  }

  if (manifest["schema_version"] !== PASS_COMPLIANCE_SCHEMA_VERSION) {
    pushViolation(violations, "AUD_INVALID_SCHEMA_VERSION", "$.pass_manifest.schema_version", null, null);
    errors.push("schema_version");
  }

  if (typeof manifest["pass_id"] !== "string" || manifest["pass_id"].trim().length === 0) {
    pushViolation(violations, "AUD_INVALID_MANIFEST", "$.pass_manifest.pass_id", null, null);
    errors.push("pass_id");
  }

  validateStringArray(manifest["allowed_create"], "$.pass_manifest.allowed_create", violations, errors, false);
  validateStringArray(manifest["allowed_modify"], "$.pass_manifest.allowed_modify", violations, errors, false);
  validateStringArray(manifest["allowed_delete"], "$.pass_manifest.allowed_delete", violations, errors, true);
  validateStringArray(manifest["forbidden"], "$.pass_manifest.forbidden", violations, errors, false);
}

function validateChangeset(value: unknown, violations: PassComplianceViolation[], errors: string[]): void {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    pushViolation(violations, "AUD_INVALID_CHANGESET", "$.changeset", null, null);
    errors.push("changeset");
    return;
  }

  const changeset = value as Record<string, unknown>;
  for (const key of Object.keys(changeset)) {
    if (!CHANGESET_FIELDS.has(key)) {
      pushViolation(violations, "AUD_UNKNOWN_FIELD", `$.changeset.${key}`, null, null);
      errors.push(`changeset.${key}`);
    }
  }

  if (!Object.prototype.hasOwnProperty.call(changeset, "entries")) {
    pushViolation(violations, "AUD_MISSING_FIELD", "$.changeset.entries", null, null);
    errors.push("changeset.entries");
    return;
  }

  if (!Array.isArray(changeset["entries"])) {
    pushViolation(violations, "AUD_INVALID_CHANGESET", "$.changeset.entries", null, null);
    errors.push("changeset.entries");
    return;
  }

  const seenPaths = new Set<string>();
  changeset["entries"].forEach((entry, index) => {
    const entryPath = `$.changeset.entries[${index}]`;
    if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
      pushViolation(violations, "AUD_INVALID_CHANGESET", entryPath, null, null);
      errors.push(entryPath);
      return;
    }

    const record = entry as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      if (!ENTRY_FIELDS.has(key)) {
        pushViolation(violations, "AUD_UNKNOWN_FIELD", `${entryPath}.${key}`, null, null);
        errors.push(`${entryPath}.${key}`);
      }
    }

    if (!Object.prototype.hasOwnProperty.call(record, "path")) {
      pushViolation(violations, "AUD_MISSING_FIELD", `${entryPath}.path`, null, null);
      errors.push(`${entryPath}.path`);
    }
    if (!Object.prototype.hasOwnProperty.call(record, "change_kind")) {
      pushViolation(violations, "AUD_MISSING_FIELD", `${entryPath}.change_kind`, null, null);
      errors.push(`${entryPath}.change_kind`);
    }

    const pathValue = record["path"];
    if (typeof pathValue !== "string" || pathValue.trim().length === 0) {
      pushViolation(violations, "AUD_INVALID_CHANGESET", `${entryPath}.path`, null, null);
      errors.push(`${entryPath}.path`);
      return;
    }

    if (pathValue.includes("\\")) {
      pushViolation(violations, "AUD_BACKSLASH_PATH", `${entryPath}.path`, null, null);
      errors.push(`${entryPath}.path`);
    }

    const changeKind = record["change_kind"];
    if (typeof changeKind !== "string" || !CHANGE_KINDS.has(changeKind as PassComplianceChangeKind)) {
      pushViolation(violations, "AUD_UNKNOWN_CHANGE_KIND", `${entryPath}.change_kind`, null, null);
      errors.push(`${entryPath}.change_kind`);
      return;
    }

    if (seenPaths.has(pathValue)) {
      pushViolation(violations, "AUD_DUPLICATE_CHANGESET_PATH", `${entryPath}.path`, null, changeKind as PassComplianceChangeKind);
      errors.push(`${entryPath}.path`);
      return;
    }
    seenPaths.add(pathValue);
  });
}

function validateStringArray(
  value: unknown,
  path: string,
  violations: PassComplianceViolation[],
  errors: string[],
  allowEmpty: boolean
): void {
  if (!Array.isArray(value)) {
    pushViolation(violations, "AUD_INVALID_MANIFEST", path, null, null);
    errors.push(path);
    return;
  }

  if (!allowEmpty && value.length === 0) {
    pushViolation(violations, "AUD_INVALID_MANIFEST", path, null, null);
    errors.push(path);
    return;
  }

  value.forEach((entry, index) => {
    if (typeof entry !== "string" || entry.trim().length === 0) {
      pushViolation(violations, "AUD_INVALID_MANIFEST", `${path}[${index}]`, null, null);
      errors.push(`${path}[${index}]`);
    }
  });
}

function evaluateCompliance(
  manifest: PassManifestInput,
  entries: readonly ChangesetEntryInput[],
  violations: PassComplianceViolation[]
): void {
  for (const entry of entries) {
    const forbiddenRule = findMatchingRule(entry.path, manifest.forbidden);
    if (forbiddenRule !== null) {
      pushViolation(
        violations,
        "AUD_FORBIDDEN_PATH_TOUCHED",
        entry.path,
        forbiddenRule,
        entry.change_kind
      );
      continue;
    }

    if (entry.change_kind === "created") {
      const matched = findMatchingRule(entry.path, manifest.allowed_create);
      if (matched === null) {
        pushViolation(violations, "AUD_UNLISTED_FILE_CREATED", entry.path, null, entry.change_kind);
      }
      continue;
    }

    if (entry.change_kind === "modified") {
      const matched = findMatchingRule(entry.path, manifest.allowed_modify);
      if (matched === null) {
        pushViolation(violations, "AUD_UNLISTED_FILE_MODIFIED", entry.path, null, entry.change_kind);
      }
      continue;
    }

    const matched = findMatchingRule(entry.path, manifest.allowed_delete);
    if (matched === null) {
      pushViolation(violations, "AUD_UNEXPECTED_DELETION", entry.path, null, entry.change_kind);
    }
  }
}

export function pathMatchesRule(path: string, rule: string): boolean {
  if (rule.endsWith("/**")) {
    const prefix = rule.slice(0, -3);
    return path.startsWith(`${prefix}/`);
  }

  return path === rule;
}

function findMatchingRule(path: string, rules: readonly string[]): string | null {
  for (const rule of rules) {
    if (pathMatchesRule(path, rule)) {
      return rule;
    }
  }
  return null;
}

function buildSummary(
  passId: string,
  entries: readonly ChangesetEntryInput[],
  violations: readonly PassComplianceViolation[]
): PassComplianceSummary {
  const created_count = entries.filter((entry) => entry.change_kind === "created").length;
  const modified_count = entries.filter((entry) => entry.change_kind === "modified").length;
  const deleted_count = entries.filter((entry) => entry.change_kind === "deleted").length;

  const forbidden_hits = violations.filter((entry) => entry.code === "AUD_FORBIDDEN_PATH_TOUCHED").length;
  const unlisted_creates = violations.filter((entry) => entry.code === "AUD_UNLISTED_FILE_CREATED").length;
  const unlisted_modifies = violations.filter((entry) => entry.code === "AUD_UNLISTED_FILE_MODIFIED").length;
  const unexpected_deletions = violations.filter((entry) => entry.code === "AUD_UNEXPECTED_DELETION").length;

  return {
    pass_id: passId,
    entry_count: entries.length,
    created_count,
    modified_count,
    deleted_count,
    violation_count: violations.length,
    forbidden_hits,
    unlisted_creates,
    unlisted_modifies,
    unexpected_deletions
  };
}

function buildResult(args: {
  valid: boolean;
  compliant: boolean | null;
  status: PassComplianceResult["status"];
  violations: readonly PassComplianceViolation[];
  summary: PassComplianceSummary;
}): PassComplianceResult {
  return {
    valid: args.valid,
    compliant: args.compliant,
    status: args.status,
    checks: [
      check("manifest_present", "Manifest Present"),
      check("changeset_present", "Changeset Present"),
      check("compliance_evaluation_completed", "Compliance Evaluation Completed"),
      check("supplied_state_only_confirmed", "Supplied State Only Confirmed")
    ],
    violations: args.violations,
    summary: args.summary
  };
}

function sortViolations(violations: readonly PassComplianceViolation[]): PassComplianceViolation[] {
  return [...violations].sort((left, right) => {
    const pathCompare = left.path.localeCompare(right.path);
    if (pathCompare !== 0) {
      return pathCompare;
    }
    return left.code.localeCompare(right.code);
  });
}

function pushViolation(
  violations: PassComplianceViolation[],
  code: string,
  path: string,
  matched_rule: string | null,
  change_kind: PassComplianceChangeKind | null
): void {
  violations.push({ code, path, matched_rule, change_kind });
}

function check(check_id: string, label: string): CalebCheck {
  return { check_id, label, status: "completed", severity: "info" };
}

function readPassId(input: unknown): string {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return "";
  }
  const manifest = (input as Record<string, unknown>)["pass_manifest"];
  if (typeof manifest !== "object" || manifest === null || Array.isArray(manifest)) {
    return "";
  }
  const passId = (manifest as Record<string, unknown>)["pass_id"];
  return typeof passId === "string" ? passId : "";
}
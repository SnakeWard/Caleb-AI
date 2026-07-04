import type { LedgerActorType, LedgerEntry } from "../types/ledger.js";
import type { TrustTier } from "../types/trust.js";
import { LedgerValidationError } from "./ledgerErrors.js";

export interface LedgerValidationIssue {
  readonly field: string;
  readonly message: string;
}

export interface LedgerValidationWarning {
  readonly field: string;
  readonly message: string;
}

export interface LedgerValidationResult {
  readonly valid: boolean;
  readonly entry?: LedgerEntry;
  readonly errors: readonly LedgerValidationIssue[];
  readonly warnings: readonly LedgerValidationWarning[];
}

const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;
const TRUST_TIERS = ["T0", "T1", "T2", "T3", "T4"] as const satisfies readonly TrustTier[];
const ACTOR_TYPES = [
  "user",
  "orchestration_core",
  "model",
  "hollow",
  "verified_return_path",
  "ledger",
  "change_guard",
  "system"
] as const satisfies readonly LedgerActorType[];

export function validateLedgerEntry(entry: unknown): LedgerValidationResult {
  const errors: LedgerValidationIssue[] = [];
  const warnings: LedgerValidationWarning[] = [];

  if (!isRecord(entry)) {
    return {
      valid: false,
      errors: [{ field: "entry", message: "LedgerEntry must be an object." }],
      warnings
    };
  }

  requireNonEmptyString(entry, "ledger_id", errors);
  requireSemVer(entry, "schema_version", errors);
  requireNonEmptyString(entry, "timestamp", errors);
  requireNonEmptyString(entry, "task_id", errors);
  requireNonEmptyString(entry, "run_id", errors);
  requireNonEmptyString(entry, "trace_id", errors);
  requireLiteral(entry, "actor_type", ACTOR_TYPES, errors);
  requireNonEmptyString(entry, "actor_id", errors);
  requireSemVer(entry, "actor_version", errors);
  requireNonEmptyString(entry, "activity", errors);
  requireNonEmptyString(entry, "status", errors);
  requireArray(entry, "warnings", errors);
  requireArray(entry, "errors", errors);
  requireArray(entry, "artifact_hashes", errors);
  requireObject(entry, "provenance", errors);
  requireBoolean(entry, "retryable", errors);
  requireNonEmptyString(entry, "verification_status", errors);
  requireLiteral(entry, "trust_tier", TRUST_TIERS, errors);
  requireArray(entry, "parent_refs", errors);
  requireArray(entry, "artifact_refs", errors);

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  return {
    valid: true,
    entry: entry as unknown as LedgerEntry,
    errors,
    warnings
  };
}

export function assertValidLedgerEntry(entry: unknown): LedgerEntry {
  const result = validateLedgerEntry(entry);
  if (!result.valid || result.entry === undefined) {
    throw new LedgerValidationError(result.errors);
  }

  return result.entry;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireNonEmptyString(
  entry: Record<string, unknown>,
  field: string,
  errors: LedgerValidationIssue[]
): void {
  if (typeof entry[field] !== "string" || entry[field].trim().length === 0) {
    errors.push({ field, message: `${field} must be a non-empty string.` });
  }
}

function requireSemVer(
  entry: Record<string, unknown>,
  field: string,
  errors: LedgerValidationIssue[]
): void {
  if (typeof entry[field] !== "string" || !SEMVER_PATTERN.test(entry[field])) {
    errors.push({ field, message: `${field} must be a SemVer-style string.` });
  }
}

function requireArray(
  entry: Record<string, unknown>,
  field: string,
  errors: LedgerValidationIssue[]
): void {
  if (!Array.isArray(entry[field])) {
    errors.push({ field, message: `${field} must be an array.` });
  }
}

function requireObject(
  entry: Record<string, unknown>,
  field: string,
  errors: LedgerValidationIssue[]
): void {
  if (!isRecord(entry[field])) {
    errors.push({ field, message: `${field} must be an object.` });
  }
}

function requireBoolean(
  entry: Record<string, unknown>,
  field: string,
  errors: LedgerValidationIssue[]
): void {
  if (typeof entry[field] !== "boolean") {
    errors.push({ field, message: `${field} must be a boolean.` });
  }
}

function requireLiteral<T extends string>(
  entry: Record<string, unknown>,
  field: string,
  allowed: readonly T[],
  errors: LedgerValidationIssue[]
): void {
  if (typeof entry[field] !== "string" || !(allowed as readonly string[]).includes(entry[field])) {
    errors.push({ field, message: `${field} must be one of: ${allowed.join(", ")}.` });
  }
}

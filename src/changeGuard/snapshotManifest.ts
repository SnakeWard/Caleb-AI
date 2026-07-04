import type { SnapshotManifest, SnapshotType } from "../types/snapshot.js";
import { SnapshotValidationError } from "./changeGuardErrors.js";
import type { SnapshotManifestValidationResult, SnapshotManifestValidationIssue } from "./changeGuardTypes.js";

const SNAPSHOT_TYPES = ["pre_change", "post_change", "emergency", "milestone"] as const satisfies readonly SnapshotType[];
const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;

export function createSnapshotId(type: SnapshotType, sequence = 1, date = new Date()): string {
  const timestamp = date.toISOString().replaceAll("-", "").replaceAll(":", "").replace(".", "");
  return `snap_${timestamp}_${sequence.toString().padStart(6, "0")}_${type}`;
}

export function validateSnapshotManifest(manifest: unknown): SnapshotManifestValidationResult {
  const errors: SnapshotManifestValidationIssue[] = [];
  const warnings: SnapshotManifestValidationIssue[] = [];

  if (!isRecord(manifest)) {
    return {
      valid: false,
      errors: [{ field: "manifest", message: "SnapshotManifest must be an object." }],
      warnings
    };
  }

  requireNonEmptyString(manifest, "snapshot_id", errors);
  requireLiteral(manifest, "snapshot_type", SNAPSHOT_TYPES, errors);
  requireSemVer(manifest, "schema_version", errors);
  requireNonEmptyString(manifest, "run_id", errors);
  requireNonEmptyString(manifest, "trace_id", errors);
  requireNonEmptyString(manifest, "requested_by", errors);
  requireStringOrNull(manifest, "approved_by", errors);
  requireNonEmptyString(manifest, "started_at", errors);
  requireStringOrNull(manifest, "completed_at", errors);
  requireNonEmptyString(manifest, "status", errors);
  requireNonEmptyString(manifest, "reason", errors);
  requireArray(manifest, "files_captured", errors);
  requireArray(manifest, "artifact_hashes", errors);
  requireObject(manifest, "provenance", errors);
  requireArray(manifest, "ledger_refs", errors);
  requireNonEmptyString(manifest, "rollback_method", errors);
  requireArray(manifest, "rollback_steps", errors);

  return errors.length === 0
    ? { valid: true, manifest: manifest as unknown as SnapshotManifest, errors, warnings }
    : { valid: false, errors, warnings };
}

export function assertValidSnapshotManifest(manifest: unknown): SnapshotManifest {
  const result = validateSnapshotManifest(manifest);
  if (!result.valid || result.manifest === undefined) {
    throw new SnapshotValidationError(result.errors.map((error) => error.message).join("; "));
  }
  return result.manifest;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireNonEmptyString(obj: Record<string, unknown>, field: string, errors: SnapshotManifestValidationIssue[]): void {
  if (typeof obj[field] !== "string" || obj[field].trim().length === 0) {
    errors.push({ field, message: `${field} must be a non-empty string.` });
  }
}

function requireSemVer(obj: Record<string, unknown>, field: string, errors: SnapshotManifestValidationIssue[]): void {
  if (typeof obj[field] !== "string" || !SEMVER_PATTERN.test(obj[field])) {
    errors.push({ field, message: `${field} must be a SemVer-style string.` });
  }
}

function requireStringOrNull(obj: Record<string, unknown>, field: string, errors: SnapshotManifestValidationIssue[]): void {
  if (typeof obj[field] !== "string" && obj[field] !== null) {
    errors.push({ field, message: `${field} must be a string or null.` });
  }
}

function requireArray(obj: Record<string, unknown>, field: string, errors: SnapshotManifestValidationIssue[]): void {
  if (!Array.isArray(obj[field])) {
    errors.push({ field, message: `${field} must be an array.` });
  }
}

function requireObject(obj: Record<string, unknown>, field: string, errors: SnapshotManifestValidationIssue[]): void {
  if (!isRecord(obj[field])) {
    errors.push({ field, message: `${field} must be an object.` });
  }
}

function requireLiteral<T extends string>(
  obj: Record<string, unknown>,
  field: string,
  allowed: readonly T[],
  errors: SnapshotManifestValidationIssue[]
): void {
  if (typeof obj[field] !== "string" || !(allowed as readonly string[]).includes(obj[field])) {
    errors.push({ field, message: `${field} must be one of: ${allowed.join(", ")}.` });
  }
}

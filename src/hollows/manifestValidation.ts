import type {
  DeterministicLevel,
  FileAccessScope,
  HollowCachePolicy,
  HollowCategory,
  HollowExecutionMode,
  HollowManifest,
  HollowStatus
} from "../types/hollow.js";
import type { SideEffectClass } from "../types/permissions.js";
import { V1_ALLOWED_SIDE_EFFECT_CLASSES } from "../types/permissions.js";
import { HollowManifestValidationError } from "./registryErrors.js";

export interface ManifestValidationError {
  readonly field: string;
  readonly message: string;
}

export interface ManifestValidationWarning {
  readonly field: string;
  readonly message: string;
}

export interface ManifestValidationResult {
  readonly valid: boolean;
  readonly manifest?: HollowManifest;
  readonly errors: readonly ManifestValidationError[];
  readonly warnings: readonly ManifestValidationWarning[];
}

const SIDE_EFFECT_CLASSES = [
  "none",
  "read_only",
  "ledger_write",
  "workspace_write",
  "network",
  "shell_command",
  "external_side_effect"
] as const satisfies readonly SideEffectClass[];

const HOLLOW_CATEGORIES = [
  "calculator",
  "text",
  "code",
  "media",
  "timeline",
  "validation",
  "provenance",
  "project",
  "policy",
  "recovery"
] as const satisfies readonly HollowCategory[];

const FILE_ACCESS_SCOPES = [
  "none",
  "provided_handles_only",
  "workspace_read",
  "workspace_write"
] as const satisfies readonly FileAccessScope[];

const EXECUTION_MODES = [
  "local_deterministic",
  "local_inspection",
  "local_transform",
  "approved_side_effect"
] as const satisfies readonly HollowExecutionMode[];

const DETERMINISTIC_LEVELS = [
  "strict",
  "bounded_external_state",
  "heuristic",
  "none"
] as const satisfies readonly DeterministicLevel[];

const HOLLOW_STATUSES = [
  "draft",
  "trusted",
  "deprecated",
  "quarantined"
] as const satisfies readonly HollowStatus[];

const CACHE_POLICIES = [
  "none",
  "input_digest",
  "artifact_digest"
] as const satisfies readonly HollowCachePolicy[];

const SEMVER_PATTERN = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;

export function validateHollowManifest(manifest: unknown): ManifestValidationResult {
  const errors: ManifestValidationError[] = [];
  const warnings: ManifestValidationWarning[] = [];

  if (!isRecord(manifest)) {
    return {
      valid: false,
      errors: [{ field: "manifest", message: "Manifest must be an object." }],
      warnings
    };
  }

  requireNonEmptyString(manifest, "hollow_id", errors);
  if (typeof manifest.hollow_id === "string" && !manifest.hollow_id.startsWith("hollow.")) {
    errors.push({
      field: "hollow_id",
      message: 'hollow_id must be namespaced and start with "hollow.".'
    });
  }

  requireNonEmptyString(manifest, "hollow_name", errors);
  requireSemVer(manifest, "hollow_version", errors);
  requireSemVer(manifest, "schema_version", errors);
  requireLiteral(manifest, "category", HOLLOW_CATEGORIES, errors);
  requireNonEmptyString(manifest, "description", errors);
  requireNonEmptyString(manifest, "input_type", errors);
  requireNonEmptyString(manifest, "input_schema_ref", errors);
  requireNonEmptyString(manifest, "output_schema_ref", errors);
  requirePermissionArray(manifest, "permissions", errors);
  requirePermissionArray(manifest, "permissions_required", errors);
  requireLiteral(manifest, "file_access_scope", FILE_ACCESS_SCOPES, errors);
  requireBoolean(manifest, "network_access", errors);
  requireLiteral(manifest, "execution_mode", EXECUTION_MODES, errors);
  requireBoolean(manifest, "deterministic", errors);
  requireLiteral(manifest, "deterministic_level", DETERMINISTIC_LEVELS, errors);
  requireStringOrNull(manifest, "result_units", errors);
  requireStringArray(manifest, "checks", errors);
  requirePositiveNumber(manifest, "max_input_size", errors);
  requirePositiveNumber(manifest, "max_runtime_ms", errors);
  requireBoolean(manifest, "supports_batching", errors);
  requireBoolean(manifest, "supports_streaming", errors);
  requireLiteral(manifest, "cache_policy", CACHE_POLICIES, errors);
  requireLiteral(manifest, "status", HOLLOW_STATUSES, errors);
  requireNonEmptyString(manifest, "owner", errors);

  if (errors.length > 0) {
    return { valid: false, errors, warnings };
  }

  return {
    valid: true,
    manifest: manifest as unknown as HollowManifest,
    errors,
    warnings
  };
}

export function assertValidHollowManifest(manifest: unknown): HollowManifest {
  const result = validateHollowManifest(manifest);
  if (!result.valid || result.manifest === undefined) {
    throw new HollowManifestValidationError(result.errors, getHollowId(manifest));
  }

  return result.manifest;
}

export function isV1SafeHollowManifest(manifest: HollowManifest): boolean {
  if (manifest.status !== "trusted" && manifest.status !== "draft") {
    return false;
  }

  if (manifest.network_access || manifest.execution_mode === "approved_side_effect") {
    return false;
  }

  if (
    manifest.file_access_scope !== "none" &&
    manifest.file_access_scope !== "provided_handles_only" &&
    manifest.file_access_scope !== "workspace_read"
  ) {
    return false;
  }

  if (
    manifest.permissions.some(
      (permission) =>
        permission === "network" ||
        permission === "shell_command" ||
        permission === "external_side_effect" ||
        permission === "workspace_write" ||
        !V1_ALLOWED_SIDE_EFFECT_CLASSES.includes(permission as (typeof V1_ALLOWED_SIDE_EFFECT_CLASSES)[number])
    )
  ) {
    return false;
  }

  if (
    manifest.permissions_required.some(
      (permission) =>
        permission === "network" ||
        permission === "shell_command" ||
        permission === "external_side_effect" ||
        permission === "workspace_write" ||
        !V1_ALLOWED_SIDE_EFFECT_CLASSES.includes(permission as (typeof V1_ALLOWED_SIDE_EFFECT_CLASSES)[number])
    )
  ) {
    return false;
  }

  return (
    manifest.deterministic ||
    manifest.deterministic_level === "strict" ||
    manifest.deterministic_level === "heuristic" ||
    manifest.deterministic_level === "bounded_external_state"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireNonEmptyString(
  manifest: Record<string, unknown>,
  field: string,
  errors: ManifestValidationError[]
): void {
  if (typeof manifest[field] !== "string" || manifest[field].trim().length === 0) {
    errors.push({ field, message: `${field} must be a non-empty string.` });
  }
}

function requireSemVer(
  manifest: Record<string, unknown>,
  field: string,
  errors: ManifestValidationError[]
): void {
  if (typeof manifest[field] !== "string" || !SEMVER_PATTERN.test(manifest[field])) {
    errors.push({ field, message: `${field} must be a SemVer-style string.` });
  }
}

function requireBoolean(
  manifest: Record<string, unknown>,
  field: string,
  errors: ManifestValidationError[]
): void {
  if (typeof manifest[field] !== "boolean") {
    errors.push({ field, message: `${field} must be a boolean.` });
  }
}

function requirePositiveNumber(
  manifest: Record<string, unknown>,
  field: string,
  errors: ManifestValidationError[]
): void {
  if (typeof manifest[field] !== "number" || !Number.isFinite(manifest[field]) || manifest[field] <= 0) {
    errors.push({ field, message: `${field} must be a positive number.` });
  }
}

function requireStringOrNull(
  manifest: Record<string, unknown>,
  field: string,
  errors: ManifestValidationError[]
): void {
  if (typeof manifest[field] !== "string" && manifest[field] !== null) {
    errors.push({ field, message: `${field} must be a string or null.` });
  }
}

function requireStringArray(
  manifest: Record<string, unknown>,
  field: string,
  errors: ManifestValidationError[]
): void {
  const value = manifest[field];
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    errors.push({ field, message: `${field} must be an array of strings.` });
  }
}

function requirePermissionArray(
  manifest: Record<string, unknown>,
  field: string,
  errors: ManifestValidationError[]
): void {
  const value = manifest[field];
  if (!Array.isArray(value)) {
    errors.push({ field, message: `${field} must be an array.` });
    return;
  }

  for (const permission of value) {
    if (!isOneOf(permission, SIDE_EFFECT_CLASSES)) {
      errors.push({
        field,
        message: `${field} contains unknown side-effect class "${String(permission)}".`
      });
    }
  }
}

function requireLiteral<T extends string>(
  manifest: Record<string, unknown>,
  field: string,
  allowed: readonly T[],
  errors: ManifestValidationError[]
): void {
  if (!isOneOf(manifest[field], allowed)) {
    errors.push({
      field,
      message: `${field} must be one of: ${allowed.join(", ")}.`
    });
  }
}

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value);
}

function getHollowId(manifest: unknown): string | undefined {
  if (isRecord(manifest) && typeof manifest.hollow_id === "string") {
    return manifest.hollow_id;
  }

  return undefined;
}

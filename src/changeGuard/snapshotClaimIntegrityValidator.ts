import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import type {
  RunSnapshotClaimIntegrityGateOptions,
  SnapshotClaimIntegrityInput,
  SnapshotClaimIntegrityReport
} from "./snapshotClaimIntegrityTypes.js";

const VALIDATOR_ID = "snapshot_claim_integrity_validator";
const DEFAULT_REPORT_ID = "snapshot_claim_integrity_report";
const DEFAULT_CREATED_AT = "2026-07-04T00:00:00.000Z";
const DEFAULT_CHECKED_FILE = "PLANS.md";
const DEFAULT_SNAPSHOT_ROOT = ".caleb/snapshots";

const BROAD_SNAPSHOT_CLAIM_PATTERN = /\bsnap[_-][\w-]*milestone\b/gi;
const CANONICAL_SNAPSHOT_ID_PATTERN = /^snap_[A-Za-z0-9]+(?:_[A-Za-z0-9]+)*_milestone$/;

function extractClaimedSnapshotTokens(content: string): string[] {
  return content.match(BROAD_SNAPSHOT_CLAIM_PATTERN) ?? [];
}

export function evaluateSnapshotClaimIntegrity(input: SnapshotClaimIntegrityInput): SnapshotClaimIntegrityReport {
  const allowedMissing = input.allowed_missing_snapshot_ids ?? [];
  const rawTokens = extractClaimedSnapshotTokens(input.plans_md_content);
  const claimedSnapshotIds = Array.from(new Set(rawTokens)).sort();

  const occurrenceCounts = new Map<string, number>();
  for (const token of rawTokens) {
    occurrenceCounts.set(token, (occurrenceCounts.get(token) ?? 0) + 1);
  }
  const duplicateSnapshotClaims = claimedSnapshotIds.filter((id) => (occurrenceCounts.get(id) ?? 0) > 1);

  const invalidSnapshotClaims = claimedSnapshotIds.filter((id) => !CANONICAL_SNAPSHOT_ID_PATTERN.test(id));
  const canonicalClaims = claimedSnapshotIds.filter((id) => CANONICAL_SNAPSHOT_ID_PATTERN.test(id));

  const existingSnapshotIds = [...input.existing_snapshot_ids].sort();
  const existingSet = new Set(input.existing_snapshot_ids);
  const allowedMissingSet = new Set(allowedMissing);
  const missingSnapshotIds = canonicalClaims.filter((id) => !existingSet.has(id) && !allowedMissingSet.has(id));

  const errors: string[] = [
    ...missingSnapshotIds.map((id) => `Claimed snapshot ID not found on disk: ${id}`),
    ...invalidSnapshotClaims.map((id) => `Claimed snapshot ID does not match canonical format: ${id}`)
  ];

  const warnings: string[] = duplicateSnapshotClaims.map((id) => `Snapshot ID claimed more than once: ${id}`);

  return {
    report_id: DEFAULT_REPORT_ID,
    validator_id: VALIDATOR_ID,
    checked_file: input.checked_file ?? DEFAULT_CHECKED_FILE,
    snapshot_root: input.snapshot_root ?? DEFAULT_SNAPSHOT_ROOT,
    claimed_snapshot_ids: claimedSnapshotIds,
    existing_snapshot_ids: existingSnapshotIds,
    missing_snapshot_ids: missingSnapshotIds,
    invalid_snapshot_claims: invalidSnapshotClaims,
    duplicate_snapshot_claims: duplicateSnapshotClaims,
    allowed_missing_snapshot_ids: [...allowedMissing],
    passed: missingSnapshotIds.length === 0 && invalidSnapshotClaims.length === 0,
    errors,
    warnings,
    created_at: input.created_at ?? DEFAULT_CREATED_AT
  };
}

export function runSnapshotClaimIntegrityGate(
  options?: RunSnapshotClaimIntegrityGateOptions
): SnapshotClaimIntegrityReport {
  const checkedFile = options?.plansFilePath ?? DEFAULT_CHECKED_FILE;
  const snapshotRoot = options?.snapshotRootPath ?? DEFAULT_SNAPSHOT_ROOT;

  const plansMdContent = readFileSync(resolve(checkedFile), "utf8");
  const existingSnapshotIds = readdirSync(resolve(snapshotRoot), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  return evaluateSnapshotClaimIntegrity({
    plans_md_content: plansMdContent,
    existing_snapshot_ids: existingSnapshotIds,
    checked_file: checkedFile,
    snapshot_root: snapshotRoot,
    ...(options?.allowedMissingSnapshotIds !== undefined
      ? { allowed_missing_snapshot_ids: options.allowedMissingSnapshotIds }
      : {}),
    ...(options?.createdAt !== undefined ? { created_at: options.createdAt } : {})
  });
}

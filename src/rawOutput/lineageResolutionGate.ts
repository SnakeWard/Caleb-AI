import type { LedgerEntry } from "../types/ledger.js";
import type { Sha256Digest } from "../types/common.js";
import type { RawOutputStore } from "./rawOutputArtifactTypes.js";

export interface LineageResolutionIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export interface LineageResolutionResult {
  readonly ok: boolean;
  readonly resolved_refs: readonly string[];
  readonly issues: readonly LineageResolutionIssue[];
}

const POST_H4_LEDGER_ID_PATTERN = /^ledger_[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COUNTER_ERA_LEDGER_ID_PATTERN = /^ledger_\d+$/;
const SHA256_DIGEST_PATTERN = /^sha256:[a-f0-9]{64}$/;

export function resolveLineageReferences(
  derived_from: readonly string[],
  ledger_entries: readonly LedgerEntry[]
): LineageResolutionResult {
  const ledgerIds = new Set(ledger_entries.map((entry) => entry.ledger_id));
  const issues: LineageResolutionIssue[] = [];
  const resolved: string[] = [];

  derived_from.forEach((ledgerId, index) => {
    const path = `derived_from.${index}`;
    if (COUNTER_ERA_LEDGER_ID_PATTERN.test(ledgerId)) {
      issues.push(issue("counter_era_ledger_id", path, "Counter-era ledger IDs are barred from new lineage use."));
      return;
    }
    if (!POST_H4_LEDGER_ID_PATTERN.test(ledgerId)) {
      issues.push(issue("invalid_ledger_id_format", path, "Lineage refs must use post-H4 UUID-style ledger IDs."));
      return;
    }
    if (!ledgerIds.has(ledgerId)) {
      issues.push(issue("unresolved_lineage_ref", path, "Lineage reference does not resolve to an existing Ledger entry."));
      return;
    }
    resolved.push(ledgerId);
  });

  return { ok: issues.length === 0, resolved_refs: resolved, issues };
}

export async function resolveRawOutputDigestReferences(
  derived_from: readonly string[],
  store: RawOutputStore
): Promise<LineageResolutionResult> {
  const issues: LineageResolutionIssue[] = [];
  const resolved: string[] = [];
  const seen = new Set<string>();

  for (let index = 0; index < derived_from.length; index += 1) {
    const digest = derived_from[index];
    const path = `derived_from.${index}`;
    if (digest === undefined || !SHA256_DIGEST_PATTERN.test(digest)) {
      issues.push(issue("invalid_raw_output_digest", path, "Artifact lineage refs must be SHA-256 digests."));
      continue;
    }
    if (seen.has(digest)) {
      issues.push(issue("duplicate_raw_output_digest", path, "Artifact lineage refs must not repeat."));
      continue;
    }
    seen.add(digest);
    const read = await store.read(digest as Sha256Digest);
    if (!read.ok || read.content === undefined || read.record?.raw_output_trust_tier !== "T0") {
      issues.push(issue(
        "unresolved_raw_output_digest",
        path,
        "Artifact lineage digest must resolve to intact T0 raw output evidence."
      ));
      continue;
    }
    resolved.push(digest);
  }

  return { ok: issues.length === 0, resolved_refs: resolved, issues };
}

function issue(code: string, path: string, message: string): LineageResolutionIssue {
  return { code, path, message };
}

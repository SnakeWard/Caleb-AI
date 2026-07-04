import type { CalebWarning } from "../../../types/invocation.js";
import type { LedgerEntry } from "../../../types/ledger.js";
import type { HollowImplementation } from "../../runnerTypes.js";
import { ledgerProvenanceManifest as manifest } from "./provenanceHollowManifests.js";
import type {
  LedgerProvenanceInput,
  LedgerProvenanceResult
} from "./provenanceHollowTypes.js";

export const ledgerProvenanceManifest = manifest;

export function inspectLedgerProvenance(input: LedgerProvenanceInput): LedgerProvenanceResult {
  const missing_ledger_ids: string[] = [];
  const duplicate_ledger_ids: string[] = [];
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  const trust_tier_counts: Record<string, number> = {};
  let missing_run_id_count = 0;
  let missing_trace_id_count = 0;
  let run_id_mismatch_count = 0;
  let trace_id_mismatch_count = 0;
  let valid_entry_count = 0;

  input.entries.forEach((entry, index) => {
    const candidate = entry as Partial<LedgerEntry>;
    const ledgerId = candidate.ledger_id;
    const runId = candidate.run_id;
    const traceId = candidate.trace_id;

    if (typeof ledgerId !== "string" || ledgerId.length === 0) {
      missing_ledger_ids.push(`entry_${index}`);
    } else if (seen.has(ledgerId)) {
      duplicates.add(ledgerId);
    } else {
      seen.add(ledgerId);
    }

    if (typeof runId !== "string" || runId.length === 0) {
      missing_run_id_count += 1;
    } else if (input.required_run_id !== undefined && runId !== input.required_run_id) {
      run_id_mismatch_count += 1;
    }

    if (typeof traceId !== "string" || traceId.length === 0) {
      missing_trace_id_count += 1;
    } else if (input.required_trace_id !== undefined && traceId !== input.required_trace_id) {
      trace_id_mismatch_count += 1;
    }

    if (typeof candidate.trust_tier === "string") {
      trust_tier_counts[candidate.trust_tier] = (trust_tier_counts[candidate.trust_tier] ?? 0) + 1;
    }

    if (
      typeof ledgerId === "string" &&
      ledgerId.length > 0 &&
      typeof runId === "string" &&
      runId.length > 0 &&
      typeof traceId === "string" &&
      traceId.length > 0
    ) {
      valid_entry_count += 1;
    }
  });

  duplicate_ledger_ids.push(...duplicates);

  return {
    entry_count: input.entries.length,
    valid_entry_count,
    invalid_entry_count: input.entries.length - valid_entry_count,
    missing_ledger_ids,
    duplicate_ledger_ids,
    missing_run_id_count,
    missing_trace_id_count,
    run_id_mismatch_count,
    trace_id_mismatch_count,
    trust_tier_counts
  };
}

export const ledgerProvenanceImplementation: HollowImplementation = ({ input_payload }) => {
  const input = parseLedgerProvenanceInput(input_payload);
  const result = inspectLedgerProvenance(input);

  return {
    result,
    result_units: "ledger_entries",
    checks: [
      { check_id: "entries_present", label: "Entries Present", status: "completed", severity: "info" },
      {
        check_id: "ledger_provenance_scan_completed",
        label: "Ledger Provenance Scan Completed",
        status: "completed",
        severity: "info"
      }
    ],
    warnings: createLedgerProvenanceWarnings(result),
    artifact_hashes: [],
    confidence_level: "deterministic_ledger_provenance_scan"
  };
};

function parseLedgerProvenanceInput(input: unknown): LedgerProvenanceInput {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new Error("Ledger Provenance Hollow requires an object input payload.");
  }
  const candidate = input as {
    entries?: unknown;
    required_run_id?: unknown;
    required_trace_id?: unknown;
  };
  if (!Array.isArray(candidate.entries)) {
    throw new Error("Ledger Provenance Hollow requires input_payload.entries as an array.");
  }
  if (candidate.required_run_id !== undefined && typeof candidate.required_run_id !== "string") {
    throw new Error("Ledger Provenance Hollow required_run_id must be a string when provided.");
  }
  if (candidate.required_trace_id !== undefined && typeof candidate.required_trace_id !== "string") {
    throw new Error("Ledger Provenance Hollow required_trace_id must be a string when provided.");
  }

  return {
    entries: candidate.entries as LedgerEntry[],
    ...(candidate.required_run_id === undefined ? {} : { required_run_id: candidate.required_run_id }),
    ...(candidate.required_trace_id === undefined ? {} : { required_trace_id: candidate.required_trace_id })
  };
}

function createLedgerProvenanceWarnings(result: LedgerProvenanceResult): CalebWarning[] {
  const warnings: CalebWarning[] = [];
  if (result.duplicate_ledger_ids.length > 0) {
    warnings.push({
      warning_id: "duplicate_ledger_id_detected",
      message: "Duplicate ledger_id values were detected.",
      severity: "warning"
    });
  }
  if (
    result.missing_ledger_ids.length > 0 ||
    result.missing_run_id_count > 0 ||
    result.missing_trace_id_count > 0
  ) {
    warnings.push({
      warning_id: "missing_required_ledger_field",
      message: "One or more LedgerEntry records are missing required provenance fields.",
      severity: "warning"
    });
  }
  if (result.run_id_mismatch_count > 0) {
    warnings.push({
      warning_id: "run_id_mismatch_detected",
      message: "One or more LedgerEntry records do not match the required run_id.",
      severity: "warning"
    });
  }
  if (result.trace_id_mismatch_count > 0) {
    warnings.push({
      warning_id: "trace_id_mismatch_detected",
      message: "One or more LedgerEntry records do not match the required trace_id.",
      severity: "warning"
    });
  }
  return warnings;
}

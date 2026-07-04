import type { JsonObject } from "../../../types/common.js";
import type { LedgerEntry } from "../../../types/ledger.js";

export interface FileHashInput extends JsonObject {
  project_root: string;
  relative_path: string;
}

export interface FileHashResult extends JsonObject {
  relative_path: string;
  size_bytes: number;
  sha256: string;
  digest: string;
}

export interface LedgerProvenanceInput {
  entries: LedgerEntry[];
  required_run_id?: string;
  required_trace_id?: string;
}

export interface LedgerProvenanceResult extends JsonObject {
  entry_count: number;
  valid_entry_count: number;
  invalid_entry_count: number;
  missing_ledger_ids: string[];
  duplicate_ledger_ids: string[];
  missing_run_id_count: number;
  missing_trace_id_count: number;
  run_id_mismatch_count: number;
  trace_id_mismatch_count: number;
  trust_tier_counts: Record<string, number>;
}

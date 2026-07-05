import type { VerificationResult } from "../verification/index.js";
import type {
  CalebError,
  CalebWarning,
  EvidencePacket,
  HollowInvocationRecord,
  ISODateTimeString,
  JsonObject,
  JsonValue,
  LedgerEntry,
  TrustTier
} from "../types/index.js";

export type CalebReportSectionKind =
  | "summary"
  | "hollow_invocations"
  | "verification_results"
  | "evidence_packets"
  | "ledger_entries"
  | "warnings"
  | "errors"
  | "provenance";

export interface CalebReportSectionItem {
  readonly [key: string]: JsonValue;
}

export interface CalebReportSection {
  readonly section_id: string;
  readonly title: string;
  readonly kind: CalebReportSectionKind;
  readonly content: string;
  readonly items?: readonly CalebReportSectionItem[];
}

export interface CalebReportStats {
  readonly invocation_count: number;
  readonly evidence_packet_count: number;
  readonly ledger_entry_count: number;
  readonly warning_count: number;
  readonly error_count: number;
  readonly trust_tier_counts: Record<TrustTier, number>;
  readonly status_counts: Record<string, number>;
  readonly highest_trust_tier: TrustTier | null;
}

export interface ReportIssueSummary {
  readonly source: string;
  readonly id: string;
  readonly message: string;
  readonly severity: string;
}

export interface ReportSourceCounts {
  readonly invocations: number;
  readonly verification_results: number;
  readonly evidence_packets: number;
  readonly ledger_entries: number;
}

export interface CalebReport {
  readonly report_id: string;
  readonly schema_version: string;
  readonly generated_at: ISODateTimeString;
  readonly title: string;
  readonly run_id?: string;
  readonly trace_id?: string;
  readonly task_id?: string;
  readonly summary: string;
  readonly sections: readonly CalebReportSection[];
  readonly stats: CalebReportStats;
  readonly warnings: readonly ReportIssueSummary[];
  readonly errors: readonly ReportIssueSummary[];
  readonly source_counts: ReportSourceCounts;
  readonly ledger_refs: readonly string[];
  readonly artifact_refs: readonly string[];
  readonly provenance: JsonObject;
}

export interface ReportInput {
  readonly title?: string;
  readonly run_id?: string;
  readonly trace_id?: string;
  readonly task_id?: string;
  readonly invocations?: readonly HollowInvocationRecord[];
  readonly verification_results?: readonly VerificationResult[];
  readonly evidence_packets?: readonly EvidencePacket[];
  readonly ledger_entries?: readonly LedgerEntry[];
  readonly notes?: string;
  readonly generated_at?: ISODateTimeString;
  readonly report_id?: string;
  readonly id_generator?: (prefix: string) => string;
}

export interface ReportRenderOptions {
  readonly include_empty_sections?: boolean;
  readonly include_json_block?: boolean;
  readonly max_item_count?: number;
  readonly include_provenance?: boolean;
}

export interface ReportWriteOptions {
  readonly output_dir?: string;
  readonly filename_base?: string;
  readonly write_markdown?: boolean;
  readonly write_json?: boolean;
}

export interface ReportWriteResult {
  readonly report_id: string;
  readonly markdown_path?: string;
  readonly json_path?: string;
  readonly warnings: readonly CalebWarning[];
  readonly errors: readonly CalebError[];
}

import { JsonlLedger } from "../ledger/index.js";
import type { JsonValue, LedgerEntry } from "../types/index.js";
import { validateFinalOutputLedgerRecord } from "./finalOutputLedgerRecordValidator.js";
import type {
  FinalOutputLedgerRecord,
  FinalOutputLedgerRecordValidationIssue,
  FinalOutputLedgerRecordWriteResult
} from "./types/finalOutputLedgerRecordTypes.js";

export interface FinalOutputLedgerRecordWriterOptions {
  readonly ledger_path?: string;
  readonly ledger?: Pick<JsonlLedger, "append" | "ledgerPath">;
  readonly timestamp?: string;
  readonly ledger_id?: string;
}

function issue(code: string, path: string, message: string): FinalOutputLedgerRecordValidationIssue {
  return { code, path, message, severity: "error" };
}

function cloneJson(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue;
}

export function createFinalOutputLedgerEntry(
  record: FinalOutputLedgerRecord,
  options: Pick<FinalOutputLedgerRecordWriterOptions, "timestamp" | "ledger_id"> = {}
): LedgerEntry {
  return {
    ledger_id: options.ledger_id ?? `ledger_${record.record_id}`,
    schema_version: "1.0.0",
    timestamp: options.timestamp ?? record.created_at,
    task_id: record.task_id,
    run_id: record.run_id,
    trace_id: `trace_${record.record_id}`,
    actor_type: "orchestration_core",
    actor_id: record.actor_id,
    actor_version: "1.0.0",
    activity: "final_output_recorded",
    invocation_id: record.record_id,
    status: "completed",
    result: cloneJson({
      record_id: record.record_id,
      record_kind: record.record_kind,
      status: record.status,
      route_mode: record.route_mode,
      actor_type: record.actor_type,
      assembly_id: record.assembly_id,
      packet_id: record.packet_id,
      refs: {
        route_event_ref: record.route_event_ref,
        route_result_ref: record.route_result_ref,
        final_assembly_packet_ref: record.final_assembly_packet_ref,
        model_invocation_record_id: record.model_invocation_record_id,
        raw_response_record_id: record.raw_response_record_id,
        validated_response_record_id: record.validated_response_record_id
      },
      digests: {
        final_packet_digest: record.final_packet_digest,
        route_event_digest: record.route_event_digest
      },
      final_output_type: record.final_output_type,
      release_summary: record.release_summary,
      trust_summary: record.trust_summary,
      limitations: record.limitations,
      write_intent: record.write_intent
    }),
    warnings: record.warnings.map((warning, index) => ({
      warning_id: `final_output_warning_${index + 1}`,
      message: warning,
      severity: "warning"
    })),
    errors: record.issues.map((entry, index) => ({
      error_id: `final_output_issue_${index + 1}`,
      message: entry,
      severity: "error",
      retryable: false
    })),
    artifact_hashes: [],
    provenance: {
      source: "FinalOutputLedgerRecord",
      record_id: record.record_id,
      route_event_ref: record.route_event_ref,
      final_assembly_packet_ref: record.final_assembly_packet_ref,
      final_output_record_promotes_trust: false,
      ledger_presence_promotes_trust: false
    },
    retryable: false,
    verification_status: "schema_valid",
    trust_tier: record.trust_summary.final_packet_trust_tier,
    parent_refs: [record.route_event_ref, record.route_result_ref, record.final_assembly_packet_ref],
    artifact_refs: [
      record.packet_id,
      record.model_invocation_record_id,
      record.raw_response_record_id,
      record.validated_response_record_id
    ]
  };
}

export async function writeFinalOutputLedgerRecord(
  record: unknown,
  options: FinalOutputLedgerRecordWriterOptions = {}
): Promise<FinalOutputLedgerRecordWriteResult> {
  const validation = validateFinalOutputLedgerRecord(record);
  if (!validation.ok) {
    return { ok: false, status: "validation_failed", errors: validation.errors, record: null, ledger_entry: null, ledger_path: null };
  }

  const finalRecord = record as FinalOutputLedgerRecord;
  const ledger = options.ledger ?? new JsonlLedger(options.ledger_path);
  const ledgerEntry = createFinalOutputLedgerEntry(finalRecord, {
    ...(options.timestamp === undefined ? {} : { timestamp: options.timestamp }),
    ...(options.ledger_id === undefined ? {} : { ledger_id: options.ledger_id })
  });

  try {
    const written = await ledger.append(ledgerEntry);
    return { ok: true, status: "recorded_unverified", errors: [], record: finalRecord, ledger_entry: written, ledger_path: ledger.ledgerPath };
  } catch (error) {
    return {
      ok: false,
      status: "write_failed",
      errors: [issue("ledger_write_failed", "$.ledger", error instanceof Error ? error.message : "Final output ledger record write failed.")],
      record: finalRecord,
      ledger_entry: null,
      ledger_path: ledger.ledgerPath
    };
  }
}

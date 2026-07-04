import { JsonlLedger } from "../ledger/index.js";
import type { JsonValue, LedgerEntry } from "../types/index.js";
import { validateRouteLedgerEvent } from "./routeLedgerEventValidator.js";
import type {
  RouteLedgerEvent,
  RouteLedgerEventValidationIssue,
  RouteLedgerEventWriteResult
} from "./types/routeLedgerEventTypes.js";

export interface RouteLedgerEventWriterOptions {
  readonly ledger_path?: string;
  readonly ledger?: Pick<JsonlLedger, "append" | "ledgerPath">;
  readonly timestamp?: string;
  readonly ledger_id?: string;
}

function issue(code: string, path: string, message: string): RouteLedgerEventValidationIssue {
  return { code, path, message, severity: "error" };
}

function cloneJson(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue;
}

export function createRouteLedgerEventLedgerEntry(
  event: RouteLedgerEvent,
  options: Pick<RouteLedgerEventWriterOptions, "timestamp" | "ledger_id"> = {}
): LedgerEntry {
  return {
    ledger_id: options.ledger_id ?? `ledger_${event.event_id}`,
    schema_version: "1.0.0",
    timestamp: options.timestamp ?? event.created_at,
    task_id: event.task_id,
    run_id: event.run_id,
    trace_id: `trace_${event.event_id}`,
    actor_type: "orchestration_core",
    actor_id: event.actor_id,
    actor_version: "1.0.0",
    activity: "route_event_recorded",
    invocation_id: event.event_id,
    status: event.event_kind === "mocked_single_pass_route_completed" ? "completed" : "rejected",
    result: cloneJson({
      event_id: event.event_id,
      event_kind: event.event_kind,
      route_mode: event.route_mode,
      route_status: event.route_status,
      route_actor_type: event.actor_type,
      refs: {
        route_result_ref: event.route_result_ref,
        final_assembly_packet_ref: event.final_assembly_packet_ref,
        request_id: event.request_id,
        response_id: event.response_id,
        model_invocation_record_id: event.model_invocation_record_id,
        raw_response_record_id: event.raw_response_record_id,
        validated_response_record_id: event.validated_response_record_id,
        final_packet_id: event.final_packet_id
      },
      digests: {
        route_result_digest: event.route_result_digest,
        final_packet_digest: event.final_packet_digest
      },
      trust_summary: event.trust_summary,
      write_intent: event.write_intent
    }),
    warnings: event.warnings.map((warning, index) => ({
      warning_id: `route_event_warning_${index + 1}`,
      message: warning,
      severity: "warning"
    })),
    errors: event.issues.map((entry, index) => ({
      error_id: `route_event_issue_${index + 1}`,
      message: entry,
      severity: "error",
      retryable: false
    })),
    artifact_hashes: [],
    provenance: {
      source: "RouteLedgerEvent",
      event_id: event.event_id,
      route_result_ref: event.route_result_ref,
      final_assembly_packet_ref: event.final_assembly_packet_ref,
      ledger_presence_promotes_trust: false,
      ledger_write_promotes_trust: false
    },
    retryable: false,
    verification_status: "schema_valid",
    trust_tier: "T1",
    parent_refs: [event.route_result_ref, event.final_assembly_packet_ref],
    artifact_refs: [
      event.request_id,
      event.response_id,
      event.model_invocation_record_id,
      event.raw_response_record_id,
      event.validated_response_record_id,
      event.final_packet_id
    ]
  };
}

export async function writeRouteLedgerEvent(
  event: unknown,
  options: RouteLedgerEventWriterOptions = {}
): Promise<RouteLedgerEventWriteResult> {
  const validation = validateRouteLedgerEvent(event);
  if (!validation.ok) {
    return { ok: false, status: "validation_failed", errors: validation.errors, event: null, ledger_entry: null, ledger_path: null };
  }

  const routeEvent = event as RouteLedgerEvent;
  const ledger = options.ledger ?? new JsonlLedger(options.ledger_path);
  const ledgerEntry = createRouteLedgerEventLedgerEntry(routeEvent, {
    ...(options.timestamp === undefined ? {} : { timestamp: options.timestamp }),
    ...(options.ledger_id === undefined ? {} : { ledger_id: options.ledger_id })
  });

  try {
    const written = await ledger.append(ledgerEntry);
    return {
      ok: true,
      status: "recorded",
      errors: [],
      event: routeEvent,
      ledger_entry: written,
      ledger_path: ledger.ledgerPath
    };
  } catch (error) {
    return {
      ok: false,
      status: "write_failed",
      errors: [issue("ledger_write_failed", "$.ledger", error instanceof Error ? error.message : "Route ledger event write failed.")],
      event: routeEvent,
      ledger_entry: null,
      ledger_path: ledger.ledgerPath
    };
  }
}

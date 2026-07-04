import { createHash } from "node:crypto";

import { validateRouteLedgerEvent } from "./routeLedgerEventValidator.js";
import type {
  RouteLedgerEvent,
  RouteLedgerEventBuildInput,
  RouteLedgerEventBuildResult
} from "./types/routeLedgerEventTypes.js";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (isObject(value)) {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

function digest(value: unknown): string {
  return `sha256:${createHash("sha256").update(stableStringify(value)).digest("hex")}`;
}

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function readArrayStrings(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((entry) => {
    if (typeof entry === "string") {
      return entry;
    }
    if (isObject(entry)) {
      return readString(entry["message"]) || readString(entry["code"]);
    }
    return "";
  }).filter((entry) => entry.length > 0);
}

export function buildRouteLedgerEvent(input: RouteLedgerEventBuildInput): RouteLedgerEventBuildResult {
  const route = input.route_result as Record<string, unknown>;
  const packet = input.final_assembly_packet as Record<string, unknown>;
  const sourceRefs = isObject(packet["source_refs"]) ? packet["source_refs"] : {};
  const packetTrust = isObject(packet["trust_summary"]) ? packet["trust_summary"] : {};
  const routeTrust = isObject(route["trust_summary"]) ? route["trust_summary"] : {};
  const eventKind = route["ok"] === true && route["status"] === "completed_t1" && packet["status"] === "assembled_unverified"
    ? "mocked_single_pass_route_completed"
    : "mocked_single_pass_route_rejected";

  const requestId = readString(route["request_id"]) || readString(sourceRefs["request_id"]);
  const event: RouteLedgerEvent = {
    schema_version: "0.1.0",
    event_id: input.event_id ?? `route_event.${readString(route["task_id"])}.${readString(route["run_id"])}.${requestId}`,
    event_kind: eventKind,
    task_id: readString(route["task_id"]) || readString(packet["task_id"]),
    run_id: readString(route["run_id"]) || readString(packet["run_id"]),
    route_mode: "single_pass",
    route_status: readString(route["status"]) || "unknown",
    actor_type: input.actor_type ?? "logic_engine",
    actor_id: input.actor_id ?? "logic_engine.route_ledger_event_writer",
    created_at: input.created_at ?? (readString(packet["created_at"]) || readString(route["created_at"])),
    route_result_ref: input.route_result_ref,
    final_assembly_packet_ref: input.final_assembly_packet_ref,
    request_id: requestId,
    response_id: readString(route["response_id"]) || readString(sourceRefs["response_id"]),
    model_invocation_record_id: readString(sourceRefs["model_invocation_record_id"]),
    raw_response_record_id: readString(sourceRefs["raw_response_record_id"]),
    validated_response_record_id: readString(sourceRefs["validated_response_record_id"]),
    final_packet_id: readString(packet["packet_id"]),
    route_result_digest: digest(route),
    final_packet_digest: digest(packet),
    trust_summary: {
      raw_model_output_trust_tier: "T0",
      schema_valid_model_output_trust_tier: "T1",
      final_packet_trust_tier: packetTrust["final_packet_trust_tier"] === "T0" ? "T0" : "T1",
      max_model_output_trust_tier: "T1",
      verified_final_truth_claimed: false,
      model_output_is_deterministic_evidence: false,
      route_completion_promotes_trust: false,
      final_assembly_promotes_trust: false,
      ledger_write_promotes_trust: false,
      ledger_presence_promotes_trust: false,
      storage_promotes_trust: false,
      retrieval_promotes_trust: false,
      notes: [
        "Ledger records route provenance; it does not certify truth.",
        "Ledger presence does not promote trust.",
        ...readArrayStrings(routeTrust["notes"]),
        ...readArrayStrings(packetTrust["notes"])
      ]
    },
    write_intent: {
      target: "ledger",
      append_only: true,
      writes_in_this_pass: true,
      trust_effect: "none",
      allowed_content: ["IDs", "refs", "digests", "statuses", "trust summary", "warnings", "issues"],
      blocked_content: ["raw prompt text", "raw model output text", "API keys", "secrets", "env values"],
      notes: ["R15 route ledger event writes provenance only."]
    },
    warnings: [...readArrayStrings(route["warnings"]), ...readArrayStrings(packet["warnings"])],
    issues: [...readArrayStrings(route["issues"]), ...readArrayStrings(packet["issues"])],
    notes: [
      "No live model provider was used.",
      "No Hollow execution occurred in this route.",
      "No full role rotation runtime occurred.",
      "Final packet does not claim verified final truth."
    ]
  };

  const validation = validateRouteLedgerEvent(event);
  return validation.ok ? { ok: true, errors: [], event } : { ok: false, errors: validation.errors, event: null };
}

import { createHash } from "node:crypto";

import { validateFinalOutputLedgerRecord } from "./finalOutputLedgerRecordValidator.js";
import type {
  FinalOutputLedgerRecord,
  FinalOutputLedgerRecordBuildInput,
  FinalOutputLedgerRecordBuildResult
} from "./types/finalOutputLedgerRecordTypes.js";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
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

function readBoolean(value: unknown): boolean {
  return typeof value === "boolean" ? value : false;
}

function readArrayStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => typeof entry === "string" ? entry : isObject(entry) ? readString(entry["message"]) || readString(entry["code"]) : "").filter((entry) => entry.length > 0);
}

export function buildFinalOutputLedgerRecord(input: FinalOutputLedgerRecordBuildInput): FinalOutputLedgerRecordBuildResult {
  const packet = input.final_assembly_packet as Record<string, unknown>;
  const event = input.route_ledger_event as Record<string, unknown>;
  const sourceRefs = isObject(packet["source_refs"]) ? packet["source_refs"] : {};
  const release = isObject(packet["release_eligibility"]) ? packet["release_eligibility"] : {};
  const packetTrust = isObject(packet["trust_summary"]) ? packet["trust_summary"] : {};
  const limitations = isObject(packet["limitations"]) ? packet["limitations"] : {};
  const finalTier = packetTrust["final_packet_trust_tier"] === "T0" ? "T0" : "T1";
  const modelTier = packetTrust["highest_model_output_trust_tier"] === "T0" ? "T0" : "T1";
  const assemblyId = readString(packet["assembly_id"]);
  const packetId = readString(packet["packet_id"]);

  const record: FinalOutputLedgerRecord = {
    schema_version: "0.1.0",
    record_id: input.record_id ?? `final_output_record.${readString(packet["task_id"])}.${readString(packet["run_id"])}.${assemblyId}`,
    record_kind: "mocked_single_pass_final_output_recorded",
    status: "recorded_unverified",
    task_id: readString(packet["task_id"]),
    run_id: readString(packet["run_id"]),
    route_mode: "single_pass",
    assembly_id: assemblyId,
    packet_id: packetId,
    actor_type: input.actor_type ?? "final_assembly_boundary",
    actor_id: input.actor_id ?? "final_assembly.final_output_ledger_record_writer",
    created_at: input.created_at ?? readString(packet["created_at"]),
    route_event_ref: input.route_event_ref,
    route_result_ref: input.route_result_ref,
    final_assembly_packet_ref: input.final_assembly_packet_ref,
    model_invocation_record_id: readString(sourceRefs["model_invocation_record_id"]),
    raw_response_record_id: readString(sourceRefs["raw_response_record_id"]),
    validated_response_record_id: readString(sourceRefs["validated_response_record_id"]),
    final_packet_digest: digest(packet),
    route_event_digest: digest(event),
    final_output_type: input.final_output_type ?? "mock_single_pass_unverified_packet",
    release_summary: {
      release_type: readString(release["release_type"]) || "mock_single_pass_unverified",
      can_release_to_user: readBoolean(release["can_release_to_user"]),
      trust_label: readString(release["trust_label"]) || "unverified T1-limited mock-route packet",
      required_disclaimer_present: readString(release["required_disclaimer"]).toLowerCase().includes("not verified final truth"),
      verified_final_truth_claimed: false,
      blocking_reasons: readArrayStrings(release["blocking_reasons"]),
      release_notes: ["Final output record means recorded, not verified."]
    },
    trust_summary: {
      final_packet_trust_tier: finalTier,
      highest_model_output_trust_tier: modelTier,
      max_allowed_trust_tier: "T1",
      raw_model_output_trust_tier: "T0",
      schema_valid_model_output_trust_tier: "T1",
      final_output_record_promotes_trust: false,
      ledger_write_promotes_trust: false,
      ledger_presence_promotes_trust: false,
      final_assembly_promotes_trust: false,
      route_completion_promotes_trust: false,
      storage_promotes_trust: false,
      retrieval_promotes_trust: false,
      model_output_is_deterministic_evidence: false,
      final_output_is_verified_truth: false,
      requires_hollow_verification_for_t2: true,
      notes: ["Final output ledger write does not promote trust.", "Ledger presence does not promote trust.", ...readArrayStrings(packetTrust["notes"])]
    },
    limitations: {
      has_live_model_provider: false,
      has_real_model_api_layer: false,
      has_verified_hollow_evidence: false,
      has_real_ledger_route_event: true,
      has_persistent_artifact_store: false,
      has_hollow_execution: false,
      has_role_rotation: false,
      limitation_notes: readArrayStrings(limitations["limitation_notes"])
    },
    write_intent: {
      target: "ledger",
      append_only: true,
      writes_in_this_pass: true,
      trust_effect: "none",
      allowed_content: ["IDs", "refs", "digests", "statuses", "trust summary", "release summary", "warnings", "issues"],
      blocked_content: ["raw prompt text", "raw model output text", "API keys", "secrets", "env values", "full user-facing text"],
      notes: ["R16 final output ledger record writes provenance only."]
    },
    warnings: readArrayStrings(packet["warnings"]),
    issues: readArrayStrings(packet["issues"]),
    notes: ["No live model provider was used.", "No Hollow execution occurred.", "Final packet does not claim verified final truth."]
  };

  const validation = validateFinalOutputLedgerRecord(record);
  return validation.ok ? { ok: true, errors: [], record } : { ok: false, errors: validation.errors, record: null };
}

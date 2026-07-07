import { randomUUID } from "node:crypto";

import { createLedgerId as createStandardLedgerId } from "./idFactory.js";
import type { EvidencePacket } from "../types/evidence.js";
import type { HollowInvocationRecord } from "../types/invocation.js";
import type { LedgerActorType, LedgerEntry } from "../types/ledger.js";
import type { CalebStatus, JsonObject, JsonValue, SemVerString } from "../types/common.js";
import type { VerificationStatus } from "../types/trust.js";

export interface LedgerEntryFactoryOptions {
  readonly ledger_id?: string;
  readonly id_generator?: (prefix: string) => string;
  readonly timestamp?: string;
  readonly activity?: string;
  readonly actor_type?: LedgerActorType;
  readonly actor_id?: string;
  readonly actor_version?: SemVerString;
  readonly parent_refs?: readonly string[];
  readonly artifact_refs?: readonly string[];
  readonly provenance?: JsonObject;
  readonly retryable?: boolean;
}

// LG-1: hollow/VRP ledger IDs use idFactory (prefix_uuid). Custom prefixes
// (e.g. route_) and injected generators remain for tests and Logic Engine.
export function createLedgerId(
  prefix = "ledger",
  generator?: (prefix: string) => string
): string {
  if (generator !== undefined) {
    return generator(prefix);
  }

  if (prefix === "ledger") {
    return createStandardLedgerId();
  }

  return `${prefix}_${randomUUID()}`;
}

export function createLedgerEntryFromInvocation(
  record: HollowInvocationRecord,
  options: LedgerEntryFactoryOptions = {}
): LedgerEntry {
  const entry: LedgerEntry = {
    ledger_id: options.ledger_id ?? createLedgerId("ledger", options.id_generator),
    schema_version: "1.0.0",
    timestamp: options.timestamp ?? new Date().toISOString(),
    task_id: record.task_id,
    run_id: record.run_id,
    trace_id: record.trace_id,
    actor_type: options.actor_type ?? "hollow",
    actor_id: options.actor_id ?? record.hollow_id,
    actor_version: options.actor_version ?? record.hollow_version,
    activity: options.activity ?? "hollow_invocation",
    invocation_id: record.invocation_id,
    hollow_id: record.hollow_id,
    started_at: record.started_at,
    status: record.status,
    result: cloneJson(record.result),
    warnings: record.warnings.map((warning) => ({ ...warning })),
    errors: record.errors.map((error) => ({ ...error })),
    artifact_hashes: record.artifact_hashes.map((artifact) => ({ ...artifact })),
    provenance: {
      ...record.provenance,
      ...(options.provenance ?? {})
    },
    retryable: options.retryable ?? record.retryable,
    verification_status: record.verification_status,
    trust_tier: record.trust_tier,
    parent_refs: [...(options.parent_refs ?? [])],
    artifact_refs: [...(options.artifact_refs ?? [])]
  };

  return record.completed_at === null ? entry : { ...entry, completed_at: record.completed_at };
}

export function createLedgerEntryFromEvidence(
  packet: EvidencePacket,
  options: LedgerEntryFactoryOptions = {}
): LedgerEntry {
  return {
    ledger_id: options.ledger_id ?? createLedgerId("ledger", options.id_generator),
    schema_version: "1.0.0",
    timestamp: options.timestamp ?? new Date().toISOString(),
    task_id: packet.task_id,
    run_id: packet.run_id,
    trace_id: packet.trace_id,
    actor_type: options.actor_type ?? "verified_return_path",
    actor_id: options.actor_id ?? "verified_return_path",
    actor_version: options.actor_version ?? "1.0.0",
    activity: options.activity ?? "evidence_packet_created",
    invocation_id: packet.invocation_id,
    hollow_id: packet.hollow_id,
    status: statusFromVerificationStatus(packet.verification_status),
    result: cloneJson(packet.result),
    warnings: packet.warnings.map((warning) => ({ ...warning })),
    errors: packet.errors.map((error) => ({ ...error })),
    artifact_hashes: packet.artifact_hashes.map((artifact) => ({ ...artifact })),
    provenance: {
      ...packet.provenance,
      ledger_entry_source: "EvidencePacket",
      ...(options.provenance ?? {})
    },
    retryable: options.retryable ?? false,
    verification_status: packet.verification_status,
    trust_tier: packet.trust_tier,
    parent_refs: [...(options.parent_refs ?? packet.ledger_refs)],
    artifact_refs: [...(options.artifact_refs ?? [])]
  };
}

function statusFromVerificationStatus(status: VerificationStatus): CalebStatus {
  if (status === "rejected" || status === "blocked") {
    return status;
  }

  return "completed";
}

function cloneJson(value: JsonValue): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue;
}

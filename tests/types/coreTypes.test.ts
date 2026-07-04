import { describe, expect, it } from "vitest";

import {
  TRUST_TIER_MEANINGS,
  V1_ALLOWED_SIDE_EFFECT_CLASSES,
  type BusMessageEnvelope,
  type EvidencePacket,
  type HollowInvocationRecord,
  type HollowManifest,
  type LedgerEntry,
  type SnapshotManifest,
  type ThinkingEvent
} from "../../src/types/index.js";

const timestamp = "2026-06-06T00:00:00.000Z";

const checks = [
  {
    check_id: "check.schema.valid",
    label: "Schema Valid",
    status: "verified",
    severity: "info",
    details: { schema_version: "1.0.0" }
  }
] as const;

const warnings = [
  {
    warning_id: "warning.none",
    message: "No warnings.",
    severity: "info"
  }
] as const;

const errors = [] as const;
const artifact_hashes = [] as const;

describe("core Caleb AI types", () => {
  it("defines trust tier meanings from T0 through T4", () => {
    expect(Object.keys(TRUST_TIER_MEANINGS)).toEqual(["T0", "T1", "T2", "T3", "T4"]);
    expect(TRUST_TIER_MEANINGS.T0).toBe("Raw untrusted output");
    expect(TRUST_TIER_MEANINGS.T4).toBe(
      "Human-approved or externally authoritative result with full provenance"
    );
  });

  it("limits V1 allowed side-effect classes", () => {
    expect(V1_ALLOWED_SIDE_EFFECT_CLASSES).toEqual(["none", "read_only", "ledger_write"]);
    expect(V1_ALLOWED_SIDE_EFFECT_CLASSES).not.toContain("network");
    expect(V1_ALLOWED_SIDE_EFFECT_CLASSES).not.toContain("shell_command");
    expect(V1_ALLOWED_SIDE_EFFECT_CLASSES).not.toContain("external_side_effect");
  });

  it("accepts a valid HollowManifest fixture", () => {
    const manifest: HollowManifest = {
      hollow_id: "hollow.text.character_count",
      hollow_name: "Character Count Hollow",
      hollow_version: "0.1.0",
      schema_version: "1.0.0",
      category: "text",
      description: "Counts characters in provided text.",
      input_type: "text",
      input_schema_ref: "schemas/hollows/text/character-count.input.json",
      output_schema_ref: "schemas/hollows/text/character-count.output.json",
      permissions: ["none"],
      permissions_required: ["none"],
      file_access_scope: "none",
      network_access: false,
      execution_mode: "local_deterministic",
      deterministic: true,
      deterministic_level: "strict",
      result_units: "characters",
      checks: ["schema_valid", "deterministic"],
      max_input_size: 10000,
      max_runtime_ms: 1000,
      supports_batching: false,
      supports_streaming: false,
      cache_policy: "input_digest",
      status: "trusted",
      owner: "Caleb AI"
    };

    expect(manifest.hollow_id).toBe("hollow.text.character_count");
    expect(manifest.deterministic).toBe(true);
    expect(manifest.network_access).toBe(false);
    expect(manifest.permissions).toContain("none");
    expect(manifest.status).toBe("trusted");
  });

  it("accepts a valid HollowInvocationRecord fixture", () => {
    const invocation: HollowInvocationRecord = {
      hollow_id: "hollow.text.character_count",
      hollow_name: "Character Count Hollow",
      hollow_version: "0.1.0",
      schema_version: "1.0.0",
      invocation_id: "inv_001",
      task_id: "task_001",
      run_id: "run_001",
      trace_id: "trace_001",
      caller: "Orchestration Core",
      requested_by: "Caleb AI",
      approved_by: null,
      input_type: "text",
      input_digest: "sha256:input",
      input_payload: { text: "Caleb" },
      permissions: ["none"],
      execution_mode: "local_deterministic",
      deterministic: true,
      started_at: timestamp,
      completed_at: timestamp,
      status: "completed",
      result: { count: 5 },
      result_units: "characters",
      checks,
      warnings,
      errors,
      artifact_hashes,
      provenance: { hollow_id: "hollow.text.character_count" },
      ledger_refs: ["ledger_001"],
      retryable: false,
      confidence_level: "high",
      verification_status: "verified",
      trust_tier: "T2"
    };

    expect(invocation.hollow_id).toBe("hollow.text.character_count");
    expect(invocation.trust_tier).toBe("T2");
    expect(invocation.verification_status).toBe("verified");
    expect(invocation.ledger_refs).toContain("ledger_001");
  });

  it("accepts a valid EvidencePacket fixture", () => {
    const evidence: EvidencePacket = {
      invocation_id: "inv_001",
      task_id: "task_001",
      run_id: "run_001",
      trace_id: "trace_001",
      hollow_id: "hollow.text.character_count",
      hollow_version: "0.1.0",
      result: { count: 5 },
      result_units: "characters",
      checks,
      warnings,
      errors,
      artifact_hashes,
      provenance: { hollow_id: "hollow.text.character_count" },
      ledger_refs: ["ledger_001"],
      confidence_level: "high",
      verification_status: "verified",
      trust_tier: "T2",
      can_model_consume: true,
      can_persist_as_truth: true,
      can_trigger_side_effect: false
    };

    expect(evidence.can_model_consume).toBe(true);
    expect(evidence.can_trigger_side_effect).toBe(false);
  });

  it("accepts a valid LedgerEntry fixture", () => {
    const ledgerEntry: LedgerEntry = {
      ledger_id: "ledger_001",
      schema_version: "1.0.0",
      timestamp,
      task_id: "task_001",
      run_id: "run_001",
      trace_id: "trace_001",
      actor_type: "hollow",
      actor_id: "hollow.text.character_count",
      actor_version: "0.1.0",
      activity: "hollow_invocation_completed",
      invocation_id: "inv_001",
      hollow_id: "hollow.text.character_count",
      started_at: timestamp,
      completed_at: timestamp,
      status: "completed",
      result: { count: 5 },
      warnings,
      errors,
      artifact_hashes,
      provenance: { hollow_id: "hollow.text.character_count" },
      retryable: false,
      verification_status: "verified",
      trust_tier: "T2",
      parent_refs: [],
      artifact_refs: []
    };

    expect(ledgerEntry.ledger_id).toBe("ledger_001");
    expect(ledgerEntry.run_id).toBe("run_001");
    expect(ledgerEntry.trace_id).toBe("trace_001");
    expect(ledgerEntry.trust_tier).toBe("T2");
  });

  it("accepts a valid BusMessageEnvelope fixture", () => {
    const message: BusMessageEnvelope = {
      message_id: "msg_001",
      schema_version: "1.0.0",
      created_at: timestamp,
      task_id: "task_001",
      run_id: "run_001",
      trace_id: "trace_001",
      source: { actor_type: "orchestration_core", actor_id: "core" },
      target: { actor_type: "hollow", actor_id: "hollow.text.character_count" },
      message_type: "hollow_invocation_request",
      caller: "Orchestration Core",
      requested_by: "Caleb AI",
      approved_by: null,
      hollow_id: "hollow.text.character_count",
      input_type: "text",
      input_digest: "sha256:input",
      input_payload: { text: "Caleb" },
      permissions: ["none"],
      policy_tags: ["v1", "read_only"]
    };

    expect(message.message_id).toBe("msg_001");
    expect(message.message_type).toBe("hollow_invocation_request");
    expect(message.source.actor_type).toBe("orchestration_core");
    expect(message.target.actor_type).toBe("hollow");
    expect(message.trace_id).toBe("trace_001");
  });

  it("accepts a valid SnapshotManifest fixture", () => {
    const snapshot: SnapshotManifest = {
      snapshot_id: "snapshot_001",
      snapshot_type: "pre_change",
      schema_version: "1.0.0",
      run_id: "run_001",
      trace_id: "trace_001",
      requested_by: "Caleb AI",
      approved_by: "human",
      started_at: timestamp,
      completed_at: timestamp,
      status: "completed",
      reason: "Pre-change safety snapshot.",
      files_captured: [{ path: "src/index.ts", hash: "sha256:file" }],
      artifact_hashes: [],
      provenance: { mode: "manual" },
      ledger_refs: ["ledger_snapshot_001"],
      rollback_method: "restore_files",
      rollback_steps: ["Restore captured files", "Run validation"]
    };

    expect(snapshot.snapshot_type).toBe("pre_change");
    expect(snapshot.rollback_steps.length).toBeGreaterThan(0);
  });

  it("accepts a valid future ThinkingEvent fixture", () => {
    const event: ThinkingEvent = {
      event_id: "event_001",
      schema_version: "1.0.0",
      timestamp,
      trace_id: "trace_001",
      run_id: "run_001",
      task_id: "task_001",
      parent_event_id: null,
      event_type: "HOLLOW_INVOKED",
      source: "Orchestration Core",
      target: "hollow.text.character_count",
      severity: "info",
      status: "running",
      payload: { hollow_id: "hollow.text.character_count" },
      ledger_ref: null,
      display: {
        summary: "Character Count Hollow invoked."
      }
    };

    expect(event.event_type).toBe("HOLLOW_INVOKED");
    expect(event.display.summary).toContain("Character Count Hollow");
  });
});

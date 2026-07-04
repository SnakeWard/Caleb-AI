import { createHash } from "node:crypto";

import { validateModelInvocationRecord } from "./modelInvocationRecordValidator.js";
import type {
  ModelInvocationRecord,
  ModelInvocationRecordBuildInput,
  ModelInvocationRecordBuildResult
} from "./types/modelInvocationRecordTypes.js";

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  if (typeof value === "object" && value !== null) {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function digest(value: unknown): string {
  return `sha256:${createHash("sha256").update(stableStringify(value)).digest("hex")}`;
}

export function buildModelInvocationRecord(input: ModelInvocationRecordBuildInput): ModelInvocationRecordBuildResult {
  const storage_refs = input.storage_refs ?? input.boundary_result.storage_refs;
  const raw_response_record_id = storage_refs.raw_response_record_id ?? input.boundary_result.raw_response_record_id;
  const validated_response_record_id = storage_refs.validated_response_record_id ?? input.boundary_result.validated_response_record_id;

  const record: ModelInvocationRecord = {
    schema_version: "0.1.0",
    record_id: input.record_id ?? `model_invocation.${input.request.request_id}`,
    record_kind: "mocked_single_pass_invocation",
    task_id: input.request.task_id,
    run_id: input.request.run_id,
    request_id: input.request.request_id,
    response_id: input.response.response_id,
    route_mode: "single_pass",
    boundary_id: input.boundary_id ?? "mock.single_pass.model_boundary",
    adapter_id: input.response.adapter_id,
    adapter_kind: "mock",
    invocation_status: input.invocation_status ?? "schema_valid",
    created_at: input.created_at,
    completed_at: input.completed_at,
    prompt_digest: digest(input.request.prompt),
    request_digest: digest(input.request),
    response_digest: digest(input.response),
    supplied_evidence_refs: input.request.evidence_refs,
    supplied_context_refs: input.request.context_refs,
    raw_response_record_id: raw_response_record_id ?? "",
    validated_response_record_id: validated_response_record_id ?? "",
    storage_refs,
    trust_summary: {
      raw_output_trust_tier: "T0",
      validated_output_trust_tier: "T1",
      max_allowed_trust_tier: "T1",
      model_output_is_deterministic_evidence: false,
      trust_promotion_blocked: true,
      ledger_presence_promotes_trust: false,
      notes: [
        "Model invocation provenance does not verify model truth.",
        "Ledger presence does not promote trust.",
        "Schema-valid model output may reach T1 only."
      ]
    },
    warnings: input.warnings ?? input.response.warnings,
    issues: input.issues ?? input.boundary_result.issues.map((issue) => issue.message),
    ledger_intent: {
      intended_activity: "mocked_single_pass_model_invocation_recorded",
      actor_type: "model_boundary",
      actor_id: input.boundary_id ?? "mock.single_pass.model_boundary",
      can_write_later: true,
      writes_in_this_pass: false,
      trust_effect: "none",
      notes: ["Ledger intent is provenance/audit only.", "No Ledger write is performed in R12."]
    },
    notes: [
      "No live model provider was called.",
      "No network call was performed.",
      "Model invocation provenance is audit metadata, not trust promotion."
    ]
  };

  const validation = validateModelInvocationRecord(record);
  return validation.ok ? { ok: true, record, errors: [] } : { ok: false, record: null, errors: validation.errors };
}

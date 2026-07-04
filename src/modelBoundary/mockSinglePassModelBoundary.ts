import {
  createMockSinglePassModelAdapter
} from "./mockSinglePassModelAdapter.js";
import {
  validateSinglePassModelRequest,
  validateSinglePassModelResponse
} from "./singlePassModelBoundaryValidator.js";
import type {
  MockSinglePassModelBoundaryOptions,
  SinglePassModelBoundaryIssue,
  SinglePassModelBoundaryResult,
  SinglePassModelBoundaryTrustSummary,
  SinglePassModelRequest,
  SinglePassModelResponse
} from "./types/singlePassModelBoundaryTypes.js";
import type { RuntimeStorageRecord } from "../storage/index.js";

const trustSummary: SinglePassModelBoundaryTrustSummary = {
  raw_output_trust_tier: "T0",
  validated_output_trust_tier: "T1",
  max_allowed_trust_tier: "T1",
  trust_promotion_blocked: true,
  notes: [
    "Raw model output starts at T0.",
    "Schema-valid model output may reach T1 only.",
    "Model output is not deterministic Hollow evidence."
  ]
};

function result(
  ok: boolean,
  status: SinglePassModelBoundaryResult["status"],
  request_id: string | null,
  response_id: string | null,
  raw_response_record_id: string | null,
  validated_response_record_id: string | null,
  issues: readonly SinglePassModelBoundaryIssue[]
): SinglePassModelBoundaryResult {
  return {
    ok,
    status,
    request_id,
    response_id,
    raw_response_record_id,
    validated_response_record_id,
    storage_refs: {
      raw_response_record_id,
      validated_response_record_id
    },
    trust_summary: trustSummary,
    issues
  };
}

function storageRef(ref_id: string, description: string) {
  return { ref_id, ref_kind: "external" as const, description };
}

function roleArtifactRecord(
  response: SinglePassModelResponse,
  trust_tier: "T0" | "T1",
  validation_status: "raw" | "schema_valid",
  now: string
): RuntimeStorageRecord {
  const suffix = validation_status === "raw" ? "raw" : "schema_valid";

  return {
    storage_record_id: `model_boundary.${response.response_id}.${suffix}`,
    record_kind: "role_artifact",
    schema_version: "0.1.0",
    task_id: response.task_id,
    run_id: response.run_id,
    created_at: now,
    source_kind: "model",
    trust_tier,
    validation_status,
    ledger_refs: [],
    input_refs: [storageRef(response.request_id, "SinglePassModelRequest reference.")],
    output_refs: [],
    artifact_refs: [],
    notes:
      validation_status === "raw"
        ? ["Mocked model output; raw T0; not trusted; not deterministic Hollow evidence."]
        : ["Schema-valid mocked model output only; T1 maximum; not verified evidence."],
    role_id: "single_pass_mock_model",
    role_version: "0.1.0",
    artifact_id: `${response.response_id}.${suffix}`,
    artifact_type: "mock_single_pass_response",
    evidence_refs: response.used_evidence_refs.map((ref) => storageRef(ref.ref_id, ref.description ?? "Evidence ref used by mock response.")),
    assumptions: ["Mocked model behavior is not real model integration."],
    contradictions: [],
    defects: [],
    open_questions: response.warnings
  };
}

export function createMockSinglePassBoundaryContext(options: MockSinglePassModelBoundaryOptions): MockSinglePassModelBoundaryOptions {
  const context: MockSinglePassModelBoundaryOptions = {
    store: options.store,
    adapter: options.adapter ?? createMockSinglePassModelAdapter(options.now === undefined ? {} : { created_at: options.now })
  };

  return options.now === undefined ? context : { ...context, now: options.now };
}

export function runMockSinglePassModelBoundary(
  request: unknown,
  options: MockSinglePassModelBoundaryOptions
): SinglePassModelBoundaryResult {
  const requestValidation = validateSinglePassModelRequest(request);
  if (!requestValidation.ok) {
    return result(false, "rejected", null, null, null, null, requestValidation.errors);
  }

  const validRequest = request as SinglePassModelRequest;
  const context = createMockSinglePassBoundaryContext(options);
  const adapter = context.adapter ?? createMockSinglePassModelAdapter(context.now === undefined ? {} : { created_at: context.now });
  const response = adapter.generate(validRequest);
  const responseValidation = validateSinglePassModelResponse(response);
  if (!responseValidation.ok) {
    return result(false, "validation_failed", validRequest.request_id, null, null, null, responseValidation.errors);
  }

  const now = context.now ?? response.created_at;
  const rawRecord = roleArtifactRecord(response, "T0", "raw", now);
  const rawInsert = context.store.insert(rawRecord);
  if (!rawInsert.ok) {
    return result(false, "storage_failed", validRequest.request_id, response.response_id, null, null, rawInsert.issues);
  }

  const validatedRecord = roleArtifactRecord(response, "T1", "schema_valid", now);
  const validatedInsert = context.store.insert(validatedRecord);
  if (!validatedInsert.ok) {
    return result(
      false,
      "storage_failed",
      validRequest.request_id,
      response.response_id,
      rawRecord.storage_record_id,
      null,
      validatedInsert.issues
    );
  }

  return result(
    true,
    "accepted_t1",
    validRequest.request_id,
    response.response_id,
    rawRecord.storage_record_id,
    validatedRecord.storage_record_id,
    []
  );
}

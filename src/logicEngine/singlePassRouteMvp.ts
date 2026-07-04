import {
  buildModelInvocationRecord,
  runMockSinglePassModelBoundary,
  validateModelInvocationRecord
} from "../modelBoundary/index.js";
import {
  createInMemoryArtifactStore
} from "../storage/index.js";
import type {
  InMemoryArtifactStore,
} from "../storage/index.js";
import type {
  SinglePassModelRequest,
  SinglePassModelResponse
} from "../modelBoundary/index.js";
import type {
  SinglePassRouteMvpIssue,
  SinglePassRouteMvpOptions,
  SinglePassRouteMvpRequest,
  SinglePassRouteMvpResult,
  SinglePassRouteMvpStorageSummary,
  SinglePassRouteMvpTrustSummary
} from "./types/singlePassRouteMvpTypes.js";

const trustSummary: SinglePassRouteMvpTrustSummary = {
  raw_model_output_trust_tier: "T0",
  schema_valid_model_output_trust_tier: "T1",
  max_model_output_trust_tier: "T1",
  model_output_is_deterministic_evidence: false,
  route_completion_promotes_trust: false,
  storage_promotes_trust: false,
  retrieval_promotes_trust: false,
  notes: [
    "Raw model output starts at T0.",
    "Schema-valid model output may reach T1 only.",
    "single_pass route MVP is orchestration proof, not verified final truth."
  ]
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function issue(code: string, path: string, message: string): SinglePassRouteMvpIssue {
  return { code, path, message, severity: "error" };
}

function storageSummary(
  store: InMemoryArtifactStore,
  task_id: string | null,
  run_id: string | null,
  raw_response_record_id: string | null,
  validated_response_record_id: string | null
): SinglePassRouteMvpStorageSummary {
  return {
    raw_response_record_id,
    validated_response_record_id,
    total_records_after_route: store.stats().total_records,
    usable_final_evidence_count:
      task_id === null || run_id === null ? 0 : store.getEvidenceUsableForFinal(task_id, run_id).length,
    store_kind: "in_memory"
  };
}

function routeResult(
  ok: boolean,
  status: SinglePassRouteMvpResult["status"],
  request: SinglePassRouteMvpRequest | null,
  store: InMemoryArtifactStore,
  boundary_result: SinglePassRouteMvpResult["boundary_result"],
  model_invocation_record: SinglePassRouteMvpResult["model_invocation_record"],
  issues: readonly SinglePassRouteMvpIssue[]
): SinglePassRouteMvpResult {
  const task_id = request?.task_id ?? null;
  const run_id = request?.run_id ?? null;
  const rawId = boundary_result?.raw_response_record_id ?? null;
  const validatedId = boundary_result?.validated_response_record_id ?? null;

  return {
    ok,
    status,
    task_id,
    run_id,
    route_mode: request?.route_mode ?? null,
    request_id: request?.request_id ?? null,
    response_id: boundary_result?.response_id ?? null,
    boundary_result,
    model_invocation_record,
    storage_summary: storageSummary(store, task_id, run_id, rawId, validatedId),
    trust_summary: trustSummary,
    issues
  };
}

export function validateSinglePassRouteMvpRequest(input: unknown): { readonly ok: boolean; readonly errors: readonly SinglePassRouteMvpIssue[] } {
  const errors: SinglePassRouteMvpIssue[] = [];
  if (!isObject(input)) {
    return { ok: false, errors: [issue("invalid_root", "$", "SinglePassRouteMvpRequest must be an object.")] };
  }

  for (const field of ["schema_version", "task_id", "run_id", "request_id", "user_goal", "prompt", "created_at"]) {
    if (!isNonEmptyString(input[field])) {
      errors.push(issue("invalid_required_string", `$.${field}`, `${field} must be a non-empty string.`));
    }
  }

  if (input["route_mode"] !== "single_pass") {
    errors.push(issue("invalid_route_mode", "$.route_mode", "route_mode must be single_pass."));
  }
  if (!Array.isArray(input["evidence_refs"])) {
    errors.push(issue("invalid_array", "$.evidence_refs", "evidence_refs must be an array."));
  }
  if (!Array.isArray(input["context_refs"])) {
    errors.push(issue("invalid_array", "$.context_refs", "context_refs must be an array."));
  }
  if (!isObject(input["constraints"])) {
    errors.push(issue("invalid_object", "$.constraints", "constraints must be an object."));
  }

  return { ok: errors.length === 0, errors };
}

export function isSinglePassRouteMvpRequest(input: unknown): input is SinglePassRouteMvpRequest {
  return validateSinglePassRouteMvpRequest(input).ok;
}

export function assertSinglePassRouteMvpRequest(input: unknown): SinglePassRouteMvpRequest {
  const validation = validateSinglePassRouteMvpRequest(input);
  if (!validation.ok) {
    throw new Error(`Invalid SinglePassRouteMvpRequest: ${validation.errors.map((error) => `${error.path} ${error.code}`).join("; ")}`);
  }

  return input as SinglePassRouteMvpRequest;
}

export function runSinglePassRouteMvp(input: unknown, options: SinglePassRouteMvpOptions = {}): SinglePassRouteMvpResult {
  const store = options.store ?? createInMemoryArtifactStore();
  const validation = validateSinglePassRouteMvpRequest(input);
  if (!validation.ok) {
    return routeResult(false, "rejected", null, store, null, null, validation.errors);
  }

  const request = input as SinglePassRouteMvpRequest;
  const boundaryResult = runMockSinglePassModelBoundary(request as SinglePassModelRequest, {
    store,
    ...(options.adapter === undefined ? {} : { adapter: options.adapter }),
    ...(options.now === undefined ? {} : { now: options.now })
  });

  if (!boundaryResult.ok) {
    return routeResult(false, "boundary_failed", request, store, boundaryResult, null, boundaryResult.issues);
  }

  const responseRecord = store.get(boundaryResult.raw_response_record_id ?? "");
  const response: SinglePassModelResponse = {
    schema_version: request.schema_version,
    task_id: request.task_id,
    run_id: request.run_id,
    request_id: request.request_id,
    response_id: boundaryResult.response_id ?? `${request.request_id}.mock_response`,
    adapter_id: options.adapter?.adapter_id ?? "mock.single_pass.boundary",
    adapter_kind: "mock",
    output_text: "Mocked single_pass route response represented by stored model-shaped records.",
    output_claims: ["Model-shaped output remains unverified and capped at T1."],
    used_evidence_refs: request.evidence_refs as SinglePassModelResponse["used_evidence_refs"],
    warnings: boundaryResult.issues.map((boundaryIssue) => boundaryIssue.message),
    created_at: options.now ?? request.created_at,
    raw_trust_tier: "T0",
    validation_status: "raw"
  };

  const invocation = buildModelInvocationRecord({
    request: request as SinglePassModelRequest,
    response,
    boundary_result: boundaryResult,
    created_at: options.now ?? request.created_at,
    completed_at: options.now ?? request.created_at
  });

  if (!invocation.ok || invocation.record === null) {
    return routeResult(false, "invocation_record_failed", request, store, boundaryResult, null, invocation.errors.map((error) => issue(error.code, error.path, error.message)));
  }

  const invocationValidation = validateModelInvocationRecord(invocation.record);
  if (!invocationValidation.ok) {
    return routeResult(
      false,
      "invocation_record_failed",
      request,
      store,
      boundaryResult,
      null,
      invocationValidation.errors.map((error) => issue(error.code, error.path, error.message))
    );
  }

  if (responseRecord?.trust_tier !== "T0") {
    return routeResult(false, "storage_failed", request, store, boundaryResult, null, [
      issue("raw_record_trust_violation", "$.storage_summary.raw_response_record_id", "Raw model response record must remain T0.")
    ]);
  }

  return routeResult(true, "completed_t1", request, store, boundaryResult, invocation.record, []);
}

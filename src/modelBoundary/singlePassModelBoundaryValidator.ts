import type {
  SinglePassModelBoundaryIssue,
  SinglePassModelRequest,
  SinglePassModelResponse
} from "./types/singlePassModelBoundaryTypes.js";

export interface SinglePassModelBoundaryValidationResult {
  readonly ok: boolean;
  readonly errors: readonly SinglePassModelBoundaryIssue[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

function issue(code: string, path: string, message: string): SinglePassModelBoundaryIssue {
  return { code, path, message, severity: "error" };
}

function validateString(record: Record<string, unknown>, errors: SinglePassModelBoundaryIssue[], field: string): void {
  if (!isNonEmptyString(record[field])) {
    errors.push(issue("invalid_required_string", `$.${field}`, `${field} must be a non-empty string.`));
  }
}

function validateArray(record: Record<string, unknown>, errors: SinglePassModelBoundaryIssue[], field: string): void {
  if (!isArray(record[field])) {
    errors.push(issue("invalid_array", `$.${field}`, `${field} must be an array.`));
  }
}

function validateObject(record: Record<string, unknown>, errors: SinglePassModelBoundaryIssue[], field: string): void {
  if (!isObject(record[field])) {
    errors.push(issue("invalid_object", `$.${field}`, `${field} must be an object.`));
  }
}

export function validateSinglePassModelRequest(input: unknown): SinglePassModelBoundaryValidationResult {
  const errors: SinglePassModelBoundaryIssue[] = [];
  if (!isObject(input)) {
    return { ok: false, errors: [issue("invalid_root", "$", "SinglePassModelRequest must be an object.")] };
  }

  for (const field of ["schema_version", "task_id", "run_id", "request_id", "user_goal", "prompt", "created_at"]) {
    validateString(input, errors, field);
  }

  if (input["route_mode"] !== "single_pass") {
    errors.push(issue("invalid_route_mode", "$.route_mode", "route_mode must be single_pass."));
  }

  validateArray(input, errors, "evidence_refs");
  validateArray(input, errors, "context_refs");
  validateObject(input, errors, "constraints");

  return { ok: errors.length === 0, errors };
}

export function validateSinglePassModelResponse(input: unknown): SinglePassModelBoundaryValidationResult {
  const errors: SinglePassModelBoundaryIssue[] = [];
  if (!isObject(input)) {
    return { ok: false, errors: [issue("invalid_root", "$", "SinglePassModelResponse must be an object.")] };
  }

  for (const field of [
    "schema_version",
    "task_id",
    "run_id",
    "request_id",
    "response_id",
    "adapter_id",
    "output_text",
    "created_at"
  ]) {
    validateString(input, errors, field);
  }

  if (input["adapter_kind"] !== "mock") {
    errors.push(issue("invalid_adapter_kind", "$.adapter_kind", "adapter_kind must be mock."));
  }

  if (input["raw_trust_tier"] !== "T0") {
    errors.push(issue("invalid_raw_trust_tier", "$.raw_trust_tier", "raw_trust_tier must be T0."));
  }

  if (input["validation_status"] !== "raw") {
    errors.push(issue("invalid_validation_status", "$.validation_status", "validation_status must be raw."));
  }

  validateArray(input, errors, "output_claims");
  validateArray(input, errors, "used_evidence_refs");
  validateArray(input, errors, "warnings");

  return { ok: errors.length === 0, errors };
}

export function isSinglePassModelRequest(input: unknown): input is SinglePassModelRequest {
  return validateSinglePassModelRequest(input).ok;
}

export function isSinglePassModelResponse(input: unknown): input is SinglePassModelResponse {
  return validateSinglePassModelResponse(input).ok;
}

export function assertSinglePassModelRequest(input: unknown): SinglePassModelRequest {
  const result = validateSinglePassModelRequest(input);
  if (!result.ok) {
    throw new Error(`Invalid SinglePassModelRequest: ${result.errors.map((error) => `${error.path} ${error.code}`).join("; ")}`);
  }

  return input as SinglePassModelRequest;
}

export function assertSinglePassModelResponse(input: unknown): SinglePassModelResponse {
  const result = validateSinglePassModelResponse(input);
  if (!result.ok) {
    throw new Error(`Invalid SinglePassModelResponse: ${result.errors.map((error) => `${error.path} ${error.code}`).join("; ")}`);
  }

  return input as SinglePassModelResponse;
}

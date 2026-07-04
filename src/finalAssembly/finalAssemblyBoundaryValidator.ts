import type {
  FinalAssemblyIssue,
  FinalAssemblyPacket,
  FinalAssemblyRequest,
  FinalAssemblyValidationResult
} from "./types/finalAssemblyBoundaryTypes.js";

const allowedTiers = new Set(["T0", "T1"]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function issue(code: string, path: string, message: string): FinalAssemblyIssue {
  return { code, path, message, severity: "error" };
}

function requireBooleanFalse(value: unknown, path: string, errors: FinalAssemblyIssue[]): void {
  if (value !== false) {
    errors.push(issue("trust_promotion_not_allowed", path, `${path} must be false.`));
  }
}

function requireBooleanTrue(value: unknown, path: string, errors: FinalAssemblyIssue[]): void {
  if (value !== true) {
    errors.push(issue("hollow_verification_required", path, `${path} must be true.`));
  }
}

function requirePresentObject(value: unknown, path: string, errors: FinalAssemblyIssue[]): value is Record<string, unknown> {
  if (!isObject(value)) {
    errors.push(issue("invalid_object", path, `${path} must be an object.`));
    return false;
  }

  return true;
}

export function validateFinalAssemblyRequest(input: unknown): FinalAssemblyValidationResult {
  const errors: FinalAssemblyIssue[] = [];
  if (!isObject(input)) {
    return { ok: false, errors: [issue("invalid_root", "$", "FinalAssemblyRequest must be an object.")] };
  }

  for (const field of ["schema_version", "task_id", "run_id", "assembly_id", "route_result_ref", "requested_output_type", "created_at"]) {
    if (!isNonEmptyString(input[field])) {
      errors.push(issue("invalid_required_string", `$.${field}`, `${field} must be a non-empty string.`));
    }
  }

  if (input["route_mode"] !== "single_pass") {
    errors.push(issue("invalid_route_mode", "$.route_mode", "route_mode must be single_pass for R14."));
  }

  if (!isObject(input["route_result"])) {
    errors.push(issue("invalid_route_result", "$.route_result", "route_result must be an object."));
  }

  return { ok: errors.length === 0, errors };
}

export function validateFinalAssemblyPacket(input: unknown): FinalAssemblyValidationResult {
  const errors: FinalAssemblyIssue[] = [];
  if (!isObject(input)) {
    return { ok: false, errors: [issue("invalid_root", "$", "FinalAssemblyPacket must be an object.")] };
  }

  for (const field of ["schema_version", "packet_id", "task_id", "run_id", "assembly_id", "route_mode", "status", "user_facing_text", "created_at"]) {
    if (!isNonEmptyString(input[field])) {
      errors.push(issue("invalid_required_string", `$.${field}`, `${field} must be a non-empty string.`));
    }
  }

  if (input["route_mode"] !== "single_pass") {
    errors.push(issue("invalid_route_mode", "$.route_mode", "route_mode must be single_pass for R14."));
  }

  const sourceRefs = input["source_refs"];
  if (requirePresentObject(sourceRefs, "$.source_refs", errors)) {
    for (const field of ["route_result_ref", "request_id", "response_id", "raw_response_record_id", "validated_response_record_id", "model_invocation_record_id"]) {
      if (!(field in sourceRefs)) {
        errors.push(issue("missing_source_ref", `$.source_refs.${field}`, `${field} must be present.`));
      }
    }
  }

  const trust = input["trust_summary"];
  if (requirePresentObject(trust, "$.trust_summary", errors)) {
    if (!allowedTiers.has(String(trust["highest_model_output_trust_tier"]))) {
      errors.push(issue("model_trust_above_t1", "$.trust_summary.highest_model_output_trust_tier", "highest_model_output_trust_tier must be T1 or lower."));
    }
    if (!allowedTiers.has(String(trust["final_packet_trust_tier"]))) {
      errors.push(issue("packet_trust_above_t1", "$.trust_summary.final_packet_trust_tier", "final_packet_trust_tier must be T1 or lower."));
    }
    requireBooleanFalse(trust["final_answer_claims_verified"], "$.trust_summary.final_answer_claims_verified", errors);
    requireBooleanFalse(trust["route_completion_promotes_trust"], "$.trust_summary.route_completion_promotes_trust", errors);
    requireBooleanFalse(trust["final_assembly_promotes_trust"], "$.trust_summary.final_assembly_promotes_trust", errors);
    requireBooleanFalse(trust["storage_promotes_trust"], "$.trust_summary.storage_promotes_trust", errors);
    requireBooleanFalse(trust["retrieval_promotes_trust"], "$.trust_summary.retrieval_promotes_trust", errors);
    requireBooleanFalse(trust["model_output_is_deterministic_evidence"], "$.trust_summary.model_output_is_deterministic_evidence", errors);
    requireBooleanTrue(trust["requires_hollow_verification_for_t2"], "$.trust_summary.requires_hollow_verification_for_t2", errors);
    if (!Array.isArray(trust["notes"])) {
      errors.push(issue("invalid_array", "$.trust_summary.notes", "trust_summary.notes must be an array."));
    }
  }

  const limitations = input["limitations"];
  if (requirePresentObject(limitations, "$.limitations", errors)) {
    requireBooleanFalse(limitations["has_live_model_provider"], "$.limitations.has_live_model_provider", errors);
    requireBooleanFalse(limitations["has_real_ledger_write"], "$.limitations.has_real_ledger_write", errors);
    requireBooleanFalse(limitations["has_persistent_storage"], "$.limitations.has_persistent_storage", errors);
    requireBooleanFalse(limitations["has_role_rotation"], "$.limitations.has_role_rotation", errors);
    if (typeof limitations["has_verified_hollow_evidence"] !== "boolean") {
      errors.push(issue("invalid_boolean", "$.limitations.has_verified_hollow_evidence", "has_verified_hollow_evidence must be boolean."));
    }
    if (!Array.isArray(limitations["limitation_notes"])) {
      errors.push(issue("invalid_array", "$.limitations.limitation_notes", "limitation_notes must be an array."));
    }
  }

  const release = input["release_eligibility"];
  if (requirePresentObject(release, "$.release_eligibility", errors)) {
    if (typeof release["can_release_to_user"] !== "boolean") {
      errors.push(issue("invalid_boolean", "$.release_eligibility.can_release_to_user", "can_release_to_user must be boolean."));
    }
    if (!isNonEmptyString(release["release_type"])) {
      errors.push(issue("invalid_required_string", "$.release_eligibility.release_type", "release_type must be a non-empty string."));
    }
    if (!Array.isArray(release["blocking_reasons"])) {
      errors.push(issue("invalid_array", "$.release_eligibility.blocking_reasons", "blocking_reasons must be an array."));
    }
    if (!isNonEmptyString(release["required_disclaimer"])) {
      errors.push(issue("required_disclaimer_missing", "$.release_eligibility.required_disclaimer", "required_disclaimer must be present."));
    } else if (!release["required_disclaimer"].toLowerCase().includes("not verified final truth")) {
      errors.push(issue("required_disclaimer_insufficient", "$.release_eligibility.required_disclaimer", "required_disclaimer must state the packet is not verified final truth."));
    }
    const trustLabel = isNonEmptyString(release["trust_label"]) ? release["trust_label"].toLowerCase() : "";
    if (!isNonEmptyString(release["trust_label"]) || /\bverified\s+(?:truth|final|answer|evidence)\b/.test(trustLabel) || /\btrusted\b/.test(trustLabel)) {
      errors.push(issue("trust_label_claims_verification", "$.release_eligibility.trust_label", "trust_label must not imply verified truth."));
    }
  }

  if (!Array.isArray(input["warnings"])) {
    errors.push(issue("invalid_array", "$.warnings", "warnings must be an array."));
  }
  if (!Array.isArray(input["issues"])) {
    errors.push(issue("invalid_array", "$.issues", "issues must be an array."));
  }

  return { ok: errors.length === 0, errors };
}

export function isFinalAssemblyRequest(input: unknown): input is FinalAssemblyRequest {
  return validateFinalAssemblyRequest(input).ok;
}

export function isFinalAssemblyPacket(input: unknown): input is FinalAssemblyPacket {
  return validateFinalAssemblyPacket(input).ok;
}

export function assertFinalAssemblyRequest(input: unknown): FinalAssemblyRequest {
  const validation = validateFinalAssemblyRequest(input);
  if (!validation.ok) {
    throw new Error(`Invalid FinalAssemblyRequest: ${validation.errors.map((error) => `${error.path} ${error.code}`).join("; ")}`);
  }

  return input as FinalAssemblyRequest;
}

export function assertFinalAssemblyPacket(input: unknown): FinalAssemblyPacket {
  const validation = validateFinalAssemblyPacket(input);
  if (!validation.ok) {
    throw new Error(`Invalid FinalAssemblyPacket: ${validation.errors.map((error) => `${error.path} ${error.code}`).join("; ")}`);
  }

  return input as FinalAssemblyPacket;
}

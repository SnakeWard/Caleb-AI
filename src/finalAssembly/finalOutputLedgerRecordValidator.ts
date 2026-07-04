import type {
  FinalOutputLedgerRecord,
  FinalOutputLedgerRecordValidationIssue,
  FinalOutputLedgerRecordValidationResult
} from "./types/finalOutputLedgerRecordTypes.js";

const actorTypes = new Set(["final_assembly_boundary", "logic_engine", "route_runner"]);
const allowedTiers = new Set(["T0", "T1"]);
const blockedPayloadKeys = new Set(["raw_prompt_text", "prompt", "raw_output_text", "output_text", "api_key", "secret", "env", "environment"]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function issue(code: string, path: string, message: string): FinalOutputLedgerRecordValidationIssue {
  return { code, path, message, severity: "error" };
}

function rejectTrue(value: unknown, path: string, errors: FinalOutputLedgerRecordValidationIssue[]): void {
  if (value !== false) {
    errors.push(issue("trust_promotion_not_allowed", path, `${path} must be false.`));
  }
}

function requireTrue(value: unknown, path: string, errors: FinalOutputLedgerRecordValidationIssue[]): void {
  if (value !== true) {
    errors.push(issue("required_true", path, `${path} must be true.`));
  }
}

function containsBlockedKey(value: unknown): string | null {
  if (Array.isArray(value)) {
    for (const entry of value) {
      const match = containsBlockedKey(entry);
      if (match !== null) {
        return match;
      }
    }
    return null;
  }
  if (!isObject(value)) {
    return null;
  }
  for (const [key, nested] of Object.entries(value)) {
    if (blockedPayloadKeys.has(key.toLowerCase())) {
      return key;
    }
    const match = containsBlockedKey(nested);
    if (match !== null) {
      return match;
    }
  }
  return null;
}

export function validateFinalOutputLedgerRecord(input: unknown): FinalOutputLedgerRecordValidationResult {
  const errors: FinalOutputLedgerRecordValidationIssue[] = [];
  if (!isObject(input)) {
    return { ok: false, errors: [issue("invalid_root", "$", "FinalOutputLedgerRecord must be an object.")] };
  }

  for (const field of [
    "schema_version", "record_id", "task_id", "run_id", "assembly_id", "packet_id", "actor_id", "created_at",
    "route_event_ref", "route_result_ref", "final_assembly_packet_ref", "model_invocation_record_id",
    "raw_response_record_id", "validated_response_record_id", "final_packet_digest", "route_event_digest", "final_output_type"
  ]) {
    if (!isNonEmptyString(input[field])) {
      errors.push(issue("invalid_required_string", `$.${field}`, `${field} must be a non-empty string.`));
    }
  }

  if (input["route_mode"] !== "single_pass") errors.push(issue("invalid_route_mode", "$.route_mode", "route_mode must be single_pass."));
  if (input["record_kind"] !== "mocked_single_pass_final_output_recorded") errors.push(issue("invalid_record_kind", "$.record_kind", "record_kind must be mocked_single_pass_final_output_recorded."));
  if (input["status"] !== "recorded_unverified") errors.push(issue("invalid_status", "$.status", "status must be recorded_unverified for accepted R16 records."));
  if (!actorTypes.has(String(input["actor_type"]))) errors.push(issue("invalid_actor_type", "$.actor_type", "actor_type must be final_assembly_boundary, logic_engine, or route_runner."));
  if (!Array.isArray(input["warnings"])) errors.push(issue("invalid_array", "$.warnings", "warnings must be an array."));
  if (!Array.isArray(input["issues"])) errors.push(issue("invalid_array", "$.issues", "issues must be an array."));
  if (!Array.isArray(input["notes"])) errors.push(issue("invalid_array", "$.notes", "notes must be an array."));

  const blocked = containsBlockedKey(input);
  if (blocked !== null) {
    errors.push(issue("blocked_payload_content", `$..${blocked}`, "Final output ledger record must not contain raw prompt/output text, secrets, or env values."));
  }

  const release = input["release_summary"];
  if (!isObject(release)) {
    errors.push(issue("invalid_object", "$.release_summary", "release_summary must be an object."));
  } else {
    if (!isNonEmptyString(release["release_type"]) || !release["release_type"].toLowerCase().includes("mock") || !release["release_type"].toLowerCase().includes("unverified")) {
      errors.push(issue("invalid_release_type", "$.release_summary.release_type", "release_type must indicate mock/unverified release."));
    }
    if (typeof release["can_release_to_user"] !== "boolean") errors.push(issue("invalid_boolean", "$.release_summary.can_release_to_user", "can_release_to_user must be boolean."));
    if (!isNonEmptyString(release["trust_label"]) || /\bverified\s+(?:truth|final|answer|evidence)\b/.test(release["trust_label"].toLowerCase())) {
      errors.push(issue("trust_label_claims_verification", "$.release_summary.trust_label", "trust_label must not imply verified truth."));
    }
    requireTrue(release["required_disclaimer_present"], "$.release_summary.required_disclaimer_present", errors);
    rejectTrue(release["verified_final_truth_claimed"], "$.release_summary.verified_final_truth_claimed", errors);
    if (!Array.isArray(release["blocking_reasons"])) errors.push(issue("invalid_array", "$.release_summary.blocking_reasons", "blocking_reasons must be an array."));
    if (!Array.isArray(release["release_notes"])) errors.push(issue("invalid_array", "$.release_summary.release_notes", "release_notes must be an array."));
  }

  const trust = input["trust_summary"];
  if (!isObject(trust)) {
    errors.push(issue("invalid_object", "$.trust_summary", "trust_summary must be an object."));
  } else {
    if (!allowedTiers.has(String(trust["final_packet_trust_tier"]))) errors.push(issue("packet_trust_above_t1", "$.trust_summary.final_packet_trust_tier", "final_packet_trust_tier must be T1 or lower."));
    if (!allowedTiers.has(String(trust["highest_model_output_trust_tier"]))) errors.push(issue("model_trust_above_t1", "$.trust_summary.highest_model_output_trust_tier", "highest_model_output_trust_tier must be T1 or lower."));
    if (trust["max_allowed_trust_tier"] !== "T1") errors.push(issue("max_trust_above_t1", "$.trust_summary.max_allowed_trust_tier", "max_allowed_trust_tier must be T1."));
    if (trust["raw_model_output_trust_tier"] !== "T0") errors.push(issue("invalid_raw_trust", "$.trust_summary.raw_model_output_trust_tier", "raw_model_output_trust_tier must be T0."));
    if (trust["schema_valid_model_output_trust_tier"] !== "T1") errors.push(issue("invalid_schema_valid_trust", "$.trust_summary.schema_valid_model_output_trust_tier", "schema_valid_model_output_trust_tier must be T1."));
    for (const field of ["final_output_record_promotes_trust", "ledger_write_promotes_trust", "ledger_presence_promotes_trust", "final_assembly_promotes_trust", "route_completion_promotes_trust", "storage_promotes_trust", "retrieval_promotes_trust", "model_output_is_deterministic_evidence", "final_output_is_verified_truth"]) {
      rejectTrue(trust[field], `$.trust_summary.${field}`, errors);
    }
    requireTrue(trust["requires_hollow_verification_for_t2"], "$.trust_summary.requires_hollow_verification_for_t2", errors);
    if (!Array.isArray(trust["notes"])) errors.push(issue("invalid_array", "$.trust_summary.notes", "trust_summary.notes must be an array."));
  }

  const limitations = input["limitations"];
  if (!isObject(limitations)) {
    errors.push(issue("invalid_object", "$.limitations", "limitations must be an object."));
  } else {
    for (const field of ["has_live_model_provider", "has_real_model_api_layer", "has_persistent_artifact_store", "has_hollow_execution", "has_role_rotation"]) {
      rejectTrue(limitations[field], `$.limitations.${field}`, errors);
    }
    if (typeof limitations["has_verified_hollow_evidence"] !== "boolean") errors.push(issue("invalid_boolean", "$.limitations.has_verified_hollow_evidence", "has_verified_hollow_evidence must be boolean."));
    if (typeof limitations["has_real_ledger_route_event"] !== "boolean") errors.push(issue("invalid_boolean", "$.limitations.has_real_ledger_route_event", "has_real_ledger_route_event must be boolean."));
    if (!Array.isArray(limitations["limitation_notes"])) errors.push(issue("invalid_array", "$.limitations.limitation_notes", "limitation_notes must be an array."));
  }

  const intent = input["write_intent"];
  if (!isObject(intent)) {
    errors.push(issue("invalid_object", "$.write_intent", "write_intent must be an object."));
  } else {
    if (intent["target"] !== "ledger") errors.push(issue("invalid_write_target", "$.write_intent.target", "target must be ledger."));
    requireTrue(intent["append_only"], "$.write_intent.append_only", errors);
    requireTrue(intent["writes_in_this_pass"], "$.write_intent.writes_in_this_pass", errors);
    if (intent["trust_effect"] !== "none") errors.push(issue("invalid_trust_effect", "$.write_intent.trust_effect", "trust_effect must be none."));
    if (!Array.isArray(intent["allowed_content"])) errors.push(issue("invalid_array", "$.write_intent.allowed_content", "allowed_content must be an array."));
    if (!Array.isArray(intent["blocked_content"])) errors.push(issue("invalid_array", "$.write_intent.blocked_content", "blocked_content must be an array."));
    if (!Array.isArray(intent["notes"])) errors.push(issue("invalid_array", "$.write_intent.notes", "notes must be an array."));
  }

  return { ok: errors.length === 0, errors };
}

export function isFinalOutputLedgerRecord(input: unknown): input is FinalOutputLedgerRecord {
  return validateFinalOutputLedgerRecord(input).ok;
}

export function assertFinalOutputLedgerRecord(input: unknown): FinalOutputLedgerRecord {
  const validation = validateFinalOutputLedgerRecord(input);
  if (!validation.ok) {
    throw new Error(`Invalid FinalOutputLedgerRecord: ${validation.errors.map((error) => `${error.path} ${error.code}`).join("; ")}`);
  }
  return input as FinalOutputLedgerRecord;
}

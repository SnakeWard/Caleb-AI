import type {
  RouteLedgerEvent,
  RouteLedgerEventValidationIssue,
  RouteLedgerEventValidationResult
} from "./types/routeLedgerEventTypes.js";

const eventKinds = new Set(["mocked_single_pass_route_completed", "mocked_single_pass_route_rejected"]);
const actorTypes = new Set(["logic_engine", "route_runner", "final_assembly_boundary"]);
const allowedPacketTiers = new Set(["T0", "T1"]);
const blockedPayloadKeys = new Set([
  "prompt",
  "raw_prompt",
  "prompt_text",
  "output_text",
  "raw_output",
  "raw_output_text",
  "model_output_text",
  "api_key",
  "secret",
  "env",
  "environment"
]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function issue(code: string, path: string, message: string): RouteLedgerEventValidationIssue {
  return { code, path, message, severity: "error" };
}

function rejectIfNotFalse(value: unknown, path: string, errors: RouteLedgerEventValidationIssue[]): void {
  if (value !== false) {
    errors.push(issue("trust_promotion_not_allowed", path, `${path} must be false.`));
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

export function validateRouteLedgerEvent(input: unknown): RouteLedgerEventValidationResult {
  const errors: RouteLedgerEventValidationIssue[] = [];
  if (!isObject(input)) {
    return { ok: false, errors: [issue("invalid_root", "$", "RouteLedgerEvent must be an object.")] };
  }

  for (const field of [
    "schema_version",
    "event_id",
    "task_id",
    "run_id",
    "route_status",
    "actor_id",
    "created_at",
    "route_result_ref",
    "final_assembly_packet_ref",
    "request_id",
    "response_id",
    "model_invocation_record_id",
    "raw_response_record_id",
    "validated_response_record_id",
    "final_packet_id",
    "route_result_digest",
    "final_packet_digest"
  ]) {
    if (!isNonEmptyString(input[field])) {
      errors.push(issue("invalid_required_string", `$.${field}`, `${field} must be a non-empty string.`));
    }
  }

  if (input["route_mode"] !== "single_pass") {
    errors.push(issue("invalid_route_mode", "$.route_mode", "route_mode must be single_pass."));
  }
  if (!eventKinds.has(String(input["event_kind"]))) {
    errors.push(issue("invalid_event_kind", "$.event_kind", "event_kind must be an R15 mocked single_pass route event kind."));
  }
  if (!actorTypes.has(String(input["actor_type"]))) {
    errors.push(issue("invalid_actor_type", "$.actor_type", "actor_type must be logic_engine, route_runner, or final_assembly_boundary."));
  }
  if (!Array.isArray(input["warnings"])) {
    errors.push(issue("invalid_array", "$.warnings", "warnings must be an array."));
  }
  if (!Array.isArray(input["issues"])) {
    errors.push(issue("invalid_array", "$.issues", "issues must be an array."));
  }
  if (!Array.isArray(input["notes"])) {
    errors.push(issue("invalid_array", "$.notes", "notes must be an array."));
  }

  const blockedKey = containsBlockedKey(input);
  if (blockedKey !== null) {
    errors.push(issue("blocked_payload_content", `$..${blockedKey}`, "Route ledger event must not contain raw prompt/output text, secrets, or env values."));
  }

  const trust = input["trust_summary"];
  if (!isObject(trust)) {
    errors.push(issue("invalid_object", "$.trust_summary", "trust_summary must be an object."));
  } else {
    if (trust["raw_model_output_trust_tier"] !== "T0") {
      errors.push(issue("invalid_raw_trust", "$.trust_summary.raw_model_output_trust_tier", "raw_model_output_trust_tier must be T0."));
    }
    if (trust["schema_valid_model_output_trust_tier"] !== "T1") {
      errors.push(issue("invalid_schema_valid_trust", "$.trust_summary.schema_valid_model_output_trust_tier", "schema_valid_model_output_trust_tier must be T1."));
    }
    if (trust["max_model_output_trust_tier"] !== "T1") {
      errors.push(issue("model_trust_above_t1", "$.trust_summary.max_model_output_trust_tier", "max_model_output_trust_tier must be T1."));
    }
    if (!allowedPacketTiers.has(String(trust["final_packet_trust_tier"]))) {
      errors.push(issue("packet_trust_above_t1", "$.trust_summary.final_packet_trust_tier", "final_packet_trust_tier must be T1 or lower."));
    }
    rejectIfNotFalse(trust["verified_final_truth_claimed"], "$.trust_summary.verified_final_truth_claimed", errors);
    rejectIfNotFalse(trust["model_output_is_deterministic_evidence"], "$.trust_summary.model_output_is_deterministic_evidence", errors);
    rejectIfNotFalse(trust["route_completion_promotes_trust"], "$.trust_summary.route_completion_promotes_trust", errors);
    rejectIfNotFalse(trust["final_assembly_promotes_trust"], "$.trust_summary.final_assembly_promotes_trust", errors);
    rejectIfNotFalse(trust["ledger_write_promotes_trust"], "$.trust_summary.ledger_write_promotes_trust", errors);
    rejectIfNotFalse(trust["ledger_presence_promotes_trust"], "$.trust_summary.ledger_presence_promotes_trust", errors);
    rejectIfNotFalse(trust["storage_promotes_trust"], "$.trust_summary.storage_promotes_trust", errors);
    rejectIfNotFalse(trust["retrieval_promotes_trust"], "$.trust_summary.retrieval_promotes_trust", errors);
    if (!Array.isArray(trust["notes"])) {
      errors.push(issue("invalid_array", "$.trust_summary.notes", "trust_summary.notes must be an array."));
    }
  }

  const writeIntent = input["write_intent"];
  if (!isObject(writeIntent)) {
    errors.push(issue("invalid_object", "$.write_intent", "write_intent must be an object."));
  } else {
    if (writeIntent["target"] !== "ledger") {
      errors.push(issue("invalid_write_target", "$.write_intent.target", "write_intent.target must be ledger."));
    }
    if (writeIntent["append_only"] !== true) {
      errors.push(issue("append_only_required", "$.write_intent.append_only", "write_intent.append_only must be true."));
    }
    if (writeIntent["writes_in_this_pass"] !== true) {
      errors.push(issue("write_intent_required", "$.write_intent.writes_in_this_pass", "writes_in_this_pass must be true for R15."));
    }
    if (writeIntent["trust_effect"] !== "none") {
      errors.push(issue("invalid_trust_effect", "$.write_intent.trust_effect", "write_intent.trust_effect must be none."));
    }
    if (!Array.isArray(writeIntent["allowed_content"])) {
      errors.push(issue("invalid_array", "$.write_intent.allowed_content", "allowed_content must be an array."));
    }
    if (!Array.isArray(writeIntent["blocked_content"])) {
      errors.push(issue("invalid_array", "$.write_intent.blocked_content", "blocked_content must be an array."));
    }
    if (!Array.isArray(writeIntent["notes"])) {
      errors.push(issue("invalid_array", "$.write_intent.notes", "write_intent.notes must be an array."));
    }
  }

  return { ok: errors.length === 0, errors };
}

export function isRouteLedgerEvent(input: unknown): input is RouteLedgerEvent {
  return validateRouteLedgerEvent(input).ok;
}

export function assertRouteLedgerEvent(input: unknown): RouteLedgerEvent {
  const validation = validateRouteLedgerEvent(input);
  if (!validation.ok) {
    throw new Error(`Invalid RouteLedgerEvent: ${validation.errors.map((error) => `${error.path} ${error.code}`).join("; ")}`);
  }

  return input as RouteLedgerEvent;
}

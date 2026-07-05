import type { JsonObject } from "../types/common.js";
import type { TrustTier } from "../types/trust.js";
import { validateTaskFrameInput } from "./taskFrameValidator.js";
import { selectRoute } from "./routeSelector.js";
import type {
  LogicEngineRouteInput,
  RouteInputIssue,
  RouteInputRecordKind,
  RouteInputValidationResult,
  RouteSelectionFromInputsResult
} from "./types/routeInput.js";
import type { SignalFrame, SignalInputs, SignalScore } from "./types/signalFrame.js";

const ALLOWED_KINDS: readonly RouteInputRecordKind[] = [
  "contract_validated_task_frame",
  "verified_signal_frame",
  "engine_internal_state",
  "deterministic_hollow_signal",
  "accepted_gate_policy_result",
  "human_pat_approval_record",
  "snapshot_change_guard_state"
];

const APPROVED_EFFECTIVE_TIERS: readonly TrustTier[] = ["T2", "T3", "T4"];
const SIGNAL_SCORE_VALUES = new Set<number>([0, 1, 2]);
const SIGNAL_FIELD_NAMES: readonly (keyof SignalInputs)[] = [
  "deterministic_only",
  "requires_judgment",
  "ambiguity",
  "stakes",
  "evidence_complexity",
  "contradiction_risk",
  "branch_factor",
  "multimodal_coupling",
  "side_effect_risk",
  "audit_need",
  "prior_failure",
  "cost_sensitivity",
  "deadline_pressure"
];

const FORBIDDEN_ROUTE_AUTHORITY_FIELDS: Readonly<Record<string, string>> = {
  measurement_tier: "forbidden_measurement_tier",
  subject_tier: "forbidden_subject_tier",
  raw_model_output: "forbidden_raw_model_output",
  raw_provider_output: "forbidden_raw_provider_output",
  provider_model_output: "forbidden_provider_model_output",
  raw_output_text: "forbidden_raw_output_text",
  output_text: "forbidden_raw_output_text",
  report_text: "forbidden_report_text",
  report_summary: "forbidden_report_text",
  display_text: "forbidden_display_text",
  display_summary: "forbidden_display_text",
  role_artifact_prose: "forbidden_role_artifact_prose",
  provider_id: "forbidden_provider_identity",
  provider_identity: "forbidden_provider_identity",
  model_id: "forbidden_provider_identity",
  model_confidence: "forbidden_model_confidence",
  confidence: "forbidden_model_confidence",
  digest: "forbidden_digest_authority",
  artifact_digest: "forbidden_digest_authority",
  storage_ref: "forbidden_storage_authority",
  storage_presence: "forbidden_storage_authority",
  storage_status: "forbidden_storage_authority",
  provenance: "forbidden_provenance_field",
  raw_output_trust_tier: "forbidden_provider_model_output",
  schema_valid_output_trust_tier: "forbidden_provider_model_output",
  max_allowed_trust_tier: "forbidden_provider_model_output"
};

const ALLOWED_TOP_LEVEL_FIELDS: Readonly<Record<RouteInputRecordKind, readonly string[]>> = {
  contract_validated_task_frame: [
    "record_kind",
    "record_id",
    "source",
    "validated_at",
    "lineage_refs",
    "task_frame",
    "validation"
  ],
  verified_signal_frame: [
    "record_kind",
    "record_id",
    "source",
    "validated_at",
    "lineage_refs",
    "signal_frame",
    "derived_from_task_frame_record_id"
  ],
  engine_internal_state: [
    "record_kind",
    "record_id",
    "source",
    "validated_at",
    "lineage_refs",
    "state_name",
    "state_value"
  ],
  deterministic_hollow_signal: [
    "record_kind",
    "record_id",
    "source",
    "validated_at",
    "lineage_refs",
    "hollow_id",
    "signal_name",
    "signal_value",
    "effective_tier"
  ],
  accepted_gate_policy_result: [
    "record_kind",
    "record_id",
    "source",
    "validated_at",
    "lineage_refs",
    "gate_id",
    "accepted",
    "scope"
  ],
  human_pat_approval_record: [
    "record_kind",
    "record_id",
    "source",
    "validated_at",
    "lineage_refs",
    "approved_by",
    "approval_scope",
    "accepted"
  ],
  snapshot_change_guard_state: [
    "record_kind",
    "record_id",
    "source",
    "validated_at",
    "lineage_refs",
    "snapshot_id",
    "status",
    "gate_satisfied"
  ]
};

export function validateRouteInputRecord(input: unknown): RouteInputValidationResult {
  const issues: RouteInputIssue[] = [];
  if (!isObject(input)) {
    return reject(issue("invalid_route_input", "$", "Route input must be a JSON object."));
  }

  const recordKind = input["record_kind"];
  if (typeof recordKind !== "string") {
    return reject(issue("missing_record_kind", "$.record_kind", "Route input must declare a record_kind."));
  }
  if (!isAllowedRecordKind(recordKind)) {
    return reject(issue("unknown_record_kind", "$.record_kind", `Unregistered route input record_kind '${recordKind}' is rejected by construction.`));
  }

  issues.push(...detectForbiddenAuthorityFields(input, "$"));
  issues.push(...validateNoUnknownTopLevelFields(input, recordKind));
  issues.push(...validateBase(input, recordKind));
  issues.push(...validateByKind(input, recordKind));

  return issues.length === 0
    ? { ok: true, input: input as unknown as LogicEngineRouteInput, issues: [] }
    : { ok: false, input: null, issues };
}

export function selectRouteFromRouteInputs(inputs: readonly unknown[]): RouteSelectionFromInputsResult {
  const accepted: LogicEngineRouteInput[] = [];
  const issues: RouteInputIssue[] = [];

  for (const input of inputs) {
    const validation = validateRouteInputRecord(input);
    if (validation.ok) {
      accepted.push(validation.input);
    } else {
      issues.push(...validation.issues);
    }
  }

  if (issues.length > 0) {
    return { ok: false, decision: null, accepted_inputs: accepted, issues };
  }

  const taskFrameInput = accepted.find((input) => input.record_kind === "contract_validated_task_frame");
  const signalFrameInput = accepted.find((input) => input.record_kind === "verified_signal_frame");

  if (taskFrameInput?.record_kind !== "contract_validated_task_frame") {
    issues.push(issue("missing_contract_validated_task_frame", "$", "Route selection requires a contract-validated TaskFrame route input."));
  }
  if (signalFrameInput?.record_kind !== "verified_signal_frame") {
    issues.push(issue("missing_verified_signal_frame", "$", "Route selection requires a verified SignalFrame route input."));
  }

  if (issues.length > 0) {
    return { ok: false, decision: null, accepted_inputs: accepted, issues };
  }

  if (taskFrameInput?.record_kind !== "contract_validated_task_frame" || signalFrameInput?.record_kind !== "verified_signal_frame") {
    return {
      ok: false,
      decision: null,
      accepted_inputs: accepted,
      issues: [issue("route_input_narrowing_failed", "$", "Route input narrowing failed after validation.")]
    };
  }

  const decision = selectRoute(taskFrameInput.task_frame, signalFrameInput.signal_frame);
  return { ok: true, decision, accepted_inputs: accepted, issues: [] };
}

export function isAllowedRouteInputKind(record_kind: string): record_kind is RouteInputRecordKind {
  return isAllowedRecordKind(record_kind);
}

function validateBase(input: Record<string, unknown>, recordKind: RouteInputRecordKind): RouteInputIssue[] {
  const issues: RouteInputIssue[] = [];
  if (!isNonEmptyString(input["record_id"])) {
    issues.push(issue("invalid_record_id", "$.record_id", "record_id must be a non-empty string."));
  }
  if (!isNonEmptyString(input["validated_at"])) {
    issues.push(issue("invalid_validated_at", "$.validated_at", "validated_at must be a non-empty timestamp string."));
  }
  if (!Array.isArray(input["lineage_refs"]) || !input["lineage_refs"].every((ref) => typeof ref === "string")) {
    issues.push(issue("invalid_lineage_refs", "$.lineage_refs", "lineage_refs must be an array of strings."));
  }

  const expectedSource = expectedSourceFor(recordKind);
  const source = input["source"];
  const allowedSources = Array.isArray(expectedSource) ? expectedSource : [expectedSource];
  if (typeof source !== "string" || !allowedSources.includes(source)) {
    issues.push(issue("invalid_source", "$.source", `${recordKind} must use source ${allowedSources.join(" or ")}.`));
  }
  return issues;
}

function validateByKind(input: Record<string, unknown>, recordKind: RouteInputRecordKind): RouteInputIssue[] {
  switch (recordKind) {
    case "contract_validated_task_frame":
      return validateContractTaskFrame(input);
    case "verified_signal_frame":
      return validateSignalFrameInput(input);
    case "engine_internal_state":
      return validateEngineInternalState(input);
    case "deterministic_hollow_signal":
      return validateDeterministicHollowSignal(input);
    case "accepted_gate_policy_result":
      return validateAcceptedGatePolicyResult(input);
    case "human_pat_approval_record":
      return validateHumanPatApproval(input);
    case "snapshot_change_guard_state":
      return validateSnapshotChangeGuard(input);
  }
}

function validateContractTaskFrame(input: Record<string, unknown>): RouteInputIssue[] {
  const issues: RouteInputIssue[] = [];
  const validation = input["validation"];
  if (!isObject(validation) || validation["validator"] !== "validateTaskFrameInput" || validation["valid"] !== true) {
    issues.push(issue("invalid_task_frame_validation", "$.validation", "TaskFrame route input must carry successful validateTaskFrameInput evidence."));
  }

  const taskFrameValidation = validateTaskFrameInput(input["task_frame"]);
  if (!taskFrameValidation.valid) {
    issues.push(...taskFrameValidation.errors.map((error) =>
      issue(`task_frame_${error.code}`, `$.task_frame.${error.field}`, error.message)
    ));
  }
  return issues;
}

function validateSignalFrameInput(input: Record<string, unknown>): RouteInputIssue[] {
  const issues: RouteInputIssue[] = [];
  if (!isNonEmptyString(input["derived_from_task_frame_record_id"])) {
    issues.push(issue("invalid_signal_lineage", "$.derived_from_task_frame_record_id", "Verified SignalFrame must name the TaskFrame route input it derives from."));
  }
  if (!isSignalFrame(input["signal_frame"])) {
    issues.push(issue("invalid_signal_frame", "$.signal_frame", "signal_frame must match the Logic Engine SignalFrame contract."));
  }
  return issues;
}

function validateEngineInternalState(input: Record<string, unknown>): RouteInputIssue[] {
  const issues: RouteInputIssue[] = [];
  if (!isNonEmptyString(input["state_name"])) {
    issues.push(issue("invalid_state_name", "$.state_name", "state_name must be a non-empty string."));
  }
  if (!isJsonObject(input["state_value"])) {
    issues.push(issue("invalid_state_value", "$.state_value", "state_value must be a JSON object."));
  }
  return issues;
}

function validateDeterministicHollowSignal(input: Record<string, unknown>): RouteInputIssue[] {
  const issues: RouteInputIssue[] = [];
  if (!isNonEmptyString(input["hollow_id"])) {
    issues.push(issue("invalid_hollow_id", "$.hollow_id", "hollow_id must be a non-empty string."));
  }
  if (!isNonEmptyString(input["signal_name"])) {
    issues.push(issue("invalid_signal_name", "$.signal_name", "signal_name must be a non-empty string."));
  }
  if (!isApprovedEffectiveTier(input["effective_tier"])) {
    issues.push(issue("unapproved_effective_tier", "$.effective_tier", "Deterministic Hollow signals require approved effective_tier T2 or higher."));
  }
  return issues;
}

function validateAcceptedGatePolicyResult(input: Record<string, unknown>): RouteInputIssue[] {
  const issues: RouteInputIssue[] = [];
  if (!isNonEmptyString(input["gate_id"])) {
    issues.push(issue("invalid_gate_id", "$.gate_id", "gate_id must be a non-empty string."));
  }
  if (input["accepted"] !== true) {
    issues.push(issue("gate_not_accepted", "$.accepted", "Only accepted gate/policy results may route Caleb."));
  }
  if (!isNonEmptyString(input["scope"])) {
    issues.push(issue("invalid_gate_scope", "$.scope", "scope must be a non-empty string."));
  }
  return issues;
}

function validateHumanPatApproval(input: Record<string, unknown>): RouteInputIssue[] {
  const issues: RouteInputIssue[] = [];
  if (!isNonEmptyString(input["approved_by"])) {
    issues.push(issue("invalid_approved_by", "$.approved_by", "approved_by must be a non-empty string."));
  }
  if (!isNonEmptyString(input["approval_scope"])) {
    issues.push(issue("invalid_approval_scope", "$.approval_scope", "approval_scope must be a non-empty string."));
  }
  if (input["accepted"] !== true) {
    issues.push(issue("approval_not_accepted", "$.accepted", "Only explicitly accepted human/Pat approvals may route Caleb."));
  }
  return issues;
}

function validateSnapshotChangeGuard(input: Record<string, unknown>): RouteInputIssue[] {
  const issues: RouteInputIssue[] = [];
  if (!isNonEmptyString(input["snapshot_id"])) {
    issues.push(issue("invalid_snapshot_id", "$.snapshot_id", "snapshot_id must be a non-empty string."));
  }
  if (input["status"] !== "completed" && input["status"] !== "verified") {
    issues.push(issue("invalid_snapshot_status", "$.status", "Snapshot/change-guard state must be completed or verified."));
  }
  if (input["gate_satisfied"] !== true) {
    issues.push(issue("snapshot_gate_not_satisfied", "$.gate_satisfied", "Snapshot/change-guard state must satisfy its gate explicitly."));
  }
  return issues;
}

function validateNoUnknownTopLevelFields(input: Record<string, unknown>, recordKind: RouteInputRecordKind): RouteInputIssue[] {
  const allowed = new Set(ALLOWED_TOP_LEVEL_FIELDS[recordKind]);
  return Object.keys(input)
    .filter((key) => !allowed.has(key))
    .map((key) => issue("unregistered_route_authority_field", `$.${key}`, `'${key}' is not allowed on ${recordKind}.`));
}

function detectForbiddenAuthorityFields(value: unknown, path: string): RouteInputIssue[] {
  if (Array.isArray(value)) {
    return value.flatMap((entry, index) => detectForbiddenAuthorityFields(entry, `${path}.${index}`));
  }
  if (!isObject(value)) {
    return [];
  }

  const issues: RouteInputIssue[] = [];
  for (const [key, nested] of Object.entries(value)) {
    const code = FORBIDDEN_ROUTE_AUTHORITY_FIELDS[key];
    if (code !== undefined) {
      issues.push(issue(code, `${path}.${key}`, `'${key}' cannot be used as Logic Engine route authority.`));
    }
    issues.push(...detectForbiddenAuthorityFields(nested, `${path}.${key}`));
  }
  return issues;
}

function expectedSourceFor(recordKind: RouteInputRecordKind): "logic_engine" | "hollow" | "gate" | "human_pat" | "change_guard" | readonly ("logic_engine" | "hollow" | "gate")[] {
  switch (recordKind) {
    case "contract_validated_task_frame":
    case "verified_signal_frame":
    case "engine_internal_state":
      return "logic_engine";
    case "deterministic_hollow_signal":
      return "hollow";
    case "accepted_gate_policy_result":
      return "gate";
    case "human_pat_approval_record":
      return "human_pat";
    case "snapshot_change_guard_state":
      return "change_guard";
  }
}

function isAllowedRecordKind(value: string): value is RouteInputRecordKind {
  return (ALLOWED_KINDS as readonly string[]).includes(value);
}

function isApprovedEffectiveTier(value: unknown): value is TrustTier {
  return typeof value === "string" && (APPROVED_EFFECTIVE_TIERS as readonly string[]).includes(value);
}

function isSignalFrame(value: unknown): value is SignalFrame {
  if (!isObject(value)) {
    return false;
  }
  if (!isNonEmptyString(value["task_id"]) || !isNonEmptyString(value["run_id"]) || !isNonEmptyString(value["classified_at"])) {
    return false;
  }
  if (typeof value["signal_score"] !== "number" || !Number.isInteger(value["signal_score"])) {
    return false;
  }
  if (value["complexity_band"] !== "low" && value["complexity_band"] !== "medium" && value["complexity_band"] !== "high" && value["complexity_band"] !== "critical") {
    return false;
  }
  const signals = value["signals"];
  if (!isObject(signals)) {
    return false;
  }
  return SIGNAL_FIELD_NAMES.every((field) => {
    const score = signals[field];
    return typeof score === "number" && Number.isInteger(score) && SIGNAL_SCORE_VALUES.has(score);
  });
}

function isJsonObject(value: unknown): value is JsonObject {
  if (!isObject(value)) {
    return false;
  }
  return Object.values(value).every(isJsonValue);
}

function isJsonValue(value: unknown): boolean {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return true;
  }
  if (Array.isArray(value)) {
    return value.every(isJsonValue);
  }
  return isJsonObject(value);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function issue(code: string, path: string, message: string): RouteInputIssue {
  return { code, path, message };
}

function reject(singleIssue: RouteInputIssue): RouteInputValidationResult {
  return { ok: false, input: null, issues: [singleIssue] };
}

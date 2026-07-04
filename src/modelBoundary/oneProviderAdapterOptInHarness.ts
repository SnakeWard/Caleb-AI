import type {
  OneProviderAdapterOptInHarnessEvaluationConfigGate,
  OneProviderAdapterOptInHarnessEvaluationEvidence,
  OneProviderAdapterOptInHarnessEvaluationInput,
  OneProviderAdapterOptInHarnessEvaluationKillSwitch,
  OneProviderAdapterOptInHarnessEvaluationResult,
  OneProviderAdapterOptInHarnessEvaluationStatus,
  OneProviderAdapterOptInHarnessGate,
  OneProviderAdapterOptInHarnessGateResult,
  OneProviderAdapterOptInHarnessImplementationAuditSummary,
  OneProviderAdapterOptInHarnessImplementationSafetySummary,
  OneProviderAdapterOptInHarnessImplementationTrustSummary,
  OneProviderAdapterOptInHarnessImplementationValidationIssue,
  OneProviderAdapterOptInHarnessImplementationValidationResult,
  OneProviderAdapterOptInHarnessRuntimeCapabilities,
  OneProviderAdapterOptInHarnessRuntimeHealth
} from "./types/oneProviderAdapterOptInHarnessImplementationTypes.js";

const schemaVersion = "0.1.0";
const defaultTimestamp = "2026-07-03T00:00:00.000Z";
const blockedFields = new Set(["raw_prompt_text", "prompt_text", "raw_output_text", "output_text", "api_key", "api_key_value", "secret", "env", "env_value", "environment", "environment_value", "credential", "auth_token", "private_key"]);
const statuses = new Set(["missing_opt_in", "config_invalid", "kill_switch_blocks_live_execution", "env_flag_missing", "command_flag_missing", "provider_not_allowlisted", "adapter_id_missing", "adapter_id_not_allowed", "human_approval_missing", "api_key_unavailable", "redaction_not_ready", "safety_profile_not_ready", "cost_guard_not_ready", "live_tests_disabled", "ready_but_live_execution_disabled", "validation_failed"]);
const gates: readonly OneProviderAdapterOptInHarnessGate[] = ["config", "kill_switch", "env_flag", "command_flag", "provider_allowlist", "adapter_id", "human_approval", "api_key_availability", "redaction_readiness", "safety_profile_readiness", "cost_guard_readiness", "live_test_gate", "r27_live_execution_disabled"];

type Shape = Record<string, unknown>;
type Issues = OneProviderAdapterOptInHarnessImplementationValidationIssue[];

export interface OneProviderAdapterOptInHarnessOptions {
  readonly harness_id?: string;
  readonly created_at?: string;
  readonly checked_at?: string;
}

export interface OneProviderAdapterOptInHarness {
  readonly capabilities: (options?: OneProviderAdapterOptInHarnessOptions) => OneProviderAdapterOptInHarnessRuntimeCapabilities;
  readonly health: (options?: OneProviderAdapterOptInHarnessOptions) => OneProviderAdapterOptInHarnessRuntimeHealth;
  readonly evaluate: (input: unknown, options?: OneProviderAdapterOptInHarnessOptions) => OneProviderAdapterOptInHarnessEvaluationResult;
}

function isObject(value: unknown): value is Shape {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function issue(errors: Issues, code: string, path: string, message: string): void {
  errors.push({ code, path, message, severity: "error" });
}

function objectAt(value: unknown, path: string, errors: Issues): Shape | null {
  if (!isObject(value)) {
    issue(errors, "invalid_object", path, `${path} must be an object.`);
    return null;
  }
  rejectBlocked(value, path, errors);
  return value;
}

function rejectBlocked(value: Shape, path: string, errors: Issues): void {
  for (const [field, next] of Object.entries(value)) {
    if (blockedFields.has(field.toLowerCase())) issue(errors, "blocked_field", `${path}.${field}`, `${field} is blocked from R27 opt-in harness data.`);
    if (isObject(next)) rejectBlocked(next, `${path}.${field}`, errors);
  }
}

function requireFields(value: Shape, fields: readonly string[], path: string, errors: Issues): void {
  for (const field of fields) if (!(field in value)) issue(errors, "missing_required_field", `${path}.${field}`, `${field} is required.`);
}

function requireString(value: Shape, field: string, path: string, errors: Issues): void {
  if (field in value && !isNonEmptyString(value[field])) issue(errors, "invalid_required_string", `${path}.${field}`, `${field} must be a non-empty string.`);
}

function requireArray(value: unknown, path: string, errors: Issues): void {
  if (!Array.isArray(value)) issue(errors, "invalid_array", path, `${path} must be an array.`);
}

function requireFalse(value: unknown, path: string, errors: Issues): void {
  if (value !== false) issue(errors, "required_false", path, `${path} must be false.`);
}

function requireTrue(value: unknown, path: string, errors: Issues): void {
  if (value !== true) issue(errors, "required_true", path, `${path} must be true.`);
}

function notes(value: Shape, path: string, errors: Issues): void {
  requireArray(value["notes"], `${path}.notes`, errors);
}

function validateConfig(value: unknown, path: string, errors: Issues): void {
  const obj = objectAt(value, path, errors); if (!obj) return;
  requireFields(obj, ["config_present", "config_valid", "config_ref", "config_promotes_trust", "notes"], path, errors);
  requireString(obj, "config_ref", path, errors);
  requireFalse(obj["config_promotes_trust"], `${path}.config_promotes_trust`, errors);
  notes(obj, path, errors);
}

function validateEvidence(value: unknown, path: string, errors: Issues): void {
  const obj = objectAt(value, path, errors); if (!obj) return;
  requireFields(obj, ["opt_in_present", "env_flag_present", "command_flag_present", "provider_allowlist_present", "provider_allowlisted", "adapter_id_present", "adapter_id_allowed", "human_approval_recorded", "api_key_available_by_reference", "redaction_ready", "safety_profile_ready", "cost_guard_ready", "live_tests_enabled_for_explicit_opt_in", "evidence_promotes_trust", "notes"], path, errors);
  requireFalse(obj["evidence_promotes_trust"], `${path}.evidence_promotes_trust`, errors);
  notes(obj, path, errors);
}

function validateKillSwitch(value: unknown, path: string, errors: Issues): void {
  const obj = objectAt(value, path, errors); if (!obj) return;
  requireFields(obj, ["kill_switch_present", "kill_switch_blocks_live_execution", "kill_switch_promotes_trust", "notes"], path, errors);
  requireFalse(obj["kill_switch_promotes_trust"], `${path}.kill_switch_promotes_trust`, errors);
  notes(obj, path, errors);
}

export function validateOneProviderAdapterOptInHarnessEvaluationInput(input: unknown): OneProviderAdapterOptInHarnessImplementationValidationResult {
  const errors: Issues = [];
  const obj = objectAt(input, "$", errors); if (!obj) return { ok: false, errors };
  requireFields(obj, ["schema_version", "evaluation_id", "harness_id", "adapter_id", "provider_id", "provider_kind", "config", "opt_in_evidence", "kill_switch", "created_at", "notes"], "$", errors);
  ["evaluation_id", "harness_id", "adapter_id", "provider_id", "provider_kind", "created_at"].forEach((field) => requireString(obj, field, "$", errors));
  validateConfig(obj["config"], "$.config", errors);
  validateEvidence(obj["opt_in_evidence"], "$.opt_in_evidence", errors);
  validateKillSwitch(obj["kill_switch"], "$.kill_switch", errors);
  notes(obj, "$", errors);
  return { ok: errors.length === 0, errors };
}

function makeCapabilities(options?: OneProviderAdapterOptInHarnessOptions): OneProviderAdapterOptInHarnessRuntimeCapabilities {
  return {
    schema_version: schemaVersion,
    harness_id: options?.harness_id ?? "one_provider_adapter_opt_in_harness",
    evaluates_opt_in_evidence: true,
    reads_process_env: false,
    reads_api_key_value: false,
    performs_network_call: false,
    imports_provider_sdk: false,
    enables_live_execution: false,
    writes_ledger: false,
    writes_files: false,
    returns_provider_output: false,
    returns_fake_success: false,
    created_at: options?.created_at ?? defaultTimestamp,
    notes: ["Offline opt-in harness evaluator only."]
  };
}

function makeHealth(options?: OneProviderAdapterOptInHarnessOptions): OneProviderAdapterOptInHarnessRuntimeHealth {
  return {
    schema_version: schemaVersion,
    harness_id: options?.harness_id ?? "one_provider_adapter_opt_in_harness",
    contract_available: true,
    runtime_enabled: true,
    live_execution_enabled: false,
    process_env_read: false,
    api_key_value_read: false,
    network_available: false,
    provider_sdk_available: false,
    checked_at: options?.checked_at ?? options?.created_at ?? defaultTimestamp,
    warnings: [],
    errors: [],
    notes: ["Health is local and offline-only."]
  };
}

export function getOneProviderAdapterOptInHarnessRuntimeCapabilities(options?: OneProviderAdapterOptInHarnessOptions): OneProviderAdapterOptInHarnessRuntimeCapabilities {
  return makeCapabilities(options);
}

export function getOneProviderAdapterOptInHarnessRuntimeHealth(options?: OneProviderAdapterOptInHarnessOptions): OneProviderAdapterOptInHarnessRuntimeHealth {
  return makeHealth(options);
}

function makeTrustSummary(): OneProviderAdapterOptInHarnessImplementationTrustSummary {
  return {
    harness_evaluation_promotes_trust: false,
    harness_decision_promotes_trust: false,
    opt_in_evidence_promotes_trust: false,
    human_approval_evidence_promotes_trust: false,
    kill_switch_state_promotes_trust: false,
    api_key_availability_promotes_trust: false,
    provider_allowlist_presence_promotes_trust: false,
    network_permission_promotes_trust: false,
    ready_disabled_promotes_trust: false,
    provider_output_is_deterministic_evidence: false,
    raw_provider_output_trust_tier: "T0",
    schema_valid_provider_output_trust_tier: "T1",
    max_provider_output_trust_tier: "T1",
    requires_vrp_for_t2: true,
    verified_final_truth_claimed: false,
    notes: ["Harness evaluation and ready-disabled decisions do not promote trust."]
  };
}

function makeSafetySummary(): OneProviderAdapterOptInHarnessImplementationSafetySummary {
  return {
    live_execution_blocked: true,
    live_adapter_blocked: true,
    provider_call_blocked: true,
    provider_specific_behavior_blocked: true,
    real_model_api_layer_blocked: true,
    process_env_read_blocked: true,
    api_key_value_read_blocked: true,
    network_call_blocked: true,
    provider_sdk_blocked: true,
    ledger_write_blocked: true,
    file_write_blocked: true,
    fake_success_blocked: true,
    provider_output_blocked: true,
    notes: ["All live-provider and sensitive behaviors are blocked."]
  };
}

function makeAuditSummary(): OneProviderAdapterOptInHarnessImplementationAuditSummary {
  return {
    live_execution_attempted: false,
    live_adapter_used: false,
    provider_call_attempted: false,
    provider_specific_behavior_used: false,
    real_model_api_layer_used: false,
    process_env_read: false,
    api_key_value_read: false,
    network_call_attempted: false,
    provider_sdk_used: false,
    ledger_write_attempted: false,
    file_write_attempted: false,
    fake_success_returned: false,
    provider_output_returned: false,
    notes: ["Evaluation is deterministic and offline-only."]
  };
}

function pass(gate: OneProviderAdapterOptInHarnessGate): OneProviderAdapterOptInHarnessGateResult {
  return { gate, passed: true, status: "ready_but_live_execution_disabled", refusal_kind: "ready_but_live_execution_disabled", notes: [] };
}

function block(gate: OneProviderAdapterOptInHarnessGate, status: OneProviderAdapterOptInHarnessEvaluationStatus): OneProviderAdapterOptInHarnessGateResult {
  return { gate, passed: false, status, refusal_kind: status, notes: [`${gate} blocked evaluation.`] };
}

function evaluateGates(input: OneProviderAdapterOptInHarnessEvaluationInput): readonly OneProviderAdapterOptInHarnessGateResult[] {
  const config: OneProviderAdapterOptInHarnessEvaluationConfigGate = input.config;
  const evidence: OneProviderAdapterOptInHarnessEvaluationEvidence = input.opt_in_evidence;
  const killSwitch: OneProviderAdapterOptInHarnessEvaluationKillSwitch = input.kill_switch;
  const results: OneProviderAdapterOptInHarnessGateResult[] = [];
  const push = (gate: OneProviderAdapterOptInHarnessGate, status?: OneProviderAdapterOptInHarnessEvaluationStatus) => {
    const result = status ? block(gate, status) : pass(gate);
    results.push(result);
    return result.passed;
  };

  if (!push("config", !config.config_present || !config.config_valid ? "config_invalid" : undefined)) return results;
  if (!push("kill_switch", !killSwitch.kill_switch_present || killSwitch.kill_switch_blocks_live_execution ? "kill_switch_blocks_live_execution" : undefined)) return results;
  if (!push("env_flag", !evidence.opt_in_present || !evidence.env_flag_present ? "missing_opt_in" : undefined)) return results;
  if (!push("command_flag", !evidence.command_flag_present ? "command_flag_missing" : undefined)) return results;
  if (!push("provider_allowlist", !evidence.provider_allowlist_present || !evidence.provider_allowlisted ? "provider_not_allowlisted" : undefined)) return results;
  if (!push("adapter_id", !evidence.adapter_id_present ? "adapter_id_missing" : !evidence.adapter_id_allowed ? "adapter_id_not_allowed" : undefined)) return results;
  if (!push("human_approval", !evidence.human_approval_recorded ? "human_approval_missing" : undefined)) return results;
  if (!push("api_key_availability", !evidence.api_key_available_by_reference ? "api_key_unavailable" : undefined)) return results;
  if (!push("redaction_readiness", !evidence.redaction_ready ? "redaction_not_ready" : undefined)) return results;
  if (!push("safety_profile_readiness", !evidence.safety_profile_ready ? "safety_profile_not_ready" : undefined)) return results;
  if (!push("cost_guard_readiness", !evidence.cost_guard_ready ? "cost_guard_not_ready" : undefined)) return results;
  if (!push("live_test_gate", !evidence.live_tests_enabled_for_explicit_opt_in ? "live_tests_disabled" : undefined)) return results;
  results.push({ gate: "r27_live_execution_disabled", passed: true, status: "ready_but_live_execution_disabled", refusal_kind: "ready_but_live_execution_disabled", notes: ["All evidence gates passed; live execution remains disabled."] });
  return results;
}

export function evaluateOneProviderAdapterOptInHarness(input: unknown, options?: OneProviderAdapterOptInHarnessOptions): OneProviderAdapterOptInHarnessEvaluationResult {
  const validation = validateOneProviderAdapterOptInHarnessEvaluationInput(input);
  const safeInput = validation.ok ? input as OneProviderAdapterOptInHarnessEvaluationInput : invalidInputFallback(options);
  const gateResults = validation.ok ? evaluateGates(safeInput) : [block("config", "validation_failed")];
  const finalGate = gateResults[gateResults.length - 1] ?? block("config", "validation_failed");
  const readyDisabled = validation.ok && finalGate.gate === "r27_live_execution_disabled" && finalGate.status === "ready_but_live_execution_disabled";
  const status = readyDisabled ? "ready_but_live_execution_disabled" : finalGate.status;
  return {
    schema_version: schemaVersion,
    result_id: `${safeInput.evaluation_id}_opt_in_harness_result`,
    evaluation_id: safeInput.evaluation_id,
    harness_id: safeInput.harness_id,
    adapter_id: safeInput.adapter_id,
    provider_id: safeInput.provider_id,
    provider_kind: safeInput.provider_kind,
    ok: readyDisabled,
    status,
    blocking_gate: finalGate.gate,
    refusal_kind: status,
    ready_disabled: readyDisabled,
    gate_order: gates,
    gate_results: gateResults,
    capabilities: makeCapabilities({ ...options, harness_id: safeInput.harness_id }),
    health: makeHealth({ ...options, harness_id: safeInput.harness_id }),
    trust_summary: makeTrustSummary(),
    safety_summary: makeSafetySummary(),
    audit_summary: makeAuditSummary(),
    live_execution_attempted: false,
    provider_call_attempted: false,
    network_call_attempted: false,
    provider_sdk_used: false,
    process_env_read: false,
    api_key_value_read: false,
    ledger_write_attempted: false,
    file_write_attempted: false,
    fake_success_returned: false,
    provider_output_returned: false,
    warnings: [],
    errors: validation.ok ? (readyDisabled ? [] : [status]) : validation.errors.map((error) => error.code),
    created_at: options?.created_at ?? safeInput.created_at,
    notes: readyDisabled ? ["All explicit data gates passed; live execution remains disabled."] : ["First blocking gate refused live execution."]
  };
}

export function createOneProviderAdapterOptInHarness(options?: OneProviderAdapterOptInHarnessOptions): OneProviderAdapterOptInHarness {
  return {
    capabilities: (nextOptions) => makeCapabilities({ ...options, ...nextOptions }),
    health: (nextOptions) => makeHealth({ ...options, ...nextOptions }),
    evaluate: (input, nextOptions) => evaluateOneProviderAdapterOptInHarness(input, { ...options, ...nextOptions })
  };
}

function validateCapabilities(value: unknown, path: string, errors: Issues): void {
  const obj = objectAt(value, path, errors); if (!obj) return;
  requireFields(obj, ["schema_version", "harness_id", "evaluates_opt_in_evidence", "reads_process_env", "reads_api_key_value", "performs_network_call", "imports_provider_sdk", "enables_live_execution", "writes_ledger", "writes_files", "returns_provider_output", "returns_fake_success", "created_at", "notes"], path, errors);
  requireTrue(obj["evaluates_opt_in_evidence"], `${path}.evaluates_opt_in_evidence`, errors);
  ["reads_process_env", "reads_api_key_value", "performs_network_call", "imports_provider_sdk", "enables_live_execution", "writes_ledger", "writes_files", "returns_provider_output", "returns_fake_success"].forEach((field) => requireFalse(obj[field], `${path}.${field}`, errors));
  notes(obj, path, errors);
}

function validateHealth(value: unknown, path: string, errors: Issues): void {
  const obj = objectAt(value, path, errors); if (!obj) return;
  requireFields(obj, ["schema_version", "harness_id", "contract_available", "runtime_enabled", "live_execution_enabled", "process_env_read", "api_key_value_read", "network_available", "provider_sdk_available", "checked_at", "warnings", "errors", "notes"], path, errors);
  ["contract_available", "runtime_enabled"].forEach((field) => requireTrue(obj[field], `${path}.${field}`, errors));
  ["live_execution_enabled", "process_env_read", "api_key_value_read", "network_available", "provider_sdk_available"].forEach((field) => requireFalse(obj[field], `${path}.${field}`, errors));
  requireArray(obj["warnings"], `${path}.warnings`, errors);
  requireArray(obj["errors"], `${path}.errors`, errors);
  notes(obj, path, errors);
}

function validateTrust(value: unknown, path: string, errors: Issues): void {
  const obj = objectAt(value, path, errors); if (!obj) return;
  const falseFields = ["harness_evaluation_promotes_trust", "harness_decision_promotes_trust", "opt_in_evidence_promotes_trust", "human_approval_evidence_promotes_trust", "kill_switch_state_promotes_trust", "api_key_availability_promotes_trust", "provider_allowlist_presence_promotes_trust", "network_permission_promotes_trust", "ready_disabled_promotes_trust", "provider_output_is_deterministic_evidence", "verified_final_truth_claimed"];
  requireFields(obj, [...falseFields, "raw_provider_output_trust_tier", "schema_valid_provider_output_trust_tier", "max_provider_output_trust_tier", "requires_vrp_for_t2", "notes"], path, errors);
  falseFields.forEach((field) => requireFalse(obj[field], `${path}.${field}`, errors));
  if (obj["raw_provider_output_trust_tier"] !== "T0") issue(errors, "invalid_raw_trust_tier", `${path}.raw_provider_output_trust_tier`, "must be T0.");
  if (obj["schema_valid_provider_output_trust_tier"] !== "T1") issue(errors, "invalid_schema_trust_tier", `${path}.schema_valid_provider_output_trust_tier`, "must be T1.");
  if (obj["max_provider_output_trust_tier"] !== "T1") issue(errors, "invalid_max_trust_tier", `${path}.max_provider_output_trust_tier`, "must be T1.");
  requireTrue(obj["requires_vrp_for_t2"], `${path}.requires_vrp_for_t2`, errors);
  notes(obj, path, errors);
}

function validateSafety(value: unknown, path: string, errors: Issues): void {
  const obj = objectAt(value, path, errors); if (!obj) return;
  const trueFields = ["live_execution_blocked", "live_adapter_blocked", "provider_call_blocked", "provider_specific_behavior_blocked", "real_model_api_layer_blocked", "process_env_read_blocked", "api_key_value_read_blocked", "network_call_blocked", "provider_sdk_blocked", "ledger_write_blocked", "file_write_blocked", "fake_success_blocked", "provider_output_blocked"];
  requireFields(obj, [...trueFields, "notes"], path, errors);
  trueFields.forEach((field) => requireTrue(obj[field], `${path}.${field}`, errors));
  notes(obj, path, errors);
}

function validateAudit(value: unknown, path: string, errors: Issues): void {
  const obj = objectAt(value, path, errors); if (!obj) return;
  const falseFields = ["live_execution_attempted", "live_adapter_used", "provider_call_attempted", "provider_specific_behavior_used", "real_model_api_layer_used", "process_env_read", "api_key_value_read", "network_call_attempted", "provider_sdk_used", "ledger_write_attempted", "file_write_attempted", "fake_success_returned", "provider_output_returned"];
  requireFields(obj, [...falseFields, "notes"], path, errors);
  falseFields.forEach((field) => requireFalse(obj[field], `${path}.${field}`, errors));
  notes(obj, path, errors);
}

function validateGateResults(value: unknown, path: string, errors: Issues): void {
  if (!Array.isArray(value)) {
    issue(errors, "invalid_array", path, `${path} must be an array.`);
    return;
  }
  value.forEach((item, index) => {
    const obj = objectAt(item, `${path}[${index}]`, errors); if (!obj) return;
    requireFields(obj, ["gate", "passed", "status", "refusal_kind", "notes"], `${path}[${index}]`, errors);
    if (typeof obj["gate"] !== "string" || !gates.includes(obj["gate"] as OneProviderAdapterOptInHarnessGate)) issue(errors, "invalid_gate", `${path}[${index}].gate`, "unsupported gate.");
    if (typeof obj["status"] !== "string" || !statuses.has(obj["status"])) issue(errors, "invalid_status", `${path}[${index}].status`, "unsupported status.");
    notes(obj, `${path}[${index}]`, errors);
  });
}

export function validateOneProviderAdapterOptInHarnessEvaluationResult(input: unknown): OneProviderAdapterOptInHarnessImplementationValidationResult {
  const errors: Issues = [];
  const obj = objectAt(input, "$", errors); if (!obj) return { ok: false, errors };
  requireFields(obj, ["schema_version", "result_id", "evaluation_id", "harness_id", "adapter_id", "provider_id", "provider_kind", "ok", "status", "blocking_gate", "refusal_kind", "ready_disabled", "gate_order", "gate_results", "capabilities", "health", "trust_summary", "safety_summary", "audit_summary", "live_execution_attempted", "provider_call_attempted", "network_call_attempted", "provider_sdk_used", "process_env_read", "api_key_value_read", "ledger_write_attempted", "file_write_attempted", "fake_success_returned", "provider_output_returned", "warnings", "errors", "created_at", "notes"], "$", errors);
  ["result_id", "evaluation_id", "harness_id", "adapter_id", "provider_id", "provider_kind", "created_at"].forEach((field) => requireString(obj, field, "$", errors));
  if (typeof obj["status"] !== "string" || !statuses.has(obj["status"])) issue(errors, "invalid_status", "$.status", "unsupported status.");
  if (typeof obj["blocking_gate"] !== "string" || !gates.includes(obj["blocking_gate"] as OneProviderAdapterOptInHarnessGate)) issue(errors, "invalid_blocking_gate", "$.blocking_gate", "unsupported blocking gate.");
  if (!Array.isArray(obj["gate_order"]) || obj["gate_order"].join("|") !== gates.join("|")) issue(errors, "invalid_gate_order", "$.gate_order", "gate order drifted.");
  validateGateResults(obj["gate_results"], "$.gate_results", errors);
  validateCapabilities(obj["capabilities"], "$.capabilities", errors);
  validateHealth(obj["health"], "$.health", errors);
  validateTrust(obj["trust_summary"], "$.trust_summary", errors);
  validateSafety(obj["safety_summary"], "$.safety_summary", errors);
  validateAudit(obj["audit_summary"], "$.audit_summary", errors);
  ["live_execution_attempted", "provider_call_attempted", "network_call_attempted", "provider_sdk_used", "process_env_read", "api_key_value_read", "ledger_write_attempted", "file_write_attempted", "fake_success_returned", "provider_output_returned"].forEach((field) => requireFalse(obj[field], `$.${field}`, errors));
  if (obj["ready_disabled"] === true && obj["status"] !== "ready_but_live_execution_disabled") issue(errors, "invalid_ready_disabled_status", "$.ready_disabled", "ready_disabled requires ready_but_live_execution_disabled.");
  if (obj["ready_disabled"] === true && obj["ok"] !== true) issue(errors, "invalid_ready_disabled_ok", "$.ok", "ready_disabled requires ok true.");
  requireArray(obj["warnings"], "$.warnings", errors);
  requireArray(obj["errors"], "$.errors", errors);
  notes(obj, "$", errors);
  return { ok: errors.length === 0, errors };
}

export function isOneProviderAdapterOptInHarnessEvaluationResult(input: unknown): input is OneProviderAdapterOptInHarnessEvaluationResult {
  return validateOneProviderAdapterOptInHarnessEvaluationResult(input).ok;
}

export function assertOneProviderAdapterOptInHarnessEvaluationResult(input: unknown): OneProviderAdapterOptInHarnessEvaluationResult {
  const validation = validateOneProviderAdapterOptInHarnessEvaluationResult(input);
  if (!validation.ok) throw new Error(`Invalid OneProviderAdapterOptInHarnessEvaluationResult: ${validation.errors.map((error) => `${error.path} ${error.code}`).join("; ")}`);
  return input as OneProviderAdapterOptInHarnessEvaluationResult;
}

function invalidInputFallback(options?: OneProviderAdapterOptInHarnessOptions): OneProviderAdapterOptInHarnessEvaluationInput {
  return {
    schema_version: schemaVersion,
    evaluation_id: "invalid_evaluation",
    harness_id: options?.harness_id ?? "one_provider_adapter_opt_in_harness",
    adapter_id: "invalid_adapter",
    provider_id: "invalid_provider",
    provider_kind: "invalid",
    config: { config_present: false, config_valid: false, config_ref: "invalid_config", config_promotes_trust: false, notes: [] },
    opt_in_evidence: { opt_in_present: false, env_flag_present: false, command_flag_present: false, provider_allowlist_present: false, provider_allowlisted: false, adapter_id_present: false, adapter_id_allowed: false, human_approval_recorded: false, api_key_available_by_reference: false, redaction_ready: false, safety_profile_ready: false, cost_guard_ready: false, live_tests_enabled_for_explicit_opt_in: false, evidence_promotes_trust: false, notes: [] },
    kill_switch: { kill_switch_present: false, kill_switch_blocks_live_execution: true, kill_switch_promotes_trust: false, notes: [] },
    created_at: options?.created_at ?? defaultTimestamp,
    notes: []
  };
}

import type { RuntimeRotationPlanRole, RuntimeRotationRouteMode } from "../roles/types/runtimeRotationPlan.js";

export const LIVE_ROTATION_GATE_EVIDENCE_SCHEMA_VERSION = "1.0.0" as const;
export const LIVE_ROTATION_MAX_ROLE_TOKENS = 512;
export const LIVE_ROTATION_MAX_TIMEOUT_MS = 30_000;
export const LIVE_ROTATION_MAX_RESPONSE_BYTES = 1024 * 1024;
export const LIVE_ROTATION_MAX_TOTAL_TOKENS = 8192;
export const LIVE_ROTATION_MAX_SPEND_USD = 0.05;

export type LiveRotationProviderId = "anthropic" | "xai";
export type LiveRotationAdapterId = "anthropic_live_adapter" | "grok_live_adapter";
export type LiveRotationModelId = "claude-haiku-4-5" | "grok-3-mini";

export interface LiveRotationInvocationBudget {
  readonly max_tokens: number;
  readonly timeout_ms: number;
  readonly max_response_bytes: number;
}

export interface LiveRotationRoleBindingEvidence {
  readonly role_id: "planner" | "critic";
  readonly provider_id: LiveRotationProviderId;
  readonly adapter_id: LiveRotationAdapterId;
  readonly model_id: LiveRotationModelId;
  readonly budget: LiveRotationInvocationBudget;
}

export interface LiveRotationRunBudget {
  readonly max_total_invocations: number;
  readonly max_total_tokens: number;
  readonly max_spend_usd: number;
}

export interface LiveRotationPromptTemplateRef {
  readonly template_id: "live_rotation_planner_v1" | "live_rotation_critic_v1";
  readonly path: string;
  readonly sha256_digest: `sha256:${string}`;
}

export interface LiveRotationPromptTemplates {
  readonly planner: LiveRotationPromptTemplateRef;
  readonly critic: LiveRotationPromptTemplateRef;
}

export interface LiveRotationGateEvidence {
  readonly schema_version: typeof LIVE_ROTATION_GATE_EVIDENCE_SCHEMA_VERSION;
  readonly explicit_opt_in: true;
  readonly explicit_live_request: true;
  readonly network_permission: true;
  readonly approved_by: string;
  readonly task_statement: string;
  readonly prompt_templates: LiveRotationPromptTemplates;
  readonly role_bindings: readonly LiveRotationRoleBindingEvidence[];
  readonly run_budget: LiveRotationRunBudget;
}

export interface LiveRotationEvidenceAdapterBinding {
  readonly role_id: RuntimeRotationPlanRole;
  readonly adapter_id: string;
  readonly adapter_kind: "mock" | "live";
}

export interface LiveRotationGateEvidenceRequirements {
  readonly route_mode: RuntimeRotationRouteMode;
  readonly roles_required: readonly RuntimeRotationPlanRole[];
  readonly max_cycles: number;
  readonly sequence_length: number;
  readonly adapter_bindings: readonly LiveRotationEvidenceAdapterBinding[];
}

export interface LiveRotationGateEvidenceIssue {
  readonly code: string;
  readonly path: string;
  readonly message: string;
}

export type LiveRotationGateEvidenceValidationResult =
  | {
      readonly ok: true;
      readonly evidence: LiveRotationGateEvidence;
      readonly issues: readonly [];
    }
  | {
      readonly ok: false;
      readonly evidence: null;
      readonly issues: readonly LiveRotationGateEvidenceIssue[];
    };

const SHA256_FORMAT = /^sha256:[0-9a-f]{64}$/;
const ROOT_FIELDS = [
  "schema_version",
  "explicit_opt_in",
  "explicit_live_request",
  "network_permission",
  "approved_by",
  "task_statement",
  "prompt_templates",
  "role_bindings",
  "run_budget"
] as const;
const ROLE_BINDING_FIELDS = ["role_id", "provider_id", "adapter_id", "model_id", "budget"] as const;
const INVOCATION_BUDGET_FIELDS = ["max_tokens", "timeout_ms", "max_response_bytes"] as const;
const RUN_BUDGET_FIELDS = ["max_total_invocations", "max_total_tokens", "max_spend_usd"] as const;
const TEMPLATE_FIELDS = ["template_id", "path", "sha256_digest"] as const;

const ALLOWED_BINDINGS: Readonly<Record<LiveRotationAdapterId, {
  readonly provider_id: LiveRotationProviderId;
  readonly model_id: LiveRotationModelId;
}>> = {
  anthropic_live_adapter: {
    provider_id: "anthropic",
    model_id: "claude-haiku-4-5"
  },
  grok_live_adapter: {
    provider_id: "xai",
    model_id: "grok-3-mini"
  }
};

const EXPECTED_TEMPLATES = {
  planner: {
    template_id: "live_rotation_planner_v1",
    path: "examples/live-rotation/prompts/planner.prompt.txt"
  },
  critic: {
    template_id: "live_rotation_critic_v1",
    path: "examples/live-rotation/prompts/critic.prompt.txt"
  }
} as const;

export function validateLiveRotationGateEvidence(
  input: unknown,
  requirements: LiveRotationGateEvidenceRequirements
): LiveRotationGateEvidenceValidationResult {
  const issues: LiveRotationGateEvidenceIssue[] = [];
  if (!isRecord(input)) {
    return fail([issue("live_evidence_missing", "$.live_rotation_gate_evidence", "Live gate evidence must be an object.")]);
  }

  rejectUnknownFields(input, ROOT_FIELDS, "$.live_rotation_gate_evidence", issues);
  requireEqual(input, "schema_version", LIVE_ROTATION_GATE_EVIDENCE_SCHEMA_VERSION, issues);
  requireEqual(input, "explicit_opt_in", true, issues);
  requireEqual(input, "explicit_live_request", true, issues);
  requireEqual(input, "network_permission", true, issues);
  requireNonEmptyString(input, "approved_by", 256, issues);
  requireNonEmptyString(input, "task_statement", 4096, issues);

  if (requirements.route_mode !== "planner_critic") {
    issues.push(issue("live_route_not_authorized", "$.route_mode", "LIVE-R1 authorizes only planner_critic."));
  }
  if (requirements.max_cycles !== 1 || requirements.sequence_length !== 2) {
    issues.push(issue("live_sequence_not_authorized", "$.max_cycles", "LIVE-R1 requires one Planner/Critic cycle."));
  }
  if (
    requirements.roles_required.length !== 2 ||
    requirements.roles_required[0] !== "planner" ||
    requirements.roles_required[1] !== "critic"
  ) {
    issues.push(issue("live_roles_not_authorized", "$.roles_required", "LIVE-R1 requires planner then critic."));
  }

  validatePromptTemplates(input["prompt_templates"], issues);
  const normalizedBindings = validateRoleBindings(
    input["role_bindings"],
    requirements.adapter_bindings,
    issues
  );
  const runBudget = validateRunBudget(input["run_budget"], requirements, issues);

  if (issues.length > 0 || normalizedBindings === null || runBudget === null) {
    return fail(issues);
  }

  return {
    ok: true,
    evidence: input as unknown as LiveRotationGateEvidence,
    issues: []
  };
}

function validatePromptTemplates(value: unknown, issues: LiveRotationGateEvidenceIssue[]): void {
  if (!isRecord(value)) {
    issues.push(issue("live_prompt_templates_invalid", "$.live_rotation_gate_evidence.prompt_templates", "prompt_templates must be an object."));
    return;
  }
  rejectUnknownFields(value, ["planner", "critic"], "$.live_rotation_gate_evidence.prompt_templates", issues);
  for (const role of ["planner", "critic"] as const) {
    const template = value[role];
    const path = `$.live_rotation_gate_evidence.prompt_templates.${role}`;
    if (!isRecord(template)) {
      issues.push(issue("live_prompt_template_invalid", path, `${role} prompt template must be an object.`));
      continue;
    }
    rejectUnknownFields(template, TEMPLATE_FIELDS, path, issues);
    if (template["template_id"] !== EXPECTED_TEMPLATES[role].template_id) {
      issues.push(issue("live_prompt_template_id_invalid", `${path}.template_id`, "Prompt template id is not authorized."));
    }
    if (template["path"] !== EXPECTED_TEMPLATES[role].path) {
      issues.push(issue("live_prompt_template_path_invalid", `${path}.path`, "Prompt template path is not authorized."));
    }
    if (typeof template["sha256_digest"] !== "string" || !SHA256_FORMAT.test(template["sha256_digest"])) {
      issues.push(issue("live_prompt_template_digest_invalid", `${path}.sha256_digest`, "Prompt template digest must be sha256 hex."));
    }
  }
}

function validateRoleBindings(
  value: unknown,
  adapterBindings: readonly LiveRotationEvidenceAdapterBinding[],
  issues: LiveRotationGateEvidenceIssue[]
): readonly LiveRotationRoleBindingEvidence[] | null {
  if (!Array.isArray(value)) {
    issues.push(issue("live_role_bindings_invalid", "$.live_rotation_gate_evidence.role_bindings", "role_bindings must be an array."));
    return null;
  }
  const normalized: LiveRotationRoleBindingEvidence[] = [];
  const seen = new Set<string>();
  value.forEach((entry, index) => {
    const path = `$.live_rotation_gate_evidence.role_bindings[${index}]`;
    if (!isRecord(entry)) {
      issues.push(issue("live_role_binding_invalid", path, "Role binding must be an object."));
      return;
    }
    rejectUnknownFields(entry, ROLE_BINDING_FIELDS, path, issues);
    const roleId = entry["role_id"];
    const adapterId = entry["adapter_id"];
    const providerId = entry["provider_id"];
    const modelId = entry["model_id"];
    if (roleId !== "planner" && roleId !== "critic") {
      issues.push(issue("live_role_binding_role_invalid", `${path}.role_id`, "Role must be planner or critic."));
      return;
    }
    if (seen.has(roleId)) {
      issues.push(issue("live_role_binding_duplicate", `${path}.role_id`, "Each role may appear once."));
      return;
    }
    seen.add(roleId);
    if (adapterId !== "anthropic_live_adapter" && adapterId !== "grok_live_adapter") {
      issues.push(issue("live_adapter_not_allowlisted", `${path}.adapter_id`, "Adapter is not egress-pinned and allowlisted."));
      return;
    }
    const allowed = ALLOWED_BINDINGS[adapterId];
    if (providerId !== allowed.provider_id || modelId !== allowed.model_id) {
      issues.push(issue("live_provider_model_binding_invalid", path, "Provider/model does not match the allowlisted adapter."));
    }
    const bridgeBinding = adapterBindings.find((binding) => binding.role_id === roleId);
    if (bridgeBinding?.adapter_kind !== "live" || bridgeBinding.adapter_id !== adapterId) {
      issues.push(issue("live_bridge_binding_mismatch", path, "Gate evidence must match the live bridge binding."));
    }
    const budget = validateInvocationBudget(entry["budget"], `${path}.budget`, issues);
    if (budget !== null) {
      normalized.push({
        role_id: roleId,
        provider_id: providerId as LiveRotationProviderId,
        adapter_id: adapterId,
        model_id: modelId as LiveRotationModelId,
        budget
      });
    }
  });
  for (const role of ["planner", "critic"] as const) {
    if (!seen.has(role)) {
      issues.push(issue("live_role_binding_missing", "$.live_rotation_gate_evidence.role_bindings", `Missing ${role} binding.`));
    }
  }
  return normalized;
}

function validateInvocationBudget(
  value: unknown,
  path: string,
  issues: LiveRotationGateEvidenceIssue[]
): LiveRotationInvocationBudget | null {
  if (!isRecord(value)) {
    issues.push(issue("live_invocation_budget_invalid", path, "Invocation budget must be an object."));
    return null;
  }
  rejectUnknownFields(value, INVOCATION_BUDGET_FIELDS, path, issues);
  const maxTokens = positiveInteger(value["max_tokens"], `${path}.max_tokens`, issues);
  const timeoutMs = positiveInteger(value["timeout_ms"], `${path}.timeout_ms`, issues);
  const maxResponseBytes = positiveInteger(value["max_response_bytes"], `${path}.max_response_bytes`, issues);
  if (maxTokens !== null && maxTokens > LIVE_ROTATION_MAX_ROLE_TOKENS) {
    issues.push(issue("live_role_token_budget_exceeded", `${path}.max_tokens`, `max_tokens cannot exceed ${LIVE_ROTATION_MAX_ROLE_TOKENS}.`));
  }
  if (timeoutMs !== null && timeoutMs > LIVE_ROTATION_MAX_TIMEOUT_MS) {
    issues.push(issue("live_role_timeout_budget_exceeded", `${path}.timeout_ms`, `timeout_ms cannot exceed ${LIVE_ROTATION_MAX_TIMEOUT_MS}.`));
  }
  if (maxResponseBytes !== null && maxResponseBytes > LIVE_ROTATION_MAX_RESPONSE_BYTES) {
    issues.push(issue("live_role_response_budget_exceeded", `${path}.max_response_bytes`, `max_response_bytes cannot exceed ${LIVE_ROTATION_MAX_RESPONSE_BYTES}.`));
  }
  return maxTokens === null || timeoutMs === null || maxResponseBytes === null
    ? null
    : { max_tokens: maxTokens, timeout_ms: timeoutMs, max_response_bytes: maxResponseBytes };
}

function validateRunBudget(
  value: unknown,
  requirements: LiveRotationGateEvidenceRequirements,
  issues: LiveRotationGateEvidenceIssue[]
): LiveRotationRunBudget | null {
  const path = "$.live_rotation_gate_evidence.run_budget";
  if (!isRecord(value)) {
    issues.push(issue("live_run_budget_invalid", path, "run_budget must be an object."));
    return null;
  }
  rejectUnknownFields(value, RUN_BUDGET_FIELDS, path, issues);
  const invocations = positiveInteger(value["max_total_invocations"], `${path}.max_total_invocations`, issues);
  const tokens = positiveInteger(value["max_total_tokens"], `${path}.max_total_tokens`, issues);
  const spend = typeof value["max_spend_usd"] === "number" && Number.isFinite(value["max_spend_usd"])
    ? value["max_spend_usd"]
    : null;
  if (invocations !== null && invocations !== requirements.sequence_length) {
    issues.push(issue("live_total_invocation_budget_mismatch", `${path}.max_total_invocations`, "Invocation budget must exactly match the derived sequence."));
  }
  if (tokens !== null && tokens > LIVE_ROTATION_MAX_TOTAL_TOKENS) {
    issues.push(issue("live_total_token_budget_invalid", `${path}.max_total_tokens`, `Total tokens cannot exceed ${LIVE_ROTATION_MAX_TOTAL_TOKENS}.`));
  }
  if (spend === null || spend <= 0 || spend > LIVE_ROTATION_MAX_SPEND_USD) {
    issues.push(issue("live_spend_budget_invalid", `${path}.max_spend_usd`, `max_spend_usd must be positive and no greater than ${LIVE_ROTATION_MAX_SPEND_USD}.`));
  }
  return invocations === null || tokens === null || spend === null
    ? null
    : { max_total_invocations: invocations, max_total_tokens: tokens, max_spend_usd: spend };
}

function requireEqual(
  record: Record<string, unknown>,
  field: string,
  expected: unknown,
  issues: LiveRotationGateEvidenceIssue[]
): void {
  if (record[field] !== expected) {
    issues.push(issue(`live_${field}_required`, `$.live_rotation_gate_evidence.${field}`, `${field} must be ${String(expected)}.`));
  }
}

function requireNonEmptyString(
  record: Record<string, unknown>,
  field: string,
  maxLength: number,
  issues: LiveRotationGateEvidenceIssue[]
): void {
  const value = record[field];
  if (typeof value !== "string" || value.trim().length === 0 || value.length > maxLength) {
    issues.push(issue(`live_${field}_invalid`, `$.live_rotation_gate_evidence.${field}`, `${field} must be a bounded non-empty string.`));
  }
}

function positiveInteger(
  value: unknown,
  path: string,
  issues: LiveRotationGateEvidenceIssue[]
): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1) {
    issues.push(issue("live_budget_positive_integer_required", path, "Budget must be a positive integer."));
    return null;
  }
  return value;
}

function rejectUnknownFields(
  record: Record<string, unknown>,
  allowed: readonly string[],
  path: string,
  issues: LiveRotationGateEvidenceIssue[]
): void {
  for (const key of Object.keys(record)) {
    if (!allowed.includes(key)) {
      issues.push(issue("live_evidence_unknown_field", `${path}.${key}`, "Unknown live-evidence fields are forbidden."));
    }
  }
}

function issue(code: string, path: string, message: string): LiveRotationGateEvidenceIssue {
  return { code, path, message };
}

function fail(issues: readonly LiveRotationGateEvidenceIssue[]): LiveRotationGateEvidenceValidationResult {
  return { ok: false, evidence: null, issues };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

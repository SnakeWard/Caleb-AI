import { validateLiveRoleSemanticPayload } from "../roles/liveRoleSemanticPayloadValidator.js";
import type { RoleArtifact } from "../roles/types/roleArtifact.js";
import type { LiveRoleSemanticPayload } from "../roles/types/liveRoleSemanticPayload.js";
import type { ContentAddressedRawOutputStore } from "../rawOutput/contentAddressedRawOutputStore.js";
import type {
  LiveAdapterFailure,
  LiveAdapterNormalizedOutputObserver,
  LiveAdapterResult,
  LiveAdapterResponse
} from "../modelBoundary/types/liveAdapterTypes.js";
import { computeSha256Digest } from "../providers/liveAdapterShared.js";
import type {
  RoleRuntimeAdapter,
  RoleRuntimeAdapterInvokeInput,
  RoleRuntimeAdapterInvokeResult
} from "../roleRuntime/types/roleRuntimeAdapter.js";
import type { Sha256Digest } from "../types/common.js";
import type {
  LiveRotationGateEvidence,
  LiveRotationInvocationBudget,
  LiveRotationModelId,
  LiveRotationProviderId,
  LiveRotationRoleBindingEvidence,
  LiveRotationRunBudget
} from "./liveRotationGateEvidence.js";
import {
  buildLiveRoleArtifact,
  expectedNextRole,
  validateLiveRoleArtifactEnvelope,
  type LiveRoleArtifactFailureStage,
  type LiveRoleArtifactSafeIssue
} from "./liveRoleArtifactEnvelope.js";

export type LiveRotationRuntimeFailureCode =
  | "live_prompt_template_digest_mismatch"
  | "live_provider_invocation_failed"
  | "live_role_timeout_budget_exceeded"
  | "live_provider_response_unvalidated"
  | "live_observer_failure"
  | "live_observer_artifact_invalid"
  | "live_observer_output_truncated"
  | "live_observer_storage_failed"
  | "live_observer_output_missing"
  | "live_output_digest_mismatch"
  | "live_response_bytes_exceeded"
  | "live_role_token_budget_exceeded"
  | "live_total_invocation_budget_exceeded"
  | "live_total_token_budget_exceeded"
  | "live_total_spend_budget_exceeded";

export interface LiveRotationProviderInvokeInput {
  readonly task_id: string;
  readonly run_id: string;
  readonly prompt_text: string;
  readonly budget: LiveRotationInvocationBudget;
  readonly normalized_output_observer: LiveAdapterNormalizedOutputObserver;
}

export type LiveRotationProviderInvoker = (
  input: LiveRotationProviderInvokeInput
) => Promise<LiveAdapterResult>;

export interface LiveRotationPromptTemplate {
  readonly role_id: "planner" | "critic";
  readonly template_text: string;
  readonly expected_digest: Sha256Digest;
}

export interface LiveRotationInvocationTelemetry {
  readonly step_index: number;
  readonly role_id: "planner" | "critic";
  readonly provider_id: LiveRotationProviderId;
  readonly adapter_id: string;
  readonly model_id: LiveRotationModelId;
  readonly prompt_digest: Sha256Digest;
  readonly output_digest: Sha256Digest | null;
  readonly observed_store_digest: Sha256Digest | null;
  readonly input_tokens: number;
  readonly output_tokens: number;
  readonly total_tokens: number;
  readonly estimated_spend_usd: number;
  readonly latency_ms: number;
  readonly provider_response_id: string | null;
  readonly budget: LiveRotationInvocationBudget;
  readonly failure_code: LiveRotationRuntimeFailureCode | null;
  readonly provider_failure_kind: LiveAdapterFailure["failure_kind"] | null;
  readonly provider_failure_status: LiveAdapterFailure["status"] | null;
  readonly provider_failure_retryable: boolean | null;
  readonly observer_failure_stage: LiveRoleArtifactFailureStage | null;
  readonly observer_validation_issues: readonly LiveRoleArtifactSafeIssue[];
}

export interface LiveRotationRunTotals {
  readonly invocations: number;
  readonly total_tokens: number;
  readonly estimated_spend_usd: number;
}

export interface LiveRotationRuntimeState {
  readonly invocations: readonly LiveRotationInvocationTelemetry[];
  readonly totals: LiveRotationRunTotals;
  readonly failure_code: LiveRotationRuntimeFailureCode | null;
}

export interface LiveRotationRoleRuntimeAdapter extends RoleRuntimeAdapter {
  readonly adapter_kind: "live";
  read_live_state(): LiveRotationRuntimeState;
}

export interface CreateLiveRotationRoleRuntimeAdapterInput {
  readonly adapter_id: string;
  readonly evidence: LiveRotationGateEvidence;
  readonly bindings: readonly LiveRotationRoleBindingEvidence[];
  readonly prompt_templates: ReadonlyMap<"planner" | "critic", LiveRotationPromptTemplate>;
  readonly store: ContentAddressedRawOutputStore;
  readonly invoke_provider: LiveRotationProviderInvoker;
  readonly now?: () => string;
  readonly artifact_id_factory?: () => string;
}

interface StoredObservation {
  readonly artifact: RoleArtifact;
  readonly digest: Sha256Digest;
}

const PRICE_PER_MILLION: Readonly<Record<LiveRotationModelId, {
  readonly input: number;
  readonly output: number;
}>> = {
  "claude-haiku-4-5": { input: 1, output: 5 },
  "grok-3-mini": { input: 0.3, output: 0.5 }
};

export class LiveRotationRunBudgetTracker {
  readonly #budget: LiveRotationRunBudget;
  readonly #invocations: LiveRotationInvocationTelemetry[] = [];
  #failureCode: LiveRotationRuntimeFailureCode | null = null;

  constructor(budget: LiveRotationRunBudget) {
    this.#budget = budget;
  }

  record(telemetry: LiveRotationInvocationTelemetry): LiveRotationRuntimeFailureCode | null {
    const totalsBefore = this.totals();
    const nextInvocations = totalsBefore.invocations + 1;
    const nextTokens = totalsBefore.total_tokens + telemetry.total_tokens;
    const nextSpend = totalsBefore.estimated_spend_usd + telemetry.estimated_spend_usd;
    let failure: LiveRotationRuntimeFailureCode | null = telemetry.failure_code;
    if (failure === null && telemetry.output_tokens > telemetry.budget.max_tokens) {
      failure = "live_role_token_budget_exceeded";
    }
    if (failure === null && nextInvocations > this.#budget.max_total_invocations) {
      failure = "live_total_invocation_budget_exceeded";
    }
    if (failure === null && nextTokens > this.#budget.max_total_tokens) {
      failure = "live_total_token_budget_exceeded";
    }
    if (failure === null && nextSpend > this.#budget.max_spend_usd) {
      failure = "live_total_spend_budget_exceeded";
    }
    const recorded = failure === telemetry.failure_code
      ? telemetry
      : { ...telemetry, failure_code: failure };
    this.#invocations.push(recorded);
    this.#failureCode ??= failure;
    return failure;
  }

  markFailure(code: LiveRotationRuntimeFailureCode, telemetry: LiveRotationInvocationTelemetry): void {
    this.#invocations.push({ ...telemetry, failure_code: code });
    this.#failureCode ??= code;
  }

  state(): LiveRotationRuntimeState {
    return {
      invocations: this.#invocations.map((entry) => ({ ...entry, budget: { ...entry.budget } })),
      totals: this.totals(),
      failure_code: this.#failureCode
    };
  }

  private totals(): LiveRotationRunTotals {
    return {
      invocations: this.#invocations.length,
      total_tokens: this.#invocations.reduce((sum, entry) => sum + entry.total_tokens, 0),
      estimated_spend_usd: roundUsd(
        this.#invocations.reduce((sum, entry) => sum + entry.estimated_spend_usd, 0)
      )
    };
  }
}

export function createLiveRotationRoleRuntimeAdapter(
  input: CreateLiveRotationRoleRuntimeAdapterInput,
  tracker = new LiveRotationRunBudgetTracker(input.evidence.run_budget)
): LiveRotationRoleRuntimeAdapter {
  const bindingByRole = new Map(input.bindings.map((binding) => [binding.role_id, binding]));

  return {
    adapter_id: input.adapter_id,
    adapter_kind: "live",
    read_live_state: () => tracker.state(),
    invoke: async (runtimeInput) => invokeRole(runtimeInput, input, bindingByRole, tracker)
  };
}

export function isLiveRotationRoleRuntimeAdapter(
  adapter: RoleRuntimeAdapter | undefined
): adapter is LiveRotationRoleRuntimeAdapter {
  return adapter?.adapter_kind === "live" &&
    typeof (adapter as Partial<LiveRotationRoleRuntimeAdapter>).read_live_state === "function";
}

async function invokeRole(
  runtimeInput: RoleRuntimeAdapterInvokeInput,
  config: CreateLiveRotationRoleRuntimeAdapterInput,
  bindingByRole: ReadonlyMap<string, LiveRotationRoleBindingEvidence>,
  tracker: LiveRotationRunBudgetTracker
): Promise<RoleRuntimeAdapterInvokeResult> {
  if (runtimeInput.role_id !== "planner" && runtimeInput.role_id !== "critic") {
    return rejected();
  }
  const roleId = runtimeInput.role_id;
  const binding = bindingByRole.get(roleId);
  const template = config.prompt_templates.get(roleId);
  if (binding === undefined || template === undefined) {
    return rejected();
  }
  const templateDigest = computeSha256Digest(template.template_text) as Sha256Digest;
  if (templateDigest !== template.expected_digest) {
    tracker.markFailure(
      "live_prompt_template_digest_mismatch",
      emptyTelemetry(runtimeInput, binding, templateDigest, "live_prompt_template_digest_mismatch")
    );
    return rejected();
  }

  const promptText = renderPrompt(template.template_text, runtimeInput, config.evidence.task_statement);
  const promptDigest = computeSha256Digest(promptText) as Sha256Digest;
  let observation: StoredObservation | null = null;
  let observedStoreDigest: Sha256Digest | null = null;
  let observerFailure: LiveRotationRuntimeFailureCode | null = null;
  let observerFailureStage: LiveRoleArtifactFailureStage | null = null;
  let observerValidationIssues: readonly LiveRoleArtifactSafeIssue[] = [];
  let observationOpen = true;

  const normalizedOutputObserver: LiveAdapterNormalizedOutputObserver = async (
    normalizedText,
    metadata
  ) => {
    if (!observationOpen) {
      return { ok: false, failure_code: "observer_failure" };
    }
    if (new TextEncoder().encode(normalizedText).byteLength > binding.budget.max_response_bytes) {
      observerFailure = "live_response_bytes_exceeded";
      return { ok: false, failure_code: "observer_failure" };
    }
    const createdAt = config.now?.() ?? new Date().toISOString();
    const stored = await config.store.store({
      output_text: normalizedText,
      provider_id: binding.provider_id,
      model_id: binding.model_id,
      created_at: createdAt
    });
    if (!stored.ok || stored.record === undefined) {
      observerFailure = "live_observer_storage_failed";
      return { ok: false, failure_code: "observer_failure" };
    }
    observedStoreDigest = stored.record.digest;
    if (stored.record.digest !== metadata.output_digest) {
      observerFailure = "live_output_digest_mismatch";
      return { ok: false, failure_code: "observer_failure" };
    }
    if (
      metadata.finish_reason === "max_tokens" ||
      metadata.output_tokens === binding.budget.max_tokens
    ) {
      observerFailure = "live_observer_output_truncated";
      observerFailureStage = "output_truncated";
      observerValidationIssues = [{ code: "output_truncated", path: "$" }];
      return { ok: false, failure_code: "observer_failure" };
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(normalizedText) as unknown;
    } catch {
      observerFailure = "live_observer_artifact_invalid";
      observerFailureStage = "json_parse";
      observerValidationIssues = [{ code: "invalid_json", path: "$" }];
      return { ok: false, failure_code: "observer_failure" };
    }
    const payloadValidation = validateLiveRoleSemanticPayload(parsed);
    if (!payloadValidation.ok) {
      observerFailure = "live_observer_artifact_invalid";
      observerFailureStage = "payload_validation";
      observerValidationIssues = payloadValidation.issues.map(({ code, path }) => ({ code, path }));
      return { ok: false, failure_code: "observer_failure" };
    }
    const artifact = buildLiveRoleArtifact({
      payload: parsed as LiveRoleSemanticPayload,
      invocation: runtimeInput,
      created_at: createdAt,
      ...(config.artifact_id_factory === undefined
        ? {}
        : { artifact_id_factory: config.artifact_id_factory })
    });
    const envelopeValidation = validateLiveRoleArtifactEnvelope(artifact, runtimeInput);
    if (!envelopeValidation.ok) {
      observerFailure = "live_observer_artifact_invalid";
      observerFailureStage = envelopeValidation.detail.stage;
      observerValidationIssues = envelopeValidation.detail.issues;
      return { ok: false, failure_code: "observer_failure" };
    }
    observation = {
      artifact: envelopeValidation.artifact,
      digest: stored.record.digest
    };
    return { ok: true };
  };

  let result: LiveAdapterResult;
  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
  try {
    const outcome = await Promise.race([
      config.invoke_provider({
        task_id: runtimeInput.task_id,
        run_id: runtimeInput.run_id,
        prompt_text: promptText,
        budget: binding.budget,
        normalized_output_observer: normalizedOutputObserver
      }).then((value) => ({ kind: "result" as const, value })),
      new Promise<{ readonly kind: "timeout" }>((resolve) => {
        timeoutHandle = setTimeout(() => resolve({ kind: "timeout" }), binding.budget.timeout_ms);
      })
    ]);
    if (outcome.kind === "timeout") {
      observationOpen = false;
      const code = "live_role_timeout_budget_exceeded";
      tracker.markFailure(code, emptyTelemetry(runtimeInput, binding, promptDigest, code));
      return rejected();
    }
    result = outcome.value;
  } catch {
    observerFailure ??= "live_provider_invocation_failed";
    tracker.markFailure(
      observerFailure,
      emptyTelemetry(runtimeInput, binding, promptDigest, observerFailure)
    );
    return rejected();
  } finally {
    if (timeoutHandle !== undefined) {
      clearTimeout(timeoutHandle);
    }
  }

  if (!result.ok) {
    const code = observerFailure ??
      (result.failure.failure_kind === "observer_failure"
        ? "live_observer_failure"
        : "live_provider_invocation_failed");
    const telemetry = result.failure.response_telemetry === undefined
      ? emptyTelemetry(runtimeInput, binding, promptDigest, code, {
          failure_kind: result.failure.failure_kind,
          status: result.failure.status,
          retryable: result.failure.retryable
        }, observerFailureStage, observerValidationIssues)
      : telemetryFromFailure(
          runtimeInput,
          binding,
          promptDigest,
          result.failure,
          observedStoreDigest,
          code,
          observerFailureStage,
          observerValidationIssues
        );
    tracker.markFailure(code, telemetry);
    return rejected();
  }
  if (result.status !== "response_schema_valid") {
    const code = "live_provider_response_unvalidated";
    tracker.markFailure(code, telemetryFromResponse(runtimeInput, binding, promptDigest, result.response, null, code));
    return rejected();
  }
  if (observation === null) {
    const code = "live_observer_output_missing";
    tracker.markFailure(code, telemetryFromResponse(runtimeInput, binding, promptDigest, result.response, null, code));
    return rejected();
  }

  const observed = observation as StoredObservation;
  if (observed.digest !== result.response.output_ref.output_digest) {
    const code = "live_output_digest_mismatch";
    tracker.markFailure(code, telemetryFromResponse(runtimeInput, binding, promptDigest, result.response, observed.digest, code));
    return rejected();
  }

  const telemetry = telemetryFromResponse(
    runtimeInput,
    binding,
    promptDigest,
    result.response,
    observed.digest,
    null
  );
  const budgetFailure = tracker.record(telemetry);
  if (budgetFailure !== null) {
    return rejected();
  }

  return {
    ok: true,
    status: "completed",
    artifact: observed.artifact,
    artifact_provenance: { derived_from: [observed.digest] }
  };
}

function renderPrompt(
  template: string,
  input: RoleRuntimeAdapterInvokeInput,
  taskStatement: string
): string {
  const values: Readonly<Record<string, string>> = {
    TASK_STATEMENT: taskStatement,
    TASK_ID: input.task_id,
    RUN_ID: input.run_id,
    TRACE_ID: input.trace_id,
    CONTEXT_ID: input.context_id,
    ROLE_ID: input.role_id,
    REQUIRED_NEXT_ROLE: expectedNextRole(input.role_id) ?? "null",
    CONTEXT_TEXT: input.context_text.length === 0 ? "(none)" : input.context_text
  };
  return Object.entries(values).reduce(
    (rendered, [key, value]) => rendered.replaceAll(`{{${key}}}`, value),
    template
  );
}

function telemetryFromResponse(
  input: RoleRuntimeAdapterInvokeInput,
  binding: LiveRotationRoleBindingEvidence,
  promptDigest: Sha256Digest,
  response: LiveAdapterResponse,
  observedStoreDigest: Sha256Digest | null,
  failureCode: LiveRotationRuntimeFailureCode | null
): LiveRotationInvocationTelemetry {
  const estimatedSpend = estimateSpend(
    binding.model_id,
    response.token_usage.input_tokens,
    response.token_usage.output_tokens
  );
  return {
    step_index: input.step_index,
    role_id: binding.role_id,
    provider_id: binding.provider_id,
    adapter_id: binding.adapter_id,
    model_id: binding.model_id,
    prompt_digest: promptDigest,
    output_digest: response.output_ref.output_digest as Sha256Digest,
    observed_store_digest: observedStoreDigest,
    input_tokens: response.token_usage.input_tokens,
    output_tokens: response.token_usage.output_tokens,
    total_tokens: response.token_usage.total_tokens,
    estimated_spend_usd: estimatedSpend,
    latency_ms: response.timing.latency_ms,
    provider_response_id: response.provider_response_id,
    budget: { ...binding.budget },
    failure_code: failureCode,
    provider_failure_kind: null,
    provider_failure_status: null,
    provider_failure_retryable: null,
    observer_failure_stage: null,
    observer_validation_issues: []
  };
}

function telemetryFromFailure(
  input: RoleRuntimeAdapterInvokeInput,
  binding: LiveRotationRoleBindingEvidence,
  promptDigest: Sha256Digest,
  failure: LiveAdapterFailure,
  observedStoreDigest: Sha256Digest | null,
  failureCode: LiveRotationRuntimeFailureCode,
  observerFailureStage: LiveRoleArtifactFailureStage | null,
  observerValidationIssues: readonly LiveRoleArtifactSafeIssue[]
): LiveRotationInvocationTelemetry {
  const response = failure.response_telemetry;
  if (response === undefined) {
    return emptyTelemetry(
      input,
      binding,
      promptDigest,
      failureCode,
      failure,
      observerFailureStage,
      observerValidationIssues
    );
  }
  return {
    step_index: input.step_index,
    role_id: binding.role_id,
    provider_id: binding.provider_id,
    adapter_id: binding.adapter_id,
    model_id: binding.model_id,
    prompt_digest: promptDigest,
    output_digest: response.output_digest as Sha256Digest,
    observed_store_digest: observedStoreDigest,
    input_tokens: response.token_usage.input_tokens,
    output_tokens: response.token_usage.output_tokens,
    total_tokens: response.token_usage.total_tokens,
    estimated_spend_usd: estimateSpend(
      binding.model_id,
      response.token_usage.input_tokens,
      response.token_usage.output_tokens
    ),
    latency_ms: response.timing.latency_ms,
    provider_response_id: response.provider_response_id,
    budget: { ...binding.budget },
    failure_code: failureCode,
    provider_failure_kind: failure.failure_kind,
    provider_failure_status: failure.status,
    provider_failure_retryable: failure.retryable,
    observer_failure_stage: observerFailureStage,
    observer_validation_issues: observerValidationIssues.map((entry) => ({ ...entry }))
  };
}

function emptyTelemetry(
  input: RoleRuntimeAdapterInvokeInput,
  binding: LiveRotationRoleBindingEvidence,
  promptDigest: Sha256Digest,
  failureCode: LiveRotationRuntimeFailureCode,
  providerFailure: Pick<LiveAdapterFailure, "failure_kind" | "status" | "retryable"> | null = null,
  observerFailureStage: LiveRoleArtifactFailureStage | null = null,
  observerValidationIssues: readonly LiveRoleArtifactSafeIssue[] = []
): LiveRotationInvocationTelemetry {
  return {
    step_index: input.step_index,
    role_id: binding.role_id,
    provider_id: binding.provider_id,
    adapter_id: binding.adapter_id,
    model_id: binding.model_id,
    prompt_digest: promptDigest,
    output_digest: null,
    observed_store_digest: null,
    input_tokens: 0,
    output_tokens: 0,
    total_tokens: 0,
    estimated_spend_usd: 0,
    latency_ms: 0,
    provider_response_id: null,
    budget: { ...binding.budget },
    failure_code: failureCode,
    provider_failure_kind: providerFailure?.failure_kind ?? null,
    provider_failure_status: providerFailure?.status ?? null,
    provider_failure_retryable: providerFailure?.retryable ?? null,
    observer_failure_stage: observerFailureStage,
    observer_validation_issues: observerValidationIssues.map((entry) => ({ ...entry }))
  };
}

function estimateSpend(modelId: LiveRotationModelId, inputTokens: number, outputTokens: number): number {
  const price = PRICE_PER_MILLION[modelId];
  return roundUsd((inputTokens * price.input + outputTokens * price.output) / 1_000_000);
}

function roundUsd(value: number): number {
  return Math.round(value * 1_000_000_000_000) / 1_000_000_000_000;
}

function rejected(): RoleRuntimeAdapterInvokeResult {
  return {
    ok: false,
    status: "failed",
    artifact: null,
    failure_code: "adapter_rejected"
  };
}

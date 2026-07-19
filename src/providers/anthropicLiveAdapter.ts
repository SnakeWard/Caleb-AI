import { randomUUID } from "node:crypto";

import { validateLiveAdapterRequest } from "../modelBoundary/liveAdapterContractValidator.js";
import type {
  LiveAdapterFailure,
  LiveAdapterFailureResponseTelemetry,
  LiveAdapterFailureKind,
  LiveAdapterRequest,
  LiveAdapterResponse,
  LiveAdapterResult,
  LiveAdapterResultStatus,
  LiveAdapterTrustSummary
} from "../modelBoundary/types/liveAdapterTypes.js";
import type {
  AnthropicLiveAdapter,
  AnthropicLiveAdapterCapabilities,
  AnthropicLiveAdapterConfig,
  AnthropicLiveAdapterDeps,
  AnthropicLiveAdapterGateEvidence,
  AnthropicLiveInvocationArgs,
  BuildAnthropicLiveAdapterRequestInput
} from "./anthropicLiveAdapterTypes.js";
import { ANTHROPIC_LIVE_ADAPTER_ID } from "./anthropicLiveAdapterTypes.js";
import { buildLiveAdapterTrustSummary, computeSha256Digest } from "./liveAdapterShared.js";

export { buildLiveAdapterTrustSummary, computeSha256Digest } from "./liveAdapterShared.js";

type FailureStatus = Exclude<LiveAdapterResultStatus, "response_schema_valid" | "response_raw">;

const MAX_RETRY_AFTER_WAIT_MS = 5_000;

export function buildAnthropicLiveAdapterRequest(
  input: BuildAnthropicLiveAdapterRequestInput
): LiveAdapterRequest {
  const createdAt = input.created_at ?? new Date().toISOString();
  const promptDigest = computeSha256Digest(input.prompt_text);
  const safetyProfileId = input.safety_profile_id ?? "default_live_safety_profile";

  return {
    schema_version: "0.1.0",
    task_id: input.task_id ?? `task_${randomUUID()}`,
    run_id: input.run_id ?? `run_${randomUUID()}`,
    request_id: input.request_id ?? `request_${randomUUID()}`,
    route_mode: "single_pass",
    provider_id: input.config.provider_id,
    provider_kind: input.config.provider_kind,
    adapter_id: input.config.adapter_id,
    adapter_version: input.config.adapter_version,
    prompt_ref: {
      prompt_ref_id: `promptref_${randomUUID()}`,
      prompt_digest: promptDigest,
      prompt_storage_kind: "digest_only",
      raw_prompt_included: false
    },
    redacted_prompt_digest: promptDigest,
    context_refs: [],
    evidence_refs: [],
    constraints: {},
    limits: input.config.limits,
    safety_profile: {
      safety_profile_id: safetyProfileId,
      redaction_required: true,
      raw_transcript_storage_allowed: false,
      ledger_raw_prompt_allowed: false,
      ledger_raw_output_allowed: false
    },
    created_at: createdAt
  };
}

export function createAnthropicLiveAdapter(
  config: AnthropicLiveAdapterConfig,
  gateEvidence: AnthropicLiveAdapterGateEvidence,
  deps: AnthropicLiveAdapterDeps
): AnthropicLiveAdapter {
  const now = deps.now ?? (() => new Date());
  const fetchImpl = deps.fetch_impl ?? fetch;

  function capabilities(): AnthropicLiveAdapterCapabilities {
    return {
      adapter_id: config.adapter_id,
      adapter_version: config.adapter_version,
      provider_id: config.provider_id,
      provider_kind: config.provider_kind,
      supports_live_network: true,
      requires_api_key: true,
      credential_auto_read: false,
      imports_provider_sdk: false,
      stores_raw_prompt: false,
      stores_raw_output: false,
      writes_ledger_directly: false,
      network_gated_behind_prerequisites: true,
      max_output_trust_tier: "T1"
    };
  }

  function failure(
    request: LiveAdapterRequest,
    failureKind: LiveAdapterFailureKind,
    status: FailureStatus,
    retryable: boolean,
    errors: readonly string[],
    warnings: readonly string[] = [],
    responseTelemetry?: LiveAdapterFailureResponseTelemetry
  ): LiveAdapterResult {
    const record: LiveAdapterFailure = {
      schema_version: "0.1.0",
      task_id: request.task_id,
      run_id: request.run_id,
      request_id: request.request_id,
      route_mode: "single_pass",
      provider_id: request.provider_id,
      provider_kind: request.provider_kind,
      adapter_id: config.adapter_id,
      adapter_version: config.adapter_version,
      failure_kind: failureKind,
      status,
      retryable,
      warnings,
      errors,
      ...(responseTelemetry === undefined ? {} : {
        response_telemetry: {
          ...responseTelemetry,
          token_usage: { ...responseTelemetry.token_usage },
          timing: { ...responseTelemetry.timing }
        }
      }),
      trust_summary: buildLiveAdapterTrustSummary(false),
      created_at: now().toISOString()
    };
    return { ok: false, status, failure: record, issues: [] };
  }

  async function invokeLive(args: AnthropicLiveInvocationArgs): Promise<LiveAdapterResult> {
    const { request, prompt_text } = args;

    // Gate chain — every check runs before any network activity and every
    // miss returns a structured failure, never a throw.
    const prereqs = gateEvidence.prerequisites_evaluation;
    if (prereqs.prerequisites_met !== true) {
      return failure(request, "adapter_unavailable", "rejected", false, [
        "live_prerequisites_not_met",
        ...prereqs.blocking_reasons
      ]);
    }
    if (gateEvidence.kill_switch_open !== true) {
      return failure(request, "adapter_unavailable", "rejected", false, ["kill_switch_closed"]);
    }
    if (gateEvidence.network_permission_granted_by_caller !== true) {
      return failure(request, "adapter_unavailable", "rejected", false, [
        "network_permission_not_granted_by_caller"
      ]);
    }
    if (gateEvidence.approved_by === null || gateEvidence.approved_by.trim().length === 0) {
      return failure(request, "adapter_unavailable", "rejected", false, ["human_approval_missing"]);
    }
    if (config.adapter_id !== ANTHROPIC_LIVE_ADAPTER_ID) {
      return failure(request, "adapter_unavailable", "rejected", false, ["adapter_not_allowlisted"]);
    }

    const requestValidation = validateLiveAdapterRequest(request);
    if (!requestValidation.ok) {
      return failure(
        request,
        "invalid_request",
        "validation_failed",
        false,
        requestValidation.errors.map((issue) => `${issue.code}:${issue.path}`)
      );
    }

    const promptDigest = computeSha256Digest(prompt_text);
    if (promptDigest !== request.prompt_ref.prompt_digest) {
      return failure(request, "invalid_request", "rejected", false, ["prompt_digest_mismatch"]);
    }

    const apiKey = deps.credential_provider?.();
    if (apiKey === undefined || apiKey.trim().length === 0) {
      return failure(request, "missing_api_key", "rejected", false, [
        "credential_provider_returned_no_value"
      ]);
    }

    // Never allow the key to appear in any outbound message string.
    const scrub = (text: string): string => text.split(apiKey).join("[redacted]");

    const wireBody = JSON.stringify({
      model: config.model,
      max_tokens: request.limits.max_output_tokens,
      messages: [{ role: "user", content: prompt_text }]
    });

    const startedAt = now().toISOString();
    const startedMs = Date.now();
    const maxAttempts = 1 + Math.max(0, request.limits.retry_count);
    let attempts = 0;
    let lastFailure: LiveAdapterResult | null = null;

    while (attempts < maxAttempts) {
      attempts += 1;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), request.limits.timeout_ms);
      let response: Response;

      try {
        response = await fetchImpl(`${config.api_base_url}/v1/messages`, {
          method: "POST",
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": config.anthropic_version,
            "content-type": "application/json"
          },
          body: wireBody,
          signal: controller.signal
        });
      } catch (err) {
        clearTimeout(timer);
        const aborted = controller.signal.aborted;
        lastFailure = aborted
          ? failure(request, "provider_timeout", "timeout", true, [
              `attempt_${attempts}_timed_out_after_${request.limits.timeout_ms}ms`
            ])
          : failure(request, "network_failure", "failed", true, [
              scrub(`attempt_${attempts}_network_failure: ${err instanceof Error ? err.message : "unknown"}`)
            ]);
        continue;
      }
      clearTimeout(timer);

      let rawBody: string;
      try {
        rawBody = await response.text();
      } catch {
        lastFailure = failure(request, "provider_malformed_response", "failed", false, [
          "response_body_unreadable"
        ]);
        break;
      }

      if (rawBody.length > config.max_response_bytes) {
        lastFailure = failure(request, "provider_malformed_response", "failed", false, [
          `response_too_large:${rawBody.length}>${config.max_response_bytes}`
        ]);
        break;
      }

      if (response.ok) {
        return await normalizeSuccess(request, rawBody, {
          startedAt,
          latencyMs: Date.now() - startedMs,
          attempts,
          maxAttempts
        });
      }

      const mapped = mapHttpStatus(response.status);
      const providerErrorMessage = scrub(extractProviderErrorMessage(rawBody));
      lastFailure = failure(request, mapped.kind, mapped.status, mapped.retryable, [
        `provider_http_${response.status}`,
        providerErrorMessage
      ]);

      if (!mapped.retryable || attempts >= maxAttempts) {
        break;
      }

      const retryAfterMs = parseRetryAfterMs(response.headers.get("retry-after"));
      if (retryAfterMs > 0) {
        await sleep(Math.min(retryAfterMs, MAX_RETRY_AFTER_WAIT_MS));
      }
    }

    return (
      lastFailure ??
      failure(request, "unknown_provider_error", "failed", false, ["no_attempt_recorded"])
    );
  }

  async function normalizeSuccess(
    request: LiveAdapterRequest,
    rawBody: string,
    timing: {
      readonly startedAt: string;
      readonly latencyMs: number;
      readonly attempts: number;
      readonly maxAttempts: number;
    }
  ): Promise<LiveAdapterResult> {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return failure(request, "provider_malformed_response", "failed", false, [
        "response_not_json"
      ]);
    }

    const body = parsed as Record<string, unknown>;
    const contentBlocks = Array.isArray(body.content) ? body.content : null;
    const usage =
      typeof body.usage === "object" && body.usage !== null
        ? (body.usage as Record<string, unknown>)
        : null;
    const inputTokens = typeof usage?.input_tokens === "number" ? usage.input_tokens : 0;
    const outputTokens = typeof usage?.output_tokens === "number" ? usage.output_tokens : 0;
    const usageAvailable = usage !== null && typeof usage.input_tokens === "number";

    const schemaValid =
      typeof body.id === "string" &&
      contentBlocks !== null &&
      typeof body.model === "string" &&
      usageAvailable;

    const outputText =
      contentBlocks === null
        ? ""
        : contentBlocks
            .filter(
              (block): block is { type: string; text: string } =>
                typeof block === "object" &&
                block !== null &&
                (block as Record<string, unknown>).type === "text" &&
                typeof (block as Record<string, unknown>).text === "string"
            )
            .map((block) => block.text)
            .join("");

    const warnings: string[] = [];
    const stopReason = typeof body.stop_reason === "string" ? body.stop_reason : "unknown";
    if (stopReason === "refusal") {
      warnings.push("provider_stop_reason_refusal");
    }
    if (outputText.length === 0) {
      warnings.push("provider_output_text_empty");
    }
    if (!schemaValid) {
      warnings.push("provider_response_shape_unexpected_treated_as_raw");
    }

    if (deps.normalized_output_observer !== undefined) {
      const outputDigest = computeSha256Digest(outputText);
      const responseTelemetry: LiveAdapterFailureResponseTelemetry = {
        provider_response_id: typeof body.id === "string" ? body.id : null,
        output_digest: outputDigest,
        finish_reason: stopReason,
        token_usage: {
          input_tokens: inputTokens,
          output_tokens: outputTokens,
          total_tokens: inputTokens + outputTokens,
          usage_available: usageAvailable
        },
        timing: {
          started_at: timing.startedAt,
          completed_at: now().toISOString(),
          latency_ms: timing.latencyMs,
          timed_out: false
        }
      };
      try {
        const observation = await deps.normalized_output_observer(outputText, {
          output_digest: outputDigest,
          finish_reason: stopReason,
          output_tokens: outputTokens
        });
        if (!observation.ok) {
          return failure(request, "observer_failure", "failed", false, [
            "normalized_output_observer_failed"
          ], [], responseTelemetry);
        }
      } catch {
        return failure(request, "observer_failure", "failed", false, [
          "normalized_output_observer_failed"
        ], [], responseTelemetry);
      }
    }

    const record: LiveAdapterResponse = {
      schema_version: "0.1.0",
      task_id: request.task_id,
      run_id: request.run_id,
      request_id: request.request_id,
      response_id: `response_${randomUUID()}`,
      route_mode: "single_pass",
      provider_id: request.provider_id,
      provider_kind: request.provider_kind,
      adapter_id: config.adapter_id,
      adapter_version: config.adapter_version,
      provider_response_id: typeof body.id === "string" ? body.id : null,
      output_ref: {
        output_ref_id: `outref_${randomUUID()}`,
        output_digest: computeSha256Digest(outputText),
        output_storage_kind: "digest_only",
        raw_output_included: false
      },
      redacted_output_digest: computeSha256Digest(outputText),
      finish_reason: stopReason,
      token_usage: {
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: inputTokens + outputTokens,
        usage_available: usageAvailable
      },
      timing: {
        started_at: timing.startedAt,
        completed_at: now().toISOString(),
        latency_ms: timing.latencyMs,
        timed_out: false
      },
      retry_summary: {
        attempts: timing.attempts,
        max_attempts: timing.maxAttempts,
        retryable: false,
        retry_notes: []
      },
      redaction_summary: {
        input_redacted: true,
        output_redacted: true,
        redaction_profile_id: request.safety_profile.safety_profile_id,
        raw_prompt_removed: true,
        raw_output_removed: true,
        sensitive_fields_removed: true,
        redaction_notes: ["digest_only_records"]
      },
      warnings,
      errors: [],
      trust_summary: buildLiveAdapterTrustSummary(schemaValid),
      validation_status: schemaValid ? "schema_valid" : "raw",
      created_at: now().toISOString()
    };

    return {
      ok: true,
      status: schemaValid ? "response_schema_valid" : "response_raw",
      response: record,
      issues: []
    };
  }

  return { capabilities, invokeLive };
}

function mapHttpStatus(status: number): {
  readonly kind: LiveAdapterFailureKind;
  readonly status: FailureStatus;
  readonly retryable: boolean;
} {
  if (status === 401 || status === 403) {
    return { kind: "provider_auth_failed", status: "auth_failed", retryable: false };
  }
  if (status === 429) {
    return { kind: "provider_rate_limited", status: "rate_limited", retryable: true };
  }
  if (status === 408) {
    return { kind: "provider_timeout", status: "timeout", retryable: true };
  }
  if (status === 400 || status === 404 || status === 413 || status === 422) {
    return { kind: "provider_rejected_request", status: "rejected", retryable: false };
  }
  if (status >= 500) {
    return { kind: "unknown_provider_error", status: "failed", retryable: true };
  }
  return { kind: "unknown_provider_error", status: "failed", retryable: false };
}

function extractProviderErrorMessage(rawBody: string): string {
  try {
    const parsed = JSON.parse(rawBody) as Record<string, unknown>;
    const error = parsed.error as Record<string, unknown> | undefined;
    const errorType = typeof error?.type === "string" ? error.type : "unknown_error_type";
    const message = typeof error?.message === "string" ? error.message : "no_error_message";
    return `${errorType}: ${message}`;
  } catch {
    return "provider_error_body_not_json";
  }
}

function parseRetryAfterMs(headerValue: string | null): number {
  if (headerValue === null) {
    return 0;
  }
  const seconds = Number.parseInt(headerValue, 10);
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : 0;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

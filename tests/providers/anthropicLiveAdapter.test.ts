import { describe, expect, it } from "vitest";

import {
  buildAnthropicLiveAdapterRequest,
  computeSha256Digest,
  createAnthropicLiveAdapter,
  evaluateOneProviderAdapterLivePrerequisites,
  ALLOWLISTED_LIVE_ADAPTER_IDS,
  DEFAULT_ANTHROPIC_LIVE_ADAPTER_CONFIG
} from "../../src/providers/index.js";
import type {
  AnthropicLiveAdapterConfig,
  AnthropicLiveAdapterDeps,
  AnthropicLiveAdapterGateEvidence
} from "../../src/providers/anthropicLiveAdapterTypes.js";
import type { OneProviderAdapterLivePrerequisitesEvaluation } from "../../src/providers/livePrerequisitesTypes.js";

const TEST_API_KEY = "sk-ant-test-key-do-not-leak-1234567890";
const TEST_PROMPT = "Reply with exactly one word: acknowledged";

function metPrerequisites(): OneProviderAdapterLivePrerequisitesEvaluation {
  return evaluateOneProviderAdapterLivePrerequisites({
    repo_root_confirmed: true,
    explicit_opt_in: true,
    explicit_live_request: true,
    provider_adapter_allowlisted: true,
    live_harness_allowlisted: true,
    credential_source_declared_by_caller: true,
    credential_auto_read: false,
    network_permission_granted_by_caller: true,
    explicit_live_command_or_flag: true,
    dry_run_report_completed: true,
    default_tests_non_live: true,
    default_acceptance_non_live: true,
    default_ci_non_live: true,
    provider_output_trust_ceiling: "T1",
    vrp_evidence_required_for_T2: true,
    created_at: "2026-07-04T00:00:00.000Z"
  });
}

function gates(overrides: Partial<AnthropicLiveAdapterGateEvidence> = {}): AnthropicLiveAdapterGateEvidence {
  return {
    prerequisites_evaluation: metPrerequisites(),
    kill_switch_open: true,
    network_permission_granted_by_caller: true,
    approved_by: "test_operator",
    ...overrides
  };
}

function testConfig(overrides: Partial<AnthropicLiveAdapterConfig> = {}): AnthropicLiveAdapterConfig {
  return {
    ...DEFAULT_ANTHROPIC_LIVE_ADAPTER_CONFIG,
    limits: { ...DEFAULT_ANTHROPIC_LIVE_ADAPTER_CONFIG.limits, timeout_ms: 500, retry_count: 1 },
    ...overrides
  };
}

interface CapturedFetchCall {
  readonly url: string;
  readonly init: RequestInit;
}

function mockFetch(
  responder: (call: CapturedFetchCall, attempt: number) => Response | Promise<Response>
): { fetchImpl: typeof fetch; calls: CapturedFetchCall[] } {
  const calls: CapturedFetchCall[] = [];
  const fetchImpl = (async (url: unknown, init?: unknown) => {
    const call: CapturedFetchCall = { url: String(url), init: (init ?? {}) as RequestInit };
    calls.push(call);
    return responder(call, calls.length);
  }) as typeof fetch;
  return { fetchImpl, calls };
}

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers }
  });
}

function successBody(outputText = "acknowledged"): Record<string, unknown> {
  return {
    id: "msg_test_01",
    type: "message",
    role: "assistant",
    model: "claude-haiku-4-5",
    content: [{ type: "text", text: outputText }],
    stop_reason: "end_turn",
    usage: { input_tokens: 12, output_tokens: 3 }
  };
}

function createAdapter(
  deps: Partial<AnthropicLiveAdapterDeps> & { fetch_impl?: typeof fetch },
  gateOverrides: Partial<AnthropicLiveAdapterGateEvidence> = {},
  config: AnthropicLiveAdapterConfig = testConfig()
) {
  return createAnthropicLiveAdapter(config, gates(gateOverrides), {
    credential_provider: () => TEST_API_KEY,
    ...deps
  });
}

function buildRequest(config: AnthropicLiveAdapterConfig = testConfig(), promptText = TEST_PROMPT) {
  return buildAnthropicLiveAdapterRequest({ prompt_text: promptText, config });
}

describe("anthropic live adapter gate chain", () => {
  it("refuses without network when prerequisites are not met", async () => {
    const unmet = evaluateOneProviderAdapterLivePrerequisites({
      repo_root_confirmed: true,
      explicit_opt_in: false,
      explicit_live_request: true,
      provider_adapter_allowlisted: true,
      live_harness_allowlisted: true,
      credential_source_declared_by_caller: true,
      credential_auto_read: false,
      network_permission_granted_by_caller: true,
      explicit_live_command_or_flag: true,
      dry_run_report_completed: true,
      default_tests_non_live: true,
      default_acceptance_non_live: true,
      default_ci_non_live: true,
      provider_output_trust_ceiling: "T1",
      vrp_evidence_required_for_T2: true
    });
    const { fetchImpl, calls } = mockFetch(() => jsonResponse(200, successBody()));
    const adapter = createAdapter({ fetch_impl: fetchImpl }, { prerequisites_evaluation: unmet });

    const result = await adapter.invokeLive({ request: buildRequest(), prompt_text: TEST_PROMPT });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.failure_kind).toBe("adapter_unavailable");
      expect(result.failure.errors).toContain("explicit_opt_in_missing");
    }
    expect(calls).toHaveLength(0);
  });

  it("refuses without network when the kill switch is closed", async () => {
    const { fetchImpl, calls } = mockFetch(() => jsonResponse(200, successBody()));
    const adapter = createAdapter({ fetch_impl: fetchImpl }, { kill_switch_open: false });

    const result = await adapter.invokeLive({ request: buildRequest(), prompt_text: TEST_PROMPT });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.errors).toContain("kill_switch_closed");
    }
    expect(calls).toHaveLength(0);
  });

  it("refuses without network when network permission is not granted", async () => {
    const { fetchImpl, calls } = mockFetch(() => jsonResponse(200, successBody()));
    const adapter = createAdapter(
      { fetch_impl: fetchImpl },
      { network_permission_granted_by_caller: false }
    );

    const result = await adapter.invokeLive({ request: buildRequest(), prompt_text: TEST_PROMPT });

    expect(result.ok).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it("refuses without network when human approval is missing", async () => {
    const { fetchImpl, calls } = mockFetch(() => jsonResponse(200, successBody()));
    const adapter = createAdapter({ fetch_impl: fetchImpl }, { approved_by: null });

    const result = await adapter.invokeLive({ request: buildRequest(), prompt_text: TEST_PROMPT });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.errors).toContain("human_approval_missing");
    }
    expect(calls).toHaveLength(0);
  });

  it("refuses without network when the credential provider is null", async () => {
    const { fetchImpl, calls } = mockFetch(() => jsonResponse(200, successBody()));
    const adapter = createAdapter({ fetch_impl: fetchImpl, credential_provider: null });

    const result = await adapter.invokeLive({ request: buildRequest(), prompt_text: TEST_PROMPT });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.failure_kind).toBe("missing_api_key");
    }
    expect(calls).toHaveLength(0);
  });

  it("refuses without network when the credential provider returns empty", async () => {
    const { fetchImpl, calls } = mockFetch(() => jsonResponse(200, successBody()));
    const adapter = createAdapter({ fetch_impl: fetchImpl, credential_provider: () => "" });

    const result = await adapter.invokeLive({ request: buildRequest(), prompt_text: TEST_PROMPT });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.failure_kind).toBe("missing_api_key");
    }
    expect(calls).toHaveLength(0);
  });

  it("refuses without network on prompt digest mismatch", async () => {
    const { fetchImpl, calls } = mockFetch(() => jsonResponse(200, successBody()));
    const adapter = createAdapter({ fetch_impl: fetchImpl });

    const result = await adapter.invokeLive({
      request: buildRequest(),
      prompt_text: "a different prompt than the digest declares"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.failure_kind).toBe("invalid_request");
      expect(result.failure.errors).toContain("prompt_digest_mismatch");
    }
    expect(calls).toHaveLength(0);
  });

  it("refuses without network when the request fails contract validation", async () => {
    const { fetchImpl, calls } = mockFetch(() => jsonResponse(200, successBody()));
    const adapter = createAdapter({ fetch_impl: fetchImpl });
    const broken = { ...buildRequest(), route_mode: "multi_pass" } as never;

    const result = await adapter.invokeLive({ request: broken, prompt_text: TEST_PROMPT });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.status).toBe("validation_failed");
    }
    expect(calls).toHaveLength(0);
  });
});

describe("anthropic live adapter wire protocol", () => {
  it("sends the correct endpoint, headers, and body", async () => {
    const { fetchImpl, calls } = mockFetch(() => jsonResponse(200, successBody()));
    const adapter = createAdapter({ fetch_impl: fetchImpl });

    await adapter.invokeLive({ request: buildRequest(), prompt_text: TEST_PROMPT });

    expect(calls).toHaveLength(1);
    const call = calls[0];
    expect(call?.url).toBe("https://api.anthropic.com/v1/messages");
    const headers = call?.init.headers as Record<string, string>;
    expect(headers["x-api-key"]).toBe(TEST_API_KEY);
    expect(headers["anthropic-version"]).toBe("2023-06-01");
    expect(headers["content-type"]).toBe("application/json");
    const body = JSON.parse(String(call?.init.body)) as Record<string, unknown>;
    expect(body.model).toBe("claude-haiku-4-5");
    expect(body.max_tokens).toBe(testConfig().limits.max_output_tokens);
    expect(body.messages).toEqual([{ role: "user", content: TEST_PROMPT }]);
  });

  it("normalizes a valid success response to schema_valid with digest-only output", async () => {
    const { fetchImpl } = mockFetch(() => jsonResponse(200, successBody("acknowledged")));
    const adapter = createAdapter({ fetch_impl: fetchImpl });

    const result = await adapter.invokeLive({ request: buildRequest(), prompt_text: TEST_PROMPT });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe("response_schema_valid");
      expect(result.response.output_ref.output_digest).toBe(computeSha256Digest("acknowledged"));
      expect(result.response.output_ref.raw_output_included).toBe(false);
      expect(result.response.output_ref.output_storage_kind).toBe("digest_only");
      expect(result.response.provider_response_id).toBe("msg_test_01");
      expect(result.response.finish_reason).toBe("end_turn");
      expect(result.response.token_usage).toEqual({
        input_tokens: 12,
        output_tokens: 3,
        total_tokens: 15,
        usage_available: true
      });
      expect(result.response.validation_status).toBe("schema_valid");
    }
  });

  it("joins multiple text blocks before digesting", async () => {
    const body = {
      ...successBody(),
      content: [
        { type: "text", text: "ack" },
        { type: "text", text: "nowledged" }
      ]
    };
    const { fetchImpl } = mockFetch(() => jsonResponse(200, body));
    const adapter = createAdapter({ fetch_impl: fetchImpl });

    const result = await adapter.invokeLive({ request: buildRequest(), prompt_text: TEST_PROMPT });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.response.output_ref.output_digest).toBe(computeSha256Digest("acknowledged"));
    }
  });

  it("treats an unexpected 200 shape as raw with a warning", async () => {
    const { fetchImpl } = mockFetch(() => jsonResponse(200, { unexpected: true }));
    const adapter = createAdapter({ fetch_impl: fetchImpl });

    const result = await adapter.invokeLive({ request: buildRequest(), prompt_text: TEST_PROMPT });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.status).toBe("response_raw");
      expect(result.response.validation_status).toBe("raw");
      expect(result.response.trust_summary.schema_valid_provider_output_trust_tier).toBe("T0");
      expect(result.response.warnings).toContain("provider_response_shape_unexpected_treated_as_raw");
    }
  });

  it("flags a refusal stop_reason as a warning while still returning the record", async () => {
    const body = { ...successBody(""), content: [], stop_reason: "refusal" };
    const { fetchImpl } = mockFetch(() => jsonResponse(200, body));
    const adapter = createAdapter({ fetch_impl: fetchImpl });

    const result = await adapter.invokeLive({ request: buildRequest(), prompt_text: TEST_PROMPT });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.response.finish_reason).toBe("refusal");
      expect(result.response.warnings).toContain("provider_stop_reason_refusal");
      expect(result.response.warnings).toContain("provider_output_text_empty");
    }
  });
});

describe("anthropic live adapter failure mapping and retries", () => {
  it("maps 401 to auth_failed and does not retry", async () => {
    const { fetchImpl, calls } = mockFetch(() =>
      jsonResponse(401, { type: "error", error: { type: "authentication_error", message: "bad key" } })
    );
    const adapter = createAdapter({ fetch_impl: fetchImpl });

    const result = await adapter.invokeLive({ request: buildRequest(), prompt_text: TEST_PROMPT });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.failure_kind).toBe("provider_auth_failed");
      expect(result.failure.status).toBe("auth_failed");
      expect(result.failure.retryable).toBe(false);
    }
    expect(calls).toHaveLength(1);
  });

  it("maps 400 to provider_rejected_request and does not retry", async () => {
    const { fetchImpl, calls } = mockFetch(() =>
      jsonResponse(400, { type: "error", error: { type: "invalid_request_error", message: "bad body" } })
    );
    const adapter = createAdapter({ fetch_impl: fetchImpl });

    const result = await adapter.invokeLive({ request: buildRequest(), prompt_text: TEST_PROMPT });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.failure_kind).toBe("provider_rejected_request");
    }
    expect(calls).toHaveLength(1);
  });

  it("retries 429 up to the bounded retry count and reports rate_limited", async () => {
    const { fetchImpl, calls } = mockFetch(() =>
      jsonResponse(429, { type: "error", error: { type: "rate_limit_error", message: "slow down" } })
    );
    const adapter = createAdapter({ fetch_impl: fetchImpl });

    const result = await adapter.invokeLive({ request: buildRequest(), prompt_text: TEST_PROMPT });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.failure_kind).toBe("provider_rate_limited");
      expect(result.failure.status).toBe("rate_limited");
    }
    expect(calls).toHaveLength(2);
  });

  it("retries a 500 and succeeds on the second attempt", async () => {
    const { fetchImpl, calls } = mockFetch((_call, attempt) =>
      attempt === 1
        ? jsonResponse(500, { type: "error", error: { type: "api_error", message: "oops" } })
        : jsonResponse(200, successBody())
    );
    const adapter = createAdapter({ fetch_impl: fetchImpl });

    const result = await adapter.invokeLive({ request: buildRequest(), prompt_text: TEST_PROMPT });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.response.retry_summary.attempts).toBe(2);
    }
    expect(calls).toHaveLength(2);
  });

  it("normalizes thrown fetch errors as retryable network_failure", async () => {
    let attempts = 0;
    const fetchImpl = (async () => {
      attempts += 1;
      throw new Error("socket hang up");
    }) as typeof fetch;
    const adapter = createAdapter({ fetch_impl: fetchImpl });

    const result = await adapter.invokeLive({ request: buildRequest(), prompt_text: TEST_PROMPT });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.failure_kind).toBe("network_failure");
    }
    expect(attempts).toBe(2);
  });

  it("aborts on timeout and reports provider_timeout", async () => {
    const fetchImpl = ((_url: unknown, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => reject(new Error("aborted")));
      })) as unknown as typeof fetch;
    const config = testConfig({
      limits: { ...testConfig().limits, timeout_ms: 25, retry_count: 0 }
    });
    const adapter = createAdapter({ fetch_impl: fetchImpl }, {}, config);

    const result = await adapter.invokeLive({ request: buildRequest(config), prompt_text: TEST_PROMPT });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.failure_kind).toBe("provider_timeout");
      expect(result.failure.status).toBe("timeout");
    }
  });

  it("rejects a 200 body that is not JSON as provider_malformed_response", async () => {
    const fetchImpl = (async () => new Response("<html>not json</html>", { status: 200 })) as typeof fetch;
    const adapter = createAdapter({ fetch_impl: fetchImpl });

    const result = await adapter.invokeLive({ request: buildRequest(), prompt_text: TEST_PROMPT });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.failure_kind).toBe("provider_malformed_response");
    }
  });

  it("rejects an oversized response body before parsing", async () => {
    const config = testConfig({ max_response_bytes: 16 });
    const { fetchImpl } = mockFetch(() => jsonResponse(200, successBody()));
    const adapter = createAdapter({ fetch_impl: fetchImpl }, {}, config);

    const result = await adapter.invokeLive({ request: buildRequest(config), prompt_text: TEST_PROMPT });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.failure.failure_kind).toBe("provider_malformed_response");
      expect(result.failure.errors.some((e) => e.startsWith("response_too_large"))).toBe(true);
    }
  });
});

describe("anthropic live adapter redaction and trust", () => {
  it("never includes the API key in any serialized result, even when the provider echoes it", async () => {
    const { fetchImpl } = mockFetch(() =>
      jsonResponse(401, {
        type: "error",
        error: { type: "authentication_error", message: `invalid x-api-key: ${TEST_API_KEY}` }
      })
    );
    const adapter = createAdapter({ fetch_impl: fetchImpl });

    const result = await adapter.invokeLive({ request: buildRequest(), prompt_text: TEST_PROMPT });

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(TEST_API_KEY);
    expect(serialized).toContain("[redacted]");
  });

  it("never includes raw prompt or raw output text in a serialized success result", async () => {
    const { fetchImpl } = mockFetch(() => jsonResponse(200, successBody("a secret model reply")));
    const adapter = createAdapter({ fetch_impl: fetchImpl });

    const result = await adapter.invokeLive({ request: buildRequest(), prompt_text: TEST_PROMPT });

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(TEST_PROMPT);
    expect(serialized).not.toContain("a secret model reply");
    expect(serialized).toContain(computeSha256Digest("a secret model reply"));
  });

  it("caps trust at T1 and requires VRP evidence for T2 on every outcome", async () => {
    const { fetchImpl } = mockFetch(() => jsonResponse(200, successBody()));
    const adapter = createAdapter({ fetch_impl: fetchImpl });

    const success = await adapter.invokeLive({ request: buildRequest(), prompt_text: TEST_PROMPT });
    const refusal = await createAdapter({ fetch_impl: fetchImpl, credential_provider: null }).invokeLive({
      request: buildRequest(),
      prompt_text: TEST_PROMPT
    });

    for (const result of [success, refusal]) {
      const trust = result.ok ? result.response.trust_summary : result.failure.trust_summary;
      expect(trust.max_allowed_trust_tier).toBe("T1");
      expect(trust.requires_hollow_verification_for_t2).toBe(true);
      expect(trust.successful_response_promotes_trust).toBe(false);
      expect(trust.provider_output_is_deterministic_evidence).toBe(false);
    }
  });
});

describe("anthropic live adapter request builder and capabilities", () => {
  it("builds a contract-valid request with a computed digest and digest-only storage", () => {
    const request = buildRequest();

    expect(request.prompt_ref.prompt_digest).toBe(computeSha256Digest(TEST_PROMPT));
    expect(request.prompt_ref.raw_prompt_included).toBe(false);
    expect(request.prompt_ref.prompt_storage_kind).toBe("digest_only");
    expect(request.safety_profile.ledger_raw_prompt_allowed).toBe(false);
    expect(request.safety_profile.ledger_raw_output_allowed).toBe(false);
    expect(request.safety_profile.raw_transcript_storage_allowed).toBe(false);
    expect(request.route_mode).toBe("single_pass");
  });

  it("reports honest live capabilities with credential_auto_read false", () => {
    const adapter = createAdapter({ fetch_impl: mockFetch(() => jsonResponse(200, successBody())).fetchImpl });
    const caps = adapter.capabilities();

    expect(caps.supports_live_network).toBe(true);
    expect(caps.requires_api_key).toBe(true);
    expect(caps.credential_auto_read).toBe(false);
    expect(caps.imports_provider_sdk).toBe(false);
    expect(caps.stores_raw_prompt).toBe(false);
    expect(caps.stores_raw_output).toBe(false);
    expect(caps.writes_ledger_directly).toBe(false);
    expect(caps.max_output_trust_tier).toBe("T1");
  });

  it("keeps the adapter allowlist locked to the authorized live adapters", () => {
    expect(ALLOWLISTED_LIVE_ADAPTER_IDS).toEqual([
      "anthropic_live_adapter",
      "grok_live_adapter"
    ]);
    expect(DEFAULT_ANTHROPIC_LIVE_ADAPTER_CONFIG.adapter_id).toBe("anthropic_live_adapter");
    expect(DEFAULT_ANTHROPIC_LIVE_ADAPTER_CONFIG.model).toBe("claude-haiku-4-5");
  });
});

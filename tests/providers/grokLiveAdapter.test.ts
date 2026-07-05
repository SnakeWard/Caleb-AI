import { describe, expect, it } from "vitest";

import {
  ALLOWLISTED_LIVE_ADAPTER_IDS,
  buildGrokLiveAdapterRequest,
  computeSha256Digest,
  createGrokLiveAdapter,
  DEFAULT_GROK_LIVE_ADAPTER_CONFIG,
  evaluateOneProviderAdapterLivePrerequisites
} from "../../src/providers/index.js";
import type {
  GrokLiveAdapterConfig,
  GrokLiveAdapterDeps,
  GrokLiveAdapterGateEvidence
} from "../../src/providers/xaiLiveAdapterTypes.js";
import type { OneProviderAdapterLivePrerequisitesEvaluation } from "../../src/providers/livePrerequisitesTypes.js";

const TEST_API_KEY = "xai-test-key-do-not-leak-1234567890";
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
    created_at: "2026-07-05T00:00:00.000Z"
  });
}

function gates(overrides: Partial<GrokLiveAdapterGateEvidence> = {}): GrokLiveAdapterGateEvidence {
  return {
    prerequisites_evaluation: metPrerequisites(),
    kill_switch_open: true,
    network_permission_granted_by_caller: true,
    approved_by: "test_operator",
    ...overrides
  };
}

function testConfig(overrides: Partial<GrokLiveAdapterConfig> = {}): GrokLiveAdapterConfig {
  return {
    ...DEFAULT_GROK_LIVE_ADAPTER_CONFIG,
    limits: { ...DEFAULT_GROK_LIVE_ADAPTER_CONFIG.limits, timeout_ms: 500, retry_count: 1 },
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
    id: "chatcmpl_test_01",
    object: "chat.completion",
    created: 1739301120,
    model: "grok-3-mini",
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: outputText, refusal: null },
        finish_reason: "stop"
      }
    ],
    usage: { prompt_tokens: 12, completion_tokens: 3, total_tokens: 15 }
  };
}

function createAdapter(
  deps: Partial<GrokLiveAdapterDeps> & { fetch_impl?: typeof fetch },
  gateOverrides: Partial<GrokLiveAdapterGateEvidence> = {},
  config: GrokLiveAdapterConfig = testConfig()
) {
  return createGrokLiveAdapter(config, gates(gateOverrides), {
    credential_provider: () => TEST_API_KEY,
    ...deps
  });
}

function buildRequest(config: GrokLiveAdapterConfig = testConfig(), promptText = TEST_PROMPT) {
  return buildGrokLiveAdapterRequest({ prompt_text: promptText, config });
}

describe("grok live adapter gate chain", () => {
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
});

describe("grok live adapter wire protocol", () => {
  it("sends the correct endpoint, headers, and body without search_parameters", async () => {
    const { fetchImpl, calls } = mockFetch(() => jsonResponse(200, successBody()));
    const adapter = createAdapter({ fetch_impl: fetchImpl });

    await adapter.invokeLive({ request: buildRequest(), prompt_text: TEST_PROMPT });

    expect(calls).toHaveLength(1);
    const call = calls[0];
    expect(call?.url).toBe("https://api.x.ai/v1/chat/completions");
    const headers = call?.init.headers as Record<string, string>;
    expect(headers.authorization).toBe(`Bearer ${TEST_API_KEY}`);
    expect(headers["content-type"]).toBe("application/json");
    const body = JSON.parse(String(call?.init.body)) as Record<string, unknown>;
    expect(body.model).toBe("grok-3-mini");
    expect(body.max_tokens).toBe(testConfig().limits.max_output_tokens);
    expect(body.stream).toBe(false);
    expect(body.search_parameters).toBeUndefined();
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
      expect(result.response.provider_response_id).toBe("chatcmpl_test_01");
      expect(result.response.finish_reason).toBe("stop");
      expect(result.response.trust_summary.max_allowed_trust_tier).toBe("T1");
    }
  });

  it("digests message.content only and excludes reasoning_content", async () => {
    const body = {
      ...successBody("visible"),
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: "visible",
            reasoning_content: "hidden chain of thought",
            refusal: null
          },
          finish_reason: "stop"
        }
      ]
    };
    const { fetchImpl } = mockFetch(() => jsonResponse(200, body));
    const adapter = createAdapter({ fetch_impl: fetchImpl });

    const result = await adapter.invokeLive({ request: buildRequest(), prompt_text: TEST_PROMPT });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.response.output_ref.output_digest).toBe(computeSha256Digest("visible"));
      expect(result.response.warnings).toContain("provider_reasoning_content_excluded_from_digest");
    }
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("hidden chain of thought");
  });
});

describe("grok live adapter redaction and trust", () => {
  it("never includes the API key in any serialized result", async () => {
    const { fetchImpl } = mockFetch(() =>
      jsonResponse(401, {
        error: { type: "authentication_error", message: `invalid bearer token: ${TEST_API_KEY}` }
      })
    );
    const adapter = createAdapter({ fetch_impl: fetchImpl });

    const result = await adapter.invokeLive({ request: buildRequest(), prompt_text: TEST_PROMPT });

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain(TEST_API_KEY);
    expect(serialized).toContain("[redacted]");
  });

  it("reports honest live capabilities with credential_auto_read false", () => {
    const adapter = createAdapter({ fetch_impl: mockFetch(() => jsonResponse(200, successBody())).fetchImpl });
    const caps = adapter.capabilities();

    expect(caps.provider_id).toBe("xai");
    expect(caps.provider_kind).toBe("xai_compatible");
    expect(caps.credential_auto_read).toBe(false);
    expect(caps.max_output_trust_tier).toBe("T1");
  });

  it("includes grok_live_adapter on the shared allowlist", () => {
    expect(ALLOWLISTED_LIVE_ADAPTER_IDS).toContain("grok_live_adapter");
    expect(DEFAULT_GROK_LIVE_ADAPTER_CONFIG.adapter_id).toBe("grok_live_adapter");
  });
});
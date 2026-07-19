import { describe, expect, it } from "vitest";

import {
  buildAnthropicLiveAdapterRequest,
  buildGrokLiveAdapterRequest,
  createAnthropicLiveAdapter,
  createGrokLiveAdapter,
  DEFAULT_ANTHROPIC_LIVE_ADAPTER_CONFIG,
  DEFAULT_GROK_LIVE_ADAPTER_CONFIG,
  evaluateOneProviderAdapterLivePrerequisites
} from "../../src/providers/index.js";

const prereqs = evaluateOneProviderAdapterLivePrerequisites({
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
  vrp_evidence_required_for_T2: true
});
const gates = {
  prerequisites_evaluation: prereqs,
  kill_switch_open: true,
  network_permission_granted_by_caller: true,
  approved_by: "observer-test"
};

describe("Amendment A normalized-output observer", () => {
  it("Anthropic passes normalized text transiently, redacts it from results, and fails distinctly on observer refusal", async () => {
    const marker = "observer-anthropic-output-marker";
    const fetchImpl = (async () => new Response(JSON.stringify({
      id: "msg_observer",
      type: "message",
      role: "assistant",
      model: "claude-haiku-4-5",
      content: [{ type: "text", text: marker }],
      stop_reason: "end_turn",
      usage: { input_tokens: 4, output_tokens: 2 }
    }), { status: 200, headers: { "content-type": "application/json" } })) as typeof fetch;
    const config = {
      ...DEFAULT_ANTHROPIC_LIVE_ADAPTER_CONFIG,
      limits: { ...DEFAULT_ANTHROPIC_LIVE_ADAPTER_CONFIG.limits, retry_count: 0 }
    };
    const request = buildAnthropicLiveAdapterRequest({ prompt_text: "bounded", config });
    let observed = "";
    const success = await createAnthropicLiveAdapter(config, gates, {
      credential_provider: () => "test-only-key",
      fetch_impl: fetchImpl,
      normalized_output_observer: (text) => { observed = text; return { ok: true }; }
    }).invokeLive({ request, prompt_text: "bounded" });
    expect(success.ok).toBe(true);
    expect(observed).toBe(marker);
    expect(JSON.stringify(success)).not.toContain(marker);

    const failed = await createAnthropicLiveAdapter(config, gates, {
      credential_provider: () => "test-only-key",
      fetch_impl: fetchImpl,
      normalized_output_observer: () => ({ ok: false, failure_code: "observer_failure" })
    }).invokeLive({ request, prompt_text: "bounded" });
    expect(failed.ok).toBe(false);
    if (!failed.ok) {
      expect(failed.failure.failure_kind).toBe("observer_failure");
      expect(failed.failure.response_telemetry).toMatchObject({
        provider_response_id: "msg_observer",
        finish_reason: "end_turn",
        token_usage: {
          input_tokens: 4,
          output_tokens: 2,
          total_tokens: 6,
          usage_available: true
        }
      });
      expect(failed.failure.response_telemetry?.output_digest).toMatch(/^sha256:[a-f0-9]{64}$/);
      expect(failed.failure.response_telemetry?.timing.latency_ms).toBeGreaterThanOrEqual(0);
    }
    expect(JSON.stringify(failed)).not.toContain(marker);
  });

  it("Grok passes only content; reasoning_content and normalized prose stay out of the result", async () => {
    const marker = "observer-grok-output-marker";
    const reasoningMarker = "reasoning-content-must-never-cross";
    const fetchImpl = (async () => new Response(JSON.stringify({
      id: "chatcmpl_observer",
      object: "chat.completion",
      created: 1,
      model: "grok-3-mini",
      choices: [{
        index: 0,
        message: { role: "assistant", content: marker, reasoning_content: reasoningMarker },
        finish_reason: "stop"
      }],
      usage: { prompt_tokens: 4, completion_tokens: 2, total_tokens: 6 }
    }), { status: 200, headers: { "content-type": "application/json" } })) as typeof fetch;
    const config = {
      ...DEFAULT_GROK_LIVE_ADAPTER_CONFIG,
      limits: { ...DEFAULT_GROK_LIVE_ADAPTER_CONFIG.limits, retry_count: 0 }
    };
    const request = buildGrokLiveAdapterRequest({ prompt_text: "bounded", config });
    let observed = "";
    const result = await createGrokLiveAdapter(config, gates, {
      credential_provider: () => "test-only-key",
      fetch_impl: fetchImpl,
      normalized_output_observer: (text) => { observed = text; return { ok: true }; }
    }).invokeLive({ request, prompt_text: "bounded" });
    expect(result.ok).toBe(true);
    expect(observed).toBe(marker);
    expect(observed).not.toContain(reasoningMarker);
    expect(JSON.stringify(result)).not.toContain(marker);
    expect(JSON.stringify(result)).not.toContain(reasoningMarker);

    const failed = await createGrokLiveAdapter(config, gates, {
      credential_provider: () => "test-only-key",
      fetch_impl: fetchImpl,
      normalized_output_observer: () => ({ ok: false, failure_code: "observer_failure" })
    }).invokeLive({ request, prompt_text: "bounded" });
    expect(failed.ok).toBe(false);
    if (!failed.ok) {
      expect(failed.failure.response_telemetry).toMatchObject({
        provider_response_id: "chatcmpl_observer",
        finish_reason: "stop",
        token_usage: { input_tokens: 4, output_tokens: 2, total_tokens: 6 }
      });
    }
    expect(JSON.stringify(failed)).not.toContain(marker);
    expect(JSON.stringify(failed)).not.toContain(reasoningMarker);
  });
});

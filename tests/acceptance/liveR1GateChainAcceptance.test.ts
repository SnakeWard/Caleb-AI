import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

describe("LIVE-R1 acceptance lock", () => {
  it("locks Amendment A authorization, optional observer plumbing, and output-channel redaction", async () => {
    const [protocol, types, anthropic, grok] = await Promise.all([
      readFile("docs/protocols/PASS_PROTOCOL_LIVE_R1_R2.md", "utf8"),
      readFile("src/modelBoundary/types/liveAdapterTypes.ts", "utf8"),
      readFile("src/providers/anthropicLiveAdapter.ts", "utf8"),
      readFile("src/providers/xaiLiveAdapter.ts", "utf8")
    ]);
    expect(protocol).toContain("Amendment A — 2026-07-19");
    expect(protocol).toContain("A1 — Optional and bit-identical when absent");
    expect(types).toContain("LiveAdapterNormalizedOutputObserver");
    expect(anthropic).toContain("deps.normalized_output_observer");
    expect(grok).toContain("deps.normalized_output_observer");
    expect(anthropic).not.toContain("output_text:");
    expect(grok).not.toContain("output_text:");
    expect(grok).toContain("provider_reasoning_content_excluded_from_digest");
  });

  it("pins exactly the two existing egress sites and freezes transport request behavior", async () => {
    const [anthropic, grok, allHandlers] = await Promise.all([
      readFile("src/providers/anthropicLiveAdapter.ts", "utf8"),
      readFile("src/providers/xaiLiveAdapter.ts", "utf8"),
      readFile("src/cli/commandHandlers.ts", "utf8")
    ]);
    expect(anthropic.match(/await fetchImpl\(/g)).toHaveLength(1);
    expect(grok.match(/await fetchImpl\(/g)).toHaveLength(1);
    expect(anthropic).toContain("`${config.api_base_url}/v1/messages`");
    expect(grok).toContain("`${config.api_base_url}/v1/chat/completions`");
    expect(anthropic).toContain('"x-api-key": apiKey');
    expect(grok).toContain('authorization: `Bearer ${apiKey}`');
    expect(allHandlers.match(/process\.env\[credentialEnvVar\]/g)).toHaveLength(1);
  });

  it("locks the complete gate, fail-closed runtime, offline default, and confirm-gated command", async () => {
    const [gate, runtime, seam, parser, config] = await Promise.all([
      readFile("src/logicEngine/liveRotationGateEvidence.ts", "utf8"),
      readFile("src/logicEngine/liveRotationRuntimeAdapter.ts", "utf8"),
      readFile("src/logicEngine/rotationExecutionSeam.ts", "utf8"),
      readFile("src/cli/commandParser.ts", "utf8"),
      readFile("vitest.config.ts", "utf8")
    ]);
    for (const detector of [
      "explicit_opt_in", "explicit_live_request", "network_permission", "approved_by",
      "role_bindings", "run_budget", "max_total_invocations", "max_total_tokens", "max_spend_usd"
    ]) expect(gate).toContain(detector);
    expect(runtime).toContain("live_output_digest_mismatch");
    expect(runtime).toContain("live_observer_failure");
    expect(runtime).toContain("live_role_timeout_budget_exceeded");
    expect(seam).toContain("readLiveRuntimeState");
    expect(parser).toContain('command === "execute-live-rotation"');
    expect(parser).toContain("confirmation_required");
    expect(config).toContain("*.live.test.ts");
  });
});

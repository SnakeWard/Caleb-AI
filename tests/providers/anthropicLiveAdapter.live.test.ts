import { describe, expect, it } from "vitest";

import {
  buildAnthropicLiveAdapterRequest,
  computeSha256Digest,
  createAnthropicLiveAdapter,
  evaluateOneProviderAdapterLivePrerequisites,
  DEFAULT_ANTHROPIC_LIVE_ADAPTER_CONFIG
} from "../../src/providers/index.js";

// M2 live test scaffold — R28 live test plan rules:
// - Excluded from default runs by vitest config ("**/*.live.test.ts").
// - Additionally gated: runs only with CALEB_LIVE_TEST=1 AND ANTHROPIC_API_KEY set.
// - Reading these env vars here is the CALLER's explicit declaration; the
//   adapter itself never auto-reads the environment.
// - Cost bounds: exactly one live request, max_output_tokens 64, 30s timeout.
// - Digest mismatch is informational, never a failure (M1 correction (a)).
const LIVE_ENABLED = process.env.CALEB_LIVE_TEST === "1" && typeof process.env.ANTHROPIC_API_KEY === "string";

const EXPECTED_OUTPUT_DIGEST = computeSha256Digest("acknowledged");

describe.skipIf(!LIVE_ENABLED)("anthropic live adapter — LIVE (opt-in only, costs money)", () => {
  it("completes one bounded live call with digest-only records", async () => {
    const prerequisites = evaluateOneProviderAdapterLivePrerequisites({
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

    const promptText = "Reply with exactly one word: acknowledged";
    const request = buildAnthropicLiveAdapterRequest({
      prompt_text: promptText,
      config: DEFAULT_ANTHROPIC_LIVE_ADAPTER_CONFIG
    });

    const adapter = createAnthropicLiveAdapter(
      DEFAULT_ANTHROPIC_LIVE_ADAPTER_CONFIG,
      {
        prerequisites_evaluation: prerequisites,
        kill_switch_open: true,
        network_permission_granted_by_caller: true,
        approved_by: "live_test_operator"
      },
      { credential_provider: () => process.env.ANTHROPIC_API_KEY }
    );

    const result = await adapter.invokeLive({ request, prompt_text: promptText });

    // Protocol integrity is the acceptance bar. A structured failure (e.g.
    // rate limit) is still a valid protocol outcome; a throw is not.
    if (result.ok) {
      expect(result.response.output_ref.raw_output_included).toBe(false);
      expect(result.response.token_usage.output_tokens).toBeLessThanOrEqual(
        DEFAULT_ANTHROPIC_LIVE_ADAPTER_CONFIG.limits.max_output_tokens
      );
      expect(result.response.trust_summary.max_allowed_trust_tier).toBe("T1");
      expect(JSON.stringify(result)).not.toContain(promptText);
      const digestMatch = result.response.output_ref.output_digest === EXPECTED_OUTPUT_DIGEST;
      // Informational only — a mismatch is a documented finding, not a failure.
      console.log(
        `live call ok: finish_reason=${result.response.finish_reason} digest_match=${digestMatch} tokens=${result.response.token_usage.total_tokens}`
      );
    } else {
      console.log(`live call structured failure: ${result.failure.failure_kind}`);
      expect(result.failure.trust_summary.max_allowed_trust_tier).toBe("T1");
    }
  }, 60_000);
});

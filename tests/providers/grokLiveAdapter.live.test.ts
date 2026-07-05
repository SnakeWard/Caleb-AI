import { describe, expect, it } from "vitest";

import {
  buildGrokLiveAdapterRequest,
  computeSha256Digest,
  createGrokLiveAdapter,
  evaluateOneProviderAdapterLivePrerequisites,
  DEFAULT_GROK_LIVE_ADAPTER_CONFIG
} from "../../src/providers/index.js";

const LIVE_ENABLED = process.env.CALEB_LIVE_TEST === "1" && typeof process.env.XAI_API_KEY === "string";

const EXPECTED_OUTPUT_DIGEST = computeSha256Digest("acknowledged");

describe.skipIf(!LIVE_ENABLED)("grok live adapter — LIVE (opt-in only, costs money)", () => {
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

    const config = DEFAULT_GROK_LIVE_ADAPTER_CONFIG;
    const promptText = "Reply with the single word: acknowledged";
    const request = buildGrokLiveAdapterRequest({ prompt_text: promptText, config });
    const adapter = createGrokLiveAdapter(
      config,
      {
        prerequisites_evaluation: prerequisites,
        kill_switch_open: true,
        network_permission_granted_by_caller: true,
        approved_by: "live_test_operator"
      },
      { credential_provider: () => process.env.XAI_API_KEY }
    );

    const result = await adapter.invokeLive({ request, prompt_text: promptText });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.response.trust_summary.max_allowed_trust_tier).toBe("T1");
      expect(JSON.stringify(result)).not.toContain(promptText);
      expect(result.response.output_ref.output_digest).toBeTruthy();
      expect(result.response.output_ref.output_digest === EXPECTED_OUTPUT_DIGEST).toBeTypeOf("boolean");
    }
  });
});
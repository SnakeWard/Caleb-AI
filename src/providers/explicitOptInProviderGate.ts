import type {
  ExplicitOptInProviderGateInput,
  ExplicitOptInProviderGateResult
} from "./providerAdapterTypes.js";

const blockedGateOrder: ReadonlyArray<[keyof ExplicitOptInProviderGateInput, string]> = [
  ["explicit_opt_in", "explicit_opt_in_missing"],
  ["command_flag_present", "command_flag_missing"],
  ["provider_allowlisted", "provider_not_allowlisted"],
  ["human_approval_recorded", "human_approval_missing"],
  ["kill_switch_open", "kill_switch_closed"],
  ["redaction_ready", "redaction_not_ready"],
  ["safety_profile_ready", "safety_profile_not_ready"],
  ["cost_guard_ready", "cost_guard_not_ready"]
];

export function evaluateExplicitOptInProviderGate(input: ExplicitOptInProviderGateInput): ExplicitOptInProviderGateResult {
  for (const [field, reason] of blockedGateOrder) {
    if (input[field] !== true) {
      return {
        ok: false,
        status: field === "explicit_opt_in" ? "disabled" : "blocked",
        block_reason: reason,
        explicit_opt_in_from_input_data: input.explicit_opt_in === true,
        process_env_read: false,
        api_key_value_read: false,
        network_call_attempted: false,
        live_execution_attempted: false,
        notes: ["Provider gate evaluated supplied input data only."]
      };
    }
  }

  return {
    ok: true,
    status: "not_run",
    block_reason: "inert_skeleton_no_live_execution",
    explicit_opt_in_from_input_data: true,
    process_env_read: false,
    api_key_value_read: false,
    network_call_attempted: false,
    live_execution_attempted: false,
    notes: ["All gates supplied, but R31 skeleton remains inert and not run."]
  };
}

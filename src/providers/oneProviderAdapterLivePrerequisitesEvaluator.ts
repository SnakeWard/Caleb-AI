import type {
  OneProviderAdapterLivePrerequisitesEvaluation,
  OneProviderAdapterLivePrerequisitesInput
} from "./livePrerequisitesTypes.js";

const defaultCreatedAt = "2026-07-04T00:00:00.000Z";

interface RequiredTrueCheck {
  readonly value: boolean;
  readonly fieldName: string;
  readonly reasonCode: string;
}

function requiredTrueChecks(input: OneProviderAdapterLivePrerequisitesInput): readonly RequiredTrueCheck[] {
  return [
    { value: input.repo_root_confirmed, fieldName: "repo_root_confirmed", reasonCode: "repo_root_not_confirmed" },
    { value: input.explicit_opt_in, fieldName: "explicit_opt_in", reasonCode: "explicit_opt_in_missing" },
    { value: input.explicit_live_request, fieldName: "explicit_live_request", reasonCode: "explicit_live_request_missing" },
    {
      value: input.provider_adapter_allowlisted,
      fieldName: "provider_adapter_allowlisted",
      reasonCode: "provider_adapter_not_allowlisted"
    },
    {
      value: input.live_harness_allowlisted,
      fieldName: "live_harness_allowlisted",
      reasonCode: "live_harness_not_allowlisted"
    },
    {
      value: input.credential_source_declared_by_caller,
      fieldName: "credential_source_declared_by_caller",
      reasonCode: "credential_source_not_declared_by_caller"
    },
    {
      value: input.network_permission_granted_by_caller,
      fieldName: "network_permission_granted_by_caller",
      reasonCode: "network_permission_not_granted_by_caller"
    },
    {
      value: input.explicit_live_command_or_flag,
      fieldName: "explicit_live_command_or_flag",
      reasonCode: "explicit_live_command_or_flag_missing"
    },
    {
      value: input.dry_run_report_completed,
      fieldName: "dry_run_report_completed",
      reasonCode: "dry_run_report_not_completed"
    },
    {
      value: input.default_tests_non_live,
      fieldName: "default_tests_non_live",
      reasonCode: "default_tests_non_live_disabled"
    },
    {
      value: input.default_acceptance_non_live,
      fieldName: "default_acceptance_non_live",
      reasonCode: "default_acceptance_non_live_disabled"
    },
    {
      value: input.default_ci_non_live,
      fieldName: "default_ci_non_live",
      reasonCode: "default_ci_non_live_disabled"
    }
  ];
}

export function evaluateOneProviderAdapterLivePrerequisites(
  input: OneProviderAdapterLivePrerequisitesInput
): OneProviderAdapterLivePrerequisitesEvaluation {
  const missingPrerequisites: string[] = [];
  const blockingReasons: string[] = [];

  for (const check of requiredTrueChecks(input)) {
    if (check.value !== true) {
      missingPrerequisites.push(check.fieldName);
      blockingReasons.push(check.reasonCode);
    }
  }

  if (input.credential_auto_read === true) {
    missingPrerequisites.push("credential_auto_read");
    blockingReasons.push("credential_auto_read_enabled");
  }

  const prerequisitesMet = missingPrerequisites.length === 0;

  return {
    ok: false,
    evaluator_id: "one_provider_adapter_live_prerequisites_evaluator",
    evaluation_mode: "prerequisites_evaluation",
    prerequisites_met: prerequisitesMet,
    missing_prerequisites: missingPrerequisites,
    blocking_reasons: blockingReasons,
    live_execution_state: "not_run",
    network_attempted: false,
    provider_execution_attempted: false,
    provider_response_received: false,
    provider_output_present: false,
    provider_content_present: false,
    provider_output_trust_ceiling: "T1",
    vrp_evidence_required_for_T2: true,
    credential_auto_read_allowed: false,
    default_tests_non_live: input.default_tests_non_live,
    default_acceptance_non_live: input.default_acceptance_non_live,
    default_ci_non_live: input.default_ci_non_live,
    created_at: input.created_at ?? defaultCreatedAt,
    notes: [
      "Pure prerequisites evaluator only.",
      "Even when prerequisites_met is true, live_execution_state remains not_run because this evaluator never attempts live execution."
    ]
  };
}

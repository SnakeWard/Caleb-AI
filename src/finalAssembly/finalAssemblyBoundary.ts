import {
  validateFinalAssemblyPacket,
  validateFinalAssemblyRequest
} from "./finalAssemblyBoundaryValidator.js";
import type {
  FinalAssemblyBoundaryRunResult,
  FinalAssemblyIssue,
  FinalAssemblyPacket,
  FinalAssemblyRequest,
  FinalAssemblySourceRefs,
  FinalAssemblyStatus
} from "./types/finalAssemblyBoundaryTypes.js";

const requiredDisclaimer =
  "This response is assembled from mocked/model-shaped T1 output and is not verified final truth.";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function issue(code: string, path: string, message: string): FinalAssemblyIssue {
  return { code, path, message, severity: "error" };
}

function routeIssueSummary(routeResult: Record<string, unknown>): readonly string[] {
  const issues = routeResult["issues"];
  if (!Array.isArray(issues)) {
    return [];
  }

  return issues.map((entry) => isObject(entry) ? readString(entry["message"]) ?? readString(entry["code"]) ?? "Route issue." : "Route issue.");
}

function sourceRefs(request: FinalAssemblyRequest): FinalAssemblySourceRefs {
  const routeResult = request.route_result as Record<string, unknown>;
  const boundary = isObject(routeResult["boundary_result"]) ? routeResult["boundary_result"] : {};
  const storage = isObject(routeResult["storage_summary"]) ? routeResult["storage_summary"] : {};
  const invocation = isObject(routeResult["model_invocation_record"]) ? routeResult["model_invocation_record"] : {};

  return {
    route_result_ref: request.route_result_ref,
    request_id: readString(routeResult["request_id"]) ?? readString(boundary["request_id"]),
    response_id: readString(routeResult["response_id"]) ?? readString(boundary["response_id"]),
    raw_response_record_id: readString(storage["raw_response_record_id"]) ?? readString(boundary["raw_response_record_id"]),
    validated_response_record_id: readString(storage["validated_response_record_id"]) ?? readString(boundary["validated_response_record_id"]),
    model_invocation_record_id: readString(invocation["record_id"])
  };
}

function routeTrustIssues(routeResult: Record<string, unknown>): FinalAssemblyIssue[] {
  const issues: FinalAssemblyIssue[] = [];
  const trust = isObject(routeResult["trust_summary"]) ? routeResult["trust_summary"] : {};
  if (trust["max_model_output_trust_tier"] !== undefined && trust["max_model_output_trust_tier"] !== "T0" && trust["max_model_output_trust_tier"] !== "T1") {
    issues.push(issue("route_model_trust_above_t1", "$.route_result.trust_summary.max_model_output_trust_tier", "Route model output trust must remain T1 or lower."));
  }
  if (trust["route_completion_promotes_trust"] === true) {
    issues.push(issue("route_completion_promotes_trust", "$.route_result.trust_summary.route_completion_promotes_trust", "Route completion must not promote trust."));
  }
  if (trust["storage_promotes_trust"] === true) {
    issues.push(issue("storage_promotes_trust", "$.route_result.trust_summary.storage_promotes_trust", "Storage must not promote trust."));
  }
  if (trust["retrieval_promotes_trust"] === true) {
    issues.push(issue("retrieval_promotes_trust", "$.route_result.trust_summary.retrieval_promotes_trust", "Retrieval must not promote trust."));
  }
  if (trust["model_output_is_deterministic_evidence"] === true) {
    issues.push(issue("model_output_claims_hollow_evidence", "$.route_result.trust_summary.model_output_is_deterministic_evidence", "Model output must not be deterministic Hollow evidence."));
  }

  return issues;
}

function routeStatus(request: FinalAssemblyRequest): { readonly status: FinalAssemblyStatus; readonly issues: readonly FinalAssemblyIssue[] } {
  const routeResult = request.route_result as Record<string, unknown>;
  const trustIssues = routeTrustIssues(routeResult);
  if (trustIssues.length > 0) {
    return { status: "trust_violation", issues: trustIssues };
  }
  if (routeResult["ok"] !== true || routeResult["status"] !== "completed_t1" || routeResult["route_mode"] !== "single_pass") {
    return {
      status: "route_result_invalid",
      issues: [issue("route_result_invalid", "$.route_result", "Final assembly requires a completed_t1 single_pass route result.")]
    };
  }

  return { status: "assembled_unverified", issues: [] };
}

function userFacingText(request: FinalAssemblyRequest, refs: FinalAssemblySourceRefs, status: FinalAssemblyStatus): string {
  if (status !== "assembled_unverified") {
    return `${requiredDisclaimer} The route result could not be assembled for release.`;
  }

  const responseId = refs.response_id ?? "unknown_response";
  return `${requiredDisclaimer} Mock single_pass response packet assembled for ${request.requested_output_type} from response ${responseId}.`;
}

export function assembleSinglePassRouteResult(request: FinalAssemblyRequest): FinalAssemblyPacket {
  const refs = sourceRefs(request);
  const route = routeStatus(request);
  const blockingReasons = route.status === "assembled_unverified" ? [] : route.issues.map((entry) => entry.message);
  const routeResult = request.route_result as Record<string, unknown>;
  const routeTrust = isObject(routeResult["trust_summary"]) ? routeResult["trust_summary"] : {};
  const highestTier = routeTrust["max_model_output_trust_tier"] === "T0" ? "T0" : "T1";

  return {
    schema_version: request.schema_version,
    packet_id: `final_assembly.${request.assembly_id}`,
    task_id: request.task_id,
    run_id: request.run_id,
    assembly_id: request.assembly_id,
    route_mode: "single_pass",
    status: route.status,
    user_facing_text: userFacingText(request, refs, route.status),
    source_refs: refs,
    trust_summary: {
      highest_model_output_trust_tier: highestTier,
      final_packet_trust_tier: highestTier,
      final_answer_claims_verified: false,
      route_completion_promotes_trust: false,
      final_assembly_promotes_trust: false,
      storage_promotes_trust: false,
      retrieval_promotes_trust: false,
      model_output_is_deterministic_evidence: false,
      requires_hollow_verification_for_t2: true,
      notes: [
        "Final assembly is presentation only.",
        "Final assembly does not promote trust.",
        "Hollow verification is required before deterministic evidence can reach T2."
      ]
    },
    limitations: {
      has_verified_hollow_evidence: false,
      has_live_model_provider: false,
      has_real_ledger_write: false,
      has_persistent_storage: false,
      has_role_rotation: false,
      limitation_notes: [
        "No live model provider is present.",
        "No real Ledger write is performed.",
        "No persistent storage is used.",
        "No full role rotation runtime is active."
      ]
    },
    release_eligibility: {
      can_release_to_user: route.status === "assembled_unverified",
      release_type: route.status === "assembled_unverified" ? "mock_single_pass_unverified" : "blocked_unverified",
      blocking_reasons: blockingReasons,
      required_disclaimer: requiredDisclaimer,
      trust_label: "unverified T1-limited mock-route packet"
    },
    warnings: [
      requiredDisclaimer,
      ...routeIssueSummary(routeResult)
    ],
    issues: route.issues,
    created_at: request.created_at
  };
}

export function runFinalAssemblyBoundary(request: unknown): FinalAssemblyBoundaryRunResult {
  const requestValidation = validateFinalAssemblyRequest(request);
  if (!requestValidation.ok) {
    return { ok: false, errors: requestValidation.errors, packet: null };
  }

  const packet = assembleSinglePassRouteResult(request as FinalAssemblyRequest);
  const packetValidation = validateFinalAssemblyPacket(packet);
  if (!packetValidation.ok || packet.status !== "assembled_unverified") {
    return { ok: false, errors: [...packet.issues, ...packetValidation.errors], packet };
  }

  return { ok: true, errors: [], packet };
}

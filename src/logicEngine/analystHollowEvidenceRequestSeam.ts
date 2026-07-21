/**
 * Request-only hollow_evidence_request seam (RA-X-4 D7).
 *
 * The Analyst emits a request shape only. The orchestrator runs the Hollow and
 * gates the result through VRP. The Analyst never executes Hollows and never
 * receives ungated (T0) output.
 */

import { createHash } from "node:crypto";

import type { AnalystHollowEvidenceRequestPayload } from "../roles/types/analystSemanticPayload.js";
import { validateAnalystSemanticPayload } from "../roles/analystSemanticPayloadValidator.js";
import { createV1HollowRunner } from "../hollows/v1HollowCatalog.js";
import type { HollowRunner } from "../hollows/runner.js";
import { VerifiedReturnPath } from "../verification/index.js";
import type { HollowInvocationRecord } from "../types/invocation.js";

export interface GatedHollowEvidence {
  readonly hollow_id: string;
  readonly evidence_sought: string;
  readonly trust_tier: "T1" | "T2" | "T3" | "T4";
  readonly verification_status: "verified" | "rejected";
  readonly result_digest: string;
  /** Gated result payload only after VRP — never raw T0 transcript. */
  readonly gated_result: unknown;
  readonly analyst_held_ungated: false;
  readonly executed_by: "orchestrator";
}

export interface AnalystHollowEvidenceSeamFailure {
  readonly ok: false;
  readonly code: string;
  readonly message: string;
}

export interface AnalystHollowEvidenceSeamSuccess {
  readonly ok: true;
  readonly evidence: GatedHollowEvidence;
}

export interface AnalystHollowEvidenceSeamDeps {
  readonly runner?: HollowRunner;
  readonly vrp?: VerifiedReturnPath;
  readonly now?: () => Date;
  /** Test-only: forced ungated path must never be exposed to Analyst. */
  readonly forbid_ungated_delivery?: true;
}

/**
 * Orchestrator-owned fulfillment. Callers in Analyst role code MUST NOT invoke
 * HollowRunner directly for this request type.
 */
export async function fulfillAnalystHollowEvidenceRequest(
  request: unknown,
  deps: AnalystHollowEvidenceSeamDeps = {}
): Promise<AnalystHollowEvidenceSeamSuccess | AnalystHollowEvidenceSeamFailure> {
  const validation = validateAnalystSemanticPayload(request);
  if (!validation.ok) {
    return {
      ok: false,
      code: "invalid_request_shape",
      message: "hollow_evidence_request failed Analyst payload validation."
    };
  }
  const payload = request as AnalystHollowEvidenceRequestPayload;
  if (payload.output_type !== "hollow_evidence_request") {
    return {
      ok: false,
      code: "not_hollow_evidence_request",
      message: "Seam only accepts hollow_evidence_request output_type."
    };
  }

  // Structural: request must not carry result fields (already enforced by validator).
  for (const key of Object.keys(payload as object)) {
    if (
      key === "result" ||
      key === "output" ||
      key === "execution_result" ||
      key === "raw_output"
    ) {
      return {
        ok: false,
        code: "request_carries_result",
        message: "Request-only doctrine violated: request carries result fields."
      };
    }
  }

  const runner = deps.runner ?? createV1HollowRunner();
  const vrp = deps.vrp ?? new VerifiedReturnPath();
  const now = deps.now ?? (() => new Date());

  let invocation: HollowInvocationRecord;
  try {
    invocation = await runner.run({
      hollow_id: payload.hollow_id,
      task_id: `task_analyst_request_${payload.hollow_id}`,
      run_id: `run_analyst_request_${now().getTime()}`,
      trace_id: `trace_analyst_request`,
      caller: "orchestrator.analyst_hollow_evidence_seam",
      requested_by: "orchestrator",
      input_payload: {
        text: payload.evidence_sought
      },
      permissions: ["none"]
    });
  } catch (error) {
    return {
      ok: false,
      code: "hollow_execution_failed",
      message: error instanceof Error ? error.message : "Hollow execution failed."
    };
  }

  // Gate between Hollow and Analyst: VRP verifies before delivery.
  const verified = vrp.verifyInvocation(invocation);
  if (verified.decision !== "accepted" || verified.trust_tier === "T0") {
    return {
      ok: false,
      code: "vrp_rejected_or_ungated",
      message: "VRP did not accept Hollow output above T0; Analyst receives nothing."
    };
  }

  const gatedPayload = invocation.result ?? null;
  const resultDigest = `sha256:${createHash("sha256")
    .update(JSON.stringify(gatedPayload), "utf8")
    .digest("hex")}`;

  return {
    ok: true,
    evidence: {
      hollow_id: payload.hollow_id,
      evidence_sought: payload.evidence_sought,
      trust_tier: verified.trust_tier as GatedHollowEvidence["trust_tier"],
      verification_status: "verified",
      result_digest: resultDigest,
      gated_result: gatedPayload,
      analyst_held_ungated: false,
      executed_by: "orchestrator"
    }
  };
}

/** Static proof helper: Analyst module paths must not import HollowRunner for execution. */
export const ANALYST_MUST_NOT_IMPORT = [
  "HollowRunner",
  "createV1HollowRunner",
  "dispatchHollow"
] as const;

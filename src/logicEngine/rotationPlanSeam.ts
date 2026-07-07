import { createHash, randomUUID } from "node:crypto";

import { validateRuntimeRotationPlan } from "../roles/runtimeRotationPlanValidator.js";
import {
  VALID_RUNTIME_ROTATION_PLAN_AUTHORS,
  type RuntimeRotationPlan
} from "../roles/types/runtimeRotationPlan.js";
import type { ContractValidatedTaskFrameRouteInput } from "./types/routeInput.js";

export const ROTATION_PLAN_SEAM_SCHEMA_VERSION = "1.0.0" as const;

export type RotationPlanSeamClassification =
  | "valid_rotation_plan"
  | "invalid_schema"
  | "rejected_authorship"
  | "rejected_reference_format"
  | "unknown";

export interface RotationPlanSeamInput {
  readonly carrier: ContractValidatedTaskFrameRouteInput;
  readonly rotation_plan: unknown;
  readonly decided_at?: string;
}

export interface RotationPlanRouteDecisionArtifact {
  readonly artifact_id: string;
  readonly schema_version: typeof ROTATION_PLAN_SEAM_SCHEMA_VERSION;
  readonly classification: RotationPlanSeamClassification;
  readonly plan_digest: string;
  readonly plan_ref: string | null;
  readonly carrier_record_id: string;
  readonly carrier_record_kind: "contract_validated_task_frame";
  readonly structural_inputs: readonly string[];
  readonly trust_tier: "T2";
  readonly verification_status: "verified";
  readonly created_at: string;
  readonly ledger_refs: readonly string[];
}

export interface RotationPlanSeamResult {
  readonly artifact: RotationPlanRouteDecisionArtifact;
}

const RRP_ID_FORMAT = /^rrp_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const COUNTER_ERA_ID_PATTERN = /^(rrp|task|run)_[0-9a-f]{32}$/;

export function classifyRotationPlanAtSeam(input: RotationPlanSeamInput): RotationPlanSeamResult {
  const decided_at = input.decided_at ?? new Date().toISOString();
  const structural_inputs: string[] = [];

  if (input.carrier.record_kind !== "contract_validated_task_frame") {
    structural_inputs.push("carrier_record_kind_mismatch");
    return {
      artifact: buildArtifact({
        classification: "unknown",
        plan_digest: digestValue(input.rotation_plan),
        plan_ref: null,
        carrier_record_id: input.carrier.record_id,
        structural_inputs,
        decided_at
      })
    };
  }

  if (!isObject(input.rotation_plan)) {
    structural_inputs.push("rotation_plan_not_object");
    return {
      artifact: buildArtifact({
        classification: "unknown",
        plan_digest: digestValue(input.rotation_plan),
        plan_ref: null,
        carrier_record_id: input.carrier.record_id,
        structural_inputs,
        decided_at
      })
    };
  }

  const planRecord = input.rotation_plan as Record<string, unknown>;
  const planRef =
    typeof planRecord["runtime_rotation_plan_id"] === "string"
      ? planRecord["runtime_rotation_plan_id"]
      : null;

  if (hasCounterEraId(planRecord)) {
    structural_inputs.push("counter_era_id_format");
    return {
      artifact: buildArtifact({
        classification: "rejected_reference_format",
        plan_digest: digestValue(planRecord),
        plan_ref: planRef,
        carrier_record_id: input.carrier.record_id,
        structural_inputs,
        decided_at
      })
    };
  }

  const validation = validateRuntimeRotationPlan(input.rotation_plan);
  if (!validation.ok) {
    const codes = validation.errors.map((error) => error.code);
    structural_inputs.push(...codes);

    if (codes.includes("RRP_MODEL_AUTHORED_FORBIDDEN")) {
      return {
        artifact: buildArtifact({
          classification: "rejected_authorship",
          plan_digest: digestValue(planRecord),
          plan_ref: planRef,
          carrier_record_id: input.carrier.record_id,
          structural_inputs,
          decided_at
        })
      };
    }

    const schemaCodes = new Set([
      "RRP_MISSING_FIELD",
      "RRP_UNKNOWN_FIELD",
      "RRP_INVALID_SCHEMA_VERSION",
      "RRP_INVALID_ROOT",
      "RRP_UNKNOWN_ROUTE_MODE",
      "RRP_INVALID_ROLES_REQUIRED",
      "RRP_INVALID_GATES_REQUIRED",
      "RRP_INVALID_MAX_CYCLES",
      "RRP_INVALID_STOP_CRITERIA",
      "RRP_INVALID_SIDE_EFFECT_POLICY",
      "RRP_INVALID_CODE_MUTATION_POLICY",
      "RRP_INVALID_LEDGER_POLICY",
      "RRP_INVALID_CREATED_AT",
      "RRP_INVALID_AUTHOR"
    ]);

    if (codes.some((code) => schemaCodes.has(code))) {
      return {
        artifact: buildArtifact({
          classification: "invalid_schema",
          plan_digest: digestValue(planRecord),
          plan_ref: planRef,
          carrier_record_id: input.carrier.record_id,
          structural_inputs,
          decided_at
        })
      };
    }

    if (codes.some((code) => code === "RRP_INVALID_ID_FORMAT")) {
      return {
        artifact: buildArtifact({
          classification: "rejected_reference_format",
          plan_digest: digestValue(planRecord),
          plan_ref: planRef,
          carrier_record_id: input.carrier.record_id,
          structural_inputs,
          decided_at
        })
      };
    }

    return {
      artifact: buildArtifact({
        classification: "invalid_schema",
        plan_digest: digestValue(planRecord),
        plan_ref: planRef,
        carrier_record_id: input.carrier.record_id,
        structural_inputs,
        decided_at
      })
    };
  }

  const plan = input.rotation_plan as unknown as RuntimeRotationPlan;
  const authoredBy = planRecord["authored_by"];
  if (
    authoredBy === "model" ||
    typeof authoredBy !== "string" ||
    !VALID_RUNTIME_ROTATION_PLAN_AUTHORS.includes(authoredBy as (typeof VALID_RUNTIME_ROTATION_PLAN_AUTHORS)[number])
  ) {
    structural_inputs.push("seam_authorship_recheck_failed");
    return {
      artifact: buildArtifact({
        classification: "rejected_authorship",
        plan_digest: digestValue(plan),
        plan_ref: plan.runtime_rotation_plan_id,
        carrier_record_id: input.carrier.record_id,
        structural_inputs,
        decided_at
      })
    };
  }

  if (!input.carrier.lineage_refs.includes(plan.runtime_rotation_plan_id)) {
    structural_inputs.push("carrier_lineage_missing_plan_ref");
    return {
      artifact: buildArtifact({
        classification: "rejected_reference_format",
        plan_digest: digestValue(plan),
        plan_ref: plan.runtime_rotation_plan_id,
        carrier_record_id: input.carrier.record_id,
        structural_inputs,
        decided_at
      })
    };
  }

  if (!RRP_ID_FORMAT.test(plan.runtime_rotation_plan_id)) {
    structural_inputs.push("plan_ref_format_invalid");
    return {
      artifact: buildArtifact({
        classification: "rejected_reference_format",
        plan_digest: digestValue(plan),
        plan_ref: plan.runtime_rotation_plan_id,
        carrier_record_id: input.carrier.record_id,
        structural_inputs,
        decided_at
      })
    };
  }

  structural_inputs.push("valid_rotation_plan_structural_checks_passed");
  return {
    artifact: buildArtifact({
      classification: "valid_rotation_plan",
      plan_digest: digestValue(plan),
      plan_ref: plan.runtime_rotation_plan_id,
      carrier_record_id: input.carrier.record_id,
      structural_inputs,
      decided_at
    })
  };
}

function buildArtifact(options: {
  classification: RotationPlanSeamClassification;
  plan_digest: string;
  plan_ref: string | null;
  carrier_record_id: string;
  structural_inputs: readonly string[];
  decided_at: string;
}): RotationPlanRouteDecisionArtifact {
  return {
    artifact_id: `rpd_${randomUUID()}`,
    schema_version: ROTATION_PLAN_SEAM_SCHEMA_VERSION,
    classification: options.classification,
    plan_digest: options.plan_digest,
    plan_ref: options.plan_ref,
    carrier_record_id: options.carrier_record_id,
    carrier_record_kind: "contract_validated_task_frame",
    structural_inputs: options.structural_inputs,
    trust_tier: "T2",
    verification_status: "verified",
    created_at: options.decided_at,
    ledger_refs: []
  };
}

function hasCounterEraId(plan: Record<string, unknown>): boolean {
  for (const field of ["runtime_rotation_plan_id", "task_id", "run_id"] as const) {
    const value = plan[field];
    if (typeof value === "string" && COUNTER_ERA_ID_PATTERN.test(value)) {
      return true;
    }
  }
  return false;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function digestValue(value: unknown): string {
  return `sha256:${createHash("sha256").update(stableStringify(value)).digest("hex")}`;
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (isObject(value)) {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}
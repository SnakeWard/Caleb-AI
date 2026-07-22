/**
 * LIVE-D1-PREP — production live dynamic-selection seam.
 *
 * Optional decision-facing record on a live fixture activates:
 *   five-check verifier → classifier (rax4.1.0) → row-1 lock → RRP verify
 *   → route_classification_decision ledger line (before bridge/execution).
 *
 * Absence of the record leaves the fixed live path unchanged.
 */

import { createHash } from "node:crypto";

import type { LedgerEntry } from "../types/ledger.js";
import type { JsonObject } from "../types/common.js";
import {
  selectRouteFromRouteInputs,
  validateRouteInputRecord
} from "./routeInputGate.js";
import { ROUTE_CLASSIFICATION_TABLE_VERSION } from "./routeClassificationTable.js";
import type { ContractValidatedTaskFrameRouteInput } from "./types/routeInput.js";
import type { LineageResolvedDecisionFacingRecord } from "./types/lineageResolvedDecisionFacingRecord.js";
import type { RuntimeRotationPlanRole, RuntimeRotationRouteMode } from "../roles/types/runtimeRotationPlan.js";

export const ROUTE_CLASSIFICATION_DECISION_ACTIVITY = "route_classification_decision" as const;

export const LIVE_D1_AUTHORIZED_ROLE_SEQUENCE = ["planner", "critic"] as const;

/** Closed sequence → live RRP mapping (D3). Never use RouteDecision.route_mode. */
export const LIVE_ROLE_SEQUENCE_TO_ROUTE_MODE = {
  "planner,critic": {
    route_mode: "planner_critic" as const,
    roles_required: ["planner", "critic"] as const satisfies readonly RuntimeRotationPlanRole[],
    max_cycles: 1
  }
} as const;

export type LiveDynamicSelectionRefusalCode =
  | "live_dynamic_decision_record_invalid"
  | "live_dynamic_classifier_refused"
  | "live_dynamic_selection_path_not_classifier"
  | "live_dynamic_table_version_mismatch"
  | "live_dynamic_row1_lock_failed"
  | "live_dynamic_sequence_unmapped"
  | "live_dynamic_rrp_contradicts_classifier"
  | "live_dynamic_ledger_write_failed";

export interface LiveRotationFixtureFile {
  readonly carrier: ContractValidatedTaskFrameRouteInput;
  readonly runtime_rotation_plan: unknown;
  readonly adapter_bindings: readonly {
    readonly role_id: "planner" | "critic";
    readonly adapter_id: string;
    readonly adapter_kind: "live";
  }[];
  /** Optional — presence activates dynamic path (D1). */
  readonly lineage_resolved_decision_facing_record?: unknown;
}

export interface LiveDynamicClassificationFeatures {
  readonly stakes: string;
  readonly ambiguity: string;
  readonly evidence_need: string;
}

export interface LiveDynamicSelectionSuccess {
  readonly ok: true;
  readonly path: "fixed" | "classifier";
  readonly selection_path: "classifier" | null;
  readonly table_version: string | null;
  readonly role_sequence: readonly string[] | null;
  readonly features: LiveDynamicClassificationFeatures | null;
  readonly decision_record_id: string | null;
  readonly decision_record_digest: string | null;
  readonly classification_ledger_entry: LedgerEntry | null;
  readonly runtime_rotation_plan: unknown;
}

export interface LiveDynamicSelectionFailure {
  readonly ok: false;
  readonly code: LiveDynamicSelectionRefusalCode;
  readonly message: string;
  readonly classification_ledger_entry: LedgerEntry | null;
}

export type LiveDynamicSelectionResult = LiveDynamicSelectionSuccess | LiveDynamicSelectionFailure;

export interface ResolveLiveDynamicSelectionInput {
  readonly fixture: LiveRotationFixtureFile;
  readonly append_ledger_entry: (entry: LedgerEntry) => boolean | Promise<boolean>;
  readonly now?: () => string;
  readonly ledger_id?: string;
}

/**
 * Resolve fixed vs dynamic path. Dynamic path ledgers selection before return.
 * Fixed path returns immediately with no classification entry.
 */
export async function resolveLiveDynamicSelection(
  input: ResolveLiveDynamicSelectionInput
): Promise<LiveDynamicSelectionResult> {
  const decisionRaw = input.fixture.lineage_resolved_decision_facing_record;
  if (decisionRaw === undefined) {
    return {
      ok: true,
      path: "fixed",
      selection_path: null,
      table_version: null,
      role_sequence: null,
      features: null,
      decision_record_id: null,
      decision_record_digest: null,
      classification_ledger_entry: null,
      runtime_rotation_plan: input.fixture.runtime_rotation_plan
    };
  }

  const now = input.now ?? (() => new Date().toISOString());
  const validated = validateRouteInputRecord(decisionRaw);
  if (!validated.ok) {
    const entry = await appendRefusalEntry(input, {
      code: "live_dynamic_decision_record_invalid",
      message: validated.issues.map((i) => i.message).join("; ") || "Decision-facing record failed L1 verification.",
      now: now(),
      decisionRaw
    });
    return {
      ok: false,
      code: "live_dynamic_decision_record_invalid",
      message: "Decision-facing record failed five-check verifier / L1 validation.",
      classification_ledger_entry: entry
    };
  }

  const selection = selectRouteFromRouteInputs([decisionRaw, input.fixture.carrier]);
  if (!selection.ok || selection.decision === null) {
    const entry = await appendRefusalEntry(input, {
      code: "live_dynamic_classifier_refused",
      message: selection.issues.map((i) => i.message).join("; ") || "Classifier refused.",
      now: now(),
      decisionRaw
    });
    return {
      ok: false,
      code: "live_dynamic_classifier_refused",
      message: "Classifier path refused the decision-facing record.",
      classification_ledger_entry: entry
    };
  }

  const decision = selection.decision;
  if (decision.selection_path !== "classifier") {
    return refuse(input, "live_dynamic_selection_path_not_classifier", "selection_path must be classifier.", now(), decisionRaw);
  }
  if (decision.table_version !== ROUTE_CLASSIFICATION_TABLE_VERSION) {
    return refuse(input, "live_dynamic_table_version_mismatch", `table_version must be ${ROUTE_CLASSIFICATION_TABLE_VERSION}.`, now(), decisionRaw);
  }

  const roleSequence = [...(decision.role_sequence ?? [])];
  if (!sequencesEqual(roleSequence, LIVE_D1_AUTHORIZED_ROLE_SEQUENCE)) {
    return refuse(
      input,
      "live_dynamic_row1_lock_failed",
      `LIVE-D1 authorizes only role_sequence [planner, critic]; got [${roleSequence.join(", ")}].`,
      now(),
      decisionRaw
    );
  }

  const mapped = mapRoleSequenceToLiveRoute(roleSequence);
  if (mapped === null) {
    return refuse(input, "live_dynamic_sequence_unmapped", "role_sequence has no live route_mode mapping.", now(), decisionRaw);
  }

  const rrpCheck = verifyFixtureRrpAgainstMapping(input.fixture.runtime_rotation_plan, mapped);
  if (!rrpCheck.ok) {
    return refuse(input, "live_dynamic_rrp_contradicts_classifier", rrpCheck.message, now(), decisionRaw);
  }

  const record = decisionRaw as LineageResolvedDecisionFacingRecord;
  const features: LiveDynamicClassificationFeatures = {
    stakes: decision.classification_features?.stakes ?? "unknown",
    ambiguity: decision.classification_features?.ambiguity ?? "unknown",
    evidence_need: decision.classification_features?.evidence_need ?? "unknown"
  };
  const decisionDigest = digestJson(decisionRaw);
  const planObj = asRecord(input.fixture.runtime_rotation_plan);
  const classificationEntry = buildClassificationLedgerEntry({
    ledger_id: input.ledger_id ?? `route_class_${createShortId()}`,
    timestamp: now(),
    task_id: typeof planObj?.["task_id"] === "string" ? planObj["task_id"] : record.record_id,
    run_id: typeof planObj?.["run_id"] === "string" ? planObj["run_id"] : record.record_id,
    trace_id:
      typeof asRecord(input.fixture.carrier.task_frame)?.["trace_id"] === "string"
        ? String(asRecord(input.fixture.carrier.task_frame)?.["trace_id"])
        : `trace_class_${record.record_id}`,
    selection_path: "classifier",
    table_version: decision.table_version ?? ROUTE_CLASSIFICATION_TABLE_VERSION,
    role_sequence: roleSequence,
    features,
    decision_record_id: record.record_id,
    decision_record_digest: decisionDigest,
    lineage_refs: [...record.lineage_refs],
    source_runtime_rotation_plan_id:
      typeof planObj?.["runtime_rotation_plan_id"] === "string"
        ? planObj["runtime_rotation_plan_id"]
        : null,
    status: "completed"
  });

  const written = await input.append_ledger_entry(classificationEntry);
  if (!written) {
    return {
      ok: false,
      code: "live_dynamic_ledger_write_failed",
      message: "Failed to append route_classification_decision before execution.",
      classification_ledger_entry: null
    };
  }

  return {
    ok: true,
    path: "classifier",
    selection_path: "classifier",
    table_version: decision.table_version ?? ROUTE_CLASSIFICATION_TABLE_VERSION,
    role_sequence: roleSequence,
    features,
    decision_record_id: record.record_id,
    decision_record_digest: decisionDigest,
    classification_ledger_entry: classificationEntry,
    runtime_rotation_plan: input.fixture.runtime_rotation_plan
  };
}

export function mapRoleSequenceToLiveRoute(
  roleSequence: readonly string[]
): {
  readonly route_mode: RuntimeRotationRouteMode;
  readonly roles_required: readonly RuntimeRotationPlanRole[];
  readonly max_cycles: number;
} | null {
  const key = roleSequence.join(",");
  const mapped = LIVE_ROLE_SEQUENCE_TO_ROUTE_MODE[key as keyof typeof LIVE_ROLE_SEQUENCE_TO_ROUTE_MODE];
  if (mapped === undefined) {
    return null;
  }
  return {
    route_mode: mapped.route_mode,
    roles_required: mapped.roles_required,
    max_cycles: mapped.max_cycles
  };
}

function verifyFixtureRrpAgainstMapping(
  runtimeRotationPlan: unknown,
  mapped: {
    readonly route_mode: RuntimeRotationRouteMode;
    readonly roles_required: readonly RuntimeRotationPlanRole[];
    readonly max_cycles: number;
  }
): { readonly ok: true } | { readonly ok: false; readonly message: string } {
  const plan = asRecord(runtimeRotationPlan);
  if (plan === null) {
    return { ok: false, message: "Fixture runtime_rotation_plan is not an object." };
  }
  if (plan["route_mode"] !== mapped.route_mode) {
    return {
      ok: false,
      message: `Fixture route_mode '${String(plan["route_mode"])}' contradicts classifier mapping '${mapped.route_mode}'.`
    };
  }
  if (plan["max_cycles"] !== mapped.max_cycles) {
    return {
      ok: false,
      message: `Fixture max_cycles '${String(plan["max_cycles"])}' contradicts classifier mapping '${mapped.max_cycles}'.`
    };
  }
  const roles = plan["roles_required"];
  if (!Array.isArray(roles) || !sequencesEqual(roles.map(String), mapped.roles_required)) {
    return {
      ok: false,
      message: "Fixture roles_required contradicts classifier role_sequence mapping."
    };
  }
  return { ok: true };
}

function buildClassificationLedgerEntry(input: {
  readonly ledger_id: string;
  readonly timestamp: string;
  readonly task_id: string;
  readonly run_id: string;
  readonly trace_id: string;
  readonly selection_path: "classifier";
  readonly table_version: string;
  readonly role_sequence: readonly string[];
  readonly features: LiveDynamicClassificationFeatures;
  readonly decision_record_id: string;
  readonly decision_record_digest: string;
  readonly lineage_refs: readonly string[];
  readonly source_runtime_rotation_plan_id: string | null;
  readonly status: "completed" | "rejected";
  readonly refusal_code?: string;
  readonly refusal_message?: string;
}): LedgerEntry {
  const result: JsonObject = {
    selection_path: input.selection_path,
    table_version: input.table_version,
    role_sequence: [...input.role_sequence],
    features: {
      stakes: input.features.stakes,
      ambiguity: input.features.ambiguity,
      evidence_need: input.features.evidence_need
    },
    decision_record_id: input.decision_record_id,
    decision_record_digest: input.decision_record_digest,
    source_runtime_rotation_plan_id: input.source_runtime_rotation_plan_id,
    ...(input.refusal_code === undefined
      ? {}
      : { refusal_code: input.refusal_code, refusal_message: input.refusal_message ?? null })
  };
  return {
    ledger_id: input.ledger_id,
    schema_version: "1.0.0",
    timestamp: input.timestamp,
    task_id: input.task_id,
    run_id: input.run_id,
    trace_id: input.trace_id,
    actor_type: "orchestration_core",
    actor_id: "logic_engine.live_dynamic_selection",
    actor_version: "1.0.0",
    activity: ROUTE_CLASSIFICATION_DECISION_ACTIVITY,
    status: input.status,
    result,
    warnings: [],
    errors:
      input.status === "rejected" && input.refusal_code !== undefined
        ? [
            {
              error_id: input.refusal_code,
              message: input.refusal_message ?? input.refusal_code,
              severity: "error",
              retryable: false
            }
          ]
        : [],
    artifact_hashes: [],
    provenance: {
      lineage_refs: [...input.lineage_refs],
      decision_record_id: input.decision_record_id
    },
    retryable: false,
    verification_status: "verified",
    trust_tier: "T2",
    parent_refs: [input.decision_record_id, ...input.lineage_refs],
    artifact_refs: []
  };
}

async function refuse(
  input: ResolveLiveDynamicSelectionInput,
  code: LiveDynamicSelectionRefusalCode,
  message: string,
  timestamp: string,
  decisionRaw: unknown
): Promise<LiveDynamicSelectionFailure> {
  const entry = await appendRefusalEntry(input, { code, message, now: timestamp, decisionRaw });
  return { ok: false, code, message, classification_ledger_entry: entry };
}

async function appendRefusalEntry(
  input: ResolveLiveDynamicSelectionInput,
  args: {
    readonly code: string;
    readonly message: string;
    readonly now: string;
    readonly decisionRaw: unknown;
  }
): Promise<LedgerEntry | null> {
  const record = asRecord(args.decisionRaw);
  const planObj = asRecord(input.fixture.runtime_rotation_plan);
  const decisionId =
    typeof record?.["record_id"] === "string" ? record["record_id"] : "unknown_decision_record";
  const lineageRefs = Array.isArray(record?.["lineage_refs"])
    ? record["lineage_refs"].filter((v): v is string => typeof v === "string")
    : [];
  const entry = buildClassificationLedgerEntry({
    ledger_id: input.ledger_id ?? `route_class_refuse_${createShortId()}`,
    timestamp: args.now,
    task_id: typeof planObj?.["task_id"] === "string" ? planObj["task_id"] : decisionId,
    run_id: typeof planObj?.["run_id"] === "string" ? planObj["run_id"] : decisionId,
    trace_id: `trace_class_refuse_${decisionId}`,
    selection_path: "classifier",
    table_version: ROUTE_CLASSIFICATION_TABLE_VERSION,
    role_sequence: [],
    features: { stakes: "unknown", ambiguity: "unknown", evidence_need: "unknown" },
    decision_record_id: decisionId,
    decision_record_digest: digestJson(args.decisionRaw),
    lineage_refs: lineageRefs,
    source_runtime_rotation_plan_id:
      typeof planObj?.["runtime_rotation_plan_id"] === "string"
        ? planObj["runtime_rotation_plan_id"]
        : null,
    status: "rejected",
    refusal_code: args.code,
    refusal_message: args.message
  });
  const written = await input.append_ledger_entry(entry);
  return written ? entry : null;
}

function sequencesEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((value, index) => value === b[index]);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function digestJson(value: unknown): string {
  return `sha256:${createHash("sha256").update(stableStringify(value)).digest("hex")}`;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry)).join(",")}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((key) => `${JSON.stringify(key)}:${stableStringify(obj[key])}`).join(",")}}`;
}

function createShortId(): string {
  return createHash("sha256").update(`${Date.now()}:${Math.random()}`).digest("hex").slice(0, 12);
}

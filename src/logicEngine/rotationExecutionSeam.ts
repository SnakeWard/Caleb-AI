import { createHash } from "node:crypto";

import { createLedgerId } from "../ledger/ledgerEntryFactory.js";
import { validateLedgerEntry } from "../ledger/ledgerValidation.js";
import type { ContentAddressedRawOutputStore } from "../rawOutput/contentAddressedRawOutputStore.js";
import { executeStaticRotation } from "../roleRuntime/roleRuntimeExecutor.js";
import { validateStaticRotationPlan } from "../roleRuntime/rotationPlanValidator.js";
import type { RoleRuntimeAdapter, RoleRuntimeContextRef } from "../roleRuntime/types/roleRuntimeAdapter.js";
import type {
  RoleRuntimeExecutionResult,
  RoleRuntimeFailureCode,
  RoleRuntimeInvocationRecord
} from "../roleRuntime/types/roleRuntimeTypes.js";
import type { JsonObject, JsonValue, Sha256Digest } from "../types/common.js";
import type { CalebError } from "../types/invocation.js";
import type { LedgerEntry } from "../types/ledger.js";
import type { BridgedExecutablePlan } from "./rotationPlanBridge.js";

export const ROTATION_EXECUTION_SEAM_SCHEMA_VERSION = "1.0.0" as const;

export type RotationExecutionSeamRefusalCode =
  | "seam_rejected_human_confirmation_required"
  | "seam_rejected_unbridged_plan"
  | "seam_rejected_invalid_plan"
  | "seam_rejected_authorship"
  | "seam_rejected_non_mock_binding"
  | "seam_rejected_mock_adapter_unavailable"
  | "seam_rejected_ledger_unavailable";

export type RotationExecutionSeamFailureCode =
  | RoleRuntimeFailureCode
  | "seam_terminal_ledger_write_failed";

export type RotationExecutionLedgerAppender = (
  entry: LedgerEntry
) => boolean | Promise<boolean>;

export interface RotationExecutionSeamInput {
  readonly plan: unknown;
  readonly human_confirmed: boolean;
  readonly bridge_ledger_entries: readonly LedgerEntry[];
  readonly adapters: ReadonlyMap<string, RoleRuntimeAdapter>;
  readonly store: ContentAddressedRawOutputStore;
  readonly append_ledger_entry: RotationExecutionLedgerAppender;
  readonly now?: () => string;
  readonly ledger_id_factory?: (activity: string, ordinal: number) => string;
}

export interface RotationExecutionSeamSuccess {
  readonly ok: true;
  readonly status: "completed";
  readonly refusal_code: null;
  readonly failure_code: null;
  readonly bridge_ledger_id: string;
  readonly execution_result: RoleRuntimeExecutionResult;
  readonly ledger_entries: readonly LedgerEntry[];
}

export interface RotationExecutionSeamRefusal {
  readonly ok: false;
  readonly status: "refused";
  readonly refusal_code: RotationExecutionSeamRefusalCode;
  readonly failure_code: null;
  readonly bridge_ledger_id: string | null;
  readonly execution_result: null;
  readonly ledger_entries: readonly LedgerEntry[];
}

export interface RotationExecutionSeamFailure {
  readonly ok: false;
  readonly status: "failed";
  readonly refusal_code: null;
  readonly failure_code: RotationExecutionSeamFailureCode;
  readonly bridge_ledger_id: string;
  readonly execution_result: RoleRuntimeExecutionResult;
  readonly ledger_entries: readonly LedgerEntry[];
}

export type RotationExecutionSeamResult =
  | RotationExecutionSeamSuccess
  | RotationExecutionSeamRefusal
  | RotationExecutionSeamFailure;

export interface ReconstructedRotationLedgerInvocation {
  readonly ledger_id: string;
  readonly step_index: number;
  readonly role_id: string;
  readonly adapter_id: string;
  readonly artifact_digest: Sha256Digest;
  readonly context_refs: readonly RoleRuntimeContextRef[];
  readonly lineage_refs: readonly string[];
}

export interface ReconstructedRotationLedgerChain {
  readonly plan_id: string;
  readonly source_runtime_rotation_plan_id: string;
  readonly bridge_ledger_id: string;
  readonly execution_start_ledger_id: string;
  readonly terminal_ledger_id: string;
  readonly final_status: "completed" | "failed";
  readonly completed_steps: number;
  readonly failed_step_index: number | null;
  readonly failure_code: string | null;
  readonly invocations: readonly ReconstructedRotationLedgerInvocation[];
}

export type ReconstructRotationLedgerResult =
  | { readonly ok: true; readonly chain: ReconstructedRotationLedgerChain; readonly errors: readonly [] }
  | { readonly ok: false; readonly chain: null; readonly errors: readonly string[] };

const RRP_ID_FORMAT = /^rrp_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function executeBridgedRotationAtSeam(
  input: RotationExecutionSeamInput
): Promise<RotationExecutionSeamResult> {
  const now = input.now ?? (() => new Date().toISOString());
  const appendedEntries: LedgerEntry[] = [];
  let ledgerOrdinal = 0;
  const nextLedgerId = (activity: string): string =>
    input.ledger_id_factory?.(activity, ledgerOrdinal++) ?? createLedgerId("rotation");

  if (typeof input.append_ledger_entry !== "function") {
    return refusalResult("seam_rejected_ledger_unavailable", null, []);
  }

  if (input.human_confirmed !== true) {
    return appendRefusal(
      input,
      "seam_rejected_human_confirmation_required",
      null,
      now,
      nextLedgerId,
      appendedEntries
    );
  }

  if (!hasBridgedPlanMarkers(input.plan)) {
    return appendRefusal(
      input,
      "seam_rejected_unbridged_plan",
      null,
      now,
      nextLedgerId,
      appendedEntries
    );
  }

  const plan = input.plan as unknown as BridgedExecutablePlan;
  const planDigest = computeRotationExecutionPlanDigest(plan);
  const bridgeEntry = findMatchingBridgeEntry(input.bridge_ledger_entries, plan, planDigest);
  if (bridgeEntry === undefined) {
    return appendRefusal(
      input,
      "seam_rejected_unbridged_plan",
      null,
      now,
      nextLedgerId,
      appendedEntries
    );
  }

  if (plan.authored_by !== "human" && plan.authored_by !== "fixture") {
    return appendRefusal(
      input,
      "seam_rejected_authorship",
      bridgeEntry.ledger_id,
      now,
      nextLedgerId,
      appendedEntries
    );
  }

  if (!isStructurallyValidBridgedPlan(plan)) {
    return appendRefusal(
      input,
      "seam_rejected_invalid_plan",
      bridgeEntry.ledger_id,
      now,
      nextLedgerId,
      appendedEntries
    );
  }

  if (!hasOnlyMockBindings(plan, input.adapters)) {
    return appendRefusal(
      input,
      "seam_rejected_non_mock_binding",
      bridgeEntry.ledger_id,
      now,
      nextLedgerId,
      appendedEntries
    );
  }

  if (!hasAllDeclaredAdapters(plan, input.adapters)) {
    return appendRefusal(
      input,
      "seam_rejected_mock_adapter_unavailable",
      bridgeEntry.ledger_id,
      now,
      nextLedgerId,
      appendedEntries
    );
  }

  const startEntry = buildExecutionStartEntry(plan, bridgeEntry, planDigest, now(), nextLedgerId("start"));
  if (!(await appendEntry(input.append_ledger_entry, startEntry))) {
    return refusalResult("seam_rejected_ledger_unavailable", bridgeEntry.ledger_id, []);
  }
  appendedEntries.push(startEntry);

  const invocationLedgerIds: string[] = [];
  const appendRecord = async (record: RoleRuntimeInvocationRecord): Promise<boolean> => {
    const invocationEntry = buildInvocationLedgerEntry({
      plan,
      bridge_entry: bridgeEntry,
      start_entry: startEntry,
      plan_digest: planDigest,
      record,
      ledger_id: nextLedgerId(`step_${record.step_index}`)
    });
    const appended = await appendEntry(input.append_ledger_entry, invocationEntry);
    if (appended) {
      appendedEntries.push(invocationEntry);
      invocationLedgerIds.push(invocationEntry.ledger_id);
    }
    return appended;
  };

  const executionResult = await executeStaticRotation({
    plan,
    adapters: input.adapters,
    store: input.store,
    now,
    appendRecord
  });

  const terminalEntry = buildTerminalLedgerEntry({
    plan,
    bridge_entry: bridgeEntry,
    start_entry: startEntry,
    execution_result: executionResult,
    invocation_ledger_ids: invocationLedgerIds,
    timestamp: now(),
    ledger_id: nextLedgerId("terminal")
  });
  if (!(await appendEntry(input.append_ledger_entry, terminalEntry))) {
    return {
      ok: false,
      status: "failed",
      refusal_code: null,
      failure_code: "seam_terminal_ledger_write_failed",
      bridge_ledger_id: bridgeEntry.ledger_id,
      execution_result: executionResult,
      ledger_entries: appendedEntries
    };
  }
  appendedEntries.push(terminalEntry);

  if (!executionResult.ok) {
    return {
      ok: false,
      status: "failed",
      refusal_code: null,
      failure_code: executionResult.failure_code ?? "invalid_rotation_plan",
      bridge_ledger_id: bridgeEntry.ledger_id,
      execution_result: executionResult,
      ledger_entries: appendedEntries
    };
  }

  return {
    ok: true,
    status: "completed",
    refusal_code: null,
    failure_code: null,
    bridge_ledger_id: bridgeEntry.ledger_id,
    execution_result: executionResult,
    ledger_entries: appendedEntries
  };
}

export function computeRotationExecutionPlanDigest(plan: unknown): Sha256Digest {
  return `sha256:${createHash("sha256").update(stableStringify(plan)).digest("hex")}`;
}

export function reconstructRotationChainFromLedgerJsonl(
  contents: string,
  planId: string
): ReconstructRotationLedgerResult {
  const parsed: LedgerEntry[] = [];
  const errors: string[] = [];
  const lines = contents.split(/\r?\n/);
  lines.forEach((line, index) => {
    if (line.trim().length === 0) {
      return;
    }
    try {
      const value: unknown = JSON.parse(line);
      const validation = validateLedgerEntry(value);
      if (!validation.valid || validation.entry === undefined) {
        errors.push(`line_${index + 1}:invalid_ledger_entry`);
        return;
      }
      parsed.push(validation.entry);
    } catch {
      errors.push(`line_${index + 1}:invalid_json`);
    }
  });

  if (errors.length > 0) {
    return { ok: false, chain: null, errors };
  }

  const start = parsed.find(
    (entry) => entry.activity === "rotation_execution_started" && resultString(entry, "plan_id") === planId
  );
  const terminal = [...parsed]
    .reverse()
    .find(
      (entry) =>
        (entry.activity === "rotation_execution_completed" ||
          entry.activity === "rotation_execution_failed") &&
        resultString(entry, "plan_id") === planId
    );
  const invocationCandidates = parsed
    .filter(
      (entry) => entry.activity === "rotation_role_invocation" && resultString(entry, "plan_id") === planId
    )
    .map(parseReconstructedInvocation);
  const invocations = invocationCandidates
    .filter((entry): entry is ReconstructedRotationLedgerInvocation => entry !== null)
    .sort((left, right) => left.step_index - right.step_index);

  if (
    start === undefined ||
    terminal === undefined ||
    invocationCandidates.some((entry) => entry === null)
  ) {
    return { ok: false, chain: null, errors: ["rotation_chain_incomplete"] };
  }

  const sourcePlanId = resultString(start, "source_runtime_rotation_plan_id");
  const bridgeLedgerId = resultString(start, "bridge_ledger_id");
  const completedSteps = resultNumber(terminal, "completed_steps");
  if (sourcePlanId === null || bridgeLedgerId === null || completedSteps === null) {
    return { ok: false, chain: null, errors: ["rotation_chain_terminal_invalid"] };
  }

  const failedStepIndex = resultNullableNumber(terminal, "failed_step_index");
  const failureCode = resultNullableString(terminal, "failure_code");
  return {
    ok: true,
    chain: {
      plan_id: planId,
      source_runtime_rotation_plan_id: sourcePlanId,
      bridge_ledger_id: bridgeLedgerId,
      execution_start_ledger_id: start.ledger_id,
      terminal_ledger_id: terminal.ledger_id,
      final_status: terminal.activity === "rotation_execution_completed" ? "completed" : "failed",
      completed_steps: completedSteps,
      failed_step_index: failedStepIndex,
      failure_code: failureCode,
      invocations
    },
    errors: []
  };
}

async function appendRefusal(
  input: RotationExecutionSeamInput,
  code: RotationExecutionSeamRefusalCode,
  bridgeLedgerId: string | null,
  now: () => string,
  nextLedgerId: (activity: string) => string,
  appendedEntries: LedgerEntry[]
): Promise<RotationExecutionSeamRefusal> {
  const entry = buildRefusalLedgerEntry(input.plan, code, bridgeLedgerId, now(), nextLedgerId("refusal"));
  if (!(await appendEntry(input.append_ledger_entry, entry))) {
    return refusalResult("seam_rejected_ledger_unavailable", bridgeLedgerId, []);
  }
  appendedEntries.push(entry);
  return refusalResult(code, bridgeLedgerId, appendedEntries);
}

function refusalResult(
  code: RotationExecutionSeamRefusalCode,
  bridgeLedgerId: string | null,
  entries: readonly LedgerEntry[]
): RotationExecutionSeamRefusal {
  return {
    ok: false,
    status: "refused",
    refusal_code: code,
    failure_code: null,
    bridge_ledger_id: bridgeLedgerId,
    execution_result: null,
    ledger_entries: entries
  };
}

function findMatchingBridgeEntry(
  entries: readonly LedgerEntry[],
  plan: BridgedExecutablePlan,
  planDigest: Sha256Digest
): LedgerEntry | undefined {
  return entries.find((entry) => {
    if (
      entry.activity !== "runtime_rotation_plan_bridge" ||
      entry.status !== "completed" ||
      entry.actor_id !== "logic_engine.rotation_plan_bridge" ||
      resultString(entry, "outcome") !== "derived" ||
      resultString(entry, "derived_plan_digest") !== planDigest ||
      resultString(entry, "source_plan_ref") !== plan.source_runtime_rotation_plan_id ||
      resultString(entry, "source_plan_digest") !== plan.source_plan_digest ||
      !entry.parent_refs.includes(plan.source_runtime_rotation_plan_id) ||
      !entry.artifact_refs.includes(plan.plan_id)
    ) {
      return false;
    }
    const lineageRefs = provenanceStringArray(entry, "lineage_refs");
    return lineageRefs?.includes(plan.source_runtime_rotation_plan_id) === true && entry.artifact_hashes.some(
      (artifact) => artifact.artifact_id === plan.plan_id && artifact.hash === planDigest
    );
  });
}

function hasBridgedPlanMarkers(value: unknown): value is Record<string, unknown> {
  if (!isObject(value)) {
    return false;
  }
  return (
    value["bridge_schema_version"] === "1.0.0" &&
    value["ledger_mandatory"] === true &&
    typeof value["source_runtime_rotation_plan_id"] === "string" &&
    Array.isArray(value["lineage_refs"])
  );
}

function isStructurallyValidBridgedPlan(plan: BridgedExecutablePlan): boolean {
  const target = validateStaticRotationPlan(plan);
  if (!target.ok) {
    return false;
  }
  if (
    plan.bridge_schema_version !== "1.0.0" ||
    plan.ledger_mandatory !== true ||
    !RRP_ID_FORMAT.test(plan.source_runtime_rotation_plan_id) ||
    !plan.lineage_refs.includes(plan.source_runtime_rotation_plan_id) ||
    plan.gate_obligations?.role_handoff_gate !== true ||
    plan.gate_obligations?.final_verification_gate !== true ||
    plan.gate_obligations?.approval_gate !== false ||
    plan.gate_obligations?.snapshot_gate !== false ||
    plan.bridge_provenance?.source_plan_digest !== plan.source_plan_digest ||
    !Array.isArray(plan.bridge_provenance?.adapter_bindings)
  ) {
    return false;
  }
  return plan.stop_conditions.max_invocations === plan.sequence.length;
}

function hasOnlyMockBindings(
  plan: BridgedExecutablePlan,
  adapters: ReadonlyMap<string, RoleRuntimeAdapter>
): boolean {
  if (plan.sequence.some((step) => step.adapter_kind !== "mock")) {
    return false;
  }
  if (plan.bridge_provenance.adapter_bindings.some((binding) => binding.adapter_kind !== "mock")) {
    return false;
  }
  return [...adapters.values()].every((adapter) => adapter.adapter_kind === "mock");
}

function hasAllDeclaredAdapters(
  plan: BridgedExecutablePlan,
  adapters: ReadonlyMap<string, RoleRuntimeAdapter>
): boolean {
  return plan.sequence.every((step) => adapters.has(step.adapter_id));
}

function buildExecutionStartEntry(
  plan: BridgedExecutablePlan,
  bridgeEntry: LedgerEntry,
  planDigest: Sha256Digest,
  timestamp: string,
  ledgerId: string
): LedgerEntry {
  return baseLedgerEntry({
    ledger_id: ledgerId,
    timestamp,
    plan,
    activity: "rotation_execution_started",
    status: "running",
    result: {
      plan_id: plan.plan_id,
      bridge_ledger_id: bridgeEntry.ledger_id,
      derived_plan_digest: planDigest,
      source_runtime_rotation_plan_id: plan.source_runtime_rotation_plan_id,
      sequence_length: plan.sequence.length,
      human_confirmed: true,
      adapter_kind: "mock"
    },
    errors: [],
    parent_refs: [bridgeEntry.ledger_id, plan.source_runtime_rotation_plan_id],
    artifact_refs: [plan.plan_id]
  });
}

function buildInvocationLedgerEntry(input: {
  readonly plan: BridgedExecutablePlan;
  readonly bridge_entry: LedgerEntry;
  readonly start_entry: LedgerEntry;
  readonly plan_digest: Sha256Digest;
  readonly record: RoleRuntimeInvocationRecord;
  readonly ledger_id: string;
}): LedgerEntry {
  const result: JsonObject = {
    plan_id: input.plan.plan_id,
    step_index: input.record.step_index,
    role_id: input.record.role_id,
    adapter_id: input.record.adapter_id,
    adapter_kind: input.record.adapter_kind,
    artifact_digest: input.record.artifact_digest,
    artifact_id: input.record.artifact_id,
    context_refs: input.record.context_refs.map((ref) => ({ ...ref })),
    validation_status: input.record.validation_status,
    handoff_gate_status: input.record.handoff_gate_status,
    failure_code: input.record.failure_code
  };
  return {
    ...baseLedgerEntry({
      ledger_id: input.ledger_id,
      timestamp: input.record.created_at,
      plan: input.plan,
      activity: "rotation_role_invocation",
      status: "completed",
      result,
      errors: [],
      parent_refs: [input.bridge_entry.ledger_id, input.start_entry.ledger_id, input.plan.plan_id],
      artifact_refs: [input.record.artifact_id]
    }),
    actor_type: "model",
    actor_id: input.record.role_id,
    started_at: input.record.created_at,
    completed_at: input.record.created_at,
    artifact_hashes: [
      {
        artifact_id: input.record.artifact_id,
        hash: input.record.artifact_digest,
        algorithm: "sha256"
      }
    ],
    provenance: {
      execution_seam_version: ROTATION_EXECUTION_SEAM_SCHEMA_VERSION,
      bridge_ledger_id: input.bridge_entry.ledger_id,
      derived_plan_digest: input.plan_digest,
      source_runtime_rotation_plan_id: input.plan.source_runtime_rotation_plan_id,
      lineage_refs: [input.plan.source_runtime_rotation_plan_id, input.plan.plan_id]
    },
    verification_status: "verified",
    trust_tier: "T1"
  };
}

function buildTerminalLedgerEntry(input: {
  readonly plan: BridgedExecutablePlan;
  readonly bridge_entry: LedgerEntry;
  readonly start_entry: LedgerEntry;
  readonly execution_result: RoleRuntimeExecutionResult;
  readonly invocation_ledger_ids: readonly string[];
  readonly timestamp: string;
  readonly ledger_id: string;
}): LedgerEntry {
  const failed = !input.execution_result.ok;
  const failureCode = input.execution_result.failure_code;
  const errors: CalebError[] =
    failed && failureCode !== null
      ? [
          {
            error_id: failureCode,
            message: `Rotation halted at the declared failure boundary: ${failureCode}.`,
            severity: "error",
            retryable: false
          }
        ]
      : [];
  return baseLedgerEntry({
    ledger_id: input.ledger_id,
    timestamp: input.timestamp,
    plan: input.plan,
    activity: failed ? "rotation_execution_failed" : "rotation_execution_completed",
    status: failed ? "failed" : "completed",
    result: {
      plan_id: input.plan.plan_id,
      bridge_ledger_id: input.bridge_entry.ledger_id,
      source_runtime_rotation_plan_id: input.plan.source_runtime_rotation_plan_id,
      completed_steps: input.execution_result.completed_steps,
      failed_step_index: input.execution_result.failed_step_index,
      failure_code: failureCode,
      invocation_ledger_ids: [...input.invocation_ledger_ids],
      record_ids: input.execution_result.records.map((record) => record.record_id)
    },
    errors,
    parent_refs: [
      input.bridge_entry.ledger_id,
      input.start_entry.ledger_id,
      ...input.invocation_ledger_ids
    ],
    artifact_refs: input.execution_result.records.map((record) => record.artifact_id)
  });
}

function buildRefusalLedgerEntry(
  plan: unknown,
  code: RotationExecutionSeamRefusalCode,
  bridgeLedgerId: string | null,
  timestamp: string,
  ledgerId: string
): LedgerEntry {
  const planRecord = isObject(plan) ? plan : {};
  const taskId = readString(planRecord, "task_id") ?? "task_le3_refusal";
  const runId = readString(planRecord, "run_id") ?? "run_le3_refusal";
  const traceId = readString(planRecord, "trace_id") ?? "trace_le3_refusal";
  const planId = readString(planRecord, "plan_id");
  const sourcePlanId = readString(planRecord, "source_runtime_rotation_plan_id");
  return {
    ledger_id: ledgerId,
    schema_version: "1.0.0",
    timestamp,
    task_id: taskId,
    run_id: runId,
    trace_id: traceId,
    actor_type: "orchestration_core",
    actor_id: "logic_engine.rotation_execution_seam",
    actor_version: ROTATION_EXECUTION_SEAM_SCHEMA_VERSION,
    activity: "rotation_execution_refused",
    status: "rejected",
    result: {
      plan_id: planId,
      source_runtime_rotation_plan_id: sourcePlanId,
      bridge_ledger_id: bridgeLedgerId,
      refusal_code: code,
      roles_executed: 0
    },
    warnings: [],
    errors: [
      {
        error_id: code,
        message: refusalMessage(code),
        severity: "error",
        retryable: false
      }
    ],
    artifact_hashes: [],
    provenance: {
      execution_seam_version: ROTATION_EXECUTION_SEAM_SCHEMA_VERSION,
      human_initiated_only: true
    },
    retryable: false,
    verification_status: "verified",
    trust_tier: "T2",
    parent_refs: bridgeLedgerId === null ? [] : [bridgeLedgerId],
    artifact_refs: planId === null ? [] : [planId]
  };
}

function baseLedgerEntry(input: {
  readonly ledger_id: string;
  readonly timestamp: string;
  readonly plan: BridgedExecutablePlan;
  readonly activity: string;
  readonly status: "running" | "completed" | "failed";
  readonly result: JsonValue;
  readonly errors: readonly CalebError[];
  readonly parent_refs: readonly string[];
  readonly artifact_refs: readonly string[];
}): LedgerEntry {
  return {
    ledger_id: input.ledger_id,
    schema_version: "1.0.0",
    timestamp: input.timestamp,
    task_id: input.plan.task_id,
    run_id: input.plan.run_id,
    trace_id: input.plan.trace_id,
    actor_type: "orchestration_core",
    actor_id: "logic_engine.rotation_execution_seam",
    actor_version: ROTATION_EXECUTION_SEAM_SCHEMA_VERSION,
    activity: input.activity,
    status: input.status,
    result: input.result,
    warnings: [],
    errors: input.errors,
    artifact_hashes: [],
    provenance: {
      execution_seam_version: ROTATION_EXECUTION_SEAM_SCHEMA_VERSION,
      source_runtime_rotation_plan_id: input.plan.source_runtime_rotation_plan_id,
      lineage_refs: [input.plan.source_runtime_rotation_plan_id, input.plan.plan_id]
    },
    retryable: false,
    verification_status: "verified",
    trust_tier: "T2",
    parent_refs: input.parent_refs,
    artifact_refs: input.artifact_refs
  };
}

async function appendEntry(
  appender: RotationExecutionLedgerAppender,
  entry: LedgerEntry
): Promise<boolean> {
  try {
    return (await appender(entry)) === true;
  } catch {
    return false;
  }
}

function parseReconstructedInvocation(
  entry: LedgerEntry
): ReconstructedRotationLedgerInvocation | null {
  const stepIndex = resultNumber(entry, "step_index");
  const roleId = resultString(entry, "role_id");
  const adapterId = resultString(entry, "adapter_id");
  const artifactDigest = resultString(entry, "artifact_digest");
  const contextRefs = resultContextRefs(entry);
  const lineageRefs = provenanceStringArray(entry, "lineage_refs");
  if (
    stepIndex === null ||
    roleId === null ||
    adapterId === null ||
    artifactDigest === null ||
    contextRefs === null ||
    lineageRefs === null
  ) {
    return null;
  }
  return {
    ledger_id: entry.ledger_id,
    step_index: stepIndex,
    role_id: roleId,
    adapter_id: adapterId,
    artifact_digest: artifactDigest,
    context_refs: contextRefs,
    lineage_refs: lineageRefs
  };
}

function resultContextRefs(entry: LedgerEntry): readonly RoleRuntimeContextRef[] | null {
  if (!isObject(entry.result)) {
    return null;
  }
  const value = entry.result["context_refs"];
  if (!Array.isArray(value)) {
    return null;
  }
  const refs: RoleRuntimeContextRef[] = [];
  for (const item of value) {
    if (
      !isObject(item) ||
      typeof item["digest"] !== "string" ||
      typeof item["step_index"] !== "number"
    ) {
      return null;
    }
    refs.push({
      digest: item["digest"],
      step_index: item["step_index"]
    });
  }
  return refs;
}

function resultString(entry: LedgerEntry, key: string): string | null {
  if (!isObject(entry.result)) {
    return null;
  }
  return readString(entry.result, key);
}

function resultNumber(entry: LedgerEntry, key: string): number | null {
  if (!isObject(entry.result)) {
    return null;
  }
  const value = entry.result[key];
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function resultNullableNumber(entry: LedgerEntry, key: string): number | null {
  if (!isObject(entry.result)) {
    return null;
  }
  const value = entry.result[key];
  return value === null ? null : typeof value === "number" && Number.isInteger(value) ? value : null;
}

function resultNullableString(entry: LedgerEntry, key: string): string | null {
  if (!isObject(entry.result)) {
    return null;
  }
  const value = entry.result[key];
  return value === null ? null : typeof value === "string" ? value : null;
}

function provenanceStringArray(entry: LedgerEntry, key: string): readonly string[] | null {
  const value = entry.provenance[key];
  return Array.isArray(value) && value.every((item) => typeof item === "string")
    ? value
    : null;
}

function readString(record: Record<string, unknown>, key: string): string | null {
  const value = record[key];
  return typeof value === "string" ? value : null;
}

function refusalMessage(code: RotationExecutionSeamRefusalCode): string {
  const messages: Record<RotationExecutionSeamRefusalCode, string> = {
    seam_rejected_human_confirmation_required: "Human CLI confirmation is required before rotation execution.",
    seam_rejected_unbridged_plan: "The supplied plan has no matching successful LE-2 bridge record.",
    seam_rejected_invalid_plan: "The bridged plan failed execution-boundary structural revalidation.",
    seam_rejected_authorship: "The source plan author is not human or fixture.",
    seam_rejected_non_mock_binding: "Only mock role adapter bindings may execute in LE-3.",
    seam_rejected_mock_adapter_unavailable: "A declared mock role adapter is unavailable.",
    seam_rejected_ledger_unavailable: "Mandatory Ledger persistence is unavailable."
  };
  return messages[code];
}

function stableStringify(value: unknown, seen = new WeakSet<object>()): string {
  if (Array.isArray(value)) {
    if (seen.has(value)) {
      return JSON.stringify("[Circular]");
    }
    seen.add(value);
    const rendered = `[${value.map((entry) => stableStringify(entry, seen)).join(",")}]`;
    seen.delete(value);
    return rendered;
  }
  if (isObject(value)) {
    if (seen.has(value)) {
      return JSON.stringify("[Circular]");
    }
    seen.add(value);
    const rendered = `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => `${JSON.stringify(key)}:${stableStringify(nested, seen)}`)
      .join(",")}}`;
    seen.delete(value);
    return rendered;
  }
  if (value === undefined) {
    return JSON.stringify("[Undefined]");
  }
  if (typeof value === "bigint") {
    return JSON.stringify(`[BigInt:${value.toString()}]`);
  }
  if (typeof value === "function" || typeof value === "symbol") {
    return JSON.stringify(`[${typeof value}]`);
  }
  return JSON.stringify(value);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

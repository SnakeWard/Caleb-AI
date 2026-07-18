import { createHash } from "node:crypto";

import { createLedgerId } from "../ledger/ledgerEntryFactory.js";
import { getRoleContract, hasRoleContract } from "../roles/roleContractRegistry.js";
import { validateRuntimeRotationPlan } from "../roles/runtimeRotationPlanValidator.js";
import type { RoleId } from "../roles/types/roleArtifact.js";
import type {
  RuntimeRotationPlan,
  RuntimeRotationPlanGate,
  RuntimeRotationPlanRole,
  RuntimeRotationRouteMode
} from "../roles/types/runtimeRotationPlan.js";
import { validateStaticRotationPlan } from "../roleRuntime/rotationPlanValidator.js";
import type { RoleRuntimeInvocationRecord } from "../roleRuntime/types/roleRuntimeTypes.js";
import {
  ROTATION_PLAN_SCHEMA_VERSION,
  type RotationPlanAuthoredBy,
  type StaticRotationPlan
} from "../roleRuntime/types/staticRotationPlan.js";
import type { ISODateTimeString, JsonObject, Sha256Digest } from "../types/common.js";
import type { CalebError } from "../types/invocation.js";
import type { LedgerEntry } from "../types/ledger.js";
import type { ContractValidatedTaskFrameRouteInput } from "./types/routeInput.js";

export const ROTATION_PLAN_BRIDGE_SCHEMA_VERSION = "1.0.0" as const;

export type RotationPlanBridgeRejectionCode =
  | "bridge_rejected_invalid_schema"
  | "bridge_rejected_authorship"
  | "bridge_rejected_reference_format"
  | "bridge_rejected_unknown_role"
  | "bridge_rejected_forbidden_transition"
  | "bridge_rejected_ungated_capability"
  | "bridge_rejected_live_adapter_unavailable";

export type RotationPlanBridgeFailureCode = "bridge_ledger_write_failed";

export interface RotationPlanBridgeAdapterBinding {
  readonly role_id: RuntimeRotationPlanRole;
  readonly adapter_id: string;
  readonly adapter_kind: "mock" | "live";
}

export interface BridgedPlanGateObligations {
  readonly role_handoff_gate: true;
  readonly final_verification_gate: true;
  readonly approval_gate: boolean;
  readonly snapshot_gate: boolean;
}

export interface BridgedPlanProvenance {
  readonly source_carrier_record_id: string;
  readonly source_plan_digest: Sha256Digest;
  readonly inert_stop_criteria: readonly string[];
  readonly adapter_bindings: readonly RotationPlanBridgeAdapterBinding[];
}

export interface BridgedExecutablePlan extends StaticRotationPlan {
  readonly bridge_schema_version: typeof ROTATION_PLAN_BRIDGE_SCHEMA_VERSION;
  readonly source_runtime_rotation_plan_id: string;
  readonly source_plan_digest: Sha256Digest;
  readonly structural_digest: Sha256Digest;
  readonly route_mode: RuntimeRotationRouteMode;
  readonly lineage_refs: readonly string[];
  readonly max_cycles: number;
  readonly hollows_required: readonly string[];
  readonly gate_obligations: BridgedPlanGateObligations;
  readonly ledger_mandatory: true;
  readonly bridge_provenance: BridgedPlanProvenance;
}

export type RotationPlanBridgeLedgerAppender = (
  entry: LedgerEntry
) => boolean | Promise<boolean>;

export interface RotationPlanBridgeInput {
  readonly carrier: ContractValidatedTaskFrameRouteInput;
  readonly runtime_rotation_plan: unknown;
  readonly adapter_bindings: readonly RotationPlanBridgeAdapterBinding[];
  readonly append_ledger_entry: RotationPlanBridgeLedgerAppender;
  readonly decided_at?: ISODateTimeString;
  readonly ledger_id?: string;
}

export interface RotationPlanBridgeSuccess {
  readonly ok: true;
  readonly outcome: "derived";
  readonly derived_plan: BridgedExecutablePlan;
  readonly rejection_code: null;
  readonly ledger_entry: LedgerEntry;
}

export interface RotationPlanBridgeRejection {
  readonly ok: false;
  readonly outcome: "rejected";
  readonly derived_plan: null;
  readonly rejection_code: RotationPlanBridgeRejectionCode;
  readonly ledger_entry: LedgerEntry;
}

export interface RotationPlanBridgeLedgerFailure {
  readonly ok: false;
  readonly outcome: "ledger_write_failed";
  readonly derived_plan: null;
  readonly rejection_code: RotationPlanBridgeFailureCode;
  readonly ledger_entry: null;
}

export type RotationPlanBridgeResult =
  | RotationPlanBridgeSuccess
  | RotationPlanBridgeRejection
  | RotationPlanBridgeLedgerFailure;

export type BridgeExecutionRecordAppender = (
  record: RoleRuntimeInvocationRecord
) => boolean | Promise<boolean>;

export interface BridgedExecutorHandoff {
  readonly plan: BridgedExecutablePlan;
  readonly append_record: BridgeExecutionRecordAppender;
}

export type BridgedExecutorHandoffResult =
  | { readonly ok: true; readonly handoff: BridgedExecutorHandoff; readonly failure_code: null }
  | {
      readonly ok: false;
      readonly handoff: null;
      readonly failure_code: "bridge_executor_ledger_callback_required";
    };

interface DerivedCandidate {
  readonly outcome: "derived";
  readonly plan: BridgedExecutablePlan;
  readonly source_plan_ref: string;
  readonly source_plan_digest: Sha256Digest;
  readonly structural_inputs: readonly string[];
}

interface RejectedCandidate {
  readonly outcome: "rejected";
  readonly rejection_code: RotationPlanBridgeRejectionCode;
  readonly source_plan_ref: string | null;
  readonly source_plan_digest: Sha256Digest;
  readonly structural_inputs: readonly string[];
}

type BridgeCandidate = DerivedCandidate | RejectedCandidate;

interface BindingValidationSuccess {
  readonly ok: true;
  readonly bindings: readonly RotationPlanBridgeAdapterBinding[];
}

interface BindingValidationFailure {
  readonly ok: false;
  readonly code:
    | "bridge_rejected_invalid_schema"
    | "bridge_rejected_live_adapter_unavailable";
  readonly structural_inputs: readonly string[];
}

const RRP_ID_FORMAT = /^rrp_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const TASK_ID_FORMAT = /^task_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const RUN_ID_FORMAT = /^run_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export async function bridgeRuntimeRotationPlan(
  input: RotationPlanBridgeInput
): Promise<RotationPlanBridgeResult> {
  const decidedAt = input.decided_at ?? new Date().toISOString();
  const candidate = deriveBridgeCandidate(input);
  const ledgerEntry = buildBridgeLedgerEntry(candidate, input, decidedAt);

  let appended = false;
  try {
    appended = (await input.append_ledger_entry(ledgerEntry)) === true;
  } catch {
    appended = false;
  }

  if (!appended) {
    return {
      ok: false,
      outcome: "ledger_write_failed",
      derived_plan: null,
      rejection_code: "bridge_ledger_write_failed",
      ledger_entry: null
    };
  }

  if (candidate.outcome === "rejected") {
    return {
      ok: false,
      outcome: "rejected",
      derived_plan: null,
      rejection_code: candidate.rejection_code,
      ledger_entry: ledgerEntry
    };
  }

  return {
    ok: true,
    outcome: "derived",
    derived_plan: candidate.plan,
    rejection_code: null,
    ledger_entry: ledgerEntry
  };
}

export function createBridgedExecutorHandoff(
  plan: BridgedExecutablePlan,
  append_record: BridgeExecutionRecordAppender
): BridgedExecutorHandoffResult {
  if (plan.ledger_mandatory !== true || typeof append_record !== "function") {
    return {
      ok: false,
      handoff: null,
      failure_code: "bridge_executor_ledger_callback_required"
    };
  }

  return {
    ok: true,
    handoff: { plan, append_record },
    failure_code: null
  };
}

function deriveBridgeCandidate(input: RotationPlanBridgeInput): BridgeCandidate {
  const sourcePlanDigest = digestValue(input.runtime_rotation_plan);
  const sourcePlanRef = readStringField(input.runtime_rotation_plan, "runtime_rotation_plan_id");
  const validation = validateRuntimeRotationPlan(input.runtime_rotation_plan);

  if (!validation.ok) {
    const codes = validation.errors.map((error) => error.code);
    if (codes.includes("RRP_MODEL_AUTHORED_FORBIDDEN")) {
      return rejected(
        "bridge_rejected_authorship",
        sourcePlanRef,
        sourcePlanDigest,
        codes
      );
    }
    if (codes.includes("RRP_INVALID_ID_FORMAT")) {
      return rejected(
        "bridge_rejected_reference_format",
        sourcePlanRef,
        sourcePlanDigest,
        codes
      );
    }
    return rejected("bridge_rejected_invalid_schema", sourcePlanRef, sourcePlanDigest, codes);
  }

  const plan = input.runtime_rotation_plan as RuntimeRotationPlan;

  if (plan.authored_by !== "human" && plan.authored_by !== "fixture") {
    return rejected(
      "bridge_rejected_authorship",
      plan.runtime_rotation_plan_id,
      sourcePlanDigest,
      ["target_ra_r1_authorship_unrepresentable"]
    );
  }

  if (
    input.carrier.record_kind !== "contract_validated_task_frame" ||
    !input.carrier.lineage_refs.includes(plan.runtime_rotation_plan_id) ||
    input.carrier.task_frame.task_id !== plan.task_id ||
    input.carrier.task_frame.run_id !== plan.run_id
  ) {
    return rejected(
      "bridge_rejected_reference_format",
      plan.runtime_rotation_plan_id,
      sourcePlanDigest,
      ["carrier_plan_lineage_or_identity_mismatch"]
    );
  }

  const unknownRoles = plan.roles_required.filter((role) => !hasRoleContract(role));
  if (unknownRoles.length > 0) {
    return rejected(
      "bridge_rejected_unknown_role",
      plan.runtime_rotation_plan_id,
      sourcePlanDigest,
      unknownRoles.map((role) => `unknown_role:${role}`)
    );
  }

  const expandedRoles = expandRoles(plan.roles_required, plan.max_cycles);
  const forbiddenTransition = findForbiddenTransition(expandedRoles);
  if (forbiddenTransition !== null) {
    return rejected(
      "bridge_rejected_forbidden_transition",
      plan.runtime_rotation_plan_id,
      sourcePlanDigest,
      [`forbidden_transition:${forbiddenTransition.from}->${forbiddenTransition.to}`]
    );
  }

  if (
    plan.side_effect_policy !== "none" ||
    plan.code_mutation_policy !== "none" ||
    plan.snapshot_requirement !== false
  ) {
    return rejected(
      "bridge_rejected_ungated_capability",
      plan.runtime_rotation_plan_id,
      sourcePlanDigest,
      [
        `side_effect_policy:${plan.side_effect_policy}`,
        `code_mutation_policy:${plan.code_mutation_policy}`,
        `snapshot_requirement:${String(plan.snapshot_requirement)}`
      ]
    );
  }

  const bindingValidation = validateBindings(input.adapter_bindings, plan.roles_required);
  if (!bindingValidation.ok) {
    return rejected(
      bindingValidation.code,
      plan.runtime_rotation_plan_id,
      sourcePlanDigest,
      bindingValidation.structural_inputs
    );
  }

  const planAuthoredBy: RotationPlanAuthoredBy = plan.authored_by;
  const structuralSource = buildStructuralSource(plan, bindingValidation.bindings);
  const structuralDigest = digestValue(structuralSource);
  const bindingByRole = new Map(bindingValidation.bindings.map((binding) => [binding.role_id, binding]));
  const sequence = expandedRoles.map((role, stepIndex) => {
    const binding = bindingByRole.get(role);
    if (binding === undefined) {
      throw new Error(`Validated binding missing for role '${role}'.`);
    }
    return {
      step_index: stepIndex,
      role_id: role as RoleId,
      adapter_id: binding.adapter_id,
      adapter_kind: "mock" as const
    };
  });

  const derivedPlan: BridgedExecutablePlan = {
    schema_version: ROTATION_PLAN_SCHEMA_VERSION,
    plan_id: `plan_${uuidFromSeed(`plan:${structuralDigest}`)}`,
    task_id: plan.task_id,
    run_id: plan.run_id,
    trace_id: `trace_${uuidFromSeed(`trace:${structuralDigest}`)}`,
    context_id: `context_${uuidFromSeed(`context:${structuralDigest}`)}`,
    authored_by: planAuthoredBy,
    sequence,
    stop_conditions: {
      max_invocations: sequence.length,
      halt_on_first_failure: true
    },
    created_at: plan.created_at,
    bridge_schema_version: ROTATION_PLAN_BRIDGE_SCHEMA_VERSION,
    source_runtime_rotation_plan_id: plan.runtime_rotation_plan_id,
    source_plan_digest: sourcePlanDigest,
    structural_digest: structuralDigest,
    route_mode: plan.route_mode,
    lineage_refs: [plan.runtime_rotation_plan_id],
    max_cycles: plan.max_cycles,
    hollows_required: [...plan.hollows_required],
    gate_obligations: buildGateObligations(plan.gates_required),
    ledger_mandatory: true,
    bridge_provenance: {
      source_carrier_record_id: input.carrier.record_id,
      source_plan_digest: sourcePlanDigest,
      inert_stop_criteria: [...plan.stop_criteria],
      adapter_bindings: bindingValidation.bindings.map((binding) => ({ ...binding }))
    }
  };

  const targetValidation = validateStaticRotationPlan(derivedPlan);
  if (!targetValidation.ok) {
    return rejected(
      "bridge_rejected_invalid_schema",
      plan.runtime_rotation_plan_id,
      sourcePlanDigest,
      targetValidation.errors.map((error) => `target:${error.code}`)
    );
  }

  return {
    outcome: "derived",
    plan: derivedPlan,
    source_plan_ref: plan.runtime_rotation_plan_id,
    source_plan_digest: sourcePlanDigest,
    structural_inputs: [
      `route_mode:${plan.route_mode}`,
      `max_cycles:${plan.max_cycles}`,
      `sequence_length:${sequence.length}`,
      "registry_transitions_allowed",
      "mock_bindings_only",
      "ledger_mandatory"
    ]
  };
}

function validateBindings(
  bindings: readonly RotationPlanBridgeAdapterBinding[],
  roles: readonly RuntimeRotationPlanRole[]
): BindingValidationSuccess | BindingValidationFailure {
  if (!Array.isArray(bindings)) {
    return {
      ok: false,
      code: "bridge_rejected_invalid_schema",
      structural_inputs: ["adapter_bindings_not_array"]
    };
  }

  const errors: string[] = [];
  const seen = new Set<string>();
  const roleSet = new Set<string>(roles);
  const normalized: RotationPlanBridgeAdapterBinding[] = [];
  let liveBindingPresent = false;

  bindings.forEach((binding, index) => {
    if (typeof binding !== "object" || binding === null || Array.isArray(binding)) {
      errors.push(`adapter_binding_not_object:${index}`);
      return;
    }

    const record = binding as unknown as Record<string, unknown>;
    const roleId = record["role_id"];
    const adapterId = record["adapter_id"];
    const adapterKind = record["adapter_kind"];

    if (typeof roleId !== "string" || !roleSet.has(roleId)) {
      errors.push(`adapter_binding_unknown_or_extra_role:${String(roleId)}`);
      return;
    }
    if (seen.has(roleId)) {
      errors.push(`adapter_binding_duplicate_role:${roleId}`);
      return;
    }
    seen.add(roleId);
    if (typeof adapterId !== "string" || adapterId.trim().length === 0) {
      errors.push(`adapter_binding_invalid_id:${roleId}`);
      return;
    }
    if (adapterKind !== "mock" && adapterKind !== "live") {
      errors.push(`adapter_binding_invalid_kind:${roleId}`);
      return;
    }
    if (adapterKind === "live") {
      liveBindingPresent = true;
    }
    normalized.push({
      role_id: roleId as RuntimeRotationPlanRole,
      adapter_id: adapterId,
      adapter_kind: adapterKind
    });
  });

  for (const role of roles) {
    if (!seen.has(role)) {
      errors.push(`adapter_binding_missing_role:${role}`);
    }
  }

  if (liveBindingPresent) {
    return {
      ok: false,
      code: "bridge_rejected_live_adapter_unavailable",
      structural_inputs: ["live_adapter_binding_present"]
    };
  }
  if (errors.length > 0 || normalized.length !== roles.length) {
    return {
      ok: false,
      code: "bridge_rejected_invalid_schema",
      structural_inputs: errors.length > 0 ? errors : ["adapter_binding_count_mismatch"]
    };
  }

  const roleOrder = new Map(roles.map((role, index) => [role, index]));
  normalized.sort((left, right) => {
    return (roleOrder.get(left.role_id) ?? 0) - (roleOrder.get(right.role_id) ?? 0);
  });
  return { ok: true, bindings: normalized };
}

function expandRoles(
  roles: readonly RuntimeRotationPlanRole[],
  maxCycles: number
): RuntimeRotationPlanRole[] {
  const expanded: RuntimeRotationPlanRole[] = [];
  for (let cycle = 0; cycle < maxCycles; cycle += 1) {
    expanded.push(...roles);
  }
  return expanded;
}

function findForbiddenTransition(
  roles: readonly RuntimeRotationPlanRole[]
): { readonly from: RuntimeRotationPlanRole; readonly to: RuntimeRotationPlanRole } | null {
  for (let index = 0; index < roles.length - 1; index += 1) {
    const from = roles[index];
    const to = roles[index + 1];
    if (from === undefined || to === undefined) {
      continue;
    }
    const contract = getRoleContract(from);
    if (contract === undefined || !contract.allowed_next_roles.includes(to as RoleId)) {
      return { from, to };
    }
  }
  return null;
}

function buildGateObligations(
  gates: readonly RuntimeRotationPlanGate[]
): BridgedPlanGateObligations {
  return {
    role_handoff_gate: true,
    final_verification_gate: true,
    approval_gate: gates.includes("approval_gate"),
    snapshot_gate: gates.includes("snapshot_gate")
  };
}

function buildStructuralSource(
  plan: RuntimeRotationPlan,
  bindings: readonly RotationPlanBridgeAdapterBinding[]
): JsonObject {
  return {
    runtime_rotation_plan_id: plan.runtime_rotation_plan_id,
    schema_version: plan.schema_version,
    task_id: plan.task_id,
    run_id: plan.run_id,
    authored_by: plan.authored_by,
    route_mode: plan.route_mode,
    roles_required: [...plan.roles_required],
    hollows_required: [...plan.hollows_required],
    gates_required: [...plan.gates_required],
    max_cycles: plan.max_cycles,
    side_effect_policy: plan.side_effect_policy,
    code_mutation_policy: plan.code_mutation_policy,
    snapshot_requirement: plan.snapshot_requirement,
    ledger_policy: plan.ledger_policy,
    created_at: plan.created_at,
    adapter_bindings: bindings.map((binding) => ({ ...binding }))
  };
}

function buildBridgeLedgerEntry(
  candidate: BridgeCandidate,
  input: RotationPlanBridgeInput,
  decidedAt: ISODateTimeString
): LedgerEntry {
  const fallbackSeed = candidate.source_plan_digest;
  const taskId = readMatchingField(input.runtime_rotation_plan, "task_id", TASK_ID_FORMAT)
    ?? `task_${uuidFromSeed(`ledger-task:${fallbackSeed}`)}`;
  const runId = readMatchingField(input.runtime_rotation_plan, "run_id", RUN_ID_FORMAT)
    ?? `run_${uuidFromSeed(`ledger-run:${fallbackSeed}`)}`;
  const traceId = `trace_${uuidFromSeed(`ledger-trace:${fallbackSeed}`)}`;
  const derivedPlanDigest =
    candidate.outcome === "derived" ? digestValue(candidate.plan) : null;
  const rejectionCode =
    candidate.outcome === "rejected" ? candidate.rejection_code : null;

  const result: JsonObject = {
    outcome: candidate.outcome,
    source_plan_digest: candidate.source_plan_digest,
    source_plan_ref: candidate.source_plan_ref,
    derived_plan_digest: derivedPlanDigest,
    rejection_code: rejectionCode,
    structural_inputs: [...candidate.structural_inputs]
  };
  const provenance: JsonObject = {
    bridge_schema_version: ROTATION_PLAN_BRIDGE_SCHEMA_VERSION,
    source_carrier_record_id: input.carrier.record_id,
    source_plan_ref: candidate.source_plan_ref,
    lineage_refs:
      candidate.source_plan_ref !== null && RRP_ID_FORMAT.test(candidate.source_plan_ref)
        ? [candidate.source_plan_ref]
        : []
  };
  const errors: CalebError[] =
    rejectionCode === null
      ? []
      : [
          {
            error_id: rejectionCode,
            message: rejectionMessage(rejectionCode),
            severity: "error",
            retryable: false
          }
        ];

  return {
    ledger_id: input.ledger_id ?? createLedgerId("bridge"),
    schema_version: "1.0.0",
    timestamp: decidedAt,
    task_id: taskId,
    run_id: runId,
    trace_id: traceId,
    actor_type: "orchestration_core",
    actor_id: "logic_engine.rotation_plan_bridge",
    actor_version: ROTATION_PLAN_BRIDGE_SCHEMA_VERSION,
    activity: "runtime_rotation_plan_bridge",
    status: candidate.outcome === "derived" ? "completed" : "rejected",
    result,
    warnings: [],
    errors,
    artifact_hashes:
      candidate.outcome === "derived" && derivedPlanDigest !== null
        ? [
            {
              artifact_id: candidate.plan.plan_id,
              hash: derivedPlanDigest,
              algorithm: "sha256"
            }
          ]
        : [],
    provenance,
    retryable: false,
    verification_status: "verified",
    trust_tier: "T2",
    parent_refs:
      candidate.source_plan_ref !== null && RRP_ID_FORMAT.test(candidate.source_plan_ref)
        ? [candidate.source_plan_ref]
        : [],
    artifact_refs: candidate.outcome === "derived" ? [candidate.plan.plan_id] : []
  };
}

function rejected(
  rejectionCode: RotationPlanBridgeRejectionCode,
  sourcePlanRef: string | null,
  sourcePlanDigest: Sha256Digest,
  structuralInputs: readonly string[]
): RejectedCandidate {
  return {
    outcome: "rejected",
    rejection_code: rejectionCode,
    source_plan_ref: sourcePlanRef,
    source_plan_digest: sourcePlanDigest,
    structural_inputs: [...structuralInputs]
  };
}

function rejectionMessage(code: RotationPlanBridgeRejectionCode): string {
  const messages: Record<RotationPlanBridgeRejectionCode, string> = {
    bridge_rejected_invalid_schema: "RuntimeRotationPlan or bridge binding schema is invalid.",
    bridge_rejected_authorship: "Plan authorship cannot authorize an RA-R1 executable plan.",
    bridge_rejected_reference_format: "Plan lineage or identity references are invalid.",
    bridge_rejected_unknown_role: "Plan requires a role absent from the current registry.",
    bridge_rejected_forbidden_transition: "Plan requires a transition forbidden by the current registry.",
    bridge_rejected_ungated_capability: "Plan declares side-effect or code-mutation capability unavailable to LE-2.",
    bridge_rejected_live_adapter_unavailable: "Live role adapters are unavailable to LE-2."
  };
  return messages[code];
}

function readStringField(input: unknown, field: string): string | null {
  if (!isObject(input)) {
    return null;
  }
  const value = input[field];
  return typeof value === "string" ? value : null;
}

function readMatchingField(
  input: unknown,
  field: string,
  format: RegExp
): string | null {
  const value = readStringField(input, field);
  return value !== null && format.test(value) ? value : null;
}

function digestValue(value: unknown): Sha256Digest {
  return `sha256:${createHash("sha256").update(stableStringify(value)).digest("hex")}`;
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

function uuidFromSeed(seed: string): string {
  const chars = createHash("sha256").update(seed).digest("hex").slice(0, 32).split("");
  chars[12] = "5";
  const variant = Number.parseInt(chars[16] ?? "0", 16);
  chars[16] = ((variant & 0x3) | 0x8).toString(16);
  const hex = chars.join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

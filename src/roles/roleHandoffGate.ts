import {
  listRoleContracts,
  type RegisteredRoleContract
} from "./roleContractRegistry.js";
import {
  validateRoleArtifact,
  validateRoleContract,
  validateRoleHandoffEnvelope
} from "./roleArtifactValidator.js";
import type {
  RoleArtifact,
  RoleAcceptanceStatus,
  RoleArtifactValidationError,
  RoleId
} from "./types/roleArtifact.js";
import type { RoleHandoffEnvelope, RoleHandoffStatus } from "./types/roleHandoff.js";

export type RoleHandoffGateStatus = "allowed" | "blocked" | "invalid";

export type RoleHandoffGateErrorCode =
  | "invalid_handoff_envelope"
  | "invalid_source_artifact"
  | "unknown_source_role"
  | "unknown_target_role"
  | "disallowed_target_role"
  | "artifact_role_mismatch"
  | "handoff_artifact_ref_mismatch"
  | "required_next_role_mismatch"
  | "acceptance_status_not_consumable"
  | "handoff_status_blocks_handoff"
  | "identity_mismatch"
  | "forbidden_content_detected"
  | "embedded_trace_not_allowed"
  | "embedded_context_not_allowed";

type RoleHandoffGateMessageErrorCode = Exclude<
  RoleHandoffGateErrorCode,
  "acceptance_status_not_consumable"
>;

export interface RoleHandoffGateMessageError {
  readonly code: RoleHandoffGateMessageErrorCode;
  readonly path: string;
  readonly message: string;
}

export interface RoleHandoffAcceptanceStatusIssue {
  readonly code: "acceptance_status_not_consumable";
  readonly check_index: 11;
  readonly path: "$.source_artifact.acceptance_status";
  readonly expected: readonly RoleAcceptanceStatus[];
  readonly actual: RoleAcceptanceStatus;
  readonly transition: {
    readonly source_role: RoleId;
    readonly target_role: RoleId;
  };
}

export type RoleHandoffGateError =
  | RoleHandoffGateMessageError
  | RoleHandoffAcceptanceStatusIssue;

export type RoleHandoffTransitionKey = `${RoleId}->${RoleId}`;

const ACCEPTED_ONLY = Object.freeze(["accepted"] as const);
const ACCEPTED_OR_NEEDS_REVISION = Object.freeze([
  "accepted",
  "needs_revision"
] as const);

export const ROLE_HANDOFF_CONSUMPTION_MATRIX = Object.freeze({
  "planner->implementer": ACCEPTED_ONLY,
  "planner->verifier": ACCEPTED_ONLY,
  "planner->critic": ACCEPTED_OR_NEEDS_REVISION,
  "planner->human_operator": ACCEPTED_OR_NEEDS_REVISION,
  "implementer->verifier": ACCEPTED_ONLY,
  "implementer->critic": ACCEPTED_ONLY,
  "implementer->synthesizer": ACCEPTED_ONLY,
  "implementer->human_operator": ACCEPTED_OR_NEEDS_REVISION,
  "verifier->critic": ACCEPTED_ONLY,
  "verifier->synthesizer": ACCEPTED_ONLY,
  "verifier->reporter": ACCEPTED_ONLY,
  "verifier->human_operator": ACCEPTED_OR_NEEDS_REVISION,
  "critic->planner": ACCEPTED_ONLY,
  "critic->implementer": ACCEPTED_ONLY,
  "critic->verifier": ACCEPTED_ONLY,
  "critic->synthesizer": ACCEPTED_ONLY,
  "critic->recovery": ACCEPTED_OR_NEEDS_REVISION,
  "critic->human_operator": ACCEPTED_OR_NEEDS_REVISION,
  "synthesizer->reporter": ACCEPTED_ONLY,
  "synthesizer->verifier": ACCEPTED_ONLY,
  "synthesizer->human_operator": ACCEPTED_OR_NEEDS_REVISION,
  "reporter->human_operator": ACCEPTED_OR_NEEDS_REVISION,
  "recovery->planner": ACCEPTED_ONLY,
  "recovery->implementer": ACCEPTED_ONLY,
  "recovery->verifier": ACCEPTED_ONLY,
  "recovery->human_operator": ACCEPTED_OR_NEEDS_REVISION,
  "human_operator->planner": ACCEPTED_ONLY,
  "human_operator->implementer": ACCEPTED_ONLY,
  "human_operator->verifier": ACCEPTED_ONLY,
  "human_operator->critic": ACCEPTED_ONLY,
  "human_operator->synthesizer": ACCEPTED_ONLY,
  "human_operator->reporter": ACCEPTED_ONLY,
  "human_operator->recovery": ACCEPTED_OR_NEEDS_REVISION
} as const satisfies Partial<
  Record<RoleHandoffTransitionKey, readonly RoleAcceptanceStatus[]>
>);

export interface RoleHandoffGateResult {
  readonly allowed: boolean;
  readonly status: RoleHandoffGateStatus;
  readonly errors: readonly RoleHandoffGateError[];
}

export interface ValidateRoleHandoffGateInput {
  readonly handoff: unknown;
  readonly source_artifact: unknown;
  readonly registry?: readonly RegisteredRoleContract[];
}

export function validateRoleHandoffGate(input: ValidateRoleHandoffGateInput): RoleHandoffGateResult {
  const invalidErrors: RoleHandoffGateError[] = [];
  const blockedErrors: RoleHandoffGateError[] = [];

  const handoffResult = validateRoleHandoffEnvelope(input.handoff);
  const handoffStructuralErrors = handoffResult.errors.filter((error) => !isContentValidatorError(error));
  if (handoffStructuralErrors.length > 0) {
    invalidErrors.push(...wrapValidatorErrors("invalid_handoff_envelope", handoffStructuralErrors));
  }

  const artifactResult = validateRoleArtifact(input.source_artifact);
  const artifactStructuralErrors = artifactResult.errors.filter((error) => !isContentValidatorError(error));
  if (artifactStructuralErrors.length > 0) {
    invalidErrors.push(...wrapValidatorErrors("invalid_source_artifact", artifactStructuralErrors));
  }

  if (handoffStructuralErrors.length === 0 && artifactStructuralErrors.length === 0) {
    const handoff = input.handoff as RoleHandoffEnvelope;
    const artifact = input.source_artifact as RoleArtifact;
    const registry = input.registry ?? listRoleContracts();
    const registryMap = buildRegistryMap(registry, invalidErrors);

    const sourceContract = registryMap.get(handoff.source_role);
    if (sourceContract === undefined) {
      invalidErrors.push({
        code: "unknown_source_role",
        path: "$.handoff.source_role",
        message: `Unknown source_role '${handoff.source_role}'.`
      });
    }

    const targetContract = registryMap.get(handoff.target_role);
    if (targetContract === undefined) {
      invalidErrors.push({
        code: "unknown_target_role",
        path: "$.handoff.target_role",
        message: `Unknown target_role '${handoff.target_role}'.`
      });
    }

    if (sourceContract !== undefined && targetContract !== undefined) {
      validateAllowedTransition(sourceContract, handoff, blockedErrors);
      validateArtifactRoleMatch(handoff, artifact, blockedErrors);
      validateArtifactReference(handoff, artifact, invalidErrors);
      validateRequiredNextRole(handoff, artifact, blockedErrors);
      validateIdentityFields(handoff, artifact, blockedErrors);
      validateAcceptanceStatus(handoff, artifact, blockedErrors);
      validateHandoffStatus(handoff.handoff_status, blockedErrors);
    }
  }

  pushForbiddenContentErrors(input.handoff, "$.handoff", blockedErrors);
  pushForbiddenContentErrors(input.source_artifact, "$.source_artifact", blockedErrors);

  if (invalidErrors.length > 0) {
    return { allowed: false, status: "invalid", errors: invalidErrors };
  }

  if (blockedErrors.length > 0) {
    return { allowed: false, status: "blocked", errors: blockedErrors };
  }

  return { allowed: true, status: "allowed", errors: [] };
}

function buildRegistryMap(
  registry: readonly RegisteredRoleContract[],
  errors: RoleHandoffGateError[]
): Map<RoleId, RegisteredRoleContract> {
  const map = new Map<RoleId, RegisteredRoleContract>();

  registry.forEach((entry, index) => {
    const contractResult = validateRoleContract(entry.contract);
    if (!contractResult.ok) {
      errors.push(
        ...wrapValidatorErrors("invalid_handoff_envelope", contractResult.errors, `$.registry[${index}].contract`)
      );
      return;
    }
    map.set(entry.contract.role_id, entry);
  });

  return map;
}

function validateAllowedTransition(
  sourceContract: RegisteredRoleContract,
  handoff: RoleHandoffEnvelope,
  errors: RoleHandoffGateError[]
): void {
  if (!sourceContract.allowed_next_roles.includes(handoff.target_role)) {
    errors.push({
      code: "disallowed_target_role",
      path: "$.handoff.target_role",
      message: `Role '${handoff.source_role}' is not allowed to hand off to '${handoff.target_role}'.`
    });
  }
}

function validateArtifactRoleMatch(
  handoff: RoleHandoffEnvelope,
  artifact: RoleArtifact,
  errors: RoleHandoffGateError[]
): void {
  if (artifact.role_id !== handoff.source_role) {
    errors.push({
      code: "artifact_role_mismatch",
      path: "$.source_artifact.role_id",
      message: "source_artifact.role_id must match handoff.source_role."
    });
  }
}

function validateArtifactReference(
  handoff: RoleHandoffEnvelope,
  artifact: RoleArtifact,
  errors: RoleHandoffGateError[]
): void {
  const refs = [
    ...(handoff.artifact_id === undefined ? [] : [handoff.artifact_id]),
    ...(handoff.artifact_refs ?? [])
  ];
  if (!refs.includes(artifact.artifact_id)) {
    errors.push({
      code: "handoff_artifact_ref_mismatch",
      path: "$.handoff.artifact_id",
      message: "Handoff must reference source_artifact.artifact_id."
    });
  }
}

function validateRequiredNextRole(
  handoff: RoleHandoffEnvelope,
  artifact: RoleArtifact,
  errors: RoleHandoffGateError[]
): void {
  if (artifact.required_next_role !== null && artifact.required_next_role !== handoff.target_role) {
    errors.push({
      code: "required_next_role_mismatch",
      path: "$.source_artifact.required_next_role",
      message: "source_artifact.required_next_role must be null or match handoff.target_role."
    });
  }
}

function validateIdentityFields(
  handoff: RoleHandoffEnvelope,
  artifact: RoleArtifact,
  errors: RoleHandoffGateError[]
): void {
  for (const field of ["task_id", "run_id", "trace_id", "context_id"] as const) {
    if (handoff[field] !== artifact[field]) {
      errors.push({
        code: "identity_mismatch",
        path: `$.${field}`,
        message: `${field} must match across handoff and source_artifact.`
      });
    }
  }
}

function validateAcceptanceStatus(
  handoff: RoleHandoffEnvelope,
  artifact: RoleArtifact,
  errors: RoleHandoffGateError[]
): void {
  const transition = `${handoff.source_role}->${handoff.target_role}` as RoleHandoffTransitionKey;
  const expected = readConsumableAcceptanceStatuses(transition);
  if (expected.includes(artifact.acceptance_status)) {
    return;
  }
  errors.push({
    code: "acceptance_status_not_consumable",
    check_index: 11,
    path: "$.source_artifact.acceptance_status",
    expected,
    actual: artifact.acceptance_status,
    transition: {
      source_role: handoff.source_role,
      target_role: handoff.target_role
    }
  });
}

function readConsumableAcceptanceStatuses(
  transition: RoleHandoffTransitionKey
): readonly RoleAcceptanceStatus[] {
  const matrix = ROLE_HANDOFF_CONSUMPTION_MATRIX as Partial<
    Record<RoleHandoffTransitionKey, readonly RoleAcceptanceStatus[]>
  >;
  return matrix[transition] ?? [];
}

function validateHandoffStatus(status: RoleHandoffStatus, errors: RoleHandoffGateError[]): void {
  if (status === "ready") {
    return;
  }
  errors.push({
    code: "handoff_status_blocks_handoff",
    path: "$.handoff.handoff_status",
    message: `handoff_status '${status}' is not allowed to pass the R3 gate.`
  });
}

function wrapValidatorErrors(
  code: "invalid_handoff_envelope" | "invalid_source_artifact",
  errors: readonly RoleArtifactValidationError[],
  pathPrefix?: string
): RoleHandoffGateError[] {
  return errors.map((error) => ({
    code,
    path: pathPrefix === undefined ? error.path : error.path.replace(/^\$/, pathPrefix),
    message: `${error.code}: ${error.message}`
  }));
}

function isContentValidatorError(error: RoleArtifactValidationError): boolean {
  return error.code === "forbidden_key" || error.code === "embedded_telemetry_events_forbidden";
}

function pushForbiddenContentErrors(
  value: unknown,
  path: string,
  blockedErrors: RoleHandoffGateError[]
): void {
  scanContent(value, path, blockedErrors);
}

function scanContent(
  value: unknown,
  path: string,
  blockedErrors: RoleHandoffGateError[],
  parentKey?: string
): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => scanContent(entry, `${path}[${index}]`, blockedErrors, parentKey));
    return;
  }

  if (typeof value !== "object" || value === null) {
    return;
  }

  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const childPath = `${path}.${key}`;
    if (isForbiddenReasoningOrRawInputKey(key)) {
      blockedErrors.push({
        code: "forbidden_content_detected",
        path: childPath,
        message: `Forbidden key '${key}' is not allowed in a role handoff gate input.`
      });
    }
    if (key === "telemetry_trace" || key === "telemetryTrace") {
      blockedErrors.push({
        code: "embedded_trace_not_allowed",
        path: childPath,
        message: "Embedded telemetry traces are forbidden; use ID-only references."
      });
    }
    if ((parentKey === "telemetry_trace" || parentKey === "telemetryTrace") && key === "events") {
      blockedErrors.push({
        code: "embedded_trace_not_allowed",
        path: childPath,
        message: "Embedded telemetry trace events are forbidden; use ID-only references."
      });
    }
    if (key === "execution_context" || key === "executionContext") {
      blockedErrors.push({
        code: "embedded_context_not_allowed",
        path: childPath,
        message: "Embedded execution contexts are forbidden; use ID-only references."
      });
    }
    scanContent(child, childPath, blockedErrors, key);
  }
}

function isForbiddenReasoningOrRawInputKey(key: string): boolean {
  return [
    "chain_of_thought",
    "chainOfThought",
    "hidden_chain_of_thought",
    "hiddenChainOfThought",
    "private_reasoning",
    "privateReasoning",
    "reasoning_transcript",
    "reasoningTranscript",
    "scratchpad",
    "raw_scratchpad",
    "rawScratchpad",
    "thought_log",
    "thoughtLog",
    "secrets",
    "credentials",
    "raw_file_contents",
    "rawFileContents",
    "hollow_input",
    "hollowInput",
    "input_payload",
    "inputPayload"
  ].includes(key);
}

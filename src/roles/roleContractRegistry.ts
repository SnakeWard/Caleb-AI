import {
  ROLE_ARTIFACT_SCHEMA_VERSION,
  ROLE_IDS,
  VALID_ROLE_ACCEPTANCE_STATUSES
} from "./types/roleArtifact.js";
import { validateRoleContract } from "./roleArtifactValidator.js";
import type {
  RoleArtifactType,
  RoleArtifactValidationError,
  RoleArtifactValidationResult,
  RoleId
} from "./types/roleArtifact.js";
import type { RoleContract } from "./types/roleContract.js";

export interface RegisteredRoleContract {
  readonly contract: RoleContract;
  readonly display_name: string;
  readonly description: string;
  readonly required_fields: readonly string[];
  readonly forbidden_fields: readonly string[];
  readonly allowed_next_roles: readonly RoleId[];
  readonly can_handoff_to_human: boolean;
}

const REQUIRED_ROLE_ARTIFACT_FIELDS = [
  "schema_version",
  "artifact_id",
  "artifact_type",
  "role_id",
  "task_id",
  "run_id",
  "trace_id",
  "context_id",
  "summary",
  "claims",
  "assumptions",
  "constraints",
  "open_questions",
  "recommendations",
  "evidence_refs",
  "confidence",
  "handoff_notes",
  "required_next_role",
  "acceptance_status",
  "created_at"
] as const;

const INHERITED_FORBIDDEN_FIELDS = [
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
  "inputPayload",
  "telemetry_trace.events",
  "telemetryTrace.events"
] as const;

const ROLE_CONTRACTS = [
  createRegisteredRoleContract({
    role_id: "planner",
    display_name: "Planner",
    description: "Produces bounded plans, sequencing notes, constraints, and recommended next roles.",
    allowed_artifact_types: ["plan"],
    allowed_next_roles: ["implementer", "verifier", "critic", "human_operator"],
    can_handoff_to_human: true
  }),
  createRegisteredRoleContract({
    role_id: "implementer",
    display_name: "Implementer",
    description: "Produces implementation notes without executing code or mutating workspace state.",
    allowed_artifact_types: ["implementation_notes"],
    allowed_next_roles: ["verifier", "critic", "synthesizer", "human_operator"],
    can_handoff_to_human: true
  }),
  createRegisteredRoleContract({
    role_id: "verifier",
    display_name: "Verifier",
    description: "Produces verification artifacts that summarize checks, evidence references, and blockers.",
    allowed_artifact_types: ["verification"],
    allowed_next_roles: ["critic", "synthesizer", "reporter", "human_operator"],
    can_handoff_to_human: true
  }),
  createRegisteredRoleContract({
    role_id: "critic",
    display_name: "Critic",
    description: "Produces critique artifacts that identify defects, risks, and revision requirements.",
    allowed_artifact_types: ["critique"],
    allowed_next_roles: ["planner", "implementer", "verifier", "synthesizer", "recovery", "human_operator"],
    can_handoff_to_human: true
  }),
  createRegisteredRoleContract({
    role_id: "synthesizer",
    display_name: "Synthesizer",
    description: "Produces synthesis artifacts that assemble accepted claims and evidence into a coherent result.",
    allowed_artifact_types: ["synthesis"],
    allowed_next_roles: ["reporter", "verifier", "human_operator"],
    can_handoff_to_human: true
  }),
  createRegisteredRoleContract({
    role_id: "reporter",
    display_name: "Reporter",
    description: "Produces report artifacts that summarize accepted status, residual limits, and next steps.",
    allowed_artifact_types: ["report"],
    allowed_next_roles: ["human_operator"],
    can_handoff_to_human: true
  }),
  createRegisteredRoleContract({
    role_id: "recovery",
    display_name: "Recovery",
    description: "Produces recovery plans for blocked or failed role artifact paths.",
    allowed_artifact_types: ["recovery_plan"],
    allowed_next_roles: ["planner", "implementer", "verifier", "human_operator"],
    can_handoff_to_human: true
  }),
  createRegisteredRoleContract({
    role_id: "human_operator",
    display_name: "Human Operator",
    description: "Produces human decision artifacts for explicit approval, rejection, or blocked-state resolution.",
    allowed_artifact_types: ["human_decision"],
    allowed_next_roles: ["planner", "implementer", "verifier", "critic", "synthesizer", "reporter", "recovery"],
    can_handoff_to_human: false
  })
] as const satisfies readonly RegisteredRoleContract[];

export function listRoleContracts(): readonly RegisteredRoleContract[] {
  return ROLE_CONTRACTS.map(copyRegisteredRoleContract);
}

export function getRoleContract(role_id: string): RegisteredRoleContract | undefined {
  const match = ROLE_CONTRACTS.find((entry) => entry.contract.role_id === role_id);
  return match === undefined ? undefined : copyRegisteredRoleContract(match);
}

export function hasRoleContract(role_id: string): boolean {
  return ROLE_CONTRACTS.some((entry) => entry.contract.role_id === role_id);
}

export function validateRoleContractRegistry(): RoleArtifactValidationResult {
  const errors: RoleArtifactValidationError[] = [];
  const seen = new Set<RoleId>();

  for (const entry of ROLE_CONTRACTS) {
    const contractResult = validateRoleContract(entry.contract);
    errors.push(...contractResult.errors);

    if (seen.has(entry.contract.role_id)) {
      errors.push({
        code: "duplicate_role_contract",
        path: `$.${entry.contract.role_id}`,
        message: `Duplicate role contract for '${entry.contract.role_id}'.`
      });
    }
    seen.add(entry.contract.role_id);

    for (const nextRole of entry.allowed_next_roles) {
      if (!ROLE_IDS.includes(nextRole)) {
        errors.push({
          code: "invalid_allowed_next_role",
          path: `$.${entry.contract.role_id}.allowed_next_roles`,
          message: `allowed_next_roles contains unknown RoleId '${nextRole}'.`
        });
      }
    }
  }

  for (const roleId of ROLE_IDS) {
    if (!seen.has(roleId)) {
      errors.push({
        code: "missing_role_contract",
        path: `$.${roleId}`,
        message: `Missing role contract for '${roleId}'.`
      });
    }
  }

  return { ok: errors.length === 0, errors };
}

function createRegisteredRoleContract(input: {
  readonly role_id: RoleId;
  readonly display_name: string;
  readonly description: string;
  readonly allowed_artifact_types: readonly RoleArtifactType[];
  readonly allowed_next_roles: readonly RoleId[];
  readonly can_handoff_to_human: boolean;
}): RegisteredRoleContract {
  return {
    contract: {
      schema_version: ROLE_ARTIFACT_SCHEMA_VERSION,
      role_id: input.role_id,
      allowed_artifact_types: input.allowed_artifact_types,
      allowed_acceptance_statuses: VALID_ROLE_ACCEPTANCE_STATUSES
    },
    display_name: input.display_name,
    description: input.description,
    required_fields: REQUIRED_ROLE_ARTIFACT_FIELDS,
    forbidden_fields: INHERITED_FORBIDDEN_FIELDS,
    allowed_next_roles: input.allowed_next_roles,
    can_handoff_to_human: input.can_handoff_to_human
  };
}

function copyRegisteredRoleContract(entry: RegisteredRoleContract): RegisteredRoleContract {
  return {
    contract: {
      schema_version: entry.contract.schema_version,
      role_id: entry.contract.role_id,
      allowed_artifact_types: [...entry.contract.allowed_artifact_types],
      allowed_acceptance_statuses: [...entry.contract.allowed_acceptance_statuses]
    },
    display_name: entry.display_name,
    description: entry.description,
    required_fields: [...entry.required_fields],
    forbidden_fields: [...entry.forbidden_fields],
    allowed_next_roles: [...entry.allowed_next_roles],
    can_handoff_to_human: entry.can_handoff_to_human
  };
}

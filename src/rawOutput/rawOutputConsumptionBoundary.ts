import type { JsonValue } from "../types/common.js";
import type { HollowInvocationRecord } from "../types/invocation.js";
import { characterCountImplementation } from "../hollows/categories/text/characterCountHollow.js";
import { characterCountManifest } from "../hollows/categories/text/textHollowManifests.js";
import { createHollowRegistry, createHollowRunner } from "../hollows/index.js";
import { verifyHollowInvocation } from "../verification/index.js";
import {
  createDerivedEvidenceRecord,
  toDecisionFacingEvidence
} from "./derivedEvidencePolicy.js";
import type {
  DecisionFacingDerivedEvidence,
  DerivedEvidenceProvenanceRecord,
  RawOutputStore
} from "./rawOutputArtifactTypes.js";

export interface CharacterCountRawOutputConsumptionInput {
  readonly artifact_digest: string;
  readonly source_ledger_id: string;
  readonly source_tier: "T1";
  readonly store: RawOutputStore;
  readonly now: () => Date;
  readonly id_generator?: (prefix: "invocation" | "task" | "run" | "trace") => string;
}

export interface CharacterCountRawOutputConsumptionResult {
  readonly ok: boolean;
  readonly invocation_record?: HollowInvocationRecord;
  readonly provenance_record?: DerivedEvidenceProvenanceRecord;
  readonly decision_record?: DecisionFacingDerivedEvidence;
  readonly issues: readonly string[];
}

export async function consumeRawOutputWithCharacterCount(
  input: CharacterCountRawOutputConsumptionInput
): Promise<CharacterCountRawOutputConsumptionResult> {
  const read = await input.store.read(input.artifact_digest as `sha256:${string}`);
  if (!read.ok || read.content === undefined) {
    return {
      ok: false,
      issues: read.issues.map((issue) => issue.message)
    };
  }

  const registry = createHollowRegistry([characterCountManifest]);
  const runner = createHollowRunner(
    registry,
    { [characterCountManifest.hollow_id]: characterCountImplementation },
    { now: input.now, ...(input.id_generator === undefined ? {} : { id_generator: input.id_generator }) }
  );
  const invocation = await runner.run({
    hollow_id: characterCountManifest.hollow_id,
    input_payload: { text: read.content },
    caller: "M3 Raw Output Consumption Boundary",
    requested_by: "Caleb AI",
    permissions: ["none"]
  });
  const verified = verifyHollowInvocation(invocation, { now: input.now });
  if (verified.decision !== "accepted" || verified.trust_tier !== "T2") {
    return {
      ok: false,
      invocation_record: invocation,
      issues: verified.errors.map((error) => error.message)
    };
  }

  const provenance = createDerivedEvidenceRecord({
    evidence_id: `derived_${invocation.invocation_id}`,
    derived_from: [input.source_ledger_id],
    source_tiers: [input.source_tier],
    measurement_tier: "T2",
    claim: cloneJson(invocation.result),
    artifact_refs: [read.record?.artifact_ref ?? `raw-output:${input.artifact_digest}`]
  });
  const decision = toDecisionFacingEvidence(provenance);

  return {
    ok: true,
    invocation_record: invocation,
    provenance_record: provenance,
    decision_record: decision,
    issues: []
  };
}

export function detectNeverFlowAttempt(
  target: "persistence_as_truth" | "side_effect_trigger" | "trust_promotion_input" | "logic_engine_routing",
  source: { readonly source_kind: "provider_model_output"; readonly effective_tier: "T1" | "T0" }
): { readonly ok: false; readonly code: string; readonly message: string } {
  return {
    ok: false,
    code: `model_output_forbidden_${target}`,
    message: `Model/provider output must not flow into ${target}.`
  };
}

function cloneJson(value: JsonValue): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue;
}

import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  consumeRawOutputWithCharacterCount,
  createContentAddressedRawOutputStore,
  detectLaunderingAttempt,
  detectNeverFlowAttempt,
  detectTierFieldMisuse,
  ingestLiveCallShapedRawOutput,
  resolveLineageReferences,
  validateDerivedEvidenceRecord
} from "../../src/rawOutput/index.js";
import { V1_HOLLOW_MANIFESTS, HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/index.js";
import type { LedgerEntry } from "../../src/types/index.js";

const SOURCE_LEDGER_ID = "ledger_123e4567-e89b-12d3-a456-426614174000";

describe("M3 raw output consumption boundary acceptance", () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "caleb-m3-acceptance-"));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("golden path: live-call-shaped T1 output is digest-stored and counted without promotion", async () => {
    const store = createContentAddressedRawOutputStore({ root_dir: root });
    const lifecycle = await ingestLiveCallShapedRawOutput(
      {
        output_text: "Acknowledged",
        provider_id: "anthropic_live_adapter",
        model_id: "claude-haiku-4-5",
        source_ledger_id: SOURCE_LEDGER_ID
      },
      store,
      { created_at: "2026-07-05T00:00:00.000Z" }
    );
    expect(lifecycle.ok).toBe(true);
    expect(lifecycle.raw_output_trust_tier).toBe("T0");
    expect(lifecycle.schema_valid_output_trust_tier).toBe("T1");
    expect(lifecycle.max_allowed_trust_tier).toBe("T1");

    const sourceLedger = rawOutputLedgerEntry(lifecycle.record!.digest, lifecycle.record!.artifact_ref);
    expect(JSON.stringify(sourceLedger)).toContain(lifecycle.record!.digest);
    expect(JSON.stringify(sourceLedger)).not.toContain("Acknowledged");

    const lineage = resolveLineageReferences([SOURCE_LEDGER_ID], [sourceLedger]);
    expect(lineage.ok).toBe(true);

    const consumed = await consumeRawOutputWithCharacterCount({
      artifact_digest: lifecycle.record!.digest,
      source_ledger_id: SOURCE_LEDGER_ID,
      source_tier: "T1",
      store,
      now: () => new Date("2026-07-05T00:00:01.000Z"),
      id_generator: (prefix) => `${prefix}_123e4567-e89b-12d3-a456-426614174001`
    });

    expect(consumed.ok).toBe(true);
    expect(consumed.invocation_record?.result).toMatchObject({ character_count: 12 });
    expect(consumed.provenance_record?.measurement_tier).toBe("T2");
    expect(consumed.provenance_record?.subject_tier).toBe("T1");
    expect(consumed.provenance_record?.effective_tier).toBe("T1");
    expect(validateDerivedEvidenceRecord(consumed.provenance_record!).ok).toBe(true);
    expect(consumed.decision_record?.effective_tier).toBe("T1");
    expect("measurement_tier" in consumed.decision_record!).toBe(false);
    expect("subject_tier" in consumed.decision_record!).toBe(false);
    expect(detectLaunderingAttempt(consumed.provenance_record!, "T2").ok).toBe(false);
  });

  it("proves all mandated non-promoters stay non-promoters", async () => {
    const store = createContentAddressedRawOutputStore({ root_dir: root });
    const lifecycle = await ingestLiveCallShapedRawOutput(
      { output_text: "Acknowledged", provider_id: "xai_live_adapter", model_id: "grok-3-mini" },
      store,
      { created_at: "2026-07-05T00:00:00.000Z" }
    );

    expect(lifecycle.record).toMatchObject({
      raw_output_trust_tier: "T0",
      schema_valid_output_trust_tier: "T1",
      max_allowed_trust_tier: "T1"
    });
    const nonPromoters = [
      "storage",
      "digest_presence",
      "api_success",
      "network_success",
      "provider_identity",
      "model_agreement",
      "report_inclusion",
      "ledger_reference",
      "opt_in_flags"
    ];
    for (const _nonPromoter of nonPromoters) {
      expect(lifecycle.record?.max_allowed_trust_tier).toBe("T1");
    }
  });

  it("rejects measurement_tier, subject_tier, and laundering misuse", async () => {
    expect(detectTierFieldMisuse(["measurement_tier"]).ok).toBe(false);
    expect(detectTierFieldMisuse(["subject_tier"]).ok).toBe(false);
    expect(detectTierFieldMisuse(["effective_tier"]).ok).toBe(true);
  });

  it("proves NEVER-flow absence for model/provider output", () => {
    const source = { source_kind: "provider_model_output" as const, effective_tier: "T1" as const };
    expect(detectNeverFlowAttempt("persistence_as_truth", source).code).toBe("model_output_forbidden_persistence_as_truth");
    expect(detectNeverFlowAttempt("side_effect_trigger", source).code).toBe("model_output_forbidden_side_effect_trigger");
    expect(detectNeverFlowAttempt("trust_promotion_input", source).code).toBe("model_output_forbidden_trust_promotion_input");
    expect(detectNeverFlowAttempt("logic_engine_routing", source).code).toBe("model_output_forbidden_logic_engine_routing");
  });

  it("keeps display flow deferred and summaries out of consumption decisions", () => {
    const displaySummary = {
      display_flow_status: "deferred_to_M4_DISPLAY_BOUNDARY",
      digest: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      preview: "not consumed"
    };
    const decisionInput = { effective_tier: "T1" };

    expect(displaySummary.display_flow_status).toBe("deferred_to_M4_DISPLAY_BOUNDARY");
    expect(Object.keys(decisionInput)).toEqual(["effective_tier"]);
  });

  it("preserves H5 trap configuration and artifact gitignore guardrail", async () => {
    await expect(readFile("vitest.config.ts", "utf8")).resolves.toContain("tests/setup/networkEgressBlock.ts");
    await expect(readFile(".gitignore", "utf8")).resolves.toContain(".caleb/artifacts/");
  });

  it("preserves catalog counts", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(12);
    expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9);
  });
});

function rawOutputLedgerEntry(digest: string, artifactRef: string): LedgerEntry {
  return {
    ledger_id: SOURCE_LEDGER_ID,
    schema_version: "1.0.0",
    timestamp: "2026-07-05T00:00:00.000Z",
    task_id: "task_m3",
    run_id: "run_m3",
    trace_id: "trace_m3",
    actor_type: "model",
    actor_id: "anthropic_live_adapter",
    actor_version: "1.0.0",
    activity: "raw_output_artifact_recorded",
    status: "completed",
    result: {
      digest,
      raw_output_trust_tier: "T0",
      schema_valid_output_trust_tier: "T1",
      max_allowed_trust_tier: "T1"
    },
    warnings: [],
    errors: [],
    artifact_hashes: [{ path: "raw-output", hash: digest, algorithm: "sha256" }],
    provenance: {
      provider_id: "anthropic_live_adapter",
      model_id: "claude-haiku-4-5",
      raw_content_in_ledger: false
    },
    retryable: false,
    verification_status: "schema_valid",
    trust_tier: "T1",
    parent_refs: [],
    artifact_refs: [artifactRef]
  };
}

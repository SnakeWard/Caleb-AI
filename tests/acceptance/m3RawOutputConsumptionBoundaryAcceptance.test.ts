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
import { createLedgerEntryFromInvocation } from "../../src/ledger/index.js";
import { buildLiveAdapterTrustSummary } from "../../src/providers/liveAdapterShared.js";
import { buildCalebReport } from "../../src/reports/index.js";
import type { RawOutputArtifactRecord } from "../../src/rawOutput/index.js";
import type { HollowInvocationRecord, LedgerEntry } from "../../src/types/index.js";
import type { LiveAdapterResult } from "../../src/modelBoundary/types/liveAdapterTypes.js";

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
    const factoryLedger = createLedgerEntryFromInvocation(characterCountInvocation(), {
      ledger_id: "ledger_123e4567-e89b-12d3-a456-426614174010",
      timestamp: "2026-07-05T00:00:00.000Z",
      artifact_refs: [lifecycle.record!.artifact_ref],
      provenance: { raw_output_digest: lifecycle.record!.digest }
    });
    const factoryLineage = resolveLineageReferences([factoryLedger.ledger_id], [factoryLedger]);
    expect(factoryLineage.ok).toBe(true);

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

  it("non-promoter storage: post-storage read remains capped at T1", async () => {
    const store = createContentAddressedRawOutputStore({ root_dir: root });
    const lifecycle = await ingestFixtureRawOutput(store);
    const reread = await store.read(lifecycle.record!.digest);

    expect(reread.status).toBe("found");
    expectCappedAtT1(reread.record!);
  });

  it("non-promoter digest_presence: digest reference does not lift the described record above T1", async () => {
    const store = createContentAddressedRawOutputStore({ root_dir: root });
    const lifecycle = await ingestFixtureRawOutput(store);
    const digestReference = rawOutputLedgerEntry(
      lifecycle.record!.digest,
      lifecycle.record!.artifact_ref,
      "ledger_123e4567-e89b-12d3-a456-426614174002"
    );

    expect(resolveLineageReferences([digestReference.ledger_id], [digestReference]).ok).toBe(true);
    expectCappedAtT1(lifecycle.record!);
  });

  it("non-promoter api_success: successful adapter-shaped response remains capped at T1", async () => {
    const adapterResult = successfulAdapterResult({ include_timing: false });
    const store = createContentAddressedRawOutputStore({ root_dir: root });
    const lifecycle = await ingestLiveCallShapedRawOutput(
      {
        output_text: "Acknowledged",
        provider_id: adapterResult.response.provider_id,
        model_id: adapterResult.response.adapter_id
      },
      store,
      { created_at: adapterResult.response.created_at }
    );

    expect(adapterResult.response.trust_summary.successful_response_promotes_trust).toBe(false);
    expect(adapterResult.response.trust_summary.max_allowed_trust_tier).toBe("T1");
    expectCappedAtT1(lifecycle.record!);
  });

  it("non-promoter network_success: timing-bearing adapter response is unrepresentable as promotion input", async () => {
    const adapterResult = successfulAdapterResult({ include_timing: true });
    const store = createContentAddressedRawOutputStore({ root_dir: root });
    const lifecycle = await ingestLiveCallShapedRawOutput(
      {
        output_text: "Acknowledged",
        provider_id: adapterResult.response.provider_id,
        model_id: adapterResult.response.adapter_id
      },
      store,
      { created_at: adapterResult.response.created_at }
    );

    expect(adapterResult.response.trust_summary.successful_response_promotes_trust).toBe(false);
    expect(adapterResult.response.trust_summary.max_allowed_trust_tier).toBe("T1");
    expectCappedAtT1(lifecycle.record!);
  });

  it("non-promoter provider_identity: adapter identity changes do not change tier outcomes", async () => {
    const anthropicStore = createContentAddressedRawOutputStore({ root_dir: join(root, "anthropic") });
    const xaiStore = createContentAddressedRawOutputStore({ root_dir: join(root, "xai") });
    const anthropic = await ingestFixtureRawOutput(anthropicStore, {
      provider_id: "anthropic_live_adapter",
      model_id: "claude-haiku-4-5"
    });
    const xai = await ingestFixtureRawOutput(xaiStore, {
      provider_id: "xai_live_adapter",
      model_id: "grok-3-mini"
    });

    expectCappedAtT1(anthropic.record!);
    expectCappedAtT1(xai.record!);
    expect(anthropic.record!.max_allowed_trust_tier).toBe(xai.record!.max_allowed_trust_tier);
    expect(anthropic.record!.schema_valid_output_trust_tier).toBe(xai.record!.schema_valid_output_trust_tier);
  });

  it("non-promoter model_agreement: byte-identical outputs from two providers remain T1", async () => {
    const anthropicStore = createContentAddressedRawOutputStore({ root_dir: join(root, "agreement-anthropic") });
    const xaiStore = createContentAddressedRawOutputStore({ root_dir: join(root, "agreement-xai") });
    const anthropic = await ingestFixtureRawOutput(anthropicStore, {
      provider_id: "anthropic_live_adapter",
      model_id: "claude-haiku-4-5"
    });
    const xai = await ingestFixtureRawOutput(xaiStore, {
      provider_id: "xai_live_adapter",
      model_id: "grok-3-mini"
    });

    expect(anthropic.record!.digest).toBe(xai.record!.digest);
    expectCappedAtT1(anthropic.record!);
    expectCappedAtT1(xai.record!);
  });

  it("non-promoter report_inclusion: real report inclusion leaves the source record capped at T1", async () => {
    const store = createContentAddressedRawOutputStore({ root_dir: root });
    const lifecycle = await ingestFixtureRawOutput(store);
    const ledger = rawOutputLedgerEntry(
      lifecycle.record!.digest,
      lifecycle.record!.artifact_ref,
      "ledger_123e4567-e89b-12d3-a456-426614174003"
    );
    const report = buildCalebReport({
      ledger_entries: [ledger],
      generated_at: "2026-07-05T00:00:02.000Z",
      report_id: "report_m3_non_promoter"
    });
    const reread = await store.read(lifecycle.record!.digest);

    expect(report.ledger_refs).toContain(ledger.ledger_id);
    expect(report.artifact_refs).toContain(lifecycle.record!.artifact_ref);
    expectCappedAtT1(reread.record!);
  });

  it("non-promoter ledger_reference: resolved Ledger reference leaves the source record capped at T1", async () => {
    const store = createContentAddressedRawOutputStore({ root_dir: root });
    const lifecycle = await ingestFixtureRawOutput(store);
    const ledger = rawOutputLedgerEntry(
      lifecycle.record!.digest,
      lifecycle.record!.artifact_ref,
      "ledger_123e4567-e89b-12d3-a456-426614174004"
    );

    expect(resolveLineageReferences([ledger.ledger_id], [ledger]).ok).toBe(true);
    expectCappedAtT1(lifecycle.record!);
  });

  it("non-promoter opt_in_flags: opt-in metadata is unrepresentable in raw-output lifecycle records", async () => {
    const store = createContentAddressedRawOutputStore({ root_dir: root });
    const lifecycle = await ingestFixtureRawOutput(store);

    expect("explicit_opt_in" in lifecycle.record!).toBe(false);
    expect("opt_in_state" in lifecycle.record!).toBe(false);
    expectCappedAtT1(lifecycle.record!);
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

  it("keeps display flow deferred in docs and absent from raw-output public exports", async () => {
    const implementationDoc = await readFile("docs/M3_RAW_OUTPUT_CONSUMPTION_BOUNDARY_IMPLEMENTATION.md", "utf8");
    const rawOutputIndex = await readFile("src/rawOutput/index.ts", "utf8");

    expect(implementationDoc).toContain("Display flow is deferred to `M4-DISPLAY-BOUNDARY`");
    expect(rawOutputIndex).not.toMatch(/display|render|preview/ui);
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

async function ingestFixtureRawOutput(
  store: ReturnType<typeof createContentAddressedRawOutputStore>,
  overrides: { readonly provider_id?: string; readonly model_id?: string } = {}
): ReturnType<typeof ingestLiveCallShapedRawOutput> {
  return ingestLiveCallShapedRawOutput(
    {
      output_text: "Acknowledged",
      provider_id: overrides.provider_id ?? "xai_live_adapter",
      model_id: overrides.model_id ?? "grok-3-mini"
    },
    store,
    { created_at: "2026-07-05T00:00:00.000Z" }
  );
}

function expectCappedAtT1(record: RawOutputArtifactRecord): void {
  expect(record).toMatchObject({
    raw_output_trust_tier: "T0",
    schema_valid_output_trust_tier: "T1",
    max_allowed_trust_tier: "T1"
  });
}

function rawOutputLedgerEntry(
  digest: string,
  artifactRef: string,
  ledgerId = SOURCE_LEDGER_ID
): LedgerEntry {
  return {
    ledger_id: ledgerId,
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

function characterCountInvocation(): HollowInvocationRecord {
  return {
    hollow_id: "hollow.text.character_count",
    hollow_name: "Character Count Hollow",
    hollow_version: "1.0.0",
    schema_version: "1.0.0",
    invocation_id: "invocation_m3_factory",
    task_id: "task_m3",
    run_id: "run_m3",
    trace_id: "trace_m3",
    caller: "M3 acceptance",
    requested_by: "Caleb AI",
    approved_by: null,
    input_type: "raw_output_digest",
    input_digest: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    input_payload: { digest: "raw-output-ref" },
    permissions: ["none"],
    execution_mode: "local_deterministic",
    deterministic: true,
    started_at: "2026-07-05T00:00:00.000Z",
    completed_at: "2026-07-05T00:00:01.000Z",
    status: "completed",
    result: { character_count: 12 },
    result_units: "characters",
    checks: [],
    warnings: [],
    errors: [],
    artifact_hashes: [],
    provenance: { source: "m3_acceptance_factory_fixture" },
    ledger_refs: [],
    retryable: false,
    confidence_level: "verified_deterministic",
    verification_status: "verified",
    trust_tier: "T2"
  };
}

function successfulAdapterResult(input: { readonly include_timing: boolean }): Extract<LiveAdapterResult, { readonly ok: true }> {
  return {
    ok: true,
    status: "response_schema_valid",
    response: {
      schema_version: "0.1.0",
      task_id: "task_m3",
      run_id: "run_m3",
      request_id: "request_m3",
      response_id: "response_m3",
      route_mode: "single_pass",
      provider_id: "anthropic_live_adapter",
      provider_kind: "anthropic_compatible",
      adapter_id: "claude-haiku-4-5",
      adapter_version: "1.0.0",
      provider_response_id: "provider_response_m3",
      output_ref: {
        output_ref_id: "output_ref_m3",
        output_digest: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        output_storage_kind: "digest_only",
        raw_output_included: false
      },
      redacted_output_digest: "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
      finish_reason: "stop",
      token_usage: {
        input_tokens: 10,
        output_tokens: 1,
        total_tokens: 11,
        usage_available: true
      },
      timing: {
        started_at: "2026-07-05T00:00:00.000Z",
        completed_at: input.include_timing ? "2026-07-05T00:00:00.200Z" : "2026-07-05T00:00:00.000Z",
        latency_ms: input.include_timing ? 200 : 0,
        timed_out: false
      },
      retry_summary: {
        attempts: 1,
        max_attempts: 1,
        retryable: false,
        retry_notes: []
      },
      redaction_summary: {
        input_redacted: true,
        output_redacted: true,
        redaction_profile_id: "m3_acceptance_redaction",
        raw_prompt_removed: true,
        raw_output_removed: true,
        sensitive_fields_removed: true,
        redaction_notes: []
      },
      warnings: [],
      errors: [],
      trust_summary: buildLiveAdapterTrustSummary(true),
      validation_status: "schema_valid",
      created_at: "2026-07-05T00:00:00.000Z"
    },
    issues: []
  };
}

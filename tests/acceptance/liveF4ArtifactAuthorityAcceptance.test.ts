import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  buildLiveRoleArtifact,
  validateLiveRoleArtifactEnvelope
} from "../../src/logicEngine/liveRoleArtifactEnvelope.js";
import {
  createLiveRotationRoleRuntimeAdapter,
  LiveRotationRunBudgetTracker,
  type LiveRotationPromptTemplate,
  type LiveRotationProviderInvoker
} from "../../src/logicEngine/liveRotationRuntimeAdapter.js";
import { bridgeRuntimeRotationPlan } from "../../src/logicEngine/rotationPlanBridge.js";
import {
  executeBridgedRotationAtSeam,
  reconstructRotationChainFromLedgerJsonl
} from "../../src/logicEngine/rotationExecutionSeam.js";
import { validateLedgerEntry } from "../../src/ledger/ledgerValidation.js";
import type { ContractValidatedTaskFrameRouteInput } from "../../src/logicEngine/types/routeInput.js";
import type { LiveAdapterResult } from "../../src/modelBoundary/types/liveAdapterTypes.js";
import {
  buildAnthropicLiveAdapterRequest,
  createAnthropicLiveAdapter,
  DEFAULT_ANTHROPIC_LIVE_ADAPTER_CONFIG,
  evaluateOneProviderAdapterLivePrerequisites
} from "../../src/providers/index.js";
import { computeSha256Digest } from "../../src/providers/liveAdapterShared.js";
import {
  ContentAddressedRawOutputStore,
  resolveRawOutputDigestReferences
} from "../../src/rawOutput/index.js";
import type {
  RoleRuntimeAdapter,
  RoleRuntimeAdapterInvokeInput
} from "../../src/roleRuntime/types/roleRuntimeAdapter.js";
import { validateRoleArtifact } from "../../src/roles/roleArtifactValidator.js";
import type { LiveRoleSemanticPayload } from "../../src/roles/types/liveRoleSemanticPayload.js";
import type { Sha256Digest } from "../../src/types/common.js";
import type { LedgerEntry } from "../../src/types/ledger.js";

const roots: string[] = [];
afterEach(async () => Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))));

const NOW = "2026-07-19T14:00:00.000Z";

function payload(label: string): LiveRoleSemanticPayload {
  return {
    summary: `${label} semantic contribution`,
    claims: [{ claim_id: `${label}_claim`, text: `${label} claim`, evidence_ref_ids: [] }],
    assumptions: [],
    constraints: ["Remain bounded."],
    open_questions: [],
    recommendations: [`Review ${label}.`],
    evidence_refs: [],
    confidence: 0.75,
    handoff_notes: [],
    acceptance_status: "accepted"
  };
}

function invocation(role_id: "planner" | "critic" = "planner"): RoleRuntimeAdapterInvokeInput {
  return {
    plan_id: "plan_live_f4",
    task_id: "task_223e4567-e89b-42d3-a456-426614174101",
    run_id: "run_223e4567-e89b-42d3-a456-426614174102",
    trace_id: "trace_live_f4",
    context_id: "context_live_f4",
    step_index: role_id === "planner" ? 0 : 1,
    role_id,
    adapter_id: "anthropic_live_adapter",
    adapter_kind: "live",
    context_text: "",
    context_refs: []
  };
}

async function bridgedFixture() {
  const wrapper = JSON.parse(
    await readFile("examples/live-rotation/event-e1.anthropic.fixture.json", "utf8")
  ) as Record<string, any>;
  const bridge = await bridgeRuntimeRotationPlan({
    carrier: wrapper.carrier as ContractValidatedTaskFrameRouteInput,
    runtime_rotation_plan: wrapper.runtime_rotation_plan,
    adapter_bindings: wrapper.adapter_bindings,
    append_ledger_entry: () => true,
    decided_at: NOW
  });
  expect(bridge.ok).toBe(true);
  if (!bridge.ok) throw new Error("LIVE-F4 bridge fixture failed.");
  const evidence = bridge.derived_plan.live_rotation_gate_evidence;
  if (evidence === undefined) throw new Error("LIVE-F4 evidence missing.");
  const templates = new Map<"planner" | "critic", LiveRotationPromptTemplate>();
  for (const role of ["planner", "critic"] as const) {
    const ref = evidence.prompt_templates[role];
    const text = (await readFile(ref.path, "utf8")).replaceAll("\r\n", "\n");
    templates.set(role, {
      role_id: role,
      template_text: text,
      expected_digest: computeSha256Digest(text)
    });
  }
  return { bridge, evidence, templates };
}

describe("LIVE-F4 artifact authority acceptance", () => {
  it("constructs authoritative envelopes and classifies envelope and identity defects separately", () => {
    const built = buildLiveRoleArtifact({
      payload: payload("planner"),
      invocation: invocation(),
      created_at: NOW,
      artifact_id_factory: () => "artifact_11111111-1111-4111-8111-111111111111"
    });
    expect(validateRoleArtifact(built).ok).toBe(true);
    expect(built).toMatchObject({
      schema_version: "0.1.0",
      artifact_id: "artifact_11111111-1111-4111-8111-111111111111",
      artifact_type: "plan",
      role_id: "planner",
      task_id: invocation().task_id,
      required_next_role: "critic",
      created_at: NOW
    });
    expect(validateLiveRoleArtifactEnvelope({ ...built, summary: null }, invocation())).toMatchObject({
      ok: false,
      detail: { stage: "envelope_validation" }
    });
    expect(validateLiveRoleArtifactEnvelope({ ...built, required_next_role: null }, invocation())).toEqual({
      ok: false,
      detail: {
        stage: "identity_mismatch",
        issues: [{ code: "invocation_identity_mismatch", path: "$.required_next_role" }]
      }
    });
  });

  it("stores two artifacts, Ledgers their derivation, reconstructs it, and walks it through M3", async () => {
    const { bridge, evidence, templates } = await bridgedFixture();
    const root = await mkdtemp(join(tmpdir(), "caleb-live-f4-success-"));
    roots.push(root);
    const store = new ContentAddressedRawOutputStore({ root_dir: root });
    const tracker = new LiveRotationRunBudgetTracker(evidence.run_budget);
    const rawTexts = [JSON.stringify(payload("planner")), JSON.stringify(payload("critic"))];
    let calls = 0;
    const invoker: LiveRotationProviderInvoker = async (input) => {
      const text = rawTexts[calls];
      if (text === undefined) throw new Error("Unexpected provider call.");
      calls += 1;
      expect((await input.normalized_output_observer(text, {
        output_digest: computeSha256Digest(text),
        finish_reason: "end_turn",
        output_tokens: 1
      })).ok).toBe(true);
      return {
        ok: true,
        status: "response_schema_valid",
        issues: [],
        response: {
          provider_response_id: `provider_response_${calls}`,
          output_ref: { output_digest: computeSha256Digest(text) },
          token_usage: { input_tokens: 10, output_tokens: 20, total_tokens: 30 },
          timing: { latency_ms: 7 }
        }
      } as unknown as LiveAdapterResult;
    };
    let artifactOrdinal = 0;
    const live = createLiveRotationRoleRuntimeAdapter({
      adapter_id: "anthropic_live_adapter",
      evidence,
      bindings: evidence.role_bindings,
      prompt_templates: templates,
      store,
      invoke_provider: invoker,
      now: () => NOW,
      artifact_id_factory: () => `artifact_00000000-0000-4000-8000-${String(++artifactOrdinal).padStart(12, "0")}`
    }, tracker);
    const result = await executeBridgedRotationAtSeam({
      plan: bridge.derived_plan,
      human_confirmed: true,
      bridge_ledger_entries: [bridge.ledger_entry],
      adapters: new Map<string, RoleRuntimeAdapter>([["anthropic_live_adapter", live]]),
      store,
      append_ledger_entry: () => true,
      now: () => NOW,
      execution_id_factory: () => "execution_44444444-4444-4444-8444-444444444444"
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(calls).toBe(2);
    expect(result.execution_result.records).toHaveLength(2);
    expect(result.ledger_entries.every((entry) => validateLedgerEntry(entry).valid)).toBe(true);
    const liveState = tracker.state();

    for (let index = 0; index < 2; index += 1) {
      const record = result.execution_result.records[index]!;
      const telemetry = liveState.invocations[index]!;
      const rawDigest = telemetry.observed_store_digest!;
      expect(record.derived_from).toEqual([rawDigest]);
      expect(record.artifact_digest).not.toBe(rawDigest);
      expect(await resolveRawOutputDigestReferences(record.derived_from!, store)).toEqual({
        ok: true,
        resolved_refs: [rawDigest],
        issues: []
      });
      const raw = await store.read(rawDigest);
      const canonical = await store.read(record.artifact_digest);
      expect(raw.content).toBe(rawTexts[index]);
      expect(canonical.content).toBeDefined();
      const artifact = JSON.parse(canonical.content!);
      expect(validateRoleArtifact(artifact).ok).toBe(true);
      expect(artifact.artifact_id).toBe(record.artifact_id);
      expect(artifact.required_next_role).toBe(index === 0 ? "critic" : null);
    }

    const invocationEntries = result.ledger_entries.filter(
      (entry) => entry.activity === "rotation_role_invocation"
    );
    expect(invocationEntries).toHaveLength(2);
    invocationEntries.forEach((entry, index) => {
      const derivedFrom = result.execution_result.records[index]!.derived_from!;
      expect(entry.provenance["derived_from"]).toEqual(derivedFrom);
      expect((entry.result as Record<string, unknown>)["derived_from"]).toEqual(derivedFrom);
      expect(entry.artifact_refs).toContain(`raw-output:${derivedFrom[0]}`);
    });

    const jsonl = [bridge.ledger_entry, ...result.ledger_entries]
      .map((entry) => JSON.stringify(entry))
      .join("\n");
    const reconstructed = reconstructRotationChainFromLedgerJsonl(
      jsonl,
      bridge.derived_plan.plan_id,
      result.execution_id
    );
    expect(reconstructed.ok).toBe(true);
    if (reconstructed.ok) {
      expect(reconstructed.chain.invocations.map((entry) => entry.derived_from)).toEqual(
        result.execution_result.records.map((record) => record.derived_from)
      );
    }
    const firstInvocationIndex = result.ledger_entries.findIndex(
      (entry) => entry.activity === "rotation_role_invocation"
    );
    const tamperedEntries = result.ledger_entries.map((entry, index) =>
      index === firstInvocationIndex
        ? {
            ...entry,
            result: {
              ...(entry.result as Record<string, unknown>),
              derived_from: [`sha256:${"f".repeat(64)}`]
            }
          }
        : entry
    );
    const tamperedJsonl = [bridge.ledger_entry, ...tamperedEntries]
      .map((entry) => JSON.stringify(entry))
      .join("\n");
    expect(
      reconstructRotationChainFromLedgerJsonl(
        tamperedJsonl,
        bridge.derived_plan.plan_id,
        result.execution_id
      ).ok
    ).toBe(false);
    expect(JSON.stringify(result.ledger_entries)).not.toContain(rawTexts[0]);
    expect(JSON.stringify(result.ledger_entries)).not.toContain(rawTexts[1]);
  });

  it("preserves billable HTTP-success telemetry on observer rejection and halts before Critic", async () => {
    const { bridge, evidence, templates } = await bridgedFixture();
    const root = await mkdtemp(join(tmpdir(), "caleb-live-f4-observer-failure-"));
    roots.push(root);
    const store = new ContentAddressedRawOutputStore({ root_dir: root });
    const tracker = new LiveRotationRunBudgetTracker(evidence.run_budget);
    const outputMarker = "attempt-three-invalid-json-marker";
    let fetchCalls = 0;
    const prerequisites = evaluateOneProviderAdapterLivePrerequisites({
      repo_root_confirmed: true,
      explicit_opt_in: true,
      explicit_live_request: true,
      provider_adapter_allowlisted: true,
      live_harness_allowlisted: true,
      credential_source_declared_by_caller: true,
      credential_auto_read: false,
      network_permission_granted_by_caller: true,
      explicit_live_command_or_flag: true,
      dry_run_report_completed: true,
      default_tests_non_live: true,
      default_acceptance_non_live: true,
      default_ci_non_live: true,
      provider_output_trust_ceiling: "T1",
      vrp_evidence_required_for_T2: true
    });
    const invoker: LiveRotationProviderInvoker = async (input) => {
      const binding = evidence.role_bindings[0]!;
      const config = {
        ...DEFAULT_ANTHROPIC_LIVE_ADAPTER_CONFIG,
        model: binding.model_id,
        max_response_bytes: input.budget.max_response_bytes,
        limits: {
          timeout_ms: input.budget.timeout_ms,
          max_output_tokens: input.budget.max_tokens,
          retry_count: 0,
          temperature_allowed: false,
          streaming_allowed: false
        }
      };
      const request = buildAnthropicLiveAdapterRequest({
        prompt_text: input.prompt_text,
        config,
        task_id: input.task_id,
        run_id: input.run_id
      });
      return createAnthropicLiveAdapter(config, {
        prerequisites_evaluation: prerequisites,
        kill_switch_open: true,
        network_permission_granted_by_caller: true,
        approved_by: "live-f4-offline-fixture"
      }, {
        credential_provider: () => "test-only-key",
        normalized_output_observer: input.normalized_output_observer,
        fetch_impl: (async () => {
          fetchCalls += 1;
          return new Response(JSON.stringify({
            id: "msg_live_f4_observer_failure",
            type: "message",
            role: "assistant",
            model: "claude-haiku-4-5",
            content: [{ type: "text", text: outputMarker }],
            stop_reason: "end_turn",
            usage: { input_tokens: 11, output_tokens: 7 }
          }), { status: 200 });
        }) as typeof fetch
      }).invokeLive({ request, prompt_text: input.prompt_text });
    };
    const live = createLiveRotationRoleRuntimeAdapter({
      adapter_id: "anthropic_live_adapter",
      evidence,
      bindings: evidence.role_bindings,
      prompt_templates: templates,
      store,
      invoke_provider: invoker,
      now: () => NOW
    }, tracker);
    const result = await executeBridgedRotationAtSeam({
      plan: bridge.derived_plan,
      human_confirmed: true,
      bridge_ledger_entries: [bridge.ledger_entry],
      adapters: new Map<string, RoleRuntimeAdapter>([["anthropic_live_adapter", live]]),
      store,
      append_ledger_entry: () => true,
      now: () => NOW
    });
    expect(result.ok).toBe(false);
    expect(result.failure_code).toBe("live_observer_artifact_invalid");
    expect(fetchCalls).toBe(1);
    const terminal = result.ledger_entries.find((entry) => entry.activity === "rotation_execution_failed")!;
    const recorded = (terminal.result as Record<string, any>).live_invocations[0];
    expect(recorded).toMatchObject({
      step_index: 0,
      role_id: "planner",
      provider_response_id: "msg_live_f4_observer_failure",
      input_tokens: 11,
      output_tokens: 7,
      total_tokens: 18,
      observer_failure_stage: "json_parse",
      observer_validation_issues: [{ code: "invalid_json", path: "$" }]
    });
    const outputDigest = computeSha256Digest(outputMarker) as Sha256Digest;
    expect(recorded.output_digest).toBe(outputDigest);
    expect(recorded.observed_store_digest).toBe(outputDigest);
    expect(recorded.estimated_spend_usd).toBeGreaterThan(0);
    expect((terminal.result as Record<string, any>).live_totals.total_tokens).toBe(18);
    expect(JSON.stringify(terminal)).not.toContain(outputMarker);
    expect(terminal.artifact_refs).toEqual([`raw-output:${outputDigest}`]);
    expect(await store.read(outputDigest)).toMatchObject({
      ok: true,
      status: "found",
      digest: outputDigest,
      content: outputMarker,
      record: { raw_output_trust_tier: "T0" }
    });
  });

  it("records attempt-three's envelope shape as payload_validation with code/path only", async () => {
    const { evidence, templates } = await bridgedFixture();
    const root = await mkdtemp(join(tmpdir(), "caleb-live-f4-regression-"));
    roots.push(root);
    const store = new ContentAddressedRawOutputStore({ root_dir: root });
    const tracker = new LiveRotationRunBudgetTracker(evidence.run_budget);
    const text = await readFile(
      "examples/live-rotation/regressions/live-f4-attempt-three-envelope-shaped-payload.json",
      "utf8"
    );
    const invoker: LiveRotationProviderInvoker = async (input) => {
      expect((await input.normalized_output_observer(text, {
        output_digest: computeSha256Digest(text),
        finish_reason: "end_turn",
        output_tokens: 1
      })).ok).toBe(false);
      return {
        ok: false,
        status: "failed",
        issues: [],
        failure: {
          failure_kind: "observer_failure",
          status: "failed",
          retryable: false,
          response_telemetry: {
            provider_response_id: "msg_attempt_three_shape",
            output_digest: computeSha256Digest(text),
            finish_reason: "end_turn",
            token_usage: { input_tokens: 1, output_tokens: 1, total_tokens: 2, usage_available: true },
            timing: { started_at: NOW, completed_at: NOW, latency_ms: 1, timed_out: false }
          }
        }
      } as unknown as LiveAdapterResult;
    };
    const adapter = createLiveRotationRoleRuntimeAdapter({
      adapter_id: "anthropic_live_adapter",
      evidence,
      bindings: [evidence.role_bindings[0]!],
      prompt_templates: templates,
      store,
      invoke_provider: invoker,
      now: () => NOW
    }, tracker);
    expect((await adapter.invoke(invocation())).ok).toBe(false);
    const recorded = tracker.state().invocations[0]!;
    expect(recorded.observer_failure_stage).toBe("payload_validation");
    expect(recorded.observer_validation_issues).toContainEqual({
      code: "unexpected_field",
      path: "$.schema_version"
    });
    expect(Object.keys(recorded.observer_validation_issues[0]!).sort()).toEqual(["code", "path"]);
    expect(JSON.stringify(recorded)).not.toContain("Envelope-shaped regression content");
  });
});

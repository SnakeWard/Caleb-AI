import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { validateLedgerEntry } from "../../src/ledger/ledgerValidation.js";
import type { ContractValidatedTaskFrameRouteInput } from "../../src/logicEngine/types/routeInput.js";
import {
  createLiveRotationRoleRuntimeAdapter,
  LiveRotationRunBudgetTracker,
  type LiveRotationPromptTemplate,
  type LiveRotationProviderInvoker
} from "../../src/logicEngine/liveRotationRuntimeAdapter.js";
import { bridgeRuntimeRotationPlan } from "../../src/logicEngine/rotationPlanBridge.js";
import { executeBridgedRotationAtSeam } from "../../src/logicEngine/rotationExecutionSeam.js";
import type { LiveAdapterResult } from "../../src/modelBoundary/types/liveAdapterTypes.js";
import {
  buildAnthropicLiveAdapterRequest,
  createAnthropicLiveAdapter,
  DEFAULT_ANTHROPIC_LIVE_ADAPTER_CONFIG,
  evaluateOneProviderAdapterLivePrerequisites
} from "../../src/providers/index.js";
import { computeSha256Digest } from "../../src/providers/liveAdapterShared.js";
import { ContentAddressedRawOutputStore } from "../../src/rawOutput/contentAddressedRawOutputStore.js";
import type {
  RoleRuntimeAdapter,
  RoleRuntimeAdapterInvokeInput
} from "../../src/roleRuntime/types/roleRuntimeAdapter.js";
import type { Sha256Digest } from "../../src/types/common.js";

const NOW = "2026-07-19T15:00:00.000Z";
const roots: string[] = [];

afterEach(async () => Promise.all(
  roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
));

interface TruncationFixture {
  readonly fixture_is_synthetic: true;
  readonly historical_attempt_four_bytes: "unrecoverable";
  readonly normalized_output_text: string;
  readonly provider_finish_reason: string;
  readonly output_tokens: number;
  readonly max_tokens: number;
  readonly expected_stage: "output_truncated";
  readonly expected_issue: { readonly code: "output_truncated"; readonly path: "$" };
}

async function loadFixture(): Promise<TruncationFixture> {
  return JSON.parse(await readFile(
    "examples/live-rotation/regressions/live-f5-output-truncated.fixture.json",
    "utf8"
  )) as TruncationFixture;
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
  if (!bridge.ok) throw new Error("LIVE-F5 bridge fixture failed.");
  const evidence = bridge.derived_plan.live_rotation_gate_evidence;
  if (evidence === undefined) throw new Error("LIVE-F5 gate evidence missing.");
  const templates = new Map<"planner" | "critic", LiveRotationPromptTemplate>();
  for (const role of ["planner", "critic"] as const) {
    const ref = evidence.prompt_templates[role];
    const text = (await readFile(ref.path, "utf8")).replaceAll("\r\n", "\n");
    templates.set(role, {
      role_id: role,
      template_text: text,
      expected_digest: computeSha256Digest(text) as Sha256Digest
    });
  }
  return { bridge, evidence, templates };
}

function invocation(): RoleRuntimeAdapterInvokeInput {
  return {
    plan_id: "plan_live_f5",
    task_id: "task_223e4567-e89b-42d3-a456-426614174101",
    run_id: "run_223e4567-e89b-42d3-a456-426614174102",
    trace_id: "trace_live_f5",
    context_id: "context_live_f5",
    step_index: 0,
    role_id: "planner",
    adapter_id: "anthropic_live_adapter",
    adapter_kind: "live",
    context_text: "",
    context_refs: []
  };
}

function observerFailureResult(input: {
  readonly output_digest: string;
  readonly finish_reason: string;
  readonly output_tokens: number;
}): LiveAdapterResult {
  return {
    ok: false,
    status: "failed",
    issues: [],
    failure: {
      failure_kind: "observer_failure",
      status: "failed",
      retryable: false,
      response_telemetry: {
        provider_response_id: "msg_live_f5_direct",
        output_digest: input.output_digest,
        finish_reason: input.finish_reason,
        token_usage: {
          input_tokens: 10,
          output_tokens: input.output_tokens,
          total_tokens: 10 + input.output_tokens,
          usage_available: true
        },
        timing: {
          started_at: NOW,
          completed_at: NOW,
          latency_ms: 5,
          timed_out: false
        }
      }
    }
  } as unknown as LiveAdapterResult;
}

async function runDirectFailure(input: {
  readonly text: string;
  readonly finish_reason: string;
  readonly output_tokens: number;
  readonly reported_digest?: string;
}) {
  const { evidence, templates } = await bridgedFixture();
  const root = await mkdtemp(join(tmpdir(), "caleb-live-f5-direct-"));
  roots.push(root);
  const store = new ContentAddressedRawOutputStore({ root_dir: root });
  const tracker = new LiveRotationRunBudgetTracker(evidence.run_budget);
  const actualDigest = computeSha256Digest(input.text) as Sha256Digest;
  const reportedDigest = input.reported_digest ?? actualDigest;
  const invoker: LiveRotationProviderInvoker = async (providerInput) => {
    expect((await providerInput.normalized_output_observer(input.text, {
      output_digest: reportedDigest,
      finish_reason: input.finish_reason,
      output_tokens: input.output_tokens
    })).ok).toBe(false);
    return observerFailureResult({
      output_digest: reportedDigest,
      finish_reason: input.finish_reason,
      output_tokens: input.output_tokens
    });
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
  const result = await adapter.invoke(invocation());
  return { result, tracker, store, actualDigest };
}

describe("LIVE-F5 truncation evidence preservation", () => {
  it("classifies either truncation signal before JSON parse and preserves ordinary json_parse", async () => {
    const fixture = await loadFixture();
    expect(fixture.fixture_is_synthetic).toBe(true);
    expect(fixture.historical_attempt_four_bytes).toBe("unrecoverable");

    const byReason = await runDirectFailure({
      text: fixture.normalized_output_text,
      finish_reason: fixture.provider_finish_reason,
      output_tokens: 10
    });
    expect(byReason.tracker.state().failure_code).toBe("live_observer_output_truncated");
    expect(byReason.tracker.state().invocations[0]).toMatchObject({
      observer_failure_stage: fixture.expected_stage,
      observer_validation_issues: [fixture.expected_issue],
      observed_store_digest: byReason.actualDigest
    });
    expect(await byReason.store.read(byReason.actualDigest)).toMatchObject({
      ok: true,
      status: "found",
      content: fixture.normalized_output_text,
      record: { raw_output_trust_tier: "T0" }
    });

    const byEquality = await runDirectFailure({
      text: fixture.normalized_output_text,
      finish_reason: "end_turn",
      output_tokens: fixture.max_tokens
    });
    expect(byEquality.tracker.state().invocations[0]).toMatchObject({
      failure_code: "live_observer_output_truncated",
      observer_failure_stage: "output_truncated"
    });

    const ordinaryInvalidJson = await runDirectFailure({
      text: fixture.normalized_output_text,
      finish_reason: "end_turn",
      output_tokens: fixture.max_tokens - 1
    });
    expect(ordinaryInvalidJson.tracker.state().invocations[0]).toMatchObject({
      failure_code: "live_observer_artifact_invalid",
      observer_failure_stage: "json_parse",
      observer_validation_issues: [{ code: "invalid_json", path: "$" }],
      observed_store_digest: ordinaryInvalidJson.actualDigest
    });
  });

  it("fails a mismatched adapter/store digest distinctly while retaining the T0 witness", async () => {
    const fixture = await loadFixture();
    const mismatch = await runDirectFailure({
      text: fixture.normalized_output_text,
      finish_reason: "end_turn",
      output_tokens: 1,
      reported_digest: `sha256:${"f".repeat(64)}`
    });
    expect(mismatch.result.ok).toBe(false);
    expect(mismatch.tracker.state().failure_code).toBe("live_output_digest_mismatch");
    expect(mismatch.tracker.state().invocations[0]).toMatchObject({
      output_digest: `sha256:${"f".repeat(64)}`,
      observed_store_digest: mismatch.actualDigest,
      observer_failure_stage: null
    });
    expect((await mismatch.store.read(mismatch.actualDigest)).ok).toBe(true);
  });

  it("halts E1 before Critic, Ledgers the retained T0 ref, and preserves billable telemetry", async () => {
    const fixture = await loadFixture();
    const { bridge, evidence, templates } = await bridgedFixture();
    expect(evidence.role_bindings.map((binding) => binding.budget.max_tokens)).toEqual([1536, 1536]);
    expect(evidence.run_budget).toEqual({
      max_total_invocations: 2,
      max_total_tokens: 8192,
      max_spend_usd: 0.05
    });
    const root = await mkdtemp(join(tmpdir(), "caleb-live-f5-seam-"));
    roots.push(root);
    const store = new ContentAddressedRawOutputStore({ root_dir: root });
    const tracker = new LiveRotationRunBudgetTracker(evidence.run_budget);
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
    let fetchCalls = 0;
    const invoker: LiveRotationProviderInvoker = async (providerInput) => {
      const binding = evidence.role_bindings[0]!;
      const config = {
        ...DEFAULT_ANTHROPIC_LIVE_ADAPTER_CONFIG,
        model: binding.model_id,
        max_response_bytes: providerInput.budget.max_response_bytes,
        limits: {
          timeout_ms: providerInput.budget.timeout_ms,
          max_output_tokens: providerInput.budget.max_tokens,
          retry_count: 0,
          temperature_allowed: false,
          streaming_allowed: false
        }
      };
      const request = buildAnthropicLiveAdapterRequest({
        prompt_text: providerInput.prompt_text,
        config,
        task_id: providerInput.task_id,
        run_id: providerInput.run_id
      });
      return createAnthropicLiveAdapter(config, {
        prerequisites_evaluation: prerequisites,
        kill_switch_open: true,
        network_permission_granted_by_caller: true,
        approved_by: "live-f5-offline-fixture"
      }, {
        credential_provider: () => "test-only-key",
        normalized_output_observer: providerInput.normalized_output_observer,
        fetch_impl: (async () => {
          fetchCalls += 1;
          return new Response(JSON.stringify({
            id: "msg_live_f5_truncated",
            type: "message",
            role: "assistant",
            model: "claude-haiku-4-5",
            content: [{ type: "text", text: fixture.normalized_output_text }],
            stop_reason: fixture.provider_finish_reason,
            usage: { input_tokens: 291, output_tokens: fixture.output_tokens }
          }), { status: 200 });
        }) as typeof fetch
      }).invokeLive({ request, prompt_text: providerInput.prompt_text });
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
      now: () => NOW,
      execution_id_factory: () => "execution_55555555-5555-4555-8555-555555555555"
    });
    expect(result.ok).toBe(false);
    expect(result.failure_code).toBe("live_observer_output_truncated");
    expect(fetchCalls).toBe(1);
    expect(result.ledger_entries.every((entry) => validateLedgerEntry(entry).valid)).toBe(true);
    const terminal = result.ledger_entries.find(
      (entry) => entry.activity === "rotation_execution_failed"
    )!;
    const recorded = (terminal.result as Record<string, any>).live_invocations[0];
    const digest = computeSha256Digest(fixture.normalized_output_text) as Sha256Digest;
    expect(recorded).toMatchObject({
      role_id: "planner",
      output_digest: digest,
      observed_store_digest: digest,
      input_tokens: 291,
      output_tokens: 1536,
      total_tokens: 1827,
      provider_response_id: "msg_live_f5_truncated",
      budget: { max_tokens: 1536 },
      failure_code: "live_observer_output_truncated",
      observer_failure_stage: "output_truncated",
      observer_validation_issues: [{ code: "output_truncated", path: "$" }]
    });
    expect(recorded.estimated_spend_usd).toBeGreaterThan(0);
    expect((terminal.result as Record<string, any>).live_totals).toMatchObject({
      invocations: 1,
      total_tokens: 1827
    });
    expect(terminal.artifact_refs).toContain(`raw-output:${digest}`);
    const failedStep = result.ledger_entries.find(
      (entry) => entry.activity === "role_invocation_failed"
    );
    expect(failedStep?.result).toMatchObject({
      step_index: 0,
      role_id: "planner",
      stage: "output_truncated",
      taxonomy: "live_observer_output_truncated",
      input_tokens: 291,
      output_tokens: 1536,
      total_tokens: 1827,
      stop_reason: "max_tokens",
      budget: { max_tokens: 1536 },
      t0_digest: digest,
      trust_tier: "T0"
    });
    expect(failedStep?.artifact_refs).toContain(`raw-output:${digest}`);
    expect(await store.read(digest)).toMatchObject({
      ok: true,
      status: "found",
      content: fixture.normalized_output_text,
      record: { raw_output_trust_tier: "T0" }
    });
    const serialized = JSON.stringify(result.ledger_entries);
    expect(serialized).not.toContain(fixture.normalized_output_text);
    expect(serialized).not.toContain("live-f5-synthetic-truncation-marker");
  });
});

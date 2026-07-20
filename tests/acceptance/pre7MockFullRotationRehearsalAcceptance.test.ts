import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { JsonlLedger } from "../../src/ledger/ledger.js";
import { validateLedgerEntry } from "../../src/ledger/ledgerValidation.js";
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
import type { ContractValidatedTaskFrameRouteInput } from "../../src/logicEngine/types/routeInput.js";
import {
  buildAnthropicLiveAdapterRequest,
  createAnthropicLiveAdapter,
  DEFAULT_ANTHROPIC_LIVE_ADAPTER_CONFIG,
  evaluateOneProviderAdapterLivePrerequisites
} from "../../src/providers/index.js";
import { computeSha256Digest } from "../../src/providers/liveAdapterShared.js";
import { ContentAddressedRawOutputStore } from "../../src/rawOutput/contentAddressedRawOutputStore.js";
import type { RoleRuntimeAdapter } from "../../src/roleRuntime/types/roleRuntimeAdapter.js";
import { validateRoleArtifact } from "../../src/roles/roleArtifactValidator.js";
import type { LedgerEntry } from "../../src/types/ledger.js";

const NOW = "2026-07-19T20:00:00.000Z";
const FIXTURE_ROOT = "tests/fixtures/pre-7";
const CRITIC_TRUNCATION_SENTINEL = "PRE-7-CRITIC-TRUNCATION-SENTINEL";
const roots: string[] = [];

afterEach(async () => Promise.all(
  roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
));

interface ProviderResponseFixture {
  readonly provider_response_id: string;
  readonly text: string;
  readonly stop_reason: "end_turn" | "max_tokens";
  readonly input_tokens: number;
  readonly output_tokens: number;
}

interface RehearsalRun {
  readonly execution_id: string;
  readonly plan_id: string;
  readonly result: Awaited<ReturnType<typeof executeBridgedRotationAtSeam>>;
  readonly tracker: LiveRotationRunBudgetTracker;
  readonly store: ContentAddressedRawOutputStore;
  readonly ledger_bytes: string;
  readonly ledger_entries: readonly LedgerEntry[];
  readonly payload_texts: readonly string[];
  readonly injected_fetch_calls: number;
  readonly real_egress_attempts: number;
  readonly critic_budget_max_tokens: number;
}

async function loadText(name: string): Promise<string> {
  return readFile(join(FIXTURE_ROOT, name), "utf8");
}

function assertNoRealEgress(attempts: number): void {
  if (attempts !== 0) {
    throw new Error(`PRE-7 real-egress trap observed ${attempts} attempt(s).`);
  }
}

function assertModelTrustCeiling(tiers: readonly string[]): void {
  if (tiers.some((tier) => tier !== "T0" && tier !== "T1")) {
    throw new Error("PRE-7 model artifact trust exceeded T1.");
  }
}

function parseLedgerBytes(bytes: string): LedgerEntry[] {
  return bytes
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const validation = validateLedgerEntry(JSON.parse(line) as unknown);
      expect(validation.valid).toBe(true);
      if (validation.entry === undefined) {
        throw new Error("PRE-7 test-scoped Ledger contained an invalid entry.");
      }
      return validation.entry;
    });
}

function livePrerequisites() {
  return evaluateOneProviderAdapterLivePrerequisites({
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
}

async function runRehearsal(input: {
  readonly execution_id: string;
  readonly planner_fixture: string;
  readonly critic_fixture: string;
  readonly critic_truncated?: boolean;
}): Promise<RehearsalRun> {
  const root = await mkdtemp(join(tmpdir(), "caleb-pre7-rehearsal-"));
  roots.push(root);
  const ledger = new JsonlLedger(join(root, "ledger", "rehearsal.jsonl"));
  const store = new ContentAddressedRawOutputStore({ root_dir: join(root, "m3") });
  const wrapper = JSON.parse(
    await readFile("examples/live-rotation/event-e1.anthropic.fixture.json", "utf8")
  ) as Record<string, any>;
  const appendLedgerEntry = async (entry: LedgerEntry): Promise<boolean> => {
    await ledger.append(entry);
    return true;
  };
  const bridge = await bridgeRuntimeRotationPlan({
    carrier: wrapper.carrier as ContractValidatedTaskFrameRouteInput,
    runtime_rotation_plan: wrapper.runtime_rotation_plan,
    adapter_bindings: wrapper.adapter_bindings,
    append_ledger_entry: appendLedgerEntry,
    decided_at: NOW
  });
  expect(bridge.ok).toBe(true);
  if (!bridge.ok) {
    throw new Error("PRE-7 rehearsal bridge failed.");
  }
  const evidence = bridge.derived_plan.live_rotation_gate_evidence;
  if (evidence === undefined) {
    throw new Error("PRE-7 rehearsal live evidence is missing.");
  }

  const templates = new Map<"planner" | "critic", LiveRotationPromptTemplate>();
  for (const role of ["planner", "critic"] as const) {
    const ref = evidence.prompt_templates[role];
    const templateText = (await readFile(ref.path, "utf8")).replaceAll("\r\n", "\n");
    templates.set(role, {
      role_id: role,
      template_text: templateText,
      expected_digest: computeSha256Digest(templateText)
    });
  }

  const payloadTexts = await Promise.all([
    loadText(input.planner_fixture),
    loadText(input.critic_fixture)
  ]);
  const criticBudgetMaxTokens = evidence.role_bindings.find(
    (binding) => binding.role_id === "critic"
  )?.budget.max_tokens;
  if (criticBudgetMaxTokens === undefined) {
    throw new Error("PRE-7 rehearsal Critic budget is missing.");
  }
  const responseFixtures: readonly ProviderResponseFixture[] = [
    {
      provider_response_id: `msg_pre7_${input.execution_id.slice(-3)}_planner`,
      text: payloadTexts[0],
      stop_reason: "end_turn",
      input_tokens: 89,
      output_tokens: 121
    },
    {
      provider_response_id: `msg_pre7_${input.execution_id.slice(-3)}_critic`,
      text: payloadTexts[1],
      stop_reason: input.critic_truncated === true ? "max_tokens" : "end_turn",
      input_tokens: 97,
      output_tokens: input.critic_truncated === true ? criticBudgetMaxTokens : 137
    }
  ];

  let providerInvocationOrdinal = 0;
  let injectedFetchCalls = 0;
  const invoker: LiveRotationProviderInvoker = async (providerInput) => {
    const response = responseFixtures[providerInvocationOrdinal];
    const binding = evidence.role_bindings[providerInvocationOrdinal];
    if (response === undefined || binding === undefined) {
      throw new Error("PRE-7 rehearsal received an undeclared provider invocation.");
    }
    providerInvocationOrdinal += 1;
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
      prerequisites_evaluation: livePrerequisites(),
      kill_switch_open: true,
      network_permission_granted_by_caller: true,
      approved_by: "Pat-PRE-7-offline-rehearsal"
    }, {
      credential_provider: () => "PRE-7-OFFLINE-NONCREDENTIAL",
      normalized_output_observer: providerInput.normalized_output_observer,
      fetch_impl: (async (_url, init) => {
        injectedFetchCalls += 1;
        expect(init?.method).toBe("POST");
        return new Response(JSON.stringify({
          id: response.provider_response_id,
          type: "message",
          role: "assistant",
          model: binding.model_id,
          content: [{ type: "text", text: response.text }],
          stop_reason: response.stop_reason,
          usage: {
            input_tokens: response.input_tokens,
            output_tokens: response.output_tokens
          }
        }), { status: 200 });
      }) as typeof fetch
    }).invokeLive({ request, prompt_text: providerInput.prompt_text });
  };

  const tracker = new LiveRotationRunBudgetTracker(evidence.run_budget);
  let artifactOrdinal = 0;
  const liveAdapter = createLiveRotationRoleRuntimeAdapter({
    adapter_id: "anthropic_live_adapter",
    evidence,
    bindings: evidence.role_bindings,
    prompt_templates: templates,
    store,
    invoke_provider: invoker,
    now: () => NOW,
    artifact_id_factory: () =>
      `artifact_77777777-7777-4777-8777-${String(++artifactOrdinal).padStart(12, "0")}`
  }, tracker);

  const originalFetch = globalThis.fetch;
  let realEgressAttempts = 0;
  globalThis.fetch = (async () => {
    realEgressAttempts += 1;
    throw new Error("PRE-7 global network egress is forbidden.");
  }) as typeof fetch;
  let result: Awaited<ReturnType<typeof executeBridgedRotationAtSeam>>;
  try {
    result = await executeBridgedRotationAtSeam({
      plan: bridge.derived_plan,
      human_confirmed: true,
      bridge_ledger_entries: [bridge.ledger_entry],
      adapters: new Map<string, RoleRuntimeAdapter>([
        ["anthropic_live_adapter", liveAdapter]
      ]),
      store,
      append_ledger_entry: appendLedgerEntry,
      now: () => NOW,
      execution_id_factory: () => input.execution_id
    });
  } finally {
    globalThis.fetch = originalFetch;
  }

  const ledgerBytes = await readFile(ledger.ledgerPath, "utf8");
  return {
    execution_id: input.execution_id,
    plan_id: bridge.derived_plan.plan_id,
    result,
    tracker,
    store,
    ledger_bytes: ledgerBytes,
    ledger_entries: parseLedgerBytes(ledgerBytes),
    payload_texts: payloadTexts,
    injected_fetch_calls: injectedFetchCalls,
    real_egress_attempts: realEgressAttempts,
    critic_budget_max_tokens: criticBudgetMaxTokens
  };
}

function assertReconstructedPositive(run: RehearsalRun): void {
  const keyed = reconstructRotationChainFromLedgerJsonl(
    run.ledger_bytes,
    run.plan_id,
    run.execution_id
  );
  const inferred = reconstructRotationChainFromLedgerJsonl(run.ledger_bytes, run.plan_id);
  expect(keyed.ok).toBe(true);
  expect(inferred).toEqual(keyed);
  if (!keyed.ok) return;
  expect(keyed.chain).toMatchObject({
    execution_id: run.execution_id,
    final_status: "completed",
    completed_steps: 2,
    failed_step_index: null,
    failure_code: null,
    failed_step: null
  });
  expect(keyed.chain.invocations.map((entry) => [entry.step_index, entry.role_id])).toEqual([
    [0, "planner"],
    [1, "critic"]
  ]);
  expect(keyed.chain.invocations.map((entry) => entry.derived_from)).toEqual(
    run.result.execution_result?.records.map((record) => record.derived_from)
  );
}

async function assertSuccessfulRehearsal(run: RehearsalRun): Promise<void> {
  expect(run.result.ok).toBe(true);
  expect(run.result.status).toBe("completed");
  expect(run.result.execution_id).toBe(run.execution_id);
  expect(run.result.execution_result?.records).toHaveLength(2);
  expect(run.injected_fetch_calls).toBe(2);
  assertNoRealEgress(run.real_egress_attempts);

  const invocationEntries = run.ledger_entries.filter(
    (entry) => entry.activity === "rotation_role_invocation"
  );
  expect(invocationEntries).toHaveLength(2);
  expect(invocationEntries[0]?.result).toMatchObject({
    execution_id: run.execution_id,
    step_index: 0,
    role_id: "planner",
    handoff_gate_status: "allowed"
  });
  expect(invocationEntries[1]?.result).toMatchObject({
    execution_id: run.execution_id,
    step_index: 1,
    role_id: "critic"
  });
  expect(run.ledger_entries.some((entry) => entry.activity === "gate_evaluation_refused")).toBe(false);

  const records = run.result.execution_result?.records ?? [];
  const telemetry = run.tracker.state().invocations;
  for (let index = 0; index < 2; index += 1) {
    const record = records[index]!;
    const rawDigest = telemetry[index]!.observed_store_digest!;
    expect(record.trust_tier).toBe("T1");
    expect(record.derived_from).toEqual([rawDigest]);
    expect(record.artifact_digest).not.toBe(rawDigest);
    const raw = await run.store.read(rawDigest);
    const canonical = await run.store.read(record.artifact_digest);
    expect(raw).toMatchObject({
      ok: true,
      status: "found",
      content: run.payload_texts[index],
      record: { raw_output_trust_tier: "T0", max_allowed_trust_tier: "T1" }
    });
    expect(canonical.ok).toBe(true);
    expect(validateRoleArtifact(JSON.parse(canonical.content!))).toMatchObject({ ok: true });
  }

  const modelTiers = run.ledger_entries
    .filter((entry) => entry.actor_type === "model")
    .map((entry) => entry.trust_tier);
  assertModelTrustCeiling(modelTiers);
  const terminal = run.ledger_entries.find(
    (entry) => entry.activity === "rotation_execution_completed"
  );
  expect(terminal).toMatchObject({ status: "completed" });
  expect(terminal?.result).toMatchObject({
    execution_id: run.execution_id,
    completed_steps: 2,
    failure_code: null
  });
  assertReconstructedPositive(run);
}

describe("PRE-7 mock full-rotation rehearsal", () => {
  it("proves the no-egress and no-promotion absence detectors can fail", () => {
    expect(() => assertNoRealEgress(1)).toThrow("real-egress trap");
    expect(() => assertModelTrustCeiling(["T2"])).toThrow("trust exceeded T1");
    expect(() => assertNoRealEgress(0)).not.toThrow();
    expect(() => assertModelTrustCeiling(["T0", "T1"])).not.toThrow();
  });

  it.each([
    {
      label: "needs_revision",
      planner_fixture: "rehearsal-planner-needs-revision.semantic.json",
      execution_id: "execution_77777777-7777-4777-8777-777777777701"
    },
    {
      label: "accepted",
      planner_fixture: "rehearsal-planner-accepted.semantic.json",
      execution_id: "execution_77777777-7777-4777-8777-777777777702"
    }
  ])("runs Planner $label through check 11 and executes Critic at step 1", async (variant) => {
    const run = await runRehearsal({
      execution_id: variant.execution_id,
      planner_fixture: variant.planner_fixture,
      critic_fixture: "rehearsal-critic-valid.semantic.json"
    });
    await assertSuccessfulRehearsal(run);
  });

  it("reconstructs a Critic truncation at step 1 with retained T0 and full F8 detail", async () => {
    const run = await runRehearsal({
      execution_id: "execution_77777777-7777-4777-8777-777777777703",
      planner_fixture: "rehearsal-planner-needs-revision.semantic.json",
      critic_fixture: "rehearsal-critic-truncated.semantic.json",
      critic_truncated: true
    });
    expect(run.result.ok).toBe(false);
    expect(run.result.status).toBe("failed");
    expect(run.result.failure_code).toBe("live_observer_output_truncated");
    expect(run.injected_fetch_calls).toBe(2);
    assertNoRealEgress(run.real_egress_attempts);

    const rawDigest = computeSha256Digest(run.payload_texts[1]!);
    expect(await run.store.read(rawDigest)).toMatchObject({
      ok: true,
      status: "found",
      content: run.payload_texts[1],
      record: { raw_output_trust_tier: "T0", max_allowed_trust_tier: "T1" }
    });
    const failureEntry = run.ledger_entries.find(
      (entry) => entry.activity === "role_invocation_failed"
    );
    expect(failureEntry).toMatchObject({ trust_tier: "T0" });
    expect(failureEntry?.result).toMatchObject({
      execution_id: run.execution_id,
      step_index: 1,
      role_id: "critic",
      stage: "output_truncated",
      taxonomy: "live_observer_output_truncated",
      input_tokens: 97,
      output_tokens: run.critic_budget_max_tokens,
      total_tokens: 97 + run.critic_budget_max_tokens,
      stop_reason: "max_tokens",
      budget: { max_tokens: run.critic_budget_max_tokens },
      t0_digest: rawDigest,
      observer_normalization_stage: null
    });

    const keyed = reconstructRotationChainFromLedgerJsonl(
      run.ledger_bytes,
      run.plan_id,
      run.execution_id
    );
    const inferred = reconstructRotationChainFromLedgerJsonl(run.ledger_bytes, run.plan_id);
    expect(keyed.ok).toBe(true);
    expect(inferred).toEqual(keyed);
    if (keyed.ok) {
      expect(keyed.chain).toMatchObject({
        execution_id: run.execution_id,
        final_status: "failed",
        completed_steps: 1,
        failed_step_index: 1,
        failure_code: "live_observer_output_truncated",
        failed_step: {
          step_index: 1,
          role_id: "critic",
          stage: "output_truncated",
          taxonomy: "live_observer_output_truncated",
          input_tokens: 97,
          output_tokens: run.critic_budget_max_tokens,
          total_tokens: 97 + run.critic_budget_max_tokens,
          stop_reason: "max_tokens",
          budget: { max_tokens: run.critic_budget_max_tokens },
          t0_digest: rawDigest,
          observer_normalization_stage: null
        }
      });
      expect(keyed.chain.invocations.map((entry) => entry.role_id)).toEqual(["planner"]);
    }
    expect(run.ledger_bytes).not.toContain(CRITIC_TRUNCATION_SENTINEL);
    expect(JSON.stringify(keyed)).not.toContain(CRITIC_TRUNCATION_SENTINEL);
  });
});

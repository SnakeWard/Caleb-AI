import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import type { ContractValidatedTaskFrameRouteInput } from "../../src/logicEngine/types/routeInput.js";
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
import type { LiveAdapterResult } from "../../src/modelBoundary/types/liveAdapterTypes.js";
import { computeSha256Digest } from "../../src/providers/liveAdapterShared.js";
import { ContentAddressedRawOutputStore } from "../../src/rawOutput/contentAddressedRawOutputStore.js";
import type {
  RoleRuntimeAdapter,
  RoleRuntimeAdapterInvokeInput
} from "../../src/roleRuntime/types/roleRuntimeAdapter.js";
import type { LiveRoleSemanticPayload } from "../../src/roles/types/liveRoleSemanticPayload.js";
import type { Sha256Digest } from "../../src/types/common.js";
import type { LedgerEntry } from "../../src/types/ledger.js";

const NOW = "2026-07-19T16:30:00.000Z";
const roots: string[] = [];

afterEach(async () => Promise.all(
  roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
));

function payload(label: string): LiveRoleSemanticPayload {
  return {
    summary: `${label} bounded semantic payload`,
    claims: [{ claim_id: `${label}_claim`, text: `${label} claim`, evidence_ref_ids: [] }],
    assumptions: [],
    constraints: ["Remain inside the fixture boundary."],
    open_questions: [],
    recommendations: [`Review ${label}.`],
    evidence_refs: [],
    confidence: 0.75,
    handoff_notes: [],
    acceptance_status: "accepted"
  };
}

function fencedPayload(label: string): string {
  return `\`\`\`json\n${JSON.stringify(payload(label))}\n\`\`\``;
}

function invocation(): RoleRuntimeAdapterInvokeInput {
  return {
    plan_id: "plan_live_f6",
    task_id: "task_223e4567-e89b-42d3-a456-426614174101",
    run_id: "run_223e4567-e89b-42d3-a456-426614174102",
    trace_id: "trace_live_f6",
    context_id: "context_live_f6",
    step_index: 0,
    role_id: "planner",
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
  if (!bridge.ok) throw new Error("LIVE-F6 bridge fixture failed.");
  const evidence = bridge.derived_plan.live_rotation_gate_evidence;
  if (evidence === undefined) throw new Error("LIVE-F6 gate evidence missing.");
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

function successfulProviderResult(input: {
  readonly digest: Sha256Digest;
  readonly response_id: string;
}): LiveAdapterResult {
  return {
    ok: true,
    status: "response_schema_valid",
    issues: [],
    response: {
      provider_response_id: input.response_id,
      output_ref: { output_digest: input.digest },
      token_usage: {
        input_tokens: 10,
        output_tokens: 20,
        total_tokens: 30,
        usage_available: true
      },
      timing: {
        started_at: NOW,
        completed_at: NOW,
        latency_ms: 4,
        timed_out: false
      }
    }
  } as unknown as LiveAdapterResult;
}

function observerFailureResult(input: {
  readonly digest: Sha256Digest;
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
        provider_response_id: "msg_live_f6_failure",
        output_digest: input.digest,
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
          latency_ms: 4,
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
}) {
  const { evidence, templates } = await bridgedFixture();
  const root = await mkdtemp(join(tmpdir(), "caleb-live-f6-direct-"));
  roots.push(root);
  const store = new ContentAddressedRawOutputStore({ root_dir: root });
  const tracker = new LiveRotationRunBudgetTracker(evidence.run_budget);
  const digest = computeSha256Digest(input.text) as Sha256Digest;
  const invoker: LiveRotationProviderInvoker = async (providerInput) => {
    expect((await providerInput.normalized_output_observer(input.text, {
      output_digest: digest,
      finish_reason: input.finish_reason,
      output_tokens: input.output_tokens
    })).ok).toBe(false);
    return observerFailureResult({
      digest,
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
  return { result, tracker, store, digest };
}

async function runSeamFailure(text: string) {
  const { bridge, evidence, templates } = await bridgedFixture();
  const root = await mkdtemp(join(tmpdir(), "caleb-live-f6-seam-failure-"));
  roots.push(root);
  const store = new ContentAddressedRawOutputStore({ root_dir: root });
  const tracker = new LiveRotationRunBudgetTracker(evidence.run_budget);
  const digest = computeSha256Digest(text) as Sha256Digest;
  let calls = 0;
  const invoker: LiveRotationProviderInvoker = async (providerInput) => {
    calls += 1;
    expect((await providerInput.normalized_output_observer(text, {
      output_digest: digest,
      finish_reason: "end_turn",
      output_tokens: 1
    })).ok).toBe(false);
    return observerFailureResult({ digest, finish_reason: "end_turn", output_tokens: 1 });
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
    execution_id_factory: () => "execution_67676767-6767-4767-8767-676767676767"
  });
  return { result, tracker, store, digest, calls };
}

describe("LIVE-F6 exact wrapper normalization acceptance", () => {
  it("records Fable's speculative-normalization forbidden list verbatim as doctrine", async () => {
    const contract = await readFile("docs/01_CODEX_OPERATING_CONTRACT.md", "utf8");
    expect(contract).toContain(
      "Speculative-normalization prohibition (adopted Pass LIVE-F6, 2026-07-19)"
    );
    [
      "Searching for arbitrary brace pairs",
      "Selecting the first parseable JSON substring",
      "Removing trailing prose",
      "Repairing commas, quotes, braces, or escapes",
      "Validator loosening"
    ].forEach((item) => expect(contract).toContain(`- ${item}`));
  });

  it("versions the hardened Planner prompt in both fixtures while Critic stays pinned", async () => {
    const planner = (await readFile(
      "examples/live-rotation/prompts/planner.prompt.txt",
      "utf8"
    )).replaceAll("\r\n", "\n");
    const critic = (await readFile(
      "examples/live-rotation/prompts/critic.prompt.txt",
      "utf8"
    )).replaceAll("\r\n", "\n");
    const fixtures = await Promise.all([
      "examples/live-rotation/event-e1.anthropic.fixture.json",
      "examples/live-rotation/event-e2.cross-family.fixture.json"
    ].map(async (path) => JSON.parse(await readFile(path, "utf8")) as Record<string, any>));
    const plannerDigest = computeSha256Digest(planner);
    const criticDigest = computeSha256Digest(critic);
    expect(plannerDigest).toBe(
      "sha256:f32675859e07243a7cf0cd8e743537f4c975826ea7bf684348ed128792489003"
    );
    expect(plannerDigest).not.toBe(
      "sha256:8407f826668198c871da24fa9db9323c588aa6805d392d317fef6be090884697"
    );
    expect(criticDigest).toBe(
      "sha256:27d169bbc002d2bcdcab89ac6df60f481e6311c015600883ed000a1f8031dd54"
    );
    expect(planner).toContain("The first non-whitespace output character MUST be {");
    expect(planner).toContain("Do not output any backtick character.");
    fixtures.forEach((fixture) => {
      const promptTemplates = fixture.runtime_rotation_plan.live_rotation_gate_evidence
        .prompt_templates;
      expect(promptTemplates.planner.sha256_digest).toBe(plannerDigest);
      expect(promptTemplates.critic.sha256_digest).toBe(criticDigest);
    });
  });

  it("completes E1, retains raw fenced T0, Ledgers the stage, and reconstructs it", async () => {
    const { bridge, evidence, templates } = await bridgedFixture();
    const root = await mkdtemp(join(tmpdir(), "caleb-live-f6-success-"));
    roots.push(root);
    const store = new ContentAddressedRawOutputStore({ root_dir: root });
    const tracker = new LiveRotationRunBudgetTracker(evidence.run_budget);
    const rawTexts = [fencedPayload("planner"), fencedPayload("critic")];
    let call = 0;
    const invoker: LiveRotationProviderInvoker = async (providerInput) => {
      const text = rawTexts[call]!;
      const digest = computeSha256Digest(text) as Sha256Digest;
      expect((await providerInput.normalized_output_observer(text, {
        output_digest: digest,
        finish_reason: "end_turn",
        output_tokens: 20
      })).ok).toBe(true);
      call += 1;
      return successfulProviderResult({ digest, response_id: `msg_live_f6_${call}` });
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
      execution_id_factory: () => "execution_66666666-6666-4666-8666-666666666666"
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(call).toBe(2);
    expect(tracker.state().invocations.map((entry) => entry.observer_normalization_stage)).toEqual([
      "markdown_fence_unwrapped",
      "markdown_fence_unwrapped"
    ]);

    const invocationEntries = result.ledger_entries.filter(
      (entry) => entry.activity === "rotation_role_invocation"
    );
    expect(invocationEntries).toHaveLength(2);
    expect(invocationEntries.map((entry) =>
      (entry.result as Record<string, unknown>)["observer_normalization_stage"]
    )).toEqual(["markdown_fence_unwrapped", "markdown_fence_unwrapped"]);
    for (const [index, record] of result.execution_result.records.entries()) {
      const rawDigest = computeSha256Digest(rawTexts[index]!) as Sha256Digest;
      expect(record.derived_from).toEqual([rawDigest]);
      expect(await store.read(rawDigest)).toMatchObject({
        ok: true,
        status: "found",
        content: rawTexts[index],
        record: { raw_output_trust_tier: "T0" }
      });
    }

    const terminal = result.ledger_entries.find(
      (entry) => entry.activity === "rotation_execution_completed"
    )!;
    expect((terminal.result as Record<string, any>).live_invocations.map(
      (entry: Record<string, unknown>) => entry["observer_normalization_stage"]
    )).toEqual(["markdown_fence_unwrapped", "markdown_fence_unwrapped"]);

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
      expect(reconstructed.chain.invocations.map(
        (entry) => entry.observer_normalization_stage
      )).toEqual(["markdown_fence_unwrapped", "markdown_fence_unwrapped"]);
    }

    const historicalEntries = result.ledger_entries.map((entry): LedgerEntry => {
      if (entry.activity !== "rotation_role_invocation") return entry;
      const historicalResult = { ...(entry.result as Record<string, unknown>) };
      delete historicalResult["observer_normalization_stage"];
      return { ...entry, result: historicalResult } as LedgerEntry;
    });
    const historical = reconstructRotationChainFromLedgerJsonl(
      [bridge.ledger_entry, ...historicalEntries].map((entry) => JSON.stringify(entry)).join("\n"),
      bridge.derived_plan.plan_id,
      result.execution_id
    );
    expect(historical.ok).toBe(true);
    if (historical.ok) {
      expect(historical.chain.invocations.map(
        (entry) => entry.observer_normalization_stage
      )).toEqual([null, null]);
    }
    const invalidStageEntries = result.ledger_entries.map((entry): LedgerEntry => {
      if (entry.activity !== "rotation_role_invocation") return entry;
      return {
        ...entry,
        result: {
          ...(entry.result as Record<string, unknown>),
          observer_normalization_stage: "speculative_repair"
        }
      } as LedgerEntry;
    });
    expect(reconstructRotationChainFromLedgerJsonl(
      [bridge.ledger_entry, ...invalidStageEntries]
        .map((entry) => JSON.stringify(entry))
        .join("\n"),
      bridge.derived_plan.plan_id,
      result.execution_id
    ).ok).toBe(false);
    const serialized = JSON.stringify(result.ledger_entries);
    rawTexts.forEach((text) => expect(serialized).not.toContain(text));
  });

  it("records the applied stage when strict payload validation later rejects", async () => {
    const text = "```json\n{}\n```";
    const failure = await runSeamFailure(text);
    expect(failure.result.ok).toBe(false);
    expect(failure.calls).toBe(1);
    expect(failure.tracker.state().invocations[0]).toMatchObject({
      failure_code: "live_observer_artifact_invalid",
      observer_normalization_stage: "markdown_fence_unwrapped",
      observer_failure_stage: "payload_validation"
    });
    const terminal = failure.result.ledger_entries.find(
      (entry) => entry.activity === "rotation_execution_failed"
    )!;
    expect((terminal.result as Record<string, any>).live_invocations[0]).toMatchObject({
      observer_normalization_stage: "markdown_fence_unwrapped",
      observer_failure_stage: "payload_validation"
    });
    expect(terminal.artifact_refs).toContain(`raw-output:${failure.digest}`);
    expect(await failure.store.read(failure.digest)).toMatchObject({
      ok: true,
      content: text
    });
  });

  it("classifies F5 truncation before attempting an otherwise exact unwrap", async () => {
    const failure = await runDirectFailure({
      text: fencedPayload("truncated"),
      finish_reason: "max_tokens",
      output_tokens: 20
    });
    expect(failure.result.ok).toBe(false);
    expect(failure.tracker.state().invocations[0]).toMatchObject({
      failure_code: "live_observer_output_truncated",
      observer_normalization_stage: null,
      observer_failure_stage: "output_truncated"
    });
  });

  it.each([
    "live-f6-near-miss-missing-closing-fence.txt",
    "live-f6-near-miss-wrong-language-tag.txt",
    "live-f6-near-miss-trailing-content.txt",
    "live-f6-near-miss-two-json-objects.txt"
  ])("keeps near-miss fixture %s on the strict json_parse rejection path", async (name) => {
    const text = await readFile(`examples/live-rotation/regressions/${name}`, "utf8");
    const failure = await runDirectFailure({ text, finish_reason: "end_turn", output_tokens: 1 });
    expect(failure.result.ok).toBe(false);
    expect(failure.tracker.state().invocations[0]).toMatchObject({
      failure_code: "live_observer_artifact_invalid",
      observer_normalization_stage: null,
      observer_failure_stage: "json_parse",
      observer_validation_issues: [{ code: "invalid_json", path: "$" }]
    });
  });

  it.each([
    ["preamble", "Here is the requested object:\n{\"summary\":\"not extracted\"}"],
    ["braces in prose", "Do not select {these braces} from prose."]
  ])("keeps %s on the strict json_parse rejection path", async (_label, text) => {
    const failure = await runDirectFailure({ text, finish_reason: "end_turn", output_tokens: 1 });
    expect(failure.tracker.state().invocations[0]).toMatchObject({
      observer_normalization_stage: null,
      observer_failure_stage: "json_parse"
    });
  });
});

import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  createLiveRotationRoleRuntimeAdapter,
  LiveRotationRunBudgetTracker,
  type LiveRotationPromptTemplate,
  type LiveRotationProviderInvoker
} from "../../src/logicEngine/liveRotationRuntimeAdapter.js";
import { bridgeRuntimeRotationPlan } from "../../src/logicEngine/rotationPlanBridge.js";
import { executeBridgedRotationAtSeam } from "../../src/logicEngine/rotationExecutionSeam.js";
import type { ContractValidatedTaskFrameRouteInput } from "../../src/logicEngine/types/routeInput.js";
import type { LiveAdapterResult } from "../../src/modelBoundary/types/liveAdapterTypes.js";
import { computeSha256Digest } from "../../src/providers/liveAdapterShared.js";
import { ContentAddressedRawOutputStore } from "../../src/rawOutput/contentAddressedRawOutputStore.js";
import type { RoleRuntimeAdapter } from "../../src/roleRuntime/types/roleRuntimeAdapter.js";

const tempRoots: string[] = [];
afterEach(async () => Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true }))));

async function runFailedRotation(failure: {
  readonly failure_kind: string;
  readonly status: string;
  readonly retryable: boolean;
}) {
  const wrapper = JSON.parse(
    await readFile("examples/live-rotation/event-e1.anthropic.fixture.json", "utf8")
  ) as Record<string, any>;
  const bridge = await bridgeRuntimeRotationPlan({
    carrier: wrapper.carrier as ContractValidatedTaskFrameRouteInput,
    runtime_rotation_plan: wrapper.runtime_rotation_plan,
    adapter_bindings: wrapper.adapter_bindings,
    append_ledger_entry: () => true,
    decided_at: "2026-07-19T05:00:00.000Z"
  });
  expect(bridge.ok).toBe(true);
  if (!bridge.ok) throw new Error("fixture bridge failed");

  const evidence = bridge.derived_plan.live_rotation_gate_evidence;
  if (evidence === undefined) throw new Error("live evidence missing");
  const templates = new Map<"planner" | "critic", LiveRotationPromptTemplate>();
  for (const role of ["planner", "critic"] as const) {
    const ref = evidence.prompt_templates[role];
    const text = (await readFile(ref.path, "utf8")).replaceAll("\r\n", "\n");
    templates.set(role, { role_id: role, template_text: text, expected_digest: computeSha256Digest(text) });
  }

  const root = await mkdtemp(join(tmpdir(), "caleb-live-f1-"));
  tempRoots.push(root);
  const store = new ContentAddressedRawOutputStore({ root_dir: root });
  const tracker = new LiveRotationRunBudgetTracker(evidence.run_budget);
  let providerCalls = 0;
  const providerErrorProse = "provider-prose-must-not-be-ledgered";
  const invoker: LiveRotationProviderInvoker = async () => {
    providerCalls += 1;
    return {
      ok: false,
      status: failure.status,
      issues: [],
      failure: {
        failure_kind: failure.failure_kind,
        status: failure.status,
        retryable: failure.retryable,
        errors: [providerErrorProse],
        warnings: [providerErrorProse]
      }
    } as unknown as LiveAdapterResult;
  };
  const liveAdapter = createLiveRotationRoleRuntimeAdapter({
    adapter_id: "anthropic_live_adapter",
    evidence,
    bindings: evidence.role_bindings,
    prompt_templates: templates,
    store,
    invoke_provider: invoker
  }, tracker);
  const adapters = new Map<string, RoleRuntimeAdapter>([["anthropic_live_adapter", liveAdapter]]);
  const result = await executeBridgedRotationAtSeam({
    plan: bridge.derived_plan,
    human_confirmed: true,
    bridge_ledger_entries: [bridge.ledger_entry],
    adapters,
    store,
    append_ledger_entry: () => true,
    now: () => "2026-07-19T05:00:01.000Z"
  });
  return { result, providerCalls, providerErrorProse };
}

describe("LIVE-F1 provider failure taxonomy", () => {
  it.each([
    ["provider_auth_failed", "auth_failed", false],
    ["network_failure", "failed", true],
    ["provider_rate_limited", "rate_limited", true]
  ])("preserves %s in fail-closed terminal Ledger telemetry", async (failureKind, status, retryable) => {
    const { result, providerCalls, providerErrorProse } = await runFailedRotation({
      failure_kind: failureKind,
      status,
      retryable
    });
    expect(result.ok).toBe(false);
    expect(result.status).toBe("failed");
    expect(result.failure_code).toBe("live_provider_invocation_failed");
    expect(providerCalls).toBe(1);
    const terminal = result.ledger_entries.find((entry) => entry.activity === "rotation_execution_failed");
    expect(terminal).toBeDefined();
    const serialized = JSON.stringify(terminal);
    expect(serialized).not.toContain(providerErrorProse);
    const terminalResult = terminal?.result as Record<string, any>;
    expect(terminalResult.live_invocations).toHaveLength(1);
    expect(terminalResult.live_invocations[0]).toMatchObject({
      step_index: 0,
      role_id: "planner",
      failure_code: "live_provider_invocation_failed",
      provider_failure_kind: failureKind,
      provider_failure_status: status,
      provider_failure_retryable: retryable
    });
    expect(terminalResult.completed_steps).toBe(0);
    expect(terminalResult.failed_step_index).toBe(0);
  });

  it("does not fabricate adapter taxonomy when the provider invoker throws", async () => {
    const wrapper = JSON.parse(
      await readFile("examples/live-rotation/event-e1.anthropic.fixture.json", "utf8")
    ) as Record<string, any>;
    const evidence = wrapper.runtime_rotation_plan.live_rotation_gate_evidence;
    const root = await mkdtemp(join(tmpdir(), "caleb-live-f1-throw-"));
    tempRoots.push(root);
    const templateText = "{{TASK_STATEMENT}} {{TASK_ID}} {{RUN_ID}} {{TRACE_ID}} {{CONTEXT_ID}} {{ROLE_ID}} {{REQUIRED_NEXT_ROLE}} {{CONTEXT_TEXT}}";
    const tracker = new LiveRotationRunBudgetTracker(evidence.run_budget);
    const adapter = createLiveRotationRoleRuntimeAdapter({
      adapter_id: "anthropic_live_adapter",
      evidence,
      bindings: [evidence.role_bindings[0]],
      prompt_templates: new Map([["planner", {
        role_id: "planner", template_text: templateText, expected_digest: computeSha256Digest(templateText)
      }]]),
      store: new ContentAddressedRawOutputStore({ root_dir: root }),
      invoke_provider: async () => { throw new Error("not ledger-safe"); }
    }, tracker);
    await adapter.invoke({
      plan_id: "plan_test", task_id: wrapper.carrier.task_frame.task_id,
      run_id: wrapper.carrier.task_frame.run_id, trace_id: "trace_test", context_id: "context_test",
      step_index: 0, role_id: "planner", adapter_id: "anthropic_live_adapter",
      adapter_kind: "live", context_text: "", context_refs: []
    });
    expect(tracker.state().invocations[0]).toMatchObject({
      failure_code: "live_provider_invocation_failed",
      provider_failure_kind: null,
      provider_failure_status: null,
      provider_failure_retryable: null
    });
    expect(JSON.stringify(tracker.state())).not.toContain("not ledger-safe");
  });
});

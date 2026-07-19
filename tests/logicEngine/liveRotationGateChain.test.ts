import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { validateLiveRotationGateEvidence } from "../../src/logicEngine/liveRotationGateEvidence.js";
import {
  createLiveRotationRoleRuntimeAdapter,
  LiveRotationRunBudgetTracker,
  type LiveRotationProviderInvoker
} from "../../src/logicEngine/liveRotationRuntimeAdapter.js";
import type { LiveAdapterResult } from "../../src/modelBoundary/types/liveAdapterTypes.js";
import { computeSha256Digest } from "../../src/providers/liveAdapterShared.js";
import { ContentAddressedRawOutputStore } from "../../src/rawOutput/contentAddressedRawOutputStore.js";
import type { RoleRuntimeAdapterInvokeInput } from "../../src/roleRuntime/types/roleRuntimeAdapter.js";

const roots: string[] = [];
afterEach(async () => Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))));

async function fixtureEvidence(): Promise<Record<string, unknown>> {
  const wrapper = JSON.parse(await readFile("examples/live-rotation/event-e1.anthropic.fixture.json", "utf8")) as Record<string, any>;
  return structuredClone(wrapper.runtime_rotation_plan.live_rotation_gate_evidence) as Record<string, unknown>;
}

const requirements = {
  route_mode: "planner_critic" as const,
  roles_required: ["planner", "critic"] as const,
  max_cycles: 1,
  sequence_length: 2,
  adapter_bindings: [
    { role_id: "planner" as const, adapter_id: "anthropic_live_adapter", adapter_kind: "live" as const },
    { role_id: "critic" as const, adapter_id: "anthropic_live_adapter", adapter_kind: "live" as const }
  ]
};

function invocation(): RoleRuntimeAdapterInvokeInput {
  return {
    plan_id: "plan_test",
    task_id: "task_223e4567-e89b-42d3-a456-426614174101",
    run_id: "run_223e4567-e89b-42d3-a456-426614174102",
    trace_id: "trace_test",
    context_id: "context_test",
    step_index: 0,
    role_id: "planner",
    adapter_id: "anthropic_live_adapter",
    adapter_kind: "live",
    context_text: "",
    context_refs: []
  };
}

function artifactText(): string {
  return JSON.stringify({
    summary: "bounded test artifact",
    claims: [], assumptions: [], constraints: [], open_questions: [], recommendations: [],
    evidence_refs: [], confidence: 0.5, handoff_notes: [], acceptance_status: "accepted"
  });
}

function response(digest: string): LiveAdapterResult {
  return { ok: true, status: "response_schema_valid", issues: [], response: {
    output_ref: { output_digest: digest },
    token_usage: { input_tokens: 10, output_tokens: 20, total_tokens: 30 },
    timing: { latency_ms: 7 }
  } } as unknown as LiveAdapterResult;
}

async function runtime(invoker: LiveRotationProviderInvoker, evidenceOverride?: Record<string, any>) {
  const root = await mkdtemp(join(tmpdir(), "caleb-live-r1-"));
  roots.push(root);
  const evidence = (evidenceOverride ?? await fixtureEvidence()) as any;
  const binding = evidence.role_bindings[0];
  const template = "{{TASK_STATEMENT}} {{TASK_ID}} {{RUN_ID}} {{TRACE_ID}} {{CONTEXT_ID}} {{ROLE_ID}} {{REQUIRED_NEXT_ROLE}} {{CONTEXT_TEXT}}";
  const tracker = new LiveRotationRunBudgetTracker(evidence.run_budget);
  return {
    adapter: createLiveRotationRoleRuntimeAdapter({
      adapter_id: binding.adapter_id,
      evidence,
      bindings: [binding],
      prompt_templates: new Map([["planner", {
        role_id: "planner", template_text: template, expected_digest: computeSha256Digest(template)
      }]]),
      store: new ContentAddressedRawOutputStore({ root_dir: root }),
      invoke_provider: invoker
    }, tracker),
    tracker
  };
}

describe("LIVE-R1 gate chain", () => {
  it("accepts only the complete closed evidence envelope and rejects every gate class", async () => {
    const valid = await fixtureEvidence();
    expect(validateLiveRotationGateEvidence(valid, requirements).ok).toBe(true);
    expect((valid as Record<string, any>).role_bindings.map((entry: any) => entry.budget.max_tokens)).toEqual([1536, 1536]);
    expect((valid as Record<string, any>).run_budget).toEqual({
      max_total_invocations: 2,
      max_total_tokens: 8192,
      max_spend_usd: 0.05
    });
    const mutations: Array<(copy: Record<string, any>) => void> = [
      (copy) => { delete copy.explicit_opt_in; },
      (copy) => { delete copy.explicit_live_request; },
      (copy) => { delete copy.network_permission; },
      (copy) => { copy.approved_by = ""; },
      (copy) => { copy.role_bindings[0].provider_id = "xai"; },
      (copy) => { copy.role_bindings[0].model_id = "grok-3-mini"; },
      (copy) => { copy.role_bindings[0].budget.max_tokens = 1537; },
      (copy) => { copy.role_bindings[0].budget.timeout_ms = 30001; },
      (copy) => { copy.run_budget.max_total_invocations = 3; },
      (copy) => { copy.run_budget.max_total_tokens = 8193; },
      (copy) => { copy.run_budget.max_spend_usd = 0.051; },
      (copy) => { copy.prompt_templates.planner.path = "uncommitted.prompt.txt"; },
      (copy) => { copy.unknown_gate = true; }
    ];
    for (const mutate of mutations) {
      const copy = structuredClone(valid) as Record<string, any>;
      mutate(copy);
      expect(validateLiveRotationGateEvidence(copy, requirements).ok).toBe(false);
    }
  });

  it("stores the exact observed bytes and requires the store digest to match the adapter digest", async () => {
    const text = artifactText();
    const successRuntime = await runtime(async (input) => {
      expect((await input.normalized_output_observer(text, {
        output_digest: computeSha256Digest(text),
        finish_reason: "end_turn",
        output_tokens: 20
      })).ok).toBe(true);
      return response(computeSha256Digest(text));
    });
    expect((await successRuntime.adapter.invoke(invocation())).ok).toBe(true);
    const state = successRuntime.tracker.state();
    expect(state.invocations[0]?.observed_store_digest).toBe(computeSha256Digest(text));
    expect(state.invocations[0]?.output_digest).toBe(computeSha256Digest(text));

    const mismatchRuntime = await runtime(async (input) => {
      await input.normalized_output_observer(text, {
        output_digest: computeSha256Digest(text),
        finish_reason: "end_turn",
        output_tokens: 20
      });
      return response(computeSha256Digest(`${text}x`));
    });
    expect((await mismatchRuntime.adapter.invoke(invocation())).ok).toBe(false);
    expect(mismatchRuntime.tracker.state().failure_code).toBe("live_output_digest_mismatch");
  });

  it("turns observer refusal and slow providers into distinct fail-closed invocation failures", async () => {
    const text = artifactText();
    const observerRuntime = await runtime(async (input) => {
      await input.normalized_output_observer("not-json", {
        output_digest: computeSha256Digest("not-json"),
        finish_reason: "end_turn",
        output_tokens: 1
      });
      return { ok: false, status: "failed", issues: [], failure: { failure_kind: "observer_failure" } } as unknown as LiveAdapterResult;
    });
    expect((await observerRuntime.adapter.invoke(invocation())).ok).toBe(false);
    expect(observerRuntime.tracker.state().failure_code).toBe("live_observer_artifact_invalid");
    expect(observerRuntime.tracker.state().invocations[0]).toMatchObject({
      observer_failure_stage: "json_parse",
      observer_validation_issues: [{ code: "invalid_json", path: "$" }]
    });

    const evidence = await fixtureEvidence() as Record<string, any>;
    evidence.role_bindings[0].budget.timeout_ms = 5;
    const slowRuntime = await runtime(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
      return response(computeSha256Digest(text));
    }, evidence);
    expect((await slowRuntime.adapter.invoke(invocation())).ok).toBe(false);
    expect(slowRuntime.tracker.state().failure_code).toBe("live_role_timeout_budget_exceeded");
  });
});

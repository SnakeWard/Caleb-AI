import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
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
import type { LiveAdapterResult } from "../../src/modelBoundary/types/liveAdapterTypes.js";
import { computeSha256Digest } from "../../src/providers/liveAdapterShared.js";
import { ContentAddressedRawOutputStore } from "../../src/rawOutput/contentAddressedRawOutputStore.js";
import { validateLiveRoleSemanticPayload } from "../../src/roles/liveRoleSemanticPayloadValidator.js";
import type { RoleRuntimeAdapterInvokeInput } from "../../src/roleRuntime/types/roleRuntimeAdapter.js";

const NOW = "2026-07-19T22:00:00.000Z";
const NEW_CRITIC_DIGEST =
  "sha256:8074e98c3317f24cfe4f5bd1b94e9328ffe75e1f390a81f776badb759d3b8e8f";
const PLANNER_DIGEST =
  "sha256:f32675859e07243a7cf0cd8e743537f4c975826ea7bf684348ed128792489003";
const roots: string[] = [];

afterEach(async () => Promise.all(
  roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))
));

function sha256(text: string): string {
  return `sha256:${createHash("sha256").update(text, "utf8").digest("hex")}`;
}

function normalizedPromptText(text: string): string {
  return text.replaceAll("\r\n", "\n").replace(/\s+/g, " ").trim();
}

function promptConstraintIssues(text: string): string[] {
  const normalized = normalizedPromptText(text);
  const requirements: Readonly<Record<string, string>> = {
    object_boundary:
      "The first non-whitespace output character MUST be { and the last MUST be }.",
    no_backticks: "Do not output any backtick character.",
    no_preamble: "Do not add a preamble or trailing commentary.",
    all_ten_fields:
      "Include all ten fields above, including acceptance_status, even when an array is empty.",
    claims_max_3: "claims: at most 3 items",
    general_arrays_max_3:
      "assumptions, constraints, open_questions: string[] with at most 3 items each",
    recommendations_max_4: "recommendations: string[] with at most 4 items",
    evidence_refs_max_6: "at most 6 items",
    handoff_notes_max_2: "handoff_notes: string[] with at most 2 items",
    summary_max_200: "summary: one short non-empty string, at most 200 characters",
    identifier_max_160: "claim_id and each evidence_ref_id are at most 160 characters",
    claim_sentence_max_200: "text is one sentence at most 200 characters",
    evidence_sentence_max_200:
      "description is one sentence at most 200 characters"
  };
  return Object.entries(requirements)
    .filter(([, requirement]) => !normalized.includes(requirement))
    .map(([id]) => id);
}

function assertCriticPromptConstraints(text: string): void {
  const issues = promptConstraintIssues(text);
  if (issues.length > 0) {
    throw new Error(`Critic prompt constraints missing: ${issues.join(",")}`);
  }
}

async function bridgedEvidence() {
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
  if (!bridge.ok) throw new Error("LIVE-F9 bridge fixture failed.");
  const evidence = bridge.derived_plan.live_rotation_gate_evidence;
  if (evidence === undefined) throw new Error("LIVE-F9 gate evidence missing.");
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
  return { evidence, templates };
}

function criticInvocation(): RoleRuntimeAdapterInvokeInput {
  return {
    plan_id: "plan_live_f9",
    task_id: "task_223e4567-e89b-42d3-a456-426614174101",
    run_id: "run_223e4567-e89b-42d3-a456-426614174102",
    trace_id: "trace_live_f9",
    context_id: "context_live_f9",
    step_index: 1,
    role_id: "critic",
    adapter_id: "anthropic_live_adapter",
    adapter_kind: "live",
    context_text: "",
    context_refs: []
  };
}

async function runCriticAtOutputTokens(outputTokens: number) {
  const { evidence, templates } = await bridgedEvidence();
  const criticBinding = evidence.role_bindings.find((binding) => binding.role_id === "critic");
  if (criticBinding === undefined) throw new Error("LIVE-F9 Critic binding missing.");
  const root = await mkdtemp(join(tmpdir(), "caleb-live-f9-budget-"));
  roots.push(root);
  const store = new ContentAddressedRawOutputStore({ root_dir: root });
  const tracker = new LiveRotationRunBudgetTracker(evidence.run_budget);
  const outputText = await readFile(
    "tests/fixtures/pre-7/rehearsal-critic-valid.semantic.json",
    "utf8"
  );
  const outputDigest = computeSha256Digest(outputText);
  const invoker: LiveRotationProviderInvoker = async (input) => {
    const observed = await input.normalized_output_observer(outputText, {
      output_digest: outputDigest,
      finish_reason: "end_turn",
      output_tokens: outputTokens
    });
    if (!observed.ok) {
      return {
        ok: false,
        status: "failed",
        issues: [],
        failure: {
          failure_kind: "observer_failure",
          status: "failed",
          retryable: false,
          response_telemetry: {
            provider_response_id: `msg_live_f9_${outputTokens}`,
            output_digest: outputDigest,
            finish_reason: "end_turn",
            token_usage: {
              input_tokens: 100,
              output_tokens: outputTokens,
              total_tokens: 100 + outputTokens,
              usage_available: true
            },
            timing: {
              started_at: NOW,
              completed_at: NOW,
              latency_ms: 1,
              timed_out: false
            }
          }
        }
      } as unknown as LiveAdapterResult;
    }
    return {
      ok: true,
      status: "response_schema_valid",
      issues: [],
      response: {
        provider_response_id: `msg_live_f9_${outputTokens}`,
        output_ref: { output_digest: outputDigest },
        token_usage: {
          input_tokens: 100,
          output_tokens: outputTokens,
          total_tokens: 100 + outputTokens
        },
        timing: { latency_ms: 1 }
      }
    } as unknown as LiveAdapterResult;
  };
  const adapter = createLiveRotationRoleRuntimeAdapter({
    adapter_id: "anthropic_live_adapter",
    evidence,
    bindings: [criticBinding],
    prompt_templates: templates,
    store,
    invoke_provider: invoker,
    now: () => NOW,
    artifact_id_factory: () => "artifact_99999999-9999-4999-8999-999999999999"
  }, tracker);
  const result = await adapter.invoke(criticInvocation());
  return { budget: criticBinding.budget, result, state: tracker.state() };
}

function assertLedgerTextUnset(output: string): void {
  if (!output.trim().endsWith("text: unset")) {
    throw new Error("Ledger path is not protected by -text.");
  }
}

describe("LIVE-F9 Critic budget, prompt bounds, and Ledger byte integrity", () => {
  it("T1 locks every Critic prompt bound and proves the pre-F9 prompt violates the detector", async () => {
    const current = await readFile("examples/live-rotation/prompts/critic.prompt.txt", "utf8");
    const previous = await readFile(
      "tests/fixtures/live-f9/critic-prompt.pre-live-f9.txt",
      "utf8"
    );
    expect(promptConstraintIssues(current)).toEqual([]);
    expect(() => assertCriticPromptConstraints(current)).not.toThrow();
    expect(promptConstraintIssues(previous)).toContain("claims_max_3");
    expect(() => assertCriticPromptConstraints(previous)).toThrow(
      "Critic prompt constraints missing"
    );
  });

  it("T2 follows the fixture Critic budget at 2048 and retires 1536 as an equality signal", async () => {
    const belowNewBoundary = await runCriticAtOutputTokens(1536);
    expect(belowNewBoundary.budget.max_tokens).toBe(2048);
    expect(belowNewBoundary.result.ok).toBe(true);
    expect(belowNewBoundary.state.failure_code).toBeNull();
    expect(belowNewBoundary.state.invocations[0]).toMatchObject({
      output_tokens: 1536,
      budget: { max_tokens: 2048 },
      failure_code: null,
      observer_failure_stage: null
    });

    const atNewBoundary = await runCriticAtOutputTokens(2048);
    expect(atNewBoundary.result.ok).toBe(false);
    expect(atNewBoundary.state.failure_code).toBe("live_observer_output_truncated");
    expect(atNewBoundary.state.invocations[0]).toMatchObject({
      output_tokens: 2048,
      budget: { max_tokens: 2048 },
      failure_code: "live_observer_output_truncated",
      observer_failure_stage: "output_truncated"
    });
  });

  it("T3 pins the PRE-7 truncation rehearsal to its resolved Critic budget", async () => {
    const source = await readFile(
      "tests/acceptance/pre7MockFullRotationRehearsalAcceptance.test.ts",
      "utf8"
    );
    expect(source).toContain("criticBudgetMaxTokens");
    expect(source).toContain("run.critic_budget_max_tokens");
    expect(source).not.toMatch(/\b1536\b/);
  });

  it("T4 re-pins both live fixtures, preserves Planner bytes, and retires the old digest", async () => {
    const planner = (await readFile(
      "examples/live-rotation/prompts/planner.prompt.txt",
      "utf8"
    )).replaceAll("\r\n", "\n");
    const critic = (await readFile(
      "examples/live-rotation/prompts/critic.prompt.txt",
      "utf8"
    )).replaceAll("\r\n", "\n");
    const oldCritic = (await readFile(
      "tests/fixtures/live-f9/critic-prompt.pre-live-f9.txt",
      "utf8"
    )).replaceAll("\r\n", "\n");
    const oldDigest = sha256(oldCritic);
    expect(sha256(planner)).toBe(PLANNER_DIGEST);
    expect(sha256(critic)).toBe(NEW_CRITIC_DIGEST);
    expect(oldDigest).toBe([
      "sha256:27d169bbc002d2bcdcab89ac6df60f481",
      "e6311c015600883ed000a1f8031dd54"
    ].join(""));

    for (const fixturePath of [
      "examples/live-rotation/event-e1.anthropic.fixture.json",
      "examples/live-rotation/event-e2.cross-family.fixture.json"
    ]) {
      const fixture = JSON.parse(await readFile(fixturePath, "utf8")) as Record<string, any>;
      expect(
        fixture.runtime_rotation_plan.live_rotation_gate_evidence.prompt_templates.critic
          .sha256_digest
      ).toBe(NEW_CRITIC_DIGEST);
    }

    const grep = spawnSync(
      "git",
      ["grep", "-n", oldDigest, "--", "src", "tests", "examples"],
      { cwd: process.cwd(), encoding: "utf8" }
    );
    expect(grep.status).toBe(1);
    expect(grep.stdout).toBe("");
  }, 30_000);

  it("T5 resolves Ledger paths as -text and proves an outside path fails the detector", () => {
    const ledger = execFileSync(
      "git",
      ["check-attr", "text", "--", ".caleb/ledger/ledger.jsonl"],
      { cwd: process.cwd(), encoding: "utf8" }
    );
    // DEBT-1 locks docs/** as -text; contrast path is package.json (* text=auto only).
    const outside = execFileSync(
      "git",
      ["check-attr", "text", "--", "package.json"],
      { cwd: process.cwd(), encoding: "utf8" }
    );
    expect(ledger.trim()).toBe(".caleb/ledger/ledger.jsonl: text: unset");
    expect(outside.trim()).toBe("package.json: text: auto");
    expect(() => assertLedgerTextUnset(ledger)).not.toThrow();
    expect(() => assertLedgerTextUnset(outside)).toThrow(
      "Ledger path is not protected by -text"
    );
  }, 30_000);

  it("T6 keeps the validator schema unchanged and accepts a prompt-discouraged fourth claim", async () => {
    const validatorSource = await readFile(
      "src/roles/liveRoleSemanticPayloadValidator.ts",
      "utf8"
    );
    expect(sha256(validatorSource)).toBe(
      "sha256:5ca62b263a48f9be3fd4d2014b7021efa3653f31add6e032b2c6c6691f7be292"
    );
    const payload = {
      summary: "Validator-invariance fixture.",
      claims: Array.from({ length: 4 }, (_, index) => ({
        claim_id: `claim_${index}`,
        text: `Claim ${index}.`,
        evidence_ref_ids: []
      })),
      assumptions: [],
      constraints: [],
      open_questions: [],
      recommendations: [],
      evidence_refs: [],
      confidence: 0.5,
      handoff_notes: [],
      acceptance_status: "accepted"
    };
    expect(validateLiveRoleSemanticPayload(payload)).toMatchObject({ ok: true, issues: [] });
  });
});

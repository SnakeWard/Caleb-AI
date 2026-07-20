import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  executeBridgedRotationAtSeam,
  reconstructRotationChainFromLedgerJsonl,
  type RotationExecutionLedgerAppender
} from "../../src/logicEngine/rotationExecutionSeam.js";
import { createInMemoryRawOutputStore } from "../../src/rawOutput/inMemoryRawOutputStore.js";
import type { ContentAddressedRawOutputStore } from "../../src/rawOutput/contentAddressedRawOutputStore.js";
import type {
  RoleRuntimeAdapter,
  RoleRuntimeAdapterFailureEvidence,
  RoleRuntimeAdapterInvokeResult
} from "../../src/roleRuntime/types/roleRuntimeAdapter.js";
import type { LedgerEntry } from "../../src/types/ledger.js";
import {
  createBridgedPlannerCriticFixture,
  createPlannerCriticExecutionAdapters,
  LE3_NOW
} from "../logicEngine/rotationExecutionTestHelpers.js";

const EXECUTION_ID = "execution_88888888-8888-4888-8888-888888888888";
const SUCCESS_EXECUTION_ID = "execution_55555555-5555-4555-8555-555555555555";
const PAYLOAD_SENTINEL = "LIVE_F8_FAILING_PAYLOAD_MUST_NOT_SURVIVE";
const ERROR_SENTINEL = "LIVE_F8_EXCEPTION_MESSAGE_MUST_NOT_SURVIVE";

interface FailureRunOptions {
  readonly step_index: 0 | 1;
  readonly evidence?: RoleRuntimeAdapterFailureEvidence;
  readonly throw_error?: Error;
  readonly unsafe_payload?: string;
  readonly execution_id?: string;
  readonly append_ledger_entry?: RotationExecutionLedgerAppender;
}

async function runFailure(options: FailureRunOptions) {
  const fixture = await createBridgedPlannerCriticFixture();
  const store = createInMemoryRawOutputStore();
  const adapters = createPlannerCriticExecutionAdapters();
  const adapterId = options.step_index === 0
    ? "mock.role_runtime.planner"
    : "mock.role_runtime.critic";
  const base = adapters.get(adapterId);
  if (base === undefined) {
    throw new Error("LIVE-F8 fixture adapter missing.");
  }
  const failing: RoleRuntimeAdapter = {
    ...base,
    async invoke(input): Promise<RoleRuntimeAdapterInvokeResult> {
      if (input.step_index !== options.step_index) {
        return base.invoke(input);
      }
      if (options.throw_error !== undefined) {
        throw options.throw_error;
      }
      return {
        ok: false,
        status: "failed",
        artifact: options.unsafe_payload === undefined
          ? null
          : { unsafe_payload: options.unsafe_payload },
        failure_code: "adapter_rejected",
        ...(options.evidence === undefined ? {} : { failure_evidence: options.evidence })
      };
    }
  };
  adapters.set(adapterId, failing);

  const appended: LedgerEntry[] = [];
  const appender = options.append_ledger_entry ?? ((entry: LedgerEntry) => {
    appended.push(entry);
    return true;
  });
  const executionId = options.execution_id ?? EXECUTION_ID;
  const result = await executeBridgedRotationAtSeam({
    plan: fixture.plan,
    human_confirmed: true,
    bridge_ledger_entries: [fixture.bridge_entry],
    adapters,
    store: store as unknown as ContentAddressedRawOutputStore,
    append_ledger_entry: appender,
    now: () => LE3_NOW,
    ledger_id_factory: (activity, ordinal) => `live_f8_${activity}_${ordinal}`,
    execution_id_factory: () => executionId
  });
  return { result, appended, fixture, store, execution_id: executionId };
}

function evidence(
  input: Partial<RoleRuntimeAdapterFailureEvidence> &
    Pick<RoleRuntimeAdapterFailureEvidence, "stage" | "taxonomy">
): RoleRuntimeAdapterFailureEvidence {
  return {
    stage: input.stage,
    taxonomy: input.taxonomy,
    error_name: input.error_name ?? null,
    input_tokens: input.input_tokens ?? null,
    output_tokens: input.output_tokens ?? null,
    total_tokens: input.total_tokens ?? null,
    stop_reason: input.stop_reason ?? null,
    budget: input.budget ?? null,
    t0_digest: input.t0_digest ?? null,
    observer_normalization_stage: input.observer_normalization_stage ?? null
  };
}

function reconstruct(run: Awaited<ReturnType<typeof runFailure>>) {
  return reconstructRotationChainFromLedgerJsonl(
    [run.fixture.bridge_entry, ...run.appended]
      .map((entry) => JSON.stringify(entry))
      .join("\n"),
    run.fixture.plan.plan_id,
    run.execution_id
  );
}

async function storeT0(
  store: ReturnType<typeof createInMemoryRawOutputStore>,
  text: string
): Promise<string> {
  const stored = store.store({
    output_text: text,
    provider_id: "anthropic",
    model_id: "claude-haiku-4-5",
    created_at: LE3_NOW
  });
  if (!stored.ok || stored.record === undefined) {
    throw new Error("LIVE-F8 T0 fixture storage failed.");
  }
  return stored.record.digest;
}

async function runReturnedFailure(
  stepIndex: 0 | 1,
  stage: "output_truncated" | "json_parse",
  unsafePayload?: string,
  appender?: RotationExecutionLedgerAppender
) {
  const fixture = await createBridgedPlannerCriticFixture();
  const store = createInMemoryRawOutputStore();
  const t0Digest = await storeT0(store, unsafePayload ?? `LIVE-F8 ${stage} raw T0`);
  const adapters = createPlannerCriticExecutionAdapters();
  const adapterId = stepIndex === 0 ? "mock.role_runtime.planner" : "mock.role_runtime.critic";
  const base = adapters.get(adapterId);
  if (base === undefined) {
    throw new Error("LIVE-F8 returned-failure fixture adapter missing.");
  }
  adapters.set(adapterId, {
    ...base,
    async invoke(input): Promise<RoleRuntimeAdapterInvokeResult> {
      if (input.step_index !== stepIndex) {
        return base.invoke(input);
      }
      return {
        ok: false,
        status: "failed",
        artifact: unsafePayload === undefined ? null : { unsafe_payload: unsafePayload },
        failure_code: "adapter_rejected",
        failure_evidence: evidence({
          stage,
          taxonomy: stage === "output_truncated"
            ? "live_observer_output_truncated"
            : "live_observer_artifact_invalid",
          input_tokens: 211,
          output_tokens: stage === "output_truncated" ? 1536 : 17,
          total_tokens: stage === "output_truncated" ? 1747 : 228,
          stop_reason: stage === "output_truncated" ? "max_tokens" : "end_turn",
          budget: {
            max_tokens: 1536,
            timeout_ms: 30000,
            max_response_bytes: 1048576
          },
          t0_digest: t0Digest
        })
      };
    }
  });
  const appended: LedgerEntry[] = [];
  const result = await executeBridgedRotationAtSeam({
    plan: fixture.plan,
    human_confirmed: true,
    bridge_ledger_entries: [fixture.bridge_entry],
    adapters,
    store: store as unknown as ContentAddressedRawOutputStore,
    append_ledger_entry: appender ?? ((entry) => {
      appended.push(entry);
      return true;
    }),
    now: () => LE3_NOW,
    ledger_id_factory: (activity, ordinal) => `live_f8_${activity}_${ordinal}`,
    execution_id_factory: () => EXECUTION_ID
  });
  return { result, appended, fixture, store, execution_id: EXECUTION_ID, t0_digest: t0Digest };
}

describe("LIVE-F8 adapter-stage failure evidence and reconstruction", () => {
  it("T1 reconstructs PRE-7's Critic truncation shape with complete safe detail", async () => {
    const run = await runReturnedFailure(1, "output_truncated");
    expect(run.result.ok).toBe(false);
    expect(run.appended.map((entry) => entry.activity)).toEqual([
      "rotation_execution_started",
      "rotation_role_invocation",
      "role_invocation_failed",
      "rotation_execution_failed"
    ]);
    const failure = run.appended[2];
    expect(failure?.result).toMatchObject({
      record_type: "role_invocation_failed",
      execution_id: EXECUTION_ID,
      step_index: 1,
      role_id: "critic",
      stage: "output_truncated",
      taxonomy: "live_observer_output_truncated",
      error_name: null,
      input_tokens: 211,
      output_tokens: 1536,
      total_tokens: 1747,
      stop_reason: "max_tokens",
      budget: { max_tokens: 1536, timeout_ms: 30000, max_response_bytes: 1048576 },
      t0_digest: run.t0_digest,
      observer_normalization_stage: null,
      trust_tier: "T0"
    });
    expect(failure?.artifact_refs).toEqual([`raw-output:${run.t0_digest}`]);

    const rebuilt = reconstruct(run);
    expect(rebuilt.ok).toBe(true);
    if (!rebuilt.ok) return;
    expect(rebuilt.chain.invocations.map((entry) => entry.role_id)).toEqual(["planner"]);
    expect(rebuilt.chain.failed_step).toMatchObject({
      step_index: 1,
      role_id: "critic",
      stage: "output_truncated",
      taxonomy: "live_observer_output_truncated",
      output_tokens: 1536,
      stop_reason: "max_tokens",
      t0_digest: run.t0_digest
    });
  });

  it("T2 records and reconstructs the same adapter failure shape at step 0", async () => {
    const run = await runReturnedFailure(0, "json_parse");
    expect(run.appended.map((entry) => entry.activity)).toEqual([
      "rotation_execution_started",
      "role_invocation_failed",
      "rotation_execution_failed"
    ]);
    const rebuilt = reconstruct(run);
    expect(rebuilt.ok).toBe(true);
    if (!rebuilt.ok) return;
    expect(rebuilt.chain.invocations).toEqual([]);
    expect(rebuilt.chain.failed_step).toMatchObject({
      step_index: 0,
      role_id: "planner",
      stage: "json_parse",
      taxonomy: "live_observer_artifact_invalid"
    });
  });

  it("T3 preserves the failure record when a later terminal write throws", async () => {
    const persisted: LedgerEntry[] = [];
    const run = await runReturnedFailure(1, "output_truncated", undefined, (entry) => {
      if (entry.activity === "rotation_execution_failed") {
        throw new Error("post-record terminal failure");
      }
      persisted.push(entry);
      return true;
    });
    expect(run.result.failure_code).toBe("seam_terminal_ledger_write_failed");
    expect(persisted.map((entry) => entry.activity)).toEqual([
      "rotation_execution_started",
      "rotation_role_invocation",
      "role_invocation_failed"
    ]);
  });

  it("T4 excludes failing payload prose from records and reconstruction", async () => {
    const run = await runReturnedFailure(0, "json_parse", PAYLOAD_SENTINEL);
    const ledgerBytes = run.appended.map((entry) => JSON.stringify(entry)).join("\n");
    expect(ledgerBytes).not.toContain(PAYLOAD_SENTINEL);
    expect(JSON.stringify(reconstruct(run))).not.toContain(PAYLOAD_SENTINEL);
  });

  it("T5 preserves the pre-F8 successful reconstruction bytes and emits no failure record", async () => {
    const expected = JSON.parse(
      await readFile("tests/fixtures/live-f8/pre-f8-success-reconstruction.sha256.json", "utf8")
    ) as { byte_length: number; sha256: string };
    const fixture = await createBridgedPlannerCriticFixture();
    const appended: LedgerEntry[] = [];
    const result = await executeBridgedRotationAtSeam({
      plan: fixture.plan,
      human_confirmed: true,
      bridge_ledger_entries: [fixture.bridge_entry],
      adapters: createPlannerCriticExecutionAdapters(),
      store: createInMemoryRawOutputStore() as unknown as ContentAddressedRawOutputStore,
      append_ledger_entry: (entry) => {
        appended.push(entry);
        return true;
      },
      now: () => LE3_NOW,
      ledger_id_factory: (activity, ordinal) => `rotation_${activity}_${ordinal}`,
      execution_id_factory: () => SUCCESS_EXECUTION_ID
    });
    expect(result.ok).toBe(true);
    expect(appended.some((entry) => entry.activity === "role_invocation_failed")).toBe(false);
    const rebuilt = reconstructRotationChainFromLedgerJsonl(
      [fixture.bridge_entry, ...appended].map((entry) => JSON.stringify(entry)).join("\n"),
      fixture.plan.plan_id,
      SUCCESS_EXECUTION_ID
    );
    const bytes = JSON.stringify(rebuilt);
    expect(bytes.length).toBe(expected.byte_length);
    expect(`sha256:${createHash("sha256").update(bytes).digest("hex")}`).toBe(expected.sha256);
  });

  it("T6 keeps attempt-six-era missing failure evidence honestly null", async () => {
    const current = await runReturnedFailure(0, "json_parse");
    const failureLedgerId = current.appended.find(
      (entry) => entry.activity === "role_invocation_failed"
    )?.ledger_id;
    const historical = current.appended
      .filter((entry) => entry.activity !== "role_invocation_failed")
      .map((entry) => {
        if (entry.activity !== "rotation_execution_failed") return entry;
        const result = { ...(entry.result as Record<string, unknown>) };
        delete result["failed_step_record_id"];
        delete result["gate_evaluation_ledger_ids"];
        return {
          ...entry,
          result,
          parent_refs: entry.parent_refs.filter((ref) => ref !== failureLedgerId)
        };
      });
    const rebuilt = reconstructRotationChainFromLedgerJsonl(
      [current.fixture.bridge_entry, ...historical]
        .map((entry) => JSON.stringify(entry))
        .join("\n"),
      current.fixture.plan.plan_id,
      current.execution_id
    );
    expect(rebuilt.ok).toBe(true);
    if (!rebuilt.ok) return;
    expect(rebuilt.chain.failed_step).toBeNull();
    expect(rebuilt.chain.failure_code).toBe("adapter_invocation_failed");
  });

  it("T7 closes a throwing Planner adapter into a complete step-0 evidence chain", async () => {
    const run = await runFailure({ step_index: 0, throw_error: new TypeError(ERROR_SENTINEL) });
    expect(run.result.ok).toBe(false);
    expect(run.appended.map((entry) => entry.activity)).toEqual([
      "rotation_execution_started",
      "role_invocation_failed",
      "rotation_execution_failed"
    ]);
    const rebuilt = reconstruct(run);
    expect(rebuilt.ok).toBe(true);
    if (!rebuilt.ok) return;
    expect(rebuilt.chain.failed_step).toMatchObject({
      step_index: 0,
      role_id: "planner",
      stage: "invocation_exception",
      taxonomy: null,
      error_name: "TypeError"
    });
  });

  it("T8 reconstructs Planner success alongside a throwing Critic at step 1", async () => {
    const run = await runFailure({ step_index: 1, throw_error: new RangeError(ERROR_SENTINEL) });
    const rebuilt = reconstruct(run);
    expect(rebuilt.ok).toBe(true);
    if (!rebuilt.ok) return;
    expect(rebuilt.chain.invocations.map((entry) => entry.role_id)).toEqual(["planner"]);
    expect(rebuilt.chain.failed_step).toMatchObject({
      step_index: 1,
      role_id: "critic",
      stage: "invocation_exception",
      taxonomy: null,
      error_name: "RangeError"
    });
  });

  it("T9 proves the seam receives structured failure and constructs its terminal", async () => {
    const run = await runFailure({ step_index: 0, throw_error: new Error(ERROR_SENTINEL) });
    expect(run.result).toMatchObject({
      ok: false,
      status: "failed",
      failure_code: "adapter_invocation_failed",
      execution_result: {
        status: "failed",
        failed_step_index: 0,
        failure_code: "adapter_invocation_failed"
      }
    });
    expect(run.appended.at(-1)?.activity).toBe("rotation_execution_failed");
  });

  it("T10 excludes exception message and stack prose from every serialized shape", async () => {
    const error = new TypeError(ERROR_SENTINEL);
    error.stack = `${ERROR_SENTINEL}\nsecret stack location`;
    const run = await runFailure({ step_index: 1, throw_error: error });
    const ledgerBytes = run.appended.map((entry) => JSON.stringify(entry)).join("\n");
    const rebuiltBytes = JSON.stringify(reconstruct(run));
    expect(ledgerBytes).not.toContain(ERROR_SENTINEL);
    expect(ledgerBytes).not.toContain("secret stack location");
    expect(rebuiltBytes).not.toContain(ERROR_SENTINEL);
    expect(rebuiltBytes).not.toContain("secret stack location");
    expect(ledgerBytes).toContain("TypeError");
  });
});

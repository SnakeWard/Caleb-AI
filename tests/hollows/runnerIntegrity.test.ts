import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  HollowRegistry,
  HollowRunner,
  characterCountManifest,
  type HollowImplementation
} from "../../src/hollows/index.js";
import type { HollowExecutionContext } from "../../src/hollows/runnerTypes.js";
import type { JsonValue } from "../../src/types/index.js";

const fixedNow = () => new Date("2026-07-04T00:00:00.000Z");

const UUID_ID_PATTERN =
  /^invocation_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// Test-only Hollow implementation fixture. This is not a production Hollow module.
const echoImplementation: HollowImplementation = ({ input_payload }) => ({
  result: { echoed: input_payload }
});

describe("HollowRunner input digest", () => {
  it("computes a real sha256 digest over the serialized payload when none is provided", async () => {
    const runner = createRunner({ "hollow.text.character_count": echoImplementation });
    const payload: JsonValue = { text: "Caleb" };

    const record = await runner.run({
      hollow_id: "hollow.text.character_count",
      input_payload: payload
    });

    const expected = `sha256:${createHash("sha256")
      .update(JSON.stringify(payload))
      .digest("hex")}`;
    expect(record.input_digest).toBe(expected);
    expect(record.status).toBe("completed");
  });

  it("produces different digests for different payloads", async () => {
    const runner = createRunner({ "hollow.text.character_count": echoImplementation });

    const first = await runner.run({
      hollow_id: "hollow.text.character_count",
      input_payload: { text: "one" }
    });
    const second = await runner.run({
      hollow_id: "hollow.text.character_count",
      input_payload: { text: "two" }
    });

    expect(first.input_digest).not.toBe(second.input_digest);
  });

  it("preserves an explicitly provided input digest untouched", async () => {
    const runner = createRunner({ "hollow.text.character_count": echoImplementation });

    const record = await runner.run({
      hollow_id: "hollow.text.character_count",
      input_payload: { text: "Caleb" },
      input_digest: "sha256:caller_provided"
    });

    expect(record.input_digest).toBe("sha256:caller_provided");
  });

  it("rejects an unserializable payload with the sentinel digest and no execution", async () => {
    let wasExecuted = false;
    const runner = createRunner({
      "hollow.text.character_count": () => {
        wasExecuted = true;
        return { result: { ok: true } };
      }
    });

    const circular: Record<string, unknown> = {};
    circular.self = circular;

    const record = await runner.run({
      hollow_id: "hollow.text.character_count",
      input_payload: circular as unknown as JsonValue
    });

    expect(record.status).toBe("rejected");
    expect(record.input_digest).toBe("sha256:unserializable");
    expect(wasExecuted).toBe(false);
  });
});

describe("HollowRunner id generation", () => {
  it("generates unique uuid-based ids across invocations and runner instances", async () => {
    const runnerA = createRunner({ "hollow.text.character_count": echoImplementation });
    const runnerB = createRunner({ "hollow.text.character_count": echoImplementation });

    const first = await runnerA.run({
      hollow_id: "hollow.text.character_count",
      input_payload: { text: "Caleb" }
    });
    const second = await runnerB.run({
      hollow_id: "hollow.text.character_count",
      input_payload: { text: "Caleb" }
    });

    expect(first.invocation_id).toMatch(UUID_ID_PATTERN);
    expect(second.invocation_id).toMatch(UUID_ID_PATTERN);
    expect(first.invocation_id).not.toBe(second.invocation_id);
    expect(first.task_id).not.toBe(second.task_id);
    expect(first.run_id).not.toBe(second.run_id);
    expect(first.trace_id).not.toBe(second.trace_id);
  });

  it("uses an injected id_generator for all generated ids", async () => {
    const registry = new HollowRegistry([characterCountManifest]);
    const runner = new HollowRunner(
      registry,
      { "hollow.text.character_count": echoImplementation },
      { now: fixedNow, id_generator: (prefix) => `${prefix}_fixed` }
    );

    const record = await runner.run({
      hollow_id: "hollow.text.character_count",
      input_payload: { text: "Caleb" }
    });

    expect(record.invocation_id).toBe("invocation_fixed");
    expect(record.task_id).toBe("task_fixed");
    expect(record.run_id).toBe("run_fixed");
    expect(record.trace_id).toBe("trace_fixed");
  });

  it("request-provided ids always win over the id generator", async () => {
    const registry = new HollowRegistry([characterCountManifest]);
    const runner = new HollowRunner(
      registry,
      { "hollow.text.character_count": echoImplementation },
      { now: fixedNow, id_generator: (prefix) => `${prefix}_fixed` }
    );

    const record = await runner.run({
      hollow_id: "hollow.text.character_count",
      input_payload: { text: "Caleb" },
      invocation_id: "invocation_explicit",
      task_id: "task_explicit",
      run_id: "run_explicit",
      trace_id: "trace_explicit"
    });

    expect(record.invocation_id).toBe("invocation_explicit");
    expect(record.task_id).toBe("task_explicit");
    expect(record.run_id).toBe("run_explicit");
    expect(record.trace_id).toBe("trace_explicit");
  });
});

describe("HollowRunner abort signal", () => {
  it("provides an unaborted abort_signal in the execution context on success", async () => {
    let observed: HollowExecutionContext | undefined;
    const runner = createRunner({
      "hollow.text.character_count": ({ context }) => {
        observed = context;
        return { result: { ok: true } };
      }
    });

    const record = await runner.run({
      hollow_id: "hollow.text.character_count",
      input_payload: { text: "Caleb" }
    });

    expect(record.status).toBe("completed");
    expect(observed?.abort_signal).toBeInstanceOf(AbortSignal);
    expect(observed?.abort_signal?.aborted).toBe(false);
  });

  it("aborts the signal when the invocation times out", async () => {
    let observed: HollowExecutionContext | undefined;
    const runner = createRunner(
      {
        "hollow.text.character_count": async ({ context }) => {
          observed = context;
          await new Promise((resolve) => setTimeout(resolve, 30));
          return { result: { late: true } };
        }
      },
      { default_timeout_ms: 5 }
    );

    const record = await runner.run({
      hollow_id: "hollow.text.character_count",
      input_payload: { text: "Caleb" }
    });

    expect(record.status).toBe("failed");
    expect(record.errors[0]?.error_id).toBe("HollowRunnerTimeoutError");
    expect(observed?.abort_signal?.aborted).toBe(true);
  });
});

function createRunner(
  implementations: Record<string, HollowImplementation> = {},
  options: { default_timeout_ms?: number } = {}
): HollowRunner {
  const registry = new HollowRegistry([characterCountManifest]);
  return new HollowRunner(registry, implementations, { ...options, now: fixedNow });
}

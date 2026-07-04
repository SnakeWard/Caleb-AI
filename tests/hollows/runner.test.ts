import { describe, expect, it } from "vitest";

import {
  HollowImplementationNotFoundError,
  HollowRegistry,
  HollowRunner,
  characterCountManifest,
  type HollowImplementation
} from "../../src/hollows/index.js";
import type { HollowManifest, JsonValue } from "../../src/types/index.js";

const fixedNow = () => new Date("2026-06-06T00:00:00.000Z");

// Test-only Hollow implementation fixture. This is not a production Character Count Hollow.
const testCharacterCountImplementation: HollowImplementation = ({ input_payload }) => {
  const text = readText(input_payload);
  return {
    result: { count: text.length },
    result_units: "test_characters",
    confidence_level: "test_local_execution"
  };
};

// Test-only Hollow implementation fixture. This is not a production Hollow module.
const testNoUnitsImplementation: HollowImplementation = ({ input_payload }) => ({
  result: { echoed: input_payload }
});

// Test-only Hollow implementation fixture. This is not a production Hollow module.
const throwingImplementation: HollowImplementation = () => {
  throw new Error("test implementation failure");
};

// Test-only Hollow implementation fixture. This is not a production Hollow module.
const delayedImplementation: HollowImplementation = async () => {
  await new Promise((resolve) => setTimeout(resolve, 30));
  return { result: { delayed: true } };
};

describe("HollowRunner", () => {
  it("can be constructed with a HollowRegistry", () => {
    const registry = new HollowRegistry([characterCountManifest]);
    const runner = new HollowRunner(registry);

    expect(runner).toBeInstanceOf(HollowRunner);
  });

  it("registerImplementation stores an implementation", () => {
    const runner = createRunner();

    runner.registerImplementation(
      "hollow.text.character_count",
      testCharacterCountImplementation
    );

    expect(runner.hasImplementation("hollow.text.character_count")).toBe(true);
  });

  it("hasImplementation returns true after registration", () => {
    const runner = createRunner({
      "hollow.text.character_count": testCharacterCountImplementation
    });

    expect(runner.hasImplementation("hollow.text.character_count")).toBe(true);
  });

  it("run executes a registered V1-safe manifest implementation", async () => {
    const runner = createRunner({
      "hollow.text.character_count": testCharacterCountImplementation
    });

    const record = await runner.run({
      hollow_id: "hollow.text.character_count",
      input_payload: { text: "Caleb" },
      input_digest: "sha256:input",
      invocation_id: "invocation_test",
      task_id: "task_test",
      run_id: "run_test",
      trace_id: "trace_test"
    });

    expect(record.result).toEqual({ count: 5 });
  });

  it("successful run returns an untrusted HollowInvocationRecord", async () => {
    const runner = createRunner({
      "hollow.text.character_count": testCharacterCountImplementation
    });

    const record = await runner.run({
      hollow_id: "hollow.text.character_count",
      input_payload: { text: "Caleb" },
      input_digest: "sha256:input",
      invocation_id: "invocation_test",
      task_id: "task_test",
      run_id: "run_test",
      trace_id: "trace_test"
    });

    expect(record.hollow_id).toBe("hollow.text.character_count");
    expect(record.invocation_id).toBe("invocation_test");
    expect(record.task_id).toBe("task_test");
    expect(record.run_id).toBe("run_test");
    expect(record.trace_id).toBe("trace_test");
    expect(record.status).toBe("completed");
    expect(record.trust_tier).toBe("T0");
    expect(record.verification_status).toBe("unverified");
    expect(record.ledger_refs).toEqual([]);
  });

  it("successful run uses result_units from implementation when provided", async () => {
    const runner = createRunner({
      "hollow.text.character_count": testCharacterCountImplementation
    });

    const record = await runner.run({
      hollow_id: "hollow.text.character_count",
      input_payload: { text: "Caleb" }
    });

    expect(record.result_units).toBe("test_characters");
  });

  it("successful run falls back to manifest result_units when implementation omits result_units", async () => {
    const runner = createRunner({
      "hollow.text.character_count": testNoUnitsImplementation
    });

    const record = await runner.run({
      hollow_id: "hollow.text.character_count",
      input_payload: { text: "Caleb" }
    });

    expect(record.result_units).toBe("characters");
  });

  it("run rejects oversized input before execution", async () => {
    let wasExecuted = false;
    const smallInputManifest = {
      ...characterCountManifest,
      hollow_id: "hollow.text.small_input",
      max_input_size: 5
    } satisfies HollowManifest;
    const registry = new HollowRegistry([smallInputManifest]);
    const runner = new HollowRunner(
      registry,
      {
        "hollow.text.small_input": () => {
          wasExecuted = true;
          return { result: { ok: true } };
        }
      },
      { now: fixedNow }
    );

    const record = await runner.run({
      hollow_id: "hollow.text.small_input",
      input_payload: { text: "too large" }
    });

    expect(record.status).toBe("rejected");
    expect(record.errors[0]?.message).toContain("exceeds max_input_size");
    expect(wasExecuted).toBe(false);
  });

  it("run rejects requested permission not declared by manifest", async () => {
    const runner = createRunner({
      "hollow.text.character_count": testCharacterCountImplementation
    });

    const record = await runner.run({
      hollow_id: "hollow.text.character_count",
      input_payload: { text: "Caleb" },
      permissions: ["read_only"]
    });

    expect(record.status).toBe("rejected");
    expect(record.errors[0]?.message).toContain("not declared");
  });

  it("run blocks manifest with network permission", async () => {
    const manifest = {
      ...characterCountManifest,
      hollow_id: "hollow.text.network_test",
      permissions: ["network"],
      permissions_required: ["network"]
    } as unknown as HollowManifest;
    const runner = createRunnerForManifest(manifest);

    const record = await runner.run({
      hollow_id: "hollow.text.network_test",
      input_payload: { text: "Caleb" }
    });

    expect(record.status).toBe("blocked");
    expect(record.errors[0]?.message).toContain("not V1-safe");
  });

  it("run blocks manifest with shell_command permission", async () => {
    const manifest = {
      ...characterCountManifest,
      hollow_id: "hollow.text.shell_test",
      permissions: ["shell_command"],
      permissions_required: ["shell_command"]
    } as unknown as HollowManifest;
    const runner = createRunnerForManifest(manifest);

    const record = await runner.run({
      hollow_id: "hollow.text.shell_test",
      input_payload: { text: "Caleb" }
    });

    expect(record.status).toBe("blocked");
    expect(record.errors[0]?.message).toContain("not V1-safe");
  });

  it("run throws HollowImplementationNotFoundError when implementation is missing", async () => {
    const registry = new HollowRegistry([characterCountManifest]);
    const runner = new HollowRunner(registry, new Map(), { now: fixedNow });

    await expect(
      runner.run({
        hollow_id: "hollow.text.character_count",
        input_payload: { text: "Caleb" }
      })
    ).rejects.toThrow(HollowImplementationNotFoundError);
  });

  it("run returns failed HollowInvocationRecord when implementation throws", async () => {
    const runner = createRunner({
      "hollow.text.character_count": throwingImplementation
    });

    const record = await runner.run({
      hollow_id: "hollow.text.character_count",
      input_payload: { text: "Caleb" }
    });

    expect(record.status).toBe("failed");
    expect(record.errors[0]?.message).toBe("test implementation failure");
  });

  it("failed implementation record contains structured error and trust_tier T0", async () => {
    const runner = createRunner({
      "hollow.text.character_count": throwingImplementation
    });

    const record = await runner.run({
      hollow_id: "hollow.text.character_count",
      input_payload: { text: "Caleb" }
    });

    expect(record.errors[0]).toMatchObject({
      error_id: "HollowRunnerInputError",
      severity: "error",
      retryable: false
    });
    expect(record.trust_tier).toBe("T0");
  });

  it("timeout returns failed HollowInvocationRecord", async () => {
    const runner = createRunner(
      {
        "hollow.text.character_count": delayedImplementation
      },
      { default_timeout_ms: 5 }
    );

    const record = await runner.run({
      hollow_id: "hollow.text.character_count",
      input_payload: { text: "Caleb" }
    });

    expect(record.status).toBe("failed");
    expect(record.errors[0]?.error_id).toBe("HollowRunnerTimeoutError");
    expect(record.retryable).toBe(true);
    expect(record.trust_tier).toBe("T0");
  });

  it("runner does not create EvidencePacket or Ledger entries", async () => {
    const runner = createRunner({
      "hollow.text.character_count": testCharacterCountImplementation
    });

    const record = await runner.run({
      hollow_id: "hollow.text.character_count",
      input_payload: { text: "Caleb" }
    });

    expect(record.ledger_refs).toEqual([]);
    expect("can_model_consume" in record).toBe(false);
    expect(record.trust_tier).toBe("T0");
    expect(record.verification_status).toBe("unverified");
  });
});

function createRunner(
  implementations: Record<string, HollowImplementation> = {},
  options: { default_timeout_ms?: number } = {}
): HollowRunner {
  const registry = new HollowRegistry([characterCountManifest]);
  return new HollowRunner(registry, implementations, { ...options, now: fixedNow });
}

function createRunnerForManifest(manifest: HollowManifest): HollowRunner {
  const registry = new HollowRegistry([manifest]);
  return new HollowRunner(
    registry,
    {
      [manifest.hollow_id]: testCharacterCountImplementation
    },
    { now: fixedNow }
  );
}

function readText(input: JsonValue): string {
  if (
    typeof input === "object" &&
    input !== null &&
    !Array.isArray(input) &&
    typeof input.text === "string"
  ) {
    return input.text;
  }

  return "";
}

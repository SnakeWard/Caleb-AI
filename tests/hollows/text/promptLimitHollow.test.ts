import { describe, expect, it } from "vitest";
import { HollowRegistry, HollowRunner } from "../../../src/hollows/index.js";
import {
  checkPromptLimit,
  promptLimitImplementation,
  promptLimitManifest,
} from "../../../src/hollows/categories/text/index.js";
import type { JsonObject } from "../../../src/types/index.js";
import type { PromptLimitResult } from "../../../src/hollows/categories/text/index.js";

describe("Prompt Limit Hollow", () => {
  it("text under limit returns within_limit true", () => {
    expect(checkPromptLimit({ text: "short", limit: 10 }).within_limit).toBe(true);
  });

  it("text exactly at limit returns within_limit true and remaining 0", () => {
    const result = checkPromptLimit({ text: "12345", limit: 5 });

    expect(result.within_limit).toBe(true);
    expect(result.remaining).toBe(0);
  });

  it("text over limit returns within_limit false and over_by", () => {
    const result = checkPromptLimit({ text: "123456", limit: 5 });

    expect(result.within_limit).toBe(false);
    expect(result.over_by).toBe(1);
  });

  it("over-limit result emits prompt_limit_exceeded warning", async () => {
    const record = await runPromptLimit({ text: "123456", limit: 5 });

    expect((record.result as PromptLimitResult).within_limit).toBe(false);
    expect(record.warnings.map((warning) => warning.warning_id)).toContain("prompt_limit_exceeded");
  });

  it("invalid limit fails clearly", async () => {
    const record = await runPromptLimit({ text: "abc", limit: 0 });

    expect(record.status).toBe("failed");
    expect(record.errors[0]?.message).toContain("positive number");
  });

  it("empty text emits empty_text warning", async () => {
    const record = await runPromptLimit({ text: "", limit: 5 });

    expect(record.warnings.map((warning) => warning.warning_id)).toContain("empty_text");
  });
});

async function runPromptLimit(input_payload: JsonObject) {
  const registry = new HollowRegistry([promptLimitManifest]);
  const runner = new HollowRunner(registry, {
    [promptLimitManifest.hollow_id]: promptLimitImplementation,
  });

  return await runner.run({
    hollow_id: promptLimitManifest.hollow_id,
    input_payload,
    task_id: "task_text_prompt_limit",
    run_id: "run_text_prompt_limit",
    trace_id: "trace_text_prompt_limit",
    invocation_id: "invocation_text_prompt_limit",
  });
}

import { describe, expect, it } from "vitest";
import { HollowRegistry, HollowRunner } from "../../../src/hollows/index.js";
import {
  characterCountImplementation,
  characterCountManifest,
  countCharacters,
} from "../../../src/hollows/categories/text/index.js";
import type { JsonObject } from "../../../src/types/index.js";
import type { CharacterCountResult } from "../../../src/hollows/categories/text/index.js";

describe("Character Count Hollow", () => {
  it("counts characters for simple text", () => {
    expect(countCharacters({ text: "Caleb" }).character_count).toBe(5);
  });

  it("counts empty text and emits empty_text warning", async () => {
    const record = await runCharacterCount({ text: "" });

    expect((record.result as CharacterCountResult).character_count).toBe(0);
    expect(record.warnings.map((warning) => warning.warning_id)).toContain("empty_text");
  });

  it("counts lines and newlines", () => {
    const result = countCharacters({ text: "one\ntwo\nthree" });

    expect(result.line_count).toBe(3);
    expect(result.newline_count).toBe(2);
  });

  it("counts words deterministically", () => {
    expect(countCharacters({ text: "Models think. Hollows work." }).word_count).toBe(4);
  });

  it("implementation returns result_units characters", async () => {
    const record = await runCharacterCount({ text: "abc" });

    expect(record.result_units).toBe("characters");
  });

  it("malformed input fails through the runner", async () => {
    const record = await runCharacterCount({ value: "missing text" });

    expect(record.status).toBe("failed");
    expect(record.errors[0]?.message).toContain("input_payload.text");
  });
});

async function runCharacterCount(input_payload: JsonObject) {
  const registry = new HollowRegistry([characterCountManifest]);
  const runner = new HollowRunner(registry, {
    [characterCountManifest.hollow_id]: characterCountImplementation,
  });

  return await runner.run({
    hollow_id: characterCountManifest.hollow_id,
    input_payload,
    task_id: "task_text_character_count",
    run_id: "run_text_character_count",
    trace_id: "trace_text_character_count",
    invocation_id: "invocation_text_character_count",
  });
}

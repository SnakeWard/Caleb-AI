import { describe, expect, it } from "vitest";
import { HollowRegistry, HollowRunner } from "../../../src/hollows/index.js";
import {
  repetitionScanImplementation,
  repetitionScanManifest,
  scanRepetition,
} from "../../../src/hollows/categories/text/index.js";
import type { JsonObject } from "../../../src/types/index.js";

describe("Repetition Scan Hollow", () => {
  it("detects repeated two-word phrase", () => {
    const result = scanRepetition({ text: "hollows work and hollows work again" });

    expect(result.repeated_phrases).toContainEqual({
      phrase: "hollows work",
      count: 2,
      phrase_length: 2,
    });
  });

  it("respects case_sensitive false by default", () => {
    const result = scanRepetition({ text: "Hollows work and hollows work" });

    expect(result.repeated_phrases.find((phrase) => phrase.phrase === "hollows work")?.count).toBe(2);
  });

  it("respects case_sensitive true", () => {
    const result = scanRepetition({
      text: "Hollows work and hollows work",
      case_sensitive: true,
    });

    expect(result.repeated_phrases.find((phrase) => phrase.phrase === "hollows work")).toBeUndefined();
  });

  it("respects min_repetitions", () => {
    const result = scanRepetition({
      text: "caleb ai caleb ai caleb ai",
      min_repetitions: 3,
      min_phrase_length: 2,
      max_phrase_length: 2,
    });

    expect(result.repeated_phrases).toContainEqual({
      phrase: "caleb ai",
      count: 3,
      phrase_length: 2,
    });
  });

  it("limits repeated phrase output to top results", () => {
    const text = Array.from({ length: 40 }, (_, index) => `phrase${index} repeat`).join(" ");
    const result = scanRepetition({
      text: `${text} ${text}`,
      min_phrase_length: 2,
      max_phrase_length: 2,
    });

    expect(result.repeated_phrases.length).toBeLessThanOrEqual(25);
  });

  it("empty text emits empty_text warning", async () => {
    const record = await runRepetitionScan({ text: "" });

    expect(record.warnings.map((warning) => warning.warning_id)).toContain("empty_text");
  });

  it("returns token_count and repeated_phrase_count", () => {
    const result = scanRepetition({ text: "one two one two" });

    expect(result.token_count).toBe(4);
    expect(result.repeated_phrase_count).toBeGreaterThan(0);
  });
});

async function runRepetitionScan(input_payload: JsonObject) {
  const registry = new HollowRegistry([repetitionScanManifest]);
  const runner = new HollowRunner(registry, {
    [repetitionScanManifest.hollow_id]: repetitionScanImplementation,
  });

  return await runner.run({
    hollow_id: repetitionScanManifest.hollow_id,
    input_payload,
    task_id: "task_text_repetition_scan",
    run_id: "run_text_repetition_scan",
    trace_id: "trace_text_repetition_scan",
    invocation_id: "invocation_text_repetition_scan",
  });
}

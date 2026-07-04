import { describe, expect, it } from "vitest";
import { HollowRegistry, HollowRunner } from "../../../src/hollows/index.js";
import {
  countLines,
  lineCountImplementation,
  lineCountManifest
} from "../../../src/hollows/categories/code/index.js";

describe("Line Count Hollow", () => {
  it("counts lines for LF text", () => {
    expect(countLines({ text: "one\ntwo\nthree" }).line_count).toBe(3);
  });

  it("counts lines for CRLF text", () => {
    expect(countLines({ text: "one\r\ntwo" }).line_count).toBe(2);
  });

  it("empty string returns zero line counts and emits empty_text warning", async () => {
    const record = await runLineCount({ text: "" });

    expect(record.result).toMatchObject({ line_count: 0, non_empty_line_count: 0, empty_line_count: 0 });
    expect(record.warnings.map((warning) => warning.warning_id)).toContain("empty_text");
  });

  it("counts non-empty and empty lines separately", () => {
    const result = countLines({ text: "one\n\n  \ntwo" });

    expect(result.non_empty_line_count).toBe(2);
    expect(result.empty_line_count).toBe(2);
  });

  it("detects trailing newline", () => {
    expect(countLines({ text: "one\n" }).trailing_newline).toBe(true);
  });

  it("calculates max_line_length", () => {
    expect(countLines({ text: "a\nabcdef" }).max_line_length).toBe(6);
  });

  it("warns for very_long_line", async () => {
    const record = await runLineCount({ text: "x".repeat(501) });

    expect(record.warnings.map((warning) => warning.warning_id)).toContain("very_long_line");
  });

  it("returns result_units lines", async () => {
    const record = await runLineCount({ text: "one" });

    expect(record.result_units).toBe("lines");
  });

  it("malformed input fails clearly through the runner", async () => {
    const record = await runLineCount({ value: "no text" });

    expect(record.status).toBe("failed");
    expect(record.errors[0]?.message).toContain("text");
  });
});

async function runLineCount(input_payload: object) {
  const registry = new HollowRegistry([lineCountManifest]);
  const runner = new HollowRunner(registry, { [lineCountManifest.hollow_id]: lineCountImplementation });

  return await runner.run({
    hollow_id: lineCountManifest.hollow_id,
    input_payload: input_payload as never,
    task_id: "task_line_count",
    run_id: "run_line_count",
    trace_id: "trace_line_count",
    invocation_id: "invocation_line_count"
  });
}

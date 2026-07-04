import type { CalebWarning } from "../../../types/invocation.js";
import type { HollowImplementation } from "../../runnerTypes.js";
import { lineCountManifest as manifest } from "./codeHollowManifests.js";
import type { LineCountInput, LineCountResult } from "./codeHollowTypes.js";

export const lineCountManifest = manifest;

export function countLines(input: LineCountInput): LineCountResult {
  const newlineMatches = input.text.match(/\r\n|\r|\n/g);
  const newline_count = newlineMatches?.length ?? 0;
  const trailing_newline = /(?:\r\n|\r|\n)$/.test(input.text);
  const lines = input.text.length === 0 ? [] : input.text.split(/\r\n|\r|\n/);
  const countedLines = trailing_newline ? lines.slice(0, -1) : lines;
  const non_empty_line_count = countedLines.filter((line) => line.trim().length > 0).length;
  const line_count = countedLines.length;

  return {
    line_count,
    non_empty_line_count,
    empty_line_count: line_count - non_empty_line_count,
    newline_count,
    max_line_length: countedLines.reduce((max, line) => Math.max(max, line.length), 0),
    trailing_newline
  };
}

export const lineCountImplementation: HollowImplementation = ({ input_payload }) => {
  const input = parseLineCountInput(input_payload);
  const result = countLines(input);
  const warnings: CalebWarning[] = [];

  if (input.text.length === 0) {
    warnings.push({ warning_id: "empty_text", message: "Input text is empty.", severity: "warning" });
  }
  if (result.max_line_length > 500) {
    warnings.push({
      warning_id: "very_long_line",
      message: "At least one line exceeds 500 characters.",
      severity: "warning"
    });
  }

  return {
    result,
    result_units: "lines",
    checks: [
      { check_id: "input_text_present", label: "Input Text Present", status: "completed", severity: "info" },
      { check_id: "line_count_completed", label: "Line Count Completed", status: "completed", severity: "info" }
    ],
    warnings,
    artifact_hashes: [],
    confidence_level: "deterministic_line_count"
  };
};

function parseLineCountInput(input: unknown): LineCountInput {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new Error("Line Count Hollow requires an object input payload.");
  }
  const candidate = input as { text?: unknown; count_empty_lines?: unknown };
  if (typeof candidate.text !== "string") {
    throw new Error("Line Count Hollow requires input_payload.text as a string.");
  }
  if (candidate.count_empty_lines !== undefined && typeof candidate.count_empty_lines !== "boolean") {
    throw new Error("Line Count Hollow count_empty_lines must be boolean when provided.");
  }
  return {
    text: candidate.text,
    ...(candidate.count_empty_lines === undefined ? {} : { count_empty_lines: candidate.count_empty_lines })
  };
}

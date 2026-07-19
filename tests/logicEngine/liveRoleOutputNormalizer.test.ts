import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { normalizeLiveRoleOutput } from "../../src/logicEngine/liveRoleOutputNormalizer.js";

const NEAR_MISS_FIXTURES = [
  "live-f6-near-miss-missing-closing-fence.txt",
  "live-f6-near-miss-wrong-language-tag.txt",
  "live-f6-near-miss-trailing-content.txt",
  "live-f6-near-miss-two-json-objects.txt"
] as const;

describe("LIVE-F6 exact whole-document wrapper normalizer", () => {
  it.each([
    ["tagged", "```json\n{\"ok\":true}\n```", "{\"ok\":true}\n"],
    ["untagged", "```\r\n{\"ok\":true}\r\n```", "{\"ok\":true}\r\n"]
  ])("unwraps one exact %s fence only after the complete inner object parses", (
    _label,
    input,
    expected
  ) => {
    expect(normalizeLiveRoleOutput(input)).toEqual({
      normalized_text: expected,
      normalization_stage: "markdown_fence_unwrapped"
    });
  });

  it("allows only whitespace outside the exact wrapper while retaining inner bytes", () => {
    const input = " \r\n\t\r\n```json\r\n  {\"ok\":true}  \r\n```\r\n \t";
    expect(normalizeLiveRoleOutput(input)).toEqual({
      normalized_text: "  {\"ok\":true}  \r\n",
      normalization_stage: "markdown_fence_unwrapped"
    });
  });

  it("returns unfenced valid JSON byte-identically with no applied stage", () => {
    const input = " \r\n{\"ok\":true}\r\n ";
    const result = normalizeLiveRoleOutput(input);
    expect(result.normalized_text).toBe(input);
    expect(result.normalization_stage).toBeNull();
  });

  it.each([
    ["leading preamble", "Here is JSON:\n{\"ok\":true}"],
    ["braces in prose", "Use {this} illustrative prose, not JSON."],
    ["fenced array", "```json\n[1,2,3]\n```"],
    ["malformed fenced object", "```json\n{\"ok\":true,}\n```"]
  ])("does not search, extract, or repair %s", (_label, input) => {
    expect(normalizeLiveRoleOutput(input)).toEqual({
      normalized_text: input,
      normalization_stage: null
    });
  });

  it.each(NEAR_MISS_FIXTURES)("binds the near-miss fixture %s", async (name) => {
    const input = await readFile(`examples/live-rotation/regressions/${name}`, "utf8");
    expect(normalizeLiveRoleOutput(input)).toEqual({
      normalized_text: input,
      normalization_stage: null
    });
  });
});

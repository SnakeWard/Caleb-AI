import { describe, expect, it } from "vitest";
import { HollowRegistry, HollowRunner } from "../../../src/hollows/index.js";
import {
  detectPlaceholders,
  placeholderDetectorImplementation,
  placeholderDetectorManifest
} from "../../../src/hollows/categories/validation/index.js";

describe("Placeholder Detector Hollow", () => {
  it("detects TODO", () => {
    expect(detectPlaceholders({ text: "// TODO wire this" }).has_placeholders).toBe(true);
  });

  it("detects placeholder case-insensitively by default", () => {
    expect(detectPlaceholders({ text: "PLACEHOLDER value" }).placeholder_count).toBeGreaterThan(0);
  });

  it("respects case_sensitive true", () => {
    expect(
      detectPlaceholders({ text: "todo lower only", case_sensitive: true }).placeholder_count
    ).toBe(0);
  });

  it("detects throw new Error(\"not implemented\")", () => {
    expect(
      detectPlaceholders({ text: 'throw new Error("not implemented")' }).findings[0]?.pattern
    ).toContain("not implemented");
  });

  it("detects fake passing test signal", () => {
    expect(detectPlaceholders({ text: "it('passes', () => assert(true));" }).has_placeholders).toBe(true);
  });

  it("supports custom_patterns", () => {
    expect(
      detectPlaceholders({ text: "wire this later", custom_patterns: ["wire this later"] })
        .placeholder_count
    ).toBe(1);
  });

  it("returns 1-based line numbers", () => {
    const result = detectPlaceholders({ text: "real\nTODO second line" });

    expect(result.findings[0]?.line_number).toBe(2);
  });

  it("bounds line excerpts", () => {
    const result = detectPlaceholders({ text: `TODO ${"x".repeat(300)}` });

    expect(result.findings[0]?.line_excerpt.length).toBeLessThanOrEqual(160);
  });

  it("empty text emits empty_text warning", async () => {
    const record = await runPlaceholderDetector({ text: "" });

    expect(record.warnings.map((warning) => warning.warning_id)).toContain("empty_text");
  });

  it("returns result_units findings", async () => {
    const record = await runPlaceholderDetector({ text: "TODO" });

    expect(record.result_units).toBe("findings");
  });
});

async function runPlaceholderDetector(input_payload: object) {
  const registry = new HollowRegistry([placeholderDetectorManifest]);
  const runner = new HollowRunner(registry, {
    [placeholderDetectorManifest.hollow_id]: placeholderDetectorImplementation
  });

  return await runner.run({
    hollow_id: placeholderDetectorManifest.hollow_id,
    input_payload: input_payload as never,
    task_id: "task_placeholder_detector",
    run_id: "run_placeholder_detector",
    trace_id: "trace_placeholder_detector",
    invocation_id: "invocation_placeholder_detector"
  });
}

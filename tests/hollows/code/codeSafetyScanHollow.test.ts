import { describe, expect, it } from "vitest";
import { HollowRegistry, HollowRunner } from "../../../src/hollows/index.js";
import {
  codeSafetyScanImplementation,
  codeSafetyScanManifest,
  scanCodeSafety
} from "../../../src/hollows/categories/code/index.js";

describe("Code Safety Scan Hollow", () => {
  it("detects eval", () => {
    expect(scanCodeSafety({ text: "eval(code)" }).result.findings[0]?.rule_id).toBe("eval_function");
  });

  it("detects new Function", () => {
    expect(scanCodeSafety({ text: "const fn = new Function('x', x)" }).result.findings[0]?.rule_id).toBe("function_constructor");
  });

  it("detects child_process", () => {
    expect(scanCodeSafety({ text: "import child_process from 'node:child_process';" }).result.findings[0]?.rule_id).toBe("child_process");
  });

  it("detects shell true", () => {
    expect(scanCodeSafety({ text: "spawn('x', [], { shell: true })" }).result.findings.map((finding) => finding.rule_id)).toContain("shell_true");
  });

  it("detects process.env", () => {
    expect(scanCodeSafety({ text: "const key = process.env.API_KEY" }).result.findings[0]?.rule_id).toBe("env_access");
  });

  it("detects destructive fs pattern", () => {
    expect(scanCodeSafety({ text: "fs.rmSync(path)" }).result.findings[0]?.rule_id).toBe("destructive_fs");
  });

  it("detects network call pattern", () => {
    expect(scanCodeSafety({ text: "fetch('/api')" }).result.findings[0]?.rule_id).toBe("network_call");
  });

  it("supports enabled_rules", () => {
    const result = scanCodeSafety({ text: "eval(code)\nfetch('/api')", enabled_rules: ["network_call"] });

    expect(result.result.findings.map((finding) => finding.rule_id)).toEqual(["network_call"]);
  });

  it("warns for unknown enabled_rules", () => {
    expect(scanCodeSafety({ text: "safe", enabled_rules: ["missing_rule"] }).warnings[0]?.warning_id).toBe("unknown_rule_requested");
  });

  it("returns 1-based line numbers", () => {
    expect(scanCodeSafety({ text: "\nfetch('/api')" }).result.findings[0]?.line_number).toBe(2);
  });

  it("bounds line excerpts", () => {
    const result = scanCodeSafety({ text: `eval(code); ${"x".repeat(300)}` });

    expect(result.result.findings[0]?.line_excerpt.length).toBeLessThanOrEqual(160);
  });

  it("empty text emits empty_text warning", async () => {
    const record = await runCodeSafetyScan({ text: "" });

    expect(record.warnings.map((warning) => warning.warning_id)).toContain("empty_text");
  });

  it("returns result_units findings", async () => {
    const record = await runCodeSafetyScan({ text: "eval(code)" });

    expect(record.result_units).toBe("findings");
  });
});

async function runCodeSafetyScan(input_payload: object) {
  const registry = new HollowRegistry([codeSafetyScanManifest]);
  const runner = new HollowRunner(registry, { [codeSafetyScanManifest.hollow_id]: codeSafetyScanImplementation });

  return await runner.run({
    hollow_id: codeSafetyScanManifest.hollow_id,
    input_payload: input_payload as never,
    task_id: "task_code_safety_scan",
    run_id: "run_code_safety_scan",
    trace_id: "trace_code_safety_scan",
    invocation_id: "invocation_code_safety_scan"
  });
}

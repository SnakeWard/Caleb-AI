import { describe, expect, it } from "vitest";
import { HollowRegistry, HollowRunner } from "../../../src/hollows/index.js";
import {
  exportSurfaceImplementation,
  exportSurfaceManifest,
  inspectExportSurface
} from "../../../src/hollows/categories/code/index.js";

describe("Export Surface Hollow", () => {
  it("detects exported function", () => {
    expect(inspectExportSurface({ text: "export function run() {}" }).exports[0]).toMatchObject({
      name: "run",
      kind: "function"
    });
  });

  it("detects exported class", () => {
    expect(inspectExportSurface({ text: "export class Runner {}" }).exports[0]?.kind).toBe("class");
  });

  it("detects exported const", () => {
    expect(inspectExportSurface({ text: "export const value = 1;" }).exports[0]?.name).toBe("value");
  });

  it("detects exported type/interface if TypeScript-like text is provided", () => {
    const result = inspectExportSurface({ text: "export type A = string;\nexport interface B {}", language: "typescript" });

    expect(result.exports.map((entry) => entry.kind)).toEqual(["type", "interface"]);
  });

  it("detects named export list", () => {
    const result = inspectExportSurface({ text: "export { a, b as c };" });

    expect(result.exports.map((entry) => entry.name)).toEqual(["a", "c"]);
  });

  it("detects default export", () => {
    expect(inspectExportSurface({ text: "export default function App() {}" }).default_export_count).toBe(1);
  });

  it("detects re-export", () => {
    expect(inspectExportSurface({ text: 'export * from "./x";' }).re_export_count).toBe(1);
  });

  it("returns 1-based line numbers", () => {
    expect(inspectExportSurface({ text: "\nexport const value = 1;" }).exports[0]?.line_number).toBe(2);
  });

  it("bounds statement excerpts", () => {
    const result = inspectExportSurface({ text: `export const value = "${"x".repeat(300)}";` });

    expect(result.exports[0]?.statement_excerpt.length).toBeLessThanOrEqual(160);
  });

  it("emits no_exports_detected warning when no exports found", async () => {
    const record = await runExportSurface({ text: "const x = 1;" });

    expect(record.warnings.map((warning) => warning.warning_id)).toContain("no_exports_detected");
  });

  it("returns result_units exports", async () => {
    const record = await runExportSurface({ text: "export const value = 1;" });

    expect(record.result_units).toBe("exports");
  });
});

async function runExportSurface(input_payload: object) {
  const registry = new HollowRegistry([exportSurfaceManifest]);
  const runner = new HollowRunner(registry, { [exportSurfaceManifest.hollow_id]: exportSurfaceImplementation });

  return await runner.run({
    hollow_id: exportSurfaceManifest.hollow_id,
    input_payload: input_payload as never,
    task_id: "task_export_surface",
    run_id: "run_export_surface",
    trace_id: "trace_export_surface",
    invocation_id: "invocation_export_surface"
  });
}

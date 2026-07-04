import { describe, expect, it } from "vitest";
import { HollowRegistry, HollowRunner } from "../../../src/hollows/index.js";
import {
  importSurfaceImplementation,
  importSurfaceManifest,
  inspectImportSurface
} from "../../../src/hollows/categories/code/index.js";

describe("Import Surface Hollow", () => {
  it("detects default static import", () => {
    expect(inspectImportSurface({ text: 'import React from "react";' }).imports[0]).toMatchObject({
      source: "react",
      kind: "static_import"
    });
  });

  it("detects named static import", () => {
    expect(inspectImportSurface({ text: 'import { test } from "vitest";' }).imports[0]?.source).toBe("vitest");
  });

  it("detects side-effect import", () => {
    expect(inspectImportSurface({ text: 'import "./style.css";' }).imports[0]?.kind).toBe("side_effect_import");
  });

  it("detects dynamic import when enabled", () => {
    expect(inspectImportSurface({ text: 'const mod = await import("./mod.js");' }).dynamic_import_count).toBe(1);
  });

  it("detects require when enabled", () => {
    expect(inspectImportSurface({ text: 'const fs = require("node:fs");' }).require_count).toBe(1);
  });

  it("counts relative imports", () => {
    expect(inspectImportSurface({ text: 'import x from "./x";' }).relative_import_count).toBe(1);
  });

  it("counts external package imports", () => {
    expect(inspectImportSurface({ text: 'import x from "pkg";' }).external_package_count).toBe(1);
  });

  it("returns 1-based line numbers", () => {
    expect(inspectImportSurface({ text: "\nimport x from 'pkg';" }).imports[0]?.line_number).toBe(2);
  });

  it("bounds statement excerpts", () => {
    const source = `import x from "pkg"; ${"x".repeat(300)}`;

    expect(inspectImportSurface({ text: source }).imports[0]?.statement_excerpt.length).toBeLessThanOrEqual(160);
  });

  it("emits no_imports_detected warning when no imports found", async () => {
    const record = await runImportSurface({ text: "const x = 1;" });

    expect(record.warnings.map((warning) => warning.warning_id)).toContain("no_imports_detected");
  });

  it("returns result_units imports", async () => {
    const record = await runImportSurface({ text: 'import x from "pkg";' });

    expect(record.result_units).toBe("imports");
  });
});

async function runImportSurface(input_payload: object) {
  const registry = new HollowRegistry([importSurfaceManifest]);
  const runner = new HollowRunner(registry, { [importSurfaceManifest.hollow_id]: importSurfaceImplementation });

  return await runner.run({
    hollow_id: importSurfaceManifest.hollow_id,
    input_payload: input_payload as never,
    task_id: "task_import_surface",
    run_id: "run_import_surface",
    trace_id: "trace_import_surface",
    invocation_id: "invocation_import_surface"
  });
}

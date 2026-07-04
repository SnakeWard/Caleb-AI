import type { HollowManifest } from "../../../types/hollow.js";

function createCodeManifest(
  overrides: Pick<
    HollowManifest,
    | "hollow_id"
    | "hollow_name"
    | "description"
    | "input_type"
    | "input_schema_ref"
    | "output_schema_ref"
    | "result_units"
    | "checks"
    | "status"
  >
): HollowManifest {
  return {
    hollow_version: "1.0.0",
    schema_version: "1.0.0",
    category: "code",
    permissions: ["none"],
    permissions_required: [],
    file_access_scope: "none",
    network_access: false,
    execution_mode: "local_deterministic",
    deterministic: true,
    deterministic_level: "strict",
    max_input_size: 500000,
    max_runtime_ms: 2000,
    supports_batching: false,
    supports_streaming: false,
    cache_policy: "input_digest",
    owner: "caleb-ai-core",
    ...overrides
  };
}

export const lineCountManifest = createCodeManifest({
  hollow_id: "hollow.code.line_count",
  hollow_name: "Line Count Hollow",
  description: "Counts lines and newline-related measurements in provided text.",
  input_type: "line_count_input",
  input_schema_ref: "schemas/hollows/code/line-count.input.json",
  output_schema_ref: "schemas/hollows/code/line-count.output.json",
  result_units: "lines",
  checks: ["input_text_present", "line_count_completed"],
  status: "trusted"
});

export const importSurfaceManifest = createCodeManifest({
  hollow_id: "hollow.code.import_surface",
  hollow_name: "Import Surface Hollow",
  description: "Inspects import-like statements in provided TypeScript or JavaScript-like text.",
  input_type: "import_surface_input",
  input_schema_ref: "schemas/hollows/code/import-surface.input.json",
  output_schema_ref: "schemas/hollows/code/import-surface.output.json",
  result_units: "imports",
  checks: ["input_text_present", "import_surface_scan_completed"],
  status: "trusted"
});

export const exportSurfaceManifest = createCodeManifest({
  hollow_id: "hollow.code.export_surface",
  hollow_name: "Export Surface Hollow",
  description: "Inspects export-like declarations in provided TypeScript or JavaScript-like text.",
  input_type: "export_surface_input",
  input_schema_ref: "schemas/hollows/code/export-surface.input.json",
  output_schema_ref: "schemas/hollows/code/export-surface.output.json",
  result_units: "exports",
  checks: ["input_text_present", "export_surface_scan_completed"],
  status: "trusted"
});

export const codeSafetyScanManifest = createCodeManifest({
  hollow_id: "hollow.code.safety_scan",
  hollow_name: "Code Safety Scan Hollow",
  description: "Detects deterministic code safety signals in provided text without executing code.",
  input_type: "code_safety_scan_input",
  input_schema_ref: "schemas/hollows/code/code-safety-scan.input.json",
  output_schema_ref: "schemas/hollows/code/code-safety-scan.output.json",
  result_units: "findings",
  checks: ["input_text_present", "code_safety_scan_completed"],
  status: "trusted"
});

export const codeHollowManifests = [
  lineCountManifest,
  importSurfaceManifest,
  exportSurfaceManifest,
  codeSafetyScanManifest
] as const satisfies readonly HollowManifest[];

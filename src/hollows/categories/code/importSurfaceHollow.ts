import type { CalebWarning } from "../../../types/invocation.js";
import type { HollowImplementation } from "../../runnerTypes.js";
import { importSurfaceManifest as manifest } from "./codeHollowManifests.js";
import type {
  ImportSurfaceEntry,
  ImportSurfaceInput,
  ImportSurfaceKind,
  ImportSurfaceResult
} from "./codeHollowTypes.js";

export const importSurfaceManifest = manifest;

export function inspectImportSurface(input: ImportSurfaceInput): ImportSurfaceResult {
  const includeRequire = input.include_require ?? true;
  const includeDynamic = input.include_dynamic_import ?? true;
  const imports: ImportSurfaceEntry[] = [];

  input.text.split(/\r?\n|\r/).forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();
    const staticMatch = trimmed.match(/^import\s+(?:type\s+)?(?:[\s\S]+?\s+from\s+)?["']([^"']+)["'];?/);
    if (staticMatch?.[1] !== undefined) {
      const kind: ImportSurfaceKind = /^import\s+["']/.test(trimmed) ? "side_effect_import" : "static_import";
      imports.push(createImportEntry(staticMatch[1], kind, lineNumber, trimmed));
    }

    if (includeDynamic) {
      for (const match of line.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g)) {
        if (match[1] !== undefined) imports.push(createImportEntry(match[1], "dynamic_import", lineNumber, trimmed));
      }
    }

    if (includeRequire) {
      for (const match of line.matchAll(/\brequire\s*\(\s*["']([^"']+)["']\s*\)/g)) {
        if (match[1] !== undefined) imports.push(createImportEntry(match[1], "require", lineNumber, trimmed));
      }
    }
  });

  return {
    import_count: imports.length,
    static_import_count: imports.filter((entry) => entry.kind === "static_import" || entry.kind === "side_effect_import").length,
    dynamic_import_count: imports.filter((entry) => entry.kind === "dynamic_import").length,
    require_count: imports.filter((entry) => entry.kind === "require").length,
    relative_import_count: imports.filter((entry) => isRelativeImport(entry.source)).length,
    external_package_count: imports.filter((entry) => !isRelativeImport(entry.source)).length,
    imports
  };
}

export const importSurfaceImplementation: HollowImplementation = ({ input_payload }) => {
  const input = parseImportSurfaceInput(input_payload);
  const result = inspectImportSurface(input);
  const warnings = createImportWarnings(result);

  return {
    result,
    result_units: "imports",
    checks: [
      { check_id: "input_text_present", label: "Input Text Present", status: "completed", severity: "info" },
      {
        check_id: "import_surface_scan_completed",
        label: "Import Surface Scan Completed",
        status: "completed",
        severity: "info"
      }
    ],
    warnings,
    artifact_hashes: [],
    confidence_level: "deterministic_import_surface_scan"
  };
};

function createImportEntry(
  source: string,
  kind: ImportSurfaceKind,
  line_number: number,
  statement: string
): ImportSurfaceEntry {
  return { source, kind, line_number, statement_excerpt: statement.slice(0, 160) };
}

function createImportWarnings(result: ImportSurfaceResult): CalebWarning[] {
  const warnings: CalebWarning[] = [];
  if (result.dynamic_import_count > 0) {
    warnings.push({ warning_id: "dynamic_import_detected", message: "Dynamic import detected.", severity: "warning" });
  }
  if (result.require_count > 0) {
    warnings.push({ warning_id: "require_detected", message: "CommonJS require detected.", severity: "warning" });
  }
  if (result.import_count === 0) {
    warnings.push({ warning_id: "no_imports_detected", message: "No imports were detected.", severity: "warning" });
  }
  return warnings;
}

function parseImportSurfaceInput(input: unknown): ImportSurfaceInput {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new Error("Import Surface Hollow requires an object input payload.");
  }
  const candidate = input as Partial<ImportSurfaceInput>;
  if (typeof candidate.text !== "string") {
    throw new Error("Import Surface Hollow requires input_payload.text as a string.");
  }
  if (candidate.language !== undefined && !["typescript", "javascript", "unknown"].includes(candidate.language)) {
    throw new Error("Import Surface Hollow language must be typescript, javascript, or unknown.");
  }
  return {
    text: candidate.text,
    language: candidate.language ?? "unknown",
    include_require: candidate.include_require ?? true,
    include_dynamic_import: candidate.include_dynamic_import ?? true
  };
}

function isRelativeImport(source: string): boolean {
  return source.startsWith(".") || source.startsWith("/");
}

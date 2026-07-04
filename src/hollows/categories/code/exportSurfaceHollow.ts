import type { CalebWarning } from "../../../types/invocation.js";
import type { HollowImplementation } from "../../runnerTypes.js";
import { exportSurfaceManifest as manifest } from "./codeHollowManifests.js";
import type {
  ExportSurfaceEntry,
  ExportSurfaceInput,
  ExportSurfaceKind,
  ExportSurfaceResult
} from "./codeHollowTypes.js";

export const exportSurfaceManifest = manifest;

export function inspectExportSurface(input: ExportSurfaceInput): ExportSurfaceResult {
  const includeDefault = input.include_default ?? true;
  const exports: ExportSurfaceEntry[] = [];

  input.text.split(/\r?\n|\r/).forEach((line, index) => {
    const lineNumber = index + 1;
    const statement = line.trim();
    if (!statement.startsWith("export")) return;

    const declaration = statement.match(/^export\s+(?:declare\s+)?(async\s+)?(function|class|const|let|var|type|interface|enum)\s+([A-Za-z_$][\w$]*)/);
    if (declaration?.[2] !== undefined && declaration[3] !== undefined) {
      exports.push(createExportEntry(declaration[3], declaration[2] as ExportSurfaceKind, lineNumber, statement));
      return;
    }

    if (includeDefault && statement.startsWith("export default")) {
      const namedDefault = statement.match(/^export\s+default\s+(?:async\s+)?(?:function|class)\s+([A-Za-z_$][\w$]*)/);
      exports.push(createExportEntry(namedDefault?.[1] ?? "default", "default", lineNumber, statement));
      return;
    }

    if (/^export\s+\*\s+from\s+["']/.test(statement) || /^export\s+\{[^}]*\}\s+from\s+["']/.test(statement)) {
      exports.push(createExportEntry("re_export", "re_export", lineNumber, statement));
      return;
    }

    const namedList = statement.match(/^export\s+\{([^}]+)\}/);
    if (namedList?.[1] !== undefined) {
      for (const name of parseNamedExports(namedList[1])) {
        exports.push(createExportEntry(name, "named_list", lineNumber, statement));
      }
    }
  });

  return {
    export_count: exports.length,
    named_export_count: exports.filter((entry) => entry.kind !== "default" && entry.kind !== "re_export").length,
    default_export_count: exports.filter((entry) => entry.kind === "default").length,
    re_export_count: exports.filter((entry) => entry.kind === "re_export").length,
    exports
  };
}

export const exportSurfaceImplementation: HollowImplementation = ({ input_payload }) => {
  const input = parseExportSurfaceInput(input_payload);
  const result = inspectExportSurface(input);
  const warnings = createExportWarnings(result);

  return {
    result,
    result_units: "exports",
    checks: [
      { check_id: "input_text_present", label: "Input Text Present", status: "completed", severity: "info" },
      {
        check_id: "export_surface_scan_completed",
        label: "Export Surface Scan Completed",
        status: "completed",
        severity: "info"
      }
    ],
    warnings,
    artifact_hashes: [],
    confidence_level: "deterministic_export_surface_scan"
  };
};

function parseNamedExports(source: string): string[] {
  return source
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const alias = entry.match(/\bas\s+([A-Za-z_$][\w$]*)$/);
      return alias?.[1] ?? entry.split(/\s+/)[0] ?? "unknown";
    });
}

function createExportEntry(
  name: string,
  kind: ExportSurfaceKind,
  line_number: number,
  statement: string
): ExportSurfaceEntry {
  return { name, kind, line_number, statement_excerpt: statement.slice(0, 160) };
}

function createExportWarnings(result: ExportSurfaceResult): CalebWarning[] {
  const warnings: CalebWarning[] = [];
  if (result.default_export_count > 0) {
    warnings.push({ warning_id: "default_export_detected", message: "Default export detected.", severity: "warning" });
  }
  if (result.re_export_count > 0) {
    warnings.push({ warning_id: "re_export_detected", message: "Re-export detected.", severity: "warning" });
  }
  if (result.export_count === 0) {
    warnings.push({ warning_id: "no_exports_detected", message: "No exports were detected.", severity: "warning" });
  }
  return warnings;
}

function parseExportSurfaceInput(input: unknown): ExportSurfaceInput {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new Error("Export Surface Hollow requires an object input payload.");
  }
  const candidate = input as Partial<ExportSurfaceInput>;
  if (typeof candidate.text !== "string") {
    throw new Error("Export Surface Hollow requires input_payload.text as a string.");
  }
  if (candidate.language !== undefined && !["typescript", "javascript", "unknown"].includes(candidate.language)) {
    throw new Error("Export Surface Hollow language must be typescript, javascript, or unknown.");
  }
  return {
    text: candidate.text,
    language: candidate.language ?? "unknown",
    include_default: candidate.include_default ?? true
  };
}

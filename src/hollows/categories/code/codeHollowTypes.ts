import type { CalebSeverity, JsonObject } from "../../../types/common.js";

export interface LineCountInput extends JsonObject {
  text: string;
  count_empty_lines?: boolean;
}

export interface LineCountResult extends JsonObject {
  line_count: number;
  non_empty_line_count: number;
  empty_line_count: number;
  newline_count: number;
  max_line_length: number;
  trailing_newline: boolean;
}

export type CodeLanguage = "typescript" | "javascript" | "unknown";

export interface ImportSurfaceInput extends JsonObject {
  text: string;
  language?: CodeLanguage;
  include_require?: boolean;
  include_dynamic_import?: boolean;
}

export type ImportSurfaceKind =
  | "static_import"
  | "side_effect_import"
  | "dynamic_import"
  | "require";

export interface ImportSurfaceEntry extends JsonObject {
  source: string;
  kind: ImportSurfaceKind;
  line_number: number;
  statement_excerpt: string;
}

export interface ImportSurfaceResult extends JsonObject {
  import_count: number;
  static_import_count: number;
  dynamic_import_count: number;
  require_count: number;
  relative_import_count: number;
  external_package_count: number;
  imports: ImportSurfaceEntry[];
}

export interface ExportSurfaceInput extends JsonObject {
  text: string;
  language?: CodeLanguage;
  include_default?: boolean;
}

export type ExportSurfaceKind =
  | "function"
  | "class"
  | "const"
  | "let"
  | "var"
  | "type"
  | "interface"
  | "enum"
  | "named_list"
  | "default"
  | "re_export"
  | "unknown";

export interface ExportSurfaceEntry extends JsonObject {
  name: string;
  kind: ExportSurfaceKind;
  line_number: number;
  statement_excerpt: string;
}

export interface ExportSurfaceResult extends JsonObject {
  export_count: number;
  named_export_count: number;
  default_export_count: number;
  re_export_count: number;
  exports: ExportSurfaceEntry[];
}

export interface CodeSafetyScanInput extends JsonObject {
  text: string;
  enabled_rules?: string[];
  case_sensitive?: boolean;
}

export interface CodeSafetyFinding extends JsonObject {
  rule_id: string;
  severity: CalebSeverity;
  pattern: string;
  line_number: number;
  line_excerpt: string;
}

export interface CodeSafetyScanResult extends JsonObject {
  finding_count: number;
  findings: CodeSafetyFinding[];
  rules_checked: string[];
}

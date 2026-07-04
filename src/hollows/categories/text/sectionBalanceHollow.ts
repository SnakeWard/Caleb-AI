import type { HollowImplementation } from "../../runnerTypes.js";
import type { CalebWarning } from "../../../types/invocation.js";
import { sectionBalanceManifest as manifest } from "./textHollowManifests.js";
import type { SectionBalanceInput, SectionBalanceResult, SectionBalanceSection } from "./textHollowTypes.js";

export const sectionBalanceManifest = manifest;

interface ParsedSection {
  readonly name: string;
  readonly content: string;
}

export function inspectSectionBalance(input: SectionBalanceInput): SectionBalanceResult {
  const sections = parseSections(input.text).map(toSectionResult);
  const names = sections.map((section) => section.name);
  const repeated_sections = Array.from(new Set(names.filter((name, index) => names.indexOf(name) !== index))).sort();
  const expected = input.section_markers ?? [];
  const missing_expected_sections = expected.filter((marker) => !names.includes(marker));

  return {
    section_count: sections.length,
    sections,
    missing_expected_sections,
    repeated_sections
  };
}

export const sectionBalanceImplementation: HollowImplementation = ({ input_payload }) => {
  const input = parseSectionBalanceInput(input_payload);
  const result = inspectSectionBalance(input);
  const warnings = createSectionWarnings(result);

  return {
    result,
    result_units: "sections",
    checks: [
      { check_id: "input_text_present", label: "Input Text Present", status: "completed", severity: "info" },
      { check_id: "section_scan_completed", label: "Section Scan Completed", status: "completed", severity: "info" }
    ],
    warnings,
    artifact_hashes: [],
    confidence_level: "deterministic_section_scan"
  };
};

function parseSections(text: string): ParsedSection[] {
  const lines = text.split(/\r?\n/);
  const sections: { name: string; lines: string[] }[] = [];

  for (const line of lines) {
    const match = line.match(/^\s*\[([^\]]+)\]\s*$/);
    if (match?.[1] !== undefined) {
      sections.push({ name: match[1].trim(), lines: [] });
      continue;
    }
    sections.at(-1)?.lines.push(line);
  }

  return sections.map((section) => ({ name: section.name, content: section.lines.join("\n") }));
}

function toSectionResult(section: ParsedSection): SectionBalanceSection {
  const trimmedContent = section.content.trim();
  return {
    name: section.name,
    character_count: trimmedContent.length,
    line_count: trimmedContent.length === 0 ? 0 : trimmedContent.split(/\r?\n/).length
  };
}

function createSectionWarnings(result: SectionBalanceResult): CalebWarning[] {
  const warnings: CalebWarning[] = [];
  if (result.section_count === 0) {
    warnings.push({ warning_id: "no_sections_detected", message: "No bracketed sections were detected.", severity: "warning" });
  }
  for (const name of result.missing_expected_sections) {
    warnings.push({ warning_id: "missing_expected_section", message: `Missing expected section: ${name}.`, severity: "warning" });
  }
  for (const name of result.repeated_sections) {
    warnings.push({ warning_id: "repeated_section", message: `Repeated section detected: ${name}.`, severity: "warning" });
  }
  for (const section of result.sections) {
    if (section.character_count < 20) {
      warnings.push({ warning_id: "section_very_short", message: `Section ${section.name} is very short.`, severity: "warning" });
    }
    if (section.character_count > 2000) {
      warnings.push({ warning_id: "section_very_long", message: `Section ${section.name} is very long.`, severity: "warning" });
    }
  }
  return warnings;
}

function parseSectionBalanceInput(input: unknown): SectionBalanceInput {
  if (typeof input !== "object" || input === null || Array.isArray(input) || typeof (input as { text?: unknown }).text !== "string") {
    throw new Error("Section Balance Hollow requires input_payload.text as a string.");
  }
  const markers = (input as { section_markers?: unknown }).section_markers;
  if (markers !== undefined && (!Array.isArray(markers) || markers.some((marker) => typeof marker !== "string"))) {
    throw new Error("Section Balance Hollow section_markers must be an array of strings when provided.");
  }
  return {
    text: (input as { text: string }).text,
    ...(markers === undefined ? {} : { section_markers: markers as string[] })
  };
}

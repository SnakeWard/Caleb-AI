import type { CalebWarning } from "../../../types/invocation.js";
import type { HollowImplementation } from "../../runnerTypes.js";
import { placeholderDetectorManifest as manifest } from "./validationHollowManifests.js";
import type {
  PlaceholderDetectorInput,
  PlaceholderDetectorResult
} from "./validationHollowTypes.js";

const DEFAULT_PATTERNS = [
  "TODO",
  "FIXME",
  "placeholder",
  "stub",
  "mock this later",
  "implement later",
  "not implemented",
  "throw new Error\\([\"']not implemented[\"']\\)",
  "assert\\(true\\)",
  "return true;\\s*(?://.*)?",
  "fake passing test",
  "\\{\\s*\\}"
];

export const placeholderDetectorManifest = manifest;

export function detectPlaceholders(input: PlaceholderDetectorInput): PlaceholderDetectorResult {
  const patterns = [...DEFAULT_PATTERNS, ...(input.custom_patterns ?? [])];
  const flags = input.case_sensitive === true ? "" : "i";
  const matchers = patterns.map((pattern) => ({ pattern, matcher: new RegExp(pattern, flags) }));
  const findings: PlaceholderDetectorResult["findings"] = [];

  input.text.split(/\r?\n/).forEach((line, index) => {
    for (const { pattern, matcher } of matchers) {
      if (matcher.test(line)) {
        findings.push({
          pattern,
          line_number: index + 1,
          line_excerpt: line.trim().slice(0, 160)
        });
      }
    }
  });

  return {
    placeholder_count: findings.length,
    findings,
    has_placeholders: findings.length > 0
  };
}

export const placeholderDetectorImplementation: HollowImplementation = ({ input_payload }) => {
  const input = parsePlaceholderDetectorInput(input_payload);
  const result = detectPlaceholders(input);
  const warnings: CalebWarning[] = [];

  if (input.text.length === 0) {
    warnings.push({ warning_id: "empty_text", message: "Input text is empty.", severity: "warning" });
  }
  if (result.has_placeholders) {
    warnings.push({
      warning_id: "placeholder_detected",
      message: `${result.placeholder_count} placeholder signal(s) detected.`,
      severity: "warning"
    });
  }

  return {
    result,
    result_units: "findings",
    checks: [
      { check_id: "input_text_present", label: "Input Text Present", status: "completed", severity: "info" },
      {
        check_id: "placeholder_scan_completed",
        label: "Placeholder Scan Completed",
        status: "completed",
        severity: "info"
      }
    ],
    warnings,
    artifact_hashes: [],
    confidence_level: "deterministic_placeholder_scan"
  };
};

function parsePlaceholderDetectorInput(input: unknown): PlaceholderDetectorInput {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new Error("Placeholder Detector Hollow requires an object input payload.");
  }

  const candidate = input as { text?: unknown; case_sensitive?: unknown; custom_patterns?: unknown };
  if (typeof candidate.text !== "string") {
    throw new Error("Placeholder Detector Hollow requires input_payload.text as a string.");
  }
  if (candidate.case_sensitive !== undefined && typeof candidate.case_sensitive !== "boolean") {
    throw new Error("Placeholder Detector Hollow case_sensitive must be boolean when provided.");
  }
  if (
    candidate.custom_patterns !== undefined &&
    (!Array.isArray(candidate.custom_patterns) ||
      candidate.custom_patterns.some((pattern) => typeof pattern !== "string"))
  ) {
    throw new Error("Placeholder Detector Hollow custom_patterns must be an array of strings when provided.");
  }

  return {
    text: candidate.text,
    ...(candidate.case_sensitive === undefined ? {} : { case_sensitive: candidate.case_sensitive }),
    ...(candidate.custom_patterns === undefined
      ? {}
      : { custom_patterns: candidate.custom_patterns as string[] })
  };
}

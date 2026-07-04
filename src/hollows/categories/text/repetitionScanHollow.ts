import type { HollowImplementation } from "../../runnerTypes.js";
import type { CalebWarning } from "../../../types/invocation.js";
import { repetitionScanManifest as manifest } from "./textHollowManifests.js";
import type { RepetitionScanInput, RepetitionScanResult, RepeatedPhrase } from "./textHollowTypes.js";

export const repetitionScanManifest = manifest;

export function scanRepetition(input: RepetitionScanInput): RepetitionScanResult {
  const caseSensitive = input.case_sensitive ?? false;
  const minPhraseLength = input.min_phrase_length ?? 2;
  const maxPhraseLength = input.max_phrase_length ?? 5;
  const minRepetitions = input.min_repetitions ?? 2;
  if (maxPhraseLength < minPhraseLength) {
    throw new Error("Repetition Scan Hollow max_phrase_length must be greater than or equal to min_phrase_length.");
  }
  if (minRepetitions <= 1) {
    throw new Error("Repetition Scan Hollow min_repetitions must be greater than 1.");
  }
  const tokens = tokenize(input.text, caseSensitive);
  const counts = new Map<string, { count: number; phrase_length: number }>();

  for (let phraseLength = minPhraseLength; phraseLength <= maxPhraseLength; phraseLength += 1) {
    if (phraseLength <= 0) continue;
    for (let index = 0; index <= tokens.length - phraseLength; index += 1) {
      const phrase = tokens.slice(index, index + phraseLength).join(" ");
      const current = counts.get(phrase);
      counts.set(phrase, { count: (current?.count ?? 0) + 1, phrase_length: phraseLength });
    }
  }

  const repeated_phrases: RepeatedPhrase[] = Array.from(counts.entries())
    .filter(([, entry]) => entry.count >= minRepetitions)
    .map(([phrase, entry]) => ({ phrase, count: entry.count, phrase_length: entry.phrase_length }))
    .sort((a, b) => b.count - a.count || a.phrase.localeCompare(b.phrase))
    .slice(0, 25);

  return {
    repeated_phrases,
    repeated_phrase_count: repeated_phrases.length,
    token_count: tokens.length
  };
}

export const repetitionScanImplementation: HollowImplementation = ({ input_payload }) => {
  const input = parseRepetitionScanInput(input_payload);
  const result = scanRepetition(input);
  const warnings: CalebWarning[] = [];
  if (input.text.length === 0) {
    warnings.push({ warning_id: "empty_text", message: "Input text is empty.", severity: "warning" });
  }
  if (result.repeated_phrase_count > 0) {
    warnings.push({ warning_id: "repeated_phrase_detected", message: "Repeated phrases were detected.", severity: "warning" });
  }

  return {
    result,
    result_units: "phrases",
    checks: [
      { check_id: "input_text_present", label: "Input Text Present", status: "completed", severity: "info" },
      { check_id: "repetition_scan_completed", label: "Repetition Scan Completed", status: "completed", severity: "info" }
    ],
    warnings,
    artifact_hashes: [],
    confidence_level: "deterministic_repetition_scan"
  };
};

function tokenize(text: string, caseSensitive: boolean): string[] {
  const source = caseSensitive ? text : text.toLowerCase();
  return source.match(/[\p{L}\p{N}']+/gu) ?? [];
}

function parseRepetitionScanInput(input: unknown): RepetitionScanInput {
  if (typeof input !== "object" || input === null || Array.isArray(input) || typeof (input as { text?: unknown }).text !== "string") {
    throw new Error("Repetition Scan Hollow requires input_payload.text as a string.");
  }
  const candidate = input as RepetitionScanInput;
  const min_phrase_length = validateOptionalPositiveInteger(candidate.min_phrase_length, "min_phrase_length");
  const max_phrase_length = validateOptionalPositiveInteger(candidate.max_phrase_length, "max_phrase_length");
  const min_repetitions = validateOptionalPositiveInteger(candidate.min_repetitions, "min_repetitions");

  if (max_phrase_length !== undefined && min_phrase_length !== undefined && max_phrase_length < min_phrase_length) {
    throw new Error("Repetition Scan Hollow max_phrase_length must be greater than or equal to min_phrase_length.");
  }
  if (min_repetitions !== undefined && min_repetitions <= 1) {
    throw new Error("Repetition Scan Hollow min_repetitions must be greater than 1 when provided.");
  }
  if (candidate.case_sensitive !== undefined && typeof candidate.case_sensitive !== "boolean") {
    throw new Error("Repetition Scan Hollow case_sensitive must be boolean when provided.");
  }

  return {
    text: candidate.text,
    ...(min_phrase_length === undefined ? {} : { min_phrase_length }),
    ...(max_phrase_length === undefined ? {} : { max_phrase_length }),
    ...(candidate.case_sensitive === undefined ? {} : { case_sensitive: candidate.case_sensitive }),
    ...(min_repetitions === undefined ? {} : { min_repetitions })
  };
}

function validateOptionalPositiveInteger(value: number | undefined, field: string): number | undefined {
  if (value === undefined) return undefined;
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Repetition Scan Hollow ${field} must be a positive integer when provided.`);
  }
  return value;
}

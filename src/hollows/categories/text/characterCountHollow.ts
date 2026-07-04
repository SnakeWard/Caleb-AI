import type { HollowImplementation } from "../../runnerTypes.js";
import type { CalebWarning } from "../../../types/invocation.js";
import { characterCountManifest as manifest } from "./textHollowManifests.js";
import type { CharacterCountInput, CharacterCountResult } from "./textHollowTypes.js";

export const characterCountManifest = manifest;

export function countCharacters(input: CharacterCountInput): CharacterCountResult {
  const newlineMatches = input.text.match(/\n/g);
  const newline_count = newlineMatches === null ? 0 : newlineMatches.length;
  const trimmed = input.text.trim();
  const word_count = trimmed.length === 0 ? 0 : (trimmed.match(/\S+/g) ?? []).length;

  return {
    character_count: input.text.length,
    code_unit_count: input.text.length,
    line_count: input.text.length === 0 ? 0 : newline_count + 1,
    word_count,
    newline_count
  };
}

export const characterCountImplementation: HollowImplementation = ({ input_payload }) => {
  const input = parseCharacterCountInput(input_payload);
  const warnings: CalebWarning[] = [];
  if (input.text.length === 0) {
    warnings.push({ warning_id: "empty_text", message: "Input text is empty.", severity: "warning" });
  }

  return {
    result: countCharacters(input),
    result_units: "characters",
    checks: [
      { check_id: "input_text_present", label: "Input Text Present", status: "completed", severity: "info" },
      { check_id: "character_count_completed", label: "Character Count Completed", status: "completed", severity: "info" }
    ],
    warnings,
    artifact_hashes: [],
    confidence_level: "deterministic_text_count"
  };
};

function parseCharacterCountInput(input: unknown): CharacterCountInput {
  if (typeof input !== "object" || input === null || Array.isArray(input) || typeof (input as { text?: unknown }).text !== "string") {
    throw new Error("Character Count Hollow requires input_payload.text as a string.");
  }
  const candidate = input as { text: string; count_newlines?: unknown };
  if (candidate.count_newlines !== undefined && typeof candidate.count_newlines !== "boolean") {
    throw new Error("Character Count Hollow count_newlines must be boolean when provided.");
  }
  return {
    text: candidate.text,
    ...(candidate.count_newlines === undefined ? {} : { count_newlines: candidate.count_newlines })
  };
}

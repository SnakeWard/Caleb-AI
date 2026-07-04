import type { HollowImplementation } from "../../runnerTypes.js";
import type { CalebWarning } from "../../../types/invocation.js";
import { promptLimitManifest as manifest } from "./textHollowManifests.js";
import type { PromptLimitInput, PromptLimitResult } from "./textHollowTypes.js";

export const promptLimitManifest = manifest;

export function checkPromptLimit(input: PromptLimitInput): PromptLimitResult {
  const character_count = input.text.length;
  return {
    label: input.label ?? "prompt",
    character_count,
    limit: input.limit,
    remaining: Math.max(input.limit - character_count, 0),
    over_by: Math.max(character_count - input.limit, 0),
    within_limit: character_count <= input.limit
  };
}

export const promptLimitImplementation: HollowImplementation = ({ input_payload }) => {
  const input = parsePromptLimitInput(input_payload);
  const result = checkPromptLimit(input);
  const warnings: CalebWarning[] = [];
  if (input.text.length === 0) {
    warnings.push({ warning_id: "empty_text", message: "Input text is empty.", severity: "warning" });
  }
  if (!result.within_limit) {
    warnings.push({ warning_id: "prompt_limit_exceeded", message: `Prompt exceeds limit by ${result.over_by} characters.`, severity: "warning" });
  }

  return {
    result,
    result_units: "characters",
    checks: [
      { check_id: "input_text_present", label: "Input Text Present", status: "completed", severity: "info" },
      { check_id: "limit_valid", label: "Limit Valid", status: "completed", severity: "info" },
      { check_id: "prompt_limit_checked", label: "Prompt Limit Checked", status: "completed", severity: "info" }
    ],
    warnings,
    artifact_hashes: [],
    confidence_level: "deterministic_prompt_limit"
  };
};

function parsePromptLimitInput(input: unknown): PromptLimitInput {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new Error("Prompt Limit Hollow requires an object input payload.");
  }
  const candidate = input as { text?: unknown; limit?: unknown; label?: unknown };
  if (typeof candidate.text !== "string") {
    throw new Error("Prompt Limit Hollow requires input_payload.text as a string.");
  }
  if (typeof candidate.limit !== "number" || !Number.isFinite(candidate.limit) || candidate.limit <= 0) {
    throw new Error("Prompt Limit Hollow requires input_payload.limit as a positive number.");
  }
  if (candidate.label !== undefined && typeof candidate.label !== "string") {
    throw new Error("Prompt Limit Hollow label must be a string when provided.");
  }
  return {
    text: candidate.text,
    limit: candidate.limit,
    ...(candidate.label === undefined ? {} : { label: candidate.label })
  };
}

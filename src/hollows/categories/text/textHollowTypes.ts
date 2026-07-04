import type { JsonObject } from "../../../types/common.js";

export interface CharacterCountInput extends JsonObject {
  readonly text: string;
  readonly count_newlines?: boolean;
}

export interface CharacterCountResult extends JsonObject {
  readonly character_count: number;
  readonly code_unit_count: number;
  readonly line_count: number;
  readonly word_count: number;
  readonly newline_count: number;
}

export interface PromptLimitInput extends JsonObject {
  readonly text: string;
  readonly limit: number;
  readonly label?: string;
}

export interface PromptLimitResult extends JsonObject {
  readonly label: string;
  readonly character_count: number;
  readonly limit: number;
  readonly remaining: number;
  readonly over_by: number;
  readonly within_limit: boolean;
}

export interface SectionBalanceInput extends JsonObject {
  readonly text: string;
  readonly section_markers?: string[];
}

export interface SectionBalanceSection extends JsonObject {
  readonly name: string;
  readonly character_count: number;
  readonly line_count: number;
}

export interface SectionBalanceResult extends JsonObject {
  readonly section_count: number;
  readonly sections: SectionBalanceSection[];
  readonly missing_expected_sections: string[];
  readonly repeated_sections: string[];
}

export interface RepetitionScanInput extends JsonObject {
  readonly text: string;
  readonly min_phrase_length?: number;
  readonly max_phrase_length?: number;
  readonly case_sensitive?: boolean;
  readonly min_repetitions?: number;
}

export interface RepeatedPhrase extends JsonObject {
  readonly phrase: string;
  readonly count: number;
  readonly phrase_length: number;
}

export interface RepetitionScanResult extends JsonObject {
  readonly repeated_phrases: RepeatedPhrase[];
  readonly repeated_phrase_count: number;
  readonly token_count: number;
}

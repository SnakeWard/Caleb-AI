import type { JsonObject, JsonValue } from "../../../types/common.js";

export type JsonSchemaSubsetType = "object" | "array" | "string" | "number" | "boolean" | "null";

export interface JsonSchemaSubset extends JsonObject {
  type: JsonSchemaSubsetType;
  required?: string[];
  properties?: Record<string, JsonSchemaSubset>;
  items?: JsonSchemaSubset;
  enum?: JsonValue[];
  additionalProperties?: boolean;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
}

export interface JsonSchemaValidatorInput extends JsonObject {
  candidate: JsonValue;
  schema: JsonSchemaSubset;
  label?: string;
}

export interface JsonSchemaValidationErrorRecord extends JsonObject {
  path: string;
  message: string;
}

export interface JsonSchemaValidationResult extends JsonObject {
  label: string;
  valid: boolean;
  error_count: number;
  errors: JsonSchemaValidationErrorRecord[];
}

export interface PlaceholderDetectorInput extends JsonObject {
  text: string;
  case_sensitive?: boolean;
  custom_patterns?: string[];
}

export interface PlaceholderFinding extends JsonObject {
  pattern: string;
  line_number: number;
  line_excerpt: string;
}

export interface PlaceholderDetectorResult extends JsonObject {
  placeholder_count: number;
  findings: PlaceholderFinding[];
  has_placeholders: boolean;
}

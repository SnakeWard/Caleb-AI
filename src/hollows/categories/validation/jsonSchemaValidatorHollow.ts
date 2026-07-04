import type { CalebWarning } from "../../../types/invocation.js";
import type { JsonObject, JsonValue } from "../../../types/common.js";
import type { HollowImplementation } from "../../runnerTypes.js";
import { jsonSchemaValidatorManifest as manifest } from "./validationHollowManifests.js";
import type {
  JsonSchemaSubset,
  JsonSchemaValidationErrorRecord,
  JsonSchemaValidationResult,
  JsonSchemaValidatorInput
} from "./validationHollowTypes.js";

const SUPPORTED_SCHEMA_KEYS = new Set([
  "type",
  "required",
  "properties",
  "items",
  "enum",
  "additionalProperties",
  "minLength",
  "maxLength",
  "minimum",
  "maximum"
]);

export const jsonSchemaValidatorManifest = manifest;

export interface JsonSchemaSubsetValidation {
  readonly result: JsonSchemaValidationResult;
  readonly warnings: CalebWarning[];
}

export function validateJsonSchemaSubset(input: JsonSchemaValidatorInput): JsonSchemaSubsetValidation {
  const errors: JsonSchemaValidationErrorRecord[] = [];
  const warnings: CalebWarning[] = [];
  collectUnsupportedKeywords(input.schema, "$schema", warnings);
  validateAgainstSchema(input.candidate, input.schema, "$", errors, warnings);

  return {
    result: {
      label: input.label ?? "candidate",
      valid: errors.length === 0,
      error_count: errors.length,
      errors
    },
    warnings
  };
}

export const jsonSchemaValidatorImplementation: HollowImplementation = ({ input_payload }) => {
  const input = parseJsonSchemaValidatorInput(input_payload);
  const validation = validateJsonSchemaSubset(input);

  return {
    result: validation.result,
    result_units: "validation_result",
    checks: [
      { check_id: "schema_present", label: "Schema Present", status: "completed", severity: "info" },
      { check_id: "candidate_present", label: "Candidate Present", status: "completed", severity: "info" },
      {
        check_id: "schema_subset_validation_completed",
        label: "Schema Subset Validation Completed",
        status: "completed",
        severity: "info"
      }
    ],
    warnings: validation.warnings,
    artifact_hashes: [],
    confidence_level: "deterministic_schema_subset_validation"
  };
};

function parseJsonSchemaValidatorInput(input: JsonValue): JsonSchemaValidatorInput {
  if (!isRecord(input) || !("candidate" in input)) {
    throw new Error("JSON Schema Validator Hollow requires input_payload.candidate.");
  }
  if (!isRecord(input.schema) || typeof input.schema.type !== "string") {
    throw new Error("JSON Schema Validator Hollow requires input_payload.schema with a supported type.");
  }
  if (input.label !== undefined && typeof input.label !== "string") {
    throw new Error("JSON Schema Validator Hollow label must be a string when provided.");
  }

  return {
    candidate: input.candidate,
    schema: input.schema as unknown as JsonSchemaSubset,
    ...(input.label === undefined ? {} : { label: input.label })
  };
}

function validateAgainstSchema(
  value: JsonValue | undefined,
  schema: JsonSchemaSubset,
  path: string,
  errors: JsonSchemaValidationErrorRecord[],
  warnings: CalebWarning[]
): void {
  if (!matchesType(value, schema.type)) {
    errors.push({ path, message: `Expected ${schema.type}.` });
    return;
  }

  if (schema.enum !== undefined && !schema.enum.some((entry) => jsonEquals(entry, value))) {
    errors.push({ path, message: "Value is not one of the allowed enum values." });
  }

  if (schema.type === "string" && typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push({ path, message: `String length is below minLength ${schema.minLength}.` });
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push({ path, message: `String length exceeds maxLength ${schema.maxLength}.` });
    }
  }

  if (schema.type === "number" && typeof value === "number") {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push({ path, message: `Number is below minimum ${schema.minimum}.` });
    }
    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push({ path, message: `Number exceeds maximum ${schema.maximum}.` });
    }
  }

  if (schema.type === "array" && Array.isArray(value) && schema.items !== undefined) {
    value.forEach((item, index) =>
      validateAgainstSchema(item, schema.items as JsonSchemaSubset, `${path}[${index}]`, errors, warnings)
    );
  }

  if (schema.type === "object" && isRecord(value)) {
    validateObject(value, schema, path, errors, warnings);
  }
}

function validateObject(
  value: JsonObject,
  schema: JsonSchemaSubset,
  path: string,
  errors: JsonSchemaValidationErrorRecord[],
  warnings: CalebWarning[]
): void {
  const required = schema.required ?? [];
  for (const key of required) {
    if (!(key in value)) {
      errors.push({ path: `${path}.${key}`, message: `Required property "${key}" is missing.` });
    }
  }

  const properties = schema.properties ?? {};
  for (const [key, propertySchema] of Object.entries(properties)) {
    if (key in value) {
      validateAgainstSchema(value[key], propertySchema, `${path}.${key}`, errors, warnings);
    }
  }

  if (schema.additionalProperties === false) {
    for (const key of Object.keys(value)) {
      if (!(key in properties)) {
        errors.push({ path: `${path}.${key}`, message: `Additional property "${key}" is not allowed.` });
        warnings.push({
          warning_id: "additional_property_detected",
          message: `Additional property detected at ${path}.${key}.`,
          severity: "warning"
        });
      }
    }
  }
}

function collectUnsupportedKeywords(
  schema: JsonSchemaSubset,
  path: string,
  warnings: CalebWarning[]
): void {
  for (const key of Object.keys(schema)) {
    if (!SUPPORTED_SCHEMA_KEYS.has(key)) {
      warnings.push({
        warning_id: "unsupported_schema_keyword",
        message: `Unsupported schema keyword "${key}" at ${path}.`,
        severity: "warning"
      });
    }
  }

  for (const [key, propertySchema] of Object.entries(schema.properties ?? {})) {
    collectUnsupportedKeywords(propertySchema, `${path}.properties.${key}`, warnings);
  }
  if (schema.items !== undefined) {
    collectUnsupportedKeywords(schema.items, `${path}.items`, warnings);
  }
}

function matchesType(value: JsonValue | undefined, type: string): boolean {
  if (type === "null") return value === null;
  if (type === "array") return Array.isArray(value);
  if (type === "object") return isRecord(value);
  return typeof value === type;
}

function isRecord(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function jsonEquals(left: JsonValue, right: JsonValue | undefined): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

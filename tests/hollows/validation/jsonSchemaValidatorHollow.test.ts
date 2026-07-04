import { describe, expect, it } from "vitest";
import { HollowRegistry, HollowRunner } from "../../../src/hollows/index.js";
import {
  jsonSchemaValidatorImplementation,
  jsonSchemaValidatorManifest,
  validateJsonSchemaSubset
} from "../../../src/hollows/categories/validation/index.js";

describe("JSON Schema Validator Hollow", () => {
  it("validates simple object with required string property", () => {
    const validation = validateJsonSchemaSubset({
      candidate: { name: "Caleb" },
      schema: {
        type: "object",
        required: ["name"],
        properties: { name: { type: "string" } },
        additionalProperties: false
      }
    });

    expect(validation.result.valid).toBe(true);
  });

  it("rejects missing required property", () => {
    const validation = validateJsonSchemaSubset({
      candidate: {},
      schema: { type: "object", required: ["name"], properties: { name: { type: "string" } } }
    });

    expect(validation.result.valid).toBe(false);
    expect(validation.result.errors[0]?.path).toBe("$.name");
  });

  it("rejects wrong primitive type", () => {
    const validation = validateJsonSchemaSubset({
      candidate: { count: "5" },
      schema: { type: "object", properties: { count: { type: "number" } } }
    });

    expect(validation.result.errors[0]?.message).toContain("number");
  });

  it("enforces enum", () => {
    const validation = validateJsonSchemaSubset({
      candidate: "blocked",
      schema: { type: "string", enum: ["trusted", "draft"] }
    });

    expect(validation.result.valid).toBe(false);
  });

  it("enforces additionalProperties false", () => {
    const validation = validateJsonSchemaSubset({
      candidate: { name: "Caleb", extra: true },
      schema: {
        type: "object",
        properties: { name: { type: "string" } },
        additionalProperties: false
      }
    });

    expect(validation.result.errors.map((error) => error.path)).toContain("$.extra");
    expect(validation.warnings.map((warning) => warning.warning_id)).toContain(
      "additional_property_detected"
    );
  });

  it("validates array items", () => {
    const validation = validateJsonSchemaSubset({
      candidate: ["one", 2],
      schema: { type: "array", items: { type: "string" } }
    });

    expect(validation.result.errors[0]?.path).toBe("$[1]");
  });

  it("enforces minLength and maxLength", () => {
    const short = validateJsonSchemaSubset({
      candidate: "ai",
      schema: { type: "string", minLength: 3, maxLength: 5 }
    });
    const long = validateJsonSchemaSubset({
      candidate: "caleb-ai",
      schema: { type: "string", minLength: 3, maxLength: 5 }
    });

    expect(short.result.valid).toBe(false);
    expect(long.result.valid).toBe(false);
  });

  it("warns on unsupported schema keyword", () => {
    const validation = validateJsonSchemaSubset({
      candidate: "Caleb",
      schema: { type: "string", pattern: "^C" } as never
    });

    expect(validation.warnings.map((warning) => warning.warning_id)).toContain(
      "unsupported_schema_keyword"
    );
  });

  it("returns result_units validation_result", async () => {
    const record = await runJsonSchemaValidator({
      candidate: "Caleb",
      schema: { type: "string" }
    });

    expect(record.result_units).toBe("validation_result");
  });

  it("malformed input fails clearly through the runner", async () => {
    const record = await runJsonSchemaValidator({ candidate: "Caleb" });

    expect(record.status).toBe("failed");
    expect(record.errors[0]?.message).toContain("schema");
  });
});

async function runJsonSchemaValidator(input_payload: object) {
  const registry = new HollowRegistry([jsonSchemaValidatorManifest]);
  const runner = new HollowRunner(registry, {
    [jsonSchemaValidatorManifest.hollow_id]: jsonSchemaValidatorImplementation
  });

  return await runner.run({
    hollow_id: jsonSchemaValidatorManifest.hollow_id,
    input_payload: input_payload as never,
    task_id: "task_json_schema_validator",
    run_id: "run_json_schema_validator",
    trace_id: "trace_json_schema_validator",
    invocation_id: "invocation_json_schema_validator"
  });
}

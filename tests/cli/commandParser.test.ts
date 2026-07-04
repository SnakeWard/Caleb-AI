import { describe, expect, it } from "vitest";

import { parseCliArgs } from "../../src/cli/index.js";

describe("CLI command parser", () => {
  it("parses help command", () => {
    expect(parseCliArgs(["help"])).toMatchObject({ command: "help" });
  });

  it("parses info command", () => {
    expect(parseCliArgs(["info"])).toMatchObject({ command: "info" });
  });

  it("parses list-hollows --json", () => {
    expect(parseCliArgs(["list-hollows", "--json"])).toMatchObject({
      command: "list-hollows",
      output_format: "json"
    });
  });

  it("parses inspect-hollow --id", () => {
    const parsed = parseCliArgs(["inspect-hollow", "--id", "hollow.text.character_count"]);

    expect(parsed.flags.id).toBe("hollow.text.character_count");
  });

  it("parses run-hollow with --id and --input-json", () => {
    const parsed = parseCliArgs([
      "run-hollow",
      "--id",
      "hollow.text.character_count",
      "--input-json",
      "{\"text\":\"hello\"}"
    ]);

    expect(parsed.errors).toEqual([]);
    expect(parsed.flags.input_json).toBe("{\"text\":\"hello\"}");
  });

  it("parses run-hollow with --input-file", () => {
    const parsed = parseCliArgs([
      "run-hollow",
      "--id",
      "hollow.text.character_count",
      "--input-file",
      "./input.json"
    ]);

    expect(parsed.flags.input_file).toBe("./input.json");
  });

  it("parses list-media-hollows", () => {
    expect(parseCliArgs(["list-media-hollows"])).toMatchObject({
      command: "list-media-hollows",
      catalog: "media"
    });
  });

  it("parses inspect-media-hollow --id", () => {
    const parsed = parseCliArgs(["inspect-media-hollow", "--id", "hollow.media.aspect_ratio"]);

    expect(parsed.errors).toEqual([]);
    expect(parsed.flags.id).toBe("hollow.media.aspect_ratio");
  });

  it("parses run-media-hollow with --id and --input-json", () => {
    const parsed = parseCliArgs([
      "run-media-hollow",
      "--id",
      "hollow.media.aspect_ratio",
      "--input-json",
      "{\"width\":1920,\"height\":1080}"
    ]);

    expect(parsed.errors).toEqual([]);
    expect(parsed.flags.input_json).toBe("{\"width\":1920,\"height\":1080}");
  });

  it("parses run-media-hollow with --input-file", () => {
    const parsed = parseCliArgs([
      "run-media-hollow",
      "--id",
      "hollow.media.aspect_ratio",
      "--input-file",
      "./media-input.json"
    ]);

    expect(parsed.errors).toEqual([]);
    expect(parsed.flags.input_file).toBe("./media-input.json");
  });

  it("parses inspect-hollowcut-project --input-file", () => {
    const parsed = parseCliArgs([
      "inspect-hollowcut-project",
      "--input-file",
      "examples/hollowcut-project-demo/minimal-project.json"
    ]);

    expect(parsed.errors).toEqual([]);
    expect(parsed.command).toBe("inspect-hollowcut-project");
    expect(parsed.catalog).toBe("hollowcut_project");
    expect(parsed.flags.input_file).toBe("examples/hollowcut-project-demo/minimal-project.json");
  });

  it("parses inspect-hollowcut-project --input-file --json", () => {
    const parsed = parseCliArgs([
      "inspect-hollowcut-project",
      "--input-file",
      "examples/hollowcut-project-demo/minimal-project.json",
      "--json"
    ]);

    expect(parsed.errors).toEqual([]);
    expect(parsed.output_format).toBe("json");
  });

  it("allows handler-level validation for inspect-hollowcut-project without input-file", () => {
    const parsed = parseCliArgs(["inspect-hollowcut-project"]);

    expect(parsed.errors).toEqual([]);
    expect(parsed.command).toBe("inspect-hollowcut-project");
  });

  it("rejects input-json for inspect-hollowcut-project", () => {
    const parsed = parseCliArgs(["inspect-hollowcut-project", "--input-json", "{}"]);

    expect(parsed.errors.map((error) => error.code)).toContain("unsupported_input_json");
  });

  it("rejects write flags for inspect-hollowcut-project", () => {
    const parsed = parseCliArgs([
      "inspect-hollowcut-project",
      "--input-file",
      "project.json",
      "--write-ledger",
      "--write-report"
    ]);

    expect(parsed.errors.map((error) => error.code)).toContain("unsupported_side_effect_flag");
  });

  it("rejects unknown command", () => {
    expect(parseCliArgs(["unknown"]).errors[0]?.code).toBe("unknown_command");
  });

  it("rejects unknown flag", () => {
    expect(parseCliArgs(["help", "--bad"]).errors[0]?.code).toBe("unknown_flag");
  });

  it("detects input-json/input-file conflict", () => {
    const parsed = parseCliArgs([
      "run-hollow",
      "--id",
      "hollow.text.character_count",
      "--input-json",
      "{}",
      "--input-file",
      "input.json"
    ]);

    expect(parsed.errors.map((error) => error.code)).toContain("input_conflict");
  });

  it("rejects repeated flags", () => {
    const parsed = parseCliArgs(["inspect-hollow", "--id", "a", "--id", "b"]);

    expect(parsed.errors.map((error) => error.code)).toContain("repeated_flag");
  });

  it("parses logic-execute --json --include-context", () => {
    const parsed = parseCliArgs([
      "logic-execute",
      "--input-file",
      "examples/logicEngine/simple-task.json",
      "--id",
      "hollow.text.character_count",
      "--hollow-input-file",
      "examples/logicEngine/character-count-input.json",
      "--json",
      "--include-context"
    ]);

    expect(parsed.errors).toEqual([]);
    expect(parsed.flags.include_context).toBe(true);
    expect(parsed.output_format).toBe("json");
  });

  it("rejects logic-execute --include-context without --json", () => {
    const parsed = parseCliArgs([
      "logic-execute",
      "--input-file",
      "examples/logicEngine/simple-task.json",
      "--id",
      "hollow.text.character_count",
      "--hollow-input-file",
      "examples/logicEngine/character-count-input.json",
      "--include-context"
    ]);

    expect(parsed.errors.map((error) => error.code)).toContain("include_context_requires_json");
  });

  it("rejects route-decision --include-context", () => {
    const parsed = parseCliArgs([
      "route-decision",
      "--input-file",
      "examples/logicEngine/simple-task.json",
      "--json",
      "--include-context"
    ]);

    expect(parsed.errors.map((error) => error.code)).toContain("unsupported_flag");
  });

  it("parses logic-execute --json --include-trace", () => {
    const parsed = parseCliArgs([
      "logic-execute",
      "--input-file",
      "examples/logicEngine/simple-task.json",
      "--id",
      "hollow.text.character_count",
      "--hollow-input-file",
      "examples/logicEngine/character-count-input.json",
      "--json",
      "--include-trace"
    ]);

    expect(parsed.errors).toEqual([]);
    expect(parsed.flags.include_trace).toBe(true);
    expect(parsed.output_format).toBe("json");
  });

  it("rejects logic-execute --include-trace without --json", () => {
    const parsed = parseCliArgs([
      "logic-execute",
      "--input-file",
      "examples/logicEngine/simple-task.json",
      "--id",
      "hollow.text.character_count",
      "--hollow-input-file",
      "examples/logicEngine/character-count-input.json",
      "--include-trace"
    ]);

    expect(parsed.errors.map((error) => error.code)).toContain("include_trace_requires_json");
  });

  it("rejects route-decision --include-trace", () => {
    const parsed = parseCliArgs([
      "route-decision",
      "--input-file",
      "examples/logicEngine/simple-task.json",
      "--json",
      "--include-trace"
    ]);

    expect(parsed.errors.map((error) => error.code)).toContain("unsupported_flag");
  });
});

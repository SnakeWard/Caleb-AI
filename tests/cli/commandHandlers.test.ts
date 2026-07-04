import { mkdtemp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { handleCliCommand, parseCliArgs } from "../../src/cli/index.js";

describe("CLI command handlers", () => {
  it("help handler returns ok", async () => {
    const result = await handleCliCommand(parseCliArgs(["help"]));

    expect(result.ok).toBe(true);
  });

  it("info handler returns project info", async () => {
    const result = await handleCliCommand(parseCliArgs(["info"]));

    expect(result.data).toMatchObject({ projectInfo: { name: "Caleb AI" } });
  });

  it("list-hollows returns V1 Hollow list", async () => {
    const result = await handleCliCommand(parseCliArgs(["list-hollows"]));

    expect(JSON.stringify(result.data)).toContain("hollow.text.character_count");
  });

  it("list-hollows still returns exactly 12 V1 Hollows", async () => {
    const result = await handleCliCommand(parseCliArgs(["list-hollows"]));

    expect((result.data as { hollows: unknown[] }).hollows).toHaveLength(12);
    expect(JSON.stringify(result.data)).not.toContain("hollow.media.");
  });

  it("inspect-hollow returns manifest for character count", async () => {
    const result = await handleCliCommand(
      parseCliArgs(["inspect-hollow", "--id", "hollow.text.character_count"])
    );

    expect(result.data).toMatchObject({
      manifest: { hollow_id: "hollow.text.character_count" }
    });
  });

  it("inspect-hollow returns error for missing ID", async () => {
    const result = await handleCliCommand(parseCliArgs(["inspect-hollow"]));

    expect(result.ok).toBe(false);
    expect(result.errors[0]?.code).toBe("missing_id");
  });

  it("inspect-hollow rejects media ID", async () => {
    const result = await handleCliCommand(parseCliArgs(["inspect-hollow", "--id", "hollow.media.aspect_ratio"]));

    expect(result.ok).toBe(false);
    expect(result.errors[0]?.code).toBe("hollow_not_found");
  });

  it("run-hollow executes character count from input-json", async () => {
    const result = await runCharacterCount();

    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({
      invocation: {
        hollow_id: "hollow.text.character_count",
        result: { character_count: 5 }
      }
    });
  });

  it("run-hollow returns invocation with T0/unverified before verification result", async () => {
    const result = await runCharacterCount();

    expect(result.data).toMatchObject({
      invocation: { trust_tier: "T0", verification_status: "unverified" }
    });
  });

  it("run-hollow returns verification result with T2 evidence for valid deterministic Hollow", async () => {
    const result = await runCharacterCount();

    expect(result.data).toMatchObject({
      verification_result: { trust_tier: "T2" },
      evidence_packet: { trust_tier: "T2" }
    });
  });

  it("run-hollow with --write-ledger writes Ledger entries to temp ledger path", async () => {
    await withTempDir(async (dir) => {
      const ledgerPath = join(dir, "ledger.jsonl");
      const result = await handleCliCommand(
        parseCliArgs([
          "run-hollow",
          "--id",
          "hollow.text.character_count",
          "--input-json",
          "{\"text\":\"Caleb\"}",
          "--write-ledger",
          "--ledger-path",
          ledgerPath
        ])
      );

      expect(result.ok).toBe(true);
      expect((await readFile(ledgerPath, "utf8")).trim().split(/\r?\n/u)).toHaveLength(2);
    });
  });

  it("run-hollow with --write-report writes report files to temp report dir", async () => {
    await withTempDir(async (dir) => {
      const result = await handleCliCommand(
        parseCliArgs([
          "run-hollow",
          "--id",
          "hollow.text.character_count",
          "--input-json",
          "{\"text\":\"Caleb\"}",
          "--write-report",
          "--report-dir",
          dir
        ])
      );

      expect(JSON.stringify(result.data)).toContain(".md");
      expect(JSON.stringify(result.data)).toContain(".json");
    });
  });

  it("run-hollow rejects malformed JSON input", async () => {
    const result = await handleCliCommand(
      parseCliArgs(["run-hollow", "--id", "hollow.text.character_count", "--input-json", "{"])
    );

    expect(result.ok).toBe(false);
    expect(result.errors[0]?.code).toBe("invalid_json");
  });

  it("run-hollow rejects missing Hollow ID", async () => {
    const result = await handleCliCommand(parseCliArgs(["run-hollow", "--input-json", "{}"]));

    expect(result.ok).toBe(false);
    expect(result.errors[0]?.code).toBe("missing_id");
  });

  it("run-hollow rejects missing input", async () => {
    const result = await handleCliCommand(parseCliArgs(["run-hollow", "--id", "hollow.text.character_count"]));

    expect(result.ok).toBe(false);
    expect(result.errors[0]?.code).toBe("missing_input");
  });

  it("run-hollow rejects media ID", async () => {
    const result = await handleCliCommand(
      parseCliArgs(["run-hollow", "--id", "hollow.media.aspect_ratio", "--input-json", "{\"width\":1,\"height\":1}"])
    );

    expect(result.ok).toBe(false);
    expect(result.errors[0]?.code).toBe("hollow_not_found");
  });

  it("run-hollow does not write Ledger when --write-ledger is absent", async () => {
    await withTempDir(async (dir) => {
      const ledgerPath = join(dir, "ledger.jsonl");
      await runCharacterCount(["--ledger-path", ledgerPath]);

      await expect(stat(ledgerPath)).rejects.toThrow();
    });
  });

  it("run-hollow does not write report when --write-report is absent", async () => {
    await withTempDir(async (dir) => {
      await runCharacterCount(["--report-dir", dir]);

      const files = await import("node:fs/promises").then((fs) => fs.readdir(dir));
      expect(files).toEqual([]);
    });
  });

  it("run-hollow reads explicit input file", async () => {
    await withTempDir(async (dir) => {
      const inputPath = join(dir, "input.json");
      await writeFile(inputPath, "{\"text\":\"Caleb\"}", "utf8");

      const result = await handleCliCommand(
        parseCliArgs(["run-hollow", "--id", "hollow.text.character_count", "--input-file", inputPath])
      );

      expect(result.data).toMatchObject({ invocation: { result: { character_count: 5 } } });
    });
  });

  it("logic-execute omits execution_context unless --include-context is present", async () => {
    const result = await handleCliCommand(
      parseCliArgs([
        "logic-execute",
        "--input-file",
        "examples/logicEngine/simple-task.json",
        "--id",
        "hollow.text.character_count",
        "--hollow-input-file",
        "examples/logicEngine/character-count-input.json",
        "--json"
      ])
    );

    expect(result.ok).toBe(true);
    expect((result.data as Record<string, unknown>)["execution_context"]).toBeUndefined();
  });

  it("logic-execute includes execution_context with --json --include-context", async () => {
    const result = await handleCliCommand(
      parseCliArgs([
        "logic-execute",
        "--input-file",
        "examples/logicEngine/simple-task.json",
        "--id",
        "hollow.text.character_count",
        "--hollow-input-file",
        "examples/logicEngine/character-count-input.json",
        "--json",
        "--include-context"
      ])
    );

    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({
      execution_context: {
        schema_version: "0.5.0",
        role_artifacts: []
      }
    });
  });

  it("logic-execute omits telemetry_trace unless --include-trace is present", async () => {
    const result = await handleCliCommand(
      parseCliArgs([
        "logic-execute",
        "--input-file",
        "examples/logicEngine/simple-task.json",
        "--id",
        "hollow.text.character_count",
        "--hollow-input-file",
        "examples/logicEngine/character-count-input.json",
        "--json"
      ])
    );

    expect(result.ok).toBe(true);
    expect((result.data as Record<string, unknown>)["telemetry_trace"]).toBeUndefined();
  });

  it("logic-execute includes telemetry_trace with --json --include-trace and does not imply execution_context", async () => {
    const result = await handleCliCommand(
      parseCliArgs([
        "logic-execute",
        "--input-file",
        "examples/logicEngine/simple-task.json",
        "--id",
        "hollow.text.character_count",
        "--hollow-input-file",
        "examples/logicEngine/character-count-input.json",
        "--json",
        "--include-trace"
      ])
    );

    expect(result.ok).toBe(true);
    const data = result.data as Record<string, unknown>;
    expect(data["execution_context"]).toBeUndefined();
    expect(data["telemetry_trace"]).toMatchObject({
      schema_version: "0.7.0",
      sanitized: true
    });

    const trace = data["telemetry_trace"] as {
      readonly event_count: number;
      readonly context_id: string;
      readonly events: ReadonlyArray<{ readonly context_id: string }>;
    };
    expect(trace.event_count).toBe(trace.events.length);
    expect(trace.events.every((event) => event.context_id === trace.context_id)).toBe(true);
  });

  it("logic-execute --include-context --include-trace includes both sibling fields", async () => {
    const result = await handleCliCommand(
      parseCliArgs([
        "logic-execute",
        "--input-file",
        "examples/logicEngine/simple-task.json",
        "--id",
        "hollow.text.character_count",
        "--hollow-input-file",
        "examples/logicEngine/character-count-input.json",
        "--json",
        "--include-context",
        "--include-trace"
      ])
    );

    expect(result.ok).toBe(true);
    expect(result.data).toMatchObject({
      execution_context: {
        schema_version: "0.5.0",
        role_artifacts: []
      },
      telemetry_trace: {
        schema_version: "0.7.0",
        sanitized: true
      }
    });
  });

  it("logic-execute --include-context does not imply telemetry_trace", async () => {
    const result = await handleCliCommand(
      parseCliArgs([
        "logic-execute",
        "--input-file",
        "examples/logicEngine/simple-task.json",
        "--id",
        "hollow.text.character_count",
        "--hollow-input-file",
        "examples/logicEngine/character-count-input.json",
        "--json",
        "--include-context"
      ])
    );

    expect(result.ok).toBe(true);
    expect((result.data as Record<string, unknown>)["execution_context"]).toBeDefined();
    expect((result.data as Record<string, unknown>)["telemetry_trace"]).toBeUndefined();
  });

  it("telemetry_trace is sanitized and logic-execute trace surfacing writes no files or Ledger entries by default", async () => {
    await withTempDir(async (dir) => {
      const result = await handleCliCommand(
        parseCliArgs([
          "logic-execute",
          "--input-file",
          "examples/logicEngine/simple-task.json",
          "--id",
          "hollow.text.character_count",
          "--hollow-input-file",
          "examples/logicEngine/character-count-input.json",
          "--json",
          "--include-trace",
          "--ledger-path",
          join(dir, "ledger.jsonl")
        ])
      );

      expect(result.ok).toBe(true);
      const serialized = JSON.stringify((result.data as Record<string, unknown>)["telemetry_trace"]);
      expect(serialized).not.toContain("hollow_input");
      expect(serialized).not.toContain("input_payload");
      expect(serialized).not.toContain("Caleb orchestrates.");
      expect(serialized).not.toContain("hidden_reasoning");
      expect(serialized.toLowerCase()).not.toContain("secret");
      expect(await readdir(dir)).toEqual([]);
    });
  });

  it("route-decision stays dry-run and omits execution_context", async () => {
    const result = await handleCliCommand(
      parseCliArgs([
        "route-decision",
        "--input-file",
        "examples/logicEngine/simple-task.json",
        "--json"
      ])
    );

    expect(result.ok).toBe(true);
    expect((result.data as Record<string, unknown>)["execution_context"]).toBeUndefined();
    expect((result.data as Record<string, unknown>)["executed_hollow_id"]).toBeUndefined();
  });
});

async function runCharacterCount(extraArgs: string[] = []) {
  return handleCliCommand(
    parseCliArgs([
      "run-hollow",
      "--id",
      "hollow.text.character_count",
      "--input-json",
      "{\"text\":\"Caleb\"}",
      ...extraArgs
    ])
  );
}

async function withTempDir(run: (dir: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), "caleb-cli-test-"));
  try {
    await run(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

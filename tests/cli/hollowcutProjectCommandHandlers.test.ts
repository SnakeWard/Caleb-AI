import { mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { handleCliCommand } from "../../src/cli/commandHandlers.js";
import { parseCliArgs } from "../../src/cli/commandParser.js";
import { formatCliCommandResult } from "../../src/cli/minimalCli.js";

const MINIMAL_FIXTURE = "examples/hollowcut-project-demo/minimal-project.json";
const SLIDESHOW_FIXTURE = "examples/hollowcut-project-demo/slideshow-project.json";
const NARRATED_FIXTURE = "examples/hollowcut-project-demo/narrated-video-project.json";
const INVALID_MISSING_PROJECT_ID_FIXTURE = "examples/hollowcut-project-demo/invalid-missing-project-id.json";
const INVALID_UNSAFE_ASSET_PATH_FIXTURE = "examples/hollowcut-project-demo/invalid-unsafe-asset-path.json";
const INVALID_MISSING_ASSET_REFERENCE_FIXTURE =
  "examples/hollowcut-project-demo/invalid-missing-asset-reference.json";

type ValidationData = {
  readonly project_path: string;
  readonly validation_result: {
    readonly valid: boolean;
    readonly issues: readonly { readonly code: string }[];
    readonly normalized_summary: { readonly project_id: string | null };
  };
};

async function inspectProject(path: string, extraArgs: readonly string[] = []) {
  return handleCliCommand(
    parseCliArgs(["inspect-hollowcut-project", "--input-file", path, ...extraArgs])
  );
}

function validationData(result: { readonly data?: unknown }): ValidationData {
  return result.data as ValidationData;
}

async function withTempDir<T>(callback: (dir: string) => Promise<T>): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), "caleb-hollowcut-project-cli-"));
  try {
    return await callback(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

describe("Hollowcut project CLI command handler", () => {
  it("inspect-hollowcut-project validates minimal fixture", async () => {
    const result = await inspectProject(MINIMAL_FIXTURE);

    expect(result.ok).toBe(true);
    expect(validationData(result).validation_result.valid).toBe(true);
  });

  it("inspect-hollowcut-project validates slideshow fixture", async () => {
    const result = await inspectProject(SLIDESHOW_FIXTURE);

    expect(result.ok).toBe(true);
    expect(validationData(result).validation_result.valid).toBe(true);
  });

  it("inspect-hollowcut-project validates narrated-video fixture", async () => {
    const result = await inspectProject(NARRATED_FIXTURE);

    expect(result.ok).toBe(true);
    expect(validationData(result).validation_result.valid).toBe(true);
  });

  it("returns validation_result.valid false for missing project_id fixture", async () => {
    const result = await inspectProject(INVALID_MISSING_PROJECT_ID_FIXTURE);

    expect(result.ok).toBe(true);
    expect(validationData(result).validation_result.valid).toBe(false);
    expect(validationData(result).validation_result.issues.map((issue) => issue.code)).toContain("project_id_missing");
  });

  it("returns validation_result.valid false for unsafe asset path fixture", async () => {
    const result = await inspectProject(INVALID_UNSAFE_ASSET_PATH_FIXTURE);

    expect(result.ok).toBe(true);
    expect(validationData(result).validation_result.valid).toBe(false);
    expect(validationData(result).validation_result.issues.map((issue) => issue.code)).toContain(
      "asset_relative_path_unsafe"
    );
  });

  it("returns validation_result.valid false for missing asset reference fixture", async () => {
    const result = await inspectProject(INVALID_MISSING_ASSET_REFERENCE_FIXTURE);

    expect(result.ok).toBe(true);
    expect(validationData(result).validation_result.valid).toBe(false);
    expect(validationData(result).validation_result.issues.map((issue) => issue.code)).toContain(
      "timeline_item_missing_asset_reference"
    );
  });

  it("returns CLI error for missing --input-file", async () => {
    const result = await handleCliCommand(parseCliArgs(["inspect-hollowcut-project"]));

    expect(result.ok).toBe(false);
    expect(result.errors[0]?.code).toBe("missing_input_file");
  });

  it("returns CLI error for malformed JSON", async () => {
    await withTempDir(async (dir) => {
      const projectPath = join(dir, "malformed.json");
      await writeFile(projectPath, "{", "utf8");

      const result = await inspectProject(projectPath);

      expect(result.ok).toBe(false);
      expect(result.errors[0]?.code).toBe("invalid_json");
    });
  });

  it("returns CLI error for missing file", async () => {
    const result = await inspectProject("examples/hollowcut-project-demo/missing-project.json");

    expect(result.ok).toBe(false);
    expect(result.errors[0]?.code).toBe("input_file_unreadable");
  });

  it("rejects directory input", async () => {
    await withTempDir(async (dir) => {
      const result = await inspectProject(dir);

      expect(result.ok).toBe(false);
      expect(result.errors[0]?.code).toBe("input_file_not_file");
    });
  });

  it("rejects oversized file", async () => {
    await withTempDir(async (dir) => {
      const projectPath = join(dir, "oversized-project.json");
      await writeFile(projectPath, " ".repeat(1024 * 1024 + 1), "utf8");

      const result = await inspectProject(projectPath);

      expect(result.ok).toBe(false);
      expect(result.errors[0]?.code).toBe("input_file_too_large");
    });
  });

  it("rejects --write-ledger", async () => {
    const result = await inspectProject(MINIMAL_FIXTURE, ["--write-ledger"]);

    expect(result.ok).toBe(false);
    expect(result.errors[0]?.code).toBe("unsupported_side_effect_flag");
  });

  it("rejects --write-report", async () => {
    const result = await inspectProject(MINIMAL_FIXTURE, ["--write-report"]);

    expect(result.ok).toBe(false);
    expect(result.errors[0]?.code).toBe("unsupported_side_effect_flag");
  });

  it("does not mutate the input project file", async () => {
    const before = await readFile(MINIMAL_FIXTURE, "utf8");

    const result = await inspectProject(MINIMAL_FIXTURE);
    const after = await readFile(MINIMAL_FIXTURE, "utf8");

    expect(result.ok).toBe(true);
    expect(after).toBe(before);
  });

  it("does not write Ledger or report files", async () => {
    await withTempDir(async (dir) => {
      const projectPath = join(dir, "project.json");
      await writeFile(projectPath, await readFile(MINIMAL_FIXTURE, "utf8"), "utf8");

      const result = await inspectProject(projectPath);
      const entries = await readdir(dir);

      expect(result.ok).toBe(true);
      expect(entries).toEqual(["project.json"]);
      await expect(stat(join(dir, "ledger.jsonl"))).rejects.toThrow();
      await expect(stat(join(dir, "reports"))).rejects.toThrow();
    });
  });

  it("does not return runner, verification, evidence, or ledger data", async () => {
    const result = await inspectProject(MINIMAL_FIXTURE);

    expect(result.ok).toBe(true);
    expect(result.data).not.toHaveProperty("invocation");
    expect(result.data).not.toHaveProperty("verification_result");
    expect(result.data).not.toHaveProperty("evidence_packet");
    expect(result.data).not.toHaveProperty("ledger_entries");
  });

  it("text output includes validation summary", async () => {
    const result = await inspectProject(MINIMAL_FIXTURE);
    const output = formatCliCommandResult(result, "text");

    expect(output).toContain("validation_result");
    expect(output).toContain("normalized_summary");
    expect(output).toContain("hollowcut_project_minimal_demo");
  });

  it("JSON output contains validation_result", async () => {
    const result = await inspectProject(MINIMAL_FIXTURE);
    const output = JSON.parse(formatCliCommandResult(result, "json")) as { data?: unknown };

    expect(output.data).toHaveProperty("validation_result");
  });

  it("creates no temp directories beyond the explicit test fixture directory", async () => {
    await withTempDir(async (dir) => {
      const projectPath = join(dir, "nested", "project.json");
      await mkdir(join(dir, "nested"));
      await writeFile(projectPath, await readFile(MINIMAL_FIXTURE, "utf8"), "utf8");

      const result = await inspectProject(projectPath);

      expect(result.ok).toBe(true);
      expect(await readdir(join(dir, "nested"))).toEqual(["project.json"]);
    });
  });
});

import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { handleCliCommand } from "../../src/cli/commandHandlers.js";
import { parseCliArgs } from "../../src/cli/index.js";
import { validateHollowcutProject } from "../../src/hollowcut/index.js";
import { MEDIA_HOLLOW_MANIFESTS, V1_HOLLOW_MANIFESTS } from "../../src/hollows/index.js";

const PROJECT_FIXTURES = [
  "examples/hollowcut-project-demo/minimal-project.json",
  "examples/hollowcut-project-demo/slideshow-project.json",
  "examples/hollowcut-project-demo/narrated-video-project.json"
];

const INVALID_PROJECT_FIXTURES = [
  "examples/hollowcut-project-demo/invalid-missing-project-id.json",
  "examples/hollowcut-project-demo/invalid-unsafe-asset-path.json",
  "examples/hollowcut-project-demo/invalid-missing-asset-reference.json"
];

const ALLOWED_HOLLOWCUT_SOURCE_FILES = [
  "src/hollowcut/index.ts",
  "src/hollowcut/project/hollowcutProjectErrors.ts",
  "src/hollowcut/project/hollowcutProjectTypes.ts",
  "src/hollowcut/project/hollowcutProjectValidation.ts",
  "src/hollowcut/project/index.ts",
  "src/hollowcut/projectStateCheckHollow.ts",
  "src/hollowcut/projectTimelineCrossCheckHollow.ts",
  "src/hollowcut/timeline/index.ts",
  "src/hollowcut/timeline/timelineOverlapHelpers.ts",
  "src/hollowcut/timeline/timelineReferenceHelpers.ts",
  "src/hollowcut/timeline/timelineTimingHelpers.ts",
  "src/hollowcut/timeline/timelineValidationHelpers.ts",
  "src/hollowcut/timeline/timelineValidationTypes.ts",
  "src/hollowcut/exportReadinessCheckHollow.ts",
  "src/hollowcut/exportPlanPreviewHollow.ts"
].sort();

const FORBIDDEN_HOLLOWCUT_RUNTIME_FOLDERS = [
  "src/hollowcut/ui",
  "src/hollowcut/captions",
  "src/hollowcut/caption",
  "src/hollowcut/media",
  "src/hollowcut/export",
  "src/hollowcut/reports",
  "src/ui",
  "src/web",
  "src/routes",
  "src/hollows/categories/caption",
  "src/hollows/categories/export"
];

const FORBIDDEN_TOP_LEVEL_DEPENDENCIES = [
  "react",
  "react-dom",
  "next",
  "vite",
  "three",
  "@react-three/fiber",
  "ffmpeg",
  "fluent-ffmpeg",
  "openai",
  "@anthropic-ai/sdk",
  "@google/generative-ai",
  "langchain",
  "langgraph"
];

const ALLOWED_TIMELINE_HOLLOW_FILES = [
  "src/hollows/categories/timeline/index.ts",
  "src/hollows/categories/timeline/timelineAssetReferenceCheckHollow.ts",
  "src/hollows/categories/timeline/timelineDurationConsistencyHollow.ts",
  "src/hollows/categories/timeline/timelineHollowManifests.ts",
  "src/hollows/categories/timeline/timelineSchemaCheckHollow.ts",
  "src/hollows/categories/timeline/timelineTemporalIntegrityCheckHollow.ts",
  "src/hollows/categories/timeline/timelineTrackReferenceCheckHollow.ts"
].sort();

async function exists(path: string): Promise<boolean> {
  return stat(path)
    .then(() => true)
    .catch(() => false);
}

async function readJson(path: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(path, "utf8")) as Record<string, unknown>;
}

async function listSourceFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true }).catch(() => []);
  const files: string[] = [];
  for (const entry of entries) {
    const path = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listSourceFiles(path)));
    } else if (entry.isFile()) {
      files.push(path.replaceAll("\\", "/"));
    }
  }
  return files;
}

describe("Hollowcut project contract and validator boundary", () => {
  it("docs/HOLLOWCUT_PROJECT_CONTRACT.md exists", async () => {
    await expect(exists("docs/HOLLOWCUT_PROJECT_CONTRACT.md")).resolves.toBe(true);
  });

  it("docs/HOLLOWCUT_PROJECT_IMPLEMENTATION_PLAN.md exists", async () => {
    await expect(exists("docs/HOLLOWCUT_PROJECT_IMPLEMENTATION_PLAN.md")).resolves.toBe(true);
  });

  it("docs/HOLLOWCUT_PROJECT_CLI_DEMO.md exists", async () => {
    await expect(exists("docs/HOLLOWCUT_PROJECT_CLI_DEMO.md")).resolves.toBe(true);
  });

  it("docs/TIMELINE_SCHEMA_CONTRACTS.md exists", async () => {
    await expect(exists("docs/TIMELINE_SCHEMA_CONTRACTS.md")).resolves.toBe(true);
  });

  it("src/hollowcut/index.ts exists", async () => {
    await expect(exists("src/hollowcut/index.ts")).resolves.toBe(true);
  });

  it("src/hollowcut/project/hollowcutProjectTypes.ts exists", async () => {
    await expect(exists("src/hollowcut/project/hollowcutProjectTypes.ts")).resolves.toBe(true);
  });

  it("src/hollowcut/project/hollowcutProjectValidation.ts exists", async () => {
    await expect(exists("src/hollowcut/project/hollowcutProjectValidation.ts")).resolves.toBe(true);
  });

  it("src/hollowcut/project/hollowcutProjectErrors.ts exists", async () => {
    await expect(exists("src/hollowcut/project/hollowcutProjectErrors.ts")).resolves.toBe(true);
  });

  it("src/hollowcut/project/index.ts exists", async () => {
    await expect(exists("src/hollowcut/project/index.ts")).resolves.toBe(true);
  });

  it("src/hollowcut contains only allowed project validator and Pass 25 timeline helper files", async () => {
    const sourceFiles = await listSourceFiles("src/hollowcut");

    expect(sourceFiles.sort()).toEqual(ALLOWED_HOLLOWCUT_SOURCE_FILES);
  });

  it("does not create Hollowcut UI, timeline, caption, export, media, or reports runtime folders", async () => {
    for (const path of FORBIDDEN_HOLLOWCUT_RUNTIME_FOLDERS) {
      await expect(exists(path)).resolves.toBe(false);
    }
  });

  it("Hollowcut project contract references timeline schema contracts", async () => {
    const text = await readFile("docs/HOLLOWCUT_PROJECT_CONTRACT.md", "utf8");

    expect(text).toContain("TIMELINE_SCHEMA_CONTRACTS.md");
    expect(text).toContain("shared timeline validation helper functions");
    await expect(exists("src/hollows/categories/timeline")).resolves.toBe(true);
    expect((await listSourceFiles("src/hollows/categories/timeline")).sort()).toEqual(ALLOWED_TIMELINE_HOLLOW_FILES);
  });

  it("examples parse as JSON", async () => {
    for (const fixture of PROJECT_FIXTURES) {
      await expect(readJson(fixture)).resolves.toHaveProperty("schema_version", "1.0.0");
    }
  });

  it("invalid examples parse as JSON", async () => {
    for (const fixture of INVALID_PROJECT_FIXTURES) {
      await expect(readJson(fixture)).resolves.toHaveProperty("schema_version", "1.0.0");
    }
  });

  it("examples validate through the new validator with no blocking errors", async () => {
    for (const fixture of PROJECT_FIXTURES) {
      const result = validateHollowcutProject(await readJson(fixture));

      expect(result.valid).toBe(true);
      expect(result.error_count).toBe(0);
    }
  });

  it("invalid fixtures validate as invalid through the validator", async () => {
    for (const fixture of INVALID_PROJECT_FIXTURES) {
      const result = validateHollowcutProject(await readJson(fixture));

      expect(result.valid).toBe(false);
      expect(result.error_count).toBeGreaterThan(0);
    }
  });

  it("CLI command inspect-hollowcut-project is present in parser and handler", async () => {
    const parsed = parseCliArgs(["inspect-hollowcut-project", "--input-file", PROJECT_FIXTURES[0] ?? ""]);
    const result = await handleCliCommand(parsed);

    expect(parsed.command).toBe("inspect-hollowcut-project");
    expect(parsed.catalog).toBe("hollowcut_project");
    expect(result.ok).toBe(true);
    expect(result.data).toHaveProperty("validation_result");
  });

  it("does not add project save, repair, or mutation CLI commands", () => {
    expect(parseCliArgs(["save-hollowcut-project"]).errors[0]?.code).toBe("unknown_command");
    expect(parseCliArgs(["repair-hollowcut-project"]).errors[0]?.code).toBe("unknown_command");
    expect(parseCliArgs(["mutate-hollowcut-project"]).errors[0]?.code).toBe("unknown_command");
  });

  it("does not add top-level UI, FFmpeg, or provider SDK dependencies", async () => {
    const packageJson = JSON.parse(await readFile("package.json", "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const topLevelDependencies = new Set([
      ...Object.keys(packageJson.dependencies ?? {}),
      ...Object.keys(packageJson.devDependencies ?? {})
    ]);

    for (const dependency of FORBIDDEN_TOP_LEVEL_DEPENDENCIES) {
      expect(topLevelDependencies.has(dependency)).toBe(false);
    }
  });

  it("V1 catalog remains exactly 13", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(13);
  });

  it("Media catalog remains exactly 4", () => {
    expect(MEDIA_HOLLOW_MANIFESTS).toHaveLength(4);
  });
});

import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { parseCliArgs } from "../../src/cli/index.js";
import {
  MEDIA_HOLLOW_MANIFESTS,
  V1_HOLLOW_MANIFESTS,
  timelineHollowManifests
} from "../../src/hollows/index.js";

const TIMELINE_FIXTURES = [
  "examples/hollowcut-timeline-demo/simple-slideshow-timeline.json",
  "examples/hollowcut-timeline-demo/layered-narration-timeline.json",
  "examples/hollowcut-timeline-demo/invalid-overlap-timeline.json",
  "examples/hollowcut-timeline-demo/invalid-asset-reference-timeline.json",
  "examples/hollowcut-timeline-demo/invalid-negative-duration-timeline.json"
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

const ALLOWED_TIMELINE_FOUNDATION_FILES = [
  "index.ts",
  "timelineOverlapHelpers.ts",
  "timelineReferenceHelpers.ts",
  "timelineTimingHelpers.ts",
  "timelineValidationHelpers.ts",
  "timelineValidationTypes.ts"
].sort();

const ALLOWED_TIMELINE_HOLLOW_FILES = [
  "index.ts",
  "timelineAssetReferenceCheckHollow.ts",
  "timelineDurationConsistencyHollow.ts",
  "timelineHollowManifests.ts",
  "timelineSchemaCheckHollow.ts",
  "timelineTemporalIntegrityCheckHollow.ts",
  "timelineTrackReferenceCheckHollow.ts"
].sort();

const FORBIDDEN_RUNTIME_PATHS = [
  "src/hollows/categories/caption",
  "src/hollows/categories/export",
  "src/hollowcut/ui",
  "src/hollowcut/captions",
  "src/hollowcut/media",
  "src/hollowcut/export",
  "src/hollowcut/reports",
  "src/ui",
  "src/web",
  "src/routes",
  "src/ffmpeg"
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

async function exists(path: string): Promise<boolean> {
  return stat(path)
    .then(() => true)
    .catch(() => false);
}

async function readJson(path: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(path, "utf8")) as Record<string, unknown>;
}

async function readText(path: string): Promise<string> {
  return readFile(path, "utf8");
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

describe("Timeline schema contracts", () => {
  it("docs/TIMELINE_SCHEMA_CONTRACTS.md exists", async () => {
    await expect(exists("docs/TIMELINE_SCHEMA_CONTRACTS.md")).resolves.toBe(true);
  });

  it("docs/TIMELINE_VALIDATION_HOLLOW_PLAN.md exists", async () => {
    await expect(exists("docs/TIMELINE_VALIDATION_HOLLOW_PLAN.md")).resolves.toBe(true);
  });

  it("docs/TIMELINE_SAFETY_POLICY.md exists", async () => {
    await expect(exists("docs/TIMELINE_SAFETY_POLICY.md")).resolves.toBe(true);
  });

  it("examples/hollowcut-timeline-demo/README.md exists", async () => {
    await expect(exists("examples/hollowcut-timeline-demo/README.md")).resolves.toBe(true);
  });

  it("timeline fixtures exist and parse as JSON", async () => {
    for (const fixture of TIMELINE_FIXTURES) {
      const parsed = await readJson(fixture);

      expect(parsed).toHaveProperty("schema_version", "1.0.0");
      expect(parsed).toHaveProperty("timeline");
    }
  });

  it("timeline docs state planning-only or runtime not implemented", async () => {
    const schema = await readText("docs/TIMELINE_SCHEMA_CONTRACTS.md");
    const plan = await readText("docs/TIMELINE_VALIDATION_HOLLOW_PLAN.md");
    const safety = await readText("docs/TIMELINE_SAFETY_POLICY.md");

    expect(schema).toContain("hollow.timeline.schema_check");
    expect(plan).toContain("Pass 27 implemented duration/reference timeline Hollows");
    expect(safety).toContain("Pass 27 adds duration consistency");
  });

  it("allows only the narrow Pass 25 timeline helper foundation folder", async () => {
    await expect(exists("src/hollowcut/timeline")).resolves.toBe(true);
    const entries = await readdir("src/hollowcut/timeline", { withFileTypes: true });

    expect(entries.every((entry) => entry.isFile())).toBe(true);
    expect(entries.map((entry) => entry.name).sort()).toEqual(ALLOWED_TIMELINE_FOUNDATION_FILES);
  });

  it("allows only the narrow Pass 26/27 timeline Hollow folder", async () => {
    await expect(exists("src/hollows/categories/timeline")).resolves.toBe(true);
    const entries = await readdir("src/hollows/categories/timeline", { withFileTypes: true });

    expect(entries.every((entry) => entry.isFile())).toBe(true);
    expect(entries.map((entry) => entry.name).sort()).toEqual(ALLOWED_TIMELINE_HOLLOW_FILES);
  });

  it("does not create timeline catalog, additional timeline Hollows, caption, export, UI, media, report, or FFmpeg runtime folders", async () => {
    for (const path of FORBIDDEN_RUNTIME_PATHS) {
      await expect(exists(path)).resolves.toBe(false);
    }
    await expect(exists("src/hollows/timelineHollowCatalog.ts")).resolves.toBe(false);
    await expect(exists("src/hollows/categories/timeline/timelineOverlapCheckHollow.ts")).resolves.toBe(false);
    await expect(exists("src/hollows/categories/timeline/timelineCaptionOverlapCheckHollow.ts")).resolves.toBe(false);
    await expect(exists("src/hollows/categories/timeline/timelineMediaFitHollow.ts")).resolves.toBe(false);
    await expect(exists("src/hollows/categories/timeline/timelineExportTargetAlignmentHollow.ts")).resolves.toBe(false);
  });

  it("does not add top-level UI, FFmpeg, or provider SDK dependencies", async () => {
    const packageJson = JSON.parse(await readText("package.json")) as {
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

  it("timeline Hollow manifest list contains only schema, duration, and reference Hollows", () => {
    expect(timelineHollowManifests.map((manifest) => manifest.hollow_id)).toEqual([
      "hollow.timeline.schema_check",
      "hollow.timeline.duration_consistency",
      "hollow.timeline.asset_reference_check",
      "hollow.timeline.track_reference_check",
      "hollow.timeline.temporal_integrity_check"
    ]);
  });

  it("V1 and Media catalogs contain no hollow.timeline IDs", () => {
    for (const manifest of [...V1_HOLLOW_MANIFESTS, ...MEDIA_HOLLOW_MANIFESTS]) {
      expect(manifest.hollow_id.startsWith("hollow.timeline.")).toBe(false);
    }
  });

  it("Hollowcut runtime remains limited to project validator and timeline helper foundation", async () => {
    const sourceFiles = await listSourceFiles("src/hollowcut");

    expect(sourceFiles.sort()).toEqual(ALLOWED_HOLLOWCUT_SOURCE_FILES);
  });

  it("inspect-hollowcut-project command may exist, but no timeline CLI command exists", () => {
    expect(parseCliArgs(["inspect-hollowcut-project", "--input-file", "project.json"]).errors).toEqual([]);
    expect(parseCliArgs(["inspect-hollowcut-timeline"]).errors[0]?.code).toBe("unknown_command");
    expect(parseCliArgs(["validate-timeline"]).errors[0]?.code).toBe("unknown_command");
    expect(parseCliArgs(["run-timeline-hollow"]).errors[0]?.code).toBe("unknown_command");
  });
});

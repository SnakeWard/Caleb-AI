import { readdir, stat, readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { MEDIA_HOLLOW_MANIFESTS, V1_HOLLOW_MANIFESTS } from "../../src/hollows/index.js";
import { parseCliArgs } from "../../src/cli/index.js";

const FORBIDDEN_RUNTIME_PATHS = [
  "src/ui",
  "src/web",
  "src/routes",
  "src/hollowcut/ui",
  "src/hollowcut/captions",
  "src/hollowcut/caption",
  "src/hollowcut/media",
  "src/hollowcut/export",
  "src/hollowcut/reports",
  "src/hollows/categories/caption",
  "src/hollows/categories/export"
];

const ALLOWED_HOLLOWCUT_SOURCE_FILES = new Set([
  "index.ts",
  "project/hollowcutProjectErrors.ts",
  "project/hollowcutProjectTypes.ts",
  "project/hollowcutProjectValidation.ts",
  "project/index.ts",
  "timeline/index.ts",
  "timeline/timelineOverlapHelpers.ts",
  "timeline/timelineReferenceHelpers.ts",
  "timeline/timelineTimingHelpers.ts",
  "timeline/timelineValidationHelpers.ts",
  "timeline/timelineValidationTypes.ts",
  "projectStateCheckHollow.ts",
  "projectTimelineCrossCheckHollow.ts",
  "exportReadinessCheckHollow.ts",
  "exportPlanPreviewHollow.ts"
]);

const ALLOWED_MEDIA_FOUNDATION_FILES = new Set([
  "audioDurationHollow.ts",
  "aspectRatioHollow.ts",
  "durationMetadataHelpers.ts",
  "imageDimensionsHollow.ts",
  "index.ts",
  "mediaHollowManifests.ts",
  "mediaMath.ts",
  "mediaMetadataTypes.ts",
  "mediaPathSafety.ts",
  "mediaTypeHelpers.ts",
  "videoDurationHollow.ts"
]);

const ALLOWED_TIMELINE_HOLLOW_FILES = new Set([
  "index.ts",
  "timelineAssetReferenceCheckHollow.ts",
  "timelineDurationConsistencyHollow.ts",
  "timelineHollowManifests.ts",
  "timelineSchemaCheckHollow.ts",
  "timelineTemporalIntegrityCheckHollow.ts",
  "timelineTrackReferenceCheckHollow.ts"
]);

const FORBIDDEN_MEDIA_RUNTIME_FILES = [
  "ffmpegExportHollow.ts",
  "exportReadinessHollow.ts",
  "browserMetadataBridge.ts",
  "adapterMetadataBridge.ts"
];

const FORBIDDEN_HOLLOW_PREFIXES = [
  "hollow.media.",
  "hollow.timeline.",
  "hollow.caption.",
  "hollow.export."
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

describe("Hollowcut boundary lock", () => {
  it("has the required Hollowcut planning and lock documents", async () => {
    await expect(exists("docs/HOLLOWCUT_VIDEO_STUDIO_INTEGRATION_PLAN.md")).resolves.toBe(true);
    await expect(exists("docs/HOLLOWCUT_CALEB_BOUNDARY.md")).resolves.toBe(true);
    await expect(exists("docs/HOLLOWCUT_BOUNDARY_LOCK.md")).resolves.toBe(true);
    await expect(exists("docs/HOLLOWCUT_IMPLEMENTATION_READINESS_CHECKLIST.md")).resolves.toBe(true);
    await expect(exists("docs/HOLLOWCUT_PROJECT_CONTRACT.md")).resolves.toBe(true);
    await expect(exists("docs/HOLLOWCUT_PROJECT_IMPLEMENTATION_PLAN.md")).resolves.toBe(true);
    await expect(exists("docs/HOLLOWCUT_PROJECT_CLI_DEMO.md")).resolves.toBe(true);
    await expect(exists("docs/TIMELINE_SCHEMA_CONTRACTS.md")).resolves.toBe(true);
    await expect(exists("docs/TIMELINE_VALIDATION_HOLLOW_PLAN.md")).resolves.toBe(true);
    await expect(exists("docs/TIMELINE_SAFETY_POLICY.md")).resolves.toBe(true);
  });

  it("has no Hollowcut UI, route, timeline, caption, export, media, or reports runtime folders", async () => {
    for (const path of FORBIDDEN_RUNTIME_PATHS) {
      await expect(exists(path)).resolves.toBe(false);
    }
  });

  it("allows only the narrow Hollowcut project validator runtime and timeline helper foundation", async () => {
    await expect(exists("src/hollowcut")).resolves.toBe(true);

    const files = await listFiles("src/hollowcut");
    expect(files.sort()).toEqual([...ALLOWED_HOLLOWCUT_SOURCE_FILES].sort());
    await expect(exists("src/hollowcut/timeline/timelineValidationTypes.ts")).resolves.toBe(true);
  });

  it("allows timeline contract docs, helper foundation, and schema/duration/reference Hollows only", async () => {
    await expect(exists("examples/hollowcut-timeline-demo/README.md")).resolves.toBe(true);
    await expect(exists("examples/hollowcut-timeline-demo/simple-slideshow-timeline.json")).resolves.toBe(true);
    await expect(exists("src/hollowcut/timeline/timelineTimingHelpers.ts")).resolves.toBe(true);
    await expect(exists("src/hollows/categories/timeline")).resolves.toBe(true);

    const entries = await readdir("src/hollows/categories/timeline", { withFileTypes: true });
    expect(entries.every((entry) => entry.isFile())).toBe(true);
    expect(entries.map((entry) => entry.name).sort()).toEqual([...ALLOWED_TIMELINE_HOLLOW_FILES].sort());
    await expect(exists("src/hollows/timelineHollowCatalog.ts")).resolves.toBe(false);
  });

  it("allows inspect-hollowcut-project but no project save, repair, or mutation commands", () => {
    expect(parseCliArgs(["inspect-hollowcut-project", "--input-file", "project.json"]).errors).toEqual([]);
    expect(parseCliArgs(["save-hollowcut-project"]).errors[0]?.code).toBe("unknown_command");
    expect(parseCliArgs(["repair-hollowcut-project"]).errors[0]?.code).toBe("unknown_command");
    expect(parseCliArgs(["mutate-hollowcut-project"]).errors[0]?.code).toBe("unknown_command");
  });

  it("allows only the narrow media foundation folder", async () => {
    await expect(exists("src/hollows/categories/media")).resolves.toBe(true);

    const entries = await readdir("src/hollows/categories/media", { withFileTypes: true });
    expect(entries.every((entry) => entry.isFile())).toBe(true);
    expect(entries.map((entry) => entry.name).sort()).toEqual([...ALLOWED_MEDIA_FOUNDATION_FILES].sort());
  });

  it("allows the separate media catalog adapter without adding Hollowcut runtime", async () => {
    await expect(exists("src/hollows/mediaHollowCatalog.ts")).resolves.toBe(true);
    expect(MEDIA_HOLLOW_MANIFESTS).toHaveLength(4);
    for (const manifest of MEDIA_HOLLOW_MANIFESTS) {
      expect(manifest.hollow_id.startsWith("hollow.media.")).toBe(true);
    }
  });

  it("has no unauthorized media Hollow runtime implementations", async () => {
    for (const fileName of FORBIDDEN_MEDIA_RUNTIME_FILES) {
      await expect(exists(`src/hollows/categories/media/${fileName}`)).resolves.toBe(false);
    }
  });

  it("has Hollowcut project examples while studio runtime remains absent", async () => {
    await expect(exists("examples/hollowcut-project-demo/README.md")).resolves.toBe(true);
    await expect(exists("examples/hollowcut-project-demo/minimal-project.json")).resolves.toBe(true);
    await expect(exists("examples/hollowcut-project-demo/slideshow-project.json")).resolves.toBe(true);
    await expect(exists("examples/hollowcut-project-demo/narrated-video-project.json")).resolves.toBe(true);
    await expect(exists("examples/hollowcut-project-demo/invalid-missing-project-id.json")).resolves.toBe(true);
    await expect(exists("examples/hollowcut-project-demo/invalid-unsafe-asset-path.json")).resolves.toBe(true);
    await expect(exists("examples/hollowcut-project-demo/invalid-missing-asset-reference.json")).resolves.toBe(true);
    await expect(exists("src/hollowcut/project/hollowcutProjectValidation.ts")).resolves.toBe(true);
  });

  it("keeps the V1 Hollow catalog locked to the 13 accepted production Hollows", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(13);
  });

  it("does not include future Hollowcut Hollow ID families in the V1 catalog", () => {
    for (const manifest of V1_HOLLOW_MANIFESTS) {
      for (const prefix of FORBIDDEN_HOLLOW_PREFIXES) {
        expect(manifest.hollow_id.startsWith(prefix)).toBe(false);
      }
    }
  });

  it("does not add top-level UI, FFmpeg, provider SDK, or orchestration dependencies", async () => {
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
});

async function listFiles(root: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true }).catch(() => []);
  const files: string[] = [];
  for (const entry of entries) {
    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...(await listFiles(`${root}/${entry.name}`, relativePath)));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }
  return files;
}

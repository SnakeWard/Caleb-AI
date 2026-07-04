import { readdir, stat, readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { MEDIA_HOLLOW_MANIFESTS, V1_HOLLOW_MANIFESTS } from "../../src/hollows/index.js";
import { parseCliArgs } from "../../src/cli/index.js";

const MEDIA_DOCS = [
  "docs/MEDIA_CLI_DEMO.md",
  "docs/MEDIA_METADATA_HOLLOW_CONTRACTS.md",
  "docs/MEDIA_METADATA_SAFETY_POLICY.md",
  "docs/MEDIA_METADATA_IMPLEMENTATION_PLAN.md"
];

const FORBIDDEN_RUNTIME_PATHS = [
  "src/hollowcut/ui",
  "src/hollowcut/captions",
  "src/hollowcut/caption",
  "src/hollowcut/media",
  "src/hollowcut/export",
  "src/hollowcut/reports",
  "src/media",
  "src/ffmpeg",
  "src/hollows/categories/caption",
  "src/hollows/categories/export"
];

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

const FORBIDDEN_MEDIA_RUNTIME_FILES = [
  "ffmpegExportHollow.ts",
  "exportReadinessHollow.ts",
  "browserMetadataBridge.ts",
  "adapterMetadataBridge.ts"
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

const FORBIDDEN_TOP_LEVEL_DEPENDENCIES = [
  "ffmpeg",
  "fluent-ffmpeg",
  "sharp",
  "music-metadata",
  "image-size",
  "exiftool",
  "react",
  "react-dom",
  "next",
  "three",
  "@react-three/fiber",
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

async function readText(path: string): Promise<string> {
  return readFile(path, "utf8");
}

describe("media metadata planning contracts", () => {
  it("creates the required media metadata planning documents", async () => {
    for (const path of MEDIA_DOCS) {
      await expect(exists(path)).resolves.toBe(true);
    }
    await expect(exists("docs/HOLLOWCUT_PROJECT_CLI_DEMO.md")).resolves.toBe(true);
    await expect(exists("docs/TIMELINE_SCHEMA_CONTRACTS.md")).resolves.toBe(true);
  });

  it("creates the separate media Hollow catalog adapter", async () => {
    await expect(exists("src/hollows/mediaHollowCatalog.ts")).resolves.toBe(true);
  });

  it("allows the narrow media foundation folder", async () => {
    await expect(exists("src/hollows/categories/media")).resolves.toBe(true);
  });

  it("media folder contains only allowed foundation files", async () => {
    const entries = await readdir("src/hollows/categories/media", { withFileTypes: true });
    const fileNames = entries.map((entry) => entry.name).sort();

    expect(entries.every((entry) => entry.isFile())).toBe(true);
    expect(fileNames).toEqual([...ALLOWED_MEDIA_FOUNDATION_FILES].sort());
  });

  it("media catalog contains exactly 4 media Hollows", () => {
    expect(MEDIA_HOLLOW_MANIFESTS).toHaveLength(4);
  });

  it("media catalog contains only hollow.media IDs", () => {
    for (const manifest of MEDIA_HOLLOW_MANIFESTS) {
      expect(manifest.hollow_id.startsWith("hollow.media.")).toBe(true);
    }
  });

  it("media folder does not contain unauthorized media Hollow implementation files", async () => {
    for (const fileName of FORBIDDEN_MEDIA_RUNTIME_FILES) {
      await expect(exists(`src/hollows/categories/media/${fileName}`)).resolves.toBe(false);
    }
  });

  it("media folder includes only the authorized media manifest file", async () => {
    await expect(exists("src/hollows/categories/media/mediaHollowManifests.ts")).resolves.toBe(true);
  });

  it("cross-links media metadata contracts from the Hollowcut integration plan", async () => {
    const text = await readText("docs/HOLLOWCUT_VIDEO_STUDIO_INTEGRATION_PLAN.md");

    expect(text).toContain("MEDIA_METADATA_HOLLOW_CONTRACTS.md");
    expect(text).toContain("MEDIA_METADATA_SAFETY_POLICY.md");
    expect(text).toContain("MEDIA_METADATA_IMPLEMENTATION_PLAN.md");
  });

  it("records the media metadata boundary in the Caleb/Hollowcut boundary document", async () => {
    const text = await readText("docs/HOLLOWCUT_CALEB_BOUNDARY.md");

    expect(text).toContain("Media metadata Hollows");
    expect(text).toContain("verified EvidencePackets");
  });

  it("records media metadata foundation status in the Hollowcut boundary lock", async () => {
    const text = (await readText("docs/HOLLOWCUT_BOUNDARY_LOCK.md")).toLowerCase();

    expect(text).toContain("media metadata contracts planned");
    expect(text).toContain("media foundation types/path safety allowed");
    expect(text).toContain("image dimensions media hollow exists");
    expect(text).toContain("aspect ratio media hollow exists");
    expect(text).toContain("provided-metadata audio/video duration hollows exist");
  });

  it("records media metadata readiness items before runtime implementation", async () => {
    const text = await readText("docs/HOLLOWCUT_IMPLEMENTATION_READINESS_CHECKLIST.md");

    expect(text).toContain("media metadata contracts reviewed");
    expect(text).toContain("media safety policy reviewed");
    expect(text).toContain("media implementation plan reviewed");
    expect(text).toContain("media path safety/types foundation complete");
    expect(text).toContain("first media metadata Hollow exists");
    expect(text).toContain("aspect ratio media metadata Hollow exists");
    expect(text).toContain("provided-metadata duration media Hollows exist");
    expect(text).toContain("no additional runtime media Hollow implementation before an authorized pass");
  });

  it("does not create Hollowcut UI, timeline, caption, export, media, report, or FFmpeg runtime folders", async () => {
    for (const path of FORBIDDEN_RUNTIME_PATHS) {
      await expect(exists(path)).resolves.toBe(false);
    }
  });

  it("allows only the narrow Hollowcut project validator runtime and timeline helper foundation", async () => {
    await expect(exists("src/hollowcut")).resolves.toBe(true);

    const files = await listFiles("src/hollowcut");
    expect(files.sort()).toEqual([...ALLOWED_HOLLOWCUT_SOURCE_FILES].sort());
  });

  it("does not add top-level media, UI, model provider, or FFmpeg dependencies", async () => {
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

  it("keeps the V1 Hollow catalog locked to exactly 12 production Hollows", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(12);
  });

  it("does not add hollow.media IDs to the V1 Hollow catalog", () => {
    for (const manifest of V1_HOLLOW_MANIFESTS) {
      expect(manifest.hollow_id.startsWith("hollow.media.")).toBe(false);
    }
  });

  it("CLI has explicit media command handling", () => {
    expect(parseCliArgs(["list-media-hollows"]).errors).toEqual([]);
    expect(parseCliArgs(["inspect-media-hollow", "--id", "hollow.media.aspect_ratio"]).errors).toEqual([]);
    expect(
      parseCliArgs([
        "run-media-hollow",
        "--id",
        "hollow.media.aspect_ratio",
        "--input-json",
        "{\"width\":1920,\"height\":1080}"
      ]).errors
    ).toEqual([]);
  });

  it("media CLI demo docs exist and preserve the catalog boundary", async () => {
    const text = await readText("docs/MEDIA_CLI_DEMO.md");

    expect(text).toContain("Media CLI -> Media Hollow Catalog");
    expect(text).toContain("V1 commands remain V1-only");
    expect(text).toContain("Media commands remain media-only");
  });

  it("existing V1 run-hollow command does not expose media Hollows", () => {
    expect(parseCliArgs(["run-hollow", "--id", "hollow.media.aspect_ratio", "--input-json", "{}"]).command).toBe(
      "run-hollow"
    );
    for (const manifest of V1_HOLLOW_MANIFESTS) {
      expect(manifest.hollow_id).not.toBe("hollow.media.aspect_ratio");
    }
  });

  it("keeps the existing Hollowcut boundary lock checks compatible", async () => {
    await expect(exists("docs/HOLLOWCUT_BOUNDARY_LOCK.md")).resolves.toBe(true);
    await expect(exists("src/hollowcut/project/hollowcutProjectValidation.ts")).resolves.toBe(true);
    await expect(exists("src/hollowcut/ui")).resolves.toBe(false);
    await expect(exists("src/hollows/categories/media/ffmpegExportHollow.ts")).resolves.toBe(false);
  });

  it("docs reflect that media catalog is separate and duration Hollows remain provided-metadata-only", async () => {
    const contracts = await readText("docs/MEDIA_METADATA_HOLLOW_CONTRACTS.md");
    const safety = await readText("docs/MEDIA_METADATA_SAFETY_POLICY.md");
    const plan = await readText("docs/MEDIA_METADATA_IMPLEMENTATION_PLAN.md");

    expect(contracts).toContain("separate media catalog");
    expect(contracts).toContain("hollow.media.image_dimensions");
    expect(contracts).toContain("hollow.media.aspect_ratio");
    expect(contracts).toContain("hollow.media.audio_duration");
    expect(contracts).toContain("hollow.media.video_duration");
    expect(contracts).toContain("provided-metadata-only");
    expect(safety).toContain("Image dimension inspection is allowed");
    expect(safety).toContain("Aspect ratio inspection is allowed");
    expect(safety).toContain("Duration Hollows currently validate provided metadata only");
    expect(plan).toContain("Pass 20 implemented the separate Media Hollow Catalog Adapter and CLI Boundary");
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

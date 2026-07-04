import { readdir, readFile, stat } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { parseCliArgs } from "../../src/cli/index.js";
import { MEDIA_HOLLOW_MANIFESTS, V1_HOLLOW_MANIFESTS } from "../../src/hollows/index.js";

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

const ALLOWED_MEDIA_FOUNDATION_FILES = [
  "src/hollows/categories/media/audioDurationHollow.ts",
  "src/hollows/categories/media/aspectRatioHollow.ts",
  "src/hollows/categories/media/durationMetadataHelpers.ts",
  "src/hollows/categories/media/imageDimensionsHollow.ts",
  "src/hollows/categories/media/index.ts",
  "src/hollows/categories/media/mediaHollowManifests.ts",
  "src/hollows/categories/media/mediaMath.ts",
  "src/hollows/categories/media/mediaMetadataTypes.ts",
  "src/hollows/categories/media/mediaPathSafety.ts",
  "src/hollows/categories/media/mediaTypeHelpers.ts",
  "src/hollows/categories/media/videoDurationHollow.ts"
].sort();

const ALLOWED_TIMELINE_HOLLOW_FILES = [
  "src/hollows/categories/timeline/index.ts",
  "src/hollows/categories/timeline/timelineAssetReferenceCheckHollow.ts",
  "src/hollows/categories/timeline/timelineDurationConsistencyHollow.ts",
  "src/hollows/categories/timeline/timelineHollowManifests.ts",
  "src/hollows/categories/timeline/timelineSchemaCheckHollow.ts",
  "src/hollows/categories/timeline/timelineTemporalIntegrityCheckHollow.ts",
  "src/hollows/categories/timeline/timelineTrackReferenceCheckHollow.ts"
].sort();

const ALLOWED_PROVIDER_SKELETON_FILES = [
  "src/providers/disabledByDefaultLiveHarnessScaffold.ts",
  "src/providers/dryRunReportTypes.ts",
  "src/providers/explicitOptInProviderGate.ts",
  "src/providers/index.ts",
  "src/providers/liveHarnessTypes.ts",
  "src/providers/livePrerequisitesTypes.ts",
  "src/providers/oneProviderAdapterDryRunCli.ts",
  "src/providers/oneProviderAdapterDryRunReport.ts",
  "src/providers/oneProviderAdapterLivePrerequisitesEvaluator.ts",
  "src/providers/oneProviderAdapterSkeleton.ts",
  "src/providers/providerAdapterTypes.ts"
].sort();

const FORBIDDEN_MEDIA_RUNTIME_FILES = [
  "src/hollows/categories/media/ffmpegExportHollow.ts",
  "src/hollows/categories/media/exportReadinessHollow.ts",
  "src/hollows/categories/media/browserMetadataBridge.ts",
  "src/hollows/categories/media/adapterMetadataBridge.ts"
];

async function pathExists(path: string): Promise<boolean> {
  return stat(path)
    .then(() => true)
    .catch(() => false);
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

describe("V1 phase boundary acceptance", () => {
  it("does not contain forbidden future-phase runtime module directories", async () => {
    await expect(pathExists("src/orchestration")).resolves.toBe(false);
    await expect(pathExists("src/roleRouter")).resolves.toBe(false);
    await expect(pathExists("src/modelApi")).resolves.toBe(false);
    await expect(pathExists("src/providers")).resolves.toBe(true);
    await expect(pathExists("src/ui")).resolves.toBe(false);
    await expect(pathExists("src/hollowcut")).resolves.toBe(true);
    await expect(pathExists("src/hollowcut/ui")).resolves.toBe(false);
    await expect(pathExists("src/hollowcut/timeline")).resolves.toBe(true);
    await expect(pathExists("src/hollowcut/captions")).resolves.toBe(false);
    await expect(pathExists("src/hollowcut/export")).resolves.toBe(false);
    await expect(pathExists("src/hollowcut/media")).resolves.toBe(false);
    await expect(pathExists("src/hollows/categories/media")).resolves.toBe(true);
    await expect(pathExists("src/hollows/categories/timeline")).resolves.toBe(true);
  });

  it("allows only Pass 23 Hollowcut project validator files plus Pass 25 timeline helpers", async () => {
    const sourceFiles = await listSourceFiles("src/hollowcut");

    expect(sourceFiles.sort()).toEqual(ALLOWED_HOLLOWCUT_SOURCE_FILES);
  });

  it("does not expose natural-language planning commands in the CLI", () => {
    expect(parseCliArgs(["plan", "make", "something"]).errors[0]?.code).toBe("unknown_command");
    expect(parseCliArgs(["run", "make", "something"]).errors[0]?.code).toBe("unknown_command");
  });

  it("allows inspect-hollowcut-project without allowing project mutation commands", () => {
    expect(parseCliArgs(["inspect-hollowcut-project", "--input-file", "project.json"]).errors).toEqual([]);
    expect(parseCliArgs(["save-hollowcut-project"]).errors[0]?.code).toBe("unknown_command");
    expect(parseCliArgs(["repair-hollowcut-project"]).errors[0]?.code).toBe("unknown_command");
    expect(parseCliArgs(["mutate-hollowcut-project"]).errors[0]?.code).toBe("unknown_command");
  });

  it("allows timeline docs and fixtures without allowing timeline CLI commands", async () => {
    await expect(pathExists("docs/TIMELINE_SCHEMA_CONTRACTS.md")).resolves.toBe(true);
    await expect(pathExists("examples/hollowcut-timeline-demo/simple-slideshow-timeline.json")).resolves.toBe(true);
    expect(parseCliArgs(["validate-timeline"]).errors[0]?.code).toBe("unknown_command");
    expect(parseCliArgs(["inspect-hollowcut-timeline"]).errors[0]?.code).toBe("unknown_command");
  });

  it("does not include shell, network, or media Hollows in the V1 runtime catalog", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(12);
    expect(MEDIA_HOLLOW_MANIFESTS).toHaveLength(4);

    for (const manifest of V1_HOLLOW_MANIFESTS) {
      expect(manifest.category).not.toBe("media");
      expect(manifest.category).not.toBe("timeline");
      expect(manifest.hollow_id.startsWith("hollow.timeline.")).toBe(false);
      expect(manifest.permissions).not.toContain("network");
      expect(manifest.permissions).not.toContain("shell_command");
      expect(manifest.network_access).toBe(false);
    }
  });

  it("keeps ThinkingEvent as a type-only future telemetry contract", async () => {
    const sourceFiles = await listSourceFiles("src");
    const thinkingRuntimeFiles = sourceFiles.filter((file) => file.includes("thinking") || file.includes("Thinking"));

    expect(thinkingRuntimeFiles).toEqual(["src/types/thinkingEvent.ts"]);
    await expect(readFile("src/types/thinkingEvent.ts", "utf8")).resolves.toContain("future UI telemetry contract only");
  });

  it("allows only Pass 19 media foundation plus image, aspect ratio, and provided duration source files", async () => {
    const sourceFiles = await listSourceFiles("src/hollows/categories/media");

    expect(sourceFiles.sort()).toEqual(ALLOWED_MEDIA_FOUNDATION_FILES);
    for (const file of FORBIDDEN_MEDIA_RUNTIME_FILES) {
      await expect(pathExists(file)).resolves.toBe(false);
    }
  });

  it("does not contain obvious runtime Hollowcut, provider, or media Hollow files", async () => {
    const sourceFiles = await listSourceFiles("src");
    const forbiddenRuntimeFiles = sourceFiles.filter((file) => {
      const lowered = file.toLowerCase();
      return (
        (lowered.includes("hollowcut") && !ALLOWED_HOLLOWCUT_SOURCE_FILES.includes(file) && file !== "src/hollows/hollowcutHollowCatalog.ts") ||
        (lowered.includes("/providers/") && !ALLOWED_PROVIDER_SKELETON_FILES.includes(file)) ||
        (lowered.includes("/media/") && !ALLOWED_MEDIA_FOUNDATION_FILES.includes(file)) ||
        (lowered.includes("/timeline/") &&
          !ALLOWED_TIMELINE_HOLLOW_FILES.includes(file) &&
          !ALLOWED_HOLLOWCUT_SOURCE_FILES.includes(file)) ||
        lowered.endsWith("/roleRouter.ts".toLowerCase()) ||
        lowered.endsWith("/modelApi.ts".toLowerCase())
      );
    });

    expect(forbiddenRuntimeFiles).toEqual([]);
  });
});

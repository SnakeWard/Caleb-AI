import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  aspectRatioImplementation,
  aspectRatioManifest,
  inspectAspectRatio,
  isV1SafeHollowManifest,
  validateHollowManifest
} from "../../../src/hollows/index.js";

describe("Aspect Ratio Hollow", () => {
  it("aspectRatioManifest validates", () => {
    expect(validateHollowManifest(aspectRatioManifest).valid).toBe(true);
  });

  it("aspectRatioManifest is V1-safe", () => {
    expect(isV1SafeHollowManifest(aspectRatioManifest)).toBe(true);
  });

  it("direct dimensions 1920x1080 classify as 16:9", async () => {
    const result = await inspectAspectRatio({ width: 1920, height: 1080 });

    expect(result.aspect_ratio_label).toBe("16:9");
    expect(result.aspect_ratio_reduced).toBe("16:9");
  });

  it("direct dimensions 1080x1920 classify as 9:16", async () => {
    const result = await inspectAspectRatio({ width: 1080, height: 1920 });

    expect(result.aspect_ratio_label).toBe("9:16");
    expect(result.orientation).toBe("portrait");
  });

  it("direct dimensions 1000x1000 classify as 1:1", async () => {
    const result = await inspectAspectRatio({ width: 1000, height: 1000 });

    expect(result.aspect_ratio_label).toBe("1:1");
    expect(result.orientation).toBe("square");
  });

  it("direct dimensions 800x1000 classify as 4:5", async () => {
    const result = await inspectAspectRatio({ width: 800, height: 1000 });

    expect(result.aspect_ratio_label).toBe("4:5");
  });

  it("direct dimensions 2100x900 classify as 21:9", async () => {
    const result = await inspectAspectRatio({ width: 2100, height: 900 });

    expect(result.aspect_ratio_label).toBe("21:9");
  });

  it("direct uncommon valid ratio classifies as custom", async () => {
    const result = await inspectAspectRatio({ width: 1234, height: 777 });

    expect(result.aspect_ratio_label).toBe("custom");
  });

  it("invalid dimensions return unsupported", async () => {
    const result = await inspectAspectRatio({ width: 0, height: 1080 });

    expect(result.dimension_source).toBe("unsupported");
    expect(result.warnings).toContain("dimensions_invalid");
  });

  it("expected_ratio 16:9 matches 1920x1080", async () => {
    const result = await inspectAspectRatio({ width: 1920, height: 1080, expected_ratio: "16:9" });

    expect(result.matches_expected_ratio).toBe(true);
    expect(result.ratio_difference).toBeLessThanOrEqual(0.01);
  });

  it("expected_ratio mismatch returns false and warning", async () => {
    const result = await inspectAspectRatio({ width: 1920, height: 1080, expected_ratio: "1:1" });

    expect(result.matches_expected_ratio).toBe(false);
    expect(result.warnings).toContain("expected_ratio_mismatch");
  });

  it("expected_ratio numeric decimal is supported", async () => {
    const result = await inspectAspectRatio({ width: 1920, height: 1080, expected_ratio: 16 / 9 });

    expect(result.matches_expected_ratio).toBe(true);
  });

  it("invalid expected_ratio returns warning and matches_expected_ratio null", async () => {
    const result = await inspectAspectRatio({ width: 1920, height: 1080, expected_ratio: "wide-ish" });

    expect(result.matches_expected_ratio).toBeNull();
    expect(result.warnings).toContain("unsupported_expected_ratio_format");
  });

  it("metadata_hint width/height works and includes metadata_hint_used warning", async () => {
    const result = await inspectAspectRatio({
      metadata_hint: { width: 1920, height: 1080, expected_ratio: "16:9" }
    });

    expect(result.dimension_source).toBe("provided_metadata");
    expect(result.metadata_confidence).toBe("medium");
    expect(result.warnings).toContain("metadata_hint_used");
  });

  it("metadata_hint invalid returns warning and unsupported if no other dimension source", async () => {
    const result = await inspectAspectRatio({ metadata_hint: { width: -1, height: 1080 } });

    expect(result.dimension_source).toBe("unsupported");
    expect(result.warnings).toContain("metadata_hint_invalid");
  });

  it("PNG file fixture works through header inspection", async () => {
    const fixture = await createFixture("image.png", createPngFixture(1920, 1080));
    const result = await inspectAspectRatio(createInput(fixture.root, "image.png"));

    expect(result.dimension_source).toBe("image_header");
    expect(result.aspect_ratio_label).toBe("16:9");
  });

  it("GIF file fixture works through header inspection", async () => {
    const fixture = await createFixture("image.gif", createGifFixture(320, 240));
    const result = await inspectAspectRatio(createInput(fixture.root, "image.gif"));

    expect(result.dimension_source).toBe("image_header");
    expect(result.width).toBe(320);
    expect(result.height).toBe(240);
  });

  it("JPEG file fixture works through header inspection", async () => {
    const fixture = await createFixture("image.jpg", createJpegFixture(640, 480));
    const result = await inspectAspectRatio(createInput(fixture.root, "image.jpg"));

    expect(result.dimension_source).toBe("image_header");
    expect(result.aspect_ratio_reduced).toBe("4:3");
  });

  it("unsafe traversal path fails clearly before file read", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "caleb-aspect-traversal-"));

    await expect(inspectAspectRatio(createInput(root, "../outside.png"))).rejects.toThrow("traversal");
  });

  it("absolute path fails clearly", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "caleb-aspect-absolute-"));

    await expect(inspectAspectRatio(createInput(root, path.resolve(root, "image.png")))).rejects.toThrow(
      "absolute"
    );
  });

  it("blocked .caleb path fails clearly", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "caleb-aspect-blocked-"));

    await expect(inspectAspectRatio(createInput(root, ".caleb/image.png"))).rejects.toThrow("blocked");
  });

  it("missing file fails clearly", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "caleb-aspect-missing-"));

    await expect(inspectAspectRatio(createInput(root, "missing.png"))).rejects.toThrow();
  });

  it("implementation returns result_units aspect_ratio", async () => {
    const result = await aspectRatioImplementation({
      input_payload: { width: 1920, height: 1080 },
      input_digest: "sha256:unprovided",
      context: {
        invocation_id: "inv_media_aspect",
        task_id: "task_media_aspect",
        run_id: "run_media_aspect",
        trace_id: "trace_media_aspect",
        hollow_id: aspectRatioManifest.hollow_id,
        hollow_version: aspectRatioManifest.hollow_version,
        started_at: new Date(0).toISOString(),
        caller: "test",
        requested_by: "test",
        approved_by: null,
        permissions: ["read_only"],
        execution_mode: "local_inspection"
      }
    });

    expect(result.result_units).toBe("aspect_ratio");
  });

  it("implementation does not mutate the file", async () => {
    const bytes = createPngFixture(48, 48);
    const fixture = await createFixture("image.png", bytes);
    const before = await readFile(fixture.path);

    await inspectAspectRatio(createInput(fixture.root, "image.png"));

    await expect(readFile(fixture.path)).resolves.toEqual(before);
  });
});

function createInput(projectRoot: string, relativePath: string) {
  return {
    project_root: projectRoot,
    relative_path: relativePath,
    expected_media_type: "image" as const
  };
}

async function createFixture(fileName: string, bytes: Buffer): Promise<{ root: string; path: string }> {
  const root = await mkdtemp(path.join(os.tmpdir(), "caleb-aspect-ratio-"));
  const filePath = path.join(root, fileName);
  await writeFile(filePath, bytes);
  return { root, path: filePath };
}

function createPngFixture(width: number, height: number): Buffer {
  const bytes = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(bytes, 0);
  bytes.writeUInt32BE(13, 8);
  bytes.write("IHDR", 12, "ascii");
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
}

function createGifFixture(width: number, height: number): Buffer {
  const bytes = Buffer.alloc(10);
  bytes.write("GIF89a", 0, "ascii");
  bytes.writeUInt16LE(width, 6);
  bytes.writeUInt16LE(height, 8);
  return bytes;
}

function createJpegFixture(width: number, height: number): Buffer {
  return Buffer.from([
    0xff,
    0xd8,
    0xff,
    0xe0,
    0x00,
    0x04,
    0x00,
    0x00,
    0xff,
    0xc0,
    0x00,
    0x11,
    0x08,
    (height >> 8) & 0xff,
    height & 0xff,
    (width >> 8) & 0xff,
    width & 0xff,
    0x03,
    0x01,
    0x11,
    0x00,
    0x02,
    0x11,
    0x00,
    0x03,
    0x11,
    0x00
  ]);
}

import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  imageDimensionsImplementation,
  imageDimensionsManifest,
  inspectImageDimensions,
  isV1SafeHollowManifest,
  validateHollowManifest
} from "../../../src/hollows/index.js";

describe("Image Dimensions Hollow", () => {
  it("imageDimensionsManifest validates", () => {
    expect(validateHollowManifest(imageDimensionsManifest).valid).toBe(true);
  });

  it("imageDimensionsManifest is V1-safe", () => {
    expect(isV1SafeHollowManifest(imageDimensionsManifest)).toBe(true);
  });

  it("PNG fixture returns width and height", async () => {
    const fixture = await createFixture("image.png", createPngFixture(1920, 1080));
    const result = await inspectImageDimensions(createInput(fixture.root, "image.png"));

    expect(result.width).toBe(1920);
    expect(result.height).toBe(1080);
  });

  it("PNG result includes media_type image", async () => {
    const fixture = await createFixture("image.png", createPngFixture(1920, 1080));
    const result = await inspectImageDimensions(createInput(fixture.root, "image.png"));

    expect(result.media_type).toBe("image");
  });

  it("PNG result includes inspection_method header_probe", async () => {
    const fixture = await createFixture("image.png", createPngFixture(1920, 1080));
    const result = await inspectImageDimensions(createInput(fixture.root, "image.png"));

    expect(result.inspection_method).toBe("header_probe");
  });

  it("PNG result includes metadata_confidence high", async () => {
    const fixture = await createFixture("image.png", createPngFixture(1920, 1080));
    const result = await inspectImageDimensions(createInput(fixture.root, "image.png"));

    expect(result.metadata_confidence).toBe("high");
  });

  it("PNG result includes orientation", async () => {
    const fixture = await createFixture("image.png", createPngFixture(1920, 1080));
    const result = await inspectImageDimensions(createInput(fixture.root, "image.png"));

    expect(result.orientation).toBe("landscape");
  });

  it("PNG result includes aspect_ratio_label", async () => {
    const fixture = await createFixture("image.png", createPngFixture(1920, 1080));
    const result = await inspectImageDimensions(createInput(fixture.root, "image.png"));

    expect(result.aspect_ratio_label).toBe("16:9");
  });

  it("GIF fixture returns width and height", async () => {
    const fixture = await createFixture("image.gif", createGifFixture(320, 240));
    const result = await inspectImageDimensions(createInput(fixture.root, "image.gif"));

    expect(result.width).toBe(320);
    expect(result.height).toBe(240);
    expect(result.format_hint).toBe("gif");
  });

  it("JPEG fixture returns width and height", async () => {
    const fixture = await createFixture("image.jpg", createJpegFixture(640, 480));
    const result = await inspectImageDimensions(createInput(fixture.root, "image.jpg"));

    expect(result.width).toBe(640);
    expect(result.height).toBe(480);
    expect(result.format_hint).toBe("jpeg");
  });

  it("unsupported extension without metadata_hint returns unsupported result with warning", async () => {
    const fixture = await createFixture("image.bin", Buffer.from("not an image"));
    const result = await inspectImageDimensions(createInput(fixture.root, "image.bin"));

    expect(result.inspection_method).toBe("unsupported");
    expect(result.metadata_confidence).toBe("unsupported");
    expect(result.warnings).toContain("unsupported_image_format");
  });

  it("unsupported extension with valid metadata_hint returns provided_metadata result with metadata_hint_used warning", async () => {
    const fixture = await createFixture("image.bin", Buffer.from("not an image"));
    const result = await inspectImageDimensions({
      ...createInput(fixture.root, "image.bin"),
      metadata_hint: { width: 100, height: 200, format_hint: "png" }
    });

    expect(result.inspection_method).toBe("provided_metadata");
    expect(result.metadata_confidence).toBe("medium");
    expect(result.warnings).toContain("metadata_hint_used");
  });

  it("invalid metadata_hint returns warning and unsupported if no header parse exists", async () => {
    const fixture = await createFixture("image.bin", Buffer.from("not an image"));
    const result = await inspectImageDimensions({
      ...createInput(fixture.root, "image.bin"),
      metadata_hint: { width: -1, height: 200, format_hint: "png" }
    });

    expect(result.inspection_method).toBe("unsupported");
    expect(result.warnings).toContain("metadata_hint_invalid");
  });

  it("expected_media_type mismatch warns clearly", async () => {
    const fixture = await createFixture("image.png", createPngFixture(10, 10));
    const result = await inspectImageDimensions({
      ...createInput(fixture.root, "image.png"),
      expected_media_type: "audio" as "image"
    });

    expect(result.warnings).toContain("expected_media_type_mismatch");
  });

  it("unsafe traversal path fails clearly before file read", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "caleb-image-traversal-"));

    await expect(inspectImageDimensions(createInput(root, "../outside.png"))).rejects.toThrow(
      "traversal"
    );
  });

  it("absolute path fails clearly", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "caleb-image-absolute-"));

    await expect(inspectImageDimensions(createInput(root, path.resolve(root, "image.png")))).rejects.toThrow(
      "absolute"
    );
  });

  it("blocked .caleb path fails clearly", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "caleb-image-blocked-"));

    await expect(inspectImageDimensions(createInput(root, ".caleb/image.png"))).rejects.toThrow(
      "blocked"
    );
  });

  it("missing file fails clearly", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "caleb-image-missing-"));

    await expect(inspectImageDimensions(createInput(root, "missing.png"))).rejects.toThrow();
  });

  it("implementation returns result_units pixels", async () => {
    const fixture = await createFixture("image.png", createPngFixture(12, 12));
    const result = await imageDimensionsImplementation({
      input_payload: createInput(fixture.root, "image.png"),
      input_digest: "sha256:unprovided",
      context: {
        invocation_id: "inv_media_direct",
        task_id: "task_media_direct",
        run_id: "run_media_direct",
        trace_id: "trace_media_direct",
        hollow_id: imageDimensionsManifest.hollow_id,
        hollow_version: imageDimensionsManifest.hollow_version,
        started_at: new Date(0).toISOString(),
        caller: "test",
        requested_by: "test",
        approved_by: null,
        permissions: ["read_only"],
        execution_mode: "local_inspection"
      }
    });

    expect(result.result_units).toBe("pixels");
  });

  it("implementation does not mutate the file", async () => {
    const bytes = createPngFixture(48, 48);
    const fixture = await createFixture("image.png", bytes);
    const before = await readFile(fixture.path);

    await inspectImageDimensions(createInput(fixture.root, "image.png"));

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
  const root = await mkdtemp(path.join(os.tmpdir(), "caleb-image-dimensions-"));
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

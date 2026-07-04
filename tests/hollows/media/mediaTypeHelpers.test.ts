import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  getMediaExtension,
  getMediaTypeFromExtension,
  isLikelyAudioExtension,
  isLikelyImageExtension,
  isLikelyVideoExtension
} from "../../../src/hollows/categories/media/index.js";

describe("media type helpers", () => {
  it("detects mp3 as audio", () => {
    expect(getMediaTypeFromExtension("song.mp3")).toBe("audio");
    expect(isLikelyAudioExtension(".mp3")).toBe(true);
  });

  it("detects wav as audio", () => {
    expect(getMediaTypeFromExtension("song.wav")).toBe("audio");
  });

  it("detects mp4 as video", () => {
    expect(getMediaTypeFromExtension("clip.mp4")).toBe("video");
    expect(isLikelyVideoExtension(".mp4")).toBe(true);
  });

  it("detects mov as video", () => {
    expect(getMediaTypeFromExtension("clip.mov")).toBe("video");
  });

  it("detects png as image", () => {
    expect(getMediaTypeFromExtension("image.png")).toBe("image");
    expect(isLikelyImageExtension(".png")).toBe(true);
  });

  it("detects jpg/jpeg as image", () => {
    expect(getMediaTypeFromExtension("photo.jpg")).toBe("image");
    expect(getMediaTypeFromExtension("photo.jpeg")).toBe("image");
  });

  it("extension detection is case-insensitive", () => {
    expect(getMediaExtension("MEDIA/CLIP.MP4")).toBe(".mp4");
    expect(getMediaTypeFromExtension("MEDIA/PHOTO.PNG")).toBe("image");
  });

  it("unknown extension returns unknown", () => {
    expect(getMediaTypeFromExtension("asset.custom")).toBe("unknown");
  });

  it("path without extension returns empty extension and unknown media type", () => {
    expect(getMediaExtension("asset")).toBe("");
    expect(getMediaTypeFromExtension("asset")).toBe("unknown");
  });

  it("helper does not read files", async () => {
    const projectRoot = await mkdtemp(path.join(os.tmpdir(), "caleb-media-type-"));
    const filePath = path.join(projectRoot, "clip.mp4");
    await writeFile(filePath, "not inspected", "utf8");

    expect(getMediaTypeFromExtension(filePath)).toBe("video");
    await expect(readFile(filePath, "utf8")).resolves.toBe("not inspected");
  });
});

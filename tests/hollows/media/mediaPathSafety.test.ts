import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  MediaPathSafetyError,
  assertSafeMediaRelativePath,
  isBlockedMediaRuntimePath,
  normalizeMediaRelativePath,
  resolveSafeMediaPath
} from "../../../src/hollows/categories/media/index.js";

describe("media path safety", () => {
  it("allows safe relative media path inside project root", async () => {
    const projectRoot = await mkdtemp(path.join(os.tmpdir(), "caleb-media-path-"));

    expect(assertSafeMediaRelativePath(projectRoot, "assets/audio/theme.mp3")).toBe(
      "assets/audio/theme.mp3"
    );
  });

  it("normalizes safe relative path", () => {
    expect(normalizeMediaRelativePath("assets\\video\\clip.mp4")).toBe("assets/video/clip.mp4");
  });

  it("rejects empty relative path", () => {
    expect(() => assertSafeMediaRelativePath("D:/project", " ")).toThrow(MediaPathSafetyError);
  });

  it("rejects absolute POSIX path", () => {
    expect(() => assertSafeMediaRelativePath("/project", "/assets/file.mp4")).toThrow(
      MediaPathSafetyError
    );
  });

  it("rejects Windows absolute path", () => {
    expect(() => assertSafeMediaRelativePath("D:/project", "C:/media/file.mp4")).toThrow(
      MediaPathSafetyError
    );
  });

  it("rejects path traversal with ../", () => {
    expect(() => assertSafeMediaRelativePath("D:/project", "../secret.mp4")).toThrow(
      MediaPathSafetyError
    );
  });

  it("rejects traversal that resolves outside project root", () => {
    expect(() => assertSafeMediaRelativePath("D:/project", "assets/../../secret.mp4")).toThrow(
      MediaPathSafetyError
    );
  });

  it("rejects node_modules", () => {
    expect(isBlockedMediaRuntimePath("node_modules/package/file.mp4")).toBe(true);
    expect(() => assertSafeMediaRelativePath("D:/project", "node_modules/file.mp4")).toThrow(
      MediaPathSafetyError
    );
  });

  it("rejects dist", () => {
    expect(() => assertSafeMediaRelativePath("D:/project", "dist/output.mp4")).toThrow(
      MediaPathSafetyError
    );
  });

  it("rejects .git", () => {
    expect(() => assertSafeMediaRelativePath("D:/project", ".git/config")).toThrow(
      MediaPathSafetyError
    );
  });

  it("rejects .caleb", () => {
    expect(() => assertSafeMediaRelativePath("D:/project", ".caleb/snapshots/file.mp4")).toThrow(
      MediaPathSafetyError
    );
  });

  it("rejects UNC-like path if detectable", () => {
    expect(() => assertSafeMediaRelativePath("D:/project", "\\\\server\\share\\file.mp4")).toThrow(
      MediaPathSafetyError
    );
  });

  it("resolved path stays inside project root", async () => {
    const projectRoot = await mkdtemp(path.join(os.tmpdir(), "caleb-media-resolve-"));
    const resolved = resolveSafeMediaPath(projectRoot, "assets/image.png");
    const relative = path.relative(projectRoot, resolved);

    expect(relative.startsWith("..")).toBe(false);
    expect(path.isAbsolute(relative)).toBe(false);
  });

  it("does not require file to exist", async () => {
    const projectRoot = await mkdtemp(path.join(os.tmpdir(), "caleb-media-missing-"));

    expect(resolveSafeMediaPath(projectRoot, "missing/video.mp4")).toBe(
      path.resolve(projectRoot, "missing/video.mp4")
    );
  });

  it("does not read or write files", async () => {
    const projectRoot = await mkdtemp(path.join(os.tmpdir(), "caleb-media-no-io-"));
    const sentinel = path.join(projectRoot, "sentinel.txt");
    await writeFile(sentinel, "unchanged", "utf8");

    resolveSafeMediaPath(projectRoot, "assets/future.mp4");

    await expect(readFile(sentinel, "utf8")).resolves.toBe("unchanged");
  });
});

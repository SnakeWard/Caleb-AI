import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  assertSafeRelativePath,
  isBlockedRuntimePath,
  resolveSafeProjectPath
} from "../../../src/hollows/categories/provenance/index.js";

describe("provenance path safety", () => {
  it("allows safe relative file path inside project root", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "caleb-path-safe-"));

    expect(assertSafeRelativePath(root, "src/file.txt")).toBe(path.join(root, "src", "file.txt"));
  });

  it("blocks ../ traversal", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "caleb-path-safe-"));

    expect(() => assertSafeRelativePath(root, "../outside.txt")).toThrow("outside");
  });

  it("blocks absolute relative_path", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "caleb-path-safe-"));

    expect(() => assertSafeRelativePath(root, path.join(root, "file.txt"))).toThrow("absolute");
  });

  it("blocks node_modules", () => {
    expect(isBlockedRuntimePath("node_modules/pkg/index.js")).toBe(true);
  });

  it("blocks dist", () => {
    expect(isBlockedRuntimePath("dist/index.js")).toBe(true);
  });

  it("blocks .git", () => {
    expect(isBlockedRuntimePath(".git/config")).toBe(true);
  });

  it("blocks .caleb", () => {
    expect(isBlockedRuntimePath(".caleb/ledger/ledger.jsonl")).toBe(true);
  });

  it("resolved path remains inside project root", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "caleb-path-safe-"));
    const resolved = resolveSafeProjectPath(root, "docs/source.md");

    expect(path.relative(root, resolved).startsWith("..")).toBe(false);
  });
});

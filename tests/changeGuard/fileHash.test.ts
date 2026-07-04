import { mkdtemp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { describe, expect, it } from "vitest";

import { hashFileSha256, hashStringSha256 } from "../../src/changeGuard/index.js";

describe("file hash helpers", () => {
  it("hashStringSha256 returns sha256:<hex>", () => {
    expect(hashStringSha256("Caleb")).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it("identical string gives identical hash", () => {
    expect(hashStringSha256("same")).toBe(hashStringSha256("same"));
  });

  it("different string gives different hash", () => {
    expect(hashStringSha256("one")).not.toBe(hashStringSha256("two"));
  });

  it("hashFileSha256 hashes a temp file", async () => {
    const dir = await mkdtemp(join(tmpdir(), "caleb-hash-"));
    const file = join(dir, "file.txt");
    await writeFile(file, "Caleb", "utf8");

    expect(await hashFileSha256(file)).toBe(hashStringSha256("Caleb"));
  });
});

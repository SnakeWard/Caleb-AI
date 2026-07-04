import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { ArtifactHash } from "../types/common.js";

export function hashStringSha256(content: string | Buffer): string {
  return `sha256:${createHash("sha256").update(content).digest("hex")}`;
}

export async function hashFileSha256(filePath: string): Promise<string> {
  return hashStringSha256(await readFile(filePath));
}

export async function createFileHashRecord(
  projectRoot: string,
  relativePath: string
): Promise<ArtifactHash> {
  const fullPath = resolve(projectRoot, relativePath);
  return {
    path: relativePath.replaceAll("\\", "/"),
    hash: await hashFileSha256(fullPath),
    algorithm: "sha256"
  };
}

import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import type { HollowImplementation } from "../../runnerTypes.js";
import { fileHashManifest as manifest } from "./provenanceHollowManifests.js";
import { assertSafeRelativePath } from "./provenancePathSafety.js";
import type { FileHashInput, FileHashResult } from "./provenanceHollowTypes.js";

export const fileHashManifest = manifest;

export async function hashExplicitFile(input: FileHashInput): Promise<FileHashResult> {
  const safePath = assertSafeRelativePath(input.project_root, input.relative_path);
  const fileStat = await stat(safePath);

  if (!fileStat.isFile()) {
    throw new Error("File Hash Hollow can hash files only, not directories.");
  }

  const bytes = await readFile(safePath);
  const digest = `sha256:${createHash("sha256").update(bytes).digest("hex")}`;

  return {
    relative_path: input.relative_path,
    size_bytes: fileStat.size,
    sha256: digest,
    digest
  };
}

export const fileHashImplementation: HollowImplementation = async ({ input_payload }) => {
  const input = parseFileHashInput(input_payload);
  const result = await hashExplicitFile(input);

  return {
    result,
    result_units: "sha256",
    checks: [
      { check_id: "project_root_present", label: "Project Root Present", status: "completed", severity: "info" },
      { check_id: "relative_path_present", label: "Relative Path Present", status: "completed", severity: "info" },
      { check_id: "path_safety_passed", label: "Path Safety Passed", status: "completed", severity: "info" },
      { check_id: "file_exists", label: "File Exists", status: "completed", severity: "info" },
      { check_id: "file_hash_completed", label: "File Hash Completed", status: "completed", severity: "info" }
    ],
    warnings: [],
    artifact_hashes: [{ path: input.relative_path, hash: result.digest, algorithm: "sha256" }],
    confidence_level: "deterministic_file_hash"
  };
};

function parseFileHashInput(input: unknown): FileHashInput {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new Error("File Hash Hollow requires an object input payload.");
  }

  const candidate = input as { project_root?: unknown; relative_path?: unknown };
  if (typeof candidate.project_root !== "string") {
    throw new Error("File Hash Hollow requires input_payload.project_root as a string.");
  }
  if (typeof candidate.relative_path !== "string") {
    throw new Error("File Hash Hollow requires input_payload.relative_path as a string.");
  }

  return {
    project_root: candidate.project_root,
    relative_path: candidate.relative_path
  };
}

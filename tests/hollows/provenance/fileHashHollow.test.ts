import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { HollowRegistry, HollowRunner } from "../../../src/hollows/index.js";
import {
  fileHashImplementation,
  fileHashManifest,
  hashExplicitFile
} from "../../../src/hollows/categories/provenance/index.js";

describe("File Hash Hollow", () => {
  it("hashes a temp file with sha256:<hex>", async () => {
    const root = await createTempProject({ "src/file.txt": "Caleb" });
    const result = await hashExplicitFile({ project_root: root, relative_path: "src/file.txt" });

    expect(result.digest).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it("same file content gives same digest", async () => {
    const root = await createTempProject({
      "a.txt": "same",
      "b.txt": "same"
    });

    const a = await hashExplicitFile({ project_root: root, relative_path: "a.txt" });
    const b = await hashExplicitFile({ project_root: root, relative_path: "b.txt" });

    expect(a.digest).toBe(b.digest);
  });

  it("different file content gives different digest", async () => {
    const root = await createTempProject({
      "a.txt": "one",
      "b.txt": "two"
    });

    const a = await hashExplicitFile({ project_root: root, relative_path: "a.txt" });
    const b = await hashExplicitFile({ project_root: root, relative_path: "b.txt" });

    expect(a.digest).not.toBe(b.digest);
  });

  it("returns file size", async () => {
    const root = await createTempProject({ "a.txt": "12345" });

    expect((await hashExplicitFile({ project_root: root, relative_path: "a.txt" })).size_bytes).toBe(5);
  });

  it("blocks path traversal", async () => {
    const root = await createTempProject({ "a.txt": "safe" });

    await expect(hashExplicitFile({ project_root: root, relative_path: "../a.txt" })).rejects.toThrow(
      "outside"
    );
  });

  it("blocks directory hashing", async () => {
    const root = await createTempProject({ "src/a.txt": "safe" });

    await expect(hashExplicitFile({ project_root: root, relative_path: "src" })).rejects.toThrow(
      "files only"
    );
  });

  it("blocks node_modules path", async () => {
    const root = await createTempProject({ "node_modules/pkg/index.js": "blocked" });

    await expect(
      hashExplicitFile({ project_root: root, relative_path: "node_modules/pkg/index.js" })
    ).rejects.toThrow("blocked runtime");
  });

  it("returns result_units sha256", async () => {
    const root = await createTempProject({ "a.txt": "hash me" });
    const record = await runFileHash({ project_root: root, relative_path: "a.txt" });

    expect(record.result_units).toBe("sha256");
  });

  it("malformed input fails clearly", async () => {
    const record = await runFileHash({ relative_path: "a.txt" });

    expect(record.status).toBe("failed");
    expect(record.errors[0]?.message).toContain("project_root");
  });
});

async function runFileHash(input_payload: object) {
  const registry = new HollowRegistry([fileHashManifest]);
  const runner = new HollowRunner(registry, {
    [fileHashManifest.hollow_id]: fileHashImplementation
  });

  return await runner.run({
    hollow_id: fileHashManifest.hollow_id,
    input_payload: input_payload as never,
    permissions: ["read_only"],
    task_id: "task_file_hash",
    run_id: "run_file_hash",
    trace_id: "trace_file_hash",
    invocation_id: "invocation_file_hash"
  });
}

async function createTempProject(files: Record<string, string>): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "caleb-file-hash-"));
  for (const [relativePath, content] of Object.entries(files)) {
    const fullPath = path.join(root, relativePath);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content, "utf8");
  }
  return root;
}

import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { HOLLOWCUT_HOLLOW_MANIFESTS } from "../../src/hollows/hollowcutHollowCatalog.js";
import { V1_HOLLOW_MANIFESTS } from "../../src/hollows/v1HollowCatalog.js";

const docPath = "docs/RUNTIME_STORAGE_PLANNING_BOUNDARY.md";
const exactVerdict = `Runtime/Storage Planning Boundary: Accepted
Status: Planning boundary locked; no runtime storage implemented
Next phase: Runtime storage type contracts or mocked single_pass model boundary`;

const expectedPackageJsonHash = "ac106ff187dd617ad011a1557f81a207f0efa39c77b7214547a25d31fa5028e2";

async function readSourceFiles(dir: string): Promise<readonly string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await readSourceFiles(path));
    } else if (entry.isFile() && path.endsWith(".ts")) {
      files.push(path);
    }
  }

  return files;
}

describe("Runtime/Storage Planning Boundary acceptance lock", () => {
  it("exists and contains the exact acceptance verdict", async () => {
    const doc = await readFile(docPath, "utf8");

    expect(doc).toContain(exactVerdict);
  });

  it("locks required trust boundary statements", async () => {
    const doc = await readFile(docPath, "utf8");

    for (const statement of [
      "Storage does not increase trust.",
      "Persistence is not verification.",
      "Retrieval is not trust promotion.",
      "Storage must never become a shortcut around VRP.",
      "Raw model output starts at T0.",
      "Raw role artifact output starts at T0.",
      "Schema-valid role artifact may be T1 only.",
      "Verified deterministic Hollow evidence may reach T2 through VRP."
    ]) {
      expect(doc).toContain(statement);
    }
  });

  it("locks phase exclusions", async () => {
    const doc = await readFile(docPath, "utf8");

    for (const exclusion of [
      "No runtime storage is implemented in this pass.",
      "No model API calls are implemented in this pass.",
      "No live role rotation runtime is implemented in this pass."
    ]) {
      expect(doc).toContain(exclusion);
    }
  });

  it("lists storage non-goals", async () => {
    const doc = await readFile(docPath, "utf8");

    for (const nonGoal of [
      "no SQLite",
      "no Postgres",
      "no cloud persistence",
      "no model API transcript store",
      "no vector database",
      "no semantic memory",
      "no UI trace database",
      "no full role runtime",
      "no provider SDK persistence",
      "no Hollowcut render/export storage"
    ]) {
      expect(doc).toContain(nonGoal);
    }
  });

  it("lists the future implementation sequence", async () => {
    const doc = await readFile(docPath, "utf8");

    for (const step of [
      "1. Runtime/Storage Planning Boundary.",
      "2. Runtime storage type contracts.",
      "3. In-memory artifact store prototype.",
      "4. Mocked single_pass model adapter.",
      "5. Ledgered model invocation record.",
      "6. Persistent artifact store.",
      "7. Full role rotation runtime.",
      "8. UI/Thinking Mode trace display."
    ]) {
      expect(doc).toContain(step);
    }
  });

  it("keeps package.json unchanged from the R8 pre-change baseline", async () => {
    const packageJson = await readFile("package.json", "utf8");
    const hash = createHash("sha256").update(packageJson).digest("hex");

    expect(hash).toBe(expectedPackageJsonHash);
  });

  it("does not introduce provider SDK imports in src", async () => {
    const sourceFiles = await readSourceFiles("src");

    for (const file of sourceFiles) {
      const source = await readFile(file, "utf8");
      expect(source, file).not.toMatch(/from\s+["'][^"']*(openai|@anthropic-ai\/sdk|@google\/generative-ai|@google\/genai|gemini|grok|model-api|modelApi)[^"']*["']/i);
      expect(source, file).not.toMatch(/require\(["'][^"']*(openai|@anthropic-ai\/sdk|@google\/generative-ai|@google\/genai|gemini|grok|model-api|modelApi)[^"']*["']\)/i);
    }
  });

  it("keeps V1 Hollow catalog count locked at 14", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(14);
  });

  it("keeps Hollowcut catalog count locked at 9", () => {
    expect(HOLLOWCUT_HOLLOW_MANIFESTS).toHaveLength(9);
  });
});

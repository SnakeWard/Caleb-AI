import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it, vi } from "vitest";

vi.setConfig({ testTimeout: 30000 });

import {
  collectGitChangeset,
  gitStatusToOperation,
  normalizeRepoPath
} from "../../src/audit/gitChangesetCollector.js";

describe("gitChangesetCollector", () => {
  it("maps modified tracked file to modify", async () => {
    await withTempRepo(async (repo) => {
      await writeFile(join(repo, "alpha.txt"), "one\n", "utf8");
      git(repo, ["add", "alpha.txt"]);
      git(repo, ["commit", "-m", "init"]);
      await writeFile(join(repo, "alpha.txt"), "two\n", "utf8");

      const result = collectGitChangeset({ cwd: repo, base_ref: "HEAD" });
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }
      expect(result.entries).toEqual([{ operation: "modify", path: "alpha.txt" }]);
    });
  });

  it("maps added tracked file to create", async () => {
    await withTempRepo(async (repo) => {
      await writeFile(join(repo, "alpha.txt"), "one\n", "utf8");
      git(repo, ["add", "alpha.txt"]);
      git(repo, ["commit", "-m", "init"]);
      await writeFile(join(repo, "beta.txt"), "beta\n", "utf8");
      git(repo, ["add", "beta.txt"]);

      const result = collectGitChangeset({ cwd: repo, base_ref: "HEAD" });
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }
      expect(result.entries).toEqual([{ operation: "create", path: "beta.txt" }]);
    });
  });

  it("maps deleted tracked file to delete", async () => {
    await withTempRepo(async (repo) => {
      await writeFile(join(repo, "alpha.txt"), "one\n", "utf8");
      git(repo, ["add", "alpha.txt"]);
      git(repo, ["commit", "-m", "init"]);
      git(repo, ["rm", "alpha.txt"]);

      const result = collectGitChangeset({ cwd: repo, base_ref: "HEAD" });
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }
      expect(result.entries).toEqual([{ operation: "delete", path: "alpha.txt" }]);
    });
  });

  it("maps untracked file to create", async () => {
    await withTempRepo(async (repo) => {
      await writeFile(join(repo, "alpha.txt"), "one\n", "utf8");
      git(repo, ["add", "alpha.txt"]);
      git(repo, ["commit", "-m", "init"]);
      await writeFile(join(repo, "untracked.txt"), "x\n", "utf8");

      const result = collectGitChangeset({ cwd: repo, base_ref: "HEAD" });
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }
      expect(result.entries).toEqual([{ operation: "create", path: "untracked.txt" }]);
      expect(result.untracked_changes).toBe(1);
    });
  });

  it("maps rename to delete old and create new", async () => {
    await withTempRepo(async (repo) => {
      await writeFile(join(repo, "old.txt"), "one\n", "utf8");
      git(repo, ["add", "old.txt"]);
      git(repo, ["commit", "-m", "init"]);
      git(repo, ["mv", "old.txt", "new.txt"]);

      const result = collectGitChangeset({ cwd: repo, base_ref: "HEAD" });
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }
      expect(result.entries).toEqual([
        { operation: "create", path: "new.txt" },
        { operation: "delete", path: "old.txt" }
      ]);
    });
  });

  it("normalizes paths to forward slash and sorts deterministically", async () => {
    await withTempRepo(async (repo) => {
      await mkdir(join(repo, "nested"), { recursive: true });
      await writeFile(join(repo, "nested", "alpha.txt"), "a\n", "utf8");
      await writeFile(join(repo, "z.txt"), "z\n", "utf8");
      git(repo, ["add", "."]);
      git(repo, ["commit", "-m", "init"]);
      await writeFile(join(repo, "nested", "alpha.txt"), "aa\n", "utf8");
      await writeFile(join(repo, "m.txt"), "m\n", "utf8");

      const result = collectGitChangeset({ cwd: repo, base_ref: "HEAD" });
      expect(result.ok).toBe(true);
      if (!result.ok) {
        return;
      }
      expect(result.entries.map((entry) => entry.path).every((path) => !path.includes("\\"))).toBe(true);
      expect(result.entries.map((entry) => entry.path)).toEqual(["m.txt", "nested/alpha.txt"]);
    });
  });

  it("deduplicates identical operation/path pairs", () => {
    expect(normalizeRepoPath("src/a.ts")).toBe("src/a.ts");
    expect(normalizeRepoPath(".\\src\\a.ts")).toBeNull();
    expect(normalizeRepoPath("../escape.ts")).toBeNull();
    expect(normalizeRepoPath("./local.ts")).toBeNull();
  });

  it("returns AUD2_INVALID_BASE_REF for unknown base ref", async () => {
    await withTempRepo(async (repo) => {
      const result = collectGitChangeset({ cwd: repo, base_ref: "does-not-exist-ref" });
      expect(result.ok).toBe(false);
      if (result.ok) {
        return;
      }
      expect(result.code).toBe("AUD2_INVALID_BASE_REF");
    });
  });

  it("returns unsupported for unknown git status codes", () => {
    expect(gitStatusToOperation("X")).toBeNull();
  });

  it("returns AUD2_NOT_A_GIT_REPOSITORY outside a repo", async () => {
    const dir = await mkdtemp(join(tmpdir(), "caleb-aud2-norepo-"));
    try {
      const result = collectGitChangeset({ cwd: dir, base_ref: "HEAD" });
      expect(result.ok).toBe(false);
      if (result.ok) {
        return;
      }
      expect(result.code).toBe("AUD2_NOT_A_GIT_REPOSITORY");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

async function withTempRepo(run: (repo: string) => Promise<void>): Promise<void> {
  const repo = await mkdtemp(join(tmpdir(), "caleb-aud2-git-"));
  git(repo, ["init"]);
  git(repo, ["config", "user.email", "aud2@test.local"]);
  git(repo, ["config", "user.name", "AUD2 Test"]);
  try {
    await run(repo);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
}

function git(repo: string, args: string[]): void {
  execFileSync("git", ["-C", repo, ...args], { stdio: "ignore" });
}
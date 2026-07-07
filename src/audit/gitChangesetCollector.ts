import { execFileSync } from "node:child_process";

import type { GitChangesetEntry, GitChangesetOperation } from "./passComplianceAuditTypes.js";

export interface CollectGitChangesetOptions {
  readonly cwd?: string;
  readonly base_ref?: string;
}

export interface CollectGitChangesetSuccess {
  readonly ok: true;
  readonly base_ref: string;
  readonly head_ref: "working_tree";
  readonly entries: readonly GitChangesetEntry[];
  readonly tracked_changes: number;
  readonly untracked_changes: number;
}

export interface CollectGitChangesetFailure {
  readonly ok: false;
  readonly code: string;
  readonly message: string;
  readonly path?: string;
}

export type CollectGitChangesetResult = CollectGitChangesetSuccess | CollectGitChangesetFailure;

const OPERATION_ORDER: Record<GitChangesetOperation, number> = {
  create: 0,
  delete: 1,
  modify: 2
};

export function collectGitChangeset(options: CollectGitChangesetOptions = {}): CollectGitChangesetResult {
  const cwd = options.cwd ?? process.cwd();
  const base_ref = options.base_ref ?? "HEAD";

  const gitCheck = runGit(["--version"], cwd);
  if (!gitCheck.ok) {
    return { ok: false, code: "AUD2_GIT_UNAVAILABLE", message: gitCheck.message };
  }

  const insideWorkTree = runGit(["rev-parse", "--is-inside-work-tree"], cwd);
  if (!insideWorkTree.ok || insideWorkTree.stdout.trim() !== "true") {
    return { ok: false, code: "AUD2_NOT_A_GIT_REPOSITORY", message: "Current directory is not inside a git work tree." };
  }

  const baseRefCheck = runGit(["rev-parse", "--verify", `${base_ref}^{commit}`], cwd);
  if (!baseRefCheck.ok) {
    return {
      ok: false,
      code: "AUD2_INVALID_BASE_REF",
      message: `Invalid base ref: ${base_ref}.`
    };
  }

  const diff = runGit(["diff", "--name-status", "-z", "--find-renames", base_ref], cwd);
  if (!diff.ok) {
    return { ok: false, code: "AUD2_GIT_COLLECTION_FAILED", message: diff.message };
  }

  const entries: GitChangesetEntry[] = [];
  const parseResult = parseNameStatusZ(diff.stdout, entries);
  if (!parseResult.ok) {
    return parseResult;
  }

  const untracked = runGit(["ls-files", "--others", "--exclude-standard", "-z"], cwd);
  if (!untracked.ok) {
    return { ok: false, code: "AUD2_GIT_COLLECTION_FAILED", message: untracked.message };
  }

  let untracked_count = 0;
  for (const rawPath of splitNullTerminated(untracked.stdout)) {
    const path = normalizeRepoPath(rawPath);
    if (path === null) {
      return {
        ok: false,
        code: "AUD2_INVALID_COLLECTED_PATH",
        message: `Collected path failed normalization: ${rawPath}`,
        path: rawPath
      };
    }
    entries.push({ operation: "create", path });
    untracked_count += 1;
  }

  const deduped = dedupeEntries(entries);
  const sorted = sortEntries(deduped);
  const tracked_changes = sorted.length - untracked_count;

  return {
    ok: true,
    base_ref,
    head_ref: "working_tree",
    entries: sorted,
    tracked_changes,
    untracked_changes: untracked_count
  };
}

function parseNameStatusZ(
  stdout: string,
  entries: GitChangesetEntry[]
): CollectGitChangesetFailure | { ok: true } {
  const tokens = splitNullTerminated(stdout);
  let index = 0;

  while (index < tokens.length) {
    const statusToken = tokens[index];
    if (statusToken === undefined || statusToken.length === 0) {
      index += 1;
      continue;
    }

    const status = statusToken.charAt(0);

    if (status === "R" || status === "C") {
      const oldPathRaw = tokens[index + 1];
      const newPathRaw = tokens[index + 2];
      index += 3;
      if (oldPathRaw === undefined || newPathRaw === undefined) {
        return {
          ok: false,
          code: "AUD2_GIT_COLLECTION_FAILED",
          message: "Malformed rename/copy record from git diff."
        };
      }
      const oldPath = normalizeRepoPath(oldPathRaw);
      const newPath = normalizeRepoPath(newPathRaw);
      if (oldPath === null || newPath === null) {
        return {
          ok: false,
          code: "AUD2_INVALID_COLLECTED_PATH",
          message: "Collected rename path failed normalization."
        };
      }
      entries.push({ operation: "delete", path: oldPath });
      entries.push({ operation: "create", path: newPath });
      continue;
    }

    const pathRaw = tokens[index + 1];
    index += 2;
    if (pathRaw === undefined) {
      return {
        ok: false,
        code: "AUD2_GIT_COLLECTION_FAILED",
        message: "Malformed git diff name-status record."
      };
    }

    const path = normalizeRepoPath(pathRaw);
    if (path === null) {
      return {
        ok: false,
        code: "AUD2_INVALID_COLLECTED_PATH",
        message: `Collected path failed normalization: ${pathRaw}`,
        path: pathRaw
      };
    }

    const mapped = mapGitStatus(status);
    if (mapped === null) {
      return {
        ok: false,
        code: "AUD2_UNSUPPORTED_GIT_STATUS",
        message: `Unsupported git status code: ${status}`,
        path
      };
    }

    entries.push({ operation: mapped, path });
  }

  return { ok: true };
}

export function gitStatusToOperation(status: string): GitChangesetOperation | null {
  return mapGitStatus(status);
}

function mapGitStatus(status: string): GitChangesetOperation | null {
  switch (status) {
    case "M":
      return "modify";
    case "A":
      return "create";
    case "D":
      return "delete";
    case "T":
      return "modify";
    default:
      return null;
  }
}

export function normalizeRepoPath(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const normalized = trimmed.replace(/\\/g, "/");
  if (normalized.startsWith("/") || /^[A-Za-z]:\//.test(normalized)) {
    return null;
  }
  if (normalized.startsWith("./") || normalized.includes("/./") || normalized.includes("..")) {
    return null;
  }
  if (normalized.includes("\\")) {
    return null;
  }

  return normalized;
}

function dedupeEntries(entries: readonly GitChangesetEntry[]): GitChangesetEntry[] {
  const seen = new Set<string>();
  const result: GitChangesetEntry[] = [];
  for (const entry of entries) {
    const key = `${entry.operation}\u0000${entry.path}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(entry);
  }
  return result;
}

function sortEntries(entries: readonly GitChangesetEntry[]): GitChangesetEntry[] {
  return [...entries].sort((left, right) => {
    const pathCompare = left.path.localeCompare(right.path);
    if (pathCompare !== 0) {
      return pathCompare;
    }
    return OPERATION_ORDER[left.operation] - OPERATION_ORDER[right.operation];
  });
}

function splitNullTerminated(value: string): string[] {
  if (value.length === 0) {
    return [];
  }
  return value.split("\u0000").filter((entry) => entry.length > 0);
}

function runGit(args: readonly string[], cwd: string): { ok: true; stdout: string } | { ok: false; message: string } {
  try {
    const stdout = execFileSync("git", ["-C", cwd, ...args], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    });
    return { ok: true, stdout: String(stdout) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Git command failed.";
    return { ok: false, message };
  }
}
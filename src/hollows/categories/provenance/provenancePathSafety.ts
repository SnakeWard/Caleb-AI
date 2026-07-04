import path from "node:path";

const BLOCKED_ROOTS = new Set(["node_modules", "dist", ".git", ".caleb"]);

export function isBlockedRuntimePath(relativePath: string): boolean {
  const normalized = relativePath.replaceAll("\\", "/");
  const [firstSegment] = normalized.split("/").filter(Boolean);
  return firstSegment !== undefined && BLOCKED_ROOTS.has(firstSegment);
}

export function resolveSafeProjectPath(projectRoot: string, relativePath: string): string {
  return assertSafeRelativePath(projectRoot, relativePath);
}

export function assertSafeRelativePath(projectRoot: string, relativePath: string): string {
  if (typeof projectRoot !== "string" || projectRoot.trim().length === 0) {
    throw new Error("project_root must be a non-empty string.");
  }
  if (typeof relativePath !== "string" || relativePath.trim().length === 0) {
    throw new Error("relative_path must be a non-empty string.");
  }
  if (path.isAbsolute(relativePath)) {
    throw new Error("relative_path must not be absolute.");
  }
  if (isBlockedRuntimePath(relativePath)) {
    throw new Error("relative_path points into a blocked runtime folder.");
  }

  const root = path.resolve(projectRoot);
  const resolved = path.resolve(root, relativePath);
  const relativeFromRoot = path.relative(root, resolved);

  if (
    relativeFromRoot === "" ||
    relativeFromRoot.startsWith("..") ||
    path.isAbsolute(relativeFromRoot)
  ) {
    throw new Error("relative_path resolves outside project_root.");
  }
  if (isBlockedRuntimePath(relativeFromRoot)) {
    throw new Error("resolved path points into a blocked runtime folder.");
  }

  return resolved;
}

import path from "node:path";

export const MEDIA_BLOCKED_PATH_ROOTS = ["node_modules", "dist", ".git", ".caleb"] as const;

export class MediaPathSafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MediaPathSafetyError";
  }
}

export function normalizeMediaRelativePath(relativePath: string): string {
  if (typeof relativePath !== "string" || relativePath.trim().length === 0) {
    throw new MediaPathSafetyError("Media relative_path must be a non-empty string.");
  }

  return relativePath.replace(/\\/g, "/").replace(/\/+/g, "/");
}

export function isBlockedMediaRuntimePath(relativePath: string): boolean {
  const normalized = normalizeMediaRelativePath(relativePath);
  const firstSegment = normalized.split("/").find((segment) => segment.length > 0);

  if (!firstSegment) {
    return false;
  }

  return MEDIA_BLOCKED_PATH_ROOTS.includes(
    firstSegment.toLowerCase() as (typeof MEDIA_BLOCKED_PATH_ROOTS)[number]
  );
}

export function assertSafeMediaRelativePath(projectRoot: string, relativePath: string): string {
  if (typeof projectRoot !== "string" || projectRoot.trim().length === 0) {
    throw new MediaPathSafetyError("Media project_root must be a non-empty string.");
  }

  const normalized = normalizeMediaRelativePath(relativePath);

  if (path.isAbsolute(relativePath) || path.posix.isAbsolute(normalized)) {
    throw new MediaPathSafetyError("Media relative_path must not be absolute.");
  }

  if (/^[a-zA-Z]:/.test(normalized)) {
    throw new MediaPathSafetyError("Media relative_path must not be a Windows absolute path.");
  }

  if (relativePath.startsWith("\\\\") || normalized.startsWith("//")) {
    throw new MediaPathSafetyError("Media relative_path must not be a UNC path.");
  }

  const segments = normalized.split("/").filter((segment) => segment.length > 0);
  if (segments.includes("..")) {
    throw new MediaPathSafetyError("Media relative_path must not contain traversal segments.");
  }

  if (isBlockedMediaRuntimePath(normalized)) {
    throw new MediaPathSafetyError("Media relative_path points into a blocked runtime folder.");
  }

  const resolvedProjectRoot = path.resolve(projectRoot);
  const resolvedTarget = path.resolve(resolvedProjectRoot, normalized);
  const relativeToRoot = path.relative(resolvedProjectRoot, resolvedTarget);

  if (
    relativeToRoot === ".." ||
    relativeToRoot.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relativeToRoot)
  ) {
    throw new MediaPathSafetyError("Media relative_path resolves outside project_root.");
  }

  return normalized;
}

export function resolveSafeMediaPath(projectRoot: string, relativePath: string): string {
  const safeRelativePath = assertSafeMediaRelativePath(projectRoot, relativePath);
  return path.resolve(projectRoot, safeRelativePath);
}

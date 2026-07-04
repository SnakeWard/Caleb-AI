import path from "node:path";

import type { MediaType } from "./mediaMetadataTypes.js";

export const MEDIA_AUDIO_EXTENSIONS = [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac"] as const;
export const MEDIA_VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".mkv", ".avi", ".m4v"] as const;
export const MEDIA_IMAGE_EXTENSIONS = [
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".bmp"
] as const;

export function getMediaExtension(relativePath: string): string {
  if (typeof relativePath !== "string" || relativePath.length === 0) {
    return "";
  }

  return path.posix.extname(relativePath.replace(/\\/g, "/")).toLowerCase();
}

export function isLikelyAudioExtension(ext: string): boolean {
  return MEDIA_AUDIO_EXTENSIONS.includes(ext.toLowerCase() as (typeof MEDIA_AUDIO_EXTENSIONS)[number]);
}

export function isLikelyVideoExtension(ext: string): boolean {
  return MEDIA_VIDEO_EXTENSIONS.includes(ext.toLowerCase() as (typeof MEDIA_VIDEO_EXTENSIONS)[number]);
}

export function isLikelyImageExtension(ext: string): boolean {
  return MEDIA_IMAGE_EXTENSIONS.includes(ext.toLowerCase() as (typeof MEDIA_IMAGE_EXTENSIONS)[number]);
}

export function getMediaTypeFromExtension(relativePath: string): MediaType {
  const ext = getMediaExtension(relativePath);

  if (isLikelyAudioExtension(ext)) {
    return "audio";
  }

  if (isLikelyVideoExtension(ext)) {
    return "video";
  }

  if (isLikelyImageExtension(ext)) {
    return "image";
  }

  return "unknown";
}

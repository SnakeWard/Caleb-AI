import {
  aspectRatioImplementation,
  aspectRatioManifest,
  audioDurationImplementation,
  audioDurationManifest,
  imageDimensionsImplementation,
  imageDimensionsManifest,
  videoDurationImplementation,
  videoDurationManifest
} from "./categories/media/index.js";
import { HollowRegistry } from "./registry.js";
import { HollowRunner } from "./runner.js";
import type { HollowImplementation, HollowRunnerOptions } from "./runnerTypes.js";
import type { HollowManifest } from "../types/index.js";

export const MEDIA_HOLLOW_MANIFESTS = [
  imageDimensionsManifest,
  aspectRatioManifest,
  audioDurationManifest,
  videoDurationManifest
] as const satisfies readonly HollowManifest[];

export const MEDIA_HOLLOW_IMPLEMENTATIONS: Readonly<Record<string, HollowImplementation>> = {
  [imageDimensionsManifest.hollow_id]: imageDimensionsImplementation,
  [aspectRatioManifest.hollow_id]: aspectRatioImplementation,
  [audioDurationManifest.hollow_id]: audioDurationImplementation,
  [videoDurationManifest.hollow_id]: videoDurationImplementation
};

export function createMediaHollowRegistry(): HollowRegistry {
  return new HollowRegistry([...MEDIA_HOLLOW_MANIFESTS]);
}

export function createMediaHollowRunner(options?: HollowRunnerOptions): HollowRunner {
  return new HollowRunner(createMediaHollowRegistry(), MEDIA_HOLLOW_IMPLEMENTATIONS, options);
}

export function listMediaHollowIds(): string[] {
  return MEDIA_HOLLOW_MANIFESTS.map((manifest) => manifest.hollow_id).sort();
}

export function getMediaHollowManifest(hollow_id: string): HollowManifest {
  return createMediaHollowRegistry().get(hollow_id);
}

export function isMediaHollowId(hollow_id: string): boolean {
  return hollow_id.startsWith("hollow.media.");
}

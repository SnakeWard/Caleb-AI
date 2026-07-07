import { describe, expect, it } from "vitest";

import {
  MEDIA_HOLLOW_IMPLEMENTATIONS,
  MEDIA_HOLLOW_MANIFESTS,
  V1_HOLLOW_MANIFESTS,
  createMediaHollowRegistry,
  createMediaHollowRunner,
  getMediaHollowManifest,
  isMediaHollowId,
  listMediaHollowIds
} from "../../src/hollows/index.js";
import { isV1SafeHollowManifest, validateHollowManifest } from "../../src/hollows/manifestValidation.js";

const EXPECTED_MEDIA_IDS = [
  "hollow.media.aspect_ratio",
  "hollow.media.audio_duration",
  "hollow.media.image_dimensions",
  "hollow.media.video_duration"
].sort();

describe("Media Hollow catalog", () => {
  it("MEDIA_HOLLOW_MANIFESTS contains exactly 4 media Hollows", () => {
    expect(MEDIA_HOLLOW_MANIFESTS).toHaveLength(4);
  });

  it("MEDIA_HOLLOW_MANIFESTS includes image dimensions", () => {
    expect(listMediaHollowIds()).toContain("hollow.media.image_dimensions");
  });

  it("MEDIA_HOLLOW_MANIFESTS includes aspect ratio", () => {
    expect(listMediaHollowIds()).toContain("hollow.media.aspect_ratio");
  });

  it("MEDIA_HOLLOW_MANIFESTS includes audio duration", () => {
    expect(listMediaHollowIds()).toContain("hollow.media.audio_duration");
  });

  it("MEDIA_HOLLOW_MANIFESTS includes video duration", () => {
    expect(listMediaHollowIds()).toContain("hollow.media.video_duration");
  });

  it("MEDIA_HOLLOW_IMPLEMENTATIONS has implementation for every media manifest", () => {
    for (const manifest of MEDIA_HOLLOW_MANIFESTS) {
      expect(MEDIA_HOLLOW_IMPLEMENTATIONS[manifest.hollow_id]).toBeTypeOf("function");
    }
  });

  it("createMediaHollowRegistry registers all media manifests", () => {
    const registry = createMediaHollowRegistry();

    expect(registry.count()).toBe(4);
    expect(registry.list().map((manifest) => manifest.hollow_id).sort()).toEqual(EXPECTED_MEDIA_IDS);
  });

  it("createMediaHollowRunner can run aspect ratio with direct dimensions", async () => {
    const record = await createMediaHollowRunner().run({
      hollow_id: "hollow.media.aspect_ratio",
      input_payload: { width: 1920, height: 1080, expected_ratio: "16:9" }
    });

    expect(record.status).toBe("completed");
    expect(record.result).toMatchObject({ aspect_ratio_label: "16:9", matches_expected_ratio: true });
  });

  it("all media catalog manifests validate", () => {
    for (const manifest of MEDIA_HOLLOW_MANIFESTS) {
      expect(validateHollowManifest(manifest).valid).toBe(true);
    }
  });

  it("all media catalog manifests are V1-safe", () => {
    for (const manifest of MEDIA_HOLLOW_MANIFESTS) {
      expect(isV1SafeHollowManifest(manifest)).toBe(true);
    }
  });

  it("media catalog contains only hollow.media IDs", () => {
    for (const manifest of MEDIA_HOLLOW_MANIFESTS) {
      expect(isMediaHollowId(manifest.hollow_id)).toBe(true);
    }
  });

  it("media catalog does not include V1 text/validation/provenance/code Hollows", () => {
    const mediaIds = new Set(listMediaHollowIds());

    for (const manifest of V1_HOLLOW_MANIFESTS) {
      expect(mediaIds.has(manifest.hollow_id)).toBe(false);
    }
  });

  it("V1_HOLLOW_MANIFESTS remains exactly 13", () => {
    expect(V1_HOLLOW_MANIFESTS).toHaveLength(13);
  });

  it("V1 catalog contains no hollow.media IDs", () => {
    for (const manifest of V1_HOLLOW_MANIFESTS) {
      expect(manifest.hollow_id.startsWith("hollow.media.")).toBe(false);
    }
  });

  it("listMediaHollowIds returns stable sorted IDs", () => {
    expect(listMediaHollowIds()).toEqual(EXPECTED_MEDIA_IDS);
  });

  it("getMediaHollowManifest returns media manifest by ID", () => {
    expect(getMediaHollowManifest("hollow.media.aspect_ratio").hollow_id).toBe("hollow.media.aspect_ratio");
  });
});

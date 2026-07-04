import { describe, expect, it } from "vitest";

import type {
  AspectRatioInput,
  AudioDurationInput,
  ImageDimensionsInput,
  MediaMetadataInputBase,
  MediaMetadataResultBase,
  VideoDurationInput
} from "../../../src/hollows/categories/media/index.js";

describe("media metadata types", () => {
  it("constructs a valid MediaMetadataInputBase object", () => {
    const input: MediaMetadataInputBase = {
      project_root: "D:/project",
      relative_path: "assets/audio/theme.mp3",
      expected_media_type: "audio",
      metadata_hint: { source: "fixture" }
    };

    expect(input.expected_media_type).toBe("audio");
    expect(input.relative_path).toBe("assets/audio/theme.mp3");
  });

  it("constructs a valid AudioDurationInput type fixture", () => {
    const input: AudioDurationInput = {
      project_root: "D:/project",
      relative_path: "assets/audio/theme.mp3",
      expected_media_type: "audio",
      metadata_hint: { duration_ms: 123456, codec_hint: "aac", container_hint: "m4a" }
    };

    expect(input.metadata_hint?.duration_ms).toBe(123456);
  });

  it("constructs a valid VideoDurationInput type fixture", () => {
    const input: VideoDurationInput = {
      project_root: "D:/project",
      relative_path: "assets/video/clip.mp4",
      expected_media_type: "video",
      metadata_hint: { duration_seconds: 12.5, frame_rate_hint: 30 }
    };

    expect(input.metadata_hint?.frame_rate_hint).toBe(30);
  });

  it("constructs a valid ImageDimensionsInput type fixture", () => {
    const input: ImageDimensionsInput = {
      project_root: "D:/project",
      relative_path: "assets/images/cover.png",
      expected_media_type: "image",
      metadata_hint: { width: 1920, height: 1080, format_hint: "png" }
    };

    expect(input.metadata_hint?.width).toBe(1920);
  });

  it("constructs a valid AspectRatioInput type fixture", () => {
    const input: AspectRatioInput = {
      project_root: "D:/project",
      relative_path: "assets/images/cover.png",
      expected_media_type: "image",
      metadata_hint: { width: 1080, height: 1350, expected_ratio: "4:5" }
    };

    expect(input.metadata_hint?.expected_ratio).toBe("4:5");
  });

  it("constructs a valid shared result base", () => {
    const result: MediaMetadataResultBase = {
      relative_path: "assets/images/cover.png",
      media_type: "image",
      inspection_method: "provided_metadata",
      metadata_confidence: "low",
      unsupported_reason: null,
      warnings: []
    };

    expect(result.inspection_method).toBe("provided_metadata");
    expect(result.warnings).toHaveLength(0);
  });

  it("type fixtures do not require runtime Hollow implementations", () => {
    const fixture: MediaMetadataResultBase = {
      relative_path: "assets/future.webm",
      media_type: "video",
      inspection_method: "unsupported",
      metadata_confidence: "unsupported",
      unsupported_reason: "Runtime Hollow implementation is not part of Pass 16.",
      warnings: ["media_hollow_runtime_not_implemented"]
    };

    expect(fixture.unsupported_reason).toContain("not part of Pass 16");
    expect(fixture.warnings).toContain("media_hollow_runtime_not_implemented");
  });
});

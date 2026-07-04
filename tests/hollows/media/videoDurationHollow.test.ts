import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  inspectVideoDuration,
  isV1SafeHollowManifest,
  validateHollowManifest,
  videoDurationImplementation,
  videoDurationManifest
} from "../../../src/hollows/index.js";

describe("Video Duration Hollow", () => {
  it("videoDurationManifest validates", () => {
    expect(validateHollowManifest(videoDurationManifest).valid).toBe(true);
  });

  it("videoDurationManifest is V1-safe", () => {
    expect(isV1SafeHollowManifest(videoDurationManifest)).toBe(true);
  });

  it("duration_ms normalizes to duration_seconds", () => {
    const result = inspectVideoDuration({ metadata_hint: { duration_ms: 123456 } });

    expect(result.duration_ms).toBe(123456);
    expect(result.duration_seconds).toBe(123.456);
  });

  it("duration_seconds normalizes to duration_ms", () => {
    const result = inspectVideoDuration({ metadata_hint: { duration_seconds: 12.5 } });

    expect(result.duration_ms).toBe(12500);
    expect(result.duration_seconds).toBe(12.5);
  });

  it("both duration values consistent returns consistent", () => {
    const result = inspectVideoDuration({ metadata_hint: { duration_ms: 5000, duration_seconds: 5 } });

    expect(result.duration_consistency).toBe("consistent");
  });

  it("both values mismatched returns warning and mismatch", () => {
    const result = inspectVideoDuration({ metadata_hint: { duration_ms: 5000, duration_seconds: 9 } });

    expect(result.duration_consistency).toBe("mismatch");
    expect(result.warnings).toContain("duration_metadata_mismatch");
  });

  it("missing metadata_hint returns unsupported result", () => {
    const result = inspectVideoDuration({});

    expect(result.duration_source).toBe("unsupported");
    expect(result.warnings).toContain("duration_metadata_missing");
  });

  it("missing duration values returns unsupported result with warning", () => {
    const result = inspectVideoDuration({ metadata_hint: { codec_hint: "h264" } });

    expect(result.duration_source).toBe("unsupported");
    expect(result.warnings).toContain("duration_metadata_missing");
  });

  it("negative duration is invalid", () => {
    const result = inspectVideoDuration({ metadata_hint: { duration_ms: -1 } });

    expect(result.duration_source).toBe("unsupported");
    expect(result.warnings).toContain("duration_metadata_invalid");
  });

  it("NaN, Infinity, and non-number duration values are invalid", () => {
    expect(inspectVideoDuration({ metadata_hint: { duration_ms: Number.NaN } }).warnings).toContain(
      "duration_metadata_invalid"
    );
    expect(inspectVideoDuration({ metadata_hint: { duration_seconds: Number.POSITIVE_INFINITY } }).warnings).toContain(
      "duration_metadata_invalid"
    );
    expect(inspectVideoDuration({ metadata_hint: { duration_ms: "5" as unknown as number } }).warnings).toContain(
      "duration_metadata_invalid"
    );
  });

  it("zero duration returns warning", () => {
    const result = inspectVideoDuration({ metadata_hint: { duration_ms: 0 } });

    expect(result.warnings).toContain("zero_duration");
  });

  it("frame_rate_hint valid returns frame_rate_valid true", () => {
    const result = inspectVideoDuration({ metadata_hint: { duration_ms: 1000, frame_rate_hint: 30 } });

    expect(result.frame_rate_hint).toBe(30);
    expect(result.frame_rate_valid).toBe(true);
  });

  it("invalid frame_rate_hint returns warning and frame_rate_valid false", () => {
    const result = inspectVideoDuration({ metadata_hint: { duration_ms: 1000, frame_rate_hint: -1 } });

    expect(result.frame_rate_hint).toBeNull();
    expect(result.frame_rate_valid).toBe(false);
    expect(result.warnings).toContain("frame_rate_invalid");
  });

  it("codec_hint and container_hint are preserved", () => {
    const result = inspectVideoDuration({
      metadata_hint: { duration_ms: 1000, codec_hint: "h264", container_hint: "mp4" }
    });

    expect(result.codec_hint).toBe("h264");
    expect(result.container_hint).toBe("mp4");
  });

  it("expected_media_type video is accepted", () => {
    const result = inspectVideoDuration({ expected_media_type: "video", metadata_hint: { duration_ms: 1000 } });

    expect(result.warnings).not.toContain("expected_media_type_mismatch");
  });

  it("expected_media_type audio causes mismatch warning", () => {
    const result = inspectVideoDuration({ expected_media_type: "audio", metadata_hint: { duration_ms: 1000 } });

    expect(result.warnings).toContain("expected_media_type_mismatch");
  });

  it("video extension hint is accepted", () => {
    const result = inspectVideoDuration({
      relative_path: "clip.mp4",
      metadata_hint: { duration_ms: 1000 }
    });

    expect(result.extension_media_type).toBe("video");
    expect(result.warnings).not.toContain("extension_media_type_mismatch");
  });

  it("non-video extension hint warns", () => {
    const result = inspectVideoDuration({
      relative_path: "song.mp3",
      metadata_hint: { duration_ms: 1000 }
    });

    expect(result.extension_media_type).toBe("audio");
    expect(result.warnings).toContain("extension_media_type_mismatch");
  });

  it("path safety rejects traversal if path supplied", () => {
    expect(() =>
      inspectVideoDuration({
        project_root: os.tmpdir(),
        relative_path: "../outside.mp4",
        metadata_hint: { duration_ms: 1000 }
      })
    ).toThrow("traversal");
  });

  it("path safety rejects .caleb if path supplied", () => {
    expect(() =>
      inspectVideoDuration({
        project_root: os.tmpdir(),
        relative_path: ".caleb/video.mp4",
        metadata_hint: { duration_ms: 1000 }
      })
    ).toThrow("blocked");
  });

  it("implementation returns result_units duration_ms", async () => {
    const result = await videoDurationImplementation({
      input_payload: { metadata_hint: { duration_ms: 1000 } },
      input_digest: "sha256:unprovided",
      context: {
        invocation_id: "inv_video_duration",
        task_id: "task_video_duration",
        run_id: "run_video_duration",
        trace_id: "trace_video_duration",
        hollow_id: videoDurationManifest.hollow_id,
        hollow_version: videoDurationManifest.hollow_version,
        started_at: new Date(0).toISOString(),
        caller: "test",
        requested_by: "test",
        approved_by: null,
        permissions: ["read_only"],
        execution_mode: "local_inspection"
      }
    });

    expect(result.result_units).toBe("duration_ms");
  });

  it("implementation does not read or mutate files", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "caleb-video-duration-"));
    const filePath = path.join(root, "video.mp4");
    await writeFile(filePath, "not real video");
    const before = await readFile(filePath);

    const result = inspectVideoDuration({
      project_root: root,
      relative_path: "video.mp4",
      metadata_hint: { duration_ms: 1000 }
    });

    expect(result.warnings).toContain("file_not_inspected_by_policy");
    await expect(readFile(filePath)).resolves.toEqual(before);
  });
});

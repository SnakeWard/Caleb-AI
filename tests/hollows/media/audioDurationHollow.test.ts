import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  audioDurationImplementation,
  audioDurationManifest,
  inspectAudioDuration,
  isV1SafeHollowManifest,
  validateHollowManifest
} from "../../../src/hollows/index.js";

describe("Audio Duration Hollow", () => {
  it("audioDurationManifest validates", () => {
    expect(validateHollowManifest(audioDurationManifest).valid).toBe(true);
  });

  it("audioDurationManifest is V1-safe", () => {
    expect(isV1SafeHollowManifest(audioDurationManifest)).toBe(true);
  });

  it("duration_ms normalizes to duration_seconds", () => {
    const result = inspectAudioDuration({ metadata_hint: { duration_ms: 123456 } });

    expect(result.duration_ms).toBe(123456);
    expect(result.duration_seconds).toBe(123.456);
  });

  it("duration_seconds normalizes to duration_ms", () => {
    const result = inspectAudioDuration({ metadata_hint: { duration_seconds: 12.5 } });

    expect(result.duration_ms).toBe(12500);
    expect(result.duration_seconds).toBe(12.5);
  });

  it("both duration values consistent returns consistent", () => {
    const result = inspectAudioDuration({ metadata_hint: { duration_ms: 5000, duration_seconds: 5 } });

    expect(result.duration_consistency).toBe("consistent");
  });

  it("both values mismatched returns warning and mismatch", () => {
    const result = inspectAudioDuration({ metadata_hint: { duration_ms: 5000, duration_seconds: 9 } });

    expect(result.duration_consistency).toBe("mismatch");
    expect(result.warnings).toContain("duration_metadata_mismatch");
  });

  it("missing metadata_hint returns unsupported result", () => {
    const result = inspectAudioDuration({});

    expect(result.duration_source).toBe("unsupported");
    expect(result.warnings).toContain("duration_metadata_missing");
  });

  it("missing duration values returns unsupported result with warning", () => {
    const result = inspectAudioDuration({ metadata_hint: { codec_hint: "mp3" } });

    expect(result.duration_source).toBe("unsupported");
    expect(result.warnings).toContain("duration_metadata_missing");
  });

  it("negative duration is invalid", () => {
    const result = inspectAudioDuration({ metadata_hint: { duration_ms: -1 } });

    expect(result.duration_source).toBe("unsupported");
    expect(result.warnings).toContain("duration_metadata_invalid");
  });

  it("NaN, Infinity, and non-number duration values are invalid", () => {
    expect(inspectAudioDuration({ metadata_hint: { duration_ms: Number.NaN } }).warnings).toContain(
      "duration_metadata_invalid"
    );
    expect(inspectAudioDuration({ metadata_hint: { duration_seconds: Number.POSITIVE_INFINITY } }).warnings).toContain(
      "duration_metadata_invalid"
    );
    expect(inspectAudioDuration({ metadata_hint: { duration_ms: "5" as unknown as number } }).warnings).toContain(
      "duration_metadata_invalid"
    );
  });

  it("zero duration returns warning", () => {
    const result = inspectAudioDuration({ metadata_hint: { duration_ms: 0 } });

    expect(result.warnings).toContain("zero_duration");
  });

  it("codec_hint and container_hint are preserved", () => {
    const result = inspectAudioDuration({
      metadata_hint: { duration_ms: 1000, codec_hint: "mp3", container_hint: "mp3" }
    });

    expect(result.codec_hint).toBe("mp3");
    expect(result.container_hint).toBe("mp3");
  });

  it("expected_media_type audio is accepted", () => {
    const result = inspectAudioDuration({ expected_media_type: "audio", metadata_hint: { duration_ms: 1000 } });

    expect(result.warnings).not.toContain("expected_media_type_mismatch");
  });

  it("expected_media_type video causes mismatch warning", () => {
    const result = inspectAudioDuration({ expected_media_type: "video", metadata_hint: { duration_ms: 1000 } });

    expect(result.warnings).toContain("expected_media_type_mismatch");
  });

  it("audio extension hint is accepted", () => {
    const result = inspectAudioDuration({
      relative_path: "song.mp3",
      metadata_hint: { duration_ms: 1000 }
    });

    expect(result.extension_media_type).toBe("audio");
    expect(result.warnings).not.toContain("extension_media_type_mismatch");
  });

  it("non-audio extension hint warns", () => {
    const result = inspectAudioDuration({
      relative_path: "clip.mp4",
      metadata_hint: { duration_ms: 1000 }
    });

    expect(result.extension_media_type).toBe("video");
    expect(result.warnings).toContain("extension_media_type_mismatch");
  });

  it("path safety rejects traversal if path supplied", () => {
    expect(() =>
      inspectAudioDuration({
        project_root: os.tmpdir(),
        relative_path: "../outside.mp3",
        metadata_hint: { duration_ms: 1000 }
      })
    ).toThrow("traversal");
  });

  it("path safety rejects .caleb if path supplied", () => {
    expect(() =>
      inspectAudioDuration({
        project_root: os.tmpdir(),
        relative_path: ".caleb/audio.mp3",
        metadata_hint: { duration_ms: 1000 }
      })
    ).toThrow("blocked");
  });

  it("implementation returns result_units duration_ms", async () => {
    const result = await audioDurationImplementation({
      input_payload: { metadata_hint: { duration_ms: 1000 } },
      input_digest: "sha256:unprovided",
      context: {
        invocation_id: "inv_audio_duration",
        task_id: "task_audio_duration",
        run_id: "run_audio_duration",
        trace_id: "trace_audio_duration",
        hollow_id: audioDurationManifest.hollow_id,
        hollow_version: audioDurationManifest.hollow_version,
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
    const root = await mkdtemp(path.join(os.tmpdir(), "caleb-audio-duration-"));
    const filePath = path.join(root, "audio.mp3");
    await writeFile(filePath, "not real audio");
    const before = await readFile(filePath);

    const result = inspectAudioDuration({
      project_root: root,
      relative_path: "audio.mp3",
      metadata_hint: { duration_ms: 1000 }
    });

    expect(result.warnings).toContain("file_not_inspected_by_policy");
    await expect(readFile(filePath)).resolves.toEqual(before);
  });
});

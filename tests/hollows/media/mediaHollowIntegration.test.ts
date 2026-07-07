import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  HollowRegistry,
  HollowRunner,
  V1_HOLLOW_MANIFESTS,
  audioDurationImplementation,
  audioDurationManifest,
  aspectRatioImplementation,
  aspectRatioManifest,
  imageDimensionsImplementation,
  imageDimensionsManifest,
  mediaHollowManifests,
  videoDurationImplementation,
  videoDurationManifest
} from "../../../src/hollows/index.js";
import { createLedgerEntryFromEvidence } from "../../../src/ledger/index.js";
import { VerifiedReturnPath } from "../../../src/verification/index.js";

describe("Media Hollow integration", () => {
  it("builds HollowRegistry and registers all mediaHollowManifests", () => {
    const registry = new HollowRegistry(mediaHollowManifests);

    expect(registry.count()).toBe(4);
    expect(registry.get(imageDimensionsManifest.hollow_id).hollow_id).toBe(imageDimensionsManifest.hollow_id);
    expect(registry.get(aspectRatioManifest.hollow_id).hollow_id).toBe(aspectRatioManifest.hollow_id);
    expect(registry.get(audioDurationManifest.hollow_id).hollow_id).toBe(audioDurationManifest.hollow_id);
    expect(registry.get(videoDurationManifest.hollow_id).hollow_id).toBe(videoDurationManifest.hollow_id);
  });

  it("builds HollowRunner with all media implementations", () => {
    const runner = createMediaRunner();

    expect(runner.hasImplementation(imageDimensionsManifest.hollow_id)).toBe(true);
    expect(runner.hasImplementation(aspectRatioManifest.hollow_id)).toBe(true);
    expect(runner.hasImplementation(audioDurationManifest.hollow_id)).toBe(true);
    expect(runner.hasImplementation(videoDurationManifest.hollow_id)).toBe(true);
  });

  it("runs image dimensions Hollow against PNG temp fixture", async () => {
    const fixture = await createFixture("image.png", createPngFixture(1920, 1080));
    const record = await createMediaRunner().run({
      hollow_id: imageDimensionsManifest.hollow_id,
      input_payload: createInput(fixture.root, "image.png")
    });

    expect(record.status).toBe("completed");
    expect(record.result).toMatchObject({ width: 1920, height: 1080 });
  });

  it("runner output starts T0/unverified", async () => {
    const fixture = await createFixture("image.png", createPngFixture(1920, 1080));
    const record = await createMediaRunner().run({
      hollow_id: imageDimensionsManifest.hollow_id,
      input_payload: createInput(fixture.root, "image.png")
    });

    expect(record.trust_tier).toBe("T0");
    expect(record.verification_status).toBe("unverified");
  });

  it("VerifiedReturnPath promotes completed deterministic image dimensions output to T2", async () => {
    const fixture = await createFixture("image.png", createPngFixture(1920, 1080));
    const record = await createMediaRunner().run({
      hollow_id: imageDimensionsManifest.hollow_id,
      input_payload: createInput(fixture.root, "image.png")
    });
    const result = new VerifiedReturnPath().verifyInvocation(record);

    expect(result.decision).toBe("accepted");
    expect(result.evidence_packet?.trust_tier).toBe("T2");
  });

  it("EvidencePacket can become LedgerEntry through createLedgerEntryFromEvidence", async () => {
    const fixture = await createFixture("image.png", createPngFixture(1920, 1080));
    const record = await createMediaRunner().run({
      hollow_id: imageDimensionsManifest.hollow_id,
      input_payload: createInput(fixture.root, "image.png"),
      task_id: "task_media_image_dimensions",
      run_id: "run_media_image_dimensions",
      trace_id: "trace_media_image_dimensions"
    });
    const result = new VerifiedReturnPath().verifyInvocation(record);

    expect(result.evidence_packet).toBeDefined();
    const entry = createLedgerEntryFromEvidence(result.evidence_packet!);

    expect(entry.actor_type).toBe("verified_return_path");
    expect(entry.hollow_id).toBe(imageDimensionsManifest.hollow_id);
    expect(entry.trust_tier).toBe("T2");
  });

  it("media Hollow warning survives runner output for unsupported file", async () => {
    const fixture = await createFixture("image.bin", Buffer.from("not an image"));
    const record = await createMediaRunner().run({
      hollow_id: imageDimensionsManifest.hollow_id,
      input_payload: createInput(fixture.root, "image.bin")
    });

    expect(record.warnings.map((warning) => warning.warning_id)).toContain("unsupported_image_format");
  });

  it("VerifiedReturnPath preserves media warning", async () => {
    const fixture = await createFixture("image.bin", Buffer.from("not an image"));
    const record = await createMediaRunner().run({
      hollow_id: imageDimensionsManifest.hollow_id,
      input_payload: createInput(fixture.root, "image.bin")
    });
    const result = new VerifiedReturnPath().verifyInvocation(record);

    expect(result.evidence_packet?.warnings.map((warning) => warning.warning_id)).toContain(
      "unsupported_image_format"
    );
  });

  it("runs aspect ratio Hollow with direct dimensions", async () => {
    const record = await createMediaRunner().run({
      hollow_id: aspectRatioManifest.hollow_id,
      input_payload: { width: 1920, height: 1080, expected_ratio: "16:9" }
    });

    expect(record.status).toBe("completed");
    expect(record.result).toMatchObject({ aspect_ratio_label: "16:9", matches_expected_ratio: true });
  });

  it("aspect ratio runner output starts T0/unverified", async () => {
    const record = await createMediaRunner().run({
      hollow_id: aspectRatioManifest.hollow_id,
      input_payload: { width: 1920, height: 1080 }
    });

    expect(record.trust_tier).toBe("T0");
    expect(record.verification_status).toBe("unverified");
  });

  it("VerifiedReturnPath promotes completed deterministic aspect ratio output to T2", async () => {
    const record = await createMediaRunner().run({
      hollow_id: aspectRatioManifest.hollow_id,
      input_payload: { width: 1920, height: 1080 }
    });
    const result = new VerifiedReturnPath().verifyInvocation(record);

    expect(result.decision).toBe("accepted");
    expect(result.evidence_packet?.trust_tier).toBe("T2");
  });

  it("aspect ratio EvidencePacket can become LedgerEntry through createLedgerEntryFromEvidence", async () => {
    const record = await createMediaRunner().run({
      hollow_id: aspectRatioManifest.hollow_id,
      input_payload: { width: 1920, height: 1080 },
      task_id: "task_media_aspect_ratio",
      run_id: "run_media_aspect_ratio",
      trace_id: "trace_media_aspect_ratio"
    });
    const result = new VerifiedReturnPath().verifyInvocation(record);

    expect(result.evidence_packet).toBeDefined();
    const entry = createLedgerEntryFromEvidence(result.evidence_packet!);

    expect(entry.actor_type).toBe("verified_return_path");
    expect(entry.hollow_id).toBe(aspectRatioManifest.hollow_id);
    expect(entry.trust_tier).toBe("T2");
  });

  it("aspect ratio warning survives runner output for mismatch", async () => {
    const record = await createMediaRunner().run({
      hollow_id: aspectRatioManifest.hollow_id,
      input_payload: { width: 1920, height: 1080, expected_ratio: "1:1" }
    });

    expect(record.warnings.map((warning) => warning.warning_id)).toContain("expected_ratio_mismatch");
  });

  it("VerifiedReturnPath preserves aspect ratio warning", async () => {
    const record = await createMediaRunner().run({
      hollow_id: aspectRatioManifest.hollow_id,
      input_payload: { width: 1920, height: 1080, expected_ratio: "1:1" }
    });
    const result = new VerifiedReturnPath().verifyInvocation(record);

    expect(result.evidence_packet?.warnings.map((warning) => warning.warning_id)).toContain(
      "expected_ratio_mismatch"
    );
  });

  it("runs audio duration Hollow with provided metadata", async () => {
    const record = await createMediaRunner().run({
      hollow_id: audioDurationManifest.hollow_id,
      input_payload: { metadata_hint: { duration_ms: 123456 } }
    });

    expect(record.status).toBe("completed");
    expect(record.result).toMatchObject({ duration_ms: 123456, duration_source: "provided_metadata" });
  });

  it("runs video duration Hollow with provided metadata", async () => {
    const record = await createMediaRunner().run({
      hollow_id: videoDurationManifest.hollow_id,
      input_payload: { metadata_hint: { duration_ms: 123456, frame_rate_hint: 30 } }
    });

    expect(record.status).toBe("completed");
    expect(record.result).toMatchObject({ duration_ms: 123456, frame_rate_valid: true });
  });

  it("audio runner output starts T0/unverified", async () => {
    const record = await createMediaRunner().run({
      hollow_id: audioDurationManifest.hollow_id,
      input_payload: { metadata_hint: { duration_ms: 1000 } }
    });

    expect(record.trust_tier).toBe("T0");
    expect(record.verification_status).toBe("unverified");
  });

  it("video runner output starts T0/unverified", async () => {
    const record = await createMediaRunner().run({
      hollow_id: videoDurationManifest.hollow_id,
      input_payload: { metadata_hint: { duration_ms: 1000 } }
    });

    expect(record.trust_tier).toBe("T0");
    expect(record.verification_status).toBe("unverified");
  });

  it("VerifiedReturnPath promotes completed deterministic audio duration output to T2", async () => {
    const record = await createMediaRunner().run({
      hollow_id: audioDurationManifest.hollow_id,
      input_payload: { metadata_hint: { duration_ms: 1000 } }
    });
    const result = new VerifiedReturnPath().verifyInvocation(record);

    expect(result.decision).toBe("accepted");
    expect(result.evidence_packet?.trust_tier).toBe("T2");
  });

  it("VerifiedReturnPath promotes completed deterministic video duration output to T2", async () => {
    const record = await createMediaRunner().run({
      hollow_id: videoDurationManifest.hollow_id,
      input_payload: { metadata_hint: { duration_ms: 1000 } }
    });
    const result = new VerifiedReturnPath().verifyInvocation(record);

    expect(result.decision).toBe("accepted");
    expect(result.evidence_packet?.trust_tier).toBe("T2");
  });

  it("audio EvidencePacket can become LedgerEntry through createLedgerEntryFromEvidence", async () => {
    const record = await createMediaRunner().run({
      hollow_id: audioDurationManifest.hollow_id,
      input_payload: { metadata_hint: { duration_ms: 1000 } },
      task_id: "task_media_audio_duration",
      run_id: "run_media_audio_duration",
      trace_id: "trace_media_audio_duration"
    });
    const result = new VerifiedReturnPath().verifyInvocation(record);
    const entry = createLedgerEntryFromEvidence(result.evidence_packet!);

    expect(entry.hollow_id).toBe(audioDurationManifest.hollow_id);
    expect(entry.trust_tier).toBe("T2");
  });

  it("video EvidencePacket can become LedgerEntry through createLedgerEntryFromEvidence", async () => {
    const record = await createMediaRunner().run({
      hollow_id: videoDurationManifest.hollow_id,
      input_payload: { metadata_hint: { duration_ms: 1000 } },
      task_id: "task_media_video_duration",
      run_id: "run_media_video_duration",
      trace_id: "trace_media_video_duration"
    });
    const result = new VerifiedReturnPath().verifyInvocation(record);
    const entry = createLedgerEntryFromEvidence(result.evidence_packet!);

    expect(entry.hollow_id).toBe(videoDurationManifest.hollow_id);
    expect(entry.trust_tier).toBe("T2");
  });

  it("audio duration warning survives runner output for mismatch", async () => {
    const record = await createMediaRunner().run({
      hollow_id: audioDurationManifest.hollow_id,
      input_payload: { metadata_hint: { duration_ms: 1000, duration_seconds: 3 } }
    });

    expect(record.warnings.map((warning) => warning.warning_id)).toContain("duration_metadata_mismatch");
  });

  it("video duration warning survives runner output for invalid frame rate", async () => {
    const record = await createMediaRunner().run({
      hollow_id: videoDurationManifest.hollow_id,
      input_payload: { metadata_hint: { duration_ms: 1000, frame_rate_hint: -1 } }
    });

    expect(record.warnings.map((warning) => warning.warning_id)).toContain("frame_rate_invalid");
  });

  it("VerifiedReturnPath preserves duration warnings", async () => {
    const record = await createMediaRunner().run({
      hollow_id: audioDurationManifest.hollow_id,
      input_payload: { metadata_hint: { duration_ms: 1000, duration_seconds: 3 } }
    });
    const result = new VerifiedReturnPath().verifyInvocation(record);

    expect(result.evidence_packet?.warnings.map((warning) => warning.warning_id)).toContain(
      "duration_metadata_mismatch"
    );
  });

  it("media Hollow requests read_only only", () => {
    expect(imageDimensionsManifest.permissions).toEqual(["read_only"]);
    expect(imageDimensionsManifest.permissions_required).toEqual(["read_only"]);
    expect(aspectRatioManifest.permissions).toEqual(["read_only"]);
    expect(aspectRatioManifest.permissions_required).toEqual(["read_only"]);
    expect(audioDurationManifest.permissions).toEqual(["read_only"]);
    expect(audioDurationManifest.permissions_required).toEqual(["read_only"]);
    expect(videoDurationManifest.permissions).toEqual(["read_only"]);
    expect(videoDurationManifest.permissions_required).toEqual(["read_only"]);
  });

  it("media Hollow requests no network, shell_command, workspace_write, or external_side_effect permissions", () => {
    for (const manifest of mediaHollowManifests) {
      expect(manifest.network_access).toBe(false);
      expect(manifest.permissions).not.toContain("network");
      expect(manifest.permissions).not.toContain("shell_command");
      expect(manifest.permissions).not.toContain("workspace_write");
      expect(manifest.permissions).not.toContain("external_side_effect");
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
});

function createMediaRunner(): HollowRunner {
  return new HollowRunner(new HollowRegistry(mediaHollowManifests), {
    [imageDimensionsManifest.hollow_id]: imageDimensionsImplementation,
    [aspectRatioManifest.hollow_id]: aspectRatioImplementation,
    [audioDurationManifest.hollow_id]: audioDurationImplementation,
    [videoDurationManifest.hollow_id]: videoDurationImplementation
  });
}

function createInput(projectRoot: string, relativePath: string) {
  return {
    project_root: projectRoot,
    relative_path: relativePath,
    expected_media_type: "image" as const
  };
}

async function createFixture(fileName: string, bytes: Buffer): Promise<{ root: string }> {
  const root = await mkdtemp(path.join(os.tmpdir(), "caleb-media-integration-"));
  await writeFile(path.join(root, fileName), bytes);
  return { root };
}

function createPngFixture(width: number, height: number): Buffer {
  const bytes = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(bytes, 0);
  bytes.writeUInt32BE(13, 8);
  bytes.write("IHDR", 12, "ascii");
  bytes.writeUInt32BE(width, 16);
  bytes.writeUInt32BE(height, 20);
  return bytes;
}

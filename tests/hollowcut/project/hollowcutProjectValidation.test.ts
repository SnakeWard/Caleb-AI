import { describe, expect, it } from "vitest";

import { validateHollowcutProject } from "../../../src/hollowcut/index.js";

type MutableProjectFixture = {
  assets: Array<Record<string, any>>;
  timeline: { items: Array<Record<string, any>>; [key: string]: any };
  tracks: Array<Record<string, any>>;
  captions: Array<Record<string, any>>;
  narration: Record<string, any>;
  export_targets: Array<Record<string, any>>;
  [key: string]: any;
};

describe("Hollowcut project validation", () => {
  it("validates a minimal valid project", () => {
    const result = validateHollowcutProject(createValidProject());

    expect(result.valid).toBe(true);
    expect(result.error_count).toBe(0);
  });

  it("rejects non-object candidate", () => {
    expect(validateHollowcutProject(null).issues).toContainEqual(
      expect.objectContaining({ code: "project_not_object", severity: "error" })
    );
  });

  it("rejects missing schema_version", () => {
    const project = withoutKey(createValidProject(), "schema_version");

    expect(validateHollowcutProject(project).issues).toContainEqual(
      expect.objectContaining({ code: "schema_version_missing", severity: "error" })
    );
  });

  it("rejects missing project_id", () => {
    const project = withoutKey(createValidProject(), "project_id");

    expect(validateHollowcutProject(project).issues).toContainEqual(
      expect.objectContaining({ code: "project_id_missing", severity: "error" })
    );
  });

  it("rejects missing project_name", () => {
    const project = withoutKey(createValidProject(), "project_name");

    expect(validateHollowcutProject(project).issues).toContainEqual(
      expect.objectContaining({ code: "project_name_missing", severity: "error" })
    );
  });

  it("rejects invalid project_root", () => {
    const project = { ...createValidProject(), project_root: "" };

    expect(validateHollowcutProject(project).issues).toContainEqual(
      expect.objectContaining({ code: "project_root_invalid", severity: "error" })
    );
  });

  it("rejects assets when not array", () => {
    const project = { ...createValidProject(), assets: {} };

    expect(validateHollowcutProject(project).issues).toContainEqual(
      expect.objectContaining({ code: "assets_invalid", severity: "error" })
    );
  });

  it("rejects duplicate asset_id", () => {
    const project = createValidProject();
    project.assets.push({ ...project.assets[0]! });

    expect(validateHollowcutProject(project).issues).toContainEqual(
      expect.objectContaining({ code: "duplicate_asset_id", severity: "error" })
    );
  });

  it("rejects unsafe asset relative_path traversal", () => {
    const project = createValidProject();
    project.assets[0]!.relative_path = "../secret.png";

    expect(validateHollowcutProject(project).issues).toContainEqual(
      expect.objectContaining({ code: "asset_relative_path_unsafe", severity: "error" })
    );
  });

  it("rejects unsafe asset relative_path under .caleb", () => {
    const project = createValidProject();
    project.assets[0]!.relative_path = ".caleb/tmp/file.png";

    expect(validateHollowcutProject(project).issues).toContainEqual(
      expect.objectContaining({ code: "asset_relative_path_unsafe", severity: "error" })
    );
  });

  it("does not require asset file to exist", () => {
    const project = createValidProject();
    project.assets[0]!.relative_path = "assets/does-not-exist.png";

    expect(validateHollowcutProject(project).valid).toBe(true);
  });

  it("warns when metadata_hint exists without verified_metadata/evidence_refs", () => {
    const result = validateHollowcutProject(createValidProject());

    expect(result.issues).toContainEqual(
      expect.objectContaining({ code: "metadata_hint_unverified", severity: "warning" })
    );
  });

  it("warns when verified_metadata exists without evidence_refs", () => {
    const project = createValidProject();
    delete project.assets[0]!.metadata_hint;
    project.assets[0]!.verified_metadata = { width: 1920 };

    expect(validateHollowcutProject(project).issues).toContainEqual(
      expect.objectContaining({ code: "verified_metadata_without_evidence_refs", severity: "warning" })
    );
  });

  it("rejects duplicate track_id", () => {
    const project = createValidProject();
    project.tracks.push({ ...project.tracks[0]! });

    expect(validateHollowcutProject(project).issues).toContainEqual(
      expect.objectContaining({ code: "duplicate_track_id", severity: "error" })
    );
  });

  it("rejects timeline item missing asset reference", () => {
    const project = createValidProject();
    project.timeline.items[0]!.asset_id = "missing_asset";

    expect(validateHollowcutProject(project).issues).toContainEqual(
      expect.objectContaining({ code: "timeline_item_missing_asset_reference", severity: "error" })
    );
  });

  it("rejects timeline item missing track reference", () => {
    const project = createValidProject();
    project.timeline.items[0]!.track_id = "missing_track";

    expect(validateHollowcutProject(project).issues).toContainEqual(
      expect.objectContaining({ code: "timeline_item_missing_track_reference", severity: "error" })
    );
  });

  it("rejects invalid timeline timing", () => {
    const project = createValidProject();
    project.timeline.items[0]!.duration_ms = -1;

    expect(validateHollowcutProject(project).issues).toContainEqual(
      expect.objectContaining({ code: "timeline_item_duration_invalid", severity: "error" })
    );
  });

  it("warns on end_ms mismatch", () => {
    const project = createValidProject();
    project.timeline.items[0]!.end_ms = 999;

    expect(validateHollowcutProject(project).issues).toContainEqual(
      expect.objectContaining({ code: "timeline_item_end_mismatch", severity: "warning" })
    );
  });

  it("validates caption timing", () => {
    const project = createValidProject();
    project.captions[0]!.end_ms = 50;

    expect(validateHollowcutProject(project).issues).toContainEqual(
      expect.objectContaining({ code: "caption_timing_invalid", severity: "error" })
    );
  });

  it("warns when caption reading_speed_wpm is null", () => {
    expect(validateHollowcutProject(createValidProject()).issues).toContainEqual(
      expect.objectContaining({ code: "caption_reading_speed_missing", severity: "warning" })
    );
  });

  it("validates narration audio_asset_id reference", () => {
    const result = validateHollowcutProject(createValidProject());

    expect(result.issues).not.toContainEqual(expect.objectContaining({ code: "narration_audio_asset_missing" }));
  });

  it("warns when narration audio_asset_id is missing from assets", () => {
    const project = createValidProject();
    project.narration.audio_asset_id = "missing_audio";

    expect(validateHollowcutProject(project).issues).toContainEqual(
      expect.objectContaining({ code: "narration_audio_asset_missing", severity: "warning" })
    );
  });

  it("validates export target shape", () => {
    const project = createValidProject();
    project.export_targets[0]!.requires_approval = "yes" as unknown as boolean;

    expect(validateHollowcutProject(project).issues).toContainEqual(
      expect.objectContaining({ code: "export_requires_approval_invalid", severity: "error" })
    );
  });

  it("warns when export target status exported has null output_path", () => {
    const project = createValidProject();
    project.export_targets[0]!.status = "exported";
    project.export_targets[0]!.output_path = null;

    expect(validateHollowcutProject(project).issues).toContainEqual(
      expect.objectContaining({ code: "exported_status_without_output_path", severity: "warning" })
    );
  });

  it("returns normalized summary counts", () => {
    const summary = validateHollowcutProject(createValidProject()).normalized_summary;

    expect(summary).toMatchObject({
      project_id: "valid_project",
      project_name: "Valid Project",
      asset_count: 2,
      track_count: 1,
      timeline_item_count: 1,
      caption_count: 1,
      export_target_count: 1,
      ledger_ref_count: 1,
      artifact_ref_count: 0
    });
  });

  it("does not mutate input object", () => {
    const project = createValidProject();
    const before = JSON.stringify(project);

    validateHollowcutProject(project);

    expect(JSON.stringify(project)).toBe(before);
  });
});

function createValidProject(): MutableProjectFixture {
  return {
    schema_version: "1.0.0",
    project_id: "valid_project",
    project_name: "Valid Project",
    created_at: "2026-06-07T00:00:00.000Z",
    updated_at: "2026-06-07T00:00:00.000Z",
    project_root: ".",
    assets: [
      {
        asset_id: "asset_image",
        asset_type: "image",
        relative_path: "assets/image.png",
        display_name: "Image",
        expected_media_type: "image",
        metadata_hint: { width: 1920, height: 1080 },
        verified_metadata: null,
        evidence_refs: [],
        warnings: []
      },
      {
        asset_id: "asset_audio",
        asset_type: "audio",
        relative_path: "assets/audio.mp3",
        display_name: "Audio",
        expected_media_type: "audio",
        metadata_hint: {},
        verified_metadata: null,
        evidence_refs: [],
        warnings: []
      }
    ],
    timeline: {
      timeline_id: "timeline_1",
      duration_ms: 1000,
      fps: 30,
      width: 1920,
      height: 1080,
      aspect_ratio: "16:9",
      items: [
        {
          item_id: "item_1",
          asset_id: "asset_image",
          track_id: "track_visual",
          start_ms: 0,
          duration_ms: 1000,
          end_ms: 1000,
          transition_in: null,
          transition_out: null,
          effects: [],
          warnings: []
        }
      ]
    },
    tracks: [
      {
        track_id: "track_visual",
        track_type: "visual",
        name: "Visual",
        locked: false,
        muted: false,
        items: ["item_1"]
      }
    ],
    captions: [
      {
        caption_id: "caption_1",
        text: "Hello world",
        start_ms: 100,
        end_ms: 900,
        style_ref: null,
        reading_speed_wpm: null,
        warnings: []
      }
    ],
    narration: {
      script: "Hello world",
      voice_profile: null,
      estimated_duration_ms: null,
      audio_asset_id: "asset_audio",
      evidence_refs: []
    },
    export_targets: [
      {
        target_id: "export_1",
        platform: "youtube",
        width: 1920,
        height: 1080,
        fps: 30,
        format: "mp4",
        status: "planned",
        output_path: null,
        requires_approval: true,
        warnings: []
      }
    ],
    validation_state: {
      last_validated_at: "2026-06-07T00:00:00.000Z",
      validation_status: "valid",
      checks: [],
      warnings: [],
      errors: [],
      evidence_refs: [],
      report_refs: []
    },
    ledger_refs: ["ledger_1"],
    artifact_refs: [],
    provenance: {
      created_by: "test",
      source: "unit",
      notes: []
    }
  };
}

function withoutKey<T extends Record<string, unknown>>(value: T, key: keyof T): Omit<T, keyof T> {
  const clone = { ...value };
  delete clone[key];
  return clone;
}

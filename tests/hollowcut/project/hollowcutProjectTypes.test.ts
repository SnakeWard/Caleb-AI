import { describe, expect, it } from "vitest";

import type {
  HollowcutAsset,
  HollowcutCaption,
  HollowcutExportTarget,
  HollowcutProject,
  HollowcutTimelineItem,
  HollowcutTrack
} from "../../../src/hollowcut/index.js";

describe("Hollowcut project types", () => {
  it("constructs a valid HollowcutProject type fixture", () => {
    const project: HollowcutProject = createTypedProjectFixture();

    expect(project.project_id).toBe("typed_project");
    expect(project.assets).toHaveLength(1);
    expect(project.timeline.items).toHaveLength(1);
    expect(project.tracks).toHaveLength(1);
    expect(project.captions).toHaveLength(1);
    expect(project.export_targets).toHaveLength(1);
  });

  it("constructs valid asset fixture", () => {
    const asset: HollowcutAsset = {
      asset_id: "asset_image",
      asset_type: "image",
      relative_path: "assets/image.png",
      display_name: "Image",
      expected_media_type: "image",
      metadata_hint: { width: 1920, height: 1080 },
      verified_metadata: null,
      evidence_refs: [],
      warnings: []
    };

    expect(asset.asset_type).toBe("image");
    expect(asset.evidence_refs).toEqual([]);
  });

  it("constructs valid timeline item fixture", () => {
    const item: HollowcutTimelineItem = {
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
    };

    expect(item.end_ms).toBe(item.start_ms + item.duration_ms);
  });

  it("constructs valid track fixture", () => {
    const track: HollowcutTrack = {
      track_id: "track_visual",
      track_type: "visual",
      name: "Visual",
      locked: false,
      muted: false,
      items: ["item_1"]
    };

    expect(track.items).toContain("item_1");
  });

  it("constructs valid caption fixture", () => {
    const caption: HollowcutCaption = {
      caption_id: "caption_1",
      text: "Hello",
      start_ms: 0,
      end_ms: 1000,
      style_ref: null,
      reading_speed_wpm: null,
      warnings: []
    };

    expect(caption.reading_speed_wpm).toBeNull();
  });

  it("constructs valid export target fixture", () => {
    const exportTarget: HollowcutExportTarget = {
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
    };

    expect(exportTarget.requires_approval).toBe(true);
  });

  it("type fixtures compile and include required arrays", () => {
    const project = createTypedProjectFixture();

    expect(Array.isArray(project.assets)).toBe(true);
    expect(Array.isArray(project.tracks)).toBe(true);
    expect(Array.isArray(project.captions)).toBe(true);
    expect(Array.isArray(project.export_targets)).toBe(true);
    expect(Array.isArray(project.ledger_refs)).toBe(true);
    expect(Array.isArray(project.artifact_refs)).toBe(true);
  });
});

function createTypedProjectFixture(): HollowcutProject {
  return {
    schema_version: "1.0.0",
    project_id: "typed_project",
    project_name: "Typed Project",
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
        text: "Hello",
        start_ms: 0,
        end_ms: 1000,
        style_ref: null,
        reading_speed_wpm: null,
        warnings: []
      }
    ],
    narration: {
      script: "",
      voice_profile: null,
      estimated_duration_ms: null,
      audio_asset_id: null,
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
      source: "fixture",
      notes: []
    }
  };
}

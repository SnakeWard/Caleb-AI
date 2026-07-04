import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { validateHollowcutProject } from "../../../src/hollowcut/index.js";

const FIXTURES = [
  "examples/hollowcut-project-demo/minimal-project.json",
  "examples/hollowcut-project-demo/slideshow-project.json",
  "examples/hollowcut-project-demo/narrated-video-project.json"
];

const ALLOWED_FIXTURE_WARNING_CODES = new Set([
  "ledger_refs_empty",
  "metadata_hint_unverified",
  "validation_state_not_validated",
  "caption_reading_speed_missing"
]);

describe("Hollowcut project demo fixtures", () => {
  it("minimal-project.json parses", async () => {
    await expect(readFixture(FIXTURES[0]!)).resolves.toMatchObject({
      project_id: "hollowcut_project_minimal_demo"
    });
  });

  it("slideshow-project.json parses", async () => {
    await expect(readFixture(FIXTURES[1]!)).resolves.toMatchObject({
      project_id: "hollowcut_project_slideshow_demo"
    });
  });

  it("narrated-video-project.json parses", async () => {
    await expect(readFixture(FIXTURES[2]!)).resolves.toMatchObject({
      project_id: "hollowcut_project_narrated_video_demo"
    });
  });

  it("minimal-project validates or returns only allowed warnings", async () => {
    assertFixtureHasNoBlockingErrors(await readFixture(FIXTURES[0]!));
  });

  it("slideshow-project validates or returns only allowed warnings", async () => {
    assertFixtureHasNoBlockingErrors(await readFixture(FIXTURES[1]!));
  });

  it("narrated-video-project validates or returns only allowed warnings", async () => {
    assertFixtureHasNoBlockingErrors(await readFixture(FIXTURES[2]!));
  });

  it("each fixture remains planning-safe with no exported status requiring real output", async () => {
    for (const fixture of FIXTURES) {
      const project = await readFixture(fixture);
      const targets = Array.isArray(project.export_targets) ? project.export_targets : [];

      for (const target of targets) {
        expect(target).not.toMatchObject({ status: "exported" });
      }
    }
  });

  it("fixtures do not contain real absolute paths", async () => {
    for (const fixture of FIXTURES) {
      const serialized = JSON.stringify(await readFixture(fixture));

      expect(serialized).not.toMatch(/"[A-Za-z]:\\/);
      expect(serialized).not.toContain('"/');
    }
  });

  it("fixtures do not contain .caleb asset paths", async () => {
    for (const fixture of FIXTURES) {
      const project = await readFixture(fixture);
      const assets = Array.isArray(project.assets) ? project.assets : [];

      for (const asset of assets) {
        if (isRecord(asset) && typeof asset.relative_path === "string") {
          expect(asset.relative_path.startsWith(".caleb/")).toBe(false);
        }
      }
    }
  });

  it("fixtures do not imply FFmpeg/export execution", async () => {
    for (const fixture of FIXTURES) {
      const serialized = JSON.stringify(await readFixture(fixture)).toLowerCase();

      expect(serialized).not.toContain("ffmpeg");
      expect(serialized).not.toContain("render_command");
      expect(serialized).not.toContain("export_command");
    }
  });
});

async function readFixture(path: string): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(path, "utf8")) as Record<string, unknown>;
}

function assertFixtureHasNoBlockingErrors(project: Record<string, unknown>): void {
  const result = validateHollowcutProject(project);

  expect(result.error_count).toBe(0);
  expect(result.valid).toBe(true);
  for (const issue of result.issues) {
    expect(issue.severity).toBe("warning");
    expect(ALLOWED_FIXTURE_WARNING_CODES.has(issue.code)).toBe(true);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

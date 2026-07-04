import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  buildCalebReport,
  parseCalebReportJson,
  ReportPathSafetyError,
  writeCalebReport
} from "../../src/reports/index.js";
import { createEvidence } from "./reportBuilder.test.js";

describe("report writer", () => {
  it("writeCalebReport writes Markdown file", async () => {
    await withTempDir(async (outputDir) => {
      const result = await writeCalebReport(createReport(), {
        output_dir: outputDir,
        write_markdown: true,
        write_json: false
      });

      expect(result.markdown_path).toBeDefined();
      expect(await readFile(result.markdown_path!, "utf8")).toContain("# Writer Report");
    });
  });

  it("writeCalebReport writes JSON file", async () => {
    await withTempDir(async (outputDir) => {
      const result = await writeCalebReport(createReport(), {
        output_dir: outputDir,
        write_markdown: false,
        write_json: true
      });

      expect(result.json_path).toBeDefined();
      expect(JSON.parse(await readFile(result.json_path!, "utf8"))).toMatchObject({
        report_id: "report_writer"
      });
    });
  });

  it("writeCalebReport creates output directory if missing", async () => {
    await withTempDir(async (outputDir) => {
      const nested = join(outputDir, "nested", "reports");
      const result = await writeCalebReport(createReport(), { output_dir: nested });

      expect(result.markdown_path).toContain("nested");
      expect(result.json_path).toContain("nested");
    });
  });

  it("default write behavior writes both Markdown and JSON", async () => {
    await withTempDir(async (outputDir) => {
      const result = await writeCalebReport(createReport(), { output_dir: outputDir });

      expect(result.markdown_path).toBeDefined();
      expect(result.json_path).toBeDefined();
    });
  });

  it("filename_base is sanitized when safe but messy", async () => {
    await withTempDir(async (outputDir) => {
      const result = await writeCalebReport(createReport(), {
        output_dir: outputDir,
        filename_base: "report name"
      });

      expect(result.markdown_path).toContain("report_name.md");
    });
  });

  it("path traversal in filename_base is rejected", async () => {
    await withTempDir(async (outputDir) => {
      await expect(
        writeCalebReport(createReport(), {
          output_dir: outputDir,
          filename_base: "../escape"
        })
      ).rejects.toThrow(ReportPathSafetyError);
    });
  });

  it("writeCalebReport does not mutate report object", async () => {
    await withTempDir(async (outputDir) => {
      const report = createReport();
      const before = JSON.stringify(report);

      await writeCalebReport(report, { output_dir: outputDir });

      expect(JSON.stringify(report)).toBe(before);
    });
  });

  it("written JSON can be parsed back into report", async () => {
    await withTempDir(async (outputDir) => {
      const result = await writeCalebReport(createReport(), { output_dir: outputDir });
      const parsed = parseCalebReportJson(await readFile(result.json_path!, "utf8"));

      expect(parsed.report_id).toBe("report_writer");
    });
  });

  it("writer does not write to real project .caleb in tests", async () => {
    await withTempDir(async (outputDir) => {
      const result = await writeCalebReport(createReport(), { output_dir: outputDir });

      expect(result.markdown_path).not.toContain("D:\\Caleb AI\\.caleb");
      expect(result.json_path).not.toContain("D:\\Caleb AI\\.caleb");
    });
  });

  it("writer returns paths written", async () => {
    await withTempDir(async (outputDir) => {
      const result = await writeCalebReport(createReport(), { output_dir: outputDir });

      expect(result.report_id).toBe("report_writer");
      expect(result.markdown_path).toBeDefined();
      expect(result.json_path).toBeDefined();
    });
  });
});

function createReport() {
  return buildCalebReport({
    report_id: "report_writer",
    generated_at: "2026-06-06T00:00:00.000Z",
    title: "Writer Report",
    evidence_packets: [createEvidence()]
  });
}

async function withTempDir(run: (outputDir: string) => Promise<void>): Promise<void> {
  const dir = await mkdtemp(join(tmpdir(), "caleb-report-test-"));
  try {
    await run(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

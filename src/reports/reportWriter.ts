import { mkdir, writeFile } from "node:fs/promises";
import { resolve, sep } from "node:path";

import { renderCalebReportJson } from "./jsonReportRenderer.js";
import { renderCalebReportMarkdown } from "./markdownReportRenderer.js";
import { ReportPathSafetyError, ReportWriteError } from "./reportErrors.js";
import type { CalebReport, ReportWriteOptions, ReportWriteResult } from "./reportTypes.js";
import type { CalebError, CalebWarning } from "../types/index.js";

const BLOCKED_OUTPUT_ROOTS = new Set(["node_modules", "dist", ".git"]);

export async function writeCalebReport(
  report: CalebReport,
  options: ReportWriteOptions
): Promise<ReportWriteResult> {
  const outputDir = assertSafeOutputDir(options.output_dir ?? ".caleb/reports");
  const filenameBase = assertSafeFilenameBase(options.filename_base ?? report.report_id);
  const writeMarkdown = options.write_markdown ?? options.write_json !== true;
  const writeJson = options.write_json ?? options.write_markdown !== true;
  const warnings: CalebWarning[] = [];
  const errors: CalebError[] = [];

  try {
    await mkdir(outputDir, { recursive: true });
    const paths: { markdown_path?: string; json_path?: string } = {};

    if (writeMarkdown) {
      const markdownPath = resolve(outputDir, `${filenameBase}.md`);
      assertPathInside(outputDir, markdownPath);
      await writeFile(markdownPath, renderCalebReportMarkdown(report), "utf8");
      paths.markdown_path = markdownPath;
    }

    if (writeJson) {
      const jsonPath = resolve(outputDir, `${filenameBase}.json`);
      assertPathInside(outputDir, jsonPath);
      await writeFile(jsonPath, renderCalebReportJson(report), "utf8");
      paths.json_path = jsonPath;
    }

    return {
      report_id: report.report_id,
      ...paths,
      warnings,
      errors
    };
  } catch (error) {
    if (error instanceof ReportPathSafetyError) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Unknown report write failure.";
    throw new ReportWriteError(`Could not write Caleb report: ${message}`);
  }
}

function assertSafeOutputDir(outputDir: string): string {
  const resolved = resolve(outputDir);
  const parts = resolved.split(/[\\/]/u);
  const isAllowedCalebReports =
    parts.length >= 2 &&
    parts.at(-2) === ".caleb" &&
    parts.at(-1) === "reports";

  if (!isAllowedCalebReports) {
    for (const blocked of BLOCKED_OUTPUT_ROOTS) {
      if (parts.includes(blocked)) {
        throw new ReportPathSafetyError(`Report output directory cannot be inside ${blocked}.`);
      }
    }
  }

  return resolved;
}

function assertSafeFilenameBase(filenameBase: string): string {
  if (filenameBase.length === 0) {
    throw new ReportPathSafetyError("Report filename_base must not be empty.");
  }
  if (
    filenameBase.includes("..") ||
    filenameBase.includes("/") ||
    filenameBase.includes("\\") ||
    filenameBase.includes(":")
  ) {
    throw new ReportPathSafetyError("Report filename_base must not contain path traversal or separators.");
  }

  const sanitized = filenameBase.replace(/[^A-Za-z0-9._-]/g, "_");
  if (sanitized.length === 0) {
    throw new ReportPathSafetyError("Report filename_base did not contain safe filename characters.");
  }
  return sanitized;
}

function assertPathInside(outputDir: string, targetPath: string): void {
  const root = resolve(outputDir);
  const target = resolve(targetPath);
  if (target !== root && !target.startsWith(`${root}${sep}`)) {
    throw new ReportPathSafetyError("Report writer blocked path outside output_dir.");
  }
}

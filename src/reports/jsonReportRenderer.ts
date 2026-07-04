import type { CalebReport } from "./reportTypes.js";
import { ReportParseError } from "./reportErrors.js";

export function renderCalebReportJson(report: CalebReport): string {
  return `${JSON.stringify(report, null, 2)}\n`;
}

export function parseCalebReportJson(json: string): CalebReport {
  try {
    return JSON.parse(json) as CalebReport;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown JSON parse error.";
    throw new ReportParseError(`Could not parse Caleb report JSON: ${message}`);
  }
}

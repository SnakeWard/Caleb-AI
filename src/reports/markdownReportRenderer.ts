import type { CalebReport, CalebReportSection, ReportRenderOptions } from "./reportTypes.js";

const DEFAULT_MAX_ITEM_COUNT = 50;
const MAX_TEXT_LENGTH = 240;

export function renderCalebReportMarkdown(
  report: CalebReport,
  options: ReportRenderOptions = {}
): string {
  const maxItemCount = options.max_item_count ?? DEFAULT_MAX_ITEM_COUNT;
  const lines: string[] = [
    `# ${escapeMarkdown(report.title)}`,
    "",
    "## Report Metadata",
    "",
    "| Field | Value |",
    "| --- | --- |",
    `| report_id | ${escapeMarkdown(report.report_id)} |`,
    `| schema_version | ${escapeMarkdown(report.schema_version)} |`,
    `| generated_at | ${escapeMarkdown(report.generated_at)} |`
  ];

  if (report.run_id) lines.push(`| run_id | ${escapeMarkdown(report.run_id)} |`);
  if (report.trace_id) lines.push(`| trace_id | ${escapeMarkdown(report.trace_id)} |`);
  if (report.task_id) lines.push(`| task_id | ${escapeMarkdown(report.task_id)} |`);

  lines.push(
    "",
    "## Summary",
    "",
    boundText(report.summary),
    "",
    "## Stats",
    "",
    "| Metric | Value |",
    "| --- | --- |",
    `| invocation_count | ${report.stats.invocation_count} |`,
    `| evidence_packet_count | ${report.stats.evidence_packet_count} |`,
    `| ledger_entry_count | ${report.stats.ledger_entry_count} |`,
    `| warning_count | ${report.stats.warning_count} |`,
    `| error_count | ${report.stats.error_count} |`,
    `| highest_trust_tier | ${report.stats.highest_trust_tier ?? "none"} |`,
    `| trust_tier_counts | ${escapeMarkdown(JSON.stringify(report.stats.trust_tier_counts))} |`,
    `| status_counts | ${escapeMarkdown(JSON.stringify(report.stats.status_counts))} |`
  );

  for (const section of report.sections) {
    if (!shouldRenderSection(section, options)) {
      continue;
    }
    if (section.kind === "summary") {
      continue;
    }
    if (section.kind === "provenance" && options.include_provenance === false) {
      continue;
    }
    lines.push("", `## ${escapeMarkdown(section.title)}`, "", boundText(section.content));
    const items = section.items ?? [];
    if (items.length > 0) {
      for (const item of items.slice(0, maxItemCount)) {
        lines.push(`- ${boundText(JSON.stringify(item))}`);
      }
      if (items.length > maxItemCount) {
        lines.push(`- ${items.length - maxItemCount} additional item(s) omitted.`);
      }
    }
  }

  if (options.include_json_block === true) {
    lines.push("", "## JSON Summary", "", "```json", JSON.stringify(report.stats, null, 2), "```");
  }

  return `${lines.join("\n")}\n`;
}

function shouldRenderSection(section: CalebReportSection, options: ReportRenderOptions): boolean {
  if (options.include_empty_sections === true) {
    return true;
  }
  return (section.items?.length ?? 0) > 0 || section.kind === "provenance";
}

function boundText(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= MAX_TEXT_LENGTH) {
    return escapeMarkdown(normalized);
  }
  return `${escapeMarkdown(normalized.slice(0, MAX_TEXT_LENGTH))}...`;
}

function escapeMarkdown(value: string): string {
  return value.replace(/\|/g, "\\|");
}

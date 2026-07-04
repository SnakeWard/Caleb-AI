import type { CliCommandResult, CliOutputFormat } from "./cliTypes.js";
import { handleCliCommand } from "./commandHandlers.js";
import { parseCliArgs } from "./commandParser.js";

export async function runMinimalCli(argv: readonly string[]): Promise<number> {
  const parsed = parseCliArgs(argv);
  const result = await handleCliCommand(parsed);
  const output = formatCliCommandResult(result, parsed.output_format);

  if (result.ok) {
    process.stdout.write(output);
  } else {
    process.stderr.write(output);
  }

  return result.exit_code;
}

export function formatCliCommandResult(
  result: CliCommandResult,
  outputFormat: CliOutputFormat = "text"
): string {
  if (outputFormat === "json") {
    return `${JSON.stringify(result, null, 2)}\n`;
  }

  const lines = [
    result.ok ? "OK" : "ERROR",
    `Command: ${result.command}`,
    result.message
  ];

  if (result.errors.length > 0) {
    lines.push("Errors:");
    for (const error of result.errors) {
      lines.push(`- ${error.code}: ${error.message}`);
    }
  }

  if (result.warnings.length > 0) {
    lines.push("Warnings:");
    for (const warning of result.warnings) {
      lines.push(`- ${warning.code}: ${warning.message}`);
    }
  }

  if (result.data !== undefined) {
    lines.push("Data:");
    lines.push(formatDataSummary(result.data));
  }

  return `${lines.join("\n")}\n`;
}

function formatDataSummary(data: unknown): string {
  if (typeof data !== "object" || data === null) {
    return String(data);
  }

  const json = JSON.stringify(data, null, 2);
  return json.length > 2000 ? `${json.slice(0, 2000)}\n...` : json;
}

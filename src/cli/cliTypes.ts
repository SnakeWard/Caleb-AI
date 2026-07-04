export type CliCommandName =
  | "help"
  | "info"
  | "list-hollows"
  | "inspect-hollow"
  | "run-hollow"
  | "list-media-hollows"
  | "inspect-media-hollow"
  | "run-media-hollow"
  | "inspect-hollowcut-project"
  | "create-milestone-snapshot"
  | "run-hollowcut-hollow"
  | "list-hollowcut-hollows"
  | "preview-hollowcut-export-plan"
  | "route-decision"
  | "logic-execute"
  | "one-provider-adapter-dry-run"
  | "run-one-provider-adapter-live";

export type CliOutputFormat = "text" | "json";

export type ReportFormat = "markdown" | "json" | "both";

export interface CliErrorShape {
  readonly code: string;
  readonly message: string;
}

export interface ParsedCliCommand {
  readonly command: CliCommandName;
  readonly flags: Readonly<Record<string, string | boolean>>;
  readonly errors: readonly CliErrorShape[];
  readonly output_format: CliOutputFormat;
  readonly catalog?: "v1" | "media" | "hollowcut_project" | "hollowcut";
}

export interface RunHollowCliOptions {
  readonly hollow_id: string;
  readonly input_json?: string;
  readonly input_file?: string;
  readonly write_ledger: boolean;
  readonly ledger_path?: string;
  readonly write_report: boolean;
  readonly report_dir?: string;
  readonly report_format: ReportFormat;
}

export interface CliCommandResult {
  readonly ok: boolean;
  readonly exit_code: number;
  readonly command: CliCommandName;
  readonly message: string;
  readonly data?: unknown;
  readonly errors: readonly CliErrorShape[];
  readonly warnings: readonly CliErrorShape[];
}

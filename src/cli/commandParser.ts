import type { CliCommandName, CliErrorShape, ParsedCliCommand } from "./cliTypes.js";

const COMMANDS = new Set<CliCommandName>([
  "help",
  "info",
  "list-hollows",
  "inspect-hollow",
  "run-hollow",
  "list-media-hollows",
  "inspect-media-hollow",
  "run-media-hollow",
  "inspect-hollowcut-project",
  "create-milestone-snapshot",
  "run-hollowcut-hollow",
  "list-hollowcut-hollows",
  "preview-hollowcut-export-plan",
  "route-decision",
  "logic-execute",
  "execute-rotation-plan",
  "execute-live-rotation",
  "one-provider-adapter-dry-run",
  "run-one-provider-adapter-live",
  "audit-pass-compliance"
]);

const VALUE_FLAGS = new Set([
  "--id",
  "--input-json",
  "--input-file",
  "--ledger-path",
  "--report-dir",
  "--report-format",
  "--name",
  "--hollow-input-json",
  "--hollow-input-file",
  "--approved-by",
  "--files-to-capture-json",
  "--files-to-capture-file",
  "--explicit-opt-in",
  "--explicit-live-request",
  "--network-permission",
  "--kill-switch-open",
  "--credential-env-var",
  "--prompt-file",
  "--model",
  "--max-output-tokens",
  "--timeout-ms",
  "--expected-output-sha256",
  "--adapter-id",
  "--manifest",
  "--base-ref",
  "--plan-file",
  "--fixture-file"
]);

const BOOLEAN_FLAGS = new Set([
  "--json",
  "--write-ledger",
  "--write-report",
  "--help",
  "--include-context",
  "--include-trace",
  "--confirm"
]);

const FLAG_TO_KEY: Record<string, string> = {
  "--id": "id",
  "--input-json": "input_json",
  "--input-file": "input_file",
  "--json": "json",
  "--write-ledger": "write_ledger",
  "--ledger-path": "ledger_path",
  "--write-report": "write_report",
  "--report-dir": "report_dir",
  "--report-format": "report_format",
  "--name": "name",
  "--help": "help",
  "--include-context": "include_context",
  "--include-trace": "include_trace",
  "--hollow-input-json": "hollow_input_json",
  "--hollow-input-file": "hollow_input_file",
  "--approved-by": "approved_by",
  "--files-to-capture-json": "files_to_capture_json",
  "--files-to-capture-file": "files_to_capture_file",
  "--explicit-opt-in": "explicit_opt_in",
  "--explicit-live-request": "explicit_live_request",
  "--network-permission": "network_permission",
  "--kill-switch-open": "kill_switch_open",
  "--credential-env-var": "credential_env_var",
  "--prompt-file": "prompt_file",
  "--model": "model",
  "--max-output-tokens": "max_output_tokens",
  "--timeout-ms": "timeout_ms",
  "--expected-output-sha256": "expected_output_sha256",
  "--adapter-id": "adapter_id",
  "--manifest": "manifest",
  "--base-ref": "base_ref",
  "--plan-file": "plan_file",
  "--fixture-file": "fixture_file",
  "--confirm": "confirm"
};

export function parseCliArgs(argv: readonly string[]): ParsedCliCommand {
  const errors: CliErrorShape[] = [];
  const first = argv[0];
  let command: CliCommandName = "help";
  let index = 0;

  if (first !== undefined && first.startsWith("--")) {
    if (first !== "--help") {
      errors.push({ code: "missing_command", message: "First positional argument must be a command." });
    }
  } else if (first !== undefined) {
    if (COMMANDS.has(first as CliCommandName)) {
      command = first as CliCommandName;
      index = 1;
    } else {
      errors.push({ code: "unknown_command", message: `Unknown command: ${first}` });
      command = "help";
      index = 1;
    }
  }

  const flags: Record<string, string | boolean> = {};
  const seen = new Set<string>();

  while (index < argv.length) {
    const token = argv[index];
    if (token === undefined) {
      break;
    }
    if (!token.startsWith("--")) {
      errors.push({ code: "unexpected_argument", message: `Unexpected argument: ${token}` });
      index += 1;
      continue;
    }
    if (!VALUE_FLAGS.has(token) && !BOOLEAN_FLAGS.has(token)) {
      errors.push({ code: "unknown_flag", message: `Unknown flag: ${token}` });
      index += 1;
      continue;
    }

    const key = FLAG_TO_KEY[token] ?? token.slice(2).replace(/-/g, "_");
    if (seen.has(key)) {
      errors.push({ code: "repeated_flag", message: `Repeated flag: ${token}` });
      index += VALUE_FLAGS.has(token) ? 2 : 1;
      continue;
    }
    seen.add(key);

    if (BOOLEAN_FLAGS.has(token)) {
      flags[key] = true;
      index += 1;
      continue;
    }

    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) {
      errors.push({ code: "missing_flag_value", message: `Missing value for flag: ${token}` });
      index += 1;
      continue;
    }
    flags[key] = value;
    index += 2;
  }

  if (flags.input_json !== undefined && flags.input_file !== undefined) {
    errors.push({
      code: "input_conflict",
      message: "--input-json and --input-file are mutually exclusive."
    });
  }

  if (command === "inspect-hollowcut-project") {
    if (flags.input_json !== undefined) {
      errors.push({
        code: "unsupported_input_json",
        message: "inspect-hollowcut-project reads explicit project files only; use --input-file."
      });
    }
    for (const flagKey of ["write_ledger", "ledger_path", "write_report", "report_dir", "report_format"]) {
      if (flags[flagKey] !== undefined) {
        errors.push({
          code: "unsupported_side_effect_flag",
          message:
            "inspect-hollowcut-project is read-only and does not support Ledger or report write flags."
        });
      }
    }
  }

  if (flags.help === true) {
    command = "help";
  }

  if (command === "create-milestone-snapshot") {
    if (flags.name === undefined || typeof flags.name !== "string" || flags.name.trim().length === 0) {
      errors.push({
        code: "missing_name",
        message: "create-milestone-snapshot requires --name <human-readable-name>."
      });
    }
    // Prevent accidental side-effect flags on snapshot command for safety
    for (const flagKey of ["write_ledger", "write_report", "ledger_path", "report_dir", "report_format"]) {
      if (flags[flagKey] !== undefined) {
        errors.push({
          code: "unsupported_flag",
          message: "create-milestone-snapshot does not support ledger or report write flags."
        });
      }
    }
  }

  if (command === "run-hollowcut-hollow") {
    // Reuse existing id / input flags; no special restrictions beyond general run-hollow
    if (flags.id === undefined) {
      errors.push({
        code: "missing_id",
        message: "run-hollowcut-hollow requires --id."
      });
    }
  }

  if (command === "route-decision") {
    if (flags.input_json === undefined && flags.input_file === undefined) {
      errors.push({
        code: "missing_input",
        message: "route-decision requires --input-json <json> or --input-file <file> containing a TaskFrame."
      });
    }
    for (const flagKey of [
      "id",
      "write_report",
      "report_dir",
      "report_format",
      "name",
      "include_context",
      "include_trace"
    ]) {
      if (flags[flagKey] !== undefined) {
        errors.push({
          code: "unsupported_flag",
          message: `route-decision does not support --${flagKey.replace(/_/g, "-")}.`
        });
      }
    }
  }

  if (command === "logic-execute") {
    if (flags.input_json === undefined && flags.input_file === undefined) {
      errors.push({
        code: "missing_task_frame",
        message: "logic-execute requires --input-json <json> or --input-file <file> containing a TaskFrame."
      });
    }
    if (flags.id === undefined) {
      errors.push({
        code: "missing_hollow_id",
        message: "logic-execute requires --id <hollow_id> specifying which V1 Hollow to run."
      });
    }
    if (flags.hollow_input_json === undefined && flags.hollow_input_file === undefined) {
      errors.push({
        code: "missing_hollow_input",
        message:
          "logic-execute requires --hollow-input-json <json> or --hollow-input-file <file> containing the Hollow payload."
      });
    }
    if (flags.hollow_input_json !== undefined && flags.hollow_input_file !== undefined) {
      errors.push({
        code: "hollow_input_conflict",
        message: "--hollow-input-json and --hollow-input-file are mutually exclusive."
      });
    }
    if (flags.files_to_capture_json !== undefined && flags.files_to_capture_file !== undefined) {
      errors.push({
        code: "files_to_capture_conflict",
        message: "--files-to-capture-json and --files-to-capture-file are mutually exclusive."
      });
    }
    if (flags.include_context === true && flags.json !== true) {
      errors.push({
        code: "include_context_requires_json",
        message: "--include-context requires --json."
      });
    }
    if (flags.include_trace === true && flags.json !== true) {
      errors.push({
        code: "include_trace_requires_json",
        message: "--include-trace requires --json."
      });
    }
    for (const flagKey of ["write_report", "report_dir", "report_format", "name"]) {
      if (flags[flagKey] !== undefined) {
        errors.push({
          code: "unsupported_flag",
          message: `logic-execute does not support --${flagKey.replace(/_/g, "-")}.`
        });
      }
    }
  }

  if (command === "execute-rotation-plan") {
    if (flags.plan_file === undefined || typeof flags.plan_file !== "string" || flags.plan_file.trim().length === 0) {
      errors.push({
        code: "missing_plan_file",
        message: "execute-rotation-plan requires --plan-file <bridged-plan.json>."
      });
    }
    if (flags.confirm !== true) {
      errors.push({
        code: "confirmation_required",
        message: "execute-rotation-plan requires explicit --confirm human authority."
      });
    }
    for (const flagKey of [
      "id",
      "input_json",
      "input_file",
      "write_ledger",
      "write_report",
      "report_dir",
      "report_format",
      "name",
      "include_context",
      "include_trace",
      "hollow_input_json",
      "hollow_input_file",
      "approved_by",
      "files_to_capture_json",
      "files_to_capture_file",
      "explicit_opt_in",
      "explicit_live_request",
      "network_permission",
      "kill_switch_open",
      "credential_env_var",
      "prompt_file",
      "model",
      "max_output_tokens",
      "timeout_ms",
      "expected_output_sha256",
      "adapter_id",
      "manifest",
      "base_ref"
    ]) {
      if (flags[flagKey] !== undefined) {
        errors.push({
          code: "unsupported_flag",
          message: `execute-rotation-plan does not support --${flagKey.replace(/_/g, "-")}.`
        });
      }
    }
  }

  if (command === "execute-live-rotation") {
    if (flags.fixture_file === undefined || typeof flags.fixture_file !== "string" || flags.fixture_file.trim().length === 0) {
      errors.push({
        code: "missing_fixture_file",
        message: "execute-live-rotation requires --fixture-file <live-rotation-fixture.json>."
      });
    }
    if (flags.confirm !== true) {
      errors.push({
        code: "confirmation_required",
        message: "execute-live-rotation requires explicit --confirm human authority."
      });
    }
    if (flags.credential_env_var === undefined || typeof flags.credential_env_var !== "string") {
      errors.push({
        code: "credential_source_required",
        message: "execute-live-rotation requires --credential-env-var <provider=ENV_NAME>."
      });
    }
    if (flags.approved_by === undefined || typeof flags.approved_by !== "string") {
      errors.push({
        code: "approver_required",
        message: "execute-live-rotation requires --approved-by <actor>."
      });
    }
    const allowed = new Set(["fixture_file", "confirm", "credential_env_var", "approved_by", "ledger_path", "json"]);
    for (const flagKey of Object.keys(flags)) {
      if (!allowed.has(flagKey)) {
        errors.push({
          code: "unsupported_flag",
          message: `execute-live-rotation does not support --${flagKey.replace(/_/g, "-")}.`
        });
      }
    }
  }

  if (command === "list-hollowcut-hollows") {
    // Read-only command: reject write flags for safety and clarity
    for (const flagKey of ["write_ledger", "write_report", "ledger_path", "report_dir", "report_format"]) {
      if (flags[flagKey] !== undefined) {
        errors.push({
          code: "unsupported_flag",
          message: "list-hollowcut-hollows is read-only and does not support ledger or report write flags."
        });
      }
    }
    if (flags.id !== undefined || flags.input_json !== undefined || flags.input_file !== undefined) {
      errors.push({
        code: "unsupported_flag",
        message: "list-hollowcut-hollows does not accept --id or input flags."
      });
    }
  }

  if (command === "one-provider-adapter-dry-run") {
    for (const flagKey of [
      "id",
      "input_json",
      "input_file",
      "write_ledger",
      "ledger_path",
      "write_report",
      "report_dir",
      "report_format",
      "name",
      "include_context",
      "include_trace",
      "hollow_input_json",
      "hollow_input_file",
      "approved_by",
      "files_to_capture_json",
      "files_to_capture_file"
    ]) {
      if (flags[flagKey] !== undefined) {
        errors.push({
          code: "unsupported_flag",
          message: `one-provider-adapter-dry-run does not support --${flagKey.replace(/_/g, "-")}.`
        });
      }
    }
  }

  if (command === "audit-pass-compliance") {
    if (flags.json !== true) {
      errors.push({
        code: "json_required",
        message: "audit-pass-compliance requires --json for machine-readable output."
      });
    }
    if (flags.manifest === undefined || typeof flags.manifest !== "string" || flags.manifest.trim().length === 0) {
      errors.push({
        code: "missing_manifest",
        message: "audit-pass-compliance requires --manifest <path>."
      });
    }
    for (const flagKey of [
      "id",
      "input_json",
      "input_file",
      "write_ledger",
      "ledger_path",
      "write_report",
      "report_dir",
      "report_format",
      "name",
      "include_context",
      "include_trace",
      "hollow_input_json",
      "hollow_input_file",
      "approved_by",
      "files_to_capture_json",
      "files_to_capture_file",
      "explicit_opt_in",
      "explicit_live_request",
      "network_permission",
      "kill_switch_open",
      "credential_env_var",
      "prompt_file",
      "model",
      "max_output_tokens",
      "timeout_ms",
      "expected_output_sha256",
      "adapter_id"
    ]) {
      if (flags[flagKey] !== undefined) {
        errors.push({
          code: "unsupported_flag",
          message: `audit-pass-compliance does not support --${flagKey.replace(/_/g, "-")}.`
        });
      }
    }
  }

  if (command === "run-one-provider-adapter-live") {
    for (const flagKey of [
      "id",
      "input_json",
      "input_file",
      "write_report",
      "report_dir",
      "report_format",
      "name",
      "include_context",
      "include_trace",
      "hollow_input_json",
      "hollow_input_file",
      "files_to_capture_json",
      "files_to_capture_file"
    ]) {
      if (flags[flagKey] !== undefined) {
        errors.push({
          code: "unsupported_flag",
          message: `run-one-provider-adapter-live does not support --${flagKey.replace(/_/g, "-")}.`
        });
      }
    }
  }

  return {
    command,
    flags,
    errors,
    output_format: flags.json === true ? "json" : "text",
    ...(command === "route-decision" || command === "logic-execute" || command === "execute-rotation-plan" || command === "execute-live-rotation"
      ? {}
      : {
          catalog:
            command === "inspect-hollowcut-project" ? ("hollowcut_project" as const) :
            command === "run-hollowcut-hollow" ? ("hollowcut" as const) :
            command === "list-hollowcut-hollows" ? ("hollowcut" as const) :
            command.includes("media") ? ("media" as const) : ("v1" as const)
        })
  };
}

import { spawn } from "node:child_process";
import { relative, resolve } from "node:path";

import { GuardCommandError, PathSafetyError } from "./changeGuardErrors.js";
import type { GuardCommand, GuardCommandResult } from "./changeGuardTypes.js";

export class GuardRunner {
  private readonly projectRoot: string;
  private readonly defaultTimeoutMs: number;

  constructor(options: { readonly projectRoot: string; readonly default_timeout_ms?: number }) {
    this.projectRoot = resolve(options.projectRoot);
    this.defaultTimeoutMs = options.default_timeout_ms ?? 30000;
  }

  async runCommand(command: GuardCommand): Promise<GuardCommandResult> {
    if (typeof command.command !== "string" || command.command.trim().length === 0) {
      throw new GuardCommandError("Guard command must be a non-empty executable path.");
    }
    if (!Array.isArray(command.args)) {
      throw new GuardCommandError("Guard command args must be an array.");
    }

    const cwd = this.resolveCwd(command.cwd);
    const timeoutMs = command.timeout_ms ?? this.defaultTimeoutMs;
    const started = Date.now();

    return await new Promise((resolveResult) => {
      const child = spawn(command.command, [...command.args], { cwd, shell: false });
      let stdout = "";
      let stderr = "";
      let timedOut = false;
      const timeout = setTimeout(() => {
        timedOut = true;
        child.kill();
      }, timeoutMs);

      child.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString();
      });
      child.stderr.on("data", (chunk: Buffer) => {
        stderr += chunk.toString();
      });
      child.on("error", (error) => {
        clearTimeout(timeout);
        resolveResult(this.result(command, cwd, "failed", stdout, `${stderr}${error.message}`, null, started));
      });
      child.on("close", (code) => {
        clearTimeout(timeout);
        resolveResult(
          this.result(command, cwd, timedOut ? "timed_out" : code === 0 ? "passed" : "failed", stdout, stderr, code, started)
        );
      });
    });
  }

  async runCommands(commands: readonly GuardCommand[]): Promise<GuardCommandResult[]> {
    const results: GuardCommandResult[] = [];
    for (const command of commands) {
      results.push(await this.runCommand(command));
    }
    return results;
  }

  private result(
    command: GuardCommand,
    cwd: string,
    status: GuardCommandResult["status"],
    stdout: string,
    stderr: string,
    exit_code: number | null,
    started: number
  ): GuardCommandResult {
    const base = {
      command: command.command,
      args: [...command.args],
      cwd,
      status,
      stdout,
      stderr,
      exit_code,
      duration_ms: Date.now() - started
    };
    return command.label === undefined ? base : { ...base, label: command.label };
  }

  private resolveCwd(cwd?: string): string {
    const resolved = resolve(this.projectRoot, cwd ?? ".");
    const rel = relative(this.projectRoot, resolved);
    if (rel.startsWith("..") || rel === "..") {
      throw new PathSafetyError(`Guard command cwd escapes project root: ${resolved}`);
    }
    return resolved;
  }
}

export function createGuardRunner(options: ConstructorParameters<typeof GuardRunner>[0]): GuardRunner {
  return new GuardRunner(options);
}

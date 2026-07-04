import { appendFile, mkdir, readFile, rm, stat } from "node:fs/promises";
import { dirname } from "node:path";

import type { LedgerActorType, LedgerEntry } from "../types/ledger.js";
import { LedgerEntryNotFoundError, LedgerParseError, LedgerReadError, LedgerWriteError } from "./ledgerErrors.js";
import { assertValidLedgerEntry } from "./ledgerValidation.js";

export interface LedgerQuery {
  readonly run_id?: string;
  readonly trace_id?: string;
  readonly task_id?: string;
  readonly actor_type?: LedgerActorType;
}

export class JsonlLedger {
  readonly ledgerPath: string;

  constructor(ledgerPath = ".caleb/ledger/ledger.jsonl") {
    this.ledgerPath = ledgerPath;
  }

  async append(entry: LedgerEntry): Promise<LedgerEntry> {
    const validEntry = cloneEntry(assertValidLedgerEntry(entry));

    try {
      await mkdir(dirname(this.ledgerPath), { recursive: true });
      await appendFile(this.ledgerPath, `${JSON.stringify(validEntry)}\n`, "utf8");
      return cloneEntry(validEntry);
    } catch (error) {
      throw new LedgerWriteError(
        this.ledgerPath,
        error instanceof Error ? error.message : "Failed to append LedgerEntry."
      );
    }
  }

  async appendMany(entries: readonly LedgerEntry[]): Promise<LedgerEntry[]> {
    const validEntries = entries.map((entry) => cloneEntry(assertValidLedgerEntry(entry)));

    try {
      await mkdir(dirname(this.ledgerPath), { recursive: true });
      const jsonl = validEntries.map((entry) => JSON.stringify(entry)).join("\n");
      await appendFile(this.ledgerPath, `${jsonl}\n`, "utf8");
      return validEntries.map(cloneEntry);
    } catch (error) {
      throw new LedgerWriteError(
        this.ledgerPath,
        error instanceof Error ? error.message : "Failed to append LedgerEntries."
      );
    }
  }

  async readAll(): Promise<LedgerEntry[]> {
    if (!(await pathExists(this.ledgerPath))) {
      return [];
    }

    let contents = "";
    try {
      contents = await readFile(this.ledgerPath, "utf8");
    } catch (error) {
      throw new LedgerReadError(
        this.ledgerPath,
        error instanceof Error ? error.message : "Failed to read Ledger file."
      );
    }

    const entries: LedgerEntry[] = [];
    const lines = contents.split(/\r?\n/);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (line === undefined || line.trim().length === 0) {
        continue;
      }

      try {
        entries.push(cloneEntry(assertValidLedgerEntry(JSON.parse(line))));
      } catch (error) {
        if (error instanceof SyntaxError) {
          throw new LedgerParseError(this.ledgerPath, index + 1, error.message);
        }

        throw new LedgerParseError(
          this.ledgerPath,
          index + 1,
          error instanceof Error ? error.message : "Invalid LedgerEntry."
        );
      }
    }

    return entries;
  }

  async findByLedgerId(ledger_id: string): Promise<LedgerEntry | undefined> {
    return (await this.readAll()).find((entry) => entry.ledger_id === ledger_id);
  }

  async getByLedgerId(ledger_id: string): Promise<LedgerEntry> {
    const entry = await this.findByLedgerId(ledger_id);
    if (entry === undefined) {
      throw new LedgerEntryNotFoundError(ledger_id);
    }

    return entry;
  }

  async listByRunId(run_id: string): Promise<LedgerEntry[]> {
    return (await this.readAll()).filter((entry) => entry.run_id === run_id);
  }

  async listByTraceId(trace_id: string): Promise<LedgerEntry[]> {
    return (await this.readAll()).filter((entry) => entry.trace_id === trace_id);
  }

  async listByTaskId(task_id: string): Promise<LedgerEntry[]> {
    return (await this.readAll()).filter((entry) => entry.task_id === task_id);
  }

  async listByActorType(actor_type: LedgerActorType): Promise<LedgerEntry[]> {
    return (await this.readAll()).filter((entry) => entry.actor_type === actor_type);
  }

  async query(query: LedgerQuery): Promise<LedgerEntry[]> {
    return (await this.readAll()).filter(
      (entry) =>
        (query.run_id === undefined || entry.run_id === query.run_id) &&
        (query.trace_id === undefined || entry.trace_id === query.trace_id) &&
        (query.task_id === undefined || entry.task_id === query.task_id) &&
        (query.actor_type === undefined || entry.actor_type === query.actor_type)
    );
  }

  // Test-only helper. Production code must not clear append-only Ledger files.
  async clearForTestOnly(): Promise<void> {
    await rm(this.ledgerPath, { force: true });
  }
}

export function createJsonlLedger(ledgerPath?: string): JsonlLedger {
  return new JsonlLedger(ledgerPath);
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function cloneEntry(entry: LedgerEntry): LedgerEntry {
  return {
    ...entry,
    result: JSON.parse(JSON.stringify(entry.result)) as LedgerEntry["result"],
    warnings: entry.warnings.map((warning) => ({ ...warning })),
    errors: entry.errors.map((error) => ({ ...error })),
    artifact_hashes: entry.artifact_hashes.map((artifact) => ({ ...artifact })),
    provenance: { ...entry.provenance },
    parent_refs: [...entry.parent_refs],
    artifact_refs: [...entry.artifact_refs]
  };
}

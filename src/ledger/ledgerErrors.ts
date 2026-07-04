import type { LedgerValidationIssue } from "./ledgerValidation.js";

export class LedgerValidationError extends Error {
  readonly validation_errors: readonly LedgerValidationIssue[];

  constructor(errors: readonly LedgerValidationIssue[]) {
    super("LedgerEntry validation failed.");
    this.name = "LedgerValidationError";
    this.validation_errors = errors;
  }
}

export class LedgerWriteError extends Error {
  readonly ledger_path: string;

  constructor(ledger_path: string, message: string) {
    super(message);
    this.name = "LedgerWriteError";
    this.ledger_path = ledger_path;
  }
}

export class LedgerReadError extends Error {
  readonly ledger_path: string;

  constructor(ledger_path: string, message: string) {
    super(message);
    this.name = "LedgerReadError";
    this.ledger_path = ledger_path;
  }
}

export class LedgerParseError extends Error {
  readonly ledger_path: string;
  readonly line_number: number;

  constructor(ledger_path: string, line_number: number, message: string) {
    super(`Failed to parse Ledger JSONL at ${ledger_path}:${line_number}: ${message}`);
    this.name = "LedgerParseError";
    this.ledger_path = ledger_path;
    this.line_number = line_number;
  }
}

export class LedgerEntryNotFoundError extends Error {
  readonly ledger_id: string;

  constructor(ledger_id: string) {
    super(`LedgerEntry not found for ledger_id "${ledger_id}".`);
    this.name = "LedgerEntryNotFoundError";
    this.ledger_id = ledger_id;
  }
}

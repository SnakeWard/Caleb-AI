import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

const REGISTER_PATH = "docs/LIVE_EVENT_AUTHORIZATIONS.md";
const EVENT_LABEL_PATTERN = /^LIVE-R2-E1-A\d+$/;
const FIELD_NAMES = [
  "Authorization",
  "Stated by",
  "Stated when",
  "Recorded where first",
  "Register entry created",
  "Evidence commit",
  "Outcome"
] as const;

interface RegisterEntry {
  readonly label: string;
  readonly fields: ReadonlyMap<string, string>;
}

interface LabeledEvidenceCommit {
  readonly label: string;
  readonly commit: string;
}

function parseRegister(text: string): readonly RegisterEntry[] {
  const lines = text.replaceAll("\r\n", "\n").split("\n");
  const entries: RegisterEntry[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const heading = /^## (LIVE-R2-E1-A\d+)$/.exec(lines[index] ?? "");
    if (heading === null) continue;
    const label = heading[1] ?? "";
    const fields = new Map<string, string>();
    let cursor = index + 1;
    while (cursor < lines.length && !lines[cursor]?.startsWith("## ")) {
      const line = lines[cursor] ?? "";
      if (line.startsWith("- ")) {
        const field = /^- ([^:]+): (.+)$/.exec(line);
        if (field === null) throw new Error(`Malformed register field at ${label}.`);
        const name = field[1] ?? "";
        if (fields.has(name)) throw new Error(`Duplicate register field ${label}:${name}.`);
        fields.set(name, field[2] ?? "");
      } else if (line.trim() !== "") {
        throw new Error(`Unexpected register content at ${label}.`);
      }
      cursor += 1;
    }
    entries.push({ label, fields });
    index = cursor - 1;
  }
  return entries;
}

function labeledLedgerEvidenceCommits(): readonly LabeledEvidenceCommit[] {
  const output = execFileSync(
    "git",
    ["log", "--format=%H%x09%s", "HEAD", "--", ".caleb/ledger/ledger.jsonl"],
    { cwd: process.cwd(), encoding: "utf8" }
  );
  return output.split(/\r?\n/).flatMap((line) => {
    const [commit = "", subject = ""] = line.split("\t", 2);
    const match = /\b(LIVE-R2-E1-A\d+)\b/.exec(subject);
    return match === null ? [] : [{ label: match[1] ?? "", commit }];
  });
}

function validateRegister(
  text: string,
  history: readonly LabeledEvidenceCommit[]
): readonly string[] {
  const issues: string[] = [];
  let entries: readonly RegisterEntry[];
  try {
    entries = parseRegister(text);
  } catch (error) {
    return [error instanceof Error ? error.message : "register_parse_failed"];
  }
  const byLabel = new Map<string, RegisterEntry>();
  for (const entry of entries) {
    if (!EVENT_LABEL_PATTERN.test(entry.label)) issues.push(`invalid_label:${entry.label}`);
    if (byLabel.has(entry.label)) issues.push(`duplicate_label:${entry.label}`);
    byLabel.set(entry.label, entry);
    expect([...entry.fields.keys()]).toEqual(FIELD_NAMES);
    expect(entry.fields.size).toBe(FIELD_NAMES.length);
    expect(entry.fields.get("Authorization")).toMatch(/^".+"$/);
    expect(entry.fields.get("Stated by")).toBe("Pat (T4)");
    expect(entry.fields.get("Stated when")).toMatch(
      /^(pre-run|post-run retroactive), \d{4}-\d{2}-\d{2}$/
    );
    expect(entry.fields.get("Recorded where first")).toMatch(
      /^(implementer session context only|conversation record with reviewer|.+:\d+)$/
    );
    expect(entry.fields.get("Register entry created")).toMatch(
      /^\d{4}-\d{2}-\d{2}, (AUTH-2 \(for backfill\)|[A-Z0-9-]+)$/
    );
    expect(entry.fields.get("Evidence commit")).toMatch(/^[0-9a-f]{40}$/);
    expect(entry.fields.get("Outcome")).toMatch(/^".+"$/);
  }
  for (const evidence of history) {
    const entry = byLabel.get(evidence.label);
    if (entry === undefined) {
      issues.push(`missing_history_entry:${evidence.label}`);
      continue;
    }
    if (entry.fields.get("Evidence commit") !== evidence.commit) {
      issues.push(`evidence_commit_mismatch:${evidence.label}`);
    }
  }
  return issues;
}

describe("AUTH-2 live-event authorization register", () => {
  it("parses the exact field shape, covers labeled Ledger commits, and catches a missing event", async () => {
    const register = await readFile(REGISTER_PATH, "utf8");
    const history = labeledLedgerEvidenceCommits();
    expect(history.map((entry) => entry.label)).toEqual([
      "LIVE-R2-E1-A8",
      "LIVE-R2-E1-A7",
      "LIVE-R2-E1-A6"
    ]);
    expect(validateRegister(register, history)).toEqual([]);

    const knownViolation = register.replace(/\n## LIVE-R2-E1-A8[\s\S]*$/, "");
    expect(validateRegister(knownViolation, history)).toContain(
      "missing_history_entry:LIVE-R2-E1-A8"
    );
  }, 30_000);
});

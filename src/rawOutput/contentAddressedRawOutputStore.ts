import { createHash } from "node:crypto";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import type { Sha256Digest } from "../types/common.js";
import type {
  DeleteRawOutputResult,
  RawOutputArtifactRecord,
  RawOutputDeletionRecord,
  RawOutputIssue,
  ReadRawOutputResult,
  StoreRawOutputInput,
  StoreRawOutputResult
} from "./rawOutputArtifactTypes.js";

const DIGEST_PATTERN = /^sha256:([a-f0-9]{64})$/;

export interface ContentAddressedRawOutputStoreOptions {
  readonly root_dir?: string;
}

export class ContentAddressedRawOutputStore {
  private readonly root_dir: string;

  constructor(options: ContentAddressedRawOutputStoreOptions = {}) {
    this.root_dir = resolve(options.root_dir ?? ".caleb/artifacts/raw-output");
  }

  async store(input: StoreRawOutputInput): Promise<StoreRawOutputResult> {
    if (typeof input.output_text !== "string") {
      return {
        ok: false,
        status: "rejected",
        issues: [issue("invalid_output_text", "output_text", "Raw output text must be a string.")]
      };
    }

    const digest = computeRawOutputDigest(input.output_text);
    const record = createRawOutputArtifactRecord(input, digest);
    await mkdir(this.root_dir, { recursive: true });
    await writeFile(this.contentPath(digest), input.output_text, "utf8");
    await writeFile(this.recordPath(digest), `${JSON.stringify(record, null, 2)}\n`, "utf8");
    await rm(this.deletionPath(digest), { force: true });

    return {
      ok: true,
      status: "stored",
      record,
      issues: []
    };
  }

  async read(digest: Sha256Digest): Promise<ReadRawOutputResult> {
    const validation = validateDigest(digest);
    if (!validation.ok) {
      return {
        ok: false,
        status: "not_found",
        digest,
        issues: validation.issues
      };
    }

    const deletion = await this.readDeletion(digest);
    if (deletion !== undefined) {
      return {
        ok: false,
        status: "content_deleted",
        digest,
        deletion,
        issues: []
      };
    }

    const contentPath = this.contentPath(digest);
    if (!(await exists(contentPath))) {
      return {
        ok: false,
        status: "not_found",
        digest,
        issues: [issue("raw_output_not_found", "digest", "Raw output content was not found.")]
      };
    }

    const content = await readFile(contentPath, "utf8");
    const actualDigest = computeRawOutputDigest(content);
    if (actualDigest !== digest) {
      return {
        ok: false,
        status: "integrity_failure",
        digest,
        issues: [
          issue(
            "digest_mismatch",
            "digest",
            "Raw output content digest did not match the requested digest."
          )
        ]
      };
    }

    const record = await this.readRecord(digest);
    return {
      ok: true,
      status: "found",
      digest,
      content,
      ...(record === undefined ? {} : { record }),
      issues: []
    };
  }

  async delete(input: {
    readonly digest: Sha256Digest;
    readonly deletion_ledger_ref: string;
    readonly deleted_at: string;
  }): Promise<DeleteRawOutputResult> {
    const validation = validateDigest(input.digest);
    if (!validation.ok) {
      return {
        ok: false,
        status: "not_found",
        digest: input.digest,
        issues: validation.issues
      };
    }

    await mkdir(this.root_dir, { recursive: true });
    const deletion: RawOutputDeletionRecord = {
      digest: input.digest,
      deletion_ledger_ref: input.deletion_ledger_ref,
      deleted_at: input.deleted_at
    };

    const contentPath = this.contentPath(input.digest);
    const hadContent = await exists(contentPath);
    await rm(contentPath, { force: true });
    await writeFile(this.deletionPath(input.digest), `${JSON.stringify(deletion, null, 2)}\n`, "utf8");

    return {
      ok: hadContent,
      status: hadContent ? "content_deleted" : "not_found",
      digest: input.digest,
      deletion,
      issues: hadContent ? [] : [issue("raw_output_not_found", "digest", "Raw output content was not found.")]
    };
  }

  private contentPath(digest: Sha256Digest): string {
    return join(this.root_dir, `${digestHex(digest)}.txt`);
  }

  private recordPath(digest: Sha256Digest): string {
    return join(this.root_dir, `${digestHex(digest)}.json`);
  }

  private deletionPath(digest: Sha256Digest): string {
    return join(this.root_dir, `${digestHex(digest)}.deleted.json`);
  }

  private async readRecord(digest: Sha256Digest): Promise<RawOutputArtifactRecord | undefined> {
    const path = this.recordPath(digest);
    if (!(await exists(path))) {
      return undefined;
    }

    return JSON.parse(await readFile(path, "utf8")) as RawOutputArtifactRecord;
  }

  private async readDeletion(digest: Sha256Digest): Promise<RawOutputDeletionRecord | undefined> {
    const path = this.deletionPath(digest);
    if (!(await exists(path))) {
      return undefined;
    }

    return JSON.parse(await readFile(path, "utf8")) as RawOutputDeletionRecord;
  }
}

export function createContentAddressedRawOutputStore(
  options: ContentAddressedRawOutputStoreOptions = {}
): ContentAddressedRawOutputStore {
  return new ContentAddressedRawOutputStore(options);
}

export function computeRawOutputDigest(content: string): Sha256Digest {
  return `sha256:${createHash("sha256").update(content, "utf8").digest("hex")}`;
}

export function createRawOutputArtifactRecord(
  input: StoreRawOutputInput,
  digest: Sha256Digest
): RawOutputArtifactRecord {
  return {
    artifact_ref: `raw-output:${digest}`,
    digest,
    content_length: input.output_text.length,
    artifact_kind: "provider_model_output",
    raw_output_trust_tier: "T0",
    schema_valid_output_trust_tier: "T1",
    max_allowed_trust_tier: "T1",
    created_at: input.created_at,
    provider_id: input.provider_id,
    model_id: input.model_id,
    ...(input.source_ledger_id === undefined ? {} : { source_ledger_id: input.source_ledger_id })
  };
}

function validateDigest(digest: Sha256Digest): { readonly ok: true; readonly issues: readonly [] } | { readonly ok: false; readonly issues: readonly RawOutputIssue[] } {
  return DIGEST_PATTERN.test(digest)
    ? { ok: true, issues: [] }
    : { ok: false, issues: [issue("invalid_digest", "digest", "Digest must be sha256:<64 lowercase hex>.")] };
}

function digestHex(digest: Sha256Digest): string {
  const match = DIGEST_PATTERN.exec(digest);
  if (match === null) {
    throw new Error("Invalid raw output digest.");
  }

  return match[1] as string;
}

function issue(code: string, path: string, message: string): RawOutputIssue {
  return { code, path, message };
}

async function exists(path: string): Promise<boolean> {
  return stat(path)
    .then(() => true)
    .catch(() => false);
}

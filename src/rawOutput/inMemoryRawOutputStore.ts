import type { Sha256Digest } from "../types/common.js";
import {
  computeRawOutputDigest,
  createRawOutputArtifactRecord
} from "./contentAddressedRawOutputStore.js";
import type {
  DeleteRawOutputResult,
  RawOutputArtifactRecord,
  RawOutputDeletionRecord,
  ReadRawOutputResult,
  StoreRawOutputInput,
  StoreRawOutputResult
} from "./rawOutputArtifactTypes.js";

export class InMemoryRawOutputStore {
  private readonly contents = new Map<Sha256Digest, string>();
  private readonly records = new Map<Sha256Digest, RawOutputArtifactRecord>();
  private readonly deletions = new Map<Sha256Digest, RawOutputDeletionRecord>();

  store(input: StoreRawOutputInput): StoreRawOutputResult {
    const digest = computeRawOutputDigest(input.output_text);
    const record = createRawOutputArtifactRecord(input, digest);
    this.contents.set(digest, input.output_text);
    this.records.set(digest, record);
    this.deletions.delete(digest);
    return { ok: true, status: "stored", record, issues: [] };
  }

  read(digest: Sha256Digest): ReadRawOutputResult {
    const deletion = this.deletions.get(digest);
    if (deletion !== undefined) {
      return { ok: false, status: "content_deleted", digest, deletion, issues: [] };
    }

    const content = this.contents.get(digest);
    if (content === undefined) {
      return {
        ok: false,
        status: "not_found",
        digest,
        issues: [{ code: "raw_output_not_found", path: "digest", message: "Raw output content was not found." }]
      };
    }

    if (computeRawOutputDigest(content) !== digest) {
      return {
        ok: false,
        status: "integrity_failure",
        digest,
        issues: [{ code: "digest_mismatch", path: "digest", message: "Raw output content digest did not match." }]
      };
    }

    const record = this.records.get(digest);
    return { ok: true, status: "found", digest, content, ...(record === undefined ? {} : { record }), issues: [] };
  }

  delete(input: {
    readonly digest: Sha256Digest;
    readonly deletion_ledger_ref: string;
    readonly deleted_at: string;
  }): DeleteRawOutputResult {
    const hadContent = this.contents.delete(input.digest);
    const deletion: RawOutputDeletionRecord = {
      digest: input.digest,
      deletion_ledger_ref: input.deletion_ledger_ref,
      deleted_at: input.deleted_at
    };
    this.deletions.set(input.digest, deletion);
    return {
      ok: hadContent,
      status: hadContent ? "content_deleted" : "not_found",
      digest: input.digest,
      deletion,
      issues: hadContent ? [] : [{ code: "raw_output_not_found", path: "digest", message: "Raw output content was not found." }]
    };
  }
}

export function createInMemoryRawOutputStore(): InMemoryRawOutputStore {
  return new InMemoryRawOutputStore();
}

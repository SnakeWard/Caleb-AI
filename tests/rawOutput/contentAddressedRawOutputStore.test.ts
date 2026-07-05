import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  computeRawOutputDigest,
  createContentAddressedRawOutputStore
} from "../../src/rawOutput/index.js";

describe("ContentAddressedRawOutputStore", () => {
  let root: string;

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), "caleb-m3-raw-output-"));
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("stores and retrieves raw output by sha256 digest", async () => {
    const store = createContentAddressedRawOutputStore({ root_dir: root });
    const result = await store.store({
      output_text: "Acknowledged",
      provider_id: "anthropic_live_adapter",
      model_id: "claude-haiku-4-5",
      created_at: "2026-07-05T00:00:00.000Z"
    });

    expect(result.ok).toBe(true);
    expect(result.record?.digest).toBe(computeRawOutputDigest("Acknowledged"));
    expect(result.record?.raw_output_trust_tier).toBe("T0");
    expect(result.record?.schema_valid_output_trust_tier).toBe("T1");
    expect(result.record?.max_allowed_trust_tier).toBe("T1");

    const read = await store.read(result.record!.digest);
    expect(read.ok).toBe(true);
    expect(read.content).toBe("Acknowledged");
    expect(read.record?.artifact_ref).toBe(`raw-output:${result.record!.digest}`);
  });

  it("returns integrity failure instead of wrong bytes when content is corrupted", async () => {
    const store = createContentAddressedRawOutputStore({ root_dir: root });
    const result = await store.store({
      output_text: "Acknowledged",
      provider_id: "provider",
      model_id: "model",
      created_at: "2026-07-05T00:00:00.000Z"
    });
    const hex = result.record!.digest.replace("sha256:", "");
    await writeFile(join(root, `${hex}.txt`), "changed", "utf8");

    const read = await store.read(result.record!.digest);
    expect(read.ok).toBe(false);
    expect(read.status).toBe("integrity_failure");
    expect(read.issues[0]?.code).toBe("digest_mismatch");
  });

  it("distinguishes authorized-deleted content from unresolved missing content", async () => {
    const store = createContentAddressedRawOutputStore({ root_dir: root });
    const result = await store.store({
      output_text: "Acknowledged",
      provider_id: "provider",
      model_id: "model",
      created_at: "2026-07-05T00:00:00.000Z"
    });

    const deletion = await store.delete({
      digest: result.record!.digest,
      deletion_ledger_ref: "ledger_123e4567-e89b-12d3-a456-426614174000",
      deleted_at: "2026-07-05T00:01:00.000Z"
    });
    expect(deletion.status).toBe("content_deleted");

    const deletedRead = await store.read(result.record!.digest);
    expect(deletedRead.status).toBe("content_deleted");
    expect(deletedRead.deletion?.deletion_ledger_ref).toBe("ledger_123e4567-e89b-12d3-a456-426614174000");

    const missing = await store.read("sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
    expect(missing.status).toBe("not_found");
  });

  it("record sidecar is digest metadata and does not need raw content", async () => {
    const store = createContentAddressedRawOutputStore({ root_dir: root });
    const result = await store.store({
      output_text: "secret model bytes",
      provider_id: "provider",
      model_id: "model",
      created_at: "2026-07-05T00:00:00.000Z"
    });
    const hex = result.record!.digest.replace("sha256:", "");
    const metadata = await readFile(join(root, `${hex}.json`), "utf8");

    expect(metadata).toContain(result.record!.digest);
    expect(metadata).not.toContain("secret model bytes");
  });
});

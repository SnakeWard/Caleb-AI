import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

describe("LIVE-F1 acceptance lock", () => {
  it("locks the leaf-shell credential tree and sibling-process pre-run STOP rule", async () => {
    const contract = await readFile("docs/01_CODEX_OPERATING_CONTRACT.md", "utf8");
    for (const required of [
      "Credential-tree doctrine", "leaf shell", "sibling process", "same parent environment",
      "STOP before network activity", "MUST NOT read or", "future siblings", "both proofs"
    ]) expect(contract).toContain(required);
    expect(contract).toMatch(/Declaring an already inherited\s+credential name does not make it non-ambient/);
  });

  it("pins taxonomy-only seam plumbing and redaction", async () => {
    const [runtime, seam] = await Promise.all([
      readFile("src/logicEngine/liveRotationRuntimeAdapter.ts", "utf8"),
      readFile("src/logicEngine/rotationExecutionSeam.ts", "utf8")
    ]);
    for (const field of [
      "provider_failure_kind", "provider_failure_status", "provider_failure_retryable"
    ]) {
      expect(runtime).toContain(field);
      expect(seam).toContain(field);
    }
    expect(runtime).not.toContain("provider_error_ref");
    expect(runtime).not.toContain("normalized_message");
  });

  it("keeps the two transport sites and single sanctioned CLI env read unchanged", async () => {
    const [anthropic, grok, handlers] = await Promise.all([
      readFile("src/providers/anthropicLiveAdapter.ts", "utf8"),
      readFile("src/providers/xaiLiveAdapter.ts", "utf8"),
      readFile("src/cli/commandHandlers.ts", "utf8")
    ]);
    expect(anthropic.match(/await fetchImpl\(/g)).toHaveLength(1);
    expect(grok.match(/await fetchImpl\(/g)).toHaveLength(1);
    expect(handlers.match(/process\.env/g)).toHaveLength(1);
    expect(handlers).toContain("() => process.env[credentialEnvVar]");
  });
});

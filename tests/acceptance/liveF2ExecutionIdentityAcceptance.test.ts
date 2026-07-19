import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

const PROTOCOL_PATH = "docs/protocols/PASS_PROTOCOL_LIVE_F2.md";
const OPERATING_CONTRACT_PATH = "docs/01_CODEX_OPERATING_CONTRACT.md";
const SEAM_PATH = "src/logicEngine/rotationExecutionSeam.ts";
const CLI_PATH = "src/cli/commandHandlers.ts";

describe("LIVE-F2 execution identity acceptance", () => {
  it("locks plan identity apart from execution-attempt identity", async () => {
    const protocol = await readFile(PROTOCOL_PATH, "utf8");
    const seam = await readFile(SEAM_PATH, "utf8");

    expect(protocol).toContain("`plan_id` identifies what is being executed");
    expect(protocol).toContain("`execution_id` identifies which attempt");
    expect(seam).toContain("const executionId = input.execution_id_factory?.() ?? createExecutionId()");
    expect(seam).toContain('refusal_code: "reconstruction_ambiguous"');
    expect(seam).toContain("resultExecutionId === selectedExecutionId");
    expect(seam).toContain("provenanceExecutionId === selectedExecutionId");
  });

  it("locks the human host-shell doctrine and its E1 findings", async () => {
    const contract = await readFile(OPERATING_CONTRACT_PATH, "utf8");

    expect(contract).toContain("Every live provider event MUST be executed by the human operator from a host\nshell.");
    expect(contract).toContain("agents MUST NOT execute\nthe live provider command from an agent process or agent sandbox");
    expect(contract).toContain("The LIVE-R2 E1 attempts establish the reason");
    expect(contract).toContain("inherited credential-shaped `API_KEY`");
    expect(contract).toContain("failures are not evidence that the provider was unavailable");
  });

  it("keeps provider transport and CLI behavior outside LIVE-F2 implementation", async () => {
    const protocol = await readFile(PROTOCOL_PATH, "utf8");
    const cli = await readFile(CLI_PATH, "utf8");

    expect(protocol).toContain("No provider adapter, provider transport, fetch, endpoint, header, credential");
    expect(protocol).toContain("No live provider calls.");
    expect(cli).not.toContain("reconstruction_ambiguous");
    expect(cli).not.toContain("execution_id_factory");
  });
});

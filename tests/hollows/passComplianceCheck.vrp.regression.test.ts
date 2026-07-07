import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  evaluatePassCompliance,
  HollowRegistry,
  HollowRunner,
  passComplianceCheckImplementation,
  passComplianceCheckManifest
} from "../../src/hollows/index.js";
import { createLedgerEntryFromEvidence } from "../../src/ledger/index.js";
import { VerifiedReturnPath } from "../../src/verification/index.js";

const FIXTURE_DIR = join(dirname(fileURLToPath(import.meta.url)), "../../examples/hollows");

const ID_FORMAT = {
  ledger: /^ledger_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  task: /^task_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  run: /^run_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  trace: /^trace_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  invocation:
    /^invocation_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
};

function createPassComplianceRunner(): HollowRunner {
  const registry = new HollowRegistry([passComplianceCheckManifest]);
  return new HollowRunner(registry, {
    [passComplianceCheckManifest.hollow_id]: passComplianceCheckImplementation
  });
}

describe("passComplianceCheck VRP regression", () => {
  it("registry + runner + VRP yields verified T2 evidence with LG-1 prefix_uuid IDs", async () => {
    const runner = createPassComplianceRunner();
    const input = JSON.parse(
      readFileSync(join(FIXTURE_DIR, "pass-compliance.compliant.json"), "utf8")
    );

    const record = await runner.run({
      hollow_id: passComplianceCheckManifest.hollow_id,
      input_payload: input
    });

    expect(record.status).toBe("completed");
    expect(record.hollow_id).toBe(passComplianceCheckManifest.hollow_id);
    expect(record.hollow_version).toBe(passComplianceCheckManifest.hollow_version);
    expect(record.trust_tier).toBe("T0");
    expect(record.invocation_id).toMatch(ID_FORMAT.invocation);
    expect(record.task_id).toMatch(ID_FORMAT.task);
    expect(record.run_id).toMatch(ID_FORMAT.run);
    expect(record.trace_id).toMatch(ID_FORMAT.trace);

    const verification = new VerifiedReturnPath().verifyInvocation(record);

    expect(verification.decision).toBe("accepted");
    expect(verification.evidence_packet).toBeDefined();
    expect(verification.evidence_packet?.trust_tier).toBe("T2");
    expect(verification.evidence_packet?.hollow_id).toBe(passComplianceCheckManifest.hollow_id);
    expect(verification.evidence_packet?.hollow_version).toBe(passComplianceCheckManifest.hollow_version);
    expect(verification.evidence_packet?.provenance.source_invocation_id).toBe(record.invocation_id);
    expect(verification.evidence_packet?.provenance.verified_return_path).toBe(true);

    const ledgerEntry = createLedgerEntryFromEvidence(verification.evidence_packet!);
    expect(ledgerEntry.actor_type).toBe("verified_return_path");
    expect(ledgerEntry.trust_tier).toBe("T2");
    expect(ledgerEntry.hollow_id).toBe(passComplianceCheckManifest.hollow_id);
    expect(ledgerEntry.ledger_id).toMatch(ID_FORMAT.ledger);
  });

  it("AUD-1 self-smoke fixture evaluates compliant through the Hollow", async () => {
    const input = JSON.parse(
      readFileSync(join(FIXTURE_DIR, "pass-compliance.aud1-self-smoke.json"), "utf8")
    );

    const direct = evaluatePassCompliance(input);
    expect(direct.valid).toBe(true);
    expect(direct.compliant).toBe(true);
    expect(direct.status).toBe("compliant");
    expect(direct.violations).toHaveLength(0);

    const record = await createPassComplianceRunner().run({
      hollow_id: passComplianceCheckManifest.hollow_id,
      input_payload: input
    });
    const verification = new VerifiedReturnPath().verifyInvocation(record);

    expect(record.status).toBe("completed");
    expect((record.result as { compliant: boolean }).compliant).toBe(true);
    expect(verification.evidence_packet?.trust_tier).toBe("T2");
  });
});
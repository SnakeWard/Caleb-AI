import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { handleCliCommand } from "../../src/cli/commandHandlers.js";
import { parseCliArgs } from "../../src/cli/commandParser.js";
import { JsonlLedger } from "../../src/ledger/ledger.js";
import { createBridgedPlannerCriticFixture } from "../logicEngine/rotationExecutionTestHelpers.js";

describe("execute-rotation-plan CLI", () => {
  it("requires explicit --confirm human authority", () => {
    const parsed = parseCliArgs([
      "execute-rotation-plan",
      "--plan-file",
      "bridged-plan.json",
      "--json"
    ]);
    expect(parsed.command).toBe("execute-rotation-plan");
    expect(parsed.errors.map((error) => error.code)).toContain("confirmation_required");
  });

  it("requires one explicit bridged-plan file", () => {
    const parsed = parseCliArgs(["execute-rotation-plan", "--confirm", "--json"]);
    expect(parsed.errors.map((error) => error.code)).toContain("missing_plan_file");
  });

  it("executes a bridged two-cycle fixture through the mandatory JSONL Ledger", async () => {
    const fixture = await createBridgedPlannerCriticFixture();
    const root = await mkdtemp(join(tmpdir(), "le3-cli-"));
    const planPath = join(root, "bridged-plan.json");
    const ledgerPath = join(root, "ledger.jsonl");
    await writeFile(planPath, `${JSON.stringify(fixture.plan, null, 2)}\n`, "utf8");
    const ledger = new JsonlLedger(ledgerPath);
    await ledger.append(fixture.bridge_entry);

    const parsed = parseCliArgs([
      "execute-rotation-plan",
      "--plan-file",
      planPath,
      "--confirm",
      "--ledger-path",
      ledgerPath,
      "--json"
    ]);
    expect(parsed.errors).toEqual([]);
    const result = await handleCliCommand(parsed);

    expect(result.ok).toBe(true);
    expect(result.command).toBe("execute-rotation-plan");
    expect(result.data).toMatchObject({
      status: "completed",
      completed_steps: 4,
      role_order: ["planner", "critic", "planner", "critic"],
      ledger_entries_written: 6,
      mock_only: true,
      human_confirmed: true
    });
    const entries = await ledger.readAll();
    expect(entries).toHaveLength(7);
    expect(entries.at(-1)?.activity).toBe("rotation_execution_completed");
  });

  it("refuses a raw RA-R2 file and records zero completed roles", async () => {
    const fixture = await createBridgedPlannerCriticFixture();
    const root = await mkdtemp(join(tmpdir(), "le3-cli-raw-"));
    const planPath = join(root, "raw-ra-r2-plan.json");
    const ledgerPath = join(root, "ledger.jsonl");
    await writeFile(planPath, `${JSON.stringify(fixture.source_plan, null, 2)}\n`, "utf8");
    const ledger = new JsonlLedger(ledgerPath);
    await ledger.append(fixture.bridge_entry);

    const result = await handleCliCommand(
      parseCliArgs([
        "execute-rotation-plan",
        "--plan-file",
        planPath,
        "--confirm",
        "--ledger-path",
        ledgerPath,
        "--json"
      ])
    );
    expect(result.ok).toBe(false);
    expect(result.errors[0]?.code).toBe("seam_rejected_unbridged_plan");
    expect(result.data).toMatchObject({ status: "refused", completed_steps: 0 });
    const entries = await ledger.readAll();
    expect(entries.at(-1)?.activity).toBe("rotation_execution_refused");
  });
});

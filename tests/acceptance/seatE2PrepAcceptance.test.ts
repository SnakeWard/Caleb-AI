import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  LIVE_ROTATION_MAX_PLANNER_TOKENS,
  LIVE_ROTATION_MAX_ROLE_TOKENS,
  LIVE_ROTATION_MAX_TOTAL_TOKENS,
  validateLiveRotationGateEvidence
} from "../../src/logicEngine/liveRotationGateEvidence.js";

const CONTRACT_PATH = "docs/01_CODEX_OPERATING_CONTRACT.md";
const PRE_CONTRACT_PATH = "tests/fixtures/seat-e2-prep/operating-contract.pre-seat-e2-prep.md";
const SEAT_RECORD_PATH = "docs/IMPLEMENTER_SEAT_RECORD.md";
const E1_PATH = "examples/live-rotation/event-e1.anthropic.fixture.json";
const E2_PATH = "examples/live-rotation/event-e2.cross-family.fixture.json";

const D2_TEXT =
  '**Honest deviations.** Any departure from a governing protocol — scope, sequence, method, or outcome — is reported as a deviation in the pass report, plainly labeled, whether or not it was beneficial. "Honest deviations: none" is an affirmative mandatory line; silence is not equivalent to "none". A deviation honestly reported is reviewable material; a deviation discovered unreported is a contract violation regardless of the deviation\'s merit. Deviations that survive review become gates.';

const SEAT_BINDING_MARKERS = [
  "## Implementer Seat Binding",
  "This contract binds the **implementer seat**",
  "agent and host",
  "non-promoters",
  "SEAT-ONBOARD"
] as const;

const TWO_KEY_MARKERS = [
  "### Two-key credential lifecycle for cross-family events",
  "ANTHROPIC_API_KEY",
  "XAI_API_KEY",
  "Remove-Item",
  "quote-free",
  "powershell -NoProfile -Command if ($env:ANTHROPIC_API_KEY) { Write-Output PRESENT } else { Write-Output ABSENT }",
  "powershell -NoProfile -Command if ($env:XAI_API_KEY) { Write-Output PRESENT } else { Write-Output ABSENT }"
] as const;

const SEAT_RECORD_MARKERS = [
  "# Implementer Seat Record",
  "## Doctrine",
  "Seat environment is disclosed and recorded per tenure via SEAT-ONBOARD",
  "## Correction — Codex seat physics",
  "configuration-and-discipline, not wall",
  "sandbox egress",
  "## Tenure — Grok 4.3 / Grok Build TUI",
  "Grok Build TUI",
  "xAI provider cloud",
  "D:\\Caleb AI",
  "Indeterminate from inside",
  "Pat external verification result"
] as const;

function roleBudget(
  fixture: Record<string, any>,
  roleId: "planner" | "critic"
): number {
  const binding = fixture.runtime_rotation_plan.live_rotation_gate_evidence.role_bindings.find(
    (entry: { role_id: string }) => entry.role_id === roleId
  );
  if (binding === undefined) {
    throw new Error(`missing role binding ${roleId}`);
  }
  return binding.budget.max_tokens as number;
}

function e2Requirements(fixture: Record<string, any>) {
  const evidence = fixture.runtime_rotation_plan.live_rotation_gate_evidence;
  return {
    route_mode: "planner_critic" as const,
    roles_required: ["planner", "critic"] as const,
    max_cycles: 1,
    sequence_length: 2,
    adapter_bindings: fixture.adapter_bindings
  };
}

describe("SEAT-E2-PREP seat doctrine, E2 budget parity, and two-key runbook", () => {
  it("T1 locks seat-binding and honest-deviations text and fails the pre-pass contract fixture", async () => {
    const current = await readFile(CONTRACT_PATH, "utf8");
    const previous = await readFile(PRE_CONTRACT_PATH, "utf8");

    for (const marker of SEAT_BINDING_MARKERS) {
      expect(current).toContain(marker);
      expect(previous).not.toContain(marker);
    }
    expect(current).toContain("## Honest Deviations");
    expect(current).toContain(D2_TEXT);
    expect(previous).not.toContain("## Honest Deviations");
    expect(previous).not.toContain(D2_TEXT);
  });

  it("T2 pins E2 role and run budgets; E1 unchanged (SEAT-E2-PREP-A1/A2)", async () => {
    const e1 = JSON.parse(await readFile(E1_PATH, "utf8")) as Record<string, any>;
    const e2 = JSON.parse(await readFile(E2_PATH, "utf8")) as Record<string, any>;
    const e1Run = e1.runtime_rotation_plan.live_rotation_gate_evidence.run_budget;
    const e2Run = e2.runtime_rotation_plan.live_rotation_gate_evidence.run_budget;

    expect(roleBudget(e1, "planner")).toBe(1536);
    expect(roleBudget(e1, "critic")).toBe(2048);
    expect(roleBudget(e2, "planner")).toBe(1536);
    expect(roleBudget(e2, "critic")).toBe(2048);
    // A2: E2 run-token ceiling parity with E1 (fixture-declared; runtime sums against fixture).
    expect(e2Run).toEqual({
      max_total_invocations: 2,
      max_total_tokens: 8192,
      max_spend_usd: 0.05
    });
    expect(e1Run).toEqual({
      max_total_invocations: 2,
      max_total_tokens: 8192,
      max_spend_usd: 0.05
    });
    expect(LIVE_ROTATION_MAX_PLANNER_TOKENS).toBe(1536);
    expect(LIVE_ROTATION_MAX_ROLE_TOKENS).toBe(2048);
    // Absolute allow-ceiling for declared run max_total_tokens is a constant (8192);
    // runtime enforcement uses the fixture value, not a forced constant default.
    expect(LIVE_ROTATION_MAX_TOTAL_TOKENS).toBe(8192);
    expect(e2Run.max_total_tokens).toBe(LIVE_ROTATION_MAX_TOTAL_TOKENS);
  });

  it("T3 confirms role ceilings govern E2 Critic 2048 and refuse Critic 2049 / Planner 1537", async () => {
    const e2 = JSON.parse(await readFile(E2_PATH, "utf8")) as Record<string, any>;
    const requirements = e2Requirements(e2);
    const evidence = structuredClone(
      e2.runtime_rotation_plan.live_rotation_gate_evidence
    ) as Record<string, any>;

    expect(roleBudget(e2, "critic")).toBe(2048);
    expect(validateLiveRotationGateEvidence(evidence, requirements).ok).toBe(true);

    const criticOver = structuredClone(evidence) as Record<string, any>;
    const criticBinding = criticOver.role_bindings.find(
      (entry: { role_id: string }) => entry.role_id === "critic"
    );
    criticBinding.budget.max_tokens = 2049;
    const criticOverResult = validateLiveRotationGateEvidence(criticOver, requirements);
    expect(criticOverResult.ok).toBe(false);
    if (!criticOverResult.ok) {
      expect(
        criticOverResult.issues.some((issue) => issue.code === "live_role_token_budget_exceeded")
      ).toBe(true);
    }

    const plannerOver = structuredClone(evidence) as Record<string, any>;
    const plannerBinding = plannerOver.role_bindings.find(
      (entry: { role_id: string }) => entry.role_id === "planner"
    );
    plannerBinding.budget.max_tokens = 1537;
    const plannerOverResult = validateLiveRotationGateEvidence(plannerOver, requirements);
    expect(plannerOverResult.ok).toBe(false);
    if (!plannerOverResult.ok) {
      expect(
        plannerOverResult.issues.some((issue) => issue.code === "live_role_token_budget_exceeded")
      ).toBe(true);
    }

    // Map: LIVE-F9 / LIVE-R1 gate chain already refuse Planner 1537 and Critic 2049 on E1.
    // This detector proves the same role ceilings apply to the E2 fixture path.
    expect(LIVE_ROTATION_MAX_ROLE_TOKENS).toBe(2048);
    expect(LIVE_ROTATION_MAX_PLANNER_TOKENS).toBe(1536);
  });

  it("T4 locks the two-key lifecycle and quote-free check form; pre-pass contract fails", async () => {
    const current = await readFile(CONTRACT_PATH, "utf8");
    const previous = await readFile(PRE_CONTRACT_PATH, "utf8");

    for (const marker of TWO_KEY_MARKERS) {
      expect(current).toContain(marker);
      expect(previous).not.toContain(marker);
    }
  });

  it("T5 parses seat-record mandatory shape: correction, Grok tenure, doctrine", async () => {
    const text = await readFile(SEAT_RECORD_PATH, "utf8");
    for (const marker of SEAT_RECORD_MARKERS) {
      expect(text).toContain(marker);
    }

    const lines = text.replaceAll("\r\n", "\n").split("\n");
    const headings = lines.filter((line) => line.startsWith("## "));
    expect(headings).toEqual([
      "## Doctrine",
      "## Correction — Codex seat physics (ENV-1, SEAT-E2-PREP, 2026-07-20)",
      "## Tenure — Grok 4.3 / Grok Build TUI (SEAT-ONBOARD-1, 2026-07-20)"
    ]);

    expect(text).toMatch(/Pat external verification result \| .+/);
    expect(text).not.toMatch(/Pat external verification result \|\s*\|/);
  });
});

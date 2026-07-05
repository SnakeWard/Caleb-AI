import { describe, expect, it, vi } from "vitest";

import { buildCalebReport, createReportId } from "../../src/reports/index.js";

const UUID_SUFFIX = /_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe("report id integrity (H6)", () => {
  it("generates UUID-format ids with the default prefix preserved", () => {
    const id = createReportId();

    expect(id.startsWith("report_")).toBe(true);
    expect(id).toMatch(UUID_SUFFIX);
  });

  it("preserves custom prefixes", () => {
    const id = createReportId("acceptance_report");

    expect(id.startsWith("acceptance_report_")).toBe(true);
    expect(id).toMatch(UUID_SUFFIX);
  });

  it("generates unique ids across many calls and across builder instances", () => {
    const ids = Array.from({ length: 500 }, () => createReportId());
    const reportIds = [buildCalebReport({}).report_id, buildCalebReport({}).report_id];

    expect(new Set([...ids, ...reportIds]).size).toBe(502);
  });

  it("generates unique ids across simulated separate runs (fresh module state)", async () => {
    const firstRun = Array.from({ length: 50 }, () => createReportId());

    vi.resetModules();
    const freshModule = await import("../../src/reports/reportBuilder.js");
    const secondRun = Array.from({ length: 50 }, () => freshModule.createReportId());

    expect(new Set([...firstRun, ...secondRun]).size).toBe(100);
  });

  it("DETECTOR: the counter-collision pattern is caught by the uniqueness assertion", async () => {
    // Reproduce the pre-H6 failure semantics: a per-process counter restarts
    // in every process, so two "runs" mint the same sequence. Under the old
    // scheme (modulo the timestamp component, which same-millisecond starts
    // defeated), these collide; under H6 they must not.
    const counterEra = (counter: { n: number }) => `report_${(++counter.n).toString().padStart(6, "0")}`;
    const runA = { n: 0 };
    const runB = { n: 0 };
    const collidingIds = [counterEra(runA), counterEra(runB)];
    expect(new Set(collidingIds).size).toBe(1); // the defect, demonstrated

    vi.resetModules();
    const freshModule = await import("../../src/reports/reportBuilder.js");
    const postH6 = [createReportId(), freshModule.createReportId()];
    expect(new Set(postH6).size).toBe(2); // the fix, proven on the same shape
  });

  it("RESOLUTION ORDER: explicit report_id > injected generator > default UUID", () => {
    const generator = (prefix: string): string => `${prefix}_from_generator`;

    const explicitWins = buildCalebReport({ report_id: "report_explicit", id_generator: generator });
    expect(explicitWins.report_id).toBe("report_explicit");

    const generatorWins = buildCalebReport({ id_generator: generator });
    expect(generatorWins.report_id).toBe("report_from_generator");

    const defaultUuid = buildCalebReport({});
    expect(defaultUuid.report_id).toMatch(UUID_SUFFIX);
  });

  it("uses an injected generator on createReportId directly", () => {
    expect(createReportId("report", (prefix) => `${prefix}_fixed`)).toBe("report_fixed");
  });
});

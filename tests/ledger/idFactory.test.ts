import { describe, expect, it, vi } from "vitest";

import {
  createInvocationId,
  createLedgerId,
  createRunId,
  createTaskId,
  createTraceId
} from "../../src/ledger/idFactory.js";

const ID_FORMAT: Record<string, RegExp> = {
  ledger: /^ledger_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  task: /^task_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  run: /^run_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  trace: /^trace_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  invocation:
    /^invocation_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
};

const FACTORY_CASES = [
  ["createLedgerId", createLedgerId, "ledger"],
  ["createTaskId", createTaskId, "task"],
  ["createRunId", createRunId, "run"],
  ["createTraceId", createTraceId, "trace"],
  ["createInvocationId", createInvocationId, "invocation"]
] as const;

describe("idFactory", () => {
  it.each(FACTORY_CASES)("%s returns prefix and UUID format", (_name, factory, prefix) => {
    const id = factory();
    expect(id).toMatch(ID_FORMAT[prefix] as RegExp);
  });

  it.each(FACTORY_CASES)(
    "%s produces 10,000 distinct values in one process",
    (_name, factory) => {
      const ids = new Set(Array.from({ length: 10_000 }, () => factory()));
      expect(ids.size).toBe(10_000);
    }
  );

  it.each(FACTORY_CASES)(
    "%s never reproduces IDs after module reset (no counter behavior)",
    async (_name, factory) => {
      const firstBatch = new Set(Array.from({ length: 100 }, () => factory()));

      vi.resetModules();
      const freshModule = await import("../../src/ledger/idFactory.js");
      const secondBatch = [
        ...Array.from({ length: 20 }, () => freshModule.createLedgerId()),
        ...Array.from({ length: 20 }, () => freshModule.createTaskId()),
        ...Array.from({ length: 20 }, () => freshModule.createRunId()),
        ...Array.from({ length: 20 }, () => freshModule.createTraceId()),
        ...Array.from({ length: 20 }, () => freshModule.createInvocationId())
      ];

      for (const id of secondBatch) {
        expect(firstBatch.has(id)).toBe(false);
      }
    }
  );
});
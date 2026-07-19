import { randomUUID } from "node:crypto";

export function createLedgerId(): string {
  return `ledger_${randomUUID()}`;
}

export function createTaskId(): string {
  return `task_${randomUUID()}`;
}

export function createRunId(): string {
  return `run_${randomUUID()}`;
}

export function createTraceId(): string {
  return `trace_${randomUUID()}`;
}

export function createInvocationId(): string {
  return `invocation_${randomUUID()}`;
}

export function createExecutionId(): string {
  return `execution_${randomUUID()}`;
}

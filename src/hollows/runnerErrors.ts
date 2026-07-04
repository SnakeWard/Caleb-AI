export class HollowImplementationNotFoundError extends Error {
  readonly hollow_id: string;

  constructor(hollow_id: string) {
    super(`Hollow implementation not found for hollow_id "${hollow_id}".`);
    this.name = "HollowImplementationNotFoundError";
    this.hollow_id = hollow_id;
  }
}

export class HollowRunnerInputError extends Error {
  readonly hollow_id: string;

  constructor(hollow_id: string, message: string) {
    super(message);
    this.name = "HollowRunnerInputError";
    this.hollow_id = hollow_id;
  }
}

export class HollowRunnerTimeoutError extends Error {
  readonly hollow_id: string;
  readonly timeout_ms: number;

  constructor(hollow_id: string, timeout_ms: number) {
    super(`Hollow execution timed out for hollow_id "${hollow_id}" after ${timeout_ms}ms.`);
    this.name = "HollowRunnerTimeoutError";
    this.hollow_id = hollow_id;
    this.timeout_ms = timeout_ms;
  }
}

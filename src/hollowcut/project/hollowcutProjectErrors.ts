export class HollowcutProjectValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HollowcutProjectValidationError";
  }
}

export class HollowcutProjectPathSafetyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HollowcutProjectPathSafetyError";
  }
}

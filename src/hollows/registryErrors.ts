import type { ManifestValidationError } from "./manifestValidation.js";

export class DuplicateHollowIdError extends Error {
  readonly hollow_id: string;

  constructor(hollow_id: string) {
    super(`Duplicate Hollow manifest registration for hollow_id "${hollow_id}".`);
    this.name = "DuplicateHollowIdError";
    this.hollow_id = hollow_id;
  }
}

export class HollowManifestValidationError extends Error {
  readonly hollow_id: string | undefined;
  readonly validation_errors: readonly ManifestValidationError[];

  constructor(errors: readonly ManifestValidationError[], hollow_id?: string) {
    super(`Invalid Hollow manifest${hollow_id ? ` for hollow_id "${hollow_id}"` : ""}.`);
    this.name = "HollowManifestValidationError";
    this.hollow_id = hollow_id;
    this.validation_errors = errors;
  }
}

export class HollowNotFoundError extends Error {
  readonly hollow_id: string;

  constructor(hollow_id: string) {
    super(`Hollow manifest not found for hollow_id "${hollow_id}".`);
    this.name = "HollowNotFoundError";
    this.hollow_id = hollow_id;
  }
}

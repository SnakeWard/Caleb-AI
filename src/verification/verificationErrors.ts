import type { VerificationFailureCode } from "./verificationTypes.js";

export class VerifiedReturnPathError extends Error {
  readonly code: VerificationFailureCode;
  readonly field: string | undefined;

  constructor(code: VerificationFailureCode, message: string, field?: string) {
    super(message);
    this.name = "VerifiedReturnPathError";
    this.code = code;
    this.field = field;
  }
}

export class MissingRequiredFieldError extends VerifiedReturnPathError {
  constructor(field: string) {
    super("missing_required_field", `Missing required invocation field "${field}".`, field);
    this.name = "MissingRequiredFieldError";
  }
}

export class UnsafeReturnPathError extends VerifiedReturnPathError {
  constructor(code: VerificationFailureCode, message: string, field?: string) {
    super(code, message, field);
    this.name = "UnsafeReturnPathError";
  }
}

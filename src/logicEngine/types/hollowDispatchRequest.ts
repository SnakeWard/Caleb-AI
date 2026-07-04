import type { JsonValue } from "../../types/common.js";

export interface HollowDispatchRequest {
  readonly hollow_id: string;
  readonly hollow_input: JsonValue;
}

export interface HollowDispatchValidationError {
  readonly field: string;
  readonly code: string;
  readonly message: string;
}

export type HollowDispatchValidationResult =
  | { readonly valid: true; readonly request: HollowDispatchRequest }
  | { readonly valid: false; readonly errors: readonly HollowDispatchValidationError[] };

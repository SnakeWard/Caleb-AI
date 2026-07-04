export type ISODateTimeString = string;
export type SemVerString = string;
export type Sha256Digest = string;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];

export interface JsonObject {
  readonly [key: string]: JsonValue;
}

export interface ArtifactHash {
  readonly artifact_id?: string;
  readonly path?: string;
  readonly hash: Sha256Digest;
  readonly algorithm: "sha256";
}

export type CalebStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "rejected"
  | "verified"
  | "blocked";

export type CalebSeverity = "info" | "warning" | "error" | "critical";

export type CalebActorType =
  | "user"
  | "orchestration_core"
  | "model"
  | "hollow"
  | "verified_return_path"
  | "ledger"
  | "change_guard"
  | "system";

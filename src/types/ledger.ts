import type {
  ArtifactHash,
  CalebActorType,
  CalebStatus,
  ISODateTimeString,
  JsonObject,
  JsonValue,
  SemVerString
} from "./common.js";
import type { CalebError, CalebWarning } from "./invocation.js";
import type { TrustTier, VerificationStatus } from "./trust.js";

export type LedgerActorType = CalebActorType;

export interface LedgerEntry {
  readonly ledger_id: string;
  readonly schema_version: SemVerString;
  readonly timestamp: ISODateTimeString;
  readonly task_id: string;
  readonly run_id: string;
  readonly trace_id: string;
  readonly actor_type: LedgerActorType;
  readonly actor_id: string;
  readonly actor_version: SemVerString | null;
  readonly activity: string;
  readonly invocation_id?: string;
  readonly hollow_id?: string;
  readonly started_at?: ISODateTimeString;
  readonly completed_at?: ISODateTimeString;
  readonly status: CalebStatus;
  readonly result: JsonValue;
  readonly warnings: readonly CalebWarning[];
  readonly errors: readonly CalebError[];
  readonly artifact_hashes: readonly ArtifactHash[];
  readonly provenance: JsonObject;
  readonly retryable: boolean;
  readonly verification_status: VerificationStatus;
  readonly trust_tier: TrustTier;
  readonly parent_refs: readonly string[];
  readonly artifact_refs: readonly string[];
}

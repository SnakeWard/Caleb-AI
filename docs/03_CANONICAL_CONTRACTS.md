# Canonical Contracts

This file freezes V1 naming and prevents schema drift. Contracts here are markdown-level contracts until implementation schemas are created.

## Naming Rules

The following field names MUST be used consistently:

- `hollow_id`
- `hollow_name`
- `hollow_version`
- `schema_version`
- `invocation_id`
- `execution_id`
- `task_id`
- `run_id`
- `trace_id`
- `caller`
- `requested_by`
- `approved_by`
- `input_type`
- `input_digest`
- `input_payload`
- `permissions`
- `execution_mode`
- `deterministic`
- `started_at`
- `completed_at`
- `status`
- `result`
- `result_units`
- `checks`
- `warnings`
- `errors`
- `artifact_hashes`
- `provenance`
- `ledger_refs`
- `retryable`
- `confidence_level`
- `verification_status`
- `trust_tier`

## TrustTier

| Tier | Meaning |
| --- | --- |
| T0 | Raw untrusted output |
| T1 | Schema-valid but not fully verified |
| T2 | Verified deterministic Hollow output |
| T3 | Verified output with provenance and policy clearance |
| T4 | Human-approved or externally authoritative result with full provenance |

If a model disagrees with a strict deterministic Hollow on a measurable claim, the Hollow result wins.

## HollowManifest

| Field | Required | Description |
| --- | --- | --- |
| `hollow_id` | yes | Stable machine identifier. |
| `hollow_name` | yes | Human-readable Hollow name. |
| `hollow_version` | yes | Hollow implementation version. |
| `schema_version` | yes | Manifest schema version. |
| `input_type` | yes | Declared input kind. |
| `permissions` | yes | Declared side-effect classes. |
| `execution_mode` | yes | Local deterministic mode unless explicitly authorized otherwise. |
| `deterministic` | yes | Whether repeated identical inputs should produce identical outputs. |
| `result_units` | no | Units for result values when applicable. |
| `checks` | no | Verification checks this Hollow performs. |

```json
{
  "hollow_id": "character_count",
  "hollow_name": "Character Count Hollow",
  "hollow_version": "0.1.0",
  "schema_version": "1.0",
  "input_type": "text",
  "permissions": ["none"],
  "execution_mode": "local",
  "deterministic": true,
  "result_units": "characters",
  "checks": ["schema_valid", "deterministic"]
}
```

## HollowInvocationRecord

| Field | Required | Description |
| --- | --- | --- |
| `invocation_id` | yes | Unique invocation identifier. |
| `task_id` | yes | Caller task identifier. |
| `run_id` | yes | Run identifier. |
| `trace_id` | yes | Trace identifier for cross-record correlation. |
| `hollow_id` | yes | Invoked Hollow. |
| `caller` | yes | Calling subsystem. |
| `requested_by` | yes | Requesting actor or process. |
| `approved_by` | no | Approver for side effects, if any. |
| `input_digest` | yes | Hash or digest of input. |
| `input_payload` | yes | Bounded input payload or reference. |
| `started_at` | yes | ISO timestamp. |
| `completed_at` | no | ISO timestamp when complete. |
| `status` | yes | Invocation status. |
| `ledger_refs` | no | Related Ledger entry identifiers. |

```json
{
  "invocation_id": "inv_001",
  "task_id": "task_001",
  "run_id": "run_001",
  "trace_id": "trace_001",
  "hollow_id": "character_count",
  "caller": "Orchestration Core",
  "requested_by": "Caleb AI",
  "approved_by": null,
  "input_digest": "sha256:example",
  "input_payload": { "text": "hello" },
  "started_at": "2026-06-06T00:00:00.000Z",
  "completed_at": "2026-06-06T00:00:00.010Z",
  "status": "completed",
  "ledger_refs": ["ledger_001"]
}
```

## EvidencePacket

| Field | Required | Description |
| --- | --- | --- |
| `invocation_id` | yes | Related Hollow invocation. |
| `result` | yes | Hollow output. |
| `result_units` | no | Units for measured result. |
| `checks` | yes | Checks performed. |
| `warnings` | yes | Non-fatal warnings. |
| `errors` | yes | Fatal or blocking errors. |
| `artifact_hashes` | yes | Hashes for produced or referenced artifacts. |
| `provenance` | yes | Source and execution provenance. |
| `confidence_level` | yes | Confidence statement for this packet. |
| `verification_status` | yes | Verification status. |
| `trust_tier` | yes | Trust tier from T0-T4. |

```json
{
  "invocation_id": "inv_001",
  "result": { "count": 5 },
  "result_units": "characters",
  "checks": ["schema_valid", "deterministic"],
  "warnings": [],
  "errors": [],
  "artifact_hashes": [],
  "provenance": { "hollow_id": "character_count", "hollow_version": "0.1.0" },
  "confidence_level": "high",
  "verification_status": "verified",
  "trust_tier": "T2"
}
```

## LedgerEntry

| Field | Required | Description |
| --- | --- | --- |
| `run_id` | yes | Run identifier. |
| `trace_id` | yes | Trace identifier. |
| `invocation_id` | no | Hollow invocation identifier when applicable. |
| `hollow_id` | no | Related Hollow when applicable. |
| `started_at` | yes | Start timestamp. |
| `completed_at` | no | Completion timestamp. |
| `status` | yes | Record status. |
| `result` | no | Bounded result summary. |
| `warnings` | yes | Warning list. |
| `errors` | yes | Error list. |
| `artifact_hashes` | yes | Artifact hashes. |
| `provenance` | yes | Provenance metadata. |
| `retryable` | yes | Whether the operation can be retried. |
| `verification_status` | yes | Verification status. |
| `trust_tier` | yes | Trust tier. |

```json
{
  "run_id": "run_001",
  "trace_id": "trace_001",
  "invocation_id": "inv_001",
  "hollow_id": "character_count",
  "started_at": "2026-06-06T00:00:00.000Z",
  "completed_at": "2026-06-06T00:00:00.010Z",
  "status": "completed",
  "result": { "count": 5 },
  "warnings": [],
  "errors": [],
  "artifact_hashes": [],
  "provenance": { "caller": "Orchestration Core" },
  "retryable": false,
  "verification_status": "verified",
  "trust_tier": "T2"
}
```

Guarded Role Rotation Ledger entries carry `execution_id` in both their bounded
`result` and `provenance` objects. `plan_id` identifies the plan; `execution_id`
identifies one attempt to execute it. Reconstruction MUST NOT combine records
from different execution identities.

## BusMessageEnvelope

| Field | Required | Description |
| --- | --- | --- |
| `schema_version` | yes | Envelope schema version. |
| `task_id` | yes | Task identifier. |
| `run_id` | yes | Run identifier. |
| `trace_id` | yes | Trace identifier. |
| `caller` | yes | Sender. |
| `requested_by` | yes | Requesting actor or process. |
| `hollow_id` | no | Target Hollow when applicable. |
| `input_type` | yes | Message input type. |
| `input_payload` | yes | Bounded payload or reference. |
| `permissions` | yes | Requested permissions. |

```json
{
  "schema_version": "1.0",
  "task_id": "task_001",
  "run_id": "run_001",
  "trace_id": "trace_001",
  "caller": "Orchestration Core",
  "requested_by": "Caleb AI",
  "hollow_id": "character_count",
  "input_type": "text",
  "input_payload": { "text": "hello" },
  "permissions": ["none"]
}
```

## SnapshotManifest

| Field | Required | Description |
| --- | --- | --- |
| `schema_version` | yes | Snapshot manifest schema version. |
| `run_id` | yes | Run that created the snapshot. |
| `trace_id` | yes | Trace identifier. |
| `requested_by` | yes | Requesting actor or process. |
| `approved_by` | no | Approver, if required. |
| `started_at` | yes | Start timestamp. |
| `completed_at` | no | Completion timestamp. |
| `status` | yes | Snapshot status. |
| `artifact_hashes` | yes | File and artifact hashes. |
| `provenance` | yes | Snapshot provenance. |
| `ledger_refs` | yes | Related Ledger entries. |

```json
{
  "schema_version": "1.0",
  "run_id": "run_002",
  "trace_id": "trace_002",
  "requested_by": "Caleb AI",
  "approved_by": "human",
  "started_at": "2026-06-06T00:00:00.000Z",
  "completed_at": "2026-06-06T00:00:01.000Z",
  "status": "completed",
  "artifact_hashes": [{ "path": "src/example.ts", "hash": "sha256:example" }],
  "provenance": { "snapshot_root": ".caleb/snapshots/snap_001" },
  "ledger_refs": ["ledger_002"]
}
```

## ThinkingEvent

Future UI contract only. This MUST NOT be treated as permission to build 3D Thinking Mode during V1.

| Field | Required | Description |
| --- | --- | --- |
| `schema_version` | yes | Event schema version. |
| `run_id` | yes | Run identifier. |
| `trace_id` | yes | Trace identifier. |
| `task_id` | yes | Task identifier. |
| `caller` | yes | Emitting subsystem. |
| `status` | yes | Event status. |
| `result` | no | Event payload summary. |
| `trust_tier` | no | Trust tier when tied to verified work. |

```json
{
  "schema_version": "1.0",
  "run_id": "run_001",
  "trace_id": "trace_001",
  "task_id": "task_001",
  "caller": "Orchestration Core",
  "status": "hollow_completed",
  "result": { "hollow_id": "character_count" },
  "trust_tier": "T2"
}
```

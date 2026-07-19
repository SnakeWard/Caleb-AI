# LIVE-F5 Truncation Evidence Preservation Report

- Status: Accepted offline
- Date: 2026-07-19
- Protocol/evidence commit: `c2bc73d`
- Pre-change snapshot: `snap_20260719T150613825Z_000429_milestone`
- Validation snapshot: `snap_20260719T151925913Z_000431_milestone`
- Full rollback anchor: Git commit `c2bc73d`

## Result

LIVE-F5 makes output-budget truncation a distinct evidence-preserving failure.
Anthropic and xAI normalized-success plumbing now supplies the observer with a
closed safe metadata object: adapter-computed output digest, finish reason, and
output-token count. No raw wire body, reasoning content, prompt, header, or
credential enters that metadata.

The live runtime stores bounded normalized text as T0 before truncation, JSON,
semantic-payload, canonical-envelope, or identity validation. The independently
computed M3 digest must equal the adapter digest. A mismatch remains the distinct
`live_output_digest_mismatch` failure.

After storage and digest binding, the observer returns stage
`output_truncated` before JSON parsing when either:

- provider finish/stop reason is `max_tokens`; or
- reported output tokens equal the role's `max_tokens` budget.

The runtime failure is `live_observer_output_truncated`. The rotation halts
fail-closed, the terminal Ledger retains real response telemetry and
`observed_store_digest`, and its artifact references include
`raw-output:<digest>`. Raw output text remains absent from Ledger JSON.

## Attempt-four finding

Attempt four is execution
`execution_73c1f247-f3db-4f58-b283-c5b9158bfaa5`. It used 291 input and exactly
512 output tokens, recorded USD 0.002851 and 5,897 ms, then stopped before Critic
as `json_parse`.

The old record contains output digest
`sha256:2a699062d4920fcda79c85962634b856be2a3757fdc0d82b60ee36d79e5ef812`
and a null observed-store digest. Metadata-only filesystem checks found neither
the matching content object nor T0 record. The bytes were never read or printed
and are unrecoverable; no historical backfill was attempted. The permanent
fixture is explicitly synthetic and does not impersonate those bytes.

## Budget amendment

| E1 boundary | Before | LIVE-F5 |
| --- | ---: | ---: |
| Planner `max_tokens` | 512 | 1,536 |
| Critic `max_tokens` | 512 | 1,536 |
| Run `max_total_tokens` | 4,096 | 8,192 |
| Run `max_spend_usd` | USD 0.05 | USD 0.05 |

The run ceiling includes input/context growth as well as two bounded outputs.
Timeouts, response bytes, invocation count, route, prompts, models, and E1 task
remain unchanged. E2 remains at its existing budgets and is not authorized.

## Permanent detectors

The synthetic truncation fixture and LIVE-F5 acceptance lock prove:

1. `max_tokens` finish reason preempts JSON parsing.
2. output-token equality independently preempts JSON parsing.
3. invalid JSON below budget with a non-truncation reason remains `json_parse`.
4. exact normalized bytes survive as T0 on observer failure.
5. adapter and M3 digests are independent matching witnesses.
6. digest mismatch fails distinctly while the raw T0 witness remains available.
7. real mocked HTTP-success usage, spend, timing, response ID, output/store
   digests, stage, and issue survive the failure path.
8. Planner truncation halts before Critic and terminal serialization contains no
   raw output.
9. E1 accepts 1,536/1,536 and 8,192, rejects 1,537/8,193, and retains USD 0.05.
10. Original no-observer provider suites remain unchanged and green.

## Scope proof

- No live provider invocation or E1 retry occurred.
- No CLI, dependency, package/config, credential closure, endpoint, header,
  request-body, fetch-site, retry, prompt, model, route, registry, strict
  semantic/RoleArtifact validator, raw-store implementation, or E2 change.
- Anthropic and xAI `invokeLive` transport functions are byte-identical to
  protocol base `c2bc73d`; egress remains exactly two fetch sites.
- Provider diffs are confined to normalized-success observer metadata/result
  plumbing. No-observer response behavior remains unchanged.

## Validation record

- Pre-change canonical baseline: 197 files / 3,173 tests, exit 0, 86.72 seconds.
- Initial focused LIVE-F5/LIVE-F4/gate/provider matrix: 5 files / 15 tests,
  exit 0.
- Widened LIVE-F5/LIVE-F4/LIVE-R1/F1/provider/seam/M3 matrix: 11 files /
  115 tests, exit 0.
- Canonical offline suite: 198 files / 3,176 tests, exit 0, 95.44 seconds.
- Governed `node ./node_modules/typescript/bin/tsc --noEmit`: exit 0.
- `npm run build`: exit 0.
- Catalogs: V1 13; Hollowcut 9.
- AUD-2 self-smoke: compliant/T2 with zero violations or forbidden hits.
- Prompt digests remain Planner
  `sha256:8407f826668198c871da24fa9db9323c588aa6805d392d317fef6be090884697`
  and Critic
  `sha256:27d169bbc002d2bcdcab89ac6df60f481e6311c015600883ed000a1f8031dd54`.
- Pre-change and validation snapshots are Ledgered, verified on disk, and contain
  all 18 configured captures. Canonical snapshot tests produced their normal
  isolated milestone records `000428` and `000430`.

## Verdict

`LIVE-F5 Truncation Evidence Preservation: Accepted — budget truncation is
identified before parsing, diagnosable failures retain their T0 witness, and E1
has enough bounded output room without moving the spend ceiling.`

LIVE-F5 does not authorize a provider call. A fifth E1 attempt requires Pat's
fresh host-shell authorization under the standing credential-tree doctrine.

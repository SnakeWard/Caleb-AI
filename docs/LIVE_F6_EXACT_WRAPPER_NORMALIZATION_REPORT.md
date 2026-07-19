# LIVE-F6 Exact Wrapper Normalization Report

- Status: Accepted offline
- Date: 2026-07-19
- Protocol/evidence commits: `a7f330b`, formatting lock `7b309ca`
- Pre-change snapshot: `snap_20260719T160902602Z_000433_milestone`
- Validation snapshot: `snap_20260719T162427243Z_000435_milestone`
- Full rollback anchor: Git commit `7b309ca`

## Result

LIVE-F6 admits exactly one evidenced provider presentation wrapper: a complete
Markdown fence whose opening line is exactly `\`\`\`json` or `\`\`\``, whose
closing line is exactly `\`\`\``, and whose entire inner document is already one
strictly parseable JSON object. Any near miss returns byte-identically to the
existing parser and is rejected under the existing taxonomy.

The observer order is now:

1. bound and store raw normalized text as T0;
2. verify the independent adapter/store digests match;
3. apply LIVE-F5 truncation detection;
4. evaluate the exact fence predicate;
5. parse the resulting complete document;
6. run the unchanged strict semantic payload validator;
7. construct and validate the authoritative runtime envelope.

Raw fenced bytes remain the T0 artifact and retain the provider digest. Caleb's
canonical artifact remains linked through `derived_from`. Applying the bounded
transform records
`observer_normalization_stage: markdown_fence_unwrapped` on success or any later
failure. No normalized/raw text enters results, errors, Ledger JSON, or safe
telemetry.

## Attempt-five evidence

Execution `execution_0caeae10-2427-46e2-b2b0-6a8d4e1d00d8` stored T0 digest
`sha256:679eee9d6bdb9989eb820c155e6dec6ab75b460819794d7fa8c4c6ea34e25b40`.
The authorized diagnostic found 4,543 bytes with one exact leading `json` fence,
one exact closing fence, and no BOM, preamble, trailing prose, or outer
whitespace. Removing only those complete lines yields one strict JSON object;
its semantic shape passes the unchanged payload validator with zero issues. No
payload prose is reproduced here.

## Prompt digest lock

| Role | Before LIVE-F6 | LIVE-F6 | Change |
| --- | --- | --- | --- |
| Planner template | `sha256:8407f826668198c871da24fa9db9323c588aa6805d392d317fef6be090884697` | `sha256:f32675859e07243a7cf0cd8e743537f4c975826ea7bf684348ed128792489003` | hardened JSON-only instruction |
| Critic template | `sha256:27d169bbc002d2bcdcab89ac6df60f481e6311c015600883ed000a1f8031dd54` | `sha256:27d169bbc002d2bcdcab89ac6df60f481e6311c015600883ed000a1f8031dd54` | byte-identical |

Both E1 and E2 fixtures pin the new shared Planner template digest. The Planner
now requires `{` and `}` as the first/last non-whitespace characters, forbids
backticks, and forbids preamble/trailing commentary. The attempt-five Ledger's
`sha256:c7f5e7f57254e7f9ce05655ffc37a6d5259d81b2dd226d84769ae17e498ca162`
is the rendered, task-bound invocation prompt digest, not the old template-file
digest. LIVE-F6 made no provider invocation, so it cannot claim a new rendered
invocation digest.

## Detector lock

The permanent fixtures and acceptance tests prove:

1. exact tagged and untagged fences unwrap only after the entire inner object
   parses;
2. unfenced valid JSON is byte-identical and records no stage;
3. outer whitespace is admitted without changing inner bytes;
4. preamble and braces in prose are not searched or extracted;
5. missing closing fence, wrong language tag, non-whitespace after the closing
   fence, and two inner JSON objects all remain on strict `json_parse` failure;
6. arrays and malformed objects are not repaired or promoted;
7. F5 `output_truncated` classification occurs before normalization;
8. strict payload rejection after an unwrap retains the applied stage and raw T0
   reference in the terminal Ledger;
9. success invocation and terminal records retain the stage, and LIVE-F2
   reconstruction preserves it by execution instance;
10. historical invocation records with no optional stage still reconstruct as
    null, while an unknown stage value fails reconstruction closed;
11. the four LIVE-F4 diagnostic stages, F5 T0/digest/truncation path, M3 lineage,
    redaction, and original observer/no-observer adapter suites remain green.

## Standing doctrine

The operating contract now prohibits speculative normalization. The binding
forbidden list is recorded verbatim:

- Searching for arbitrary brace pairs
- Selecting the first parseable JSON substring
- Removing trailing prose
- Repairing commas, quotes, braces, or escapes
- Validator loosening

No preamble handler or fuzzy JSON substring extraction exists.

## Scope proof

- No live provider invocation or E1 retry occurred.
- No provider, model-boundary, raw-store, role-validator, live-gate, bridge, CLI,
  dependency, package/config, timeout, model, route, registry, or budget file
  changed.
- Anthropic and xAI transport files are byte-identical to `7b309ca`; the egress
  pin remains exactly two fetch sites.
- Critic prompt is byte-identical. Planner prompt and its two fixture digests are
  the only prompt-surface changes.
- No historical Ledger record was rewritten; validation records are append-only.

## Validation record

- Pre-change canonical baseline: 198 files / 3,176 tests, exit 0, 107.66 seconds.
- Initial focused LIVE-F6/F5/F4 matrix: 4 files / 28 tests, exit 0.
- Widened LIVE-F6/F5/F4/provider/gate/seam/M3 matrix: 15 files / 119 tests,
  exit 0.
- Canonical offline suite: 200 files / 3,199 tests, exit 0, 100.89 seconds.
- Governed `node ./node_modules/typescript/bin/tsc --noEmit`: exit 0.
- `npm run build`: exit 0.
- Catalogs: V1 13; Hollowcut 9.
- AUD-2 self-smoke: compliant/T2 across 19 paths with zero violations,
  forbidden hits, unlisted changes, or deletions.
- Pre-change and validation snapshots are Ledgered, independently verified on
  disk, and contain all 18 configured captures. Canonical baseline/final runs
  produced their normal test milestone records `000432` and `000434`.

## Verdict

`LIVE-F6 Exact Wrapper Normalization: Accepted — Caleb admits one evidenced
presentation wrapper without searching for content, preserves raw T0 and strict
validators, and records every applied unwrap as reconstructable safe telemetry.`

LIVE-F6 does not authorize a provider call. STOP.

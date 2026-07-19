import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const recordPath = "examples/audit/time1-process-spawn-measurements.valid.json";
const record = JSON.parse(await readFile(recordPath, "utf8"));

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

function fail(message) {
  throw new Error(`TIME-1 timeout-budget guard failed: ${message}`);
}

const config = await readFile(record.global_config.path);
if (sha256(config) !== record.global_config.sha256) {
  fail(`${record.global_config.path} changed`);
}

for (const file of record.adjusted_files) {
  const source = await readFile(file.path, "utf8");
  const count = source.split(file.approved_timeout_token).length - 1;
  if (count !== file.approved_timeout_count) {
    fail(`${file.path} has ${count} approved timeout tokens; expected ${file.approved_timeout_count}`);
  }
  let normalized = source
    .split(file.approved_timeout_token)
    .join("")
    .replaceAll("\r\n", "\n")
    .replace(/\n+$/, "");
  if (file.pre_adjustment_terminal_newline) {
    normalized += "\n";
  }
  if (sha256(normalized) !== file.pre_adjustment_sha256) {
    fail(`${file.path} contains a change other than the approved timeout tokens`);
  }
}

const seenTests = new Set();
for (const adjustment of record.adjustments) {
  if (seenTests.has(adjustment.test)) {
    fail(`duplicate test record: ${adjustment.test}`);
  }
  seenTests.add(adjustment.test);
  if (adjustment.serial_pre_adjustment_status !== "passed") {
    fail(`${adjustment.test} did not pass before adjustment`);
  }
  if (!(adjustment.serial_duration_ms > 0 && adjustment.serial_duration_ms < adjustment.timeout_budget_ms)) {
    fail(`${adjustment.test} has an invalid measured duration or budget`);
  }
  if (adjustment.timeout_budget_ms !== 30_000) {
    fail(`${adjustment.test} does not use the authorized 30-second budget`);
  }
  const isScopeExtension = adjustment.scope_basis === "authorized_post_pass_scope_extension";
  const evidenceList = isScopeExtension
    ? adjustment.scope_extension_evidence
    : adjustment.process_spawn_evidence;
  if (!Array.isArray(evidenceList) || evidenceList.length === 0) {
    fail(`${adjustment.test} has no eligibility evidence`);
  }
  if (isScopeExtension && adjustment.test !== "minimal CLI > create-milestone-snapshot is recognized as a command (parse level)") {
    fail(`unauthorized TIME-1 scope extension: ${adjustment.test}`);
  }
  for (const evidence of evidenceList) {
    const source = await readFile(evidence.path, "utf8");
    if (!source.includes(evidence.contains)) {
      fail(`${adjustment.test} eligibility evidence is absent from ${evidence.path}`);
    }
  }
}

const declaredTimeouts = record.adjusted_files.reduce(
  (sum, file) => sum + file.approved_timeout_count,
  0
);
if (seenTests.size !== declaredTimeouts) {
  fail(`measurement count ${seenTests.size} does not match timeout count ${declaredTimeouts}`);
}

process.stdout.write(
  JSON.stringify({
    ok: true,
    pass_id: record.pass_id,
    adjusted_tests: seenTests.size,
    global_config_unchanged: true,
    assertion_changes: 0
  }) + "\n"
);

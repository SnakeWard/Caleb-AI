import type { CalebSeverity } from "../../../types/common.js";
import type { CalebWarning } from "../../../types/invocation.js";
import type { HollowImplementation } from "../../runnerTypes.js";
import { codeSafetyScanManifest as manifest } from "./codeHollowManifests.js";
import type {
  CodeSafetyFinding,
  CodeSafetyScanInput,
  CodeSafetyScanResult
} from "./codeHollowTypes.js";

interface SafetyRule {
  readonly rule_id: string;
  readonly severity: CalebSeverity;
  readonly pattern: string;
  readonly matcher: RegExp;
}

const BUILT_IN_RULES: SafetyRule[] = [
  { rule_id: "eval_function", severity: "critical", pattern: "eval(", matcher: /\beval\s*\(/ },
  { rule_id: "function_constructor", severity: "critical", pattern: "new Function(", matcher: /\bnew\s+Function\s*\(/ },
  { rule_id: "child_process", severity: "critical", pattern: "child_process", matcher: /\bchild_process\b/ },
  { rule_id: "child_process", severity: "critical", pattern: "exec(", matcher: /\bexec\s*\(/ },
  { rule_id: "child_process", severity: "critical", pattern: "execSync(", matcher: /\bexecSync\s*\(/ },
  { rule_id: "child_process", severity: "critical", pattern: "spawn(", matcher: /\bspawn\s*\(/ },
  { rule_id: "child_process", severity: "critical", pattern: "spawnSync(", matcher: /\bspawnSync\s*\(/ },
  { rule_id: "child_process", severity: "critical", pattern: "fork(", matcher: /\bfork\s*\(/ },
  { rule_id: "env_access", severity: "warning", pattern: "process.env", matcher: /\bprocess\.env\b/ },
  { rule_id: "destructive_fs", severity: "critical", pattern: "fs.rmSync(", matcher: /\bfs\.rmSync\s*\(/ },
  { rule_id: "destructive_fs", severity: "critical", pattern: "fs.rm(", matcher: /\bfs\.rm\s*\(/ },
  { rule_id: "destructive_fs", severity: "critical", pattern: "rm -rf", matcher: /\brm\s+-rf\b/ },
  { rule_id: "network_call", severity: "warning", pattern: "fetch(", matcher: /\bfetch\s*\(/ },
  { rule_id: "network_call", severity: "warning", pattern: "XMLHttpRequest", matcher: /\bXMLHttpRequest\b/ },
  { rule_id: "browser_storage_or_cookie", severity: "warning", pattern: "localStorage", matcher: /\blocalStorage\b/ },
  { rule_id: "browser_storage_or_cookie", severity: "warning", pattern: "document.cookie", matcher: /\bdocument\.cookie\b/ },
  { rule_id: "unsafe_html_injection", severity: "warning", pattern: "innerHTML =", matcher: /\binnerHTML\s*=/ },
  {
    rule_id: "unsafe_html_injection",
    severity: "warning",
    pattern: "dangerouslySetInnerHTML",
    matcher: /\bdangerouslySetInnerHTML\b/
  },
  { rule_id: "shell_true", severity: "critical", pattern: "shell: true", matcher: /\bshell\s*:\s*true\b/ }
];

export const codeSafetyScanManifest = manifest;

export function scanCodeSafety(input: CodeSafetyScanInput): { result: CodeSafetyScanResult; warnings: CalebWarning[] } {
  const caseSensitive = input.case_sensitive ?? false;
  const requestedRules = input.enabled_rules ?? [...new Set(BUILT_IN_RULES.map((rule) => rule.rule_id))];
  const knownRuleIds = new Set(BUILT_IN_RULES.map((rule) => rule.rule_id));
  const unknownRules = requestedRules.filter((ruleId) => !knownRuleIds.has(ruleId));
  const enabled = new Set(requestedRules.filter((ruleId) => knownRuleIds.has(ruleId)));
  const findings: CodeSafetyFinding[] = [];

  input.text.split(/\r?\n|\r/).forEach((line, index) => {
    const sourceLine = caseSensitive ? line : line.toLowerCase();
    for (const rule of BUILT_IN_RULES) {
      if (!enabled.has(rule.rule_id)) continue;
      const matcher = caseSensitive ? rule.matcher : new RegExp(rule.matcher.source, "i");
      if (matcher.test(sourceLine)) {
        findings.push({
          rule_id: rule.rule_id,
          severity: rule.severity,
          pattern: rule.pattern,
          line_number: index + 1,
          line_excerpt: line.trim().slice(0, 160)
        });
      }
    }
  });

  const warnings: CalebWarning[] = [];
  if (findings.length > 0) {
    warnings.push({
      warning_id: "code_safety_signal_detected",
      message: `${findings.length} code safety signal(s) detected.`,
      severity: "warning"
    });
  }
  for (const ruleId of unknownRules) {
    warnings.push({
      warning_id: "unknown_rule_requested",
      message: `Unknown code safety rule requested: ${ruleId}.`,
      severity: "warning"
    });
  }
  if (input.text.length === 0) {
    warnings.push({ warning_id: "empty_text", message: "Input text is empty.", severity: "warning" });
  }

  return {
    result: {
      finding_count: findings.length,
      findings,
      rules_checked: [...enabled]
    },
    warnings
  };
}

export const codeSafetyScanImplementation: HollowImplementation = ({ input_payload }) => {
  const input = parseCodeSafetyScanInput(input_payload);
  const scan = scanCodeSafety(input);

  return {
    result: scan.result,
    result_units: "findings",
    checks: [
      { check_id: "input_text_present", label: "Input Text Present", status: "completed", severity: "info" },
      {
        check_id: "code_safety_scan_completed",
        label: "Code Safety Scan Completed",
        status: "completed",
        severity: "info"
      }
    ],
    warnings: scan.warnings,
    artifact_hashes: [],
    confidence_level: "deterministic_code_safety_scan"
  };
};

function parseCodeSafetyScanInput(input: unknown): CodeSafetyScanInput {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new Error("Code Safety Scan Hollow requires an object input payload.");
  }
  const candidate = input as Partial<CodeSafetyScanInput>;
  if (typeof candidate.text !== "string") {
    throw new Error("Code Safety Scan Hollow requires input_payload.text as a string.");
  }
  if (candidate.case_sensitive !== undefined && typeof candidate.case_sensitive !== "boolean") {
    throw new Error("Code Safety Scan Hollow case_sensitive must be boolean when provided.");
  }
  if (
    candidate.enabled_rules !== undefined &&
    (!Array.isArray(candidate.enabled_rules) || candidate.enabled_rules.some((rule) => typeof rule !== "string"))
  ) {
    throw new Error("Code Safety Scan Hollow enabled_rules must be an array of strings when provided.");
  }
  return {
    text: candidate.text,
    ...(candidate.enabled_rules === undefined ? {} : { enabled_rules: candidate.enabled_rules }),
    ...(candidate.case_sensitive === undefined ? {} : { case_sensitive: candidate.case_sensitive })
  };
}

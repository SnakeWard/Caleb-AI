import type { VerificationResult } from "../verification/index.js";
import type {
  ArtifactHash,
  CalebError,
  CalebWarning,
  EvidencePacket,
  HollowInvocationRecord,
  JsonObject,
  JsonValue,
  LedgerEntry,
  TrustTier
} from "../types/index.js";
import type {
  CalebReport,
  CalebReportSection,
  CalebReportSectionItem,
  ReportInput,
  ReportIssueSummary
} from "./reportTypes.js";

const TRUST_TIERS: readonly TrustTier[] = ["T0", "T1", "T2", "T3", "T4"];

let reportCounter = 0;

export function createReportId(prefix = "report"): string {
  reportCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${reportCounter.toString().padStart(6, "0")}`;
}

export function buildCalebReport(input: ReportInput): CalebReport {
  const invocations = [...(input.invocations ?? [])];
  const verificationResults = [...(input.verification_results ?? [])];
  const evidencePackets = [...(input.evidence_packets ?? [])];
  const ledgerEntries = [...(input.ledger_entries ?? [])];

  const warnings = collectWarnings(invocations, verificationResults, evidencePackets, ledgerEntries);
  const errors = collectErrors(invocations, verificationResults, evidencePackets, ledgerEntries);
  const trustTierCounts = createTrustTierCounts();
  const statusCounts: Record<string, number> = {};

  for (const packet of evidencePackets) {
    trustTierCounts[packet.trust_tier] += 1;
  }
  for (const entry of ledgerEntries) {
    trustTierCounts[entry.trust_tier] += 1;
    increment(statusCounts, entry.status);
  }
  for (const invocation of invocations) {
    increment(statusCounts, invocation.status);
  }

  const highestTrustTier = findHighestTrustTier(trustTierCounts);
  const ledgerRefs = uniqueStrings([
    ...evidencePackets.flatMap((packet) => packet.ledger_refs),
    ...ledgerEntries.map((entry) => entry.ledger_id),
    ...ledgerEntries.flatMap((entry) => entry.parent_refs)
  ]);
  const artifactRefs = uniqueStrings([
    ...invocations.flatMap((record) => artifactHashRefs(record.artifact_hashes)),
    ...evidencePackets.flatMap((packet) => artifactHashRefs(packet.artifact_hashes)),
    ...ledgerEntries.flatMap((entry) => [
      ...artifactHashRefs(entry.artifact_hashes),
      ...entry.artifact_refs
    ])
  ]);

  const inferredRunId = input.run_id ?? inferSingleValue([
    ...invocations.map((record) => record.run_id),
    ...evidencePackets.map((packet) => packet.run_id),
    ...ledgerEntries.map((entry) => entry.run_id)
  ]);
  const inferredTraceId = input.trace_id ?? inferSingleValue([
    ...invocations.map((record) => record.trace_id),
    ...evidencePackets.map((packet) => packet.trace_id),
    ...ledgerEntries.map((entry) => entry.trace_id)
  ]);
  const inferredTaskId = input.task_id ?? inferSingleValue([
    ...invocations.map((record) => record.task_id),
    ...evidencePackets.map((packet) => packet.task_id),
    ...ledgerEntries.map((entry) => entry.task_id)
  ]);

  const ambiguous = {
    run_ids: collectAmbiguousValues([
      ...invocations.map((record) => record.run_id),
      ...evidencePackets.map((packet) => packet.run_id),
      ...ledgerEntries.map((entry) => entry.run_id)
    ]),
    trace_ids: collectAmbiguousValues([
      ...invocations.map((record) => record.trace_id),
      ...evidencePackets.map((packet) => packet.trace_id),
      ...ledgerEntries.map((entry) => entry.trace_id)
    ]),
    task_ids: collectAmbiguousValues([
      ...invocations.map((record) => record.task_id),
      ...evidencePackets.map((packet) => packet.task_id),
      ...ledgerEntries.map((entry) => entry.task_id)
    ])
  };
  const ambiguityWarnings = createAmbiguityWarnings(input, ambiguous);
  const allWarnings = [...warnings, ...ambiguityWarnings];

  const sourceCounts = {
    invocations: invocations.length,
    verification_results: verificationResults.length,
    evidence_packets: evidencePackets.length,
    ledger_entries: ledgerEntries.length
  };
  const stats = {
    invocation_count: invocations.length,
    evidence_packet_count: evidencePackets.length,
    ledger_entry_count: ledgerEntries.length,
    warning_count: allWarnings.length,
    error_count: errors.length,
    trust_tier_counts: trustTierCounts,
    status_counts: statusCounts,
    highest_trust_tier: highestTrustTier
  };
  const summary = buildSummary(stats);
  const sections = buildSections({
    summary,
    invocations,
    verificationResults,
    evidencePackets,
    ledgerEntries,
    warnings: allWarnings,
    errors,
    provenance: {
      builder: "CalebReportBuilder",
      source_counts: sourceCounts,
      ambiguous_ids: jsonObjectFromAmbiguous(ambiguous),
      notes: input.notes ?? null
    }
  });

  const baseReport = {
    report_id: input.report_id ?? createReportId("report"),
    schema_version: "1.0.0",
    generated_at: input.generated_at ?? new Date().toISOString(),
    title: input.title ?? "Caleb AI Report",
    summary,
    sections,
    stats,
    warnings: allWarnings,
    errors,
    source_counts: sourceCounts,
    ledger_refs: ledgerRefs,
    artifact_refs: artifactRefs,
    provenance: {
      builder: "CalebReportBuilder",
      report_doctrine: "Reports explain what happened. They do not invent what happened.",
      source_counts: sourceCounts,
      ambiguous_ids: jsonObjectFromAmbiguous(ambiguous),
      notes: input.notes ?? null
    }
  };

  return {
    ...baseReport,
    ...(inferredRunId ? { run_id: inferredRunId } : {}),
    ...(inferredTraceId ? { trace_id: inferredTraceId } : {}),
    ...(inferredTaskId ? { task_id: inferredTaskId } : {})
  };
}

function buildSummary(stats: CalebReport["stats"]): string {
  const warningPhrase = stats.warning_count > 0 ? "warnings present" : "no warnings";
  const errorPhrase = stats.error_count > 0 ? "errors present" : "no errors";
  const highestTrust = stats.highest_trust_tier ?? "none";

  return [
    `${stats.invocation_count} invocation(s) supplied`,
    `${stats.evidence_packet_count} evidence packet(s) supplied`,
    `${stats.ledger_entry_count} ledger entr(ies) supplied`,
    `highest trust tier seen: ${highestTrust}`,
    `${warningPhrase}`,
    `${errorPhrase}`
  ].join("; ");
}

function buildSections(input: {
  readonly summary: string;
  readonly invocations: readonly HollowInvocationRecord[];
  readonly verificationResults: readonly VerificationResult[];
  readonly evidencePackets: readonly EvidencePacket[];
  readonly ledgerEntries: readonly LedgerEntry[];
  readonly warnings: readonly ReportIssueSummary[];
  readonly errors: readonly ReportIssueSummary[];
  readonly provenance: JsonObject;
}): readonly CalebReportSection[] {
  return [
    {
      section_id: "summary",
      title: "Summary",
      kind: "summary",
      content: input.summary
    },
    {
      section_id: "hollow_invocations",
      title: "Hollow Invocations",
      kind: "hollow_invocations",
      content: `${input.invocations.length} Hollow invocation record(s).`,
      items: input.invocations.map((record) => ({
        invocation_id: record.invocation_id,
        hollow_id: record.hollow_id,
        status: record.status,
        trust_tier: record.trust_tier,
        verification_status: record.verification_status,
        ledger_refs: [...record.ledger_refs]
      }))
    },
    {
      section_id: "verification_results",
      title: "Verification Results",
      kind: "verification_results",
      content: `${input.verificationResults.length} verification result(s).`,
      items: input.verificationResults.map((result) => ({
        decision: result.decision,
        trust_tier: result.trust_tier,
        verification_status: result.verification_status,
        can_model_consume: result.can_model_consume,
        can_persist_as_truth: result.can_persist_as_truth,
        can_trigger_side_effect: result.can_trigger_side_effect
      }))
    },
    {
      section_id: "evidence_packets",
      title: "Evidence Packets",
      kind: "evidence_packets",
      content: `${input.evidencePackets.length} evidence packet(s).`,
      items: input.evidencePackets.map((packet) => ({
        invocation_id: packet.invocation_id,
        hollow_id: packet.hollow_id,
        trust_tier: packet.trust_tier,
        verification_status: packet.verification_status,
        can_model_consume: packet.can_model_consume,
        ledger_refs: [...packet.ledger_refs]
      }))
    },
    {
      section_id: "ledger_entries",
      title: "Ledger Entries",
      kind: "ledger_entries",
      content: `${input.ledgerEntries.length} Ledger entr(ies).`,
      items: input.ledgerEntries.map((entry) => ({
        ledger_id: entry.ledger_id,
        actor_type: entry.actor_type,
        activity: entry.activity,
        status: entry.status,
        trust_tier: entry.trust_tier,
        verification_status: entry.verification_status
      }))
    },
    {
      section_id: "warnings",
      title: "Warnings",
      kind: "warnings",
      content: `${input.warnings.length} warning(s).`,
      items: input.warnings.map(issueToItem)
    },
    {
      section_id: "errors",
      title: "Errors",
      kind: "errors",
      content: `${input.errors.length} error(s).`,
      items: input.errors.map(issueToItem)
    },
    {
      section_id: "provenance",
      title: "Provenance",
      kind: "provenance",
      content: "Report generated from supplied local Caleb AI records.",
      items: [input.provenance as CalebReportSectionItem]
    }
  ];
}

function collectWarnings(
  invocations: readonly HollowInvocationRecord[],
  verificationResults: readonly VerificationResult[],
  evidencePackets: readonly EvidencePacket[],
  ledgerEntries: readonly LedgerEntry[]
): ReportIssueSummary[] {
  return [
    ...invocations.flatMap((record) => record.warnings.map((warning) => warningToIssue("invocation", warning))),
    ...verificationResults.flatMap((result) =>
      result.warnings.map((warning) => warningToIssue("verification_result", warning))
    ),
    ...evidencePackets.flatMap((packet) =>
      packet.warnings.map((warning) => warningToIssue("evidence_packet", warning))
    ),
    ...ledgerEntries.flatMap((entry) => entry.warnings.map((warning) => warningToIssue("ledger_entry", warning)))
  ];
}

function collectErrors(
  invocations: readonly HollowInvocationRecord[],
  verificationResults: readonly VerificationResult[],
  evidencePackets: readonly EvidencePacket[],
  ledgerEntries: readonly LedgerEntry[]
): ReportIssueSummary[] {
  return [
    ...invocations.flatMap((record) => record.errors.map((error) => errorToIssue("invocation", error))),
    ...verificationResults.flatMap((result) =>
      result.errors.map((error) => ({
        source: "verification_result",
        id: error.code,
        message: error.message,
        severity: "error"
      }))
    ),
    ...evidencePackets.flatMap((packet) => packet.errors.map((error) => errorToIssue("evidence_packet", error))),
    ...ledgerEntries.flatMap((entry) => entry.errors.map((error) => errorToIssue("ledger_entry", error)))
  ];
}

function warningToIssue(source: string, warning: CalebWarning): ReportIssueSummary {
  return {
    source,
    id: warning.warning_id,
    message: warning.message,
    severity: warning.severity
  };
}

function errorToIssue(source: string, error: CalebError): ReportIssueSummary {
  return {
    source,
    id: error.error_id,
    message: error.message,
    severity: error.severity
  };
}

function issueToItem(issue: ReportIssueSummary): CalebReportSectionItem {
  return {
    source: issue.source,
    id: issue.id,
    message: issue.message,
    severity: issue.severity
  };
}

function createAmbiguityWarnings(
  input: ReportInput,
  ambiguous: {
    readonly run_ids: readonly string[];
    readonly trace_ids: readonly string[];
    readonly task_ids: readonly string[];
  }
): ReportIssueSummary[] {
  const warnings: ReportIssueSummary[] = [];
  if (!input.run_id && ambiguous.run_ids.length > 1) {
    warnings.push(ambiguityWarning("run_id", ambiguous.run_ids));
  }
  if (!input.trace_id && ambiguous.trace_ids.length > 1) {
    warnings.push(ambiguityWarning("trace_id", ambiguous.trace_ids));
  }
  if (!input.task_id && ambiguous.task_ids.length > 1) {
    warnings.push(ambiguityWarning("task_id", ambiguous.task_ids));
  }
  return warnings;
}

function ambiguityWarning(field: string, values: readonly string[]): ReportIssueSummary {
  return {
    source: "report_builder",
    id: `multiple_${field}s`,
    message: `Multiple ${field} values were supplied: ${values.join(", ")}.`,
    severity: "warning"
  };
}

function createTrustTierCounts(): Record<TrustTier, number> {
  return {
    T0: 0,
    T1: 0,
    T2: 0,
    T3: 0,
    T4: 0
  };
}

function findHighestTrustTier(counts: Record<TrustTier, number>): TrustTier | null {
  for (const tier of [...TRUST_TIERS].reverse()) {
    if (counts[tier] > 0) {
      return tier;
    }
  }
  return null;
}

function increment(counts: Record<string, number>, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

function inferSingleValue(values: readonly string[]): string | undefined {
  const unique = uniqueStrings(values.filter((value) => value.length > 0));
  return unique.length === 1 ? unique[0] : undefined;
}

function collectAmbiguousValues(values: readonly string[]): readonly string[] {
  const unique = uniqueStrings(values.filter((value) => value.length > 0));
  return unique.length > 1 ? unique : [];
}

function uniqueStrings(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function artifactHashRefs(hashes: readonly ArtifactHash[]): string[] {
  return hashes.map((hash) => hash.artifact_id ?? hash.path ?? hash.hash);
}

function jsonObjectFromAmbiguous(ambiguous: {
  readonly run_ids: readonly string[];
  readonly trace_ids: readonly string[];
  readonly task_ids: readonly string[];
}): JsonObject {
  return {
    run_ids: [...ambiguous.run_ids],
    trace_ids: [...ambiguous.trace_ids],
    task_ids: [...ambiguous.task_ids]
  };
}

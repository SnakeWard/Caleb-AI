export type LiveRoleOutputNormalizationStage = "markdown_fence_unwrapped";

export interface LiveRoleOutputNormalizationResult {
  readonly normalized_text: string;
  readonly normalization_stage: LiveRoleOutputNormalizationStage | null;
}

interface CompleteLine {
  readonly content: string;
  readonly start: number;
  readonly end: number;
}

/**
 * Removes only an exact whole-document Markdown JSON fence whose complete
 * inner document is already one strictly parseable JSON object.
 *
 * This is a presentation allowlist, not a recovery parser. Any near miss is
 * returned byte-identically for the caller's strict parser to reject.
 */
export function normalizeLiveRoleOutput(
  outputText: string
): LiveRoleOutputNormalizationResult {
  const lines = completeLines(outputText);
  const nonWhitespaceLines = lines.filter((line) => line.content.trim().length > 0);
  if (nonWhitespaceLines.length < 3) {
    return unchanged(outputText);
  }

  const opening = nonWhitespaceLines[0]!;
  const closing = nonWhitespaceLines[nonWhitespaceLines.length - 1]!;
  if (
    (opening.content !== "```json" && opening.content !== "```") ||
    closing.content !== "```" ||
    opening.start >= closing.start
  ) {
    return unchanged(outputText);
  }

  const inner = outputText.slice(opening.end, closing.start);
  const bounded = inner.trim();
  if (!bounded.startsWith("{") || !bounded.endsWith("}")) {
    return unchanged(outputText);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(inner) as unknown;
  } catch {
    return unchanged(outputText);
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return unchanged(outputText);
  }

  return {
    normalized_text: inner,
    normalization_stage: "markdown_fence_unwrapped"
  };
}

function unchanged(outputText: string): LiveRoleOutputNormalizationResult {
  return {
    normalized_text: outputText,
    normalization_stage: null
  };
}

function completeLines(text: string): readonly CompleteLine[] {
  if (text.length === 0) {
    return [{ content: "", start: 0, end: 0 }];
  }
  const lines: CompleteLine[] = [];
  let start = 0;
  while (start < text.length) {
    let contentEnd = start;
    while (
      contentEnd < text.length &&
      text[contentEnd] !== "\r" &&
      text[contentEnd] !== "\n"
    ) {
      contentEnd += 1;
    }
    let end = contentEnd;
    if (text[end] === "\r" && text[end + 1] === "\n") {
      end += 2;
    } else if (text[end] === "\r" || text[end] === "\n") {
      end += 1;
    }
    lines.push({ content: text.slice(start, contentEnd), start, end });
    start = end;
  }
  return lines;
}

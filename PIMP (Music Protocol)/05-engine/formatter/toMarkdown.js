function formatStructureList(structure) {
  return structure.map((item) => `- [${item}]`).join("\n");
}

function formatWarnings(warnings) {
  return (warnings || []).map((warning) => `- ${warning}`).join("\n");
}

function toMarkdown(output) {
  return [
    "# P.I.M.P Output Package",
    "",
    "## Title",
    output.title,
    "",
    "## Concept Summary",
    output.concept_summary,
    "",
    "## Signal Stack Summary",
    "",
    "### Identity",
    output.signal_stack.identity,
    "",
    "### Emotional Arc",
    output.signal_stack.emotional_arc,
    "",
    "### Genre Framework",
    output.signal_stack.genre_framework,
    "",
    "### Production Layer",
    output.signal_stack.production_layer,
    "",
    "### Structure",
    formatStructureList(output.signal_stack.structure),
    "",
    "## Lyrics",
    "",
    output.lyrics,
    "",
    "## Style Prompt",
    output.style_prompt,
    "",
    "## Validation Notes",
    `- formatting_pass: ${output.validation_notes.formatting_pass}`,
    `- style_limit_pass: ${output.validation_notes.style_limit_pass}`,
    `- anti_trope_pass: ${output.validation_notes.anti_trope_pass}`,
    "- warnings:",
    formatWarnings(output.validation_notes.warnings)
  ].join("\n");
}

module.exports = {
  toMarkdown
};

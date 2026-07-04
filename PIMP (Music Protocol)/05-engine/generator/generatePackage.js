const { buildSignalStack, deriveConceptProfile } = require("./buildSignalStack");
const { generateLyrics } = require("./generateLyrics");
const { generateStylePrompt } = require("./generateStylePrompt");
const { getSongBlueprint } = require("./songBlueprints");
const { toMarkdown } = require("../formatter/toMarkdown");
const { buildValidationReport } = require("../validator/validateOutput");

function createConceptSummary(input, signalStack) {
  const profile = deriveConceptProfile(input);
  const blueprint = getSongBlueprint(input);

  if (blueprint.conceptProfile.summary) {
    return blueprint.conceptProfile.summary;
  }

  return [
    `Identity: ${signalStack.identity}.`,
    `Tension: ${profile.dominantTension}.`,
    `Release: ${profile.releaseMode}.`
  ].join(" ");
}

function createOutputObject(input, signalStack, lyrics, stylePromptResult, validationReport) {
  return {
    title: input.title,
    concept_summary: createConceptSummary(input, signalStack),
    signal_stack: signalStack,
    lyrics,
    style_prompt: stylePromptResult.stylePrompt,
    style_prompt_char_count: stylePromptResult.stylePromptCharCount,
    validation_notes: {
      formatting_pass: validationReport.formattingPass,
      style_limit_pass: validationReport.styleLimitPass,
      anti_trope_pass: validationReport.antiTropePass,
      warnings: validationReport.warnings
    }
  };
}

function createParserRecoveryWarnings(input) {
  if (!input.parserMetadata || !input.parserMetadata.fieldStatus) {
    return [];
  }

  const fields = Object.entries(input.parserMetadata.fieldStatus)
    .filter(([, info]) => info.status !== "explicit")
    .map(([fieldName, info]) => `${fieldName}=${info.status}`);

  if (!fields.length) {
    return [];
  }

  return [
    `parser_recovery: ${fields.join(", ")}`,
    `parser_overall: ${input.parserMetadata.overallStatus}`
  ];
}

function createInferenceWarnings(blueprint) {
  if (!blueprint || !blueprint.signalStackMeta) {
    return [];
  }

  const warnings = [];

  if (blueprint.signalStackMeta.productionLayerStatus === "inferred") {
    warnings.push("production_layer=inferred");
  }

  return warnings;
}

function generatePackage(input, options = {}) {
  const blueprint = getSongBlueprint(input);
  const signalStack = buildSignalStack(input);
  const lyrics = generateLyrics(input, signalStack);
  const stylePromptResult = generateStylePrompt(input, signalStack, options);

  const provisionalOutput = {
    title: input.title,
    concept_summary: createConceptSummary(input, signalStack),
    signal_stack: signalStack,
    lyrics,
    style_prompt: stylePromptResult.stylePrompt,
    style_prompt_char_count: stylePromptResult.stylePromptCharCount,
    validation_notes: {
      formatting_pass: false,
      style_limit_pass: false,
      anti_trope_pass: false,
      warnings: []
    }
  };

  const markdown = toMarkdown(provisionalOutput);
  const validationReport = buildValidationReport(provisionalOutput, markdown, options);
  const parserWarnings = createParserRecoveryWarnings(input);
  const inferenceWarnings = createInferenceWarnings(blueprint);

  if (validationReport.warnings[0] === "none") {
    validationReport.warnings = [];
  }

  validationReport.warnings.push(...parserWarnings);
  validationReport.warnings.push(...inferenceWarnings);

  if (!validationReport.warnings.length) {
    validationReport.warnings = ["none"];
  }

  const output = createOutputObject(input, signalStack, lyrics, stylePromptResult, validationReport);

  return {
    output,
    markdown: toMarkdown(output),
    validationReport
  };
}

module.exports = {
  generatePackage
};

const { validateAntiTrope } = require("./validateAntiTrope");
const { validateLyricsFormatting, validateMarkdownPackage } = require("./validateFormatting");
const { validateStylePrompt } = require("./validateStylePrompt");

function buildValidationReport(output, markdown, options = {}) {
  const antiTrope = validateAntiTrope(output.lyrics);
  const stylePrompt = validateStylePrompt(output.style_prompt, options);
  const lyricsFormatting = validateLyricsFormatting(output.lyrics);
  const markdownPackage = validateMarkdownPackage(markdown);

  const warnings = [];

  if (!antiTrope.antiTropePass) {
    warnings.push(`Tier 1 anti-trope flags: ${antiTrope.flaggedPhrases.join(", ")}`);
  }

  if (!stylePrompt.styleLimitPass) {
    warnings.push(`Style prompt exceeds ${stylePrompt.maxLength} characters.`);
  }

  if (!lyricsFormatting.formattingPass) {
    warnings.push("Lyrics formatting is missing section headers or line integrity.");
  }

  if (!markdownPackage.packageOrderPass) {
    warnings.push(`Markdown package is missing headers: ${markdownPackage.missingHeaders.join(", ")}`);
  }

  return {
    formattingPass: lyricsFormatting.formattingPass && markdownPackage.packageOrderPass,
    styleLimitPass: stylePrompt.styleLimitPass,
    antiTropePass: antiTrope.antiTropePass,
    warnings: warnings.length ? warnings : ["none"],
    details: {
      antiTrope,
      stylePrompt,
      lyricsFormatting,
      markdownPackage
    }
  };
}

module.exports = {
  buildValidationReport
};

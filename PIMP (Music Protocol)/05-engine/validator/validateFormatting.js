const REQUIRED_PACKAGE_HEADERS = [
  "# P.I.M.P Output Package",
  "## Title",
  "## Concept Summary",
  "## Signal Stack Summary",
  "## Lyrics",
  "## Style Prompt",
  "## Validation Notes"
];

function validateLyricsFormatting(lyrics) {
  const hasSectionHeaders = /^\[[^\]]+\]/m.test(lyrics || "");
  const hasLineBreaks = (lyrics || "").includes("\n");

  return {
    hasSectionHeaders,
    hasLineBreaks,
    formattingPass: hasSectionHeaders && hasLineBreaks
  };
}

function validateMarkdownPackage(markdown) {
  const missingHeaders = REQUIRED_PACKAGE_HEADERS.filter((header) => !markdown.includes(header));
  return {
    packageOrderPass: missingHeaders.length === 0,
    missingHeaders
  };
}

module.exports = {
  REQUIRED_PACKAGE_HEADERS,
  validateLyricsFormatting,
  validateMarkdownPackage
};

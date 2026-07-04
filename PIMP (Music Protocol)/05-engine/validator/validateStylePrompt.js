const { DEFAULT_STYLE_LIMIT } = require("../generator/generateStylePrompt");

function validateStylePrompt(stylePrompt, options = {}) {
  const maxLength = options.maxLength || DEFAULT_STYLE_LIMIT;
  const length = (stylePrompt || "").length;

  return {
    styleLimitPass: length <= maxLength && length > 0,
    stylePromptCharCount: length,
    maxLength
  };
}

module.exports = {
  validateStylePrompt
};

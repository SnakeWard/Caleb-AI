const test = require("node:test");
const assert = require("node:assert/strict");
const { validateStylePrompt } = require("../validator/validateStylePrompt");

test("style prompt validation fails when over configured character limit", () => {
  const stylePrompt = "x".repeat(1001);
  const result = validateStylePrompt(stylePrompt);

  assert.equal(result.styleLimitPass, false);
  assert.equal(result.stylePromptCharCount, 1001);
});

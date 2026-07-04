const test = require("node:test");
const assert = require("node:assert/strict");
const { validateAntiTrope } = require("../validator/validateAntiTrope");

test("anti-trope validation flags tier 1 phrases and close variants", () => {
  const result = validateAntiTrope("I am haunted by the past and drowning in memories tonight");

  assert.equal(result.antiTropePass, false);
  assert.deepEqual(result.flaggedPhrases, ["drowning in memories", "haunted by the past"]);
});

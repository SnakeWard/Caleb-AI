const test = require("node:test");
const assert = require("node:assert/strict");
const { toMarkdown } = require("../formatter/toMarkdown");

test("markdown formatter includes required package sections", () => {
  const markdown = toMarkdown({
    title: "Test Song",
    concept_summary: "Identity, tension, release.",
    signal_stack: {
      identity: "Narrator",
      emotional_arc: "Arc",
      genre_framework: "Genre",
      production_layer: "Production",
      structure: ["Intro", "Verse 1", "Chorus", "Outro"]
    },
    lyrics: "[Intro]\nline\n\n[Chorus]\nline",
    style_prompt: "compact prompt",
    validation_notes: {
      formatting_pass: true,
      style_limit_pass: true,
      anti_trope_pass: true,
      warnings: ["none"]
    }
  });

  assert.match(markdown, /## Title/);
  assert.match(markdown, /## Signal Stack Summary/);
  assert.match(markdown, /## Lyrics/);
  assert.match(markdown, /\[Chorus\]/);
  assert.match(markdown, /## Validation Notes/);
});

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { parseMarkdownSongInput } = require("../parser/markdownInputParser");

test("parser extracts structured fields from example input", () => {
  const inputPath = path.resolve(__dirname, "../../04-examples/inputs/input-001-baby-brother.md");
  const parsed = parseMarkdownSongInput(inputPath);

  assert.equal(parsed.title, "Baby Brother");
  assert.match(parsed.rawUserIntent, /sister's perspective/i);
  assert.equal(parsed.possibleGenreFramework, "Acoustic memorial ballad with soft piano, strings, and restrained percussion");
  assert.deepEqual(parsed.instrumentationHints, [
    "acoustic guitar",
    "soft piano",
    "cello",
    "gentle strings",
    "light percussion late in the song"
  ]);
});

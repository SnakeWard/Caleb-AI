const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { parseMarkdownSongInput } = require("../parser/markdownInputParser");
const { validateAntiTrope } = require("../validator/validateAntiTrope");
const { validateStylePrompt } = require("../validator/validateStylePrompt");
const { toMarkdown } = require("../formatter/toMarkdown");
const { buildSignalStack } = require("../generator/buildSignalStack");
const { generateStylePrompt } = require("../generator/generateStylePrompt");
const { generatePackage } = require("../generator/generatePackage");
const { deriveExportSlug, resolveUniqueBaseName } = require("../run-pimp");

function runTest(name, fn) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error.stack);
    process.exitCode = 1;
  }
}

runTest("parser extracts structured fields from example input", () => {
  const inputPath = path.resolve(__dirname, "../../04-examples/inputs/input-001-baby-brother.md");
  const parsed = parseMarkdownSongInput(inputPath);

  assert.equal(parsed.title, "Baby Brother");
  assert.match(parsed.rawUserIntent, /sister.?s perspective/i);
  assert.equal(parsed.possibleGenreFramework, "Acoustic memorial ballad with soft piano, strings, and restrained percussion");
  assert.deepEqual(parsed.instrumentationHints, [
    "acoustic guitar",
    "soft piano",
    "cello",
    "gentle strings",
    "light percussion late in the song"
  ]);
  assert.equal(parsed.parserMetadata.fieldStatus.rawUserIntent.status, "explicit");
});

runTest("parser recovers messy activation fields through semantic headings and inference", () => {
  const inputPath = path.resolve(__dirname, "../../04-examples/inputs/input-003-motel-ashtray-messy.md");
  const parsed = parseMarkdownSongInput(inputPath);

  assert.equal(parsed.title, "Motel Ashtray");
  assert.match(parsed.rawUserIntent, /motel parking lot/i);
  assert.ok(parsed.desiredDirection.includes("lonely but not theatrical"));
  assert.match(parsed.possibleGenreFramework, /heartland rock/i);
  assert.match(parsed.vocalDirection, /Male narrator point of view/i);
  assert.ok(parsed.specialConstraints.includes("don't make her evil"));
  assert.equal(parsed.parserMetadata.fieldStatus.rawUserIntent.status, "normalized");
  assert.equal(parsed.parserMetadata.fieldStatus.vocalDirection.status, "inferred");
  assert.equal(parsed.parserMetadata.overallStatus, "recovered");
  assert.ok(parsed.parserMetadata.sideNotes.chorusHints.includes("Motel ashtray"));
});

runTest("anti-trope validation flags tier 1 phrases", () => {
  const result = validateAntiTrope("I am haunted by the past and drowning in memories tonight");

  assert.equal(result.antiTropePass, false);
  assert.deepEqual(result.flaggedPhrases, ["drowning in memories", "haunted by the past"]);
});

runTest("style prompt validation fails when over configured character limit", () => {
  const stylePrompt = "x".repeat(1001);
  const result = validateStylePrompt(stylePrompt);

  assert.equal(result.styleLimitPass, false);
  assert.equal(result.stylePromptCharCount, 1001);
});

runTest("export slug prefers explicit in-body song title over generic parsed title", () => {
  const markdown = [
    "# PIMP Activation",
    "",
    "Need this to feel wrecked but steady.",
    "Song called County Line Static."
  ].join("\n");

  const slug = deriveExportSlug(
    path.resolve(__dirname, "../../04-examples/inputs/input-999-test.md"),
    "PIMP Activation",
    markdown
  );

  assert.equal(slug, "county-line-static");
});

runTest("export slug falls back to input filename when parsed title is generic", () => {
  const markdown = "# PIMP Activation\n\nNo explicit title here.";
  const slug = deriveExportSlug(
    path.resolve(__dirname, "../../04-examples/inputs/input-005-identity-fracture.md"),
    "PIMP Activation",
    markdown
  );

  assert.equal(slug, "input-005-identity-fracture");
});

runTest("export basename appends a counter when files already exist", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pimp-export-test-"));

  try {
    fs.writeFileSync(path.join(tempDir, "input-005-identity-fracture-pimp-v1.json"), "{}");
    fs.writeFileSync(path.join(tempDir, "input-005-identity-fracture-pimp-v1.md"), "# test");

    const unique = resolveUniqueBaseName("input-005-identity-fracture-pimp-v1", tempDir);
    assert.equal(unique, "input-005-identity-fracture-pimp-v1-2");
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

runTest("markdown formatter includes required package sections", () => {
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

runTest("style prompt compiler removes operational padding from whistler input", () => {
  const inputPath = path.resolve(__dirname, "../../04-examples/inputs/input-002-the-whistler.md");
  const parsed = parseMarkdownSongInput(inputPath);
  const signalStack = buildSignalStack(parsed);
  const result = generateStylePrompt(parsed, signalStack);

  assert.doesNotMatch(result.stylePrompt, /under 1000 characters/i);
  assert.match(result.stylePrompt, /whistle motif/i);
});

runTest("baby brother package keeps concrete loss details in the release section", () => {
  const inputPath = path.resolve(__dirname, "../../04-examples/inputs/input-001-baby-brother.md");
  const parsed = parseMarkdownSongInput(inputPath);
  const result = generatePackage(parsed);

  assert.match(result.output.lyrics, /Twenty-one shots/i);
  assert.match(result.output.lyrics, /polished wood/i);
  assert.match(result.output.concept_summary, /older sister/i);
});

runTest("baby brother lyrics avoid writerly phrasing in favor of observed family detail", () => {
  const inputPath = path.resolve(__dirname, "../../04-examples/inputs/input-001-baby-brother.md");
  const parsed = parseMarkdownSongInput(inputPath);
  const result = generatePackage(parsed);

  assert.doesNotMatch(result.output.lyrics, /make quieter/i);
  assert.doesNotMatch(result.output.lyrics, /worry can love somebody harder/i);
  assert.doesNotMatch(result.output.lyrics, /heart can keep beatin' while somethin' in it dies/i);
  assert.doesNotMatch(result.output.lyrics, /big-sister speeches went quiet/i);
  assert.match(result.output.lyrics, /Mama'd send me after you/i);
  assert.match(result.output.lyrics, /quit tellin' you be careful/i);
  assert.match(result.output.lyrics, /Your boots ain't moved/i);
});

runTest("whistler chorus and payoff stay grounded instead of mythic", () => {
  const inputPath = path.resolve(__dirname, "../../04-examples/inputs/input-002-the-whistler.md");
  const parsed = parseMarkdownSongInput(inputPath);
  const result = generatePackage(parsed);

  assert.doesNotMatch(result.output.lyrics, /end of it all/i);
  assert.doesNotMatch(result.output.lyrics, /hole through the whole of his soul/i);
  assert.doesNotMatch(result.output.lyrics, /debts rot slower than a body in clay/i);
  assert.match(result.output.lyrics, /feed store/i);
  assert.match(result.output.lyrics, /hitchin' post/i);
  assert.match(result.output.lyrics, /horses snortin'/i);
  assert.match(result.output.lyrics, /best let him pass/i);
});

runTest("messy motel input produces recovered signal instead of placeholder package text", () => {
  const inputPath = path.resolve(__dirname, "../../04-examples/inputs/input-003-motel-ashtray-messy.md");
  const parsed = parseMarkdownSongInput(inputPath);
  const result = generatePackage(parsed);

  assert.match(result.output.signal_stack.identity, /Male narrator point of view/i);
  assert.match(result.output.style_prompt, /heartland rock/i);
  assert.doesNotMatch(result.output.style_prompt, /trying to sound normal while clearly coming apart/i);
  assert.doesNotMatch(result.output.concept_summary, /male narrator point of view; late-20s/i);
  assert.doesNotMatch(result.output.lyrics, /Concept detail not provided/i);
  assert.doesNotMatch(result.output.lyrics, /This section preserves the song's central identity and tension/i);
  assert.match(result.output.lyrics, /\[Chorus\]\nMotel ashtray\ntaps it twice and says he's fine/i);
  assert.doesNotMatch(result.output.lyrics, /Motel ashtray under that same bad light/i);
  assert.match(result.output.lyrics, /taps it twice and says he's fine/i);
  assert.match(result.output.lyrics, /gets as far as her street, then kills the call/i);
  assert.match(result.output.lyrics, /\[Outro\][\s\S]*gets as far as her street, then kills the call/i);
  assert.doesNotMatch(result.output.lyrics, /nobody standing there buys it for long/i);
  assert.doesNotMatch(result.output.lyrics, /still stoppin' where he ought to keep goin'/i);
  assert.match(result.output.validation_notes.warnings.join(" "), /parser_recovery/i);
});

runTest("county line parser normalizes messy headings and recovers ritual hook hints", () => {
  const inputPath = path.resolve(__dirname, "../../04-examples/inputs/input-004-county-line-pews-messy.md");
  const parsed = parseMarkdownSongInput(inputPath);

  assert.equal(parsed.parserMetadata.fieldStatus.rawUserIntent.status, "normalized");
  assert.equal(parsed.parserMetadata.fieldStatus.desiredDirection.status, "normalized");
  assert.equal(parsed.parserMetadata.fieldStatus.possibleGenreFramework.status, "normalized");
  assert.equal(parsed.parserMetadata.fieldStatus.specialConstraints.status, "normalized");
  assert.equal(parsed.parserMetadata.fieldStatus.vocalDirection.status, "inferred");
  assert.ok(parsed.parserMetadata.sideNotes.chorusHints.includes("communion tray"));
});

runTest("county line recovered package keeps moral identity, arc, and ritual-pressure hook", () => {
  const inputPath = path.resolve(__dirname, "../../04-examples/inputs/input-004-county-line-pews-messy.md");
  const parsed = parseMarkdownSongInput(inputPath);
  const result = generatePackage(parsed);

  assert.doesNotMatch(result.output.concept_summary, /Identity:/i);
  assert.doesNotMatch(result.output.concept_summary, /grounded first-draft song package built from the recovered activation/i);
  assert.doesNotMatch(result.output.concept_summary, /blue-collar man used to practical fixes; uneasy in church/i);
  assert.match(result.output.concept_summary, /ritual pressure/i);
  assert.match(result.output.concept_summary, /silence, non-participation, and what he still does not say/i);
  assert.match(result.output.signal_stack.identity, /blue-collar/i);
  assert.match(result.output.signal_stack.identity, /church/i);
  assert.doesNotMatch(result.output.signal_stack.identity, /^early 40s$/i);
  assert.match(result.output.signal_stack.emotional_arc, /withheld confession/i);
  assert.doesNotMatch(result.output.signal_stack.emotional_arc, /delivery/i);
  assert.match(result.output.lyrics, /communion tray comin' closer/i);
  assert.match(result.output.lyrics, /he lets it pass/i);
  assert.match(result.output.lyrics, /tray gets to his row, he keeps his hands down/i);
  assert.match(result.output.lyrics, /tray goes by and he don't move/i);
  assert.doesNotMatch(result.output.lyrics, /stands there quiet and lets it pass/i);
  assert.doesNotMatch(result.output.lyrics, /\nearly 40s\n/i);
  assert.match(result.output.style_prompt, /southern-gospel shadow/i);
  assert.match(result.output.style_prompt, /withheld confession/i);
  assert.doesNotMatch(result.output.style_prompt, /\bearly 40s\b/i);
});

runTest("internal-conflict recovered inputs build identity from contradiction instead of placeholders", () => {
  const cases = [
    {
      file: "input-005-identity-fracture.md",
      identity: /decent version of what he did/i,
      chorus: /I did what I had to[\s\S]*that's what I keep callin' it/i,
      sectionVoice: /that's how I keep startin' it|keep stackin' little reasons in front of it|keep my voice down and call it that/i
    },
    {
      file: "input-006-social-pressure.md",
      identity: /smile/i,
      chorus: /he laughs a second too long[\s\S]*then clocks back in/i,
      sectionVoice: /got a line for everybody waitin'|puts the same good face back on|pull the grin back up again/i
    },
    {
      file: "input-007-nonlinear-arc.md",
      identity: /feeling already burned off|went flat/i,
      chorus: /nobody is arguing[\s\S]*silence is the loudest thing/i,
      sectionVoice: /it would've sounded louder last month|the feeling's already left first|there oughta be more left than this/i,
      avoids: /absence keeps the whole thing moving/i
    },
    {
      file: "input-008-low-event.md",
      identity: /waiting on the porch|porch become a habit of waiting/i,
      chorus: /truck that never pulls in[\s\S]*porch light still on/i,
      sectionVoice: /still ain't turned it off|empty chair catchin' all of it|still I don't go inside|still ain't turned that light off/i,
      avoids: /absence keeps the whole thing moving/i
    },
    {
      file: "input-009-moral-gray.md",
      identity: /knowing better/i,
      chorus: /both knew better[\s\S]*still let the phone ring out/i,
      sectionVoice: /keep lookin' straight ahead through it|still nobody says what that makes it|just let the phone ring out again/i,
      avoids: /ain't callin' it one thing either/i
    }
  ];

  for (const testCase of cases) {
    const inputPath = path.resolve(__dirname, `../../04-examples/inputs/${testCase.file}`);
    const parsed = parseMarkdownSongInput(inputPath);
    const result = generatePackage(parsed);
    const combinedText = [
      result.output.signal_stack.identity,
      result.output.concept_summary,
      result.output.style_prompt,
      result.output.lyrics
    ].join("\n");

    assert.match(result.output.signal_stack.identity, testCase.identity);
    assert.match(result.output.lyrics, testCase.chorus);
    assert.match(result.output.lyrics, testCase.sectionVoice);
    assert.doesNotMatch(combinedText, /Narrator identity partially specified/i);
    assert.doesNotMatch(combinedText, /preserve a grounded human point of view/i);
    assert.doesNotMatch(result.output.lyrics, /This section preserves/i);
    assert.doesNotMatch(result.output.lyrics, /Ain't nobody left to blame in it/i);
    assert.doesNotMatch(result.output.lyrics, /still does the one thing he said he'd quit/i);
    if (testCase.avoids) {
      assert.doesNotMatch(result.output.lyrics, testCase.avoids);
    }
  }
});

if (!process.exitCode) {
  console.log("All tests passed.");
}

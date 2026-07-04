#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");
const { parseMarkdownSongInput } = require("./parser/markdownInputParser");
const { generatePackage } = require("./generator/generatePackage");
const { toJson } = require("./formatter/toJson");

function parseArgs(argv) {
  const args = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--input") {
      args.input = argv[index + 1];
      index += 1;
    }
  }

  return args;
}

function ensureDirectory(directoryPath) {
  fs.mkdirSync(directoryPath, { recursive: true });
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function stripMarkdownFence(value) {
  return String(value || "")
    .replace(/[`*_#>\[\]]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractExplicitSongTitle(markdown) {
  const normalized = String(markdown || "").replace(/\r\n/g, "\n");
  const patterns = [
    /\b(?:song\s+called|song\s+titled|called)\s+["']?([a-z0-9][a-z0-9\s'&/-]{2,80})["']?/i,
    /^\s*(?:working\s+title|song\s+title|title)\s*:\s*["']?(.{2,80}?)["']?\s*$/im
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (!match) {
      continue;
    }

    const candidate = stripMarkdownFence(match[1]).replace(/[.]+$/, "").trim();
    if (candidate) {
      return candidate;
    }
  }

  return "";
}

function isGenericActivationTitle(title) {
  return /^pimp activation$/i.test(String(title || "").trim());
}

function deriveExportSlug(inputPath, parsedTitle, markdown) {
  const explicitTitle = extractExplicitSongTitle(markdown);
  if (explicitTitle) {
    return slugify(explicitTitle);
  }

  const inputFileSlug = slugify(path.basename(inputPath, path.extname(inputPath)));
  if (inputFileSlug) {
    return inputFileSlug;
  }

  if (!isGenericActivationTitle(parsedTitle)) {
    return slugify(parsedTitle);
  }

  return "pimp-output";
}

function resolveUniqueBaseName(baseName, exportDirectory) {
  let candidate = baseName;
  let counter = 2;

  while (
    fs.existsSync(path.join(exportDirectory, `${candidate}.json`)) ||
    fs.existsSync(path.join(exportDirectory, `${candidate}.md`))
  ) {
    candidate = `${baseName}-${counter}`;
    counter += 1;
  }

  return candidate;
}

function writeExports(baseName, exportDirectory, output, markdown) {
  const jsonPath = path.join(exportDirectory, `${baseName}.json`);
  const markdownPath = path.join(exportDirectory, `${baseName}.md`);

  fs.writeFileSync(jsonPath, toJson(output));
  fs.writeFileSync(markdownPath, markdown);

  return { jsonPath, markdownPath };
}

function printValidationSummary(report) {
  console.log("Validation Summary");
  console.log(`- formatting_pass: ${report.formattingPass}`);
  console.log(`- style_limit_pass: ${report.styleLimitPass}`);
  console.log(`- anti_trope_pass: ${report.antiTropePass}`);
  console.log(`- warnings: ${report.warnings.join(" | ")}`);

  if (report.details.antiTrope.flaggedPhrases.length) {
    console.log(`- flagged_phrases: ${report.details.antiTrope.flaggedPhrases.join(", ")}`);
  }

  if (report.details.antiTrope.flaggedPatterns.length) {
    console.log(`- flagged_patterns: ${report.details.antiTrope.flaggedPatterns.join(", ")}`);
  }

  console.log(`- style_prompt_char_count: ${report.details.stylePrompt.stylePromptCharCount}`);
}

function printParserSummary(parsedInput) {
  if (!parsedInput.parserMetadata) {
    return;
  }

  console.log("Parser Recovery");
  console.log(`- overall: ${parsedInput.parserMetadata.overallStatus}`);

  for (const [fieldName, field] of Object.entries(parsedInput.parserMetadata.fieldStatus)) {
    const detail = field.headings.length
      ? ` (${field.headings.join(", ")})`
      : field.evidence.length
        ? ` (${field.evidence.join(", ")})`
        : "";
    console.log(`- ${fieldName}: ${field.status}${detail}`);
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const workspaceRoot = path.resolve(__dirname, "..");

  if (!args.input) {
    throw new Error("Missing required --input argument.");
  }

  const inputPath = path.resolve(workspaceRoot, args.input);
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const parsedInput = parseMarkdownSongInput(inputPath);
  const inputMarkdown = fs.readFileSync(inputPath, "utf8");
  const { output, markdown, validationReport } = generatePackage(parsedInput);
  const exportDirectory = path.join(workspaceRoot, "06-runtime", "exports");
  ensureDirectory(exportDirectory);

  const exportSlug = deriveExportSlug(inputPath, parsedInput.title, inputMarkdown);
  const baseName = resolveUniqueBaseName(`${exportSlug}-pimp-v1`, exportDirectory);
  const paths = writeExports(baseName, exportDirectory, output, markdown);

  console.log(`Title: ${output.title}`);
  console.log(`JSON Export: ${paths.jsonPath}`);
  console.log(`Markdown Export: ${paths.markdownPath}`);
  printParserSummary(parsedInput);
  printValidationSummary(validationReport);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`P.I.M.P engine failed: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  main,
  parseArgs,
  slugify,
  extractExplicitSongTitle,
  deriveExportSlug,
  resolveUniqueBaseName
};

const fs = require("node:fs");
const path = require("node:path");

const FIELD_CONFIG = {
  rawUserIntent: {
    canonicalKey: "raw_user_intent",
    aliases: [
      "pimp_activation",
      "pimp_thing",
      "activation",
      "what_this_is",
      "what_this_song_is",
      "what_im_trying_to_do",
      "song_idea",
      "idea",
      "concept",
      "premise",
      "story",
      "what_this_is_about"
    ],
    tokens: ["activation", "concept", "idea", "premise", "story", "intent", "what", "trying"]
  },
  desiredDirection: {
    canonicalKey: "desired_direction",
    aliases: ["what_i_do_want", "what_i_mean_by_it", "vibe", "feel", "mood", "tone", "direction", "what_i_want"],
    tokens: ["want", "vibe", "feel", "mood", "tone", "direction", "emotional"]
  },
  possibleGenreFramework: {
    canonicalKey: "possible_genre_framework",
    aliases: ["genre_direction", "sound", "sonic_direction", "maybe_genre", "maybe_genre_i_don_t_know", "genre", "sort_of_where_it_lives"],
    tokens: ["genre", "sound", "sonic", "style"]
  },
  vocalDirection: {
    canonicalKey: "vocal_direction",
    aliases: ["voice", "who_s_singing_this", "who_is_singing_this", "narrator", "point_of_view", "pov"],
    tokens: ["vocal", "voice", "singing", "narrator", "perspective", "pov"]
  },
  instrumentationHints: {
    canonicalKey: "instrumentation_hints",
    aliases: ["instrumentation", "arrangement", "production", "production_notes", "sonic_details"],
    tokens: ["instrument", "arrangement", "production"]
  },
  specialConstraints: {
    canonicalKey: "special_constraints",
    aliases: ["rules", "constraints", "please_don_t_do_this", "please_don_t_screw_this_up", "dont_do_this", "do_not_do_this", "avoid", "guardrails"],
    tokens: ["constraint", "rule", "avoid", "dont", "don't", "not", "guardrail"]
  }
};

const DIRECTION_KEYWORDS = [
  "lonely",
  "plainspoken",
  "restless",
  "grounded",
  "human",
  "dark",
  "cinematic",
  "menacing",
  "dusty",
  "cold-blooded",
  "story-driven",
  "soft and intimate",
  "emotionally devastating",
  "not melodramatic",
  "progressive emotional build",
  "blue-collar without cosplay",
  "strong images"
];

const GENRE_KEYWORDS = [
  "americana",
  "heartland rock",
  "country",
  "90s country",
  "folk",
  "ballad",
  "rock",
  "metal",
  "grunge",
  "soul"
];

const INSTRUMENT_KEYWORDS = [
  "acoustic guitar",
  "piano",
  "cello",
  "strings",
  "percussion",
  "tremolo guitar",
  "upright bass",
  "snare",
  "harmonica",
  "baritone guitar",
  "whistle",
  "whistling"
];

const ABSTRACT_BULLET_PATTERNS = [
  /^(don't|dont|avoid|keep|no )/i,
  /plainspoken/i,
  /restless/i,
  /grounded/i,
  /human/i,
  /story-driven/i,
  /strong images/i,
  /blue-collar/i,
  /style prompt/i
];

function normalizeWhitespace(value) {
  return (value || "").replace(/\r\n/g, "\n").trim();
}

function sectionNameToKey(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function lower(value) {
  return (value || "").toLowerCase();
}

function parseBulletList(block) {
  return normalizeWhitespace(block)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .filter(Boolean);
}

function parseSectionEntries(markdown) {
  const normalized = markdown.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const entries = [];
  let currentHeading = null;
  let currentKey = null;
  let buffer = [];

  for (const line of lines) {
    const match = line.match(/^##\s+(.+?)\s*$/);
    if (match) {
      if (currentKey) {
        entries.push({
          heading: currentHeading,
          key: currentKey,
          content: normalizeWhitespace(buffer.join("\n"))
        });
      }

      currentHeading = match[1];
      currentKey = sectionNameToKey(match[1]);
      buffer = [];
      continue;
    }

    buffer.push(line);
  }

  if (currentKey) {
    entries.push({
      heading: currentHeading,
      key: currentKey,
      content: normalizeWhitespace(buffer.join("\n"))
    });
  }

  return entries;
}

function parseSections(markdown) {
  const entries = parseSectionEntries(markdown);
  return Object.fromEntries(entries.map((entry) => [entry.key, entry.content]));
}

function inferTitle(markdown, sections) {
  if (sections.title) {
    return sections.title;
  }

  const heading = markdown.match(/^#\s+(.+?)\s*$/m);
  if (!heading) {
    return "Untitled";
  }

  const cleaned = heading[1].replace(/^Example Input \d+\s*-\s*/i, "").trim();
  return cleaned || "Untitled";
}

function scoreHeadingForField(key, fieldName) {
  const config = FIELD_CONFIG[fieldName];
  if (!config) {
    return 0;
  }

  if (key === config.canonicalKey) {
    return 100;
  }

  if (config.aliases.includes(key)) {
    return 90;
  }

  const tokens = key.split("_");
  const score = config.tokens.reduce((total, token) => total + (tokens.includes(token) ? 1 : 0), 0);
  return score >= 2 ? score : 0;
}

function findCanonicalFieldForHeading(key) {
  let bestField = null;
  let bestScore = 0;

  for (const fieldName of Object.keys(FIELD_CONFIG)) {
    const score = scoreHeadingForField(key, fieldName);
    if (score > bestScore) {
      bestScore = score;
      bestField = fieldName;
    }
  }

  if (!bestField) {
    return null;
  }

  return {
    fieldName: bestField,
    status: bestScore === 100 ? "explicit" : "normalized"
  };
}

function extractBulletItems(content) {
  return parseBulletList(content);
}

function splitParagraphs(content) {
  return normalizeWhitespace(content)
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function extractFirstParagraph(content) {
  return splitParagraphs(content)[0] || "";
}

function uniqueList(values) {
  const seen = new Set();
  const output = [];

  for (const value of values) {
    const trimmed = normalizeWhitespace(value);
    if (!trimmed) {
      continue;
    }

    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    output.push(trimmed);
  }

  return output;
}

function addFieldSource(fieldSources, fieldName, status, heading) {
  if (!fieldSources[fieldName]) {
    fieldSources[fieldName] = [];
  }

  fieldSources[fieldName].push({ status, heading });
}

function createEmptyFieldMetadata() {
  return Object.fromEntries(
    Object.keys(FIELD_CONFIG).map((fieldName) => [
      fieldName,
      {
        status: "missing",
        headings: [],
        evidence: []
      }
    ])
  );
}

function resolveFieldStatus(fieldSources, fieldName, inferredEvidence = []) {
  const explicitSources = (fieldSources[fieldName] || []).filter((source) => source.status === "explicit");
  const normalizedSources = (fieldSources[fieldName] || []).filter((source) => source.status === "normalized");

  if (explicitSources.length) {
    return {
      status: "explicit",
      headings: explicitSources.map((source) => source.heading),
      evidence: []
    };
  }

  if (normalizedSources.length) {
    return {
      status: "normalized",
      headings: normalizedSources.map((source) => source.heading),
      evidence: []
    };
  }

  if (inferredEvidence.length) {
    return {
      status: "inferred",
      headings: [],
      evidence: inferredEvidence
    };
  }

  return {
    status: "missing",
    headings: [],
    evidence: []
  };
}

function buildInitialFieldValues(entries) {
  const fieldValues = {
    rawUserIntent: [],
    desiredDirection: [],
    possibleGenreFramework: [],
    vocalDirection: [],
    instrumentationHints: [],
    specialConstraints: []
  };
  const fieldSources = {};
  const unmatchedEntries = [];

  for (const entry of entries) {
    const canonical = findCanonicalFieldForHeading(entry.key);

    if (!canonical) {
      unmatchedEntries.push(entry);
      continue;
    }

    const { fieldName, status } = canonical;
    addFieldSource(fieldSources, fieldName, status, entry.heading);

    if (fieldName === "rawUserIntent") {
      fieldValues.rawUserIntent.push(entry.content);
      continue;
    }

    if (fieldName === "desiredDirection" || fieldName === "instrumentationHints" || fieldName === "specialConstraints") {
      const bullets = extractBulletItems(entry.content);
      if (bullets.length) {
        fieldValues[fieldName].push(...bullets);
      } else {
        const paragraph = extractFirstParagraph(entry.content);
        if (paragraph) {
          fieldValues[fieldName].push(paragraph);
        }
      }
      continue;
    }

    fieldValues[fieldName].push(extractFirstParagraph(entry.content));
  }

  return {
    fieldValues,
    fieldSources,
    unmatchedEntries
  };
}

function sentenceSplit(text) {
  return normalizeWhitespace(text)
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function collectAllBullets(entries) {
  return uniqueList(entries.flatMap((entry) => extractBulletItems(entry.content)));
}

function isConcreteHint(value) {
  return !ABSTRACT_BULLET_PATTERNS.some((pattern) => pattern.test(value || ""));
}

function extractLikelyGenre(text) {
  const lowered = lower(text);
  const hits = GENRE_KEYWORDS.filter((keyword) => lowered.includes(keyword));
  if (!hits.length) {
    return "";
  }

  if (lowered.includes("heartland rock") && lowered.includes("americana")) {
    return "Heartland rock / Americana with a little 90s country storytelling";
  }

  return uniqueList(hits).join(", ");
}

function extractLikelyDirections(text, bulletPool) {
  const lowered = lower(text);
  const inferred = DIRECTION_KEYWORDS.filter((keyword) => lowered.includes(keyword));
  return uniqueList([...bulletPool.filter((item) => DIRECTION_KEYWORDS.some((keyword) => lower(item).includes(keyword))), ...inferred]);
}

function extractLikelyConstraints(text, bulletPool) {
  const constraintBullets = bulletPool.filter((item) => /^(don't|dont|avoid|keep|no )/i.test(item));
  const inferred = sentenceSplit(text).filter((sentence) => /(?:don't|dont|avoid|keep it|style prompt)/i.test(sentence));
  return uniqueList([...constraintBullets, ...inferred]);
}

function extractLikelyVocalDirection(text) {
  const lowered = lower(text);
  const parts = [];

  if (lowered.includes("from his point of view") || /\ba man\b/.test(lowered)) {
    parts.push("Male narrator point of view");
  } else if (lowered.includes("from her point of view") || lowered.includes("sister's perspective")) {
    parts.push("Female narrator point of view");
  }

  const ageMatch = text.match(/late\s+\d{2}s?\s*\/\s*maybe\s+early\s+\d{2}s|late\s+\d{2}s|early\s+\d{2}s/i);
  if (ageMatch) {
    parts.push(ageMatch[0]);
  }

  if (lowered.includes("older than the brother") || lowered.includes("older than his brother")) {
    parts.push("older brother figure");
  }

  if (lowered.includes("blue-collar")) {
    parts.push("blue-collar");
  }

  if (lowered.includes("not dramatic")) {
    parts.push("not dramatic");
  }

  if (lowered.includes("practical things with his hands")) {
    parts.push("practical with his hands");
  }

  if (lowered.includes("still believes enough for it to hurt")) {
    parts.push("belief-fractured");
  }

  if (lowered.includes("trying to sound normal while clearly not being normal")) {
    parts.push("trying to sound normal while clearly coming apart");
  }

  if (lowered.includes("tender female vocal")) {
    parts.push("Tender female vocal");
  }

  if (lowered.includes("low, weathered male vocal")) {
    parts.push("Low, weathered male vocal with calm menace");
  }

  return parts.length ? parts.join("; ") : "";
}

function extractLikelyInstrumentation(text, bulletPool) {
  const lowered = lower(text);
  const hits = INSTRUMENT_KEYWORDS.filter((keyword) => lowered.includes(keyword));
  return uniqueList([...bulletPool.filter((item) => INSTRUMENT_KEYWORDS.some((keyword) => lower(item).includes(keyword))), ...hits]);
}

function extractImageryHints(rawIntentEntries, unmatchedEntries) {
  const imageryBullets = uniqueList(
    [...rawIntentEntries, ...unmatchedEntries]
      .flatMap((entry) => extractBulletItems(entry.content))
      .filter((item) => !/^(don't|dont|avoid|keep|style prompt)/i.test(item))
      .filter(isConcreteHint)
  );
  const recurring = [];

  for (const entry of [...rawIntentEntries, ...unmatchedEntries]) {
    const loweredHeading = lower(entry.heading);
    if (loweredHeading.includes("note") || loweredHeading.includes("activation")) {
      const quoted = [...entry.content.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
      recurring.push(...quoted);
    }
  }

  return uniqueList([...imageryBullets, ...recurring]);
}

function extractBehaviorHints(text) {
  const patterns = [
    /\b(?:i|he|she)\s+keeps\s+/i,
    /\b(?:i|he|she)\s+keep\s+/i,
    /\b(?:i|he|she)\s+lets?\s+it\s+pass/i,
    /\bkept\s+(?:his|her|my)\s+mouth\s+shut/i,
    /\bsleeping\s+in\s+/i,
    /\bcalling\s+/i,
    /\bhanging up/i,
    /\bwait(?:ing)?\s+up/i,
    /\borbiting\s+/i,
    /\bmoved on/i,
    /\bcan't\s+quite\s+sing/i
  ];

  const fragments = uniqueList([
    ...sentenceSplit(text),
    ...normalizeWhitespace(text)
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
  ]);

  return uniqueList(
    fragments
      .filter((fragment) => !/^(i keep seeing:?|- )/i.test(fragment))
      .filter((fragment) => fragment.length <= 220)
      .filter((fragment) => patterns.some((pattern) => pattern.test(fragment)))
  );
}

function classifyUnmatchedEntries(unmatchedEntries) {
  const sideNotes = {
    imageryHints: [],
    chorusHints: [],
    toneModifiers: [],
    productionSuggestions: [],
    structuralNotes: []
  };

  for (const entry of unmatchedEntries) {
    const content = entry.content;
    const lowered = lower(`${entry.heading}\n${content}`);
    const bullets = extractBulletItems(content);
    const quoted = [...content.matchAll(/"([^"]+)"/g)].map((match) => match[1]);

    if (/chorus|hook|refrain/.test(lowered)) {
      sideNotes.structuralNotes.push(extractFirstParagraph(content));
      sideNotes.chorusHints.push(...quoted);
      sideNotes.chorusHints.push(...bullets.filter(isConcreteHint));
      sideNotes.chorusHints.push(...extractChorusCandidatesFromParagraph(content));
    }

    if (/open|sparse|widen|fade|build|intro|outro|dry|close/.test(lowered)) {
      sideNotes.productionSuggestions.push(extractFirstParagraph(content));
    }

    if (/tone|feel|vibe|plainspoken|human|not theatrical|not too polished|not pop shiny/.test(lowered)) {
      sideNotes.toneModifiers.push(...bullets);
      if (!bullets.length) {
        sideNotes.toneModifiers.push(extractFirstParagraph(content));
      }
    }

    if (/image|sign|coffee|jacket|street|house|hood|truck|motel|ashtray|ice machine/.test(lowered)) {
      sideNotes.imageryHints.push(...quoted);
      sideNotes.imageryHints.push(...bullets.filter(isConcreteHint));
    }
  }

  return Object.fromEntries(
    Object.entries(sideNotes).map(([key, values]) => [key, uniqueList(values)])
  );
}

function extractChorusCandidatesFromParagraph(text) {
  const normalized = normalizeWhitespace(text)
    .replace(/^if there is a chorus/i, "")
    .replace(/^i think it should/i, "")
    .replace(/^it should/i, "")
    .trim();

  const afterColon = normalized.split(":").slice(1).join(":").trim();
  const source = afterColon || normalized;

  return uniqueList(
    source
      .split(/[,.]/)
      .map((part) => part.replace(/\bsomething like that\b/gi, "").trim())
      .filter((part) => part.length >= 4)
      .filter((part) => !/\b(chorus|hook|object|ritual|backstory|explaining)\b/i.test(part))
      .filter(isConcreteHint)
  );
}

function extractLikelyRawIntent(entries, unmatchedEntries) {
  const candidates = [...entries, ...unmatchedEntries]
    .map((entry) => extractFirstParagraph(entry.content))
    .filter((paragraph) => paragraph.length > 80);

  return candidates[0] || "";
}

function inferMissingFields(entries, unmatchedEntries, initialFields) {
  const allText = normalizeWhitespace(entries.map((entry) => `${entry.heading}\n${entry.content}`).join("\n\n"));
  const bulletPool = collectAllBullets(entries);
  const inferred = {
    rawUserIntent: [],
    desiredDirection: [],
    possibleGenreFramework: [],
    vocalDirection: [],
    instrumentationHints: [],
    specialConstraints: []
  };
  const inferredEvidence = {
    rawUserIntent: [],
    desiredDirection: [],
    possibleGenreFramework: [],
    vocalDirection: [],
    instrumentationHints: [],
    specialConstraints: []
  };

  if (!initialFields.rawUserIntent.length) {
    const rawIntent = extractLikelyRawIntent(entries, unmatchedEntries);
    if (rawIntent) {
      inferred.rawUserIntent.push(rawIntent);
      inferredEvidence.rawUserIntent.push("long-form activation text");
    }
  }

  if (!initialFields.desiredDirection.length) {
    const directions = extractLikelyDirections(allText, bulletPool);
    if (directions.length) {
      inferred.desiredDirection.push(...directions);
      inferredEvidence.desiredDirection.push("direction keywords from body text");
    }
  }

  if (!initialFields.possibleGenreFramework.length) {
    const genre = extractLikelyGenre(allText);
    if (genre) {
      inferred.possibleGenreFramework.push(genre);
      inferredEvidence.possibleGenreFramework.push("genre keywords from body text");
    }
  }

  if (!initialFields.vocalDirection.length) {
    const vocal = extractLikelyVocalDirection(allText);
    if (vocal) {
      inferred.vocalDirection.push(vocal);
      inferredEvidence.vocalDirection.push("point-of-view clues from body text");
    }
  }

  if (!initialFields.instrumentationHints.length) {
    const instrumentation = extractLikelyInstrumentation(allText, bulletPool);
    if (instrumentation.length) {
      inferred.instrumentationHints.push(...instrumentation);
      inferredEvidence.instrumentationHints.push("instrument / production keywords from body text");
    }
  }

  if (!initialFields.specialConstraints.length) {
    const constraints = extractLikelyConstraints(allText, bulletPool);
    if (constraints.length) {
      inferred.specialConstraints.push(...constraints);
      inferredEvidence.specialConstraints.push("constraint phrasing from body text");
    }
  }

  return {
    inferred,
    inferredEvidence,
    allText,
    bulletPool
  };
}

function resolveFieldValue(fieldName, initialFields, inferred) {
  const values = initialFields[fieldName].length ? initialFields[fieldName] : inferred[fieldName];

  if (fieldName === "rawUserIntent") {
    return normalizeWhitespace(values.join("\n\n"));
  }

  if (fieldName === "possibleGenreFramework" || fieldName === "vocalDirection") {
    return normalizeWhitespace(values[0] || "");
  }

  return uniqueList(values);
}

function buildParserMetadata(fieldSources, inferredEvidence, entries, unmatchedEntries, resolvedValues) {
  const fieldStatus = createEmptyFieldMetadata();

  for (const fieldName of Object.keys(fieldStatus)) {
    fieldStatus[fieldName] = resolveFieldStatus(fieldSources, fieldName, inferredEvidence[fieldName]);
  }

  const counts = Object.values(fieldStatus).reduce(
    (total, field) => {
      total[field.status] += 1;
      return total;
    },
    { explicit: 0, normalized: 0, inferred: 0, missing: 0 }
  );

  const rawIntentEntries = entries.filter((entry) => {
    const canonical = findCanonicalFieldForHeading(entry.key);
    return canonical && canonical.fieldName === "rawUserIntent";
  });
  const imageryHints = uniqueList([
    ...extractImageryHints(rawIntentEntries, unmatchedEntries),
    ...classifyUnmatchedEntries(unmatchedEntries).imageryHints
  ]);
  const sideNotes = classifyUnmatchedEntries(unmatchedEntries);
  const behaviorHints = extractBehaviorHints(
    [resolvedValues.rawUserIntent, imageryHints.join(". "), (sideNotes.chorusHints || []).join(". ")].join(". ")
  );
  const recurringImage = imageryHints.find((item) => lower(item).includes(lower(resolvedValues.title || ""))) || imageryHints[0] || resolvedValues.title;

  return {
    fieldStatus,
    counts,
    unmatchedHeadings: unmatchedEntries.map((entry) => entry.heading),
    imageryHints,
    behaviorHints,
    sideNotes,
    recurringImage,
    overallStatus: counts.missing === 0 ? "structured" : counts.explicit + counts.normalized + counts.inferred >= 4 ? "recovered" : "partial"
  };
}

function normalizeParsedInput(sourcePath, markdown, sections) {
  const title = inferTitle(markdown, sections);
  const entries = parseSectionEntries(markdown);
  const { fieldValues, fieldSources, unmatchedEntries } = buildInitialFieldValues(entries);
  const { inferred, inferredEvidence, allText } = inferMissingFields(entries, unmatchedEntries, fieldValues);

  const resolvedValues = {
    title,
    rawUserIntent: resolveFieldValue("rawUserIntent", fieldValues, inferred),
    desiredDirection: resolveFieldValue("desiredDirection", fieldValues, inferred),
    possibleGenreFramework: resolveFieldValue("possibleGenreFramework", fieldValues, inferred),
    vocalDirection: resolveFieldValue("vocalDirection", fieldValues, inferred),
    instrumentationHints: resolveFieldValue("instrumentationHints", fieldValues, inferred),
    specialConstraints: resolveFieldValue("specialConstraints", fieldValues, inferred)
  };

  const parserMetadata = buildParserMetadata(
    fieldSources,
    inferredEvidence,
    entries,
    unmatchedEntries,
    resolvedValues
  );

  return {
    sourcePath: path.resolve(sourcePath),
    title,
    rawUserIntent: resolvedValues.rawUserIntent,
    desiredDirection: resolvedValues.desiredDirection,
    possibleGenreFramework: resolvedValues.possibleGenreFramework,
    vocalDirection: resolvedValues.vocalDirection,
    instrumentationHints: resolvedValues.instrumentationHints,
    specialConstraints: resolvedValues.specialConstraints,
    sections,
    allText,
    parserMetadata,
    schemaInput: {
      title,
      concept: resolvedValues.rawUserIntent,
      genre_target: resolvedValues.possibleGenreFramework,
      emotional_goal: resolvedValues.desiredDirection.join(", "),
      vocal_direction: resolvedValues.vocalDirection,
      instrumentation: resolvedValues.instrumentationHints,
      special_constraints: resolvedValues.specialConstraints
    }
  };
}

function parseMarkdownSongInput(sourcePath) {
  const markdown = fs.readFileSync(sourcePath, "utf8");
  const sections = parseSections(markdown);
  return normalizeParsedInput(sourcePath, markdown, sections);
}

module.exports = {
  parseMarkdownSongInput,
  parseSections,
  parseBulletList,
  normalizeParsedInput,
  parseSectionEntries,
  findCanonicalFieldForHeading
};

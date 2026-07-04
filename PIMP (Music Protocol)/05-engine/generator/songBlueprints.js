const fs = require("node:fs");

function lower(value) {
  return (value || "").toLowerCase();
}

function uniqueList(values) {
  const seen = new Set();
  const output = [];

  for (const value of values) {
    const trimmed = (value || "").trim();
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

function startLower(value) {
  const trimmed = (value || "").trim();
  if (!trimmed) {
    return "";
  }

  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
}

const sourcePreludeCache = new Map();

function readSourcePrelude(input) {
  const sourcePath = input && input.sourcePath;
  if (!sourcePath) {
    return "";
  }

  if (sourcePreludeCache.has(sourcePath)) {
    return sourcePreludeCache.get(sourcePath);
  }

  let prelude = "";

  try {
    const markdown = fs.readFileSync(sourcePath, "utf8").replace(/\r\n/g, "\n");
    const lines = markdown.split("\n");
    const collected = [];
    let seenH1 = false;

    for (const line of lines) {
      if (!seenH1) {
        if (/^#\s+/.test(line)) {
          seenH1 = true;
        }
        continue;
      }

      if (/^##\s+/.test(line)) {
        break;
      }

      collected.push(line);
    }

    prelude = collected.join("\n").trim();
  } catch (error) {
    prelude = "";
  }

  sourcePreludeCache.set(sourcePath, prelude);
  return prelude;
}

function splitIdentityParts(identity) {
  return String(identity || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
}

function summarizeIdentityForWrapper(input, identity, genreFramework) {
  const signalText = buildSignalText(input);
  const parts = splitIdentityParts(identity);

  if (hasMoralConflictSignals(signalText)) {
    if (parts.some((part) => lower(part).includes("practical")) && parts.some((part) => lower(part).includes("church"))) {
      return "a practical man sitting uneasy in church";
    }

    return "a narrator carrying something he still will not say";
  }

  if (hasInternalConflictSignals(signalText)) {
    const subtype = detectInternalSubtype(signalText);

    if (subtype === "self_justifying") {
      return "a man still trying to make his own excuse sound clean";
    }

    if (subtype === "public_private") {
      return signalText.includes("factory") || signalText.includes("warehouse")
        ? "a workday joker keeping strain tucked behind the grin"
        : "a man keeping the smile on while the strain shows through";
    }

    if (subtype === "emotional_inversion") {
      return "someone staying put after the feeling already went flat";
    }

    if (subtype === "low_event_absence") {
      return signalText.includes("porch")
        ? "someone letting the porch become a habit of waiting"
        : "someone sitting still long enough for absence to take over";
    }

    if (subtype === "moral_gray") {
      return "someone trying not to name a wrong thing too clearly";
    }
  }

  if (signalText.includes("motel") || signalText.includes("vacancy sign")) {
    return "a man trying to sound normal while he keeps doubling back";
  }

  if (signalText.includes("male narrator") && signalText.includes("coming apart")) {
    return "a man trying to hold his voice steady";
  }

  if (parts.length >= 2) {
    return `${startLower(parts[0])}, ${startLower(parts[1])}`;
  }

  if (parts.length === 1) {
    return startLower(parts[0]);
  }

  if (genreFramework) {
    return "the narrator at the center of it";
  }

  return "the narrator at the center of it";
}

function summarizeGenreForWrapper(genreFramework) {
  const lowered = startLower(genreFramework);

  if (lowered.includes("heartland rock / americana")) {
    return "heartland rock / americana";
  }

  if (lowered.includes("americana / heartland-adjacent")) {
    return "americana / heartland-adjacent";
  }

  if (lowered.includes("heartland rock, maybe")) {
    return "heartland rock";
  }

  if (lowered.includes("upbeat heartland rock")) {
    return "upbeat heartland rock / light country rock";
  }

  if (lowered.includes("modern acoustic or indie-folk")) {
    return "modern acoustic / indie-folk";
  }

  if (lowered.includes("slow americana")) {
    return "slow americana";
  }

  if (lowered.includes("americana with country storytelling")) {
    return "americana with country storytelling";
  }

  return lowered;
}

function buildSignalText(input) {
  const parserMetadata = input.parserMetadata || {};
  const sideNotes = parserMetadata.sideNotes || {};
  const sourcePrelude = readSourcePrelude(input);

  return lower(
    [
      input.title,
      sourcePrelude,
      input.rawUserIntent,
      input.allText,
      input.possibleGenreFramework,
      input.vocalDirection,
      (input.desiredDirection || []).join(" "),
      (input.specialConstraints || []).join(" "),
      (input.instrumentationHints || []).join(" "),
      (parserMetadata.imageryHints || []).join(" "),
      (parserMetadata.behaviorHints || []).join(" "),
      (sideNotes.chorusHints || []).join(" "),
      (sideNotes.toneModifiers || []).join(" "),
      (sideNotes.structuralNotes || []).join(" ")
    ].join(" ")
  );
}

function includesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function hasMoralConflictSignals(text) {
  return (
    includesAny(text, ["church", "communion", "pew", "hymn", "belief", "believes enough", "faith"]) &&
    includesAny(text, ["kept his mouth shut", "kept my mouth shut", "cover for", "covering for", "confession", "guilt", "ashamed", "lets it pass"])
  );
}

function hasInternalConflictSignals(text) {
  return includesAny(text, [
    "self-deception",
    "i did what i had to",
    "public persona",
    "private reality",
    "wrong underneath",
    "emotional inversion",
    "runs out of reaction",
    "almost no movement",
    "absence, not action",
    "moral ambiguity",
    "no clear side",
    "both knew better",
    "no resolution"
  ]);
}

function detectInternalSubtype(text) {
  if (includesAny(text, ["self-deception", "i did what i had to", "good guy"])) {
    return "self_justifying";
  }

  if (includesAny(text, ["public persona", "private reality", "wrong underneath", "laughs a second too long"])) {
    return "public_private";
  }

  if (includesAny(text, ["emotional inversion", "runs out of reaction", "nobody is arguing", "same room"])) {
    return "emotional_inversion";
  }

  if (includesAny(text, ["almost no movement", "absence, not action", "truck that never pulls in", "empty chair", "porch light"])) {
    return "low_event_absence";
  }

  if (includesAny(text, ["moral ambiguity", "no clear side", "both knew better", "no judgment tone"])) {
    return "moral_gray";
  }

  return "internal_generic";
}

function detectScenario(input) {
  const raw = buildSignalText(input);

  if (raw.includes("sister") && raw.includes("brother") && (raw.includes("wooden box") || raw.includes("21-gun salute"))) {
    return "baby_brother";
  }

  if ((raw.includes("revenge") || raw.includes("retribution")) && raw.includes("whistling")) {
    return "whistler";
  }

  return "generic";
}

function inferGenericIdentity(input) {
  const signalText = buildSignalText(input);
  const parts = [];

  if (hasMoralConflictSignals(signalText)) {
    if (includesAny(signalText, ["blue-collar", "practical with his hands", "practical things with his hands", "work boots"])) {
      parts.push("blue-collar man used to practical fixes");
    } else if (signalText.includes("male narrator") || signalText.includes("a man")) {
      parts.push("working man under strain");
    }

    if (includesAny(signalText, ["church", "pew", "communion", "hymn", "believes enough"])) {
      parts.push("uneasy in church with belief still catching");
    }

    if (includesAny(signalText, ["kept his mouth shut", "kept my mouth shut", "cover for", "covering for", "younger brother"])) {
      parts.push("older-brother figure carrying what he kept quiet");
    }

    if (includesAny(signalText, ["can't fix with his hands", "can't fix with his hands", "morally cornered", "lets it pass"])) {
      parts.push("morally trapped by what he cannot fix");
    }
  } else if (hasInternalConflictSignals(signalText)) {
    const subtype = detectInternalSubtype(signalText);

    if (subtype === "self_justifying") {
      parts.push("man talking himself back into the decent version of what he did");
    } else if (subtype === "public_private") {
      parts.push(
        signalText.includes("factory") || signalText.includes("warehouse")
          ? "workday joker holding strain behind the smile"
          : "man keeping the smile on a beat too long"
      );
    } else if (subtype === "emotional_inversion") {
      parts.push("someone staying in the room after the feeling already burned off");
    } else if (subtype === "low_event_absence") {
      parts.push(
        signalText.includes("porch")
          ? "someone making a habit out of waiting on the porch"
          : "someone making a habit out of waiting on absence"
      );
    } else if (subtype === "moral_gray") {
      parts.push("someone trying not to call it wrong while knowing better");
    } else {
      parts.push("narrator speaking around what would make the truth plain");
    }
  } else {
    if (signalText.includes("from his point of view") || signalText.includes("male narrator point of view")) {
      parts.push("Male narrator point of view");
    } else if (signalText.includes("from her point of view") || signalText.includes("sister's perspective")) {
        parts.push("Female narrator point of view");
    }

    if (signalText.includes("late 20s") || signalText.includes("early 30s")) {
      parts.push("late-20s / early-30s voice");
    }

    if (signalText.includes("trying to sound normal")) {
      parts.push("trying to sound normal while clearly coming apart");
    }

    if (signalText.includes("calm menace")) {
      parts.push("calm, controlled threat");
    }
  }

  if (!parts.length && input.vocalDirection) {
    parts.push(input.vocalDirection);
  }

  return parts.length ? uniqueList(parts).join("; ") : "close-held narrator voice";
}

function inferGenericVoiceCue(input) {
  const signalText = buildSignalText(input);

  if (hasMoralConflictSignals(signalText)) {
    return "male lead vocal, held-in and worn";
  }

  if (hasInternalConflictSignals(signalText)) {
    return "close conversational lead vocal";
  }

  if (signalText.includes("male narrator")) {
    return "male lead vocal, worn but controlled";
  }

  if (signalText.includes("female narrator")) {
    return "female lead vocal, intimate and direct";
  }

  return "grounded lead vocal, close and conversational";
}

function inferGenericTension(input) {
  const signalText = buildSignalText(input);

  if (hasMoralConflictSignals(signalText)) {
    return "ritual pressure on a practical man carrying what he kept quiet";
  }

  if (hasInternalConflictSignals(signalText)) {
    const subtype = detectInternalSubtype(signalText);

    if (subtype === "self_justifying") {
      return "keeping the decent version alive while the compromise keeps showing through";
    }

    if (subtype === "public_private") {
      return "holding a light public face over pressure he will not show";
    }

    if (subtype === "emotional_inversion") {
      return "an ending that already happened while the reaction drains out slower than the room does";
    }

    if (subtype === "low_event_absence") {
      return "waiting made tense by what never arrives";
    }

    if (subtype === "moral_gray") {
      return "trying not to name it wrong or right while both people know better";
    }
  }

  if (signalText.includes("moved on") && signalText.includes("orbiting old places")) {
    return "acting functional while still circling a life that has already moved on";
  }

  if (signalText.includes("revenge")) {
    return "retaliation held under restraint";
  }

  return "unresolved pressure that remains only partially specified";
}

function inferGenericRelease(input) {
  const signalText = buildSignalText(input);

  if (hasMoralConflictSignals(signalText)) {
    return "silence, non-participation, and what he still does not say";
  }

  if (hasInternalConflictSignals(signalText)) {
    const subtype = detectInternalSubtype(signalText);

    if (subtype === "self_justifying") {
      return "the excuse still hanging there instead of confession";
    }

    if (subtype === "public_private") {
      return "the smile put back on while the pressure stays underneath";
    }

    if (subtype === "emotional_inversion") {
      return "the reaction thinning out instead of breaking open";
    }

    if (subtype === "low_event_absence") {
      return "waiting left in place instead of closure";
    }

    if (subtype === "moral_gray") {
      return "the line kept blurred and unresolved";
    }
  }

  if (signalText.includes("vacancy sign") || signalText.includes("motel")) {
    return "restless observation rather than closure";
  }

  return "intentional restraint while the source detail stays limited";
}

function compressGenericGenre(input) {
  const text = buildSignalText(input);

  if (text.includes("americana") && text.includes("heartland") && text.includes("southern gospel")) {
    return "Americana / heartland-adjacent with southern-gospel shadow";
  }

  if (text.includes("heartland rock") && text.includes("americana") && text.includes("90s country")) {
    return "Heartland rock / Americana with 90s country storytelling";
  }

  if (text.includes("americana") && text.includes("country")) {
    return "Americana with country storytelling";
  }

  if (text.includes("country ballad")) {
    return "Americana with country storytelling";
  }

  if (input.possibleGenreFramework) {
    return input.possibleGenreFramework;
  }

  return "Genre framework not explicitly set; preserve the source idea without broadening it";
}

function inferGenericArc(input) {
  const directions = uniqueList(input.desiredDirection || []).map(lower);
  const behaviorHints = ((input.parserMetadata && input.parserMetadata.behaviorHints) || []).join(" ").toLowerCase();
  const signalText = buildSignalText(input);
  const recurringImage = input.parserMetadata && input.parserMetadata.recurringImage;

  if (hasMoralConflictSignals(signalText)) {
    if (includesAny(signalText, ["believes enough", "hymn", "communion", "church"])) {
      return "Belief residue -> ritual discomfort -> withheld confession";
    }

    return "Practical composure -> moral tightening -> unresolved passing-by";
  }

  if (hasInternalConflictSignals(signalText)) {
    const subtype = detectInternalSubtype(signalText);

    if (subtype === "self_justifying") {
      return "Self-justification -> cracks show -> no clean admission";
    }

    if (subtype === "public_private") {
      return "Public ease -> private squeeze -> mask stays on";
    }

    if (subtype === "emotional_inversion") {
      return "Hot start -> numb drift -> almost no reaction";
    }

    if (subtype === "low_event_absence") {
      return "Waiting -> repetition -> absence still running the room";
    }

    if (subtype === "moral_gray") {
      return "Pull -> hesitation -> unresolved blur";
    }
  }

  if (behaviorHints.includes("keeps saying he's fine") || behaviorHints.includes("moved on")) {
    return `Held-together surface -> restless repetition -> ${lower(recurringImage || input.title)} as the thing he can't shake`;
  }

  if (directions.includes("restrained") && (directions.includes("guilty") || directions.includes("ashamed"))) {
    return "Restrained composure -> guilt tightening -> held-back release";
  }

  if (directions.includes("restless") && (directions.includes("tired") || directions.includes("lonely but not theatrical"))) {
    return "Held-together surface -> tired repetition -> unresolved drift";
  }

  const arcTerms = directions.filter((item) => !["plainspoken", "grounded", "human", "story-driven", "strong images", "blue-collar without cosplay"].includes(item));

  if (arcTerms.length >= 3) {
    return `${arcTerms[0]} -> ${arcTerms[1]} -> ${arcTerms[2]}`;
  }

  if (arcTerms.length >= 2) {
    return `${arcTerms[0]} -> ${arcTerms[1]} -> held-back release`;
  }

  if (arcTerms.length === 1) {
    return `${arcTerms[0]} -> pressure rises -> release stays partial`;
  }

  return "Emotional movement present but not fully specified";
}

function inferGenericProduction(input) {
  const signalText = buildSignalText(input);
  const sideNotes = (input.parserMetadata && input.parserMetadata.sideNotes) || {};
  const cues = [];
  const moralConflict = hasMoralConflictSignals(signalText);

  if ((sideNotes.productionSuggestions || []).length) {
    const suggestionText = lower(sideNotes.productionSuggestions.join(" "));
    if (suggestionText.includes("open sparse")) {
      cues.push("sparse opening");
    }
    if (suggestionText.includes("widen")) {
      cues.push("wider chorus lift");
    }
  }

  if (!moralConflict && (signalText.includes("heartland rock") || signalText.includes("americana") || signalText.includes("country"))) {
    cues.push("guitar-led bed");
  }

  if (!moralConflict && (signalText.includes("plainspoken") || signalText.includes("human") || signalText.includes("close"))) {
    cues.push("close dry lead vocal");
  }

  if (moralConflict) {
    cues.push("steady guitar bed");
    cues.push("held-in lead vocal");
    if (includesAny(signalText, ["southern gospel", "church", "hymn"])) {
      cues.push("low harmony shadow");
    }
  }

  if (hasInternalConflictSignals(signalText)) {
    cues.push("close-held lead vocal");
    if (includesAny(signalText, ["minimal", "indie-folk"])) {
      cues.push("spare arrangement");
    }
    if (includesAny(signalText, ["upbeat", "feel-good"])) {
      cues.push("bright surface with pressure underneath");
    }
  }

  if (signalText.includes("restless")) {
    cues.push("steady late-entry drums");
  }

  if (signalText.includes("lonely") || signalText.includes("motel") || signalText.includes("parking lot")) {
    cues.push("low night-drive ambience");
  }

  const uniqueCues = uniqueList(cues);

  if (!uniqueCues.length) {
    return {
      text: "Production layer remains conservative until clearer sonic cues are provided",
      status: "missing"
    };
  }

  return {
    text: uniqueCues.join(", "),
    status: "inferred"
  };
}

function buildRecoveredSummary(input, identity, genreFramework, tension, release) {
  const loweredGenre = summarizeGenreForWrapper(genreFramework);
  const identitySummary = summarizeIdentityForWrapper(input, identity, genreFramework);

  return [
    `Built as ${loweredGenre}, it stays with ${identitySummary}.`,
    `The pressure comes from ${startLower(tension)}.`,
    `It leaves the release in ${startLower(release)}.`
  ].join(" ");
}

function buildOpenEndedSummary(input, identity, tension, release) {
  return [
    "A protocol-aligned first draft built from partial source signal.",
    `Identity stays ${startLower(identity || "open-ended")}.`,
    `The pressure remains ${startLower(tension || "traceable to the supplied idea")}.`,
    `Release stays ${startLower(release || "conservative where the source details stay ambiguous")}.`
  ].join(" ");
}

function buildBabyBrotherBlueprint() {
  return {
    scenario: "baby_brother",
    signalStack: {
      identity: "Older sister narrator; nurturing, reflective, protective, deeply personal",
      emotional_arc: "Warm memory -> playful youth -> worried affection -> dread -> irreversible grief",
      genre_framework: "Acoustic memorial ballad with folk-country intimacy and restrained cinematic sorrow",
      production_layer: "Soft acoustic guitar, close piano, low cello, restrained strings, delicate dynamics, intimate vocal presence",
      structure: ["Intro", "Verse 1", "Verse 2", "Pre-Chorus", "Chorus", "Verse 3", "Bridge", "Final Chorus", "Outro"]
    },
    conceptProfile: {
      dominantTension: "Love colliding with irreversible loss",
      releaseMode: "Quiet devastation rather than dramatic catharsis",
      summary:
        "A soft, intimate memorial ballad told from the perspective of an older sister reflecting on childhood mischief, teenage trouble, and the unbearable finality of losing her brother to war. The identity is tender and personal, the dominant tension is love colliding with irreversible loss, and the release comes as quiet devastation rather than dramatic catharsis."
    },
    stylePromptCues: [
      "Soft acoustic memorial ballad with folk-country intimacy and restrained cinematic sorrow",
      "tender female vocal sung close and emotionally honest",
      "acoustic guitar and soft piano upfront",
      "low cello and gentle strings entering gradually",
      "minimal percussion",
      "warm natural room tone",
      "human lived-detail lyric feel",
      "reflective childhood memories turning into military loss and quiet devastation",
      "intimate mix",
      "clear lead vocal",
      "emotional build without melodrama",
      "grounded grief",
      "slow dynamic rise",
      "delicate and deeply personal",
      "no generic military imagery",
      "no vague grief phrasing",
      "older-sister point of view stays central",
      "quiet devastation without theatrical oversell"
    ]
  };
}

function buildWhistlerBlueprint() {
  return {
    scenario: "whistler",
    signalStack: {
      identity: "Calm outlaw narrator; hardened, watchful, emotionally withheld, dangerous by implication",
      emotional_arc: "Silent approach -> memory of wrong -> tightening threat -> violent reckoning -> ghostly aftermath",
      genre_framework: "Dark Americana folk country with old-country outlaw influence and cinematic frontier tension",
      production_layer: "Sparse acoustic guitar, low upright bass, brushed snare, tremolo guitar accents, whistle motif, dry vocal, shadowy space",
      structure: ["Intro", "Verse 1", "Verse 2", "Pre-Chorus", "Chorus", "Verse 3", "Bridge", "Final Chorus", "Outro"]
    },
    conceptProfile: {
      dominantTension: "Revenge carried with patience rather than rage",
      releaseMode: "Inevitable violence and the haunting whistle that frames the story",
      summary:
        "A dark Americana outlaw ballad about a cold, methodical gunman returning to settle an old score. The identity is controlled and menacing, the dominant tension is revenge carried with patience rather than rage, and the release comes through inevitable violence and the haunting whistle that frames the story."
    },
    stylePromptCues: [
      "Dark Americana folk country with old-country outlaw energy",
      "low weathered male vocal delivered with calm menace",
      "sparse acoustic guitar, upright bass, brushed snare, tremolo guitar accents",
      "lonesome whistle motif at beginning and end",
      "dry intimate mix",
      "cinematic frontier tension",
      "story-driven revenge ballad",
      "dusty and shadowed atmosphere",
      "restrained dynamics with violent payoff",
      "grounded language",
      "no cartoon outlaw swagger",
      "cold deliberate pacing",
      "haunting aftermath",
      "no overexplained revenge backstory",
      "sharp grounded language"
    ]
  };
}

function buildGenericBlueprint(input) {
  const instrumentation = (input.instrumentationHints || []).join(", ");
  const parserMetadata = input.parserMetadata || {};
  const imageryHints = parserMetadata.imageryHints || [];
  const recurringImage = parserMetadata.recurringImage || input.title;
  const identity = inferGenericIdentity(input);
  const tension = inferGenericTension(input);
  const release = inferGenericRelease(input);
  const genreFramework = compressGenericGenre(input);
  const emotionalArc = inferGenericArc(input);
  const production = instrumentation
    ? { text: instrumentation, status: "explicit" }
    : inferGenericProduction(input);
  const stylePromptCues = uniqueList([
    genreFramework,
    inferGenericVoiceCue(input),
    emotionalArc,
    production.text,
    parserMetadata.sideNotes && parserMetadata.sideNotes.chorusHints && parserMetadata.sideNotes.chorusHints.length
      ? `${parserMetadata.sideNotes.chorusHints[0]} as recurring chorus image`
      : imageryHints.length
        ? `${recurringImage} as recurring image anchor`
        : "",
    ...((parserMetadata.sideNotes && parserMetadata.sideNotes.toneModifiers) || []).slice(0, 2)
  ]);

  return {
    scenario: "generic",
    signalStack: {
      identity,
      emotional_arc: emotionalArc,
      genre_framework: genreFramework,
      production_layer: production.text,
      structure: ["Intro", "Verse 1", "Pre-Chorus", "Chorus", "Bridge", "Outro"]
    },
    conceptProfile: {
      dominantTension: tension,
      releaseMode: release,
      summary: input.rawUserIntent
        ? buildRecoveredSummary(input, identity, genreFramework, tension, release)
        : buildOpenEndedSummary(input, identity, tension, release)
    },
    stylePromptCues,
    signalStackMeta: {
      productionLayerStatus: production.status
    }
  };
}

function getSongBlueprint(input) {
  const scenario = detectScenario(input);

  if (scenario === "baby_brother") {
    return buildBabyBrotherBlueprint();
  }

  if (scenario === "whistler") {
    return buildWhistlerBlueprint();
  }

  return buildGenericBlueprint(input);
}

module.exports = {
  detectScenario,
  getSongBlueprint,
  lower,
  hasInternalConflictSignals,
  detectInternalSubtype,
  readSourcePrelude
};

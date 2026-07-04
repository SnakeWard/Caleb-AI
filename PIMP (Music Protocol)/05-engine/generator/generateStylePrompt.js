const DEFAULT_STYLE_LIMIT = 1000;
const { getSongBlueprint } = require("./songBlueprints");

function uniqueParts(parts) {
  const seen = new Set();
  const output = [];

  for (const part of parts) {
    const trimmed = (part || "").trim().replace(/\s+/g, " ");
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

function normalizeCommaList(values) {
  return values.filter(Boolean).join(", ");
}

function lower(value) {
  return (value || "").toLowerCase();
}

function isMetaConstraint(text) {
  return /\b(style prompt|under\s+\d+\s*characters|character limit|remain under|under 1000)\b/i.test(text || "");
}

function mapDesiredDirectionToCue(direction) {
  const normalized = (direction || "").trim().toLowerCase();
  const map = {
    "emotionally devastating": "devastating emotional payoff",
    grounded: "grounded language",
    human: "human lived-detail lyric feel",
    restrained: "restrained posture",
    guilty: "guilt under the surface",
    tired: "worn-down energy",
    ashamed: "shame under pressure",
    "morally cornered": "moral pressure in close quarters",
    "not melodramatic": "emotional build without melodrama",
    "soft and intimate": "soft intimate delivery",
    "progressive emotional build": "slow dynamic rise",
    dark: "dark atmosphere",
    cinematic: "cinematic frontier tension",
    menacing: "calm menace",
    dusty: "dusty atmosphere",
    "cold-blooded": "cold deliberate pacing",
    "story-driven": "story-driven narrative focus"
  };

  return map[normalized] || "";
}

function compressGenreCue(text) {
  const normalized = lower(text);

  if (normalized.includes("heartland-adjacent") && normalized.includes("southern-gospel shadow")) {
    return "americana / heartland-adjacent with southern-gospel shadow";
  }

  if (normalized.includes("heartland rock") && normalized.includes("americana") && normalized.includes("90s country")) {
    return "heartland rock / americana with 90s-country storytelling";
  }

  if (normalized.includes("americana") && normalized.includes("country")) {
    return "americana with country storytelling";
  }

  return text || "";
}

function compressIdentityCue(text) {
  const normalized = lower(text);

  if (normalized.includes("blue-collar") && normalized.includes("church")) {
    return "blue-collar male lead, held-in and worn";
  }

  if (normalized.includes("moral") && normalized.includes("kept quiet")) {
    return "working-man vocal posture, carrying what he kept quiet";
  }

  if (normalized.includes("decent version") || normalized.includes("excuse sound clean")) {
    return "male lead vocal, conversational and self-justifying";
  }

  if (normalized.includes("smile on a beat too long") || normalized.includes("strain behind the smile")) {
    return "male lead vocal, easy on the surface, strain underneath";
  }

  if (normalized.includes("feeling already burned off") || normalized.includes("went flat")) {
    return "close lead vocal, drained and unsentimental";
  }

  if (normalized.includes("waiting on absence") || normalized.includes("porch")) {
    return "close lead vocal, restrained and watchful";
  }

  if (normalized.includes("knowing better")) {
    return "close lead vocal, careful and unresolved";
  }

  if (normalized.includes("male narrator")) {
    return "male lead vocal, worn but controlled";
  }

  if (normalized.includes("female narrator")) {
    return "female lead vocal, intimate and direct";
  }

  return text || "";
}

function compressArcCue(text) {
  const normalized = lower(text);

  if (normalized.includes("belief residue") && normalized.includes("withheld confession")) {
    return "belief-fracture, ritual discomfort, withheld confession";
  }

  if (normalized.includes("practical composure") && normalized.includes("passing-by")) {
    return "practical composure, moral tightening, unresolved passing-by";
  }

  if (normalized.includes("held-together surface") && normalized.includes("restless repetition")) {
    return "held-together surface, restless repetition";
  }

  if (normalized.includes("self-justification") && normalized.includes("no clean admission")) {
    return "self-justification, cracks showing, no clean admission";
  }

  if (normalized.includes("public ease") && normalized.includes("mask stays on")) {
    return "public ease, private squeeze, mask stays on";
  }

  if (normalized.includes("hot start") && normalized.includes("almost no reaction")) {
    return "hot start, numb drift, almost no reaction";
  }

  if (normalized.includes("waiting") && normalized.includes("absence still running the room")) {
    return "waiting, repetition, absence running the room";
  }

  if (normalized.includes("pull") && normalized.includes("unresolved blur")) {
    return "pull, hesitation, unresolved blur";
  }

  return "";
}

function compressProductionCue(text) {
  const normalized = lower(text);

  if (normalized.includes("close-held lead vocal") && normalized.includes("bright surface with pressure underneath")) {
    return "close-held lead vocal, bright surface with pressure underneath";
  }

  if (normalized.includes("close-held lead vocal") && normalized.includes("spare arrangement")) {
    return "close-held lead vocal, spare arrangement";
  }

  if (normalized.includes("steady guitar bed") && normalized.includes("held-in lead vocal") && normalized.includes("low harmony shadow")) {
    return "steady guitar bed, held-in lead vocal, low harmony shadow";
  }

  if (normalized.includes("guitar-led bed") && normalized.includes("close dry lead vocal") && normalized.includes("steady late-entry drums")) {
    return "guitar-led bed, close dry lead vocal, steady late-entry drums";
  }

  return text || "";
}

function pickRecoveredHookCue(hints) {
  const candidates = hints || [];
  let best = "";
  let bestScore = -1;

  for (const candidate of candidates) {
    const normalized = lower(candidate);
    let score = 0;

    if (normalized.includes("communion tray")) {
      score += 6;
    }

    if (normalized.includes("hymn")) {
      score += 5;
    }

    if (normalized.includes("pew")) {
      score += 4;
    }

    if (normalized.includes("bulletin")) {
      score += 3;
    }

    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
}

function buildRecoveredPromptParts(input, signalStack, blueprint) {
  const sideNotes = (input.parserMetadata && input.parserMetadata.sideNotes) || {};
  const chorusHint = pickRecoveredHookCue(sideNotes.chorusHints || []);
  const toneModifiers = (sideNotes.toneModifiers || []).map(mapDesiredDirectionToCue).filter(Boolean);
  const desiredDirections = input.desiredDirection.map(mapDesiredDirectionToCue).filter(Boolean);
  const constraints = input.specialConstraints.map(mapConstraintToCue).filter(Boolean);
  const genreCue = compressGenreCue(signalStack.genre_framework);
  const identityCue = compressIdentityCue(signalStack.identity);
  const arcCue = compressArcCue(signalStack.emotional_arc);
  const productionCue = compressProductionCue(signalStack.production_layer);

  return uniqueParts([
    genreCue,
    identityCue,
    arcCue,
    ...desiredDirections,
    ...toneModifiers,
    productionCue,
    chorusHint ? `${chorusHint.toLowerCase()} as recurring hook image` : "",
    ...constraints.slice(0, 2)
  ]);
}

function mapConstraintToCue(constraint) {
  const normalized = (constraint || "").trim().toLowerCase();

  if (!normalized || isMetaConstraint(normalized)) {
    return "";
  }

  const directMap = {
    "use lived details": "human lived-detail lyric feel",
    "preserve sister perspective": "older-sister point of view stays central",
    "make the final turn hit hard without becoming theatrical": "quiet devastation without theatrical oversell",
    "start with whistling": "whistle motif at the beginning",
    "end with whistling": "whistle motif at the end",
    "keep language sharp and grounded": "sharp grounded language",
    "don't turn it into a murder ballad": "no murder-ballad framing",
    "don't make it revengey": "no revenge framing",
    "don't make him sound like a poet-preacher": "plainspoken, no poet-preacher phrasing",
    "don't make the brother cartoon evil either": "no cartoon-villain framing",
    "keep the confession partial until late if possible": "partial confession held back till late",
    "i don't want it polished.": "worn-down, unpolished feel"
  };

  if (directMap[normalized]) {
    return directMap[normalized];
  }

  if (/^avoid\s+/.test(normalized)) {
    return normalized
      .replace(/^avoid\s+/i, "no ")
      .replace("military clichés", "generic military imagery")
      .replace("cartoon outlaw clichés", "cartoon outlaw swagger")
      .replace("vague grief language", "vague grief phrasing")
      .replace("overexplaining the revenge", "overexplained revenge backstory");
  }

  return "";
}

function buildStylePromptParts(input, signalStack) {
  const blueprint = getSongBlueprint(input);

  if (blueprint.scenario !== "generic") {
    return uniqueParts(blueprint.stylePromptCues);
  }

  if (input.parserMetadata && input.parserMetadata.overallStatus !== "structured") {
    return buildRecoveredPromptParts(input, signalStack, blueprint);
  }

  const derivedDirections = input.desiredDirection.map(mapDesiredDirectionToCue).filter(Boolean);
  const derivedConstraints = input.specialConstraints.map(mapConstraintToCue).filter(Boolean);

  return uniqueParts([
    ...blueprint.stylePromptCues,
    compressGenreCue(signalStack.genre_framework),
    compressIdentityCue(input.vocalDirection),
    input.instrumentationHints.length ? normalizeCommaList(input.instrumentationHints) : "",
    ...derivedDirections,
    ...derivedConstraints
  ]);
}

function compressPrompt(parts, maxLength) {
  const queue = [...parts];

  while (queue.length) {
    const prompt = queue.join(", ");
    if (prompt.length <= maxLength) {
      return prompt;
    }

    queue.pop();
  }

  return "";
}

function generateStylePrompt(input, signalStack, options = {}) {
  const maxLength = options.maxLength || DEFAULT_STYLE_LIMIT;
  const parts = buildStylePromptParts(input, signalStack);
  const stylePrompt = compressPrompt(parts, maxLength);

  return {
    stylePrompt,
    stylePromptCharCount: stylePrompt.length,
    maxLength
  };
}

module.exports = {
  DEFAULT_STYLE_LIMIT,
  generateStylePrompt
};

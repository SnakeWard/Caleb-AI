const { TIER1_PHRASES } = require("./tier1Phrases");

function normalizeText(value) {
  return (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function phraseToPattern(phrase) {
  const parts = normalizeText(phrase).split(" ");
  return new RegExp(`\\b${parts.join("\\s+")}\\b`, "i");
}

function detectAbstractPairing(text) {
  const normalized = normalizeText(text);
  const patterns = [
    /\b(shadow|echo|memory|darkness|light|storm|truth|silence)\s+(and|of|inside|within)\s+\b/,
    /\b(i|we)\s+(feel|am|are)\s+(broken|lost|haunted|empty)\b/
  ];

  return patterns.filter((pattern) => pattern.test(normalized)).length > 0
    ? ["Possible abstract cliché pairing or vague emotional declaration"]
    : [];
}

function validateAntiTrope(text, options = {}) {
  const allowListedPhrases = new Set((options.allowListedPhrases || []).map(normalizeText));
  const normalized = normalizeText(text);
  const flaggedPhrases = [];

  for (const phrase of TIER1_PHRASES) {
    if (allowListedPhrases.has(normalizeText(phrase))) {
      continue;
    }

    if (phraseToPattern(phrase).test(normalized)) {
      flaggedPhrases.push(phrase);
    }
  }

  const flaggedPatterns = detectAbstractPairing(text);

  return {
    antiTropePass: flaggedPhrases.length === 0,
    flaggedPhrases,
    flaggedPatterns,
    rewriteRecommendations: flaggedPhrases.length
      ? ["Replace prefab phrasing with concrete objects, habits, rooms, sounds, or consequences."]
      : []
  };
}

module.exports = {
  validateAntiTrope,
  normalizeText
};

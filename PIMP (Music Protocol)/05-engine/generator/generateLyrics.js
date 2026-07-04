const {
  detectScenario,
  hasInternalConflictSignals,
  detectInternalSubtype,
  readSourcePrelude
} = require("./songBlueprints");

function joinLines(lines) {
  return lines.filter(Boolean).join("\n");
}

function createSection(name, lines) {
  return `[${name}]\n${joinLines(lines)}`;
}

function sentenceSplit(text) {
  return (text || "")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function lower(value) {
  return (value || "").toLowerCase();
}

function pickImage(input, index, fallback) {
  const imageryHints = (input.parserMetadata && input.parserMetadata.imageryHints) || [];
  return imageryHints[index] || fallback;
}

function normalizeFragment(text, fallback) {
  const trimmed = (text || "").replace(/^["']|["']$/g, "").trim();
  return trimmed || fallback;
}

function toLyricImage(value, fallback) {
  const image = normalizeFragment(value, fallback);
  return image.replace(/^maybe\s+/i, "").replace(/\.$/, "");
}

function pickBehavior(input, index, fallback) {
  const hints = (input.parserMetadata && input.parserMetadata.behaviorHints) || [];
  return hints[index] || fallback;
}

function compressBehaviorHint(text, fallback) {
  const normalized = normalizeFragment(text, fallback);
  const lowered = normalized.toLowerCase();

  if (lowered.includes("keeps saying he's fine")) {
    return "keeps sayin' he's fine with smoke on his breath";
  }

  if (lowered.includes("buying coffee")) {
    return "comes back with gas-station coffee gone cold by the lid";
  }

  if (lowered.includes("hanging up before the house")) {
    return "gets as far as her street, then kills the call";
  }

  if (lowered.includes("sleeping in his truck")) {
    return "sleeps in the truck some nights with the seat kicked back";
  }

  if (lowered.includes("calling her street")) {
    return "keeps drivin' past her street, then cuts the headlights";
  }

  if (lowered.includes("moved on")) {
    return "she's gone on with her life and he still circles the block";
  }

  if (lowered.includes("orbiting old places")) {
    return "still circlin' old places like they owe him somethin'";
  }

  if (lowered.includes("kept his mouth shut") || lowered.includes("kept my mouth shut")) {
    return "kept his mouth shut when it counted most";
  }

  if (lowered.includes("lets it pass")) {
    return "lets it pass when it gets to him";
  }

  if (lowered.includes("can't quite sing")) {
    return "that hymn still catches halfway";
  }

  return normalized;
}

function compressToneHint(text) {
  const lowered = normalizeFragment(text, "plainspoken").toLowerCase();

  if (lowered.includes("lonely but not theatrical")) {
    return "like it ain't worth explainin'";
  }

  if (lowered.includes("plainspoken")) {
    return "plain and low";
  }

  if (lowered.includes("restless")) {
    return "like he can't quite sit still";
  }

  return "plain and low";
}

function pickDistinctBehaviors(input) {
  const hints = (input.parserMetadata && input.parserMetadata.behaviorHints) || [];
  const unique = [];
  const seen = new Set();

  for (const hint of hints) {
    const compressed = compressBehaviorHint(hint, hint);
    const key = compressed.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(compressed);
  }

  return unique;
}

function resolveChorusImage(input, fallback) {
  const sideNotes = (input.parserMetadata && input.parserMetadata.sideNotes) || {};
  return toLyricImage((sideNotes.chorusHints || [])[0], fallback);
}

function resolveProductionImage(input, fallback) {
  const sideNotes = (input.parserMetadata && input.parserMetadata.sideNotes) || {};
  const suggestion = (sideNotes.productionSuggestions || [])[0] || "";
  if (/ice machine/i.test(suggestion)) {
    return "ice machine rattlin' through the wall";
  }

  return fallback;
}

function buildRecoveredSignalText(input, signalStack) {
  const parserMetadata = input.parserMetadata || {};
  const sideNotes = parserMetadata.sideNotes || {};
  const sourcePrelude = readSourcePrelude(input);

  return lower(
    [
      sourcePrelude,
      input.rawUserIntent,
      input.possibleGenreFramework,
      input.vocalDirection,
      signalStack.identity,
      signalStack.emotional_arc,
      (input.desiredDirection || []).join(" "),
      (parserMetadata.imageryHints || []).join(" "),
      (parserMetadata.behaviorHints || []).join(" "),
      (sideNotes.chorusHints || []).join(" "),
      (sideNotes.structuralNotes || []).join(" ")
    ].join(" ")
  );
}

function isRecoveredInternalConflictSong(input, signalStack) {
  const signalText = buildRecoveredSignalText(input, signalStack);
  return hasInternalConflictSignals(signalText) && !isRecoveredMoralConflictSong(input, signalStack);
}

function isRecoveredMoralConflictSong(input, signalStack) {
  const signalText = buildRecoveredSignalText(input, signalStack);

  return (
    /(church|communion|hymn|pew|belief|faith)/i.test(signalText) &&
    /(kept his mouth shut|kept my mouth shut|cover for|covering for|confession|guilt|ashamed|lets it pass)/i.test(signalText)
  );
}

function gatherRecoveredCandidates(input) {
  const parserMetadata = input.parserMetadata || {};
  const sideNotes = parserMetadata.sideNotes || {};

  return [
    ...(sideNotes.chorusHints || []),
    ...(parserMetadata.behaviorHints || []),
    ...(parserMetadata.imageryHints || [])
  ];
}

function scoreMoralHookCandidate(candidate) {
  const lowered = lower(candidate);
  let score = 0;

  if (lowered.includes("communion tray")) {
    score += 8;
  }

  if (lowered.includes("lets it pass")) {
    score += 7;
  }

  if (lowered.includes("hymn")) {
    score += 6;
  }

  if (lowered.includes("can't quite sing")) {
    score += 5;
  }

  if (lowered.includes("pew")) {
    score += 4;
  }

  if (lowered.includes("bulletin")) {
    score += 3;
  }

  return score;
}

function pickMoralHook(input) {
  const candidates = gatherRecoveredCandidates(input).filter(Boolean);
  let best = "";
  let bestScore = -1;

  for (const candidate of candidates) {
    const score = scoreMoralHookCandidate(candidate);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return normalizeFragment(best, "hymn he can't quite sing");
}

function buildMoralConflictChorusLines(input) {
  const hook = pickMoralHook(input);
  const lowered = lower(hook);
  const hasHymn = gatherRecoveredCandidates(input).some((item) => lower(item).includes("hymn"));

  if (lowered.includes("communion tray") || lowered.includes("lets it pass")) {
    return [
      "communion tray comin' closer",
      "he lets it pass",
      hasHymn ? "that hymn stays caught halfway back" : "keeps both hands where they are"
    ];
  }

  if (lowered.includes("hymn")) {
    return [
      "hymn he can't quite sing",
      "stalls halfway back",
      "everybody else knows when to come in"
    ];
  }

  if (lowered.includes("pew")) {
    return [
      "stuck in that same pew",
      "don't move when the row steps out",
      "lets the whole thing pass him by"
    ];
  }

  return [
    "folded bulletin in his fist",
    "don't let it open up",
    "lets the tray go by again"
  ];
}

function buildMoralConflictBridgeLines(input) {
  const candidates = gatherRecoveredCandidates(input).map((item) => lower(item));
  const hasCommunion = candidates.some((item) => item.includes("communion tray") || item.includes("lets it pass"));
  const hasBulletin = candidates.some((item) => item.includes("bulletin"));
  const hasHymn = candidates.some((item) => item.includes("hymn"));
  const raw = lower(input.rawUserIntent);

  const firstLine = raw.includes("kept his mouth shut") || raw.includes("kept my mouth shut")
    ? "could tell it plain, still don't"
    : "ain't said the part that counts";

  if (hasCommunion) {
    return [firstLine, "tray gets to his row, he keeps his hands down"];
  }

  if (hasHymn) {
    return [firstLine, "whole room sings and he drops out again"];
  }

  if (hasBulletin) {
    return [firstLine, "just folds that paper smaller in his hand"];
  }

  return [firstLine, "stands there quiet and lets it pass"];
}

function buildMoralConflictOutroLines(input) {
  const candidates = gatherRecoveredCandidates(input).map((item) => lower(item));
  const hasCommunion = candidates.some((item) => item.includes("communion tray") || item.includes("lets it pass"));
  const hasHymn = candidates.some((item) => item.includes("hymn"));
  const hasBulletin = candidates.some((item) => item.includes("bulletin"));

  if (hasCommunion && hasBulletin) {
    return [
      "folded bulletin in his fist",
      "tray goes by and he don't move"
    ];
  }

  if (hasCommunion) {
    return [
      "communion tray goin' past",
      "he don't reach for it"
    ];
  }

  if (hasHymn) {
    return [
      "hymn he can't quite sing",
      "lets the last line go on without him"
    ];
  }

  if (hasBulletin) {
    return [
      "folded bulletin in his fist",
      "just folds it smaller and stays put"
    ];
  }

  return [
    "stays with it and says nothin'",
    "lets the room move on without him"
  ];
}

function buildRecoveredMoralConflictLyrics(input, signalStack) {
  const imageOne = toLyricImage(pickImage(input, 0, "folded bulletin in his fist"), "folded bulletin in his fist");
  const imageTwo = toLyricImage(pickImage(input, 1, "hymn he can't quite sing"), "hymn he can't quite sing");
  const imageThree = toLyricImage(pickImage(input, 2, "mud still dried on work boots"), "mud still dried on work boots");
  const imageFour = toLyricImage(pickImage(input, 3, "county line still flashin' back"), "county line still flashin' back");
  const behaviors = pickDistinctBehaviors(input);
  const concealmentLine = behaviors.find((item) => lower(item).includes("mouth shut")) || "kept his mouth shut when it counted most";
  const pressureLine = behaviors.find((item) => lower(item).includes("lets it pass")) || "lets it pass when it gets to him";
  const practicalLine = lower(signalStack.identity).includes("practical")
    ? "hands that know a wrench ain't good for this"
    : "ain't a thing in here he can set right";

  return [
    createSection("Intro", [
      imageOne,
      imageTwo
    ]),
    createSection("Verse 1", [
      imageThree,
      concealmentLine,
      practicalLine
    ]),
    createSection("Pre-Chorus", [
      imageFour,
      "room gets quiet and it all comes back",
      pressureLine
    ]),
    createSection("Chorus", buildMoralConflictChorusLines(input)),
    createSection("Bridge", buildMoralConflictBridgeLines(input)),
    createSection("Outro", buildMoralConflictOutroLines(input))
  ].join("\n\n");
}

function pickInternalCandidate(input, patterns, fallback) {
  const candidates = gatherRecoveredCandidates(input);
  const match = candidates.find((candidate) => patterns.some((pattern) => pattern.test(lower(candidate))));
  return normalizeFragment(match, fallback);
}

function scoreInternalPressureLine(subtype, line) {
  const lowered = lower(line);
  let score = 0;

  if (/(ain't|don't|did what i had to|both knew better|laughs a second too long|truck that never pulls in|silence is the loudest thing|keep|still|wrong|ignored|never)/i.test(line)) {
    score += 4;
  }

  if (/(call|grin|smile|voice down|phone ring out|turned.*off|loudest|waitin'|decent|reasons)/i.test(line)) {
    score += 3;
  }

  if (subtype === "self_justifying" && /(had to|decent|reasons|voice down|call it that)/i.test(line)) {
    score += 4;
  }

  if (subtype === "public_private" && /(laughs a second too long|grin|good face|clocks back in)/i.test(line)) {
    score += 4;
  }

  if (subtype === "emotional_inversion" && /(louder last month|left first|loudest thing|there ain't)/i.test(line)) {
    score += 4;
  }

  if (subtype === "low_event_absence" && /(never pulls in|still ain't turned|don't go inside|same porch|empty chair)/i.test(line)) {
    score += 4;
  }

  if (subtype === "moral_gray" && /(both knew better|phone ring out|ignored|what that makes it)/i.test(line)) {
    score += 4;
  }

  if (/(pull the grin back up|straight ahead through it)/i.test(line)) {
    score += 4;
  }

  if (/(vending machine light buzzing|porch light buzzing|clocking in|late-night drive|half-packed boxes|bugs hitting the bulb|break room laughter)/i.test(line)) {
    score -= 2;
  }

  if (/don't let the grin fall off/i.test(line)) {
    score -= 3;
  }

  if (/(absence keeps the whole thing moving|he keeps the whole place easy)/i.test(line)) {
    score -= 1;
  }

  return score;
}

function pickPressureLine(subtype, candidates, fallback) {
  const filtered = candidates.filter(Boolean);
  if (!filtered.length) {
    return fallback;
  }

  return filtered
    .slice()
    .sort((left, right) => scoreInternalPressureLine(subtype, right) - scoreInternalPressureLine(subtype, left))[0];
}

function buildInternalConflictChorusLines(input, subtype) {
  if (subtype === "self_justifying") {
    return [
      'I did what I had to',
      "that's what I keep callin' it"
    ];
  }

  if (subtype === "public_private") {
    return [
      "he laughs a second too long",
      "then clocks back in"
    ];
  }

  if (subtype === "emotional_inversion") {
    return [
      "nobody is arguing",
      "silence is the loudest thing"
    ];
  }

  if (subtype === "low_event_absence") {
    return [
      "truck that never pulls in",
      "porch light still on"
    ];
  }

  if (subtype === "moral_gray") {
    return [
      "both knew better",
      "still let the phone ring out"
    ];
  }

  return [
    pickInternalCandidate(input, [/.+/], "keeps talkin' around it"),
    "never gets to the clean part"
  ];
}

function buildInternalConflictBridgeLines(input, subtype) {
  if (subtype === "self_justifying") {
    return [
      "ain't sayin' I was right",
      pickPressureLine(subtype, [
        "just keep my voice down and call it that",
        "just keep sayin' I had to"
      ], "just keep my voice down and call it that")
    ];
  }

  if (subtype === "public_private") {
    return [
      "ain't askin' anybody to see it",
      pickPressureLine(subtype, [
        "just pull the grin back up again",
        "just don't let the grin fall off"
      ], "just pull the grin back up again")
    ];
  }

  if (subtype === "emotional_inversion") {
    return [
      "there oughta be more left than this",
      "but there ain't"
    ];
  }

  if (subtype === "low_event_absence") {
    return [
      "ain't much to tell in it",
      pickPressureLine(subtype, [
        "still ain't turned that light off",
        "still the light stays on"
      ], "still ain't turned that light off")
    ];
  }

  if (subtype === "moral_gray") {
    return [
      "ain't callin' it clean",
      pickPressureLine(subtype, [
        "just let the phone ring out again",
        "ain't callin' it one thing either"
      ], "just let the phone ring out again")
    ];
  }

  return [
    "never says the straight part",
    "just leaves it sittin' there"
  ];
}

function buildInternalConflictOutroLines(input, subtype) {
  if (subtype === "self_justifying") {
    return [
      'I did what I had to',
      "still call it that"
    ];
  }

  if (subtype === "public_private") {
    return [
      "break room laughter",
      "he laughs a second too long"
    ];
  }

  if (subtype === "emotional_inversion") {
    return [
      "half-packed boxes",
      "nobody is arguing"
    ];
  }

  if (subtype === "low_event_absence") {
    return [
      "porch light buzzing",
      "truck that never pulls in"
    ];
  }

  if (subtype === "moral_gray") {
    return [
      "phone lighting up but ignored",
      "both knew better"
    ];
  }

  return [
    pickInternalCandidate(input, [/.+/], "still goin' around it"),
    "never puts it plain"
  ];
}

function buildRecoveredInternalConflictLyrics(input, signalStack) {
  const subtype = detectInternalSubtype(buildRecoveredSignalText(input, signalStack));
  const imageOne = subtype === "self_justifying"
    ? "I did what I had to"
    : toLyricImage(pickImage(input, 0, "thin room noise through the wall"), "thin room noise through the wall");
  const imageTwo = toLyricImage(pickImage(input, 1, "something held back in the room"), "something held back in the room");
  const imageThree = toLyricImage(pickImage(input, 2, "the part nobody says out loud"), "the part nobody says out loud");
  const imageFour = toLyricImage(pickImage(input, 3, "still going around the same thing"), "still going around the same thing");
  const identityText = lower(signalStack.identity);

  let introLines;
  let verseLines;
  let preLines;

  if (subtype === "self_justifying") {
    introLines = [
      "I did what I had to",
      "that's how I keep startin' it"
    ];
    verseLines = [
      "late paychecks, missed calls, little things I can explain away",
      "no big crime in it, just corners worn smooth",
      pickPressureLine(subtype, [
        "say it calm enough, it almost sounds decent",
        "still talkin' like a good man mostly"
      ], "say it calm enough, it almost sounds decent")
    ];
    preLines = [
      "I did what I had to",
      "late paychecks, missed calls, stuff like that",
      pickPressureLine(subtype, [
        "keep stackin' little reasons in front of it",
        "keep the clean version out front"
      ], "keep stackin' little reasons in front of it")
    ];
  } else if (subtype === "public_private") {
    introLines = [
      "vending machine light buzzing",
      "he laughs a second too long"
    ];
    verseLines = [
      "clocking in",
      pickPressureLine(subtype, [
        "got a line for everybody waitin'",
        "he keeps the whole place easy"
      ], "got a line for everybody waitin'"),
      "he keeps the whole place easy"
    ];
    preLines = [
      "break room laughter",
      "he laughs a second too long",
      pickPressureLine(subtype, [
        "then puts the same good face back on",
        "wrong underneath stays off his face"
      ], "then puts the same good face back on")
    ];
  } else if (subtype === "emotional_inversion") {
    introLines = [
      "half-packed boxes",
      "it would've sounded louder last month"
    ];
    verseLines = [
      "they're still in the same room",
      pickPressureLine(subtype, [
        "silence is the loudest thing",
        "half-packed boxes"
      ], "silence is the loudest thing"),
      "half-packed boxes"
    ];
    preLines = [
      "nobody is arguing",
      pickPressureLine(subtype, [
        "the feeling's already left first",
        "they're still in the same room"
      ], "the feeling's already left first"),
      "they're still in the same room"
    ];
  } else if (subtype === "low_event_absence") {
    introLines = [
      pickPressureLine(subtype, [
        "truck that never pulls in",
        "porch light buzzing"
      ], "truck that never pulls in"),
      pickPressureLine(subtype, [
        "still ain't turned it off",
        "porch light still on"
      ], "still ain't turned it off")
    ];
    verseLines = [
      "empty chair catchin' all of it",
      identityText.includes("porch") ? "same porch, same waitin'" : "same waitin', nothin' comin'",
      "bugs hitting the bulb"
    ];
    preLines = [
      "empty chair",
      pickPressureLine(subtype, [
        "still I don't go inside",
        "truck that never pulls in"
      ], "still I don't go inside"),
      "truck that never pulls in"
    ];
  } else if (subtype === "moral_gray") {
    introLines = [
      "late-night drive",
      "both knew better"
    ];
    verseLines = [
      "hands on the steering wheel too tight",
      "keep lookin' straight ahead through it",
      "phone lighting up but ignored"
    ];
    preLines = [
      "both knew better",
      pickPressureLine(subtype, [
        "still nobody says what that makes it",
        "phone lighting up but ignored"
      ], "still nobody says what that makes it"),
      "phone lighting up but ignored"
    ];
  } else {
    introLines = [imageOne, imageFour];
    verseLines = [imageOne, imageTwo, imageThree];
    preLines = [imageFour, "still goin' around it", "won't land it plain"];
  }

  return [
    createSection("Intro", introLines),
    createSection("Verse 1", verseLines),
    createSection("Pre-Chorus", preLines),
    createSection("Chorus", buildInternalConflictChorusLines(input, subtype)),
    createSection("Bridge", buildInternalConflictBridgeLines(input, subtype)),
    createSection("Outro", buildInternalConflictOutroLines(input, subtype))
  ].join("\n\n");
}

function buildRecoveredHookLine(image) {
  const lowered = lower(image);

  if (lowered.includes("ashtray")) {
    return `${image} under that same bad light`;
  }

  if (lowered.includes("vacancy sign") || lowered.includes("sign")) {
    return `${image} still buzzin' over the lot`;
  }

  if (lowered.includes("coffee")) {
    return `${image} goin' cold on the hood`;
  }

  return `${image} under that same bad light`;
}

function buildRecoveredChorusSupportLine(image, behaviors, toneHint) {
  const loweredImage = lower(image);
  const loweredBehaviors = behaviors.map((item) => item.toLowerCase());

  if (loweredImage.includes("ashtray") && loweredBehaviors.some((item) => item.includes("smoke on his breath"))) {
    return "taps it twice and says he's fine";
  }

  if (loweredBehaviors.some((item) => item.includes("cuts the headlights"))) {
    return "drives past slow and don't pull in";
  }

  if (loweredBehaviors.some((item) => item.includes("seat kicked back"))) {
    return "says he's headed home, don't turn the key";
  }

  return `keeps sayin' he's fine ${compressToneHint(toneHint)}`;
}

function scoreRecoveredChorusCandidate(line, image, behaviors) {
  const lowered = lower(line);
  let score = 0;

  if (lowered.includes(lower(image))) {
    score += 3;
  }

  if (/(says|sayin'|kills|cuts|taps|drives|sleeps|lets|holds|folds|reaches|passes)/i.test(line)) {
    score += 5;
  }

  if (behaviors.some((item) => lowered.includes(lower(item).slice(0, 12)))) {
    score += 3;
  }

  score -= Math.max(0, line.length - 34) / 10;

  return score;
}

function buildRecoveredChorusLines(image, behaviors, toneHint) {
  const hookLine = buildRecoveredHookLine(image);
  const supportLine = buildRecoveredChorusSupportLine(image, behaviors, toneHint);
  const candidates = [image, hookLine, supportLine]
    .filter(Boolean)
    .sort((left, right) => scoreRecoveredChorusCandidate(right, image, behaviors) - scoreRecoveredChorusCandidate(left, image, behaviors));

  const ordered = [];
  const seen = new Set();

  for (const candidate of candidates) {
    const key = lower(candidate);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    ordered.push(candidate);
  }

  const imageFirst = ordered.find((line) => lower(line) === lower(image)) || image;
  const actionLine = ordered.find((line) => lower(line) !== lower(image)) || hookLine;

  if (lower(image).includes("ashtray") && lower(actionLine).includes("says he's fine")) {
    return [imageFirst, actionLine];
  }

  return [imageFirst, actionLine];
}

function buildRecoveredBridgeLines(input, behaviors) {
  const loweredRaw = lower(input.rawUserIntent);
  const loweredBehaviors = behaviors.map((item) => item.toLowerCase());

  const lineOne = loweredRaw.includes("not as a villain")
    ? "She ain't made the villain here"
    : "Ain't nobody left to blame in it";

  if (loweredBehaviors.some((item) => item.includes("kills the call"))) {
    return [lineOne, "gets as far as her street, then kills the call"];
  }

  if (loweredBehaviors.some((item) => item.includes("cuts the headlights"))) {
    return [lineOne, "cuts the headlights and rolls on past"];
  }

  if (loweredBehaviors.some((item) => item.includes("seat kicked back"))) {
    return [lineOne, "could go on home, still sleeps with the seat kicked back"];
  }

  return [lineOne, "still does the one thing he said he'd quit"];
}

function buildRecoveredOutroLines(input, imageOne, imageThree, behaviors) {
  const loweredBehaviors = behaviors.map((item) => item.toLowerCase());

  if (loweredBehaviors.some((item) => item.includes("kills the call"))) {
    return [imageOne, "gets as far as her street, then kills the call"];
  }

  if (loweredBehaviors.some((item) => item.includes("cuts the headlights"))) {
    return [imageOne, "cuts the headlights and don't pull in"];
  }

  if (loweredBehaviors.some((item) => item.includes("seat kicked back"))) {
    return [imageOne, "sleeps with the seat kicked back again"];
  }

  if (loweredBehaviors.some((item) => item.includes("smoke on his breath"))) {
    return [imageOne, "taps it twice and says he's fine"];
  }

  return [imageOne, imageThree];
}

function buildBabyBrotherChorus(title, options = {}) {
  if (options.final) {
    return createSection("Final Chorus", [
      `${title}, you were trouble and light,`,
      "screen door bangin' and a porch lamp in the night,",
      "you made us mad, made us laugh, made this house alive,",
      "now I say your name so some part of you survives"
    ]);
  }

  return createSection("Chorus", [
    `${title}, you were trouble and light,`,
    "mud on the floorboards, back door bangin' at night,",
    "you made us mad, made us laugh, kept this whole house awake,",
    "now I talk to your picture at the end of every day"
  ]);
}

function buildWhistlerChorus(options = {}) {
  if (options.final) {
    return createSection("Final Chorus", [
      "I am the whistler, low and thin,",
      "wind through the feed store, rattlin' the tin,",
      "he went down hard by the hitchin' post,",
      "and nobody said a word when I turned and left him there"
    ]);
  }

  return createSection("Chorus", [
    "I am the whistler, low and thin,",
    "one note by the feed store and heads start turnin',",
    "boots in the road dust, hand down by my side,",
    "and every face in town knew why I'd come"
  ]);
}

function generateBabyBrotherLyrics(input) {
  const title = input.title || "Baby Brother";

  return [
    createSection("Intro", [
      "(soft acoustic guitar, faint room tone, close-mic vocal)",
      "You came in hollerin', red-faced and wild,",
      "Mama laughed from the rocker, said, \"that one's gonna test us awhile\""
    ]),
    createSection("Verse 1", [
      "I was a few years older, thought I knew how to steer,",
      "you were barefoot in the kitchen with toy cars in high gear",
      "throwin' fits at the screen door, then grinnin' by the sink,",
      "and Mama'd send me after you when you'd tear off mad again"
    ]),
    createSection("Verse 2", [
      "Then came flashlight summers and girls in the passenger seat,",
      "your stereo too loud on our dead-end street",
      "blue lights in the rearview, your number on my screen,",
      "and I'd wait up hearin' gravel till your truck rolled in"
    ]),
    createSection("Pre-Chorus", [
      "Then the haircut got shorter, the duffel got packed,",
      "and I quit tellin' you be careful 'fore you even backed out"
    ]),
    buildBabyBrotherChorus(title),
    createSection("Verse 3", [
      "Then came boots, short hair, and a plane headin' east,",
      "folded shirts in a duffel where your old ball cap used to be",
      "you said you'd be fine like boys say easy things,",
      "and I stood there in the driveway after you pulled away"
    ]),
    createSection("Bridge", [
      "(low cello enters, vocal more fragile)",
      "They brought you home in polished wood,",
      "flag pulled tight where your shoulders should've stood",
      "Twenty-one shots cut holes through the sky,",
      "and Mama held my hand so hard I wore the mark till night"
    ]),
    buildBabyBrotherChorus(title, { final: true }),
    createSection("Outro", [
      "(soft piano, near-whisper vocal)",
      "Your boots ain't moved",
      "Mama still leaves that light on"
    ])
  ].join("\n\n");
}

function generateWhistlerLyrics(input) {
  const title = input.title || "The Whistler";

  return [
    createSection("Intro", [
      "(lonesome whistling, dry acoustic guitar)",
      "(bootsteps in dirt)"
    ]),
    createSection("Verse 1", [
      "Town went quiet when I crossed the ridge,",
      "dust on my hat brim, heel on the bridge",
      "no one asked nothin', no one waved me in,",
      "they'd all heard the name of the man I'd come for then"
    ]),
    createSection("Verse 2", [
      "He took mine mean, took 'em quick, took 'em cheap,",
      "left one in the yard and the others buried deep",
      "I carried that day like a nail through bone,",
      "now the whistle hits the wind when I ain't alone"
    ]),
    createSection("Pre-Chorus", [
      "Storefront glass and a dead sun sinkin',",
      "his men kept laughin', but I saw 'em thinkin'",
      "one of 'em muttered, \"best let him pass,\"",
      "some men keep breathin' long past their day"
    ]),
    buildWhistlerChorus(),
    createSection("Verse 3", [
      "He stepped out smilin' like he still owned time,",
      "gold in his teeth and a hand near his side",
      "said my name easy like we were old friends,",
      "then he saw I came to finish what he started back then"
    ]),
    createSection("Bridge", [
      "(snare pulse rises, tremolo guitar deepens)",
      "First shot cracked and the horses pulled,",
      "second one dropped him where the road turned dull",
      "third one was mercy, if mercy counts,",
      "then the whole town went still but for the horses snortin'"
    ]),
    buildWhistlerChorus({ final: true }),
    createSection("Outro", [
      "(lonesome whistling returns)",
      "(tremolo guitar fades into dry night air)"
    ])
  ].join("\n\n");
}

function generateFallbackLyrics(input, signalStack) {
  if (isRecoveredMoralConflictSong(input, signalStack)) {
    return buildRecoveredMoralConflictLyrics(input, signalStack);
  }

  if (isRecoveredInternalConflictSong(input, signalStack)) {
    return buildRecoveredInternalConflictLyrics(input, signalStack);
  }

  const title = input.title || "Untitled";
  const recurringImage = (input.parserMetadata && input.parserMetadata.recurringImage) || title;
  const chorusImage = resolveChorusImage(input, recurringImage);
  const imageOne = toLyricImage(pickImage(input, 0, recurringImage), recurringImage);
  const imageTwo = toLyricImage(pickImage(input, 1, "stale light over the lot"), "stale light over the lot");
  const imageThree = toLyricImage(pickImage(input, 2, "coffee goin' cold on the hood"), "coffee goin' cold on the hood");
  const imageFour = resolveProductionImage(input, toLyricImage(pickImage(input, 3, "thin room noise through the wall"), "thin room noise through the wall"));
  const behaviors = pickDistinctBehaviors(input);
  const behaviorOne = behaviors[0] || compressBehaviorHint(pickBehavior(input, 0, input.rawUserIntent), `${title}`);
  const behaviorTwo = behaviors[1] || compressBehaviorHint(pickBehavior(input, 1, signalStack.identity), signalStack.identity);
  const behaviorThree = behaviors[2] || "keeps holdin' onto what should've gone quiet";
  const toneHint = (input.desiredDirection || [])[0] || "plainspoken";
  const locationHint = /parking lot/i.test(input.rawUserIntent || "") ? "parking lot glow still up" : imageTwo;

  return [
    createSection("Intro", [
      imageOne,
      imageFour
    ]),
    createSection("Verse 1", [
      imageTwo,
      behaviorOne,
      behaviorTwo
    ]),
    createSection("Pre-Chorus", [
      imageThree,
      `${locationHint}`,
      behaviorThree
    ]),
    createSection("Chorus", buildRecoveredChorusLines(chorusImage, behaviors, toneHint)),
    createSection("Bridge", buildRecoveredBridgeLines(input, behaviors)),
    createSection("Outro", buildRecoveredOutroLines(input, imageOne, imageThree, behaviors))
  ].join("\n\n");
}

function generateLyrics(input, signalStack) {
  const scenario = detectScenario(input);

  if (scenario === "baby_brother") {
    return generateBabyBrotherLyrics(input);
  }

  if (scenario === "whistler") {
    return generateWhistlerLyrics(input);
  }

  return generateFallbackLyrics(input, signalStack);
}

module.exports = {
  generateLyrics
};

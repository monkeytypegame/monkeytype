import { FunboxName } from "@monkeytype/schemas/configs";
import { FunboxMetadata } from "./types";

const list: Record<FunboxName, FunboxMetadata> = {
  "58008": {
    description: "A special mode for accountants.",
    canGetPb: false,
    difficultyLevel: 1,
    properties: ["ignoresLanguage", "ignoresLayout", "noLetters"],
    frontendForcedConfig: {
      numbers: [false],
    },
    frontendFunctions: [
      "getWord",
      "punctuateWord",
      "rememberSettings",
      "getEmulatedChar",
    ],
    name: "58008",
    alias: "numbers",
  },
  mirror: {
    name: "mirror",
    description: "Everything is mirrored!",
    properties: ["hasCssFile"],
    canGetPb: true,
    difficultyLevel: 3,
    cssModifications: ["main"],
  },
  upside_down: {
    name: "upside_down",
    description: "Everything is upside down!",
    properties: ["hasCssFile"],
    canGetPb: true,
    difficultyLevel: 3,
    cssModifications: ["main"],
  },
  nausea: {
    name: "nausea",
    description: "I think I'm gonna be sick.",
    canGetPb: true,
    difficultyLevel: 2,
    properties: ["hasCssFile", "ignoreReducedMotion"],
    cssModifications: ["typingTest"],
  },
  round_round_baby: {
    name: "round_round_baby",
    description:
      "...right round, like a record baby. Right, round round round.",
    canGetPb: true,
    difficultyLevel: 3,
    properties: ["hasCssFile", "ignoreReducedMotion"],
    cssModifications: ["typingTest"],
  },
  simon_says: {
    name: "simon_says",
    description: "Type what simon says.",
    canGetPb: true,
    difficultyLevel: 1,
    properties: ["hasCssFile", "changesWordsVisibility", "usesLayout"],
    frontendForcedConfig: {
      highlightMode: ["letter", "off"],
    },
    frontendFunctions: ["applyConfig", "rememberSettings"],
  },
  tts: {
    canGetPb: true,
    difficultyLevel: 1,
    properties: ["hasCssFile", "changesWordsVisibility", "speaks"],
    frontendForcedConfig: {
      highlightMode: ["letter", "off"],
    },
    frontendFunctions: ["applyConfig", "rememberSettings", "toggleScript"],
    name: "tts",
    description: "Listen closely.",
    cssModifications: ["words"],
  },
  choo_choo: {
    canGetPb: true,
    difficultyLevel: 2,
    properties: [
      "hasCssFile",
      "noLigatures",
      "conflictsWithSymmetricChars",
      "ignoreReducedMotion",
    ],
    name: "choo_choo",
    description: "All the letters are spinning!",
    cssModifications: ["words"],
  },
  arrows: {
    description: "Play it on a pad!",
    canGetPb: false,
    difficultyLevel: 1,
    properties: [
      "ignoresLanguage",
      "ignoresLayout",
      "nospace",
      "noLetters",
      "symmetricChars",
    ],
    frontendForcedConfig: {
      punctuation: [false],
      numbers: [false],
      highlightMode: ["letter", "off"],
    },
    frontendFunctions: [
      "getWord",
      "rememberSettings",
      "getEmulatedChar",
      "isCharCorrect",
      "getWordHtml",
    ],
    name: "arrows",
  },
  rAnDoMcAsE: {
    description: "raNdomIze ThE CApitaLizatIon Of EveRY LeTtEr.",
    canGetPb: false,
    difficultyLevel: 2,
    properties: ["changesCapitalisation"],
    frontendFunctions: ["alterText"],
    name: "rAnDoMcAsE",
  },
  sPoNgEcAsE: {
    description: "I kInDa LiKe HoW iNeFfIcIeNt QwErTy Is.",
    canGetPb: false,
    difficultyLevel: 2,
    properties: ["changesCapitalisation"],
    frontendFunctions: ["alterText"],
    name: "sPoNgEcAsE",
  },
  capitals: {
    description: "Capitalize Every Word.",
    canGetPb: false,
    difficultyLevel: 1,
    properties: ["changesCapitalisation"],
    frontendFunctions: ["alterText"],
    name: "capitals",
  },
  layout_mirror: {
    description: "Mirror the keyboard layout",
    canGetPb: true,
    difficultyLevel: 3,
    properties: ["changesLayout"],
    frontendFunctions: ["applyConfig", "rememberSettings"],
    name: "layout_mirror",
  },
  layoutfluid: {
    description:
      "Switch between layouts specified below proportionately to the length of the test.",
    canGetPb: true,
    difficultyLevel: 1,
    properties: ["changesLayout", "noInfiniteDuration"],
    frontendFunctions: [
      "applyConfig",
      "rememberSettings",
      "handleSpace",
      "getResultContent",
      "restart",
    ],
    name: "layoutfluid",
  },
  earthquake: {
    description: "Everybody get down! The words are shaking!",
    canGetPb: true,
    difficultyLevel: 1,
    properties: ["hasCssFile", "noLigatures", "ignoreReducedMotion"],
    name: "earthquake",
    cssModifications: ["words"],
  },
  space_balls: {
    description: "In a galaxy far far away.",
    canGetPb: true,
    difficultyLevel: 0,
    properties: ["hasCssFile", "ignoreReducedMotion"],
    name: "space_balls",
    cssModifications: ["body"],
  },
  gibberish: {
    description: "Anvbuefl dizzs eoos alsb?",
    canGetPb: false,
    difficultyLevel: 1,
    properties: ["ignoresLanguage", "unspeakable"],
    frontendFunctions: ["getWord"],
    name: "gibberish",
  },
  ascii: {
    description: "Where was the ampersand again?. Only ASCII characters.",
    canGetPb: false,
    difficultyLevel: 1,
    properties: ["ignoresLanguage", "noLetters", "unspeakable"],
    frontendForcedConfig: {
      punctuation: [false],
      numbers: [false],
    },
    frontendFunctions: ["getWord"],
    name: "ascii",
  },
  specials: {
    description: "!@#$%^&*. Only special characters.",
    canGetPb: false,
    difficultyLevel: 1,
    properties: ["ignoresLanguage", "noLetters", "unspeakable"],
    frontendForcedConfig: {
      punctuation: [false],
      numbers: [false],
    },
    frontendFunctions: ["getWord"],
    name: "specials",
  },
  plus_one: {
    description: "Only one future word is visible.",
    canGetPb: true,
    difficultyLevel: 0,
    properties: ["changesWordsVisibility", "toPush:2", "noInfiniteDuration"],
    name: "plus_one",
  },
  plus_zero: {
    description: "React quickly! Only the current word is visible.",
    canGetPb: true,
    difficultyLevel: 1,
    properties: ["changesWordsVisibility", "toPush:1", "noInfiniteDuration"],
    name: "plus_zero",
  },
  plus_two: {
    description: "Only two future words are visible.",
    canGetPb: true,
    difficultyLevel: 0,
    properties: ["changesWordsVisibility", "toPush:3", "noInfiniteDuration"],
    name: "plus_two",
  },
  plus_three: {
    description: "Only three future words are visible.",
    canGetPb: true,
    difficultyLevel: 0,
    properties: ["changesWordsVisibility", "toPush:4", "noInfiniteDuration"],
    name: "plus_three",
  },
  read_ahead_easy: {
    description: "Only the current word is invisible.",
    canGetPb: true,
    difficultyLevel: 1,
    properties: ["changesWordsVisibility", "hasCssFile"],
    frontendForcedConfig: {
      highlightMode: ["letter", "off"],
    },
    frontendFunctions: ["rememberSettings", "handleKeydown"],
    name: "read_ahead_easy",
  },
  read_ahead: {
    description: "Current and the next word are invisible!",
    canGetPb: true,
    difficultyLevel: 2,
    properties: ["changesWordsVisibility", "hasCssFile"],
    frontendForcedConfig: {
      highlightMode: ["letter", "off"],
    },
    frontendFunctions: ["rememberSettings", "handleKeydown"],
    name: "read_ahead",
  },
  read_ahead_hard: {
    description: "Current and the next two words are invisible!",
    canGetPb: true,
    difficultyLevel: 3,
    properties: ["changesWordsVisibility", "hasCssFile"],
    frontendForcedConfig: {
      highlightMode: ["letter", "off"],
    },
    frontendFunctions: ["rememberSettings", "handleKeydown"],
    name: "read_ahead_hard",
  },
  memory: {
    description: "Test your memory. Remember the words and type them blind.",
    canGetPb: true,
    difficultyLevel: 3,
    properties: ["changesWordsVisibility", "noInfiniteDuration"],
    frontendForcedConfig: {
      mode: ["words", "quote", "custom"],
    },
    frontendFunctions: ["applyConfig", "rememberSettings", "start", "restart"],
    name: "memory",
  },
  nospace: {
    description: "Whoneedsspacesanyway?",
    canGetPb: false,
    difficultyLevel: 0,
    properties: ["nospace"],
    frontendForcedConfig: {
      highlightMode: ["letter", "off"],
    },
    frontendFunctions: ["rememberSettings"],
    name: "nospace",
  },
  poetry: {
    description: "Practice typing some beautiful prose.",
    canGetPb: false,
    difficultyLevel: 0,
    properties: ["noInfiniteDuration", "ignoresLanguage"],
    frontendForcedConfig: {
      punctuation: [false],
      numbers: [false],
    },
    frontendFunctions: ["pullSection"],
    name: "poetry",
  },
  wikipedia: {
    description: "Practice typing wikipedia sections.",
    canGetPb: false,
    difficultyLevel: 0,
    properties: ["noInfiniteDuration", "ignoresLanguage"],
    frontendForcedConfig: {
      punctuation: [false],
      numbers: [false],
    },
    frontendFunctions: ["pullSection"],
    name: "wikipedia",
  },
  weakspot: {
    description: "Focus on slow and mistyped letters.",
    canGetPb: false,
    difficultyLevel: 0,
    properties: ["changesWordsFrequency"],
    frontendFunctions: ["getWord"],
    name: "weakspot",
  },
  pseudolang: {
    description: "Nonsense words that look like the current language.",
    canGetPb: false,
    difficultyLevel: 0,
    properties: ["unspeakable", "ignoresLanguage"],
    frontendFunctions: ["withWords"],
    name: "pseudolang",
  },
  IPv4: {
    alias: "network",
    description: "For sysadmins.",
    canGetPb: false,
    difficultyLevel: 1,
    properties: ["ignoresLanguage", "ignoresLayout", "noLetters"],
    frontendForcedConfig: {
      numbers: [false],
    },
    frontendFunctions: ["getWord", "punctuateWord", "rememberSettings"],
    name: "IPv4",
  },
  IPv6: {
    alias: "network",
    description: "For sysadmins with a long beard.",
    canGetPb: false,
    difficultyLevel: 1,
    properties: ["ignoresLanguage", "ignoresLayout", "noLetters"],
    frontendForcedConfig: {
      numbers: [false],
    },
    frontendFunctions: ["getWord", "punctuateWord", "rememberSettings"],
    name: "IPv6",
  },
  binary: {
    description:
      "01000010 01100101 01100101 01110000 00100000 01100010 01101111 01101111 01110000 00101110",
    canGetPb: false,
    difficultyLevel: 1,
    properties: ["ignoresLanguage", "ignoresLayout", "noLetters"],
    frontendForcedConfig: {
      numbers: [false],
      punctuation: [false],
    },
    frontendFunctions: ["getWord"],
    name: "binary",
  },
  hexadecimal: {
    description:
      "0x38 0x20 0x74 0x69 0x6D 0x65 0x73 0x20 0x6D 0x6F 0x72 0x65 0x20 0x62 0x6F 0x6F 0x70 0x21",
    canGetPb: false,
    difficultyLevel: 1,
    properties: ["ignoresLanguage", "ignoresLayout", "noLetters"],
    frontendForcedConfig: {
      numbers: [false],
    },
    frontendFunctions: ["getWord", "punctuateWord", "rememberSettings"],
    name: "hexadecimal",
  },
  zipf: {
    description:
      "Words are generated according to Zipf's law. (not all languages will produce Zipfy results, use with caution)",
    canGetPb: false,
    difficultyLevel: 0,
    properties: ["changesWordsFrequency"],
    frontendFunctions: ["getWordsFrequencyMode"],
    name: "zipf",
  },
  morse: {
    description: "-.../././.--./ -.../---/---/.--./-.-.--/ ",
    canGetPb: false,
    difficultyLevel: 1,
    properties: ["ignoresLanguage", "ignoresLayout", "noLetters", "nospace"],
    frontendFunctions: ["alterText"],
    name: "morse",
  },
  crt: {
    description: "Go back to the 1980s",
    canGetPb: true,
    difficultyLevel: 0,
    properties: ["hasCssFile", "noLigatures"],
    frontendFunctions: ["applyGlobalCSS", "clearGlobal"],
    name: "crt",
    cssModifications: ["body"],
  },
  backwards: {
    description: "...sdrawkcab epyt ot yrt woN",
    name: "backwards",
    properties: [
      "hasCssFile",
      "conflictsWithSymmetricChars",
      "wordOrder:reverse",
      "reverseDirection",
    ],
    canGetPb: true,
    frontendFunctions: ["alterText"],
    difficultyLevel: 3,
    cssModifications: ["words"],
  },
  ddoouubblleedd: {
    description: "TTyyppee eevveerryytthhiinngg ttwwiiccee..",
    canGetPb: true,
    difficultyLevel: 1,
    properties: ["noLigatures"],
    frontendFunctions: ["alterText"],
    name: "ddoouubblleedd",
  },
  instant_messaging: {
    description: "Who needs shift anyway?",
    canGetPb: false,
    difficultyLevel: 0,
    properties: ["changesCapitalisation"],
    frontendFunctions: ["alterText"],
    name: "instant_messaging",
  },
  underscore_spaces: {
    description: "Underscores_are_better.",
    canGetPb: false,
    difficultyLevel: 1,
    properties: ["ignoresLanguage", "ignoresLayout", "nospace"],
    frontendFunctions: ["alterText"],
    name: "underscore_spaces",
  },
  ALL_CAPS: {
    description: "WHY ARE WE SHOUTING?",
    canGetPb: false,
    difficultyLevel: 1,
    properties: ["changesCapitalisation"],
    frontendFunctions: ["alterText"],
    name: "ALL_CAPS",
  },
  polyglot: {
    description: "Use words from multiple languages in a single test.",
    canGetPb: false,
    difficultyLevel: 1,
    properties: ["ignoresLanguage"],
    frontendFunctions: ["withWords"],
    name: "polyglot",
  },
  asl: {
    description: "Practice american sign language.",
    canGetPb: true,
    difficultyLevel: 1,
    properties: ["hasCssFile", "noLigatures"],
    name: "asl",
    cssModifications: ["words"],
  },
  rot13: {
    description: "Vg znl abg or frpher, ohg vg vf sha gb glcr!",
    canGetPb: true,
    difficultyLevel: 1,
    properties: [],
    frontendFunctions: ["alterText"],
    name: "rot13",
  },
  no_quit: {
    description: "You can't restart the test.",
    canGetPb: true,
    difficultyLevel: 0,
    name: "no_quit",
  },
};

export function getObject(): Record<FunboxName, FunboxMetadata> {
  return list;
}

export function getFunboxNames(): FunboxName[] {
  return Object.keys(list) as FunboxName[];
}

export function getList(): FunboxMetadata[] {
  const out: FunboxMetadata[] = [];
  for (const name of getFunboxNames()) {
    out.push(list[name]);
  }
  return out;
}

export function getFunbox(name: FunboxName): FunboxMetadata;
export function getFunbox(names: FunboxName[]): FunboxMetadata[];
export function getFunbox(
  nameOrNames: FunboxName | FunboxName[],
): FunboxMetadata | FunboxMetadata[] {
  if (nameOrNames === undefined) return [];
  if (Array.isArray(nameOrNames)) {
    const out = nameOrNames.map((name) => getObject()[name]);

    //@ts-expect-error sanity check
    if (out.includes(undefined)) {
      throw new Error(
        "One of the funboxes is invalid: " + nameOrNames.toString(),
      );
    }

    return out;
  } else {
    const out = getObject()[nameOrNames];

    if (out === undefined) {
      throw new Error("Invalid funbox name: " + nameOrNames);
    }

    return out;
  }
}

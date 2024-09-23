export type FunboxMetadata = {
  name: string;
  canGetPb: boolean;
  difficultyLevel: number;
  properties?: string[];
  frontendForcedConfig?: Record<string, string[] | boolean[]>;
  frontendFunctions?: string[];
};

const FunboxList: FunboxMetadata[] = [
  {
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
      "handleChar",
    ],
    name: "58008",
  },
  {
    canGetPb: true,
    difficultyLevel: 2,
    frontendFunctions: ["applyCSS"],
    name: "nausea",
  },
  {
    canGetPb: true,
    difficultyLevel: 3,
    frontendFunctions: ["applyCSS"],
    name: "round_round_baby",
  },
  {
    canGetPb: true,
    difficultyLevel: 1,
    properties: ["changesWordsVisibility", "usesLayout"],
    frontendForcedConfig: {
      highlightMode: ["letter", "off"],
    },
    frontendFunctions: ["applyCSS", "applyConfig", "rememberSettings"],
    name: "simon_says",
  },
  {
    canGetPb: true,
    difficultyLevel: 3,
    frontendFunctions: ["applyCSS"],
    name: "mirror",
  },
  {
    canGetPb: true,
    difficultyLevel: 3,
    frontendFunctions: ["applyCSS"],
    name: "upside_down",
  },
  {
    canGetPb: true,
    difficultyLevel: 1,
    properties: ["changesWordsVisibility", "speaks"],
    frontendForcedConfig: {
      highlightMode: ["letter", "off"],
    },
    frontendFunctions: [
      "applyCSS",
      "applyConfig",
      "rememberSettings",
      "toggleScript",
    ],
    name: "tts",
  },
  {
    canGetPb: true,
    difficultyLevel: 2,
    properties: ["noLigatures", "conflictsWithSymmetricChars"],
    frontendFunctions: ["applyCSS"],
    name: "choo_choo",
  },
  {
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
      "applyConfig",
      "rememberSettings",
      "handleChar",
      "isCharCorrect",
      "preventDefaultEvent",
      "getWordHtml",
    ],
    name: "arrows",
  },
  {
    canGetPb: false,
    difficultyLevel: 2,
    properties: ["changesCapitalisation"],
    frontendFunctions: ["alterText"],
    name: "rAnDoMcAsE",
  },
  {
    canGetPb: false,
    difficultyLevel: 1,
    properties: ["changesCapitalisation"],
    frontendFunctions: ["alterText"],
    name: "capitals",
  },
  {
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
  {
    canGetPb: true,
    difficultyLevel: 1,
    properties: ["noLigatures"],
    frontendFunctions: ["applyCSS"],
    name: "earthquake",
  },
  {
    canGetPb: true,
    difficultyLevel: 0,
    frontendFunctions: ["applyCSS"],
    name: "space_balls",
  },
  {
    canGetPb: false,
    difficultyLevel: 1,
    properties: ["ignoresLanguage", "unspeakable"],
    frontendFunctions: ["getWord"],
    name: "gibberish",
  },
  {
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
  {
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
  {
    canGetPb: true,
    difficultyLevel: 0,
    properties: ["changesWordsVisibility", "toPush:2", "noInfiniteDuration"],
    name: "plus_one",
  },
  {
    canGetPb: true,
    difficultyLevel: 1,
    properties: ["changesWordsVisibility", "toPush:1", "noInfiniteDuration"],
    name: "plus_zero",
  },
  {
    canGetPb: true,
    difficultyLevel: 0,
    properties: ["changesWordsVisibility", "toPush:3", "noInfiniteDuration"],
    name: "plus_two",
  },
  {
    canGetPb: true,
    difficultyLevel: 0,
    properties: ["changesWordsVisibility", "toPush:4", "noInfiniteDuration"],
    name: "plus_three",
  },
  {
    canGetPb: true,
    difficultyLevel: 1,
    properties: ["changesWordsVisibility"],
    frontendForcedConfig: {
      highlightMode: ["letter", "off"],
    },
    frontendFunctions: ["applyCSS", "rememberSettings"],
    name: "read_ahead_easy",
  },
  {
    canGetPb: true,
    difficultyLevel: 2,
    properties: ["changesWordsVisibility"],
    frontendForcedConfig: {
      highlightMode: ["letter", "off"],
    },
    frontendFunctions: ["applyCSS", "rememberSettings"],
    name: "read_ahead",
  },
  {
    canGetPb: true,
    difficultyLevel: 3,
    properties: ["changesWordsVisibility"],
    frontendForcedConfig: {
      highlightMode: ["letter", "off"],
    },
    frontendFunctions: ["applyCSS", "rememberSettings"],
    name: "read_ahead_hard",
  },
  {
    canGetPb: true,
    difficultyLevel: 3,
    properties: ["changesWordsVisibility", "noInfiniteDuration"],
    frontendForcedConfig: {
      mode: ["words", "quote", "custom"],
    },
    frontendFunctions: ["applyConfig", "rememberSettings", "start", "restart"],
    name: "memory",
  },
  {
    canGetPb: false,
    difficultyLevel: 0,
    properties: ["nospace"],
    frontendForcedConfig: {
      highlightMode: ["letter", "off"],
    },
    frontendFunctions: ["applyConfig", "rememberSettings"],
    name: "nospace",
  },
  {
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
  {
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
  {
    canGetPb: false,
    difficultyLevel: 0,
    properties: ["changesWordsFrequency"],
    frontendFunctions: ["getWord"],
    name: "weakspot",
  },
  {
    canGetPb: false,
    difficultyLevel: 0,
    properties: ["unspeakable", "ignoresLanguage"],
    frontendFunctions: ["withWords"],
    name: "pseudolang",
  },
  {
    canGetPb: false,
    difficultyLevel: 1,
    properties: ["ignoresLanguage", "ignoresLayout", "noLetters"],
    frontendForcedConfig: {
      numbers: [false],
    },
    frontendFunctions: ["getWord", "punctuateWord", "rememberSettings"],
    name: "IPv4",
  },
  {
    canGetPb: false,
    difficultyLevel: 1,
    properties: ["ignoresLanguage", "ignoresLayout", "noLetters"],
    frontendForcedConfig: {
      numbers: [false],
    },
    frontendFunctions: ["getWord", "punctuateWord", "rememberSettings"],
    name: "IPv6",
  },
  {
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
  {
    canGetPb: false,
    difficultyLevel: 1,
    properties: ["ignoresLanguage", "ignoresLayout", "noLetters"],
    frontendForcedConfig: {
      numbers: [false],
    },
    frontendFunctions: ["getWord", "punctuateWord", "rememberSettings"],
    name: "hexadecimal",
  },
  {
    canGetPb: false,
    difficultyLevel: 0,
    properties: ["changesWordsFrequency"],
    frontendFunctions: ["getWordsFrequencyMode"],
    name: "zipf",
  },
  {
    canGetPb: false,
    difficultyLevel: 1,
    properties: ["ignoresLanguage", "ignoresLayout", "noLetters", "noSpace"],
    frontendFunctions: ["alterText"],
    name: "morse",
  },
  {
    canGetPb: true,
    difficultyLevel: 0,
    properties: ["noLigatures"],
    name: "crt",
  },
  {
    name: "backwards",
    properties: [
      "noLigatures",
      "conflictsWithSymmetricChars",
      "wordOrder:reverse",
    ],
    frontendFunctions: ["applyCSS"],
    canGetPb: true,
    difficultyLevel: 3,
  },
  {
    canGetPb: true,
    difficultyLevel: 1,
    properties: ["noLigatures"],
    frontendFunctions: ["alterText"],
    name: "ddoouubblleedd",
  },
  {
    canGetPb: false,
    difficultyLevel: 1,
    properties: ["changesCapitalisation"],
    frontendFunctions: ["alterText"],
    name: "instant_messaging",
  },
];

export default FunboxList;

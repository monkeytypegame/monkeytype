export type FunboxName =
  | "58008"
  | "mirror"
  | "upside_down"
  | "nausea"
  | "round_round_baby"
  | "simon_says"
  | "tts"
  | "choo_choo"
  | "arrows"
  | "rAnDoMcAsE"
  | "capitals"
  | "layoutfluid"
  | "earthquake"
  | "space_balls"
  | "gibberish"
  | "ascii"
  | "specials"
  | "plus_one"
  | "plus_zero"
  | "plus_two"
  | "plus_three"
  | "read_ahead_easy"
  | "read_ahead"
  | "read_ahead_hard"
  | "memory"
  | "nospace"
  | "poetry"
  | "wikipedia"
  | "weakspot"
  | "pseudolang"
  | "IPv4"
  | "IPv6"
  | "binary"
  | "hexadecimal"
  | "zipf"
  | "morse"
  | "crt"
  | "backwards"
  | "ddoouubblleedd"
  | "instant_messaging"
  | "underscore_spaces"
  | "ALL_CAPS";

export type FunboxForcedConfig = Record<string, string[] | boolean[]>;

export type FunboxProperty =
  | "hasCssFile"
  | "ignoresLanguage"
  | "ignoresLayout"
  | "noLetters"
  | "changesLayout"
  | "usesLayout"
  | "nospace"
  | "changesWordsVisibility"
  | "changesWordsFrequency"
  | "changesCapitalisation"
  | "conflictsWithSymmetricChars"
  | "symmetricChars"
  | "speaks"
  | "unspeakable"
  | "noInfiniteDuration"
  | "noLigatures"
  | `toPush:${number}`
  | "wordOrder:reverse"
  | "ignoreReducedMotion";

type FunboxCSSModification = "typingTest" | "words" | "body" | "main";

export type FunboxMetadata = {
  name: FunboxName;
  alias?: string;
  description: string;
  properties?: FunboxProperty[];
  frontendForcedConfig?: FunboxForcedConfig;
  frontendFunctions?: string[];
  difficultyLevel: number;
  canGetPb: boolean;
  cssModifications?: FunboxCSSModification[];
};

import { FunboxName } from "@monkeytype/contracts/schemas/configs";

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

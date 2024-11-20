import { stringToFunboxNames } from "./util";

export type FunboxName = "58008" | "mirror" | "upside_down";

export type FunboxForcedConfig = Record<string, string[] | boolean[]>;

type Property =
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
  | "noLigatures";

export type FunboxMetadata = {
  name: FunboxName;
  alias?: string;
  description: string;
  properties?: Property[];
  frontendForcedConfig?: FunboxForcedConfig;
  frontendFunctions?: string[];
  difficultyLevel: number;
  canGetPb: boolean;
};

const list: Record<FunboxName, FunboxMetadata> = {
  "58008": {
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
    alias: "numbers",
    description: "A special mode for accountants.",
  },
  mirror: {
    name: "mirror",
    description: "Everything is mirrored!",
    properties: ["hasCssFile"],
    canGetPb: true,
    difficultyLevel: 3,
  },
  upside_down: {
    name: "upside_down",
    description: "Everything is upside down!",
    properties: ["hasCssFile"],
    canGetPb: true,
    difficultyLevel: 3,
  },
};

export function getByHashSeparatedString(names: string): FunboxMetadata[] {
  return get(stringToFunboxNames(names));
}

export function get(name: FunboxName): FunboxMetadata;
export function get(names: FunboxName[]): FunboxMetadata[];
export function get(
  nameOrNames: FunboxName | FunboxName[]
): FunboxMetadata | FunboxMetadata[] {
  if (Array.isArray(nameOrNames)) {
    const out = nameOrNames.map((name) => list[name]);

    //@ts-expect-error
    if (out.includes(undefined)) {
      throw new Error("One of the funboxes is invalid: " + nameOrNames);
    }

    return out;
  } else {
    const out = list[nameOrNames];

    if (out === undefined) {
      throw new Error("Invalid funbox name: " + nameOrNames);
    }

    return out;
  }
}

export function getAllFunboxes(): FunboxMetadata[] {
  const out: FunboxMetadata[] = [];
  for (const name of getAllFunboxNames()) {
    out.push(list[name]);
  }
  return out;
}

export function getAllFunboxNames(): FunboxName[] {
  return Object.keys(list) as FunboxName[];
}

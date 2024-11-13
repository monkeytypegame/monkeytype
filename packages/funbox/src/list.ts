export type FunboxName = "58008";

export type FunboxForcedConfig = Record<string, string[] | boolean[]>;

export type FunboxMetadata = {
  name: FunboxName;
  alias?: string;
  description: string;
  properties: string[];
  frontendForcedConfig?: FunboxForcedConfig;
  frontendFunctions: string[];
  hasCSS?: boolean; //possibly move it to properties in the future
  difficultyLevel: number;
  canGetPb: boolean;
};

const list = {
  "58008": {
    canGetPb: false,
    difficultyLevel: 1,
    properties: ["ignoresLanguage", "ignoresLayout", "noLetters"],
    forcedFrontendConfig: {
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
} as Record<FunboxName, FunboxMetadata>;

export function get(name: FunboxName): FunboxMetadata;
export function get(names: FunboxName[]): FunboxMetadata[];
export function get(
  nameOrNames: FunboxName | FunboxName[]
): FunboxMetadata | FunboxMetadata[] {
  if (Array.isArray(nameOrNames)) {
    const out = nameOrNames.map((name) => list[name]);

    //@ts-expect-error
    if (out.includes(undefined)) {
      throw new Error("Invalid funbox name");
    }

    return out;
  } else {
    const out = list[nameOrNames];

    if (out === undefined) {
      throw new Error("Invalid funbox name");
    }

    return out;
  }
}

export default list;

export type FunboxName = "58008" | "mirror" | "upside_down";

export type FunboxForcedConfig = Record<string, string[] | boolean[]>;

export type FunboxMetadata = {
  name: FunboxName;
  alias?: string;
  description: string;
  properties?: string[];
  frontendForcedConfig?: FunboxForcedConfig;
  frontendFunctions: string[];
  hasCSS?: boolean; //possibly move it to properties in the future
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
    canGetPb: true,
    difficultyLevel: 3,
    frontendFunctions: ["applyCSS"],
  },
  upside_down: {
    name: "upside_down",
    description: "Everything is upside down!",
    canGetPb: true,
    difficultyLevel: 3,
    frontendFunctions: ["applyCSS"],
  },
};

export function getFunboxNames(names: string): FunboxName[] {
  if (names === "none" || names === "") return [];
  const unsafeNames = names.split("#").map((name) => name.trim());
  const out: FunboxName[] = [];
  for (const unsafeName of unsafeNames) {
    if (unsafeName in list) {
      out.push(unsafeName as FunboxName);
    } else {
      throw new Error("Invalid funbox name: " + unsafeName);
    }
  }
  return out;
}

export function getByHashSeparatedString(names: string): FunboxMetadata[] {
  return get(getFunboxNames(names));
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

export default list;

import { fingerLabels, keyCharacters } from "./layouts";
import { PracticeConfig, PracticeKey } from "./types";

export const presetGroups: Record<string, { id: string; label: string }[]> = {
  hands: [
    { id: "leftHand", label: "left hand" },
    { id: "rightHand", label: "right hand" },
    { id: "bothHands", label: "both hands" },
  ],
  fingers: Object.entries(fingerLabels).map(([id, label]) => ({ id, label })),
  halves: [
    { id: "leftHalf", label: "left half" },
    { id: "rightHalf", label: "right half" },
  ],
  rows: [
    { id: "homeKeys", label: "home keys" },
    { id: "homeRow", label: "home row" },
    { id: "topRow", label: "top row" },
    { id: "bottomRow", label: "bottom row" },
    { id: "numberRow", label: "number row" },
  ],
  characters: [
    { id: "letters", label: "letters" },
    { id: "digits", label: "digits only" },
    { id: "symbols", label: "punctuation & symbols" },
    { id: "unshifted", label: "unshifted punctuation" },
    { id: "shifted", label: "shifted symbols" },
    { id: "brackets", label: "brackets" },
    { id: "operators", label: "operators" },
  ],
};

export function presetLabel(id: string): string {
  return (
    Object.values(presetGroups)
      .flat()
      .find((preset) => preset.id === id)?.label ?? "custom selection"
  );
}

export function needsMapping(id: string): boolean {
  return [
    ...(presetGroups["hands"] ?? []),
    ...(presetGroups["fingers"] ?? []),
    ...(presetGroups["halves"] ?? []),
    { id: "homeKeys" },
  ].some((preset) => preset.id === id);
}

export function inCategory(
  char: string,
  category: PracticeConfig["category"],
): boolean {
  if (category === "all") return true;
  if (category === "letters") return /\p{L}/u.test(char);
  if (category === "digits") return /^[0-9]$/.test(char);
  return /[\p{P}\p{S}]/u.test(char);
}

export function charactersForPreset(
  keys: PracticeKey[],
  config: PracticeConfig,
): string[] {
  const { preset, category, layer } = config;
  const selected = keys.filter((key) => {
    if (preset === "leftHand" || preset === "leftHalf") {
      return key.finger?.startsWith("l");
    }
    if (preset === "rightHand" || preset === "rightHalf") {
      return key.finger?.startsWith("r");
    }
    if (preset === "bothHands") return key.finger !== undefined;
    if (preset in fingerLabels) return key.finger === preset;
    if (preset === "homeKeys") {
      return key.row === 2 && [0, 1, 2, 3, 6, 7, 8, 9].includes(key.column);
    }
    if (preset === "homeRow") return key.row === 2;
    if (preset === "topRow") return key.row === 1;
    if (preset === "bottomRow") return key.row === 3;
    if (preset === "numberRow") return key.row === 0;
    return true;
  });
  return [
    ...new Set(
      selected.flatMap((key) => {
        const variants = keyCharacters(key, layer);
        return variants.filter((char): char is string => {
          if (char === undefined || !inCategory(char, category)) return false;
          if (preset === "brackets") return "()[]{}<>".includes(char);
          if (preset === "operators") return "+-*/%=<>!&|^~".includes(char);
          return true;
        });
      }),
    ),
  ];
}

export function selectPreset(
  config: PracticeConfig,
  id: string,
  keys: PracticeKey[],
  add = false,
): PracticeConfig {
  const next = { ...config, preset: id };
  if (id === "letters") {
    next.category = "letters";
    next.layer = "base";
  }
  if (id === "digits") {
    next.category = "digits";
    next.layer = "base";
  }
  if (["symbols", "brackets", "operators"].includes(id)) {
    next.category = "symbols";
    next.layer = "both";
  }
  if (id === "unshifted" || id === "shifted") {
    next.category = "symbols";
    next.layer = id === "shifted" ? "shift" : "base";
  }
  if (id === "numberRow") {
    next.category = "all";
  }
  const characters = charactersForPreset(keys, next);
  next.characters = add
    ? [...new Set([...config.characters, ...characters])]
    : characters;
  if (add) next.preset = "custom";
  return next;
}

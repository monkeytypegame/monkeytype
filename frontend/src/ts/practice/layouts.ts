import { LayoutObject } from "@monkeytype/schemas/layouts";
import { Finger, PracticeConfig, PracticeKey } from "./types";

export const fingerLabels: Record<Finger, string> = {
  lp: "left pinky",
  lr: "left ring",
  lm: "left middle",
  li: "left index",
  ri: "right index",
  rm: "right middle",
  rr: "right ring",
  rp: "right pinky",
};

// Physical positions, not the letters occupying them. Only QWERTY is
// advertised as verified until other geometries have their own fixtures.
const fingers: Finger[][] = [
  [
    "lp",
    "lp",
    "lr",
    "lm",
    "li",
    "li",
    "ri",
    "ri",
    "rm",
    "rr",
    "rp",
    "rp",
    "rp",
  ],
  [
    "lp",
    "lr",
    "lm",
    "li",
    "li",
    "ri",
    "ri",
    "rm",
    "rr",
    "rp",
    "rp",
    "rp",
    "rp",
  ],
  ["lp", "lr", "lm", "li", "li", "ri", "ri", "rm", "rr", "rp", "rp"],
  ["lp", "lr", "lm", "li", "li", "ri", "ri", "rm", "rr", "rp"],
];

export function hasVerifiedMapping(name: string): boolean {
  return name === "qwerty";
}

export function getKeys(layout: LayoutObject, name: string): PracticeKey[] {
  const rows = [
    layout.keys.row1,
    layout.keys.row2,
    layout.keys.row3,
    layout.keys.row4,
  ];
  return rows.flatMap((keys, row) =>
    keys.map((variants, column) => ({
      id: `${row}-${column}`,
      row,
      column,
      // Preserve layer positions, including empty and duplicate entries.
      variants: variants.slice(0, 2),
      finger: hasVerifiedMapping(name) ? fingers[row]?.[column] : undefined,
    })),
  );
}

export function keyCharacters(
  key: PracticeKey,
  layer: PracticeConfig["layer"],
): string[] {
  const variants =
    layer === "both" ? key.variants : [key.variants[layer === "shift" ? 1 : 0]];
  return [
    ...new Set(
      variants.filter(
        (char): char is string => char?.length === 1 && /\S/u.test(char),
      ),
    ),
  ];
}

export function availableCharacters(keys: PracticeKey[]): string[] {
  return [...new Set(keys.flatMap((key) => keyCharacters(key, "both")))];
}

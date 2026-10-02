import { LayoutObject } from "@monkeytype/schemas/layouts";
import { Finger, PracticeKey } from "./types";

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
      variants: [
        ...new Set(
          variants
            .slice(0, 2)
            .filter((char) => char.length === 1 && /\S/u.test(char)),
        ),
      ],
      finger: hasVerifiedMapping(name) ? fingers[row]?.[column] : undefined,
    })),
  );
}

export function availableCharacters(keys: PracticeKey[]): string[] {
  return [...new Set(keys.flatMap((key) => key.variants))];
}

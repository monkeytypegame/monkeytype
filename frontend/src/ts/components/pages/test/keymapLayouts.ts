import { KeymapStyle } from "@monkeytype/schemas/configs";
import { LayoutObject } from "@monkeytype/schemas/layouts";
import {
  FormatDisplayOptions,
  formatForDisplay,
} from "@tanstack/solid-hotkeys";
import { OneOf } from "../../../utils/types";

const options: FormatDisplayOptions = {};
export const Ctrl = formatForDisplay("Ctrl", options);
export const Shift = formatForDisplay("Shift", { platform: "mac" });
export const Alt = formatForDisplay("Alt", options);
export const Hyper = "Monke";
export const HyperShort = "";
export const Backspace = "Backspace";
export const BackspaceShort = formatForDisplay("Backspace", options);
export const Meta = formatForDisplay("Meta", options);
export const Enter = "Enter";
export const EnterShort = formatForDisplay("Enter", { platform: "mac" });

export type KeyDefinition = {
  legends: string[];
  /** width in u  */
  width?: number;
  /** height in u  */
  height?: number;
  /** x-offset in u  */
  x?: number;
  /** y-offset in u  */
  y?: number;
  /** rotation in degrees  */
  rotation?: number;
  isLayoutIndicator?: boolean;
  isHoming?: boolean;
  align?: "top";
};
export type KeyboardDefinition = KeyDefinition[][];

type LayoutPosition = {
  row?: keyof LayoutObject["keys"];
  col: number;
};
type LayoutKey = Omit<KeyDefinition, "legends"> & {
  isExtraKey?: boolean;
  extraKeysOverride?: Omit<KeyDefinition, "legends">;
  layoutPosition?: LayoutPosition;
} & OneOf<{
    isLayoutIndicator: true;
    legend?: string | string[];
  }>;

export type KeymapLayout = LayoutKey[][];

const staggeredBottomRow: LayoutKey[] = [
  { legend: Ctrl, width: 1.25, isExtraKey: true },
  { legend: Meta, width: 1.25, isExtraKey: true },
  { legend: Alt, width: 1.25, isExtraKey: true },
  {
    isLayoutIndicator: true,
    width: 6,
    x: 3.5,
    extraKeysOverride: { width: 6.25, x: 0 },
  },
  { legend: Alt, width: 1.25, isExtraKey: true },
  { legend: Meta, width: 1.25, isExtraKey: true },
  { legend: Hyper, width: 1.25, isExtraKey: true },
  { legend: Ctrl, width: 1.25, isExtraKey: true },
];

const staggeredAnsi: KeymapLayout = [
  buildRow("row1", [
    { layoutPosition: { col: 0 }, isExtraKey: true },
    ...addLayoutKeys(12, { start: 1 }),
    { legend: "Backspace", width: 2, isExtraKey: true },
  ]),
  buildRow("row2", [
    { legend: "Tab", width: 1.5, isExtraKey: true },
    { layoutPosition: { col: 0 }, x: 0.5, extraKeysOverride: { x: 0 } },
    ...addLayoutKeys(11, { start: 1 }),
    { layoutPosition: { col: 12 }, width: 1.5, isExtraKey: true },
  ]),
  buildRow("row3", [
    { legend: "Caps", width: 1.75, isExtraKey: true },
    { layoutPosition: { col: 0 }, x: 1, extraKeysOverride: { x: 0 } },
    { layoutPosition: { col: 1 } },
    { layoutPosition: { col: 2 } },
    { layoutPosition: { col: 3 }, isHoming: true },
    { layoutPosition: { col: 4 } },
    { layoutPosition: { col: 5 } },
    { layoutPosition: { col: 6 }, isHoming: true },
    { layoutPosition: { col: 7 } },
    { layoutPosition: { col: 8 } },
    { layoutPosition: { col: 9 } },
    { layoutPosition: { col: 10 } },
    { legend: Enter, width: 2.25, isExtraKey: true },
  ]),
  buildRow("row4", [
    { legend: Shift, width: 2.25, isExtraKey: true },
    { layoutPosition: { col: 0 }, x: 1.5, extraKeysOverride: { x: 0 } },
    ...addLayoutKeys(9, { start: 1 }),
    { legend: Shift, width: 2.75, isExtraKey: true },
  ]),
  staggeredBottomRow,
];

const staggeredIso: KeymapLayout = [
  buildRow("row1", [
    { layoutPosition: { col: 0 }, isExtraKey: true },
    ...addLayoutKeys(12, { start: 1 }),
    { legend: "Backspace", width: 2, isExtraKey: true },
  ]),
  buildRow("row2", [
    { legend: "Tab", width: 1.5, isExtraKey: true },
    { layoutPosition: { col: 0 }, x: 0.5, extraKeysOverride: { x: 0 } },
    ...addLayoutKeys(11, { start: 1 }),
    { legend: Enter, width: 1.5, height: 2, isExtraKey: true, align: "top" },
  ]),
  buildRow("row3", [
    { legend: "Caps", width: 1.75, isExtraKey: true },
    { layoutPosition: { col: 0 }, x: 1, extraKeysOverride: { x: 0 } },
    { layoutPosition: { col: 1 } },
    { layoutPosition: { col: 2 } },
    { layoutPosition: { col: 3 }, isHoming: true },
    { layoutPosition: { col: 4 } },
    { layoutPosition: { col: 5 } },
    { layoutPosition: { col: 6 }, isHoming: true },
    { layoutPosition: { col: 7 } },
    { layoutPosition: { col: 8 } },
    { layoutPosition: { col: 9 } },
    { layoutPosition: { col: 10 } },
    { layoutPosition: { col: 11 } },
  ]),
  buildRow("row4", [
    { legend: Shift, width: 1.25, isExtraKey: true },
    { layoutPosition: { col: 0 }, x: 0.25, extraKeysOverride: { x: 0 } },
    ...addLayoutKeys(10, { start: 1 }),
    { legend: Shift, width: 2.75, isExtraKey: true },
  ]),
  staggeredBottomRow,
];

const splitBottomRow: LayoutKey[] = [
  ...staggeredBottomRow.slice(0, 3),
  {
    isLayoutIndicator: true,
    width: 3,
    x: 3.5,
    extraKeysOverride: { x: 0 },
  },
  { legend: " ", width: 3, x: 1, extraKeysOverride: { x: 1.25 } },
  ...staggeredBottomRow.slice(4),
];

const splitAnsi: KeymapLayout = [
  insertGap(7, staggeredAnsi[0]),
  insertGap(6, staggeredAnsi[1]),
  insertGap(6, staggeredAnsi[2]),
  insertGap(6, staggeredAnsi[3]),
  splitBottomRow,
];

const splitIso: KeymapLayout = [
  insertGap(7, staggeredIso[0]),
  insertGap(6, staggeredIso[1]),
  insertGap(6, staggeredIso[2]),
  insertGap(7, staggeredIso[3]),
  splitBottomRow,
];

const steno: KeymapLayout = [
  [], //empty first row, avoid it to be hidden
  [
    { legend: ["s", "S"], height: 2 },
    { legend: ["t", "T"] },
    { legend: ["p", "P"] },
    { legend: ["h", "H"] },
    { legend: "*", height: 2 },
    { legend: ["f", "F"] },
    { legend: ["p", "P"] },
    { legend: ["l", "L"] },
    { legend: ["t", "T"] },
    { legend: ["d", "D"] },
  ],
  [
    { legend: ["k", "K"], x: 1 },
    { legend: ["w", "W"] },
    { legend: ["r", "R"] },
    { legend: ["r", "R"], x: 1 },
    { legend: ["b", "B"] },
    { legend: ["g", "G"] },
    { legend: ["s", "S"] },
    { legend: ["z", "Z"] },
  ],
  [
    { legend: ["a", "A"], x: 2.25 },
    { legend: ["o", "O"] },
    { legend: ["e", "E"], x: 0.5 },
    { legend: ["u", "U"] },
  ],
];

const stenoMatrix: KeymapLayout = [
  [], //empty first row, avoid it to be hidden
  [
    { legend: ["s", "S"] },
    { legend: ["t", "T"] },
    { legend: ["p", "P"] },
    { legend: ["h", "H"] },
    { legend: "*" },
    { legend: ["f", "F"], x: 1 },
    { legend: ["p", "P"] },
    { legend: ["l", "L"] },
    { legend: ["t", "T"] },
    { legend: ["d", "D"] },
  ],
  [
    { legend: ["s", "S"] },
    { legend: ["k", "K"] },
    { legend: ["w", "W"] },
    { legend: ["r", "R"] },
    { legend: "*" },
    { legend: ["r", "R"], x: 1 },
    { legend: ["b", "B"] },
    { legend: ["g", "G"] },
    { legend: ["s", "S"] },
    { legend: ["z", "Z"] },
  ],
  [
    { legend: ["a", "A"], x: 3 },
    { legend: ["o", "O"] },
    { legend: ["e", "E"], x: 1 },
    { legend: ["u", "U"] },
  ],
];

const matrixBottomRow: LayoutKey[] = [
  { legend: Ctrl, isExtraKey: true },
  { legend: Meta, isExtraKey: true },
  { legend: Alt, isExtraKey: true },
  {
    isLayoutIndicator: true,
    width: 4,
    x: 3,
    extraKeysOverride: { width: 6, x: 0 },
  },
  { legend: Alt, isExtraKey: true },
  { legend: HyperShort, isExtraKey: true },
  { legend: Ctrl, isExtraKey: true },
];

const matrix: KeymapLayout = [
  buildRow("row1", [
    { layoutPosition: { col: 0 }, isExtraKey: true },
    ...addLayoutKeys(10, { start: 1 }),
    { legend: BackspaceShort, isExtraKey: true },
  ]),
  buildRow("row2", [
    { legend: "Tab", isExtraKey: true },
    ...addLayoutKeys(10),
    { layoutPosition: { col: 10 }, isExtraKey: true },
  ]),
  buildRow("row3", [
    { legend: "Esc", isExtraKey: true },
    ...addLayoutKeys(3),
    { layoutPosition: { col: 3 }, isHoming: true },
    { layoutPosition: { col: 4 } },
    { layoutPosition: { col: 5 } },
    { layoutPosition: { col: 6 }, isHoming: true },
    ...addLayoutKeys(3, { start: 7 }),
    { layoutPosition: { col: 10 }, isExtraKey: true },
  ]),
  buildRow("row4", [
    { legend: Shift, isExtraKey: true },
    ...addLayoutKeys(10),
    { legend: EnterShort, isExtraKey: true },
  ]),
  matrixBottomRow,
];

const splitMatrixBottomRow: LayoutKey[] = [
  ...matrixBottomRow.slice(0, 3),
  {
    isLayoutIndicator: true,
    width: 3,
    x: 2,
    extraKeysOverride: { x: 0 },
  },
  { legend: " ", width: 3, x: 1 },
  ...matrixBottomRow.slice(4),
];

const splitMatrix: KeymapLayout = [
  insertGap(6, matrix[0]),
  insertGap(6, matrix[1]),
  insertGap(6, matrix[2]),
  insertGap(6, matrix[3]),
  splitMatrixBottomRow,
];

const aliceBottomRow: LayoutKey[] = [
  { legend: Ctrl, width: 1.5, isExtraKey: true, x: 1 },
  { legend: Alt, width: 1.5, isExtraKey: true, rotation: 10, x: 1, y: 0.25 },
  {
    legend: " ",
    width: 3,
    rotation: 10,
    y: 0.7,
    x: 2.3,
    extraKeysOverride: { x: 0, y: 0.6, width: 2 },
  },
  { legend: Meta, width: 1.5, isExtraKey: true, rotation: 10, y: 0.9 },
  {
    isLayoutIndicator: true,
    width: 3,
    rotation: -10,
    x: 1,
    y: 0.7,
    extraKeysOverride: { x: 0.65, y: 0.7, width: 2.75 },
  },
  { legend: Alt, width: 1.5, isExtraKey: true, rotation: -10, y: 0.3 },
  { legend: Ctrl, width: 1.5, isExtraKey: true, x: 2.25 },
];

const alice: KeymapLayout = [
  buildRow("row1", [
    { legend: "Esc", isExtraKey: true, x: 0.4 },
    { layoutPosition: { col: 0 }, isExtraKey: true, x: 0.15 },
    { layoutPosition: { col: 1 } },
    { layoutPosition: { col: 2 }, y: -0.1 },
    { layoutPosition: { col: 3 }, rotation: 10, y: 0.1 },
    { layoutPosition: { col: 4 }, rotation: 10, y: 0.3 },
    { layoutPosition: { col: 5 }, rotation: 10, y: 0.5 },
    { layoutPosition: { col: 6 }, rotation: 10, y: 0.7 },
    { layoutPosition: { col: 7 }, rotation: -10, y: 0.6, x: 0.15 },
    { layoutPosition: { col: 8 }, rotation: -10, y: 0.4 },
    { layoutPosition: { col: 9 }, rotation: -10, y: 0.2 },
    { layoutPosition: { col: 10 }, rotation: -10 },
    { layoutPosition: { col: 11 }, y: -0.1 },
    { layoutPosition: { col: 12 } },
    { legend: "Backspace", width: 2, isExtraKey: true },
  ]),
  buildRow("row2", [
    { legend: "PgUp", isExtraKey: true, x: 0.2 },
    { legend: "Tab", width: 1.5, isExtraKey: true, x: 0.15 },
    { layoutPosition: { col: 0 }, x: 0.15, extraKeysOverride: { x: 0 } },
    { layoutPosition: { col: 1 }, rotation: 10 },
    { layoutPosition: { col: 2 }, rotation: 10, y: 0.2 },
    { layoutPosition: { col: 3 }, rotation: 10, y: 0.4 },
    { layoutPosition: { col: 4 }, rotation: 10, y: 0.6 },
    { layoutPosition: { col: 5 }, rotation: -10, y: 0.7, x: 0.75 },
    { layoutPosition: { col: 6 }, rotation: -10, y: 0.5 },
    { layoutPosition: { col: 7 }, rotation: -10, y: 0.3 },
    { layoutPosition: { col: 8 }, rotation: -10, y: 0.1 },
    { layoutPosition: { col: 9 }, y: -0.1 },
    { layoutPosition: { col: 10 } },
    { layoutPosition: { col: 11 } },
    { layoutPosition: { col: 12 }, width: 1.5, isExtraKey: true },
  ]),
  buildRow("row3", [
    { legend: "PgDn", isExtraKey: true },
    { legend: "Caps", width: 1.75, isExtraKey: true, x: 0.15 },
    { layoutPosition: { col: 0 }, x: 0.3, extraKeysOverride: { x: 0 } },
    { layoutPosition: { col: 1 }, rotation: 10, y: 0.1 },
    { layoutPosition: { col: 2 }, rotation: 10, y: 0.3 },
    { layoutPosition: { col: 3 }, rotation: 10, y: 0.5, isHoming: true },
    { layoutPosition: { col: 4 }, rotation: 10, y: 0.7 },
    { layoutPosition: { col: 5 }, rotation: -10, y: 0.7, x: 1.15 },
    { layoutPosition: { col: 6 }, rotation: -10, y: 0.5, isHoming: true },
    { layoutPosition: { col: 7 }, rotation: -10, y: 0.3 },
    { layoutPosition: { col: 8 }, rotation: -10, y: 0.1 },
    { layoutPosition: { col: 9 } },
    { layoutPosition: { col: 10 } },
    { legend: Enter, width: 2.25, isExtraKey: true },
  ]),
  buildRow("row4", [
    { legend: Shift, width: 2.25, isExtraKey: true, x: 1 },
    { layoutPosition: { col: 0 }, x: 0.45, extraKeysOverride: { x: 0 } },
    { layoutPosition: { col: 1 }, rotation: 10, y: 0.25 },
    { layoutPosition: { col: 2 }, rotation: 10, y: 0.45 },
    { layoutPosition: { col: 3 }, rotation: 10, y: 0.65 },
    { layoutPosition: { col: 4 }, rotation: 10, y: 0.85 },
    { layoutPosition: { col: 4 }, rotation: -10, y: 0.8, x: 0.7 },
    { layoutPosition: { col: 5 }, rotation: -10, y: 0.6 },
    { layoutPosition: { col: 6 }, rotation: -10, y: 0.4 },
    { layoutPosition: { col: 7 }, rotation: -10, y: 0.2 },
    { layoutPosition: { col: 8 } },
    { layoutPosition: { col: 9 } },
    { legend: Shift, width: 1.75, isExtraKey: true },
    { legend: "fn", isExtraKey: true },
  ]),
  aliceBottomRow,
];
export const keymapLayouts: Partial<
  Record<KeymapStyle, Partial<Record<LayoutObject["type"], KeymapLayout>>>
> = {
  staggered: { ansi: staggeredAnsi, iso: staggeredIso },
  split: { ansi: splitAnsi, iso: splitIso },

  steno: { iso: steno, ansi: steno },
  steno_matrix: { iso: stenoMatrix, ansi: stenoMatrix },

  matrix: { iso: matrix, ansi: matrix },
  split_matrix: { iso: splitMatrix, ansi: splitMatrix },

  alice: { iso: alice, ansi: alice },
};

function buildRow(
  row: keyof LayoutObject["keys"],
  keys: (Omit<LayoutKey, "legends"> & { layoutPosition?: { col?: number } })[],
): LayoutKey[] {
  return keys.map((key, col) => {
    const lp = key.layoutPosition;
    return {
      ...key,
      ...(lp
        ? {
            layoutPosition: {
              ...lp,
              ...(lp.row !== undefined ? {} : { row }),
              ...(lp.col !== undefined ? {} : { col }),
            },
          }
        : {}),
    } as LayoutKey;
  });
}

function insertGap(gapCol: number, row: LayoutKey[] | undefined): LayoutKey[] {
  return (row as LayoutKey[]).map((def, col) => ({
    ...def,
    x: col === gapCol ? 1 : def.x,
  }));
}

function addLayoutKeys(
  count: number,
  options?: { start?: number },
): LayoutKey[] {
  return new Array<LayoutKey>(count).fill({}).map((it, index) => {
    return {
      ...it,
      layoutPosition: {
        col: index + (options?.start ?? 0),
      },
    };
  });
}

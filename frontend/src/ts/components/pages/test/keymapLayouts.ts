import { KeymapStyle } from "@monkeytype/schemas/configs";
import { KeyLegends, LayoutObject } from "@monkeytype/schemas/layouts";
import { OneOf } from "../../../utils/types";

export type KeyDefinition = {
  legends: KeyLegends;
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
    legend?: string;
  }>;

export type KeymapLayout = LayoutKey[][];

function addLayoutKeys(
  count: number,
  options: { start?: number },
): LayoutKey[] {
  return new Array<LayoutKey>(count).fill({}).map((it, index) => {
    return {
      ...it,
      layoutPosition: {
        col: index + (options.start ?? 0),
      },
    };
  });
}

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
    { legend: "Enter", width: 2.25, isExtraKey: true },
  ]),
  buildRow("row4", [
    { legend: "Shift", width: 2.25, isExtraKey: true },
    { layoutPosition: { col: 0 }, x: 1.5, extraKeysOverride: { x: 0 } },
    ...addLayoutKeys(9, { start: 1 }),
    { legend: "Shift", width: 2.75, isExtraKey: true },
  ]),
  [
    { legend: "Ctrl", width: 1.25, isExtraKey: true },
    { legend: "Monke", width: 1.25, isExtraKey: true },
    { legend: "Alt", width: 1.25, isExtraKey: true },
    {
      isLayoutIndicator: true,
      width: 6,
      x: 3.5,
      extraKeysOverride: { width: 6.25, x: 0 },
    },
    { legend: "Alt", width: 1.25, isExtraKey: true },
    { legend: "Monke", width: 1.25, isExtraKey: true },
    { legend: "Meta", width: 1.25, isExtraKey: true },
    { legend: "Ctrl", width: 1.25, isExtraKey: true },
  ],
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
    { legend: "Enter", width: 1.5, height: 2, isExtraKey: true },
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
    { legend: "Shift", width: 1.25, isExtraKey: true },
    { layoutPosition: { col: 0 }, x: 0.25, extraKeysOverride: { x: 0 } },
    ...addLayoutKeys(10, { start: 1 }),
    { legend: "Shift", width: 2.75, isExtraKey: true },
  ]),
  [
    { legend: "Ctrl", width: 1.25, isExtraKey: true },
    { legend: "Monke", width: 1.25, isExtraKey: true },
    { legend: "Alt", width: 1.25, isExtraKey: true },
    {
      isLayoutIndicator: true,
      width: 6,
      x: 3.5,
      extraKeysOverride: { width: 6.25, x: 0 },
    },
    { legend: "Alt", width: 1.25, isExtraKey: true },
    { legend: "Monke", width: 1.25, isExtraKey: true },
    { legend: "Meta", width: 1.25, isExtraKey: true },
    { legend: "Ctrl", width: 1.25, isExtraKey: true },
  ],
];

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

export const keymapLayouts: Partial<
  Record<KeymapStyle, Partial<Record<LayoutObject["type"], KeymapLayout>>>
> = {
  staggered: {
    ansi: staggeredAnsi,
    iso: staggeredIso,
  },
};

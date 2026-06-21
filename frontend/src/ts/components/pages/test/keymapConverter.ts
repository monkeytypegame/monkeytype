import { KeymapStyle } from "@monkeytype/schemas/configs";
import { KeyLegends, LayoutObject } from "@monkeytype/schemas/layouts";
import { typedEntries } from "../../../utils/misc";
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
export type KeyboardDefinition = Record<
  keyof LayoutObject["keys"],
  KeyDefinition[]
>;

type ConvertOptions = {
  keymapStyle: KeymapStyle;
  showAllKeys: boolean;
};

export function convertLayoutToKeymap(
  rawLayout: LayoutObject,
  options: ConvertOptions,
): KeyboardDefinition {
  const layout = structuredClone(rawLayout);

  if (options.keymapStyle === "staggered" && layout.type === "ansi") {
    return convert({
      legends: layout.keys,
      keymap: staggeredAnsi,
      convertOptions: options,
    });
  }
  throw new Error(`not supported style ${options.keymapStyle}`);
}

function convert(options: {
  legends: LayoutObject["keys"];
  keymap: KeymapLayout;
  convertOptions: ConvertOptions;
}): KeyboardDefinition {
  const isShowAllKeys = options.convertOptions.showAllKeys ?? false;

  return Object.fromEntries(
    typedEntries(options.keymap).map(([row, keys]) => [
      row,
      keys
        .map((keyDef) => {
          const layoutLegend =
            keyDef.layoutPosition &&
            options.legends[keyDef.layoutPosition.row]?.[
              keyDef.layoutPosition.col
            ];

          const legends = keyDef.isLayoutIndicator
            ? buildLegends([" "])
            : buildLegends(
                keyDef.legend !== undefined
                  ? [keyDef.legend]
                  : (layoutLegend as string[]),
              );

          if (keyDef.isExtraKey && !isShowAllKeys) {
            return undefined;
          }

          console.log("### ready", legends);

          const final = {
            ...keyDef,
            ...(isShowAllKeys ? keyDef.extraKeysOverride : {}),
          };

          return {
            legends,
            ...(final.height !== undefined ? { height: final.height } : {}),
            ...(final.width !== undefined ? { width: final.width } : {}),
            ...(final.x !== undefined ? { x: final.x } : {}),
            ...(final.y !== undefined ? { y: final.y } : {}),
            ...(final.rotation !== undefined
              ? { rotation: final.rotation }
              : {}),
            ...(final.isLayoutIndicator === true
              ? { isLayoutIndicator: true }
              : {}),
            ...(final.isHoming === true ? { isHoming: true } : {}),
          } satisfies KeyDefinition;
        })
        //filter skipped keys
        .filter((it) => it !== undefined),
    ]),
  ) as KeyboardDefinition;
}

function buildLegends(legends: KeyLegends): KeyLegends {
  if (legends === undefined) return ["error", "error", "error", "error"];
  switch (legends.length) {
    case 1:
      return new Array<string>(4).fill(legends.at(0) as string);
    case 2:
      return [...legends, ...legends];
    case 3:
      return [...legends, ""];
    default:
      return legends;
  }
}

type LayoutPosition = {
  row: keyof LayoutObject["keys"];
  col: number;
};
type LayoutKey = Omit<KeyDefinition, "legends"> & {
  isExtraKey?: boolean;
  extraKeysOverride?: Omit<KeyDefinition, "legends">;
} & OneOf<{
    isLayoutIndicator: true;
    layoutPosition: LayoutPosition;
    legend: string;
  }>;

type KeymapLayout = Record<keyof LayoutObject["keys"], LayoutKey[]>;

const staggeredAnsi: KeymapLayout = {
  row1: [
    { layoutPosition: { col: 0, row: "row1" }, isExtraKey: true },
    { layoutPosition: { col: 1, row: "row1" } },
    { layoutPosition: { col: 2, row: "row1" } },
    { layoutPosition: { col: 3, row: "row1" } },
    { layoutPosition: { col: 4, row: "row1" } },
    { layoutPosition: { col: 5, row: "row1" } },
    { layoutPosition: { col: 6, row: "row1" } },
    { layoutPosition: { col: 7, row: "row1" } },
    { layoutPosition: { col: 8, row: "row1" } },
    { layoutPosition: { col: 9, row: "row1" } },
    { layoutPosition: { col: 10, row: "row1" } },
    { layoutPosition: { col: 11, row: "row1" } },
    { layoutPosition: { col: 12, row: "row1" } },
    { legend: "Backspace", width: 2, isExtraKey: true },
  ],
  row2: [
    { legend: "Tab", width: 1.5, isExtraKey: true },
    {
      layoutPosition: { col: 0, row: "row2" },
      x: 0.5,
      extraKeysOverride: { x: 0 },
    },
    { layoutPosition: { col: 1, row: "row2" } },
    { layoutPosition: { col: 2, row: "row2" } },
    { layoutPosition: { col: 3, row: "row2" } },
    { layoutPosition: { col: 4, row: "row2" } },
    { layoutPosition: { col: 5, row: "row2" } },
    { layoutPosition: { col: 6, row: "row2" } },
    { layoutPosition: { col: 7, row: "row2" } },
    { layoutPosition: { col: 8, row: "row2" } },
    { layoutPosition: { col: 9, row: "row2" } },
    { layoutPosition: { col: 10, row: "row2" } },
    { layoutPosition: { col: 11, row: "row2" } },
    { layoutPosition: { col: 12, row: "row2" }, width: 1.5, isExtraKey: true },
  ],
  row3: [
    { legend: "Caps", width: 1.75, isExtraKey: true },
    {
      layoutPosition: { col: 0, row: "row3" },
      x: 1,
      extraKeysOverride: { x: 0 },
    },
    { layoutPosition: { col: 1, row: "row3" } },
    { layoutPosition: { col: 2, row: "row3" } },
    { layoutPosition: { col: 3, row: "row3" }, isHoming: true },
    { layoutPosition: { col: 4, row: "row3" } },
    { layoutPosition: { col: 5, row: "row3" } },
    { layoutPosition: { col: 6, row: "row3" }, isHoming: true },
    { layoutPosition: { col: 7, row: "row3" } },
    { layoutPosition: { col: 8, row: "row3" } },
    { layoutPosition: { col: 9, row: "row3" } },
    { layoutPosition: { col: 10, row: "row3" } },
    { legend: "Enter", width: 2.25, isExtraKey: true },
  ],
  row4: [
    { legend: "Shift", width: 2.25, isExtraKey: true },
    {
      layoutPosition: { col: 0, row: "row4" },
      x: 1.5,
      extraKeysOverride: { x: 0 },
    },
    { layoutPosition: { col: 1, row: "row4" } },
    { layoutPosition: { col: 2, row: "row4" } },
    { layoutPosition: { col: 3, row: "row4" } },
    { layoutPosition: { col: 4, row: "row4" } },
    { layoutPosition: { col: 5, row: "row4" } },
    { layoutPosition: { col: 6, row: "row4" } },
    { layoutPosition: { col: 7, row: "row4" } },
    { layoutPosition: { col: 8, row: "row4" } },
    { layoutPosition: { col: 9, row: "row4" } },
    { legend: "Shift", width: 2.75, isExtraKey: true },
  ],
  row5: [
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
};

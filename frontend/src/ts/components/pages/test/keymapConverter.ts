import { KeymapStyle } from "@monkeytype/schemas/configs";
import { KeyLegends, LayoutObject } from "@monkeytype/schemas/layouts";
import { typedEntries } from "../../../utils/misc";

export type KeyDefinition = {
  legends: KeyLegends;
  width: number;
  height: number;
  x: number;
};
export type KeyboardDefinition = Record<
  keyof LayoutObject["keys"],
  KeyDefinition[]
>;

type ConvertOptions = {
  displayName: string;
  keymapStyle: KeymapStyle;
  showAllKeys: boolean;
};

export function convertLayoutToKeymap(
  layout: LayoutObject,
  options: ConvertOptions,
): KeyboardDefinition {
  switch (options.keymapStyle) {
    case "staggered":
      return convertStaggered(layout, options);
    case "split":
      return convertSplit(layout, options);
  }

  throw new Error("not supported");
}

function convertStaggered(
  layout: LayoutObject,
  options: ConvertOptions,
): KeyboardDefinition {
  const base = convertBase(layout, options, {
    row1: { skip: (it) => it.col === 0 },
    row2: { x: (it) => (it.col === 0 ? 2 : 0), skip: (it) => it.col === 12 },
    row3: { x: (it) => (it.col === 0 ? 4 : 0) },
    row4: { x: (it) => (it.col === 0 ? 6 : 0) },
    row5: {
      x: () => 3,
      width: () => 6,
      legend: () => new Array<string>(4).fill(options.displayName),
    },
  });

  return base;
}

function convertSplit(
  layout: LayoutObject,
  options: ConvertOptions,
): KeyboardDefinition {
  const insertGap = (it: RuleParams): number => (it.col === 5 ? 8 : 0);
  const base = convertBase(layout, options, {
    row1: { skip: (it) => it.col === 0, x: (it) => (it.col === 7 ? 8 : 0) },
    row2: {
      x: (it) => (it.col === 0 ? 2 : insertGap(it)),
      skip: (it) => it.col === 12,
    },
    row3: { x: (it) => (it.col === 0 ? 4 : insertGap(it)) },
    row4: { x: (it) => (it.col === 0 ? 6 : insertGap(it)) },
    row5: {
      x: ({ col }) => (col === 0 ? 3 + 5 * 4 : 0),
      width: () => 3,
      legend: () => new Array<string>(4).fill(options.displayName),
    },
  });

  if (base.row5.length === 1) {
    base.row5.push({
      height: 1,
      width: 3,
      x: 8,
      legends: ["", "", "", ""],
    });
  }

  return base;
}

type RuleParams = {
  col: number;
};

function convertBase(
  layout: LayoutObject,
  options: ConvertOptions,
  cols?: Partial<
    Record<
      keyof LayoutObject["keys"],
      {
        legend?: (options: RuleParams) => KeyLegends;
        height?: (options: RuleParams) => number;
        width?: (options: RuleParams) => number;
        x?: (options: RuleParams) => number;
        skip?: (options: RuleParams) => boolean;
      }
    >
  >,
): KeyboardDefinition {
  const result = Object.fromEntries(
    typedEntries(layout.keys).map(([row, keys]) => [
      row,
      keys
        .map((key, colNum) =>
          !options.showAllKeys &&
          (cols?.[row]?.skip?.({ col: colNum }) ?? false)
            ? undefined
            : ({
                legends: addLayers(
                  cols?.[row]?.legend?.({ col: colNum }) ?? key,
                ),
                height: cols?.[row]?.height?.({ col: colNum }) ?? 1,
                width: cols?.[row]?.width?.({ col: colNum }) ?? 1,
                x: cols?.[row]?.x?.({ col: colNum }) ?? 0,
              } satisfies KeyDefinition),
        )
        .filter((it) => it !== undefined),
    ]),
  ) as KeyboardDefinition;

  return result;
}

function addLayers(legends: KeyLegends): KeyLegends {
  if (legends.length === 2) return [...legends, ...legends];
  return legends;
}

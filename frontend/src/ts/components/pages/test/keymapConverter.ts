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
  const firstColGap =
    (gap: number) =>
    ({ col }: { col: number }) =>
      options.showAllKeys ? 0 : col === 0 ? gap : 0;
  const base = convertBase(layout, options, {
    row1: { skip: ({ col }) => col === 0 },
    row2: {
      x: firstColGap(2),
      skip: ({ col }) => col === 12,
      width: ({ col }) => (col === 12 ? 1.5 : 1),
    },
    row3: { x: firstColGap(4) },
    row4: { x: firstColGap(6) },
    row5: {
      x: firstColGap(3),
      width: () => 6.25,
      legend: () => new Array<string>(4).fill(options.displayName),
    },
  });

  return base;
}

function convertSplit(
  layout: LayoutObject,
  options: ConvertOptions,
): KeyboardDefinition {
  if (layout.keys.row5.length === 1) {
    layout.keys.row5.push(["", "", "", ""]);
  }
  const calcGap =
    ({ col1Gap, splitCol }: { col1Gap: number; splitCol?: number }) =>
    ({ col }: { col: number }) => {
      if (col === 0) return options.showAllKeys ? 0 : col1Gap;
      if (col === (splitCol ?? 5)) return 8;
      return 0;
    };

  const base = convertBase(layout, options, {
    row1: {
      x: calcGap({ col1Gap: 0, splitCol: 7 }),
      skip: ({ col }) => col === 0,
    },
    row2: {
      x: calcGap({ col1Gap: 2 }),
      skip: ({ col }) => col === 12,
      width: ({ col }) => (col === 12 ? 1.5 : 1),
    },
    row3: { x: calcGap({ col1Gap: 4 }) },
    row4: { x: calcGap({ col1Gap: 6 }) },
    row5: {
      x: calcGap({ col1Gap: 3 + 5 * 4, splitCol: 1 }),
      width: ({ col }) =>
        (options.showAllKeys ? { 0: 3.25, 1: 3 } : { 0: 3, 1: 3 })[col] ?? 1,
      legend: ({ col }) =>
        col === 0 ? new Array<string>(4).fill(options.displayName) : undefined,
    },
  });

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
        legend?: (options: RuleParams) => KeyLegends | undefined;
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

  if (options.showAllKeys) {
    result.row1.push({
      legends: new Array<string>(4).fill("BS"),
      x: 0,
      width: 2,
      height: 1,
    });
    result.row2.unshift({
      legends: new Array<string>(4).fill("Tab"),
      height: 1,
      width: 1.5,
      x: 0,
    });
    result.row3.unshift({
      legends: new Array<string>(4).fill("Caps"),
      height: 1,
      width: 1.75,
      x: 0,
    });
    result.row3.push({
      legends: new Array<string>(4).fill("Enter"),
      height: 1,
      width: 2.25,
      x: 0,
    });
    result.row4.unshift({
      legends: new Array<string>(4).fill("Shift"),
      height: 1,
      width: 2.25,
      x: 0,
    });
    result.row4.push({
      legends: new Array<string>(4).fill("Shift"),
      height: 1,
      width: 2.75,
      x: 0,
    });

    result.row5.unshift({
      legends: new Array<string>(4).fill("Ctrl"),
      height: 1,
      width: 1.25,
      x: 0,
    });
    result.row5.unshift({
      legends: new Array<string>(4).fill("Monke"),
      height: 1,
      width: 1.25,
      x: 0,
    });
    result.row5.unshift({
      legends: new Array<string>(4).fill("Alt"),
      height: 1,
      width: 1.25,
      x: 0,
    });

    result.row5.push({
      legends: new Array<string>(4).fill("Ctrl"),
      height: 1,
      width: 1.25,
      x: 0,
    });
    result.row5.push({
      legends: new Array<string>(4).fill("Monke"),
      height: 1,
      width: 1.25,
      x: 0,
    });
    result.row5.push({
      legends: new Array<string>(4).fill("Meta"),
      height: 1,
      width: 1.25,
      x: 0,
    });
    result.row5.push({
      legends: new Array<string>(4).fill("Ctrl"),
      height: 1,
      width: 1.25,
      x: 0,
    });
  }

  return result;
}

function addLayers(legends: KeyLegends): KeyLegends {
  if (legends.length === 2) return [...legends, ...legends];
  return legends;
}

import { KeymapStyle } from "@monkeytype/schemas/configs";
import { KeyLegends, LayoutObject } from "@monkeytype/schemas/layouts";
import { typedEntries } from "../../../utils/misc";

export type KeyDefinition = {
  legends: KeyLegends;
  width?: number;
  height?: number;
  x?: number;
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

type RuleParams = {
  col: number;
};

export function convertLayoutToKeymap(
  rawLayout: LayoutObject,
  options: ConvertOptions,
): KeyboardDefinition {
  const layout = structuredClone(rawLayout);
  switch (options.keymapStyle) {
    case "staggered":
    case "split":
      return convertStaggered(layout, options);
  }

  throw new Error("not supported");
}

function convertStaggered(
  layout: LayoutObject,
  options: ConvertOptions,
): KeyboardDefinition {
  const split = options.keymapStyle === "split";

  if (split && layout.keys.row5.length === 1) {
    layout.keys.row5.push(buildLegends([""]));
  }
  const calcGap =
    ({ col1Gap, splitCol }: { col1Gap: number; splitCol?: number }) =>
    ({ col }: { col: number }) => {
      if (col === 0) return options.showAllKeys ? undefined : col1Gap;
      if (split && col === (splitCol ?? 5)) return 8;
      return undefined;
    };

  const base = convertBase(layout, options, {
    row1: {
      x: calcGap({ col1Gap: 0, splitCol: 7 }),
      skip: ({ col }) => col === 0,
    },
    row2: {
      x: calcGap({ col1Gap: 2 }),
      skip: ({ col }) => col === 12,
      width: ({ col }) => (col === 12 ? 1.5 : undefined),
    },
    row3: { x: calcGap({ col1Gap: 4 }) },
    row4: { x: calcGap({ col1Gap: 6 }) },
    row5: {
      x: calcGap({ col1Gap: split ? 3 + 5 * 4 : 22, splitCol: 1 }),
      width: ({ col }) => {
        if (split) {
          return (
            (options.showAllKeys ? { 0: 3.25, 1: 3 } : { 0: 3, 1: 3 })[col] ??
            undefined
          );
        }
        return options.showAllKeys ? 6.25 : 6;
      },
      legend: ({ col }) =>
        col === 0 ? buildLegends([options.displayName]) : undefined,
    },
  });

  return base;
}

function convertBase(
  layout: LayoutObject,
  options: ConvertOptions,
  cols?: Partial<
    Record<
      keyof LayoutObject["keys"],
      {
        legend?: (options: RuleParams) => KeyLegends | undefined;
        height?: (options: RuleParams) => number | undefined;
        width?: (options: RuleParams) => number | undefined;
        x?: (options: RuleParams) => number | undefined;
        skip?: (options: RuleParams) => boolean;
      }
    >
  >,
): KeyboardDefinition {
  const result = Object.fromEntries(
    typedEntries(layout.keys).map(([row, keys]) => [
      row,
      keys
        .map((key, colNum) => {
          if (
            !options.showAllKeys &&
            (cols?.[row]?.skip?.({ col: colNum }) ?? false)
          ) {
            return undefined;
          }

          const legends = buildLegends(
            cols?.[row]?.legend?.({ col: colNum }) ?? key,
          );
          const height = cols?.[row]?.height?.({ col: colNum });
          const width = cols?.[row]?.width?.({ col: colNum });
          const x = cols?.[row]?.x?.({ col: colNum });

          return {
            legends,
            ...(height !== undefined ? { height } : {}),
            ...(width !== undefined ? { width } : {}),
            ...(x !== undefined ? { x } : {}),
          } satisfies KeyDefinition;
        })
        .filter((it) => it !== undefined),
    ]),
  ) as KeyboardDefinition;

  if (options.showAllKeys) {
    result.row1.push({
      legends: buildLegends(["BS"]),
      width: 2,
    });
    result.row2.unshift({
      legends: buildLegends(["Tab"]),
      width: 1.5,
    });
    result.row3.unshift({
      legends: buildLegends(["Caps"]),
      width: 1.75,
    });
    result.row3.push({
      legends: buildLegends(["Enter"]),
      width: 2.25,
    });
    result.row4.unshift({
      legends: buildLegends(["Shift"]),
      width: 2.25,
    });
    result.row4.push({
      legends: buildLegends(["Shift"]),
      width: 2.75,
    });

    result.row5.unshift(
      {
        legends: buildLegends(["Ctrl"]),
        width: 1.25,
      },
      {
        legends: buildLegends(["Monke"]),
        width: 1.25,
      },
      {
        legends: buildLegends(["Alt"]),
        width: 1.25,
      },
    );

    result.row5.push(
      {
        legends: buildLegends(["Alt"]),
        width: 1.25,
      },
      {
        legends: buildLegends(["Monke"]),
        width: 1.25,
      },
      {
        legends: buildLegends(["Meta"]),
        width: 1.25,
      },
      {
        legends: buildLegends(["Ctrl"]),
        width: 1.25,
      },
    );
  }

  return result;
}

function buildLegends(legends: KeyLegends): KeyLegends {
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

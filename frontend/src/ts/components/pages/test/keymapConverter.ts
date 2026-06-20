import { KeymapStyle } from "@monkeytype/schemas/configs";
import { KeyLegends, LayoutObject } from "@monkeytype/schemas/layouts";
import { typedEntries } from "../../../utils/misc";

export type KeyDefinition = {
  legends: KeyLegends;
  /** width in u  */
  width?: number;
  /** height in u  */
  height?: number;
  /** x-offset in u  */
  x?: number;

  isLayoutIndicator?: boolean;
  isHoming?: boolean;
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
    case "matrix":
    case "split_matrix":
      return convertMatrix(layout, options);
    case "steno":
    case "steno_matrix":
      return convertSteno(options);
  }

  throw new Error("not supported");
}

function convertStaggered(
  layout: LayoutObject,
  options: ConvertOptions,
): KeyboardDefinition {
  const isSplit = options.keymapStyle === "split";
  const isIso = layout.type === "iso";
  const hasRow5ExtraKey = layout.keys.row5.length !== 1;

  if (isSplit && !hasRow5ExtraKey) {
    layout.keys.row5.push(buildLegends([" "]));
  }

  const calcGap =
    ({ col1Gap, splitCol }: { col1Gap: number; splitCol?: number }) =>
    ({ col }: { col: number }) => {
      if (col === 0) return options.showAllKeys ? undefined : col1Gap;
      if (isSplit && col === (splitCol ?? 5)) return 1;
      return undefined;
    };

  const layoutIndicatorIndex = layout.keys.row5.findIndex(
    (it) => it.at(0) === " ",
  );

  const result = convertBase(layout, options, {
    row1: {
      x: calcGap({ col1Gap: 0, splitCol: 7 }),
      skip: ({ col }) => (options.showAllKeys ? false : col === 0),
    },
    row2: {
      x: calcGap({ col1Gap: 0.5 }),
      skip: ({ col }) => (options.showAllKeys ? false : col === 12),
      width: ({ col }) => (col === 12 ? 1.5 : undefined),
    },
    row3: {
      x: calcGap({ col1Gap: 1 }),
      isHoming: ({ col }) => col === 3 || col === 6,
    },
    row4: { x: calcGap({ col1Gap: isIso ? 0.25 : 1.5 }) },
    row5: {
      x: calcGap({
        col1Gap: hasRow5ExtraKey ? (isSplit ? 5.5 : 4) : 3.5,
        splitCol: 1,
      }),
      width: ({ col }) => {
        if (
          (!options.showAllKeys || !isSplit) &&
          layout.keys.row5[col]?.at(0) !== " "
        ) {
          return undefined;
        }
        if (isSplit) {
          if (options.showAllKeys) {
            return col === layoutIndicatorIndex ? 3.5 : 3;
          } else {
            return 3;
          }
        }
        if (options.showAllKeys) return hasRow5ExtraKey ? 5.25 : 6.25;
        return 6;
      },
      isLayoutIndicator: ({ col }) => col === layoutIndicatorIndex,
    },
  });

  if (!options.showAllKeys) return result;

  //extra keys
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
    if (isIso) {
      result.row2.push({
        legends: buildLegends(["Enter"]),
        width: 1.5,
        height: 2,
      });
    } else {
      result.row3.push({
        legends: buildLegends(["Enter"]),
        width: 2.25,
      });
    }
    result.row4.unshift({
      legends: buildLegends(["Shift"]),
      width: isIso ? 1.25 : 2.25,
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

function convertMatrix(
  layout: LayoutObject,
  options: ConvertOptions,
): KeyboardDefinition {
  const isSplit = options.keymapStyle === "split_matrix";
  const hasRow5ExtraKey = layout.keys.row5.length !== 1;

  if (isSplit && !hasRow5ExtraKey) {
    layout.keys.row5.push(buildLegends([" "]));
  }

  const calcGap =
    ({ col1Gap, splitCol }: { col1Gap?: number; splitCol?: number }) =>
    ({ col }: { col: number }) => {
      if (col === 0) return options.showAllKeys ? undefined : col1Gap;
      if (isSplit && col === (splitCol ?? 5)) return 1;
      return undefined;
    };

  const layoutIndicatorIndex = layout.keys.row5.findIndex(
    (it) => it.at(0) === " ",
  );

  const result = convertBase(layout, options, {
    row1: {
      skip: ({ col }) => (!options.showAllKeys && col === 0) || col > 10,
      x: calcGap({ splitCol: 6 }),
    },
    row2: {
      skip: ({ col }) => col > 9,
      x: calcGap({}),
    },
    row3: {
      skip: ({ col }) => col > (options.showAllKeys ? 10 : 9),
      x: calcGap({}),
      isHoming: ({ col }) => col === 3 || col === 6,
    },
    row4: {
      skip: ({ col }) => col > 9,
      x: calcGap({}),
    },
    row5: {
      x: calcGap({ col1Gap: isSplit || hasRow5ExtraKey ? 2 : 3, splitCol: 1 }),
      width: () =>
        isSplit || hasRow5ExtraKey ? 3 : options.showAllKeys ? 6 : 4,
      isLayoutIndicator: ({ col }) => col === layoutIndicatorIndex,
    },
  });

  //extra keys
  if (options.showAllKeys) {
    result.row1.push({
      legends: buildLegends(["BS"]),
    });

    result.row2.unshift({
      legends: buildLegends(["Tab"]),
    });
    result.row2.push({
      legends: buildLegends(["Del"]),
    });

    result.row3.unshift({
      legends: buildLegends(["Esc"]),
    });

    result.row4.unshift({
      legends: buildLegends(["Shift"]),
    });
    result.row4.push({
      legends: buildLegends(["Enter"]),
    });

    result.row5.unshift(
      { legends: buildLegends(["Ctrl"]) },
      { legends: buildLegends(["Monke"]) },
      { legends: buildLegends(["Alt"]) },
    );

    result.row5.push(
      { legends: buildLegends(["Alt"]) },
      { legends: buildLegends(["Meta"]) },
      { legends: buildLegends(["Ctrl"]) },
    );
  }
  return result;
}

function convertSteno(options: ConvertOptions): KeyboardDefinition {
  const isSplit = options.keymapStyle === "steno_matrix";

  const layout: LayoutObject = {
    keymapShowTopRow: true,
    type: "matrix",
    keys: {
      row1: [],
      row2: [
        ["s", "S"],
        ["t", "T"],
        ["p", "P"],
        ["h", "H"],
        ["*", "*"],
        ["f", "F"],
        ["p", "P"],
        ["l", "L"],
        ["t", "T"],
        ["d", "D"],
      ],
      row3: [
        ["s", "S"],
        ["k", "K"],
        ["w", "W"],
        ["r", "R"],
        ["*", "*"],
        ["r", "R"],
        ["b", "B"],
        ["g", "G"],
        ["s", "S"],
        ["z", "Z"],
      ],
      row4: [
        ["a", "A"],
        ["o", "O"],
        ["e", "E"],
        ["u", "U"],
      ],
      row5: [],
    },
  };

  const calcGap =
    (options: { colGap?: Record<number, number> }) =>
    ({ col }: { col: number }) => {
      const gap = options?.colGap?.[col];
      if (!isSplit && gap !== undefined) return gap;
      return isSplit && col === 5 ? 1 : undefined;
    };

  const isLargeKey = (col: number): boolean => !isSplit && [0, 4].includes(col);

  const base = convertBase(layout, options, {
    row2: {
      height: ({ col }) => (isLargeKey(col) ? 2 : undefined),
      x: calcGap({}),
    },
    row3: {
      skip: ({ col }) => isLargeKey(col),
      x: calcGap({ colGap: { 1: 1, 5: 1 } }),
    },
    row4: {
      x: ({ col }) => (isSplit ? { 0: 3, 2: 1 } : { 0: 2.25, 2: 0.5 })[col],
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
        isLayoutIndicator?: (options: RuleParams) => boolean;
        isHoming?: (options: RuleParams) => boolean;
      }
    >
  >,
): KeyboardDefinition {
  const result = Object.fromEntries(
    typedEntries(layout.keys).map(([row, keys]) => [
      row,
      keys
        .map((key, colNum) => {
          if (cols?.[row]?.skip?.({ col: colNum }) ?? false) {
            return undefined;
          }

          const legends = buildLegends(
            cols?.[row]?.legend?.({ col: colNum }) ?? key,
          );
          const height = cols?.[row]?.height?.({ col: colNum });
          const width = cols?.[row]?.width?.({ col: colNum });
          const x = cols?.[row]?.x?.({ col: colNum });
          const isLayoutIndicator = cols?.[row]?.isLayoutIndicator?.({
            col: colNum,
          });
          const isHoming = cols?.[row]?.isHoming?.({ col: colNum });

          return {
            legends,
            ...(height !== undefined ? { height } : {}),
            ...(width !== undefined ? { width } : {}),
            ...(x !== undefined ? { x } : {}),
            ...(isLayoutIndicator === true ? { isLayoutIndicator: true } : {}),
            ...(isHoming === true ? { isHoming: true } : {}),
          } satisfies KeyDefinition;
        })
        .filter((it) => it !== undefined),
    ]),
  ) as KeyboardDefinition;

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

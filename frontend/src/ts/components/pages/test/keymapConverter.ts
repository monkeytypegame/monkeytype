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

type ExtraKeysConfig = {
  row1Append?: KeyDefinition[];
  row2Prepend?: KeyDefinition[];
  row2Append?: KeyDefinition[];
  row3Prepend?: KeyDefinition[];
  row3Append?: KeyDefinition[];
  row4Prepend?: KeyDefinition[];
  row4Append?: KeyDefinition[];
  row5Prepend?: KeyDefinition[];
  row5Append?: KeyDefinition[];
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
  const showAllKeys = options.showAllKeys;

  if (isSplit && !hasRow5ExtraKey) {
    layout.keys.row5.push(buildLegends([" "]));
  }

  const layoutIndicatorIndex = findLayoutIndicatorIndex(layout.keys.row5);

  const result = convertBase(layout, options, {
    row1: {
      x: calcGap({ firstColGap: 0, splitCol: 7, isSplit, showAllKeys }),
      skip: ({ col }) => !options.showAllKeys && col === 0,
    },
    row2: {
      x: calcGap({ firstColGap: 0.5, isSplit, showAllKeys }),
      skip: ({ col }) => !options.showAllKeys && col === 12,
      width: ({ col }) => (col === 12 ? 1.5 : undefined),
    },
    row3: {
      x: calcGap({ firstColGap: 1, isSplit, showAllKeys }),
      isHoming: ({ col }) => col === 3 || col === 6,
    },
    row4: {
      x: calcGap({ firstColGap: isIso ? 0.25 : 1.5, isSplit, showAllKeys }),
    },
    row5: {
      x: calcGap({
        firstColGap: hasRow5ExtraKey ? (isSplit ? 5.5 : 4) : 3.5,
        splitCol: 1,
        isSplit,
        showAllKeys,
      }),
      width: ({ col }) => {
        if (
          (!showAllKeys || !isSplit) &&
          layout.keys.row5[col]?.at(0) !== " "
        ) {
          return undefined;
        }
        if (isSplit) {
          if (showAllKeys) {
            return col === layoutIndicatorIndex ? 3.5 : 3;
          } else {
            return 3;
          }
        }
        if (showAllKeys) return hasRow5ExtraKey ? 5.25 : 6.25;
        return 6;
      },
      isLayoutIndicator: ({ col }) => col === layoutIndicatorIndex,
    },
  });

  if (options.showAllKeys) {
    const extraKeysConfig: ExtraKeysConfig = {
      row1Append: [buildKey(["BS"], { width: 2 })],
      row2Prepend: [buildKey(["Tab"], { width: 1.5 })],
      row2Append: isIso
        ? [buildKey(["Enter"], { width: 1.5, height: 2 })]
        : undefined,
      row3Prepend: [buildKey(["Caps"], { width: 1.75 })],
      row3Append: !isIso ? [buildKey(["Enter"], { width: 2.25 })] : undefined,
      row4Prepend: [buildKey(["Shift"], { width: isIso ? 1.25 : 2.25 })],
      row4Append: [buildKey(["Shift"], { width: 2.75 })],
      row5Prepend: [
        buildKey(["Ctrl"], { width: 1.25 }),
        buildKey(["Monke"], { width: 1.25 }),
        buildKey(["Alt"], { width: 1.25 }),
      ],
      row5Append: [
        buildKey(["Alt"], { width: 1.25 }),
        buildKey(["Monke"], { width: 1.25 }),
        buildKey(["Meta"], { width: 1.25 }),
        buildKey(["Ctrl"], { width: 1.25 }),
      ],
    };

    addExtraKeys(result, extraKeysConfig);
  }

  return result;
}

function convertMatrix(
  layout: LayoutObject,
  options: ConvertOptions,
): KeyboardDefinition {
  const isSplit = options.keymapStyle === "split_matrix";
  const hasRow5ExtraKey = layout.keys.row5.length !== 1;
  const showAllKeys = options.showAllKeys;

  if (isSplit && !hasRow5ExtraKey) {
    layout.keys.row5.push(buildLegends([" "]));
  }

  const layoutIndicatorIndex = findLayoutIndicatorIndex(layout.keys.row5);

  const result = convertBase(layout, options, {
    row1: {
      skip: ({ col }) => (!showAllKeys && col === 0) || col > 10,
      x: calcGap({ splitCol: 6, isSplit, showAllKeys }),
    },
    row2: {
      skip: ({ col }) => col > 9,
      x: calcGap({ isSplit, showAllKeys }),
    },
    row3: {
      skip: ({ col }) => col > (showAllKeys ? 10 : 9),
      x: calcGap({ isSplit, showAllKeys }),
      isHoming: ({ col }) => col === 3 || col === 6,
    },
    row4: {
      skip: ({ col }) => col > 9,
      x: calcGap({ isSplit, showAllKeys }),
    },
    row5: {
      x: calcGap({
        firstColGap: isSplit || hasRow5ExtraKey ? 2 : 3,
        splitCol: 1,
        isSplit,
        showAllKeys,
      }),
      width: () => (isSplit || hasRow5ExtraKey ? 3 : showAllKeys ? 6 : 4),
      isLayoutIndicator: ({ col }) => col === layoutIndicatorIndex,
    },
  });

  if (options.showAllKeys) {
    const extraKeysConfig: ExtraKeysConfig = {
      row1Append: [buildKey(["BS"])],
      row2Prepend: [buildKey(["Tab"])],
      row2Append: [buildKey(["Del"])],
      row3Prepend: [buildKey(["Esc"])],
      row4Prepend: [buildKey(["Shift"])],
      row4Append: [buildKey(["Enter"])],
      row5Prepend: [buildKey(["Ctrl"]), buildKey(["Monke"]), buildKey(["Alt"])],
      row5Append: [buildKey(["Alt"]), buildKey(["Meta"]), buildKey(["Ctrl"])],
    };

    addExtraKeys(result, extraKeysConfig);
  }

  return result;
}

function convertSteno(options: ConvertOptions): KeyboardDefinition {
  const isSplit = options.keymapStyle === "steno_matrix";
  const showAllKeys = options.showAllKeys;

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

  const isLargeKey = (col: number): boolean => !isSplit && [0, 4].includes(col);

  const base = convertBase(layout, options, {
    row2: {
      height: ({ col }) => (isLargeKey(col) ? 2 : undefined),
      x: calcGap({ isSplit, showAllKeys }),
    },
    row3: {
      skip: ({ col }) => isLargeKey(col),
      x: calcGap({ isSplit, showAllKeys, colGaps: { 1: 1, 5: 1 } }),
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

function addExtraKeys(
  keyboard: KeyboardDefinition,
  config: ExtraKeysConfig | undefined,
): void {
  if (!config) return;

  if (config.row1Append) keyboard.row1.push(...config.row1Append);
  if (config.row2Prepend) keyboard.row2.unshift(...config.row2Prepend);
  if (config.row2Append) keyboard.row2.push(...config.row2Append);
  if (config.row3Prepend) keyboard.row3.unshift(...config.row3Prepend);
  if (config.row3Append) keyboard.row3.push(...config.row3Append);
  if (config.row4Prepend) keyboard.row4.unshift(...config.row4Prepend);
  if (config.row4Append) keyboard.row4.push(...config.row4Append);
  if (config.row5Prepend) keyboard.row5.unshift(...config.row5Prepend);
  if (config.row5Append) keyboard.row5.push(...config.row5Append);
}

function buildKey(
  legends: KeyLegends,
  options?: Pick<KeyDefinition, "width" | "height">,
): KeyDefinition {
  const row: KeyDefinition = { legends: buildLegends(legends) };
  if (options?.width !== undefined) row.width = options.width;
  if (options?.height !== undefined) row.height = options.height;
  return row;
}

function findLayoutIndicatorIndex(keys: KeyLegends[]): number {
  return keys.findIndex((it) => it.at(0) === " ");
}

type NonZeroColGaps = Record<Exclude<keyof Record<number, number>, 0>, number>;

function calcGap(params: {
  firstColGap?: number;
  splitCol?: number;
  isSplit: boolean;
  showAllKeys: boolean;
  colGaps?: NonZeroColGaps;
}) {
  return ({ col }: { col: number }) => {
    if (col === 0) return params.showAllKeys ? undefined : params.firstColGap;
    if (params.isSplit && col === (params.splitCol ?? 5)) return 1;
    if (params.isSplit) return undefined;
    return params.colGaps?.[col];
  };
}

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

  const calcGapForRow5 =
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
      x: calcGap({ col1Gap: 0, splitCol: 7, isSplit, showAllKeys }),
      skip: ({ col }) => (options.showAllKeys ? false : col === 0),
    },
    row2: {
      x: calcGap({ col1Gap: 0.5, isSplit, showAllKeys }),
      skip: ({ col }) => (options.showAllKeys ? false : col === 12),
      width: ({ col }) => (col === 12 ? 1.5 : undefined),
    },
    row3: {
      x: calcGap({ col1Gap: 1, isSplit, showAllKeys }),
      isHoming: ({ col }) => col === 3 || col === 6,
    },
    row4: {
      x: calcGap({ col1Gap: isIso ? 0.25 : 1.5, isSplit, showAllKeys }),
    },
    row5: {
      x: calcGapForRow5({
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

  if (options.showAllKeys) {
    const extraKeysConfig: ExtraKeysConfig = {
      row1Append: [buildExtraKey(["BS"], { width: 2 })],
      row2Prepend: [buildExtraKey(["Tab"], { width: 1.5 })],
      row3Prepend: [buildExtraKey(["Caps"], { width: 1.75 })],
      row4Prepend: [buildExtraKey(["Shift"], { width: isIso ? 1.25 : 2.25 })],
      row5Prepend: [
        buildExtraKey(["Ctrl"], { width: 1.25 }),
        buildExtraKey(["Monke"], { width: 1.25 }),
        buildExtraKey(["Alt"], { width: 1.25 }),
      ],
      row5Append: [
        buildExtraKey(["Alt"], { width: 1.25 }),
        buildExtraKey(["Monke"], { width: 1.25 }),
        buildExtraKey(["Meta"], { width: 1.25 }),
        buildExtraKey(["Ctrl"], { width: 1.25 }),
      ],
    };

    // Enter position depends on iso vs non-iso layout
    if (isIso) {
      extraKeysConfig.row2Append = [
        buildExtraKey(["Enter"], { width: 1.5, height: 2 }),
      ];
    } else {
      extraKeysConfig.row3Append = [buildExtraKey(["Enter"], { width: 2.25 })];
    }

    // Right-side Shift (row4)
    extraKeysConfig.row4Append = [buildExtraKey(["Shift"], { width: 2.75 })];

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

  const layoutIndicatorIndex = layout.keys.row5.findIndex(
    (it) => it.at(0) === " ",
  );

  const result = convertBase(layout, options, {
    row1: {
      skip: ({ col }) => (!options.showAllKeys && col === 0) || col > 10,
      x: calcGap({ splitCol: 6, isSplit, showAllKeys }),
    },
    row2: {
      skip: ({ col }) => col > 9,
      x: calcGap({ isSplit, showAllKeys }),
    },
    row3: {
      skip: ({ col }) => col > (options.showAllKeys ? 10 : 9),
      x: calcGap({ isSplit, showAllKeys }),
      isHoming: ({ col }) => col === 3 || col === 6,
    },
    row4: {
      skip: ({ col }) => col > 9,
      x: calcGap({ isSplit, showAllKeys }),
    },
    row5: {
      x: calcGap({
        col1Gap: isSplit || hasRow5ExtraKey ? 2 : 3,
        splitCol: 1,
        isSplit,
        showAllKeys,
      }),
      width: () =>
        isSplit || hasRow5ExtraKey ? 3 : options.showAllKeys ? 6 : 4,
      isLayoutIndicator: ({ col }) => col === layoutIndicatorIndex,
    },
  });

  if (options.showAllKeys) {
    const extraKeysConfig: ExtraKeysConfig = {
      row1Append: [buildExtraKey(["BS"])],
      row2Prepend: [buildExtraKey(["Tab"])],
      row2Append: [buildExtraKey(["Del"])],
      row3Prepend: [buildExtraKey(["Esc"])],
      row4Prepend: [buildExtraKey(["Shift"])],
      row4Append: [buildExtraKey(["Enter"])],
      row5Prepend: [
        buildExtraKey(["Ctrl"]),
        buildExtraKey(["Monke"]),
        buildExtraKey(["Alt"]),
      ],
      row5Append: [
        buildExtraKey(["Alt"]),
        buildExtraKey(["Meta"]),
        buildExtraKey(["Ctrl"]),
      ],
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

  const calcGapForRow3 =
    (colGap: Record<number, number>) =>
    ({ col }: { col: number }) => {
      const gap = colGap[col];
      if (!isSplit && gap !== undefined) return gap;
      return isSplit && col === 5 ? 1 : undefined;
    };

  const isLargeKey = (col: number): boolean => !isSplit && [0, 4].includes(col);

  const base = convertBase(layout, options, {
    row2: {
      height: ({ col }) => (isLargeKey(col) ? 2 : undefined),
      x: calcGap({ isSplit, showAllKeys }),
    },
    row3: {
      skip: ({ col }) => isLargeKey(col),
      x: calcGapForRow3({ 1: 1, 5: 1 }),
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

function buildExtraKey(
  legends: KeyLegends,
  options?: Pick<KeyDefinition, "width" | "height">,
): KeyDefinition {
  const row: KeyDefinition = { legends: buildLegends(legends) };
  if (options?.width !== undefined) row.width = options.width;
  if (options?.height !== undefined) row.height = options.height;
  return row;
}

function calcGap(params: {
  col1Gap?: number;
  splitCol?: number;
  isSplit: boolean;
  showAllKeys: boolean;
}) {
  return ({ col }: { col: number }) => {
    if (col === 0) return params.showAllKeys ? undefined : params.col1Gap;
    if (params.isSplit && col === (params.splitCol ?? 5)) return 1;
    return undefined;
  };
}

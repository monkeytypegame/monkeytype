import { KeymapStyle } from "@monkeytype/schemas/configs";
import { KeyLegends, LayoutObject } from "@monkeytype/schemas/layouts";

import {
  KeyboardDefinition,
  KeyDefinition,
  KeymapLayout,
  keymapLayouts,
} from "./keymapLayouts";

type ConvertOptions = {
  keymapStyle: KeymapStyle;
  showAllKeys: boolean;
};

export function convertLayoutToKeymap(
  rawLayout: LayoutObject,
  options: ConvertOptions,
): KeyboardDefinition {
  const layout = structuredClone(rawLayout);

  const keymapLayout = keymapLayouts[options.keymapStyle]?.[rawLayout.type];

  if (keymapLayout === undefined) {
    throw new Error(
      `not supported style ${options.keymapStyle} and layout type ${rawLayout.type}`,
    );
  }

  return convert({
    legends: layout.keys,
    keymap: keymapLayout,
    convertOptions: options,
  });
}

function convert(options: {
  legends: LayoutObject["keys"];
  keymap: KeymapLayout;
  convertOptions: ConvertOptions;
}): KeyboardDefinition {
  const isShowAllKeys = options.convertOptions.showAllKeys ?? false;

  return options.keymap.map((keys) =>
    keys
      .map((keyDef) => {
        const layoutLegend =
          keyDef.layoutPosition?.row &&
          options.legends[keyDef.layoutPosition.row]?.[
            keyDef.layoutPosition.col
          ];

        const legends = keyDef.isLayoutIndicator
          ? buildLegends([" "])
          : buildLegends(
              keyDef.legend !== undefined ? [keyDef.legend] : layoutLegend,
            );

        if (keyDef.isExtraKey && !isShowAllKeys) {
          return undefined;
        }

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
          ...(final.rotation !== undefined ? { rotation: final.rotation } : {}),
          ...(final.isLayoutIndicator === true
            ? { isLayoutIndicator: true }
            : {}),
          ...(final.isHoming === true ? { isHoming: true } : {}),
        } satisfies KeyDefinition;
      })
      //filter skipped keys
      .filter((it) => it !== undefined),
  );
}

function buildLegends(legends: KeyLegends | undefined): KeyLegends {
  if (legends === undefined) return ["", "", "", ""];
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

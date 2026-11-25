import { getConfig } from "../../../config/store";
import { getKeymapLayout, keymapLayoutObject } from "../../../states/test";
import type { KeymapLook } from "../../common/keymap/Keymap";

/**
 * The keymap look the config describes: its layout, style, legends, keys and
 * size. Undefined while the layout loads.
 */
export function getKeymapLookFromConfig(): KeymapLook | undefined {
  const layout = keymapLayoutObject();
  if (layout === undefined) return undefined;
  return {
    layout,
    layoutName: getKeymapLayout().layoutNameDisplayString,
    style: getConfig.keymapStyle,
    legendStyle: getConfig.keymapLegendStyle,
    shownKeys: getConfig.keymapKeys,
    scale: getConfig.keymapSize,
  };
}

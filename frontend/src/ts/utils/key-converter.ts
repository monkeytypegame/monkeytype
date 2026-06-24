import { LayoutObject } from "@monkeytype/schemas/layouts";
import {
  Keycode,
  leftSideKeys,
  qwertyKeycodeKeymap,
  rightSideKeys,
} from "../constants/keys";

/**
 * Converts a key to a keycode based on a layout
 * @param key Key to convert (e.g., "a")
 * @param layout Layout object from our JSON data (e.g., `layouts["qwerty"]`)
 * @returns Keycode location of the key (e.g., "KeyA")
 */
export function layoutKeyToKeycode(
  key: string,
  layout: LayoutObject,
): Keycode | undefined {
  const rows: string[][][] = Object.values(layout.keys);

  const rowIndex = rows.findIndex((row) => row.find((k) => k.includes(key)));
  const row = rows[rowIndex];
  if (row === undefined) {
    return;
  }

  const keyIndex = row.findIndex((k) => k.includes(key));
  if (keyIndex === -1) {
    return;
  }

  let keycode = qwertyKeycodeKeymap[rowIndex]?.[keyIndex];
  if (layout.type === "iso") {
    if (rowIndex === 2 && keyIndex === 11) {
      keycode = "Backslash";
    } else if (rowIndex === 3 && keyIndex === 0) {
      keycode = "IntlBackslash";
    } else if (rowIndex === 3) {
      keycode = qwertyKeycodeKeymap[3]?.[keyIndex - 1];
    }
  }

  return keycode;
}

/**
 * Converts a keycode to a keyboard side. Can return true for both sides if the key is in the location KeyY, KeyB or Space.
 * @param keycode Keycode to convert (e.g., "KeyA")
 * @returns Object with leftSide and rightSide booleans
 */
export function keycodeToKeyboardSide(keycode: Keycode): {
  leftSide: boolean;
  rightSide: boolean;
} {
  const left = leftSideKeys.has(keycode);
  const right = rightSideKeys.has(keycode);

  return { leftSide: left, rightSide: right };
}

/**
 * Returns a copy of the given layout with the rows mirrored
 * @param layout Layout object from our JSON data (e.g., `layouts["qwerty"]`)
 * @returns layout Layout object from our JSON data (e.g., `layouts["qwerty"]`)
 */
export function mirrorLayoutKeys(layout: LayoutObject): LayoutObject {
  const reverse_index = [11, 10, 10, 10, 10];
  const mirror_keys: LayoutObject["keys"] = {
    row1: [
      ...[...layout.keys.row1.slice(0, reverse_index[0])].reverse(),
      ...layout.keys.row1.slice(reverse_index[0]),
    ],
    row2: [
      ...[...layout.keys.row2.slice(0, reverse_index[1])].reverse(),
      ...layout.keys.row2.slice(reverse_index[1]),
    ],
    row3: [
      ...[...layout.keys.row3.slice(0, reverse_index[2])].reverse(),
      ...layout.keys.row3.slice(reverse_index[2]),
    ],
    row4: [
      ...[...layout.keys.row4.slice(0, reverse_index[3])].reverse(),
      ...layout.keys.row4.slice(reverse_index[3]),
    ],
    row5: [
      ...[...layout.keys.row5.slice(0, reverse_index[4])].reverse(),
      ...layout.keys.row5.slice(reverse_index[4]),
    ],
  };
  const layoutCopy = { ...layout, keys: mirror_keys };
  return layoutCopy;
}

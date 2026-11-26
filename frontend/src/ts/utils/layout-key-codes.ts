import type { LayoutObject } from "@monkeytype/schemas/layouts";

import type { Keycode } from "../constants/keys";

type LayoutRow = keyof LayoutObject["keys"];

const NUMBER_ROW: Keycode[] = [
  "Backquote",
  "Digit1",
  "Digit2",
  "Digit3",
  "Digit4",
  "Digit5",
  "Digit6",
  "Digit7",
  "Digit8",
  "Digit9",
  "Digit0",
  "Minus",
  "Equal",
];
const TOP_LETTERS: Keycode[] = [
  "KeyQ",
  "KeyW",
  "KeyE",
  "KeyR",
  "KeyT",
  "KeyY",
  "KeyU",
  "KeyI",
  "KeyO",
  "KeyP",
  "BracketLeft",
  "BracketRight",
];
const HOME_LETTERS: Keycode[] = [
  "KeyA",
  "KeyS",
  "KeyD",
  "KeyF",
  "KeyG",
  "KeyH",
  "KeyJ",
  "KeyK",
  "KeyL",
  "Semicolon",
  "Quote",
];
const BOTTOM_LETTERS: Keycode[] = [
  "KeyZ",
  "KeyX",
  "KeyC",
  "KeyV",
  "KeyB",
  "KeyN",
  "KeyM",
  "Comma",
  "Period",
  "Slash",
];

/**
 * The physical key (KeyboardEvent.code) at each position of a layout's
 * `keys` rows: `layout.keys.row2[4]` is typed with `KeyT`.
 */
export const LAYOUT_KEY_CODES: Record<
  LayoutObject["type"],
  Record<LayoutRow, Keycode[]>
> = {
  ansi: {
    row1: NUMBER_ROW,
    row2: [...TOP_LETTERS, "Backslash"],
    row3: HOME_LETTERS,
    row4: BOTTOM_LETTERS,
    row5: ["Space"],
  },
  iso: {
    row1: NUMBER_ROW,
    row2: TOP_LETTERS,
    row3: [...HOME_LETTERS, "Backslash"],
    row4: ["IntlBackslash", ...BOTTOM_LETTERS],
    row5: ["Space"],
  },
};

/** The layout's key codes in row order, row1 to row5. */
export function getLayoutKeyCodesInOrder(
  type: LayoutObject["type"],
): Keycode[] {
  const rows = LAYOUT_KEY_CODES[type];
  return [...rows.row1, ...rows.row2, ...rows.row3, ...rows.row4, ...rows.row5];
}

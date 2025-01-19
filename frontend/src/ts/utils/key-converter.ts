import * as JSONData from "../utils/json-data";

export type Keycode =
  | "Backquote"
  | "Digit1"
  | "Digit2"
  | "Digit3"
  | "Digit4"
  | "Digit5"
  | "Digit6"
  | "Digit7"
  | "Digit8"
  | "Digit9"
  | "Digit0"
  | "Minus"
  | "Equal"
  | "KeyQ"
  | "KeyW"
  | "KeyE"
  | "KeyR"
  | "KeyT"
  | "KeyY"
  | "KeyU"
  | "KeyI"
  | "KeyO"
  | "KeyP"
  | "BracketLeft"
  | "BracketRight"
  | "Backslash"
  | "KeyA"
  | "KeyS"
  | "KeyD"
  | "KeyF"
  | "KeyG"
  | "KeyH"
  | "KeyJ"
  | "KeyK"
  | "KeyL"
  | "Semicolon"
  | "Quote"
  | "KeyZ"
  | "KeyX"
  | "KeyC"
  | "KeyV"
  | "KeyB"
  | "KeyN"
  | "KeyM"
  | "Comma"
  | "Period"
  | "Slash"
  | "Space"
  | "ShiftLeft"
  | "IntlBackslash"
  | "ShiftRight"
  | "ArrowUp"
  | "ArrowLeft"
  | "ArrowDown"
  | "ArrowRight"
  | "NumpadMultiply"
  | "NumpadSubtract"
  | "NumpadAdd"
  | "NumpadDecimal"
  | "NumpadEqual"
  | "NumpadDivide"
  | "Numpad0"
  | "Numpad1"
  | "Numpad2"
  | "Numpad3"
  | "Numpad4"
  | "Numpad5"
  | "Numpad6"
  | "Numpad7"
  | "Numpad8"
  | "Numpad9"
  | "NumpadEnter"
  | "Enter"
  | "Backspace";

const qwertyKeycodeKeymap: Keycode[][] = [
  [
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
  ],
  [
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
    "Backslash",
  ],
  [
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
  ],
  [
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
  ],
  ["Space"],
];

const leftSideKeys: Keycode[] = [
  "Backquote",
  "Digit1",
  "Digit2",
  "Digit3",
  "Digit4",
  "Digit5",
  "Digit6",

  "KeyQ",
  "KeyW",
  "KeyE",
  "KeyR",
  "KeyT",
  "KeyY",

  "KeyA",
  "KeyS",
  "KeyD",
  "KeyF",
  "KeyG",

  "ShiftLeft",
  "IntlBackslash",
  "KeyZ",
  "KeyX",
  "KeyC",
  "KeyV",
  "KeyB",

  "Space",
];

const rightSideKeys: Keycode[] = [
  "Digit6",
  "Digit7",
  "Digit8",
  "Digit9",
  "Digit0",
  "Minus",
  "Equal",
  "Backspace",

  "KeyY",
  "KeyU",
  "KeyI",
  "KeyO",
  "KeyP",
  "BracketLeft",
  "BracketRight",
  "Backslash",

  "KeyH",
  "KeyJ",
  "KeyK",
  "KeyL",
  "Semicolon",
  "Quote",
  "Enter",

  "KeyB",
  "KeyN",
  "KeyM",
  "Comma",
  "Period",
  "Slash",
  "ShiftRight",

  "ArrowUp",
  "ArrowLeft",
  "ArrowDown",
  "ArrowRight",

  "NumpadMultiply",
  "NumpadSubtract",
  "NumpadAdd",
  "NumpadDecimal",
  "NumpadEqual",
  "NumpadDivide",
  "Numpad0",
  "Numpad1",
  "Numpad2",
  "Numpad3",
  "Numpad4",
  "Numpad5",
  "Numpad6",
  "Numpad7",
  "Numpad8",
  "Numpad9",
  "NumpadEnter",

  "Space",
];

/**
 * Converts a key to a keycode based on a layout
 * @param key Key to convert (e.g., "a")
 * @param layout Layout object from our JSON data (e.g., `layouts["qwerty"]`)
 * @returns Keycode location of the key (e.g., "KeyA")
 */
export function layoutKeyToKeycode(
  key: string,
  layout: JSONData.Layout
): Keycode | undefined {
  const rows: string[][] = Object.values(layout.keys);

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
  const left = leftSideKeys.includes(keycode);
  const right = rightSideKeys.includes(keycode);

  return { leftSide: left, rightSide: right };
}

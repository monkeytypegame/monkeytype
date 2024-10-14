import * as JSONData from "../utils/json-data";

const qwertyKeycodeKeymap = [
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

const leftSideKeys = [
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

const rightSideKeys = [
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

export function layoutKeyToKeycode(
  key: string,
  layout: JSONData.Layout
): string | undefined {
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

export function keycodeToKeyboardSide(keycode: string): {
  leftSide: boolean;
  rightSide: boolean;
} {
  const left = leftSideKeys.includes(keycode);
  const right = rightSideKeys.includes(keycode);

  return { leftSide: left, rightSide: right };
}

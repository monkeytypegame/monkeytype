import Config from "../config";
import * as JSONData from "../utils/json-data";
import { capsState } from "./caps-warning";
import * as Notifications from "../elements/notifications";

export let leftState = false;
export let rightState = false;

type KeymapLegendStates = [letters: boolean, symbols: boolean];

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

const symbolsPattern = /^[^\p{L}\p{N}]{1}$/u;

const isMacLike = /Mac|iPod|iPhone|iPad/.test(navigator.platform);

let keymapLegendStates: KeymapLegendStates = [false, false];
function getLegendStates(): KeymapLegendStates | undefined {
  const symbolsState = leftState || rightState;
  // MacOS has different CapsLock and Shift logic than other operating systems
  // Windows and Linux only capitalize letters if either Shift OR CapsLock are
  // pressed, but not both at once.
  // MacOS instead capitalizes when either or both are pressed,
  // so we have to check for that.
  const lettersState = isMacLike
    ? symbolsState || capsState
    : symbolsState !== capsState;

  const [previousLettersState, previousSymbolsState] = keymapLegendStates;

  if (
    previousLettersState === lettersState &&
    previousSymbolsState === symbolsState
  ) {
    return;
  }

  return (keymapLegendStates = [lettersState, symbolsState]);
}

async function updateKeymapLegendCasing(): Promise<void> {
  const states = getLegendStates();
  if (states === undefined) return;

  const keymapKeys = [...document.getElementsByClassName("keymapKey")].filter(
    (el) => {
      const isKeymapKey = el.classList.contains("keymapKey");
      const isNotSpace =
        !el.classList.contains("keySpace") &&
        !el.classList.contains("keySplitSpace");

      return isKeymapKey && isNotSpace;
    }
  ) as HTMLElement[];

  const layoutKeys = keymapKeys.map((el) => el.dataset["key"]);
  if (layoutKeys.includes(undefined)) return;

  const keys = keymapKeys.map((el) => el.childNodes[1]);

  const [lettersState, symbolsState] = states;

  const layoutName =
    Config.keymapLayout === "overrideSync"
      ? Config.layout === "default"
        ? "qwerty"
        : Config.layout
      : Config.keymapLayout;

  const layout = await JSONData.getLayout(layoutName).catch(() => undefined);
  if (layout === undefined) {
    Notifications.add("Failed to load keymap layout", -1);

    return;
  }

  for (let i = 0; i < layoutKeys.length; i++) {
    const layoutKey = layoutKeys[i] as string;
    const key = keys[i];
    const lowerCaseCharacter = layoutKey[0];
    const upperCaseCharacter = layoutKey[1];

    if (
      key === undefined ||
      layoutKey === undefined ||
      lowerCaseCharacter === undefined ||
      upperCaseCharacter === undefined
    )
      continue;

    const keyIsSymbol = [lowerCaseCharacter, upperCaseCharacter].some(
      (character) => symbolsPattern.test(character ?? "")
    );

    const keycode = layoutKeyToKeycode(lowerCaseCharacter, layout);
    if (keycode === undefined) {
      return;
    }

    const oppositeShift = isUsingOppositeShift(keycode);

    const state = keyIsSymbol ? symbolsState : lettersState;
    const capitalize = oppositeShift && state;
    const keyIndex = Number(capitalize);
    const character = layoutKey[keyIndex];

    key.textContent = character ?? "";
  }
}

$(document).on("keydown", (e) => {
  if (e.code === "ShiftLeft") {
    leftState = true;
    rightState = false;
  } else if (e.code === "ShiftRight") {
    leftState = false;
    rightState = true;
  }

  if (Config.keymapLegendStyle === "dynamic") {
    void updateKeymapLegendCasing();
  }
});

$(document).on("keyup", (e) => {
  if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
    leftState = false;
    rightState = false;
  }

  if (Config.keymapLegendStyle === "dynamic") {
    void updateKeymapLegendCasing();
  }
});

export function reset(): void {
  leftState = false;
  rightState = false;
}

const leftSideKeys = [
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

  "IntlBackslash",
  "KeyZ",
  "KeyX",
  "KeyC",
  "KeyV",
  "KeyB",

  "Backquote",
  "Digit1",
  "Digit2",
  "Digit3",
  "Digit4",
  "Digit5",
  "Digit6",
];

const rightSideKeys = [
  "KeyY",
  "KeyU",
  "KeyI",
  "KeyO",
  "KeyP",

  "KeyH",
  "KeyJ",
  "KeyK",
  "KeyL",

  "KeyB",
  "KeyN",
  "KeyM",

  "Digit6",
  "Digit7",
  "Digit8",
  "Digit9",
  "Digit0",
  "Minus",
  "Equal",

  "Backslash",
  "BracketLeft",
  "BracketRight",
  "Semicolon",
  "Quote",
  "Comma",
  "Period",
  "Slash",
];

export function isUsingOppositeShift(keycode: string): boolean {
  if (!leftState && !rightState) {
    return true;
  }

  if (Config.oppositeShiftMode === "off") {
    return true;
  }

  const isRight = rightSideKeys.includes(keycode);
  const isLeft = leftSideKeys.includes(keycode);
  if (!isRight && !isLeft) {
    return true;
  }

  if ((leftState && isRight) || (rightState && isLeft)) {
    return true;
  }

  return false;
}

export function layoutKeyToKeycode(
  key: string,
  layout: MonkeyTypes.Layout
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

import Config from "../config";
import * as JSONData from "../utils/json-data";
import { capsState } from "./caps-warning";
import * as Notifications from "../elements/notifications";
import * as KeyConverter from "../utils/key-converter";

export let leftState = false;
export let rightState = false;

type KeymapLegendStates = [letters: boolean, symbols: boolean];

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
      const isNotSpace = !el.classList.contains("keySpace");

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

    const keycode = KeyConverter.layoutKeyToKeycode(lowerCaseCharacter, layout);
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

export function isUsingOppositeShift(keycode: KeyConverter.Keycode): boolean {
  if (!leftState && !rightState) {
    return true;
  }

  if (Config.oppositeShiftMode === "off") {
    return true;
  }

  const { leftSide, rightSide } = KeyConverter.keycodeToKeyboardSide(keycode);
  if (!leftSide && !rightSide) {
    return true;
  }

  if ((leftState && rightSide) || (rightState && leftSide)) {
    return true;
  }

  return false;
}

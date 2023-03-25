import Config from "../config";
import * as Misc from "../utils/misc";
import * as Notifications from "../elements/notifications";
import { capsState } from "./caps-warning";

export let leftState = false;
export let rightState = false;

type KeymapLegendStates = [letters: boolean, symbols: boolean];

interface KeymapStrings {
  left: string[] | null;
  right: string[] | null;
  keymap: string | null;
}

const keymapStrings: KeymapStrings = {
  left: null,
  right: null,
  keymap: null,
};

const symbolsPattern = /^[^\p{L}\p{N}]{1}$/u;

const isMacLike = /Mac|iPod|iPhone|iPad/.test(navigator.platform);

let keymapLegendStates: KeymapLegendStates = [false, false];
function getLegendStates(): KeymapLegendStates | undefined {
  const symbolsState = leftState || rightState;
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

export function updateKeymapLegendCasing(): void {
  const states = getLegendStates();
  if (states === undefined) return;

  const keymapKeys = <HTMLElement[]>(
    [...document.getElementsByClassName("keymapKey")].filter(
      (el) => el.className === "keymapKey"
    )
  );

  const layoutKeys = keymapKeys.map((el) => el.dataset["key"]);
  if (layoutKeys.includes(undefined)) return;

  const keys = keymapKeys.map((el) => el.childNodes[1]);

  const [lettersState, symbolsState] = states;

  for (let i = 0; i < layoutKeys.length; i++) {
    const layoutKey = layoutKeys[i];
    const key = keys[i];

    if (key === undefined || layoutKey === undefined) continue;

    const lowerCaseCharacter = layoutKey[0];
    const upperCaseCharacter = layoutKey[1];

    const keyIsSymbol = [lowerCaseCharacter, upperCaseCharacter].some(
      (character) => symbolsPattern.test(character)
    );

    const state = keyIsSymbol ? symbolsState : lettersState;
    const keyIndex = Number(state);
    const character = layoutKey[keyIndex];

    key.textContent = character;
  }
}

async function buildKeymapStrings(): Promise<void> {
  if (keymapStrings.keymap === Config.keymapLayout) return;

  const layoutName =
    Config.keymapLayout === "overrideSync"
      ? Config.layout
      : Config.keymapLayout;

  let layout;
  try {
    layout = await Misc.getLayout(layoutName);
  } catch (e) {
    Notifications.add(
      Misc.createErrorMessage(e, "Failed to track shift state"),
      -1
    );
    return;
  }

  const layoutKeys = layout.keys;
  const layoutKeysEntries = Object.entries(layoutKeys) as [string, string[]][];

  keymapStrings.keymap = Config.keymapLayout;

  if (!layout) {
    keymapStrings.left = null;
    keymapStrings.right = null;
  } else {
    keymapStrings.left = layoutKeysEntries
      .map(([rowName, row]) =>
        row
          // includes "6" and "y" (buttons on qwerty) into the left hand
          .slice(
            0,
            ["row1", "row2"].includes(rowName)
              ? rowName === "row1"
                ? 7
                : 6
              : 5
          )
          .map((key) => key.split(""))
      )
      .flat(2);

    keymapStrings.right = layoutKeysEntries
      .map(([rowName, row]) =>
        row
          // includes "b" (buttons on qwerty) into the right hand
          .slice(
            ["row1", "row4"].includes(rowName)
              ? rowName === "row1"
                ? 6
                : 4
              : 5
          )
          .map((key) => key.split(""))
      )
      .flat(2);
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
    updateKeymapLegendCasing();
  }
});

$(document).on("keyup", (e) => {
  if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
    leftState = false;
    rightState = false;
  }

  if (Config.keymapLegendStyle === "dynamic") {
    updateKeymapLegendCasing();
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

  "KeyA",
  "KeyS",
  "KeyD",
  "KeyF",
  "KeyG",

  "KeyZ",
  "KeyX",
  "KeyC",
  "KeyV",

  "Backquote",
  "Digit1",
  "Digit2",
  "Digit3",
  "Digit4",
  "Digit5",
];

const rightSideKeys = [
  "KeyU",
  "KeyI",
  "KeyO",
  "KeyP",

  "KeyH",
  "KeyJ",
  "KeyK",
  "KeyL",

  "KeyN",
  "KeyM",

  "Digit7",
  "Digit8",
  "Digit9",
  "Digit0",

  "Backslash",
  "BracketLeft",
  "BracketRight",
  "Semicolon",
  "Quote",
  "Comma",
  "Period",
  "Slash",
];

export async function isUsingOppositeShift(
  event: JQuery.KeyDownEvent
): Promise<boolean | null> {
  if (!leftState && !rightState) return null;

  if (
    Config.oppositeShiftMode === "on" ||
    (Config.oppositeShiftMode === "keymap" &&
      Config.keymapLayout === "overrideSync" &&
      Config.layout === "default")
  ) {
    if (
      !rightSideKeys.includes(event.code) &&
      !leftSideKeys.includes(event.code)
    ) {
      return null;
    }

    if (
      (leftState && rightSideKeys.includes(event.code)) ||
      (rightState && leftSideKeys.includes(event.code))
    ) {
      return true;
    } else {
      return false;
    }
  } else if (Config.oppositeShiftMode === "keymap") {
    await buildKeymapStrings();

    if (!keymapStrings.left || !keymapStrings.right) return null;

    if (
      (leftState && keymapStrings.right.includes(event.key)) ||
      (rightState && keymapStrings.left.includes(event.key))
    ) {
      return true;
    } else {
      return false;
    }
  }

  return true;
}

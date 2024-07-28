import Config from "../config";
import * as Misc from "../utils/misc";
import * as JSONData from "../utils/json-data";
import { capsState } from "./caps-warning";
import * as Notifications from "../elements/notifications";

let isAltGrPressed = false;
const isPunctuationPattern = /\p{P}/u;

export async function getCharFromEvent(
  event: JQuery.KeyDownEvent
): Promise<string | null> {
  function emulatedLayoutGetVariant(
    event: JQuery.KeyDownEvent,
    keyVariants: string
  ): string | undefined {
    let isCapitalized = event.shiftKey;
    const altGrIndex = isAltGrPressed && keyVariants.length > 2 ? 2 : 0;
    const isNotPunctuation = !isPunctuationPattern.test(
      keyVariants.slice(altGrIndex, altGrIndex + 2)
    );
    if (capsState && isNotPunctuation) {
      isCapitalized = !event.shiftKey;
    }

    const altVersion = keyVariants[(isCapitalized ? 1 : 0) + altGrIndex] ?? "";
    const nonAltVersion = keyVariants[isCapitalized ? 1 : 0] ?? "";
    const defaultVersion = keyVariants[0];

    return altVersion || nonAltVersion || defaultVersion;
  }
  let layout;

  try {
    layout = await JSONData.getLayout(Config.layout);
  } catch (e) {
    Notifications.add(
      Misc.createErrorMessage(e, "Failed to emulate event"),
      -1
    );
    return null;
  }

  let keyEventCodes: string[] = [];

  if (layout.type === "ansi") {
    keyEventCodes = [
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
      "Space",
    ];
  } else if (layout.type === "iso") {
    keyEventCodes = [
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
      "Backslash",
      "IntlBackslash",
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
      "Space",
    ];
  } else if (layout.type === "matrix") {
    keyEventCodes = [
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
      "Space",
    ];
  }

  if (!keyEventCodes.includes(event.code)) {
    return null;
  }

  const layoutKeys = layout.keys;

  const layoutMap = layoutKeys.row1
    .concat(layoutKeys.row2)
    .concat(layoutKeys.row3)
    .concat(layoutKeys.row4)
    .concat(layoutKeys.row5);

  const mapIndex = keyEventCodes.indexOf(event.code);
  if (mapIndex === -1) {
    if (event.code.includes("Numpad")) {
      return event.key;
    } else {
      return null;
    }
  }
  const charVariant = emulatedLayoutGetVariant(
    event,
    layoutMap[mapIndex] ?? ""
  );
  if (charVariant !== undefined) {
    return charVariant;
  } else {
    return null;
  }
}

export function updateAltGrState(event: JQuery.KeyboardEventBase): void {
  const shouldHandleLeftAlt =
    event.code === "AltLeft" && navigator.userAgent.includes("Mac");
  if (event.code !== "AltRight" && !shouldHandleLeftAlt) return;
  if (event.type === "keydown") isAltGrPressed = true;
  if (event.type === "keyup") isAltGrPressed = false;
}

export function getIsAltGrPressed(): boolean {
  return isAltGrPressed;
}

$(document).on("keydown", updateAltGrState);
$(document).on("keyup", updateAltGrState);

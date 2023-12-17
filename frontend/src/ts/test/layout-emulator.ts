import Config from "../config";
import * as Misc from "../utils/misc";
import { capsState } from "./caps-warning";
import * as Notifications from "../elements/notifications";

let isAltGrPressed = false;
const isPunctuationPattern = /\p{P}/u;

export async function getCharFromEvent(
  event: JQuery.KeyDownEvent
): Promise<string | null> {
  function emulatedLayoutGetVariantIndex(
    event: JQuery.KeyDownEvent,
    keyVariants: string
  ): number {
    let isCapitalized = event.shiftKey;
    const altGrIndex = isAltGrPressed && keyVariants.length > 2 ? 2 : 0;
    const isNotPunctuation = !isPunctuationPattern.test(
      keyVariants.slice(altGrIndex, altGrIndex + 2)
    );
    if (capsState && isNotPunctuation) {
      isCapitalized = !event.shiftKey;
    }
    return (isCapitalized ? 1 : 0) + altGrIndex;
  }
  let layout;

  try {
    layout = await Misc.getLayout(Config.layout);
  } catch (e) {
    Notifications.add(
      Misc.createErrorMessage(e, "Failed to emulate event"),
      -1
    );
    return event.key;
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

  const layoutKeys = layout.keys;

  const layoutMap = layoutKeys["row1"]
    .concat(layoutKeys["row2"])
    .concat(layoutKeys["row3"])
    .concat(layoutKeys["row4"])
    .concat(layoutKeys["row5"]);

  const mapIndex = keyEventCodes.indexOf(event.code);
  if (mapIndex === -1) {
    if (event.code.includes("Numpad")) {
      return event.key;
    } else {
      return null;
    }
  }
  const variant = emulatedLayoutGetVariantIndex(event, layoutMap[mapIndex]);
  const char = layoutMap[mapIndex][variant];
  if (char) {
    return char;
  } else {
    return event.key;
  }
}

function updateAltGrState(event: JQuery.KeyboardEventBase): void {
  const shouldHandleLeftAlt =
    event.code === "AltLeft" && navigator.userAgent.includes("Mac");
  if (event.code !== "AltRight" && !shouldHandleLeftAlt) return;
  if (event.type === "keydown") isAltGrPressed = true;
  if (event.type === "keyup") isAltGrPressed = false;
}

$(document).on("keydown", updateAltGrState);
$(document).on("keyup", updateAltGrState);

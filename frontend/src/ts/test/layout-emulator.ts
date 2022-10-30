import Config from "../config";
import * as Misc from "../utils/misc";
import { capsState } from "./caps-warning";
import * as Notifications from "../elements/notifications";

function emulatedLayoutShouldShiftKey(
  event: JQuery.KeyDownEvent,
  newKeyPreview: string
): boolean {
  if (capsState) return Misc.isASCIILetter(newKeyPreview) !== event.shiftKey;
  return event.shiftKey;
}

export async function getCharFromEvent(
  event: JQuery.KeyDownEvent
): Promise<string | null> {
  let layout;

  try {
    layout = await Misc.getLayout(Config.layout);
  } catch (error) {
    Notifications.add(
      Misc.createErrorMessage(error, "Failed to emulate event"),
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

  const layoutMap = [
    ...layoutKeys["row1"],
    ...layoutKeys["row2"],
    ...layoutKeys["row3"],
    ...layoutKeys["row4"],
    ...layoutKeys["row5"],
  ];

  let mapIndex = null;
  for (const [i, keyEventCode] of keyEventCodes.entries()) {
    if (event.code == keyEventCode) {
      mapIndex = i;
    }
  }
  if (!mapIndex) {
    return event.code.includes("Numpad") ? event.key : null;
  }
  const newKeyPreview = layoutMap[mapIndex][0];
  const shift = emulatedLayoutShouldShiftKey(event, newKeyPreview) ? 1 : 0;
  const char = layoutMap[mapIndex][shift];
  return char || event.key;
}

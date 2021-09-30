import Config from "./config";
import * as Misc from "./misc";
import Layouts from "./layouts";

export function getCharFromEvent(event) {
  function emulatedLayoutShouldShiftKey(event, newKeyPreview) {
    const isCapsLockHeld = event.originalEvent.getModifierState("CapsLock");
    if (isCapsLockHeld)
      return Misc.isASCIILetter(newKeyPreview) !== event.shiftKey;
    return event.shiftKey;
  }

  const keyEventCodes = [
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
  const layoutMap = Layouts[Config.layout].keys;

  let mapIndex = null;
  for (let i = 0; i < keyEventCodes.length; i++) {
    if (event.code == keyEventCodes[i]) {
      mapIndex = i;
    }
  }
  if (!mapIndex) return null;
  const newKeyPreview = layoutMap[mapIndex][0];
  const shift = emulatedLayoutShouldShiftKey(event, newKeyPreview) ? 1 : 0;
  const char = layoutMap[mapIndex][shift];
  if (char) {
    return char;
  } else {
    return event.key;
  }
}

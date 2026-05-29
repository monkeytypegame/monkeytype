import { Config } from "../../config/store";
import { Keycode } from "../../constants/keys";
import { InputEvent } from "./types";

export const keysToTrack = new Set<Keycode | "NoCode">([
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
  "Enter",
  "Tab",
  "NoCode", //android (smells) and some keyboards might send no location data - need to use this as a fallback
]);

export function getTestEventCode(event: KeyboardEvent): Keycode | "NoCode" {
  if (event.code === "NumpadEnter" && Config.funbox.includes("58008")) {
    return "Space";
  }

  if (event.code.includes("Arrow") && Config.funbox.includes("arrows")) {
    return "NoCode";
  }

  if (
    event.code === "" ||
    event.code === undefined ||
    event.key === "Unidentified"
  ) {
    return "NoCode";
  }

  return event.code as Keycode;
}

export function getSimulatedInput(events: InputEvent[]): string {
  let simulatedInput = "";

  for (const event of events) {
    if (event.data.inputType === "insertText") {
      if (event.data.inputStopped) continue;
      simulatedInput += event.data.data;
    }
    if (event.data.inputType === "insertCompositionText") {
      if (event.data.inputStopped) continue;
      simulatedInput += event.data.data;
    }
    if (event.data.inputType === "deleteContentBackward") {
      simulatedInput = simulatedInput.slice(0, -1);
    }
    if (event.data.inputType === "deleteWordBackward") {
      simulatedInput = "";
    }
  }

  return simulatedInput;
}

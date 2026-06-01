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

export function applyOp(input: string, event: InputEvent): string {
  if (event.data.inputType === "insertText") {
    if (event.data.inputStopped) return input;
    return input + event.data.data;
  }
  if (event.data.inputType === "insertCompositionText") {
    if (event.data.inputStopped) return input;
    return input + event.data.data;
  }
  if (event.data.inputType === "deleteContentBackward") {
    return input.slice(0, -1);
  }
  if (event.data.inputType === "deleteWordBackward") {
    return input.replace(/(?:\S+\s*|\s+)$/, "");
  }
  return input;
}

/**
 * Derives input by applying each event's operation in order. Ignores the
 * recorded inputValue field. Use for verification, tests, or fallback —
 * not as source of truth.
 */
export function getInputFromEvents(events: InputEvent[]): string {
  let input = "";
  for (const event of events) {
    input = applyOp(input, event);
  }
  return input;
}

/**
 * Reads input from the DOM snapshots captured on each event (inputValue),
 * falling back to op-based derivation for events without a snapshot.
 * Use this whenever you need the actual current/past input state.
 *
 * Walks backward to find the latest event with a captured inputValue, then
 * replays any subsequent events forward — O(1) when the last event has a
 * snapshot (the common case), O(n) worst case.
 */
export function getInputFromDom(events: InputEvent[]): string {
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i] as InputEvent;
    if (event.data.inputValue !== undefined) {
      let input = event.data.inputValue;
      for (let j = i + 1; j < events.length; j++) {
        input = applyOp(input, events[j] as InputEvent);
      }
      return input;
    }
  }
  return getInputFromEvents(events);
}

export type InputValueMismatch = {
  index: number;
  derived: string;
  recorded: string;
};

/**
 * Compares event-derived input against the recorded DOM snapshot at each
 * event. Returns the indices where event-derivation disagreed with what the
 * DOM captured. Useful for catching op-logic bugs or capture-timing bugs.
 */
export function findInputValueMismatches(
  events: InputEvent[],
): InputValueMismatch[] {
  const mismatches: InputValueMismatch[] = [];
  let derived = "";

  for (let i = 0; i < events.length; i++) {
    const event = events[i] as InputEvent;
    derived = applyOp(derived, event);

    if (
      event.data.inputValue !== undefined &&
      event.data.inputValue !== derived
    ) {
      mismatches.push({
        index: i,
        derived,
        recorded: event.data.inputValue,
      });
    }
  }

  return mismatches;
}

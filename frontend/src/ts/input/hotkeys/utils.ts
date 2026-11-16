import { getCompositionData } from "../../states/test";
import {
  CreateHotkeyOptions,
  Hotkey,
  HotkeyCallback,
  HotkeyCallbackContext,
  createHotkeys as registerHotkeys,
} from "@tanstack/solid-hotkeys";
import { isAnyPopupVisible } from "../../utils/misc";
import { isInputElementFocused } from "../input-element";

export const NoKey = "" as Hotkey;

export function createHotkey(
  hotkey: Hotkey | (() => Hotkey),
  callback: HotkeyCallback,
  options: () => Partial<
    Omit<
      CreateHotkeyOptions,
      "ignoreInputs" | "stopPropagation" | "preventDefault"
    >
  > = () => ({}),
): void {
  //NoKey matches keydowns without a key (e.g. browser autofill), so it is never registered
  registerHotkeys(() => {
    const key = typeof hotkey === "function" ? hotkey() : hotkey;
    if (key === NoKey) return [];
    return [
      {
        hotkey: key,
        callback: (e, context) => {
          if (handleHotkeyOnInteractiveElement(e, context)) return;
          e.stopPropagation();
          e.preventDefault();
          callback(e, context);
        },
        options: {
          ignoreInputs: false, //hotkeys are active on the words input, but not on other interactive elements
          stopPropagation: false, //we set stopPropagation in the callback if the hotkey executes
          preventDefault: false, //we set preventDefault in the callback if the hotkey executes
          requireReset: true,
          conflictBehavior: "replace",
          ...options(),
        },
      },
    ];
  });
}

function isInteractiveElementFocused(): boolean {
  if (isInputElementFocused()) return false;

  return (
    document.activeElement?.tagName === "A" ||
    document.activeElement?.tagName === "INPUT" ||
    document.activeElement?.tagName === "TEXTAREA" ||
    document.activeElement?.tagName === "SELECT" ||
    document.activeElement?.tagName === "BUTTON" ||
    document.activeElement?.classList.contains("button") === true ||
    document.activeElement?.classList.contains("textButton") === true ||
    document.activeElement?.classList.contains("modal") === true
  );
}

function handleHotkeyOnInteractiveElement(
  e: KeyboardEvent,
  { hotkey }: HotkeyCallbackContext,
): boolean {
  if (
    (hotkey === "Tab" || hotkey === "Enter") &&
    isInteractiveElementFocused()
  ) {
    return true;
  } else if (hotkey === "Escape" && isAnyPopupVisible()) {
    return true;
  } else if (
    hotkey === "Escape" &&
    isInputElementFocused() &&
    getCompositionData() !== ""
  ) {
    return true;
  }

  return false;
}

import {
  CreateHotkeyOptions,
  Hotkey,
  HotkeyCallback,
  HotkeyCallbackContext,
  createHotkey as registerHotkey,
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
  registerHotkey(
    hotkey,
    (e, context) => {
      if (handleHotkeyOnInteractiveElement(e, context)) return;
      e.stopPropagation();
      e.preventDefault();
      callback(e, context);
    },
    () => ({
      ignoreInputs: false, //hotkeys are active on the words input, but not on other interactive elements
      stopPropagation: false, //we set stopPropagation in the callback if the hotkey executes
      preventDefault: false, //we set preventDefault in the callback if the hotkey executes
      requireReset: true,
      conflictBehavior: "replace",
      enabled: (typeof hotkey === "function" ? hotkey() : hotkey) !== NoKey,
      ...options(),
    }),
  );
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
    document.activeElement?.classList.contains("textButton") === true
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
  }
  return false;
}

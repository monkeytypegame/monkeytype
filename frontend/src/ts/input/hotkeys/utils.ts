import { HotkeyCallbackContext } from "@tanstack/solid-hotkeys";
import { isInputElementFocused } from "../input-element";
import { isAnyPopupVisible } from "../../utils/misc";

function isInteractiveElementFocused(): boolean {
  if (isInputElementFocused()) return false;

  return (
    document.activeElement?.tagName === "INPUT" ||
    document.activeElement?.tagName === "TEXTAREA" ||
    document.activeElement?.tagName === "SELECT" ||
    document.activeElement?.tagName === "BUTTON" ||
    document.activeElement?.classList.contains("button") === true ||
    document.activeElement?.classList.contains("textButton") === true
  );
}

export function handleHotkeyOnInteractiveElement(
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

  e.stopPropagation();
  e.preventDefault();
  return false;
}

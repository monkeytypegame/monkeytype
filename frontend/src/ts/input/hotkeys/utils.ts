import { Hotkey } from "@tanstack/solid-hotkeys";
import { isInputElementFocused } from "../input-element";

export function isInteractiveElementFocused(): boolean {
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

export function shiftedHotkey(
  hotkey: Hotkey,
  options: { shiftTab: boolean; shiftEnter: boolean },
): Hotkey {
  if (hotkey === "Tab" && options.shiftTab) return "Shift+Tab";
  if (hotkey === "Enter" && options.shiftEnter) return "Shift+Enter";
  return hotkey;
}

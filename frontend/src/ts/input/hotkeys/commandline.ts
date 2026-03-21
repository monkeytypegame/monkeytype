import {
  createHotkey,
  HotkeyCallbackContext,
  HotkeyOptions,
} from "@tanstack/solid-hotkeys";
import { hotkeys } from "../../states/hotkeys";
import { showModal } from "../../states/modals";
import { handleHotkeyOnInteractiveElement } from "./utils";

const hotkeyOptions: HotkeyOptions = {
  stopPropagation: false,
  preventDefault: false,
  ignoreInputs: false,
  requireReset: true,
  conflictBehavior: "replace",
};

function openCommandline(
  e: KeyboardEvent,
  context: HotkeyCallbackContext,
): void {
  if (handleHotkeyOnInteractiveElement(e, context)) return;

  showModal("Commandline");
}

createHotkey(() => hotkeys.commandline, openCommandline, hotkeyOptions);
createHotkey("Mod+Shift+P", openCommandline, hotkeyOptions);

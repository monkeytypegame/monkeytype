import { createHotkey, HotkeyOptions } from "@tanstack/solid-hotkeys";
import { hotkeys } from "../../states/hotkeys";
import { showModal } from "../../states/modals";
import { isAnyPopupVisible } from "../../utils/misc";

const hotkeyOptions: HotkeyOptions = {
  ignoreInputs: false,
  requireReset: true,
};

function openCommandline(e: KeyboardEvent): void {
  const popupVisible = isAnyPopupVisible();
  if (!popupVisible) {
    showModal("Commandline");
  }
}

createHotkey(() => hotkeys.commandline, openCommandline, hotkeyOptions);
createHotkey("Mod+Shift+P", openCommandline, hotkeyOptions);

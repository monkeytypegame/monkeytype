import { createHotkey } from "@tanstack/solid-hotkeys";
import { isAnyPopupVisible } from "../../utils/misc";
import { getConfig } from "../../config/store";
import { showModal } from "../../states/modals";

function openCommandline(e: KeyboardEvent): void {
  const popupVisible = isAnyPopupVisible();
  if (!popupVisible) {
    showModal("Commandline");
  }
}

createHotkey("Escape", openCommandline, () => ({
  enabled: getConfig.quickRestart !== "esc",
  ignoreInputs: false,
  requireReset: true,
}));

createHotkey("Tab", openCommandline, () => ({
  enabled: getConfig.quickRestart === "esc",
  ignoreInputs: false,
  requireReset: true,
}));

createHotkey("Mod+Shift+P", openCommandline, {
  ignoreInputs: false,
  requireReset: true,
});

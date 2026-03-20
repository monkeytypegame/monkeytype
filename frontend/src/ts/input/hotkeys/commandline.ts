import { createHotkey } from "@tanstack/solid-hotkeys";

import * as CommandlinePopup from "../../commandline/commandline";

import { isAnyPopupVisible } from "../../utils/misc";

import { getConfig } from "../../config/store";

function openCommandline(e: KeyboardEvent): void {
  const popupVisible = isAnyPopupVisible();
  if (!popupVisible) {
    CommandlinePopup.show();
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

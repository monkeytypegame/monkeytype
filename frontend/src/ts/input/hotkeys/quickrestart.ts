import { createHotkey, HotkeyCallbackContext } from "@tanstack/solid-hotkeys";

import { isAnyPopupVisible } from "../../utils/misc";

import { navigate } from "../../controllers/route-controller";
import { restartTestEvent } from "../../events/test";
import { getActivePage } from "../../states/core";
import { hotkeys } from "../../states/hotkeys";
import { handleHotkeyOnInteractiveElement } from "./utils";

function quickRestart(e: KeyboardEvent, context: HotkeyCallbackContext): void {
  if (handleHotkeyOnInteractiveElement(e, context)) return;

  if (isAnyPopupVisible()) {
    return;
  }

  if (getActivePage() === "test") {
    restartTestEvent.dispatch({ isQuickRestart: !e.shiftKey });
  } else {
    void navigate("");
  }
}

createHotkey(() => hotkeys.quickRestart, quickRestart, {
  stopPropagation: false,
  preventDefault: false,
  ignoreInputs: false,
  requireReset: true,
  conflictBehavior: "replace",
});

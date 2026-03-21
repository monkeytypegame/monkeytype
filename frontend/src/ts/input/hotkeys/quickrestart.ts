import { createHotkey } from "@tanstack/solid-hotkeys";

import { isAnyPopupVisible } from "../../utils/misc";

import { navigate } from "../../controllers/route-controller";
import { restartTestEvent } from "../../events/test";
import { getActivePage } from "../../states/core";
import { hotkeys } from "../../states/hotkeys";
import { isInteractiveElementFocused } from "./utils";

function quickRestart(e: KeyboardEvent): void {
  if (isInteractiveElementFocused()) return;

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
  ignoreInputs: false,
  requireReset: true,
});

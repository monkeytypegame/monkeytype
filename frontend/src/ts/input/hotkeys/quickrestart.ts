import { isAnyPopupVisible } from "../../utils/misc";

import { navigate } from "../../controllers/route-controller";
import { restartTestEvent } from "../../events/test";
import { getActivePage } from "../../states/core";
import { hotkeys } from "../../states/hotkeys";
import { createHotkey } from "./utils";
import { isLongTest } from "../../states/test";
import { Hotkey } from "@tanstack/solid-hotkeys";

function quickRestart(e: KeyboardEvent): void {
  if (isAnyPopupVisible()) {
    return;
  }

  e.preventDefault();

  if (getActivePage() === "test") {
    restartTestEvent.dispatch({ isQuickRestart: !e.shiftKey });
  } else {
    void navigate("");
  }
}

createHotkey(
  () => hotkeys.quickRestart.split("+").at(-1) as Hotkey,
  quickRestart,
  () => ({ enabled: isLongTest() }),
);

createHotkey(() => hotkeys.quickRestart, quickRestart);

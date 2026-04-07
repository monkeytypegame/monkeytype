import { isAnyPopupVisible } from "../../utils/misc";

import { navigate } from "../../controllers/route-controller";
import { restartTestEvent } from "../../events/test";
import { getActivePage } from "../../states/core";
import { hotkeys } from "../../states/hotkeys";
import { createHotkey } from "./utils";
import { isLongTest } from "../../states/test";
import { createEffect } from "solid-js";
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

createEffect(() => {
  if (isLongTest()) {
    createHotkey(
      () =>
        (hotkeys.quickRestart.split("+")[1] ?? hotkeys.quickRestart) as Hotkey,
      quickRestart,
    );
  }
});

createHotkey(() => hotkeys.quickRestart, quickRestart);

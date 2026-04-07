import { isAnyPopupVisible } from "../../utils/misc";

import { navigate } from "../../controllers/route-controller";
import { restartTestEvent } from "../../events/test";
import { getActivePage } from "../../states/core";
import { hotkeys, quickRestartHotkeyMap } from "../../states/hotkeys";
import { createHotkey } from "./utils";
import { isLongTest } from "../../states/test";
import { getConfig } from "../../config/store";

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
  () => quickRestartHotkeyMap[getConfig.quickRestart],
  quickRestart,
  () => ({ enabled: isLongTest() }),
);

createHotkey(() => hotkeys.quickRestart, quickRestart);

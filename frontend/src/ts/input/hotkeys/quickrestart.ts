import { isAnyPopupVisible } from "../../utils/misc";

import { navigate } from "../../controllers/route-controller";
import { restartTestEvent } from "../../events/test";
import { getActivePage } from "../../states/core";
import { hotkeys, quickRestartHotkeyMap } from "../../states/hotkeys";
import { createHotkey } from "./utils";
import { getConfig } from "../../config/store";
import { isLongTest } from "../../states/test";

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

// We also want to have a hotkey without shift, so when test is considered long (which
// means that we can't quick restart), we show a notification when user presses quick
// restart key without shift, and restart when pressed with shift.
createHotkey(
  () => quickRestartHotkeyMap[getConfig.quickRestart],
  quickRestart,
  () => ({ enabled: isLongTest() }),
);

createHotkey(() => hotkeys.quickRestart, quickRestart);

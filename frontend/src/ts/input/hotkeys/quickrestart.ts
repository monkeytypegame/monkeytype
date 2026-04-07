import { isAnyPopupVisible } from "../../utils/misc";

import { navigate } from "../../controllers/route-controller";
import { restartTestEvent } from "../../events/test";
import { getActivePage } from "../../states/core";
import {
  hotkeys,
  quickRestartHotkeyMap,
  canQuickRestart,
} from "../../states/hotkeys";
import { createHotkey } from "./utils";
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
  () => ({ enabled: !canQuickRestart() }),
);

createHotkey(() => hotkeys.quickRestart, quickRestart);

import { isAnyPopupVisible } from "../../utils/misc";

import { navigate } from "../../controllers/route-controller";
import { restartTestEvent } from "../../events/test";
import { getActivePage } from "../../states/core";
import { hotkeys, quickRestartHotkeyMap } from "../../states/hotkeys";
import { createHotkeys } from "./utils";
import { getConfig } from "../../config/store";
import { isLongTest, wordsHaveNewline, wordsHaveTab } from "../../states/test";
import { untrack } from "solid-js";

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

// Notes about the following two hotkeys:
//
// - The order of the hotkeys in the array passed to `createHotkeys` is important. If
// the order was reversed, then the secondary hotkey will override the primary hotkey
// when the test isn't long, which would cause the quick restart hotkey to be disabled.
// - Both hotkeys only rerun when `hotkeys.quickRestart` changes. All other signals are
// accessed inside an `untrack` block.

createHotkeys(() => [
  // Secondary hotkey used in long tests.

  // We want to have a hotkey for quick restart key without shift, so when the
  // test is considered long (which means that we can't quick restart) and the user
  // tries to press the quick restart key without shift, we'll show a notification, and
  // when the user presses the quick restart key with shift, we'll restart.
  untrack(() => ({
    hotkey: quickRestartHotkeyMap[getConfig.quickRestart],
    callback: quickRestart,
    options: {
      enabled:
        isLongTest() &&
        !(wordsHaveTab() && getConfig.quickRestart === "tab") &&
        !(wordsHaveNewline() && getConfig.quickRestart === "enter"),
    },
  })),

  // Primary hotkey for quick restart.
  {
    hotkey: hotkeys.quickRestart,
    callback: quickRestart,
    options: {
      enabled: untrack(
        // Disable quick restart when we're in a long test and quick restart key is enter, because `shift + enter, shift +
        // enter` is already reserved for bail out keybind.
        () => !isLongTest() || getConfig.quickRestart !== "enter",
      ),
    },
  },
]);

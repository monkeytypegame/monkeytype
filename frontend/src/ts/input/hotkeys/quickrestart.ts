import { isAnyPopupVisible } from "../../utils/misc";

import { navigate } from "../../router/navigate";
import { restartTestEvent } from "../../events/test";
import { getRoutePage } from "../../states/router";
import { hotkeys, quickRestartHotkeyMap } from "../../states/hotkeys";
import { createHotkeys } from "./utils";
import { getConfig } from "../../config/store";
import { isLongTest, wordsHaveNewline, wordsHaveTab } from "../../states/test";

function quickRestart(e: KeyboardEvent): void {
  if (isAnyPopupVisible()) {
    return;
  }

  e.preventDefault();

  if (getRoutePage() === "test") {
    restartTestEvent.dispatch({ isQuickRestart: !e.shiftKey });
  } else {
    void navigate({ to: "/" });
  }
}

// The order of the hotkeys in the array passed to `createHotkeys` is important. If
// the order was reversed, then the secondary hotkey will override the primary hotkey
// when the test isn't long, which would cause the quick restart hotkey to be disabled.

createHotkeys(() => [
  // Secondary hotkey used in long tests.

  // We want to have a hotkey for quick restart key without shift, so when the
  // test is considered long (which means that we can't quick restart) and the user
  // tries to press the quick restart key without shift, we'll show a notification, and
  // when the user presses the quick restart key with shift, we'll restart.
  {
    hotkey: quickRestartHotkeyMap[getConfig.quickRestart],
    callback: quickRestart,
    options: {
      enabled:
        isLongTest() &&
        !(wordsHaveTab() && getConfig.quickRestart === "tab") &&
        !(wordsHaveNewline() && getConfig.quickRestart === "enter"),
    },
  },

  // Primary hotkey for quick restart.
  {
    hotkey: hotkeys.quickRestart,
    callback: quickRestart,
    options: {
      enabled:
        // Disable quick restart when we're in a long test and quick restart key is enter, because `shift + enter, shift +
        // enter` is already reserved for bail out keybind.
        !isLongTest() || getConfig.quickRestart !== "enter",
    },
  },
]);

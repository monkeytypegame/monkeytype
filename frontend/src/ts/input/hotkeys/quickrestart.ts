import { createRoot } from "solid-js";
import { isAnyPopupVisible } from "../../utils/misc";

import { navigate } from "../../router/navigate";
import { restartTest } from "../../test/test-logic";
import { getRoutePage } from "../../states/router";
import { hotkeys, quickRestartHotkeyMap } from "../../states/hotkeys";
import { createHotkey } from "./utils";
import { getConfig } from "../../config/store";
import { isLongTest, wordsHaveNewline, wordsHaveTab } from "../../states/test";

function quickRestart(e: KeyboardEvent): void {
  if (isAnyPopupVisible()) {
    return;
  }

  e.preventDefault();

  if (getRoutePage() === "test") {
    void restartTest({ isQuickRestart: !e.shiftKey });
  } else {
    void navigate({ to: "/" });
  }
}

// Disable restartTest when we're in long test and quick restartTest key is enter, because `shift + enter, shift +
// enter` is already reserved for bail out keybind.
createRoot(() =>
  createHotkey(
    () => hotkeys.quickRestart,
    quickRestart,
    () => ({ enabled: !isLongTest() || getConfig.quickRestart !== "enter" }),
  ),
);

// We also want to have a hotkey for quick restartTest key without shift, so when the
// test is considered long (which means that we can't quick restart), we show a
// notification when the user tries to press the quick restartTest key without shift,
// and we'll restartTest when it's pressed with shift.
createRoot(() =>
  createHotkey(
    () => quickRestartHotkeyMap[getConfig.quickRestart],
    quickRestart,
    () => ({
      enabled:
        isLongTest() &&
        !(wordsHaveTab() && getConfig.quickRestart === "tab") &&
        !(wordsHaveNewline() && getConfig.quickRestart === "enter"),
    }),
  ),
);

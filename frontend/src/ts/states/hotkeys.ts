import { QuickRestart } from "@monkeytype/schemas/configs";
import { Hotkey } from "@tanstack/solid-hotkeys";
import { createEffect, createSignal } from "solid-js";
import { createStore } from "solid-js/store";
import { getConfig } from "../config/store";
import { wordsHaveNewline, wordsHaveTab } from "./test";
import { getActivePage } from "./core";
import { NoKey } from "../input/hotkeys/utils";
import { canQuickRestart as isShortTest } from "../utils/quick-restart";
import { getData as getCustomTextData } from "../test/custom-text";
import { isCustomTextLong } from "../legacy-states/custom-text-name";

export const quickRestartHotkeyMap: Record<QuickRestart, Hotkey> = {
  off: NoKey,
  esc: "Escape",
  tab: "Tab",
  enter: "Enter",
};

type Hotkeys = {
  quickRestart: Hotkey;
  commandline: Hotkey;
};

export const [hotkeys, setHotkeys] = createStore<Hotkeys>(updateHotkeys());
export const [canQuickRestart, setCanQuickRestart] = createSignal(false);

createEffect(() => {
  getActivePage(); // depend on active page
  setCanQuickRestart(
    isShortTest(
      getConfig.mode,
      getConfig.words,
      getConfig.time,
      getCustomTextData(),
      isCustomTextLong() ?? false,
    ),
  );
});

createEffect(() => {
  getActivePage(); // depend on active page
  setHotkeys(updateHotkeys());
});

function updateHotkeys(): Hotkeys {
  const isOnTestPage = getActivePage() === "test";
  return {
    quickRestart: shiftHotkey(
      quickRestartHotkeyMap[getConfig.quickRestart],
      isOnTestPage && (wordsHaveTab() || !canQuickRestart()),
    ),
    commandline: shiftHotkey(
      getConfig.quickRestart === "esc" ? "Tab" : "Escape",
      isOnTestPage && (wordsHaveNewline() || !canQuickRestart()),
    ),
  };
}

function shiftHotkey(hotkey: Hotkey, shift: boolean): Hotkey {
  if (shift) {
    if (hotkey === "Tab") return "Shift+Tab";
    if (hotkey === "Enter") return "Shift+Enter";
  }
  return hotkey;
}

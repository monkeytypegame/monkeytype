import { QuickRestart } from "@monkeytype/schemas/configs";
import { Hotkey } from "@tanstack/solid-hotkeys";
import { createEffect } from "solid-js";
import { createStore } from "solid-js/store";
import { getConfig } from "../config/store";
import { wordsHaveNewline, wordsHaveTab, isLongTest } from "./test";
import { getActivePage } from "./core";
import { NoKey } from "../input/hotkeys/utils";

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

createEffect(() => {
  getActivePage(); // depend on active page
  setHotkeys(updateHotkeys());
});

function updateHotkeys(): Hotkeys {
  const isOnTestPage = getActivePage() === "test";
  return {
    quickRestart: shiftHotkey(
      quickRestartHotkeyMap[getConfig.quickRestart],
      isOnTestPage && (wordsHaveTab() || isLongTest()),
    ),
    commandline: shiftHotkey(
      getConfig.quickRestart === "esc" ? "Tab" : "Escape",
      isOnTestPage && (wordsHaveNewline() || isLongTest()),
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

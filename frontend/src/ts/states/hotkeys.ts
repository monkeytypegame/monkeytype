import { Config, QuickRestart } from "@monkeytype/schemas/configs";
import { Hotkey } from "@tanstack/solid-hotkeys";
import { createEffect } from "solid-js";
import { createStore } from "solid-js/store";
import { getConfig } from "../config/store";
import { wordsHasNewline, wordsHasTab } from "./test";
import { getActivePage } from "./core";

const hotkeyMapping: Record<QuickRestart, Hotkey> = {
  off: "Meta+Mod+Alt+Shift+F22" as Hotkey, //Dummy
  esc: "Escape",
  tab: "Tab",
  enter: "Enter",
};

type Hotkeys = {
  quickRestart: Hotkey;
  commandline: Hotkey;
};

export const [hotkeys, setHotkeys] = createStore<Hotkeys>(
  calcHotkeys(getConfig, { shiftTab: false, shiftEnter: false }),
);

createEffect(() => {
  const isOnTestPage = getActivePage() === "test";
  setHotkeys(
    calcHotkeys(getConfig, {
      shiftTab: isOnTestPage && wordsHasTab(),
      shiftEnter: isOnTestPage && wordsHasNewline(),
    }),
  );
});

function calcHotkeys(
  config: Config,
  options: { shiftTab: boolean; shiftEnter: boolean },
): Hotkeys {
  return {
    quickRestart: shiftedHotkey(hotkeyMapping[config.quickRestart], options),
    commandline: shiftedHotkey(
      getConfig.quickRestart === "esc" ? "Tab" : "Escape",
      options,
    ),
  };
}

function shiftedHotkey(
  hotkey: Hotkey,
  options: { shiftTab: boolean; shiftEnter: boolean },
): Hotkey {
  if (hotkey === "Tab" && options.shiftTab) return "Shift+Tab";
  if (hotkey === "Enter" && options.shiftEnter) return "Shift+Enter";
  return hotkey;
}

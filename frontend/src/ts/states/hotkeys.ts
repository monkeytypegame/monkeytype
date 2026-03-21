import { Hotkey } from "@tanstack/solid-hotkeys";
import { createStore } from "solid-js/store";
import { getConfig } from "../config/store";
import { Config, QuickRestart } from "@monkeytype/schemas/configs";
import { createEffect } from "solid-js";
import { shiftedHotkey } from "../input/hotkeys/utils";
import { wordsHasNewline, wordsHasTab } from "./test";

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
  setHotkeys(
    calcHotkeys(getConfig, {
      shiftTab: wordsHasTab(),
      shiftEnter: wordsHasNewline(),
    }),
  );
});

function calcHotkeys(
  config: Config,
  options: { shiftTab: boolean; shiftEnter: boolean },
): Hotkeys {
  const quickRestart = hotkeyMapping[config.quickRestart];
  const commandline = getConfig.quickRestart === "esc" ? "Tab" : "Escape";
  return {
    quickRestart: shiftedHotkey(quickRestart, options),
    commandline: shiftedHotkey(commandline, options),
  };
}

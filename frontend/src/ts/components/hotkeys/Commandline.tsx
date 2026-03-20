import { QuickRestart } from "@monkeytype/schemas/configs";
import { createHotkey, CreateHotkeyOptions } from "@tanstack/solid-hotkeys";
import { Show } from "solid-js";

import * as CommandlinePopup from "../../commandline/commandline";
import { getConfig } from "../../config/store";
import { isAnyPopupVisible, isFirefox } from "../../utils/misc";
import { Conditional } from "../common/Conditional";
import { Kbd } from "./Kbd";

const handleEvent = (e: KeyboardEvent) => {
  const popupVisible = isAnyPopupVisible();
  if (!popupVisible) {
    CommandlinePopup.show();
  }
};

const ifNotQuickRestart = (key: QuickRestart) => (): CreateHotkeyOptions => ({
  enabled: getConfig.quickRestart !== key,
  ignoreInputs: false,
  requireReset: true,
});

createHotkey("Escape", handleEvent, ifNotQuickRestart("esc"));
createHotkey("Tab", handleEvent, ifNotQuickRestart("tab"));
createHotkey("Mod+Shift+P", handleEvent, {
  ignoreInputs: false,
  requireReset: true,
});

export function Commandline() {
  return (
    <>
      <Conditional
        if={getConfig.quickRestart === "esc"}
        then={<Kbd hotkey="Tab" />}
        else={<Kbd hotkey="Escape" />}
      />
      <Show when={!isFirefox()}>
        &nbsp;or&nbsp;
        <Kbd hotkey="Mod+Shift+P" />
      </Show>
    </>
  );
}

import { QuickRestart as QuickRestartType } from "@monkeytype/schemas/configs";
import { Hotkey } from "@tanstack/solid-hotkeys";
import { JSXElement, Show } from "solid-js";

import { getConfig } from "../../config/store";
import { Kbd } from "./Kbd";

const quickRestartHotkeys: Record<QuickRestartType, Hotkey | undefined> = {
  off: undefined,
  enter: "Enter",
  esc: "Escape",
  tab: "Tab",
};

export function QuickRestartHotkey(): JSXElement {
  return (
    <Show
      when={quickRestartHotkeys[getConfig.quickRestart] !== undefined}
      fallback=<kbd>tab {">"} enter</kbd>
    >
      <Kbd hotkey={quickRestartHotkeys[getConfig.quickRestart] as Hotkey} />
    </Show>
  );
}

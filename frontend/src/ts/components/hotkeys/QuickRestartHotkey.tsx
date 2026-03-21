import { JSXElement, Show } from "solid-js";

import { getConfig } from "../../config/store";
import { hotkeys } from "../../states/hotkeys";
import { Kbd } from "./Kbd";

export function QuickRestartHotkey(): JSXElement {
  return (
    <Show
      when={getConfig.quickRestart !== "off"}
      fallback=<kbd>tab {">"} enter</kbd>
    >
      <Kbd hotkey={hotkeys.quickRestart} />
    </Show>
  );
}

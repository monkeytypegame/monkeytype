import { Hotkey } from "@tanstack/solid-hotkeys";
import { JSXElement } from "solid-js";

import { hotkeys } from "../../states/hotkeys";
import { Conditional } from "../common/Conditional";
import { Kbd } from "./Kbd";

export function QuickRestartHotkey(): JSXElement {
  return (
    <Conditional
      if={hotkeys.quickRestart === ("" as Hotkey)}
      then={<kbd>tab {">"} enter</kbd>}
      else={<Kbd hotkey={hotkeys.quickRestart} />}
    />
  );
}

import { JSXElement } from "solid-js";

import { NoKey } from "../../input/hotkeys/utils";
import { hotkeys } from "../../states/hotkeys";
import { Conditional } from "../common/Conditional";
import { Kbd } from "./Kbd";

export function QuickRestartHotkey(): JSXElement {
  return (
    <Conditional
      if={hotkeys.quickRestart === NoKey}
      then={<kbd>tab {">"} enter</kbd>}
      else={<Kbd hotkey={hotkeys.quickRestart} />}
    />
  );
}

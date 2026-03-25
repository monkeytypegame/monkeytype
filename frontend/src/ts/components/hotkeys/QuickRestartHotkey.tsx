import { JSXElement } from "solid-js";

import { NoKey } from "../../input/hotkeys/utils";
import { hotkeys } from "../../states/hotkeys";
import { Kbd } from "../common/Kbd";

export function QuickRestartHotkey(): JSXElement {
  const props =
    hotkeys.quickRestart !== NoKey
      ? { hotkey: hotkeys.quickRestart }
      : { text: "tab > enter" };

  return <Kbd {...props} />;
}
